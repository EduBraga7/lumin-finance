import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

// GET /api/transactions/yearly
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  const startDate = `${targetYear}-01-01T00:00:00.000Z`;
  const endDate = `${targetYear}-12-31T23:59:59.999Z`;

  interface YearlyTxRow {
    amount: number | string;
    type: string;
    date: string;
    is_paid?: boolean;
  }

  const { data, error } = await supabaseServer
    .from('transactions')
    .select('amount, type, date, is_paid')
    .eq('user_id', user.id)
    .neq('is_paid', false)
    .neq('type', 'reminder')
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const monthsMap = [
    { name: 'Jan', income: 0, expense: 0 },
    { name: 'Fev', income: 0, expense: 0 },
    { name: 'Mar', income: 0, expense: 0 },
    { name: 'Abr', income: 0, expense: 0 },
    { name: 'Mai', income: 0, expense: 0 },
    { name: 'Jun', income: 0, expense: 0 },
    { name: 'Jul', income: 0, expense: 0 },
    { name: 'Ago', income: 0, expense: 0 },
    { name: 'Set', income: 0, expense: 0 },
    { name: 'Out', income: 0, expense: 0 },
    { name: 'Nov', income: 0, expense: 0 },
    { name: 'Dez', income: 0, expense: 0 },
  ];

  ((data || []) as YearlyTxRow[]).forEach((t) => {
    const monthIndex = parseInt(t.date.split('-')[1], 10) - 1;
    const amount = parseFloat(String(t.amount));

    if (t.type === 'income') {
      monthsMap[monthIndex].income += amount;
    } else {
      monthsMap[monthIndex].expense += amount;
    }
  });

  return NextResponse.json(monthsMap);
}
