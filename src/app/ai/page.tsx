"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Sparkles,
  Bot,
  Sliders,
  FileText,
  Calendar,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import MonthSelector from '@/components/MonthSelector';
import { useDateFilter } from '@/context/DateFilterContext';
import { useDashboard } from '@/hooks/useDashboard';
import { MONTH_NAMES } from '@/constants/dates';
import { formatCurrency } from '@/utils/formatters';

const CfoChat = dynamic(() => import('@/components/ai/CfoChat'), {
  loading: () => (
    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Carregando Copiloto CFO...
    </div>
  ),
});

const ScenarioSimulator = dynamic(() => import('@/components/ai/ScenarioSimulator'), {
  loading: () => (
    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Carregando Simulador What-If...
    </div>
  ),
});

const AiAdvisorCard = dynamic(() => import('@/components/dashboard/AiAdvisorCard'), {
  loading: () => (
    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Carregando Diagnóstico Inteligente...
    </div>
  ),
});

type TabType = 'chat' | 'simulator' | 'diagnosis';

function AiHubContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as TabType) || 'chat';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['chat', 'simulator', 'diagnosis'].includes(initialTab) ? initialTab : 'chat'
  );

  const { month, year } = useDateFilter();
  const { dashboard, aiDiagnosis, loadingAi, refreshAi } = useDashboard(month, year);
  const monthName = MONTH_NAMES[month - 1];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Banner / Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(59, 130, 246, 0.25))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                boxShadow: '0 0 15px rgba(168, 85, 247, 0.25)',
              }}
            >
              <Sparkles size={20} color="#c084fc" />
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Lumin <span style={{ color: '#c084fc' }}>IA</span>
            </h1>
            <span
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#c084fc',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: 20,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Hub Executivo
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, maxWidth: '640px' }}>
            Sua central de inteligência financeira: Copiloto CFO interativo, simulador preditivo de cenários e diagnóstico estratégico de gastos.
          </p>
        </div>

        {/* Tab Controls */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            background: 'var(--bg-surface)',
            padding: '0.35rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => handleTabChange('chat')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'chat' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'chat' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Bot size={17} />
            <span>Copiloto CFO</span>
          </button>

          <button
            onClick={() => handleTabChange('simulator')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'simulator' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'simulator' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Sliders size={17} />
            <span>Simulador What-If</span>
          </button>

          <button
            onClick={() => handleTabChange('diagnosis')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'diagnosis' ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === 'diagnosis' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={17} />
            <span>Diagnóstico</span>
          </button>
        </div>
      </header>

      {/* Tab 1: Copiloto CFO */}
      {activeTab === 'chat' && (
        <section>
          <CfoChat />
        </section>
      )}

      {/* Tab 2: Simulador What-If */}
      {activeTab === 'simulator' && (
        <section>
          <ScenarioSimulator />
        </section>
      )}

      {/* Tab 3: Diagnóstico de Gastos */}
      {activeTab === 'diagnosis' && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Diagnóstico de {monthName} de {year}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Avaliação algorítmica de sustentabilidade, taxa de poupança e alertas de risco.
              </p>
            </div>
            <MonthSelector />
          </div>

          {/* Quick Metrics Cards */}
          {dashboard && (
            <div className="dashboard-stats">
              <div className="glass-card stat-item">
                <div className="stat-label">Saldo ({monthName})</div>
                <div className={`stat-value balance ${dashboard.balance >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(dashboard.balance)}
                </div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-label">Receitas</div>
                <div className="stat-value income">
                  {formatCurrency(dashboard.totalIncome)}
                </div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-label">Despesas</div>
                <div className="stat-value expense">
                  {formatCurrency(dashboard.totalExpense)}
                </div>
              </div>
            </div>
          )}

          {/* Lumin AI Advisor Card */}
          <AiAdvisorCard
            aiDiagnosis={aiDiagnosis}
            loadingAi={loadingAi}
            onRefresh={refreshAi}
          />

          {/* Cross-Link Action Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div
              className="glass-card"
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onClick={() => handleTabChange('chat')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <Bot size={20} className="text-accent" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tirar Dúvidas com o Copiloto</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Pergunte detalhes sobre este diagnóstico, como onde economizar ou como equilibrar seu orçamento.
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                Abrir Copiloto CFO <ArrowRight size={15} />
              </span>
            </div>

            <div
              className="glass-card"
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onClick={() => handleTabChange('simulator')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <Sliders size={20} color="#3b82f6" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Simular Cenário Futuro</h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Projete o impacto de um aumento salarial, nova despesa recorrente ou compra parcelada nos próximos 12 meses.
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.85rem',
                  color: '#3b82f6',
                  fontWeight: 600,
                }}
              >
                Abrir Simulador What-If <ArrowRight size={15} />
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function AiPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Carregando Lumin IA...
        </div>
      }
    >
      <AiHubContent />
    </Suspense>
  );
}
