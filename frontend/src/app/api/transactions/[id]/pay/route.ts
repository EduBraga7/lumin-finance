import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

// PUT /api/transactions/:id/pay
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabaseServer
    .from('transactions')
    .update({ is_paid: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });

  return NextResponse.json(data[0]);
}
