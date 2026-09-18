import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'lumin_csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Generate a random CSRF token
export function generateCsrfToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Set CSRF token in cookie
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

// Get CSRF token from cookie
export async function getCsrfCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value;
}

// Validate CSRF token from request
export async function validateCsrfToken(token: string | null): Promise<boolean> {
  const cookieToken = await getCsrfCookie();
  if (!cookieToken || !token) {
    return false;
  }
  return token === cookieToken;
}

// Get CSRF token from request headers
export function getCsrfTokenFromRequest(req: Request): string | null {
  return req.headers.get(CSRF_HEADER_NAME);
}

// Middleware to validate CSRF for state-changing requests
export async function csrfProtection(req: Request): Promise<boolean> {
  const method = req.method.toUpperCase();
  
  // Only validate for state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const token = getCsrfTokenFromRequest(req);
  return await validateCsrfToken(token);
}