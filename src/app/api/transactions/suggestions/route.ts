import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

// GET /api/transactions/suggestions
// Retorna os últimos lançamentos distintos do usuário para sugestão/autocompletar
export async function GET(req: NextRequest) {
  const user = verifyAuth(req);
  if (!user) {
    return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseServer
      .from('transactions')
      .select('title, category, type, amount')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json([]);
    }

    // Deduplica por título preservando a versão mais recente
    const seen = new Set<string>();
    const suggestions: Array<{
      title: string;
      category: string;
      type: 'income' | 'expense';
      amount: number;
    }> = [];

    for (const item of data || []) {
      const normalizedTitle = item.title?.trim();
      if (!normalizedTitle) continue;
      const key = normalizedTitle.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        suggestions.push({
          title: normalizedTitle,
          category: item.category || 'Geral',
          type: item.type === 'income' ? 'income' : 'expense',
          amount: Number(item.amount) || 0,
        });
      }
    }

    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json([]);
  }
}
