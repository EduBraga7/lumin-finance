"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  LayoutDashboard, 
  X, 
  ExternalLink, 
  Calendar, 
  ChevronRight, 
  Tag, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';
import { 
  generateAiDiagnosisFromData, 
  AiDiagnosis 
} from '@/utils/aiAdvisor';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: Record<string, number>;
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f97316', // Laranja
  'Transporte': '#a855f7',  // Roxo
  'Moradia': '#3b82f6',     // Azul
  'Lazer': '#eab308',       // Amarelo
  'Saúde': '#ef4444',       // Vermelho
  'Educação': '#10b981',    // Verde
  'Geral': '#6b7280'        // Cinza
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Alimentação': '🍔',
  'Transporte': '🚗',
  'Moradia': '🏠',
  'Lazer': '🍿',
  'Saúde': '💊',
  'Educação': '📚',
  'Geral': '📦'
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Home() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { session } = useAuth();
  const { month, year } = useDateFilter();

  const [aiDiagnosis, setAiDiagnosis] = useState<AiDiagnosis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Mantém referência mutável atualizada sem disparar re-criação de callbacks
  const dashboardRef = useRef<DashboardData | null>(null);
  dashboardRef.current = dashboard;

  const fetchAiDiagnosis = useCallback(async (currentDash?: DashboardData | null, forceRefresh: boolean = false) => {
    const dashToUse = currentDash !== undefined ? currentDash : dashboardRef.current;
    if (!dashToUse) return;

    setLoadingAi(true);

    try {
      const refreshParam = forceRefresh ? '&refresh=true' : '';
      const res = await fetch(`${API_URL}/api/ai/advisor?month=${month}&year=${year}${refreshParam}`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setAiDiagnosis({
            status: data.status || 'good',
            statusText: data.statusText || data.status_text || 'Orçamento Equilibrado',
            summary: data.summary,
            insights: Array.isArray(data.insights) ? data.insights : [],
            aiAdviceText: data.advice,
            updatedAt: data.updated_at || new Date().toISOString(),
            cached: Boolean(data.cached)
          });
          return;
        } else if (data.advice) {
          const baseDiag = generateAiDiagnosisFromData(dashToUse, month, year);
          setAiDiagnosis({
            ...baseDiag,
            aiAdviceText: data.advice,
            updatedAt: data.updated_at || new Date().toISOString(),
            cached: Boolean(data.cached)
          });
          return;
        }
      }

      // Fallback local se a resposta não vier estruturada
      const baseDiag = generateAiDiagnosisFromData(dashToUse, month, year);
      setAiDiagnosis({
        ...baseDiag,
        updatedAt: new Date().toISOString(),
        cached: false
      });

      // Salva o diagnóstico gerado no Supabase para os próximos acessos
      if (session?.access_token) {
        fetch(`${API_URL}/api/ai/advisor`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` 
          },
          body: JSON.stringify({
            month,
            year,
            summary: baseDiag.summary,
            status: baseDiag.status,
            statusText: baseDiag.statusText,
            insights: baseDiag.insights,
            advice: baseDiag.aiAdviceText || baseDiag.summary
          })
        }).catch(syncErr => console.warn('Sync de diagnóstico em segundo plano falhou:', syncErr));
      }
    } catch (err) {
      console.warn('Fallback para diagnóstico estruturado:', err);
      const baseDiag = generateAiDiagnosisFromData(dashToUse, month, year);
      setAiDiagnosis({
        ...baseDiag,
        updatedAt: new Date().toISOString(),
        cached: false
      });
    } finally {
      setLoadingAi(false);
    }
  }, [session?.access_token, month, year]);

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const [resDash, resTxs] = await Promise.all([
        fetch(`${API_URL}/api/transactions/dashboard?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        }),
        fetch(`${API_URL}/api/transactions?month=${month}&year=${year}&status=paid`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
      ]);

      const dataDash = await resDash.json();
      const dataTxs = await resTxs.json();

      setDashboard(dataDash);
      setMonthTransactions(Array.isArray(dataTxs) ? dataTxs : []);
      fetchAiDiagnosis(dataDash);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, month, year, fetchAiDiagnosis]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatDateTimeDisplay = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${mon} às ${hours}:${mins}`;
    } catch {
      return '';
    }
  };

  const pieData = useMemo(() => {
    if (!dashboard || !dashboard.expensesByCategory) return [];
    return Object.keys(dashboard.expensesByCategory).map(key => ({
      name: key,
      value: dashboard.expensesByCategory[key]
    })).filter(entry => entry.value > 0);
  }, [dashboard]);

  // Ranking de categorias ordenado por maior gasto
  const categoryRanking = useMemo(() => {
    if (!dashboard || !dashboard.expensesByCategory) return [];
    const total = dashboard.totalExpense || 1;
    return Object.keys(dashboard.expensesByCategory)
      .map(name => {
        const amount = dashboard.expensesByCategory[name];
        const pct = total > 0 ? (amount / total) * 100 : 0;
        return { name, amount, pct };
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [dashboard]);

  // Lançamentos filtrados da categoria selecionada para o modal de drill-down
  const categoryDetails = useMemo(() => {
    if (!selectedCategory) return null;
    const items = monthTransactions.filter(t => t.category === selectedCategory && t.type === 'expense');
    const total = items.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const overallTotal = dashboard?.totalExpense || 1;
    const pct = overallTotal > 0 ? (total / overallTotal) * 100 : 0;
    return {
      name: selectedCategory,
      items,
      total,
      pct
    };
  }, [selectedCategory, monthTransactions, dashboard]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Carregando Dashboard...
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1>Resumo de {MONTH_NAMES[month - 1]}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Acompanhe sua saúde financeira no mês selecionado.
          </p>
        </div>
        <MonthSelector />
      </header>

      {dashboard && (
        <div className="dashboard-stats" style={{ marginBottom: '2.5rem' }}>
          <div className="glass-card stat-item">
            <div className="stat-label">Saldo Atual</div>
            <div className={`stat-value balance ${dashboard.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(dashboard.balance)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Receitas ({MONTH_NAMES[month - 1]})</div>
            <div className="stat-value income">
              {formatCurrency(dashboard.totalIncome)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Despesas ({MONTH_NAMES[month - 1]})</div>
            <div className="stat-value expense">
              {formatCurrency(dashboard.totalExpense)}
            </div>
          </div>
        </div>
      )}

      {/* Lumin AI Advisor - Diagnóstico e Recomendações */}
      <div className="ai-advisor-card">
        <div className="ai-advisor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="#c084fc" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Lumin AI Advisor
              </h2>
            </div>
            <span className="ai-sparkle-badge">Inteligência Financeira</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {aiDiagnosis?.updatedAt && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.55rem', borderRadius: '6px' }}>
                <Calendar size={12} style={{ opacity: 0.7 }} />
                <span>{aiDiagnosis.cached ? 'Salvo em' : 'Gerado em'} {formatDateTimeDisplay(aiDiagnosis.updatedAt)}</span>
              </span>
            )}

            {aiDiagnosis && (
              <span className={`ai-status-pill ${aiDiagnosis.status}`}>
                {aiDiagnosis.status === 'excellent' && <CheckCircle2 size={14} />}
                {aiDiagnosis.status === 'good' && <TrendingUp size={14} />}
                {aiDiagnosis.status === 'warning' && <AlertTriangle size={14} />}
                {aiDiagnosis.status === 'critical' && <AlertCircle size={14} />}
                {aiDiagnosis.statusText}
              </span>
            )}
            <button
              onClick={() => fetchAiDiagnosis(dashboard, true)}
              disabled={loadingAi}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Forçar nova análise inteligente com IA"
            >
              <RefreshCw size={14} className={loadingAi ? 'animate-spin' : ''} />
              <span>{loadingAi ? 'Analisando...' : 'Recalcular'}</span>
            </button>
          </div>
        </div>

        {loadingAi && !aiDiagnosis ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <Sparkles size={26} className="animate-spin text-accent" style={{ margin: '0 auto 0.6rem', display: 'block' }} />
            Analisando receitas, despesas e hábitos financeiros do mês...
          </div>
        ) : aiDiagnosis ? (
          <div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', margin: '0.25rem 0 1rem' }}>
              {aiDiagnosis.summary}
            </p>

            {aiDiagnosis.aiAdviceText && (
              <div style={{
                marginTop: '0.75rem',
                marginBottom: '1rem',
                padding: '1rem 1.25rem',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '10px',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#c084fc', marginBottom: '0.4rem' }}>
                  <Sparkles size={15} />
                  <span>Parecer do Mentor IA:</span>
                </div>
                <div style={{ whiteSpace: 'pre-line' }}>{aiDiagnosis.aiAdviceText}</div>
              </div>
            )}

            <div className="ai-insights-grid">
              {aiDiagnosis.insights.map((insight, idx) => (
                <div key={idx} className={`ai-insight-item ${insight.type}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                    {insight.type === 'positive' && <TrendingUp size={16} color="#10b981" />}
                    {insight.type === 'warning' && <AlertTriangle size={16} color="#f59e0b" />}
                    {insight.type === 'tip' && <Lightbulb size={16} color="#a855f7" />}
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {insight.title}
                    </strong>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {insight.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {pieData.length > 0 ? (
        <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title">
              <LayoutDashboard size={20} className="text-accent" />
              Gastos por Categoria em {MONTH_NAMES[month - 1]} de {year}
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Toque em uma categoria para ver os detalhes
            </span>
          </div>

          <div className="dashboard-breakdown-grid">
            {/* Lado Esquerdo: Gráfico de Rosca */}
            <div style={{ height: '320px', width: '100%', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Saídas
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {dashboard ? formatCurrency(dashboard.totalExpense) : ''}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={pieData} 
                    cx="50%" cy="50%" 
                    innerRadius={80} 
                    outerRadius={120} 
                    paddingAngle={6} 
                    dataKey="value"
                    stroke="none"
                    cornerRadius={6}
                    onClick={(entry: any) => {
                      if (entry && entry.name) setSelectedCategory(entry.name);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Geral']} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ background: 'rgba(18,18,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={false}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lado Direito: Ranking Interativo de Categorias com Barra de Progresso */}
            <div className="category-rank-list">
              {categoryRanking.map((item) => {
                const color = CATEGORY_COLORS[item.name] || '#6b7280';
                const emoji = CATEGORY_EMOJIS[item.name] || '🏷️';

                return (
                  <div 
                    key={item.name} 
                    className="category-rank-item"
                    onClick={() => setSelectedCategory(item.name)}
                    title={`Clique para ver o que gastou com ${item.name}`}
                  >
                    <div className="category-rank-header">
                      <div className="category-rank-title">
                        <span>{emoji}</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="category-rank-values">
                        <span className="category-rank-amount">{formatCurrency(item.amount)}</span>
                        <span className="category-rank-pct">({item.pct.toFixed(1)}%)</span>
                        <ChevronRight size={16} color="var(--text-secondary)" />
                      </div>
                    </div>

                    <div className="category-progress-track">
                      <div 
                        className="category-progress-fill" 
                        style={{ width: `${item.pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum gasto registrado em {MONTH_NAMES[month - 1]}.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Vá para a aba "Lançamentos" e adicione algumas despesas.</p>
        </div>
      )}

      {/* Modal de Detalhamento da Categoria (Drill-down) */}
      {selectedCategory && categoryDetails && (
        <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSelectedCategory(null); }}>
          <div className="app-modal-content">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{CATEGORY_EMOJIS[selectedCategory] || '🏷️'}</span>
                <div>
                  <h2 className="card-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}>
                    {selectedCategory}
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Detalhamento em {MONTH_NAMES[month - 1]} de {year}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCategory(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Resumo da Categoria */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total gasto na categoria</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-expense)' }}>
                  {formatCurrency(categoryDetails.total)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Impacto no mês</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {categoryDetails.pct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Lista dos Lançamentos da Categoria */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {categoryDetails.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Nenhum lançamento individual encontrado.
                </div>
              ) : (
                categoryDetails.items.map((t) => (
                  <div 
                    key={t.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 1rem', 
                      background: 'var(--bg-base)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '8px' 
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                        <Calendar size={12} />
                        {formatDateDisplay(t.date)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: 'var(--color-expense)' }}>
                      -{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Ações do Modal */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => setSelectedCategory(null)} 
                className="btn-secondary" 
                style={{ flex: 1 }}
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setSelectedCategory(null);
                  router.push(`/transactions?category=${encodeURIComponent(selectedCategory)}`);
                }} 
                className="btn-primary" 
                style={{ flex: 1.5, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                <span>Ver no Extrato</span>
                <ExternalLink size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
