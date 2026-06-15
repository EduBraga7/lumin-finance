"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutDashboard, ArrowRightLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <aside className="sidebar">
      <Link href="/" className="sidebar-logo">
        <div className="logo-icon">
          <Wallet size={20} color="#fff" />
        </div>
        Lumin
      </Link>

      <nav className="nav-menu">
        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Resumo
        </Link>
        <Link href="/transactions" className={`nav-link ${pathname === '/transactions' ? 'active' : ''}`}>
          <ArrowRightLeft size={20} />
          Lançamentos
        </Link>
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', wordBreak: 'break-all' }}>
          Logado como:<br/><b>@{user?.username}</b>
        </div>
        <button onClick={signOut} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-expense)' }}>
          <LogOut size={20} />
          Sair da conta
        </button>
      </div>
    </aside>
  );
}
