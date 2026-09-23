"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';
import { MONTH_NAMES } from '@/constants/dates';
import { formatCurrency } from '@/utils/formatters';
import { useDashboard } from '@/hooks/useDashboard';
import dynamic from 'next/dynamic';

const CategoryExpenseChart = dynamic(() => import('@/components/dashboard/CategoryExpenseChart'), {
  loading: () => <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Carregando gráficos...</div>
});

const CategoryDrilldownModal = dynamic(() => import('@/components/dashboard/CategoryDrilldownModal'));

export default function Home() {
  const router = useRouter();
  const { month, year } = useDateFilter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const {
    dashboard,
    monthTransactions,
    loading,
    pieData,
    categoryRanking,
  } = useDashboard(month, year, false);

  const monthName = MONTH_NAMES[month - 1];

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
          <h1>Resumo de {monthName}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Acompanhe sua saúde financeira no mês selecionado.
          </p>
        </div>
        <MonthSelector />
      </header>

      {/* Cards de Métricas Principais */}
      {dashboard && (
        <div className="dashboard-stats" style={{ marginBottom: '2.5rem' }}>
          <div className="glass-card stat-item">
            <div className="stat-label">Saldo Atual</div>
            <div className={`stat-value balance ${dashboard.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(dashboard.balance)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Receitas ({monthName})</div>
            <div className="stat-value income">
              {formatCurrency(dashboard.totalIncome)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Despesas ({monthName})</div>
            <div className="stat-value expense">
              {formatCurrency(dashboard.totalExpense)}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Despesas por Categoria e Ranking */}
      <CategoryExpenseChart
        pieData={pieData}
        categoryRanking={categoryRanking}
        totalExpense={dashboard?.totalExpense || 0}
        monthName={monthName}
        year={year}
        onSelectCategory={setSelectedCategory}
      />

      {/* Modal de Detalhamento da Categoria (Drill-down) */}
      <CategoryDrilldownModal
        categoryName={selectedCategory}
        monthTransactions={monthTransactions}
        totalMonthlyExpense={dashboard?.totalExpense || 0}
        monthName={monthName}
        year={year}
        onClose={() => setSelectedCategory(null)}
        onViewInTransactions={(cat) => router.push(`/transactions?category=${encodeURIComponent(cat)}`)}
      />
    </div>
  );
}
