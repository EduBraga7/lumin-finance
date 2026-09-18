"use client";

import { useState } from 'react';
import { Wallet, LogIn, UserPlus, Brain, BarChart3, WifiOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const FEATURES = [
  {
    icon: Brain,
    title: 'IA Financeira',
    desc: 'Diagnóstico com Google Gemini',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Anuais',
    desc: 'Visão executiva do seu ano',
  },
  {
    icon: WifiOff,
    title: 'Suporte Offline',
    desc: 'Funciona sem internet',
  },
  {
    icon: ShieldCheck,
    title: 'Seguro por Design',
    desc: 'Auth via cookie HttpOnly',
  },
];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn, enterDemoMode } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao autenticar');
      }

      signIn(data.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      background: 'var(--bg-base)',
    }}
    className="login-root"
    >
      {/* ── Painel esquerdo — marketing ── */}
      <div className="login-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3.5rem' }}>
          <div className="logo-icon" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }}>
            <Wallet size={20} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>Lumin Finance</span>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-1.5px',
            marginBottom: '1rem',
          }}>
            Controle financeiro{' '}
            <span style={{ color: 'var(--accent-primary)' }}>inteligente.</span>
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 380 }}>
            Tome decisões com clareza, não com chutes. Dashboard executivo com IA integrada.
          </p>
        </div>

        {/* Feature cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.75rem',
          maxWidth: 420,
        }}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              transition: 'border-color 0.2s',
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(16,185,129,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={18} color="var(--accent-primary)" />
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer rodapé esquerdo */}
        <p style={{
          marginTop: 'auto',
          paddingTop: '2rem',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          opacity: 0.7,
        }}>
          © 2026 Lumin Finance · Desenvolvido por{' '}
          <a
            href="https://bragaweb.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              fontWeight: 500,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          >
            Eduardo Braga
          </a>
        </p>
      </div>

      {/* ── Painel direito — formulário ── */}
      <div className="login-right">
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile: logo */}
          <div className="login-mobile-logo">
            <div className="logo-icon" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}>
              <Wallet size={22} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>Lumin Finance</span>
          </div>

          {/* Cabeçalho do form */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '0.4rem' }}>
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {isLogin
                ? 'Entre com suas credenciais para continuar.'
                : 'Preencha os dados abaixo para começar.'}
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nome de Usuário</label>
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Ex: eduardo_braga"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Senha</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="••••••••"
              />
            </div>

            {/* Mensagem de erro inline (substituiu o alert) */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                fontSize: '0.85rem',
                color: '#f87171',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem', height: 48, fontSize: '0.95rem', fontWeight: 600 }}
            >
              {loading
                ? 'Carregando...'
                : isLogin
                  ? <><LogIn size={17} /> Entrar</>
                  : <><UserPlus size={17} /> Criar Conta</>}
            </button>
          </form>

          {/* Troca de modo */}
          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}>
            {isLogin ? 'Ainda não tem uma conta? ' : 'Já possui uma conta? '}
            <button
              onClick={switchMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              {isLogin ? 'Criar agora' : 'Fazer login'}
            </button>
          </p>

          {/* Divisor + hint para recrutadores */}
          <div style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
          }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              É recrutador ou quer apenas testar?
            </p>
            <button
              type="button"
              onClick={enterDemoMode}
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                padding: '0.75rem',
                color: 'var(--accent-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
              }}
            >
              ✨ Entrar no Modo Demo (sem login)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
