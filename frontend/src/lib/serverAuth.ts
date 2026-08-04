import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);

export const JWT_SECRET = process.env.JWT_SECRET || 'lumin-finance-secret-key-123';

export interface DecodedUser {
  id: string;
  username: string;
}

export function verifyAuth(req: NextRequest): DecodedUser | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
    return decoded;
  } catch (err) {
    return null;
  }
}
