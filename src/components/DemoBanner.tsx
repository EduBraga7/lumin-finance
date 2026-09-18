"use client";

import { useAuth } from '@/context/AuthContext';
import { FlaskConical, X } from 'lucide-react';

export default function DemoBanner() {
  const { isDemoMode, signOut } = useAuth();

  if (!isDemoMode) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      width: '100%',
      padding: '0.55rem 1rem',
      fontSize: '0.82rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.6rem',
      background: 'linear-gradient(90deg, rgba(139,92,246,0.95) 0%, rgba(99,102,241,0.95) 100%)',
      color: '#ffffff',
      boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
    }}>
      <FlaskConical size={15} />
      <span>
        <strong>Modo Demo</strong> — dados fictícios para demonstração. Alterações não são salvas.
      </span>
      <button
        onClick={signOut}
        title="Sair do modo demo"
        style={{
          marginLeft: '0.75rem',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '4px',
          color: '#fff',
          padding: '0.15rem 0.5rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <X size={12} /> Sair
      </button>
    </div>
  );
}
