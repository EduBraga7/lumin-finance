"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  username: string;
}

interface Session {
  access_token: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (user: User, token: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Remover resquícios antigos do localStorage por segurança
    localStorage.removeItem('lumin_token');

    const savedUser = localStorage.getItem('lumin_user');
    const savedToken = sessionStorage.getItem('lumin_token_session'); // mantido apenas em memória de sessão temporária se necessário
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        if (savedToken) {
          setSession({ access_token: savedToken });
        } else {
          setSession({ access_token: 'cookie_session' });
        }
      } catch (e) {
        console.error('Erro ao restaurar usuário:', e);
      }
    }
    setLoading(false);
  }, []);

  // Proteger rotas
  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const signIn = (user: User, token: string) => {
    localStorage.setItem('lumin_user', JSON.stringify(user));
    sessionStorage.setItem('lumin_token_session', token);
    setSession({ access_token: token });
    setUser(user);
    router.push('/');
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Erro ao encerrar sessão no servidor:', e);
    }
    localStorage.removeItem('lumin_user');
    sessionStorage.removeItem('lumin_token_session');
    setSession(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
