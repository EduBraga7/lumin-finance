import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'lumin-finance-secret-key-123';
}

export interface DecodedUser {
  id: string;
  username: string;
}

export function verifyAuth(req: NextRequest): DecodedUser | null {
  let token: string | undefined;

  // 1. Tentar ler do Authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    token = authHeader.replace('Bearer ', '');
  }

  // 2. Tentar ler do cookie HttpOnly
  if (!token) {
    token = req.cookies.get('lumin_token')?.value;
  }

  if (!token) return null;

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as DecodedUser;
    return decoded;
  } catch (err) {
    return null;
  }
}
