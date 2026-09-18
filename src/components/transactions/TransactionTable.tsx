"use client";

import { CreditCard, TrendingUp, Receipt, Calendar, CloudUpload, Edit2, Trash2, Plus } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { formatCurrency, formatDateDisplay } from '@/utils/formatters';

interface TransactionTableProps {
  transactions: Transaction[];
  hasFiltersApplied: boolean;
  monthName: string;
  year: number;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onSelectCategory: (category: string) => void;
  onClearFilters: () => void;
  onOpenNewModal: () => void;
}

export default function TransactionTable({
  transactions,
  hasFiltersApplied,
  monthName,
  year,
  onEdit,
  onDelete,
  onSelectCategory,
  onClearFilters,
  onOpenNewModal,
}: TransactionTableProps) {
  return (
    <div className="glass-card" style={{ width: '100%' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">
          <CreditCard size={20} />
          Extrato de Movimentações
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {transactions.length} {transactions.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
          <CreditCard size={48} style={{ opacity: 0.4 }} />
          <p style={{ marginTop: '1rem', fontWeight: 600 }}>
            {!hasFiltersApplied
              ? `Nenhum lançamento registrado em ${monthName} de ${year}.`
              : 'Nenhum lançamento encontrado para os filtros aplicados.'}
          </p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            {!hasFiltersApplied
              ? 'Clique no botão abaixo para adicionar sua primeira movimentação.'
              : 'Tente alterar os termos de busca ou filtros.'}
          </p>
          {!hasFiltersApplied ? (
            <button
              onClick={onOpenNewModal}
              className="btn-primary"
              style={{ width: 'auto', marginTop: '1.25rem', padding: '0.6rem 1.5rem' }}
            >
              <Plus size={18} style={{ marginRight: '0.4rem' }} />
              Adicionar Lançamento
            </button>
          ) : (
            <button
              onClick={onClearFilters}
              className="btn-secondary"
              style={{ marginTop: '1rem' }}
            >
              Limpar Filtros
            </button>
          )}
        </div>
      ) : (
        <div className="transaction-list" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '300px' }}>
          {transactions.map((t) => (
            <div key={t.id} className="tx-item">
              <div className={`tx-icon-wrap ${t.type}`}>
                {t.type === 'income' ? <TrendingUp size={20} /> : <Receipt size={20} />}
              </div>

              <div className="tx-title-container">
                <div className="tx-title" title={t.title}>
                  {t.title}
                </div>
              </div>

              <div className="tx-amount-container">
                <div className={`tx-amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </div>
              </div>

              <div className="tx-meta-container">
                <span
                  className="tx-category-badge"
                  onClick={() => onSelectCategory(t.category)}
                  style={{ cursor: 'pointer' }}
                  title={`Filtrar somente ${t.category}`}
                >
                  {t.category}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Calendar size={13} style={{ opacity: 0.7 }} />
                  {formatDateDisplay(t.date)}
                </span>
                {t.is_offline && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#facc15',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600,
                    }}
                    title="Salvo localmente no aparelho. Será enviado à nuvem assim que você se conectar."
                  >
                    <CloudUpload size={12} />
                    Offline
                  </span>
                )}
              </div>

              <div className="tx-actions-container">
                <button
                  onClick={() => onEdit(t)}
                  className="btn-icon"
                  title="Editar lançamento"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="btn-delete"
                  title="Remover lançamento"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
