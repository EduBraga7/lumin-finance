import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseServer, getJwtSecret } from '@/lib/serverAuth';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rateLimiter';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuário e senha são obrigatórios.' }, { status: 400 });
    }

    // Rate limiting for login attempts (stricter to prevent brute force)
    const identifier = getRateLimitIdentifier(req);
    const rateLimitResult = rateLimit(identifier, 5, 60000); // 5 login attempts per minute
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em alguns instantes.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }

    const jwtSecret = getJwtSecret();

    // 1. Buscar usuário no banco
    const { data: user, error } = await supabaseServer
      .from('custom_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
    }

    // 2. Validar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
    }

    // 3. Gerar JWT
    const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '7d' });

    // 4. Generate and set CSRF token
    const csrfToken = generateCsrfToken();
    setCsrfCookie(csrfToken);

    // 5. Retornar dados com Cookie HttpOnly seguro
    const response = NextResponse.json({ 
      user: { id: user.id, username: user.username }, 
      token,
      csrfToken 
    });
    response.cookies.set('lumin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Erro no servidor: ' + message }, { status: 500 });
  }
}
