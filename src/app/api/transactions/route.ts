import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { csrfProtection } from '@/lib/csrf';

interface DateFilterable {
  gte(column: string, value: string): this;
  lte(column: string, value: string): this;
}

const applyDateFilter = <T extends DateFilterable>(query: T, month: string | null, year: string | null): T => {
  if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01T00:00:00.000Z`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
    return query.gte('date', startDate).lte('date', endDate);
  }
  return query;
};

// GET /api/transactions
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = rateLimit(identifier, 200, 60000); // 200 requests per minute
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '200',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        }
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');
  const status = searchParams.get('status');

  let query = supabaseServer
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (status === 'pending') {
    query = query.eq('is_paid', false);
  } else if (status === 'paid') {
    query = query.neq('is_paid', false).neq('type', 'reminder');
  }

  query = applyDateFilter(query, month, year);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json(data, {
    headers: {
      'X-RateLimit-Limit': '200',
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
    }
  });
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  // CSRF protection
  if (!csrfProtection(req)) {
    return NextResponse.json({ error: 'Token CSRF inválido ou não fornecido' }, { status: 403 });
  }

  // Rate limiting (stricter for POST requests)
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = rateLimit(identifier, 50, 60000); // 50 requests per minute for POST
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em alguns instantes.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
        }
      }
    );
  }

  try {
    const { title, amount, type, category, date, repeat_months, is_paid } = await req.json();

    if (!title || amount === undefined || !type || !category) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }

    // Extrai ano, mês e dia da data recebida para evitar qualquer shift de fuso horário
    let baseDateStr = typeof date === 'string' && date.trim() ? date.split('T')[0] : '';
    if (!baseDateStr) {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      baseDateStr = `${y}-${m}-${d}`;
    }

    const [baseYear, baseMonth, baseDay] = baseDateStr.split('-').map(Number);

    const monthsToRepeat = parseInt(repeat_months) || 1;
    const maxMonths = Math.min(monthsToRepeat, 24);

    const insertPayloads = [];

    for (let i = 0; i < maxMonths; i++) {
      const targetYear = baseYear + Math.floor((baseMonth - 1 + i) / 12);
      const targetMonth = ((baseMonth - 1 + i) % 12) + 1;
      const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
      const targetDay = Math.min(baseDay, lastDayOfMonth);

      // Salvamos sempre ao meio-dia UTC (12:00:00Z). No Brasil (UTC-3), isso equivale a 09:00:00 do mesmo dia,
      // eliminando completamente o risco de cair no dia anterior (21:00) ao converter timestamptz.
      const formattedDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T12:00:00.000Z`;

      insertPayloads.push({
        title,
        amount,
        type,
        category,
        date: formattedDate,
        user_id: user.id,
        is_paid: is_paid !== undefined ? is_paid : true
      });
    }

    const { data, error } = await supabaseServer
      .from('transactions')
      .insert(insertPayloads)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar requisição';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
