import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseServer, JWT_SECRET } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    // 1. Buscar usuário no banco
    const { data: user, error } = await supabaseServer
      .from('custom_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }

    // 2. Validar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // 3. Gerar JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ user: { id: user.id, username: user.username }, token });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro no servidor: ' + (err.message || err) }, { status: 500 });
  }
}
