"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, BarChart2, User, LogOut, Sun, Moon, X, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('lumin_theme');
    if (saved === 'light') {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.body.classList.add('light-mode');
      localStorage.setItem('lumin_theme', 'light');
    } else {
      setTheme('dark');
      document.body.classList.remove('light-mode');
      localStorage.setItem('lumin_theme', 'dark');
    }
  };

  return (
    <>
      <nav className="bottom-nav">
        <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={24} />
          <span>Início</span>
        </Link>
        
        <Link href="/transactions" className={`bottom-nav-item ${pathname === '/transactions' ? 'active' : ''}`}>
          <Receipt size={24} />
          <span>Extrato</span>
        </Link>
        
        <Link href="/bills" className={`bottom-nav-item ${pathname === '/bills' ? 'active' : ''}`}>
          <Calendar size={24} />
          <span>Agenda</span>
        </Link>
        
        <Link href="/reports" className={`bottom-nav-item ${pathname === '/reports' ? 'active' : ''}`}>
          <BarChart2 size={24} />
          <span>Relatórios</span>
        </Link>
        
        <div 
          className={`bottom-nav-item ${isProfileOpen ? 'active' : ''}`} 
          onClick={() => setIsProfileOpen(true)}
        >
          <User size={24} />
          <span>Perfil</span>
        </div>
      </nav>

      {/* Perfil Bottom Sheet Modal */}
      {isProfileOpen && (
        <div className="bottom-sheet-overlay mobile-only" onClick={(e) => { if(e.target === e.currentTarget) setIsProfileOpen(false); }}>
          <div className="bottom-sheet-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Meu Perfil</h2>
              <button onClick={() => setIsProfileOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Logado como:</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>@{user?.username || 'usuario'}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem' }}>
                {theme === 'dark' ? <Sun size={20} className="text-accent" /> : <Moon size={20} className="text-accent" />}
                Mudar para Modo {theme === 'dark' ? 'Claro' : 'Escuro'}
              </button>
              
              <button onClick={() => { setIsProfileOpen(false); signOut(); }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: 'var(--color-expense)', fontSize: '1rem', fontWeight: 500 }}>
                <LogOut size={20} />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
