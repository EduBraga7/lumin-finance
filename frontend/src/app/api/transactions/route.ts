import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

const applyDateFilter = (query: any, month: string | null, year: string | null) => {
  if (month && year) {
    const m = parseInt(month);
    const y = parseInt(year);
    const startDate = new Date(y, m - 1, 1).toISOString();
    const endDate = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
    return query.gte('date', startDate).lte('date', endDate);
  }
  return query;
};

// GET /api/transactions
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

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
  return NextResponse.json(data);
}

// POST /api/transactions
export async function POST(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  try {
    const { title, amount, type, category, date, repeat_months, is_paid } = await req.json();

    if (!title || amount === undefined || !type || !category) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }

    const baseDateStr = date || new Date().toISOString().split('T')[0];
    const baseDate = new Date(`${baseDateStr}T12:00:00Z`);

    const monthsToRepeat = parseInt(repeat_months) || 1;
    const maxMonths = Math.min(monthsToRepeat, 24);

    const insertPayloads = [];

    for (let i = 0; i < maxMonths; i++) {
      const targetDate = new Date(baseDate);
      targetDate.setUTCMonth(targetDate.getUTCMonth() + i);

      insertPayloads.push({
        title,
        amount,
        type,
        category,
        date: targetDate.toISOString().split('T')[0],
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao processar requisição' }, { status: 500 });
  }
}
