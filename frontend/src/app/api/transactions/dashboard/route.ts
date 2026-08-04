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

// GET /api/transactions/dashboard
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  let query = supabaseServer
    .from('transactions')
    .select('*')
    .eq('user_id', user.id);

  query = applyDateFilter(query, month, year);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let totalIncome = 0;
  let totalExpense = 0;
  const expensesByCategory: Record<string, number> = {};

  data.forEach((t: any) => {
    const amount = parseFloat(t.amount);
    if (t.type === 'income') {
      totalIncome += amount;
    } else if (t.type === 'expense') {
      totalExpense += amount;
      if (!expensesByCategory[t.category]) {
        expensesByCategory[t.category] = 0;
      }
      expensesByCategory[t.category] += amount;
    }
  });

  const pendingTransactions = data
    .filter((t: any) => (t.type === 'expense' || t.type === 'reminder') && t.is_paid === false)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    expensesByCategory,
    pendingTransactions
  });
}
