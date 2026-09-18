import React from 'react';
import { TrendingUp, TrendingDown, PiggyBank, Percent, Award, AlertTriangle } from 'lucide-react';
import { AnnualSummary } from '@/types/finance';
import { FULL_MONTH_NAMES } from '@/constants/dates';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface AnnualKpiCardsProps {
  summary: AnnualSummary;
}

export default function AnnualKpiCards({ summary }: AnnualKpiCardsProps) {
  const { bestMonth, worstExpenseMonth } = summary;

  return (
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
            {formatPercentage(summary.savingsRate)}
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
    </>
  );
};
