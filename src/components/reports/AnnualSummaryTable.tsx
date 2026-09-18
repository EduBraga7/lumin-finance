import React from 'react';
import { Calendar } from 'lucide-react';
import { YearlyMonthData, AnnualSummary } from '@/types/finance';
import { FULL_MONTH_NAMES } from '@/constants/dates';
import { formatCurrency, formatPercentage } from '@/utils/formatters';

interface AnnualSummaryTableProps {
  data: YearlyMonthData[];
  summary: AnnualSummary;
  year: number;
}

export const AnnualSummaryTable: React.FC<AnnualSummaryTableProps> = ({ data, summary, year }) => {
  return (
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
                    {hasActivity ? formatPercentage(rowRate) : '-'}
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
                {formatPercentage(summary.savingsRate)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
