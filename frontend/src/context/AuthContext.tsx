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
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: () => {},
  signOut: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Buscar nosso próprio token e usuário no navegador
    const token = localStorage.getItem('lumin_token');
    const savedUser = localStorage.getItem('lumin_user');
    
    if (token && savedUser) {
      setSession({ access_token: token });
      setUser(JSON.parse(savedUser));
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
    localStorage.setItem('lumin_token', token);
    localStorage.setItem('lumin_user', JSON.stringify(user));
    setSession({ access_token: token });
    setUser(user);
    router.push('/');
  };

  const signOut = () => {
    localStorage.removeItem('lumin_token');
    localStorage.removeItem('lumin_user');
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
