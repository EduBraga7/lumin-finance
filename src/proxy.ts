import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('lumin_token')?.value;
  const isDemo = request.cookies.get('lumin_demo')?.value === 'true';
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname === '/login';

  // Se não estiver logado (nem em modo demo) e tentar acessar página protegida, redireciona para login
  if (!token && !isDemo && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se já estiver logado (ou em demo) e tentar acessar a página de login, redireciona para a home
  if ((token || isDemo) && isAuthPage) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o proxy em todas as páginas exceto:
     * - api (rotas de API cuidam da própria validação de token/Bearer)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico, manifest.json, sw.js, arquivos com extensão (.png, .svg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
