"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { YearlyMonthData, AnnualSummary, MonthHighlight, ExpenseHighlight } from '@/types/finance';
import dynamic from 'next/dynamic';
import { DEMO_YEARLY_DATA } from '@/utils/demoData';

const AnnualKpiCards = dynamic(() => import('@/components/reports/AnnualKpiCards'), {
  loading: () => <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Carregando KPIs...</div>
});
const AnnualCashFlowChart = dynamic(() => import('@/components/reports/AnnualCashFlowChart'), {
  loading: () => <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Carregando gráficos...</div>
});
const AnnualSummaryTable = dynamic(() => import('@/components/reports/AnnualSummaryTable'), {
  loading: () => <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Carregando tabela...</div>
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const MIN_YEAR = 2026;

export default function ReportsPage() {
  const [data, setData] = useState<YearlyMonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const { user, isDemoMode } = useAuth();

  const fetchYearlyData = useCallback(async () => {
    if (!user) return;

    if (isDemoMode) {
      if (year === 2026) {
        setData(DEMO_YEARLY_DATA);
      } else {
        setData([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/transactions/yearly?year=${year}`, {
        credentials: 'include',
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Error fetching yearly data:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, year]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchYearlyData();
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [fetchYearlyData]);

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

  const isMinYear = year <= MIN_YEAR;

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
        
        {/* Seletor de Ano */}
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
          <AnnualKpiCards summary={summary} />
          <AnnualCashFlowChart data={data} year={year} />
          <AnnualSummaryTable data={data} summary={summary} year={year} />
        </>
      )}
    </div>
  );
}
