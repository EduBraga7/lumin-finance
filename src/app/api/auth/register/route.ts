import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseServer, getJwtSecret } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 });
    }

    const jwtSecret = getJwtSecret();

    // 1. Verificar se usuário já existe
    const { data: existingUser } = await supabaseServer
      .from('custom_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'Nome de usuário já está em uso.' }, { status: 400 });
    }

    // 2. Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Inserir no banco
    const { data, error } = await supabaseServer
      .from('custom_users')
      .insert([{ username, password: hashedPassword }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Erro ao criar usuário: ' + error.message }, { status: 500 });
    }

    // 4. Gerar JWT
    const token = jwt.sign({ id: data.id, username: data.username }, jwtSecret, { expiresIn: '7d' });

    // 5. Retornar dados com Cookie HttpOnly seguro
    const response = NextResponse.json({ user: { id: data.id, username: data.username }, token }, { status: 201 });
    response.cookies.set('lumin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Erro no servidor: ' + (err.message || err) }, { status: 500 });
  }
}
