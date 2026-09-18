"use client";

import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { MONTH_NAMES } from '@/constants/dates';

interface TransactionSummaryCardsProps {
  month: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
  savingsRate: number;
}

export default function TransactionSummaryCards({
  month,
  monthlyIncome,
  monthlyExpense,
  monthlyBalance,
  savingsRate,
}: TransactionSummaryCardsProps) {
  const monthName = MONTH_NAMES[month - 1];

  return (
    <div className="extrato-summary-grid">
      <div className="extrato-summary-card">
        <span className="summary-label">Entradas ({monthName})</span>
        <span className="summary-val text-income">+{formatCurrency(monthlyIncome)}</span>
      </div>

      <div className="extrato-summary-card">
        <span className="summary-label">Saídas ({monthName})</span>
        <span className="summary-val text-expense">-{formatCurrency(monthlyExpense)}</span>
      </div>

      <div className="extrato-summary-card">
        <span className="summary-label">Saldo Líquido</span>
        <span className={`summary-val ${monthlyBalance >= 0 ? 'text-income' : 'text-expense'}`}>
          {formatCurrency(monthlyBalance)}
        </span>
      </div>

      <div className="extrato-summary-card">
        <span className="summary-label">Taxa de Poupança</span>
        <span className={`summary-val ${savingsRate >= 20 ? 'text-income' : savingsRate > 0 ? 'text-accent' : 'text-expense'}`}>
          {formatPercentage(savingsRate)}
        </span>
      </div>
    </div>
  );
}
