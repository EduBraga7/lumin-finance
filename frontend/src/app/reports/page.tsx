"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Percent, 
  Award, 
  AlertTriangle, 
  BarChart3,
  Calendar,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const MIN_YEAR = 2026;

const FULL_MONTH_NAMES: Record<string, string> = {
  'Jan': 'Janeiro',
  'Fev': 'Fevereiro',
  'Mar': 'Março',
  'Abr': 'Abril',
  'Mai': 'Maio',
  'Jun': 'Junho',
  'Jul': 'Julho',
  'Ago': 'Agosto',
  'Set': 'Setembro',
  'Out': 'Outubro',
  'Nov': 'Novembro',
  'Dez': 'Dezembro'
};

interface YearlyData {
  name: string;
  income: number;
  expense: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const { session } = useAuth();

  const fetchYearlyData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/transactions/yearly?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Error fetching yearly data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [session, year]);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData]);

interface MonthHighlight {
  name: string;
  net: number;
}

interface ExpenseHighlight {
  name: string;
  expense: number;
}

interface AnnualSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  avgMonthlyExpense: number;
  avgMonthlyIncome: number;
  bestMonth: MonthHighlight | null;
  worstExpenseMonth: ExpenseHighlight | null;
  activeMonthsCount: number;
}

  // Cálculos consolidados do ano
  const summary: AnnualSummary = useMemo(() => {
    const totalIncome = data.reduce((acc, d) => acc + (Number(d.income) || 0), 0);
    const totalExpense = data.reduce((acc, d) => acc + (Number(d.expense) || 0), 0);
    const netBalance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100) : 0;

    // Meses que possuem alguma movimentação
    const activeMonths = data.filter(d => d.income > 0 || d.expense > 0);
    const monthsCount = activeMonths.length || 1;
    const avgMonthlyExpense = totalExpense / monthsCount;
    const avgMonthlyIncome = totalIncome / monthsCount;

    let best: MonthHighlight | null = null;
    let worst: ExpenseHighlight | null = null;

    for (const d of activeMonths) {
      const net = d.income - d.expense;
      if (!best || net > best.net) {
        best = { name: d.name, net };
      }
      if (!worst || d.expense > worst.expense) {
        worst = { name: d.name, expense: d.expense };
      }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance,
      savingsRate,
      avgMonthlyExpense,
      avgMonthlyIncome,
      bestMonth: best,
      worstExpenseMonth: worst,
      activeMonthsCount: activeMonths.length
    };
  }, [data]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const isMinYear = year <= MIN_YEAR;
  const bestMonth = summary.bestMonth;
  const worstExpenseMonth = summary.worstExpenseMonth;

  return (
    <div className="container">
      {/* Cabeçalho */}
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 className="text-accent" size={28} />
            Relatório Anual
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Visão consolidada e inteligência financeira de <strong>{year}</strong>
          </p>
        </div>
        
        {/* Seletor de Ano - Bloqueado em 2026 para trás */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface)', padding: '0.4rem 0.8rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <button 
            onClick={() => setYear(y => Math.max(MIN_YEAR, y - 1))} 
            disabled={isMinYear}
            className="btn-icon" 
            style={{ 
              background: 'transparent', 
              opacity: isMinYear ? 0.3 : 1, 
              cursor: isMinYear ? 'not-allowed' : 'pointer' 
            }}
            title={isMinYear ? "Ano mínimo atingido (2026)" : "Ano anterior"}
          >
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </button>

          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '70px', textAlign: 'center' }}>
            {year}
          </span>

          <button 
            onClick={() => setYear(y => y + 1)} 
            className="btn-icon" 
            style={{ background: 'transparent', cursor: 'pointer' }}
            title="Próximo ano"
          >
            <ChevronRight size={20} color="var(--text-secondary)" />
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Carregando inteligência anual...
        </div>
      ) : (
        <>
          {/* Executive KPI Cards */}
          <div className="kpi-grid">
            {/* Total Receitas */}
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Receitas no Ano</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-income)' }}>
                  <TrendingUp size={20} />
                </div>
              </div>
              <div className="kpi-value text-income">
                {formatCurrency(summary.totalIncome)}
              </div>
              <div className="kpi-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-income)' }}>
                {summary.activeMonthsCount} {summary.activeMonthsCount === 1 ? 'mês com movimentação' : 'meses com movimentação'}
              </div>
            </div>

            {/* Total Despesas */}
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Despesas no Ano</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-expense)' }}>
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="kpi-value text-expense">
                {formatCurrency(summary.totalExpense)}
              </div>
              <div className="kpi-badge" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-expense)' }}>
                Média de {formatCurrency(summary.avgMonthlyExpense)}/mês
              </div>
            </div>

            {/* Saldo Líquido */}
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Resultado Líquido</span>
                <div className="kpi-icon-wrap" style={{ background: summary.netBalance >= 0 ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: summary.netBalance >= 0 ? '#3b82f6' : 'var(--color-expense)' }}>
                  <PiggyBank size={20} />
                </div>
              </div>
              <div className={`kpi-value ${summary.netBalance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(summary.netBalance)}
              </div>
              <div className="kpi-badge" style={{ background: summary.netBalance >= 0 ? 'rgba(59, 130, 246, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: summary.netBalance >= 0 ? '#3b82f6' : 'var(--color-expense)' }}>
                {summary.netBalance >= 0 ? '🎉 Superávit Acumulado' : '⚠️ Déficit no Ano'}
              </div>
            </div>

            {/* Taxa de Poupança */}
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">Taxa de Poupança</span>
                <div className="kpi-icon-wrap" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
                  <Percent size={20} />
                </div>
              </div>
              <div className="kpi-value" style={{ color: summary.savingsRate >= 20 ? 'var(--color-income)' : (summary.savingsRate > 0 ? '#eab308' : 'var(--color-expense)') }}>
                {summary.savingsRate.toFixed(1)}%
              </div>
              <div className="kpi-badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                {summary.savingsRate >= 20 ? 'Meta saudável atingida' : (summary.savingsRate > 0 ? 'Capacidade de aporte positiva' : 'Sem retenção no período')}
              </div>
            </div>
          </div>

          {/* Destaques Analíticos do Ano */}
          {summary.activeMonthsCount > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {bestMonth && (
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-income)' }}>
                    <Award size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Mês Mais Lucrativo
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {FULL_MONTH_NAMES[bestMonth.name] || bestMonth.name}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-income)', marginLeft: '0.5rem' }}>
                        +{formatCurrency(bestMonth.net)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {worstExpenseMonth && (
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-expense)' }}>
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pico de Gastos no Ano
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {FULL_MONTH_NAMES[worstExpenseMonth.name] || worstExpenseMonth.name}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-expense)', marginLeft: '0.5rem' }}>
                        -{formatCurrency(worstExpenseMonth.expense)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gráfico de Barras: Evolução Anual */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <h2 className="card-title">
                <BarChart3 size={20} className="text-accent" />
                Comparativo Mensal de Fluxo de Caixa ({year})
              </h2>
            </div>
            
            <div style={{ width: '100%', height: '380px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    tickFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} 
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value))}
                    contentStyle={{ 
                      background: 'rgba(18,18,20,0.95)', 
                      border: '1px solid rgba(255,255,255,0.12)', 
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px' }} />
                  <Bar 
                    dataKey="income" 
                    name="Receitas" 
                    fill="var(--color-income)" 
                    radius={[4, 4, 0, 0]} 
                  />
                  <Bar 
                    dataKey="expense" 
                    name="Despesas" 
                    fill="var(--color-expense)" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Fechamento Mês a Mês */}
          <div className="glass-card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar size={20} className="text-accent" />
                Demonstrativo Consolidado Mês a Mês ({year})
              </h2>
            </div>

            <div className="annual-table-wrap">
              <table className="annual-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th style={{ textAlign: 'right' }}>Receitas</th>
                    <th style={{ textAlign: 'right' }}>Despesas</th>
                    <th style={{ textAlign: 'right' }}>Saldo Líquido</th>
                    <th style={{ textAlign: 'right' }}>Poupança</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => {
                    const rowNet = row.income - row.expense;
                    const rowRate = row.income > 0 ? ((rowNet / row.income) * 100) : 0;
                    const hasActivity = row.income > 0 || row.expense > 0;

                    return (
                      <tr key={row.name} style={{ opacity: hasActivity ? 1 : 0.45 }}>
                        <td style={{ fontWeight: 600 }}>
                          {FULL_MONTH_NAMES[row.name] || row.name}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-income)' }}>
                          {formatCurrency(row.income)}
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--color-expense)' }}>
                          {formatCurrency(row.expense)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: rowNet >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                          {rowNet > 0 ? '+' : ''}{formatCurrency(rowNet)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {hasActivity ? `${rowRate.toFixed(1)}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total Anual ({year})</td>
                    <td style={{ textAlign: 'right', color: 'var(--color-income)' }}>
                      {formatCurrency(summary.totalIncome)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--color-expense)' }}>
                      {formatCurrency(summary.totalExpense)}
                    </td>
                    <td style={{ textAlign: 'right', color: summary.netBalance >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                      {summary.netBalance > 0 ? '+' : ''}{formatCurrency(summary.netBalance)}
                    </td>
                    <td style={{ textAlign: 'right', color: summary.savingsRate >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                      {summary.savingsRate.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
