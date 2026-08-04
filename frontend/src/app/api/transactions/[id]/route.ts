import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, verifyAuth } from '@/lib/serverAuth';

// PUT /api/transactions/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  const { id } = await params;
  try {
    const { title, amount, type, category, date, is_paid } = await req.json();

    const { data, error } = await supabaseServer
      .from('transactions')
      .update({ title, amount, type, category, date, is_paid })
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });

    return NextResponse.json(data[0]);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao atualizar' }, { status: 500 });
  }
}

// DELETE /api/transactions/:id
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyAuth(req);
  if (!user) return NextResponse.json({ error: 'Token inválido ou não fornecido' }, { status: 401 });

  const { id } = await params;

  const { data, error } = await supabaseServer
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });

  return NextResponse.json({ message: 'Transação deletada com sucesso.', deleted: data[0] });
}
