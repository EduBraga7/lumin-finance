"use client";

import { useMemo } from 'react';
import { X, Calendar, ChevronRight } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { CATEGORY_EMOJIS } from '@/constants/categories';
import { formatCurrency, formatDateDisplay } from '@/utils/formatters';

interface CategoryDrilldownModalProps {
  categoryName: string | null;
  monthTransactions: Transaction[];
  totalMonthlyExpense: number;
  monthName: string;
  year: number;
  onClose: () => void;
  onViewInTransactions: (category: string) => void;
}

export default function CategoryDrilldownModal({
  categoryName,
  monthTransactions,
  totalMonthlyExpense,
  monthName,
  year,
  onClose,
  onViewInTransactions,
}: CategoryDrilldownModalProps) {
  const categoryDetails = useMemo(() => {
    if (!categoryName) return null;
    const items = monthTransactions
      .filter((t) => t.category === categoryName && t.type === 'expense')
      .sort((a, b) => b.amount - a.amount);

    const total = items.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const pct = totalMonthlyExpense > 0 ? (total / totalMonthlyExpense) * 100 : 0;

    return { items, total, pct };
  }, [categoryName, monthTransactions, totalMonthlyExpense]);

  if (!categoryName || !categoryDetails) return null;

  return (
    <div
      className="app-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="app-modal-content">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.5rem' }}>{CATEGORY_EMOJIS[categoryName] || '🏷️'}</span>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}>
                {categoryName}
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Detalhamento em {monthName} de {year}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumo da Categoria */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total gasto na categoria
            </span>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-expense)' }}>
              {formatCurrency(categoryDetails.total)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Impacto no mês
            </span>
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
                  borderRadius: '8px',
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

        {/* Ação de ir para extrato completo */}
        <button
          onClick={() => onViewInTransactions(categoryName)}
          className="btn-primary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>Ver e Filtrar no Extrato Completo</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
