"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DEMO_USER } from '@/utils/demoData';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  signIn: (user: User) => void;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isDemoMode: false,
  signIn: () => {},
  signOut: async () => {},
  enterDemoMode: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Verificar modo demo primeiro
    const demoFlag = localStorage.getItem('lumin_demo');
    if (demoFlag === 'true') {
      setTimeout(() => {
        setUser(DEMO_USER);
        setIsDemoMode(true);
        setLoading(false);
      }, 0);
      return;
    }

    // Restaura apenas os dados do utilizador (sem token — a autenticação fica no cookie HttpOnly)
    const savedUser = localStorage.getItem('lumin_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setTimeout(() => {
          setUser(parsed);
          setLoading(false);
        }, 0);
        return;
      } catch (e) {
        console.error('Erro ao restaurar usuário:', e);
        localStorage.removeItem('lumin_user');
      }
    }
    setTimeout(() => setLoading(false), 0);
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

  const signIn = (user: User) => {
    // Persiste apenas as informações de exibição; o JWT fica no cookie HttpOnly (gerenciado pelo servidor)
    localStorage.setItem('lumin_user', JSON.stringify(user));
    setUser(user);
    router.push('/');
  };

  const enterDemoMode = () => {
    // Cookie não-HttpOnly para que o proxy server-side possa detectar o modo demo
    document.cookie = 'lumin_demo=true; path=/; max-age=86400; SameSite=Lax';
    localStorage.setItem('lumin_demo', 'true');
    setUser(DEMO_USER);
    setIsDemoMode(true);
    router.push('/');
  };

  const signOut = async () => {
    if (isDemoMode) {
      // Sair do modo demo
      document.cookie = 'lumin_demo=; path=/; max-age=0';
      localStorage.removeItem('lumin_demo');
      setIsDemoMode(false);
      setUser(null);
      router.push('/login');
      return;
    }
    try {
      // O endpoint de logout apaga o cookie HttpOnly no servidor
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('Erro ao encerrar sessão no servidor:', e);
    }
    localStorage.removeItem('lumin_user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, signIn, signOut, enterDemoMode }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
