"use client";

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { useAuth } from '@/context/AuthContext';

export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loading } = useAuth();
  
  if (loading) {
    return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Carregando App...</div>;
  }
  
  if (pathname === '/login') {
    return <main>{children}</main>;
  }

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content-wrapper">
        {children}
      </main>
    </div>
  );
}
