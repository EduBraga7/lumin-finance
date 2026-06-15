"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Receipt, LogOut, BarChart2, Sun, Moon, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('lumin_theme');
    if (saved === 'light') {
      setTheme('light');
      document.body.classList.add('light-mode');
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
    <aside className="sidebar">
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Lumin Finance</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </Link>
        <Link href="/transactions" className={`nav-link ${pathname === '/transactions' ? 'active' : ''}`}>
          <Receipt size={20} />
          Lançamentos (Pagos)
        </Link>
        <Link href="/bills" className={`nav-link ${pathname === '/bills' ? 'active' : ''}`}>
          <Calendar size={20} />
          Contas a Pagar
        </Link>
        <Link href="/reports" className={`nav-link ${pathname === '/reports' ? 'active' : ''}`}>
          <BarChart2 size={20} />
          Relatórios Anuais
        </Link>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', wordBreak: 'break-all' }}>
          Logado como:<br/><b>@{user?.username}</b>
        </div>
        <button onClick={toggleTheme} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          Modo {theme === 'dark' ? 'Claro' : 'Escuro'}
        </button>
        <button onClick={signOut} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-expense)' }}>
          <LogOut size={20} />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
