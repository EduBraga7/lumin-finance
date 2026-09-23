"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit2, X, Calendar, AlertCircle } from 'lucide-react';
import { Transaction, TransactionPayload, TransactionType } from '@/types/finance';
import { MONTH_NAMES } from '@/constants/dates';
import { formatInputDate } from '@/utils/formatters';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  initialValues?: Partial<TransactionPayload> | null;
  currentMonth: number;
  currentYear: number;
  onClose: () => void;
  onSubmit: (payload: TransactionPayload, editingId: string | null) => Promise<{ success: boolean; error?: string } | void>;
  onNavigateToMonth?: (m: number, y: number) => void;
}

export default function TransactionModal({
  isOpen,
  editingTransaction,
  initialValues,
  currentMonth,
  currentYear,
  onClose,
  onSubmit,
  onNavigateToMonth,
}: TransactionModalProps) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getInitialDateForMonth = useCallback((targetMonth: number, targetYear: number) => {
    const now = new Date();
    const isCurrent = now.getMonth() + 1 === targetMonth && now.getFullYear() === targetYear;
    if (isCurrent) {
      return formatInputDate(now);
    }
    return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const syncForm = async () => {
      await Promise.resolve();
      if (editingTransaction) {
        setTitle(editingTransaction.title);
        setAmount(String(editingTransaction.amount));
        setType(editingTransaction.type);
        setCategory(editingTransaction.category);
        setDate(editingTransaction.date ? editingTransaction.date.split('T')[0] : getInitialDateForMonth(currentMonth, currentYear));
        setRepeat(false);
      } else if (initialValues) {
        setTitle(initialValues.title || '');
        setAmount(initialValues.amount ? String(initialValues.amount) : '');
        setType(initialValues.type || 'expense');
        setCategory(initialValues.category || 'Alimentação');
        setDate(initialValues.date || getInitialDateForMonth(currentMonth, currentYear));
        setRepeat(false);
      } else {
        setTitle('');
        setAmount('');
        setType('expense');
        setCategory('Alimentação');
        setDate(getInitialDateForMonth(currentMonth, currentYear));
        setRepeat(false);
      }
      setErrorMessage(null);
    };
    syncForm();
  }, [isOpen, editingTransaction, initialValues, currentMonth, currentYear, getInitialDateForMonth]);

  // Checagem se a data escolhida pertence a outro mês
  const { selectedDateMonth, selectedDateYear, isDifferentMonth } = useMemo(() => {
    if (!date) return { selectedDateMonth: null, selectedDateYear: null, isDifferentMonth: false };
    const parts = date.split('-');
    if (parts.length < 2) return { selectedDateMonth: null, selectedDateYear: null, isDifferentMonth: false };

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const isDiff = m !== currentMonth || y !== currentYear;
    return { selectedDateMonth: m, selectedDateYear: y, isDifferentMonth: isDiff };
  }, [date, currentMonth, currentYear]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    const payload: TransactionPayload = {
      title,
      amount: parseFloat(amount),
      type,
      category,
      date,
      is_paid: true,
      repeat_months: repeat && !editingTransaction ? 12 : 1,
    };

    const res = await onSubmit(payload, editingTransaction ? editingTransaction.id : null);
    setIsSubmitting(false);

    if (res && !res.success) {
      setErrorMessage(res.error || 'Erro ao salvar transação. Tente novamente.');
      return;
    }

    if (isDifferentMonth && selectedDateMonth && selectedDateYear && onNavigateToMonth) {
      onNavigateToMonth(selectedDateMonth, selectedDateYear);
    }
    onClose();
  };

  return (
    <div
      className="app-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="app-modal-content">
        <div
          className="card-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}
        >
          <div>
            <h2 className="card-title" style={{ fontSize: '1.25rem' }}>
              {editingTransaction ? (
                <Edit2 size={20} className="text-accent" />
              ) : (
                <Plus size={20} className="text-accent" />
              )}
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <div style={{ marginTop: '0.25rem' }}>
              <span className="month-badge-pill">
                <Calendar size={12} />
                Mês de referência: {MONTH_NAMES[currentMonth - 1]} de {currentYear}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
            title="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Seletor de Tipo */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (['Salário', 'Rendimentos', 'Vendas'].includes(category)) {
                  setCategory('Alimentação');
                }
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: type === 'expense' ? '2px solid var(--color-expense)' : '1px solid var(--border-subtle)',
                background: type === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: type === 'expense' ? 'var(--color-expense)' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              📉 Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação'].includes(category)) {
                  setCategory('Salário');
                }
              }}
              style={{
                flex: 1,
                padding: '0.75rem',
                borderRadius: '8px',
                border: type === 'income' ? '2px solid var(--color-income)' : '1px solid var(--border-subtle)',
                background: type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: type === 'income' ? 'var(--color-income)' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              📈 Receita
            </button>
          </div>

          {/* Título */}
          <div className="form-group">
            <label className="form-label">Título / Descrição</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={type === 'expense' ? 'Ex: Supermercado, Aluguel, Farmácia...' : 'Ex: Salário mensal, Freelance...'}
            />
          </div>

          {/* Valor */}
          <div className="form-group">
            <label className="form-label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0,00"
            />
          </div>

          {/* Categoria */}
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-input form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {type === 'expense' ? (
                <>
                  <option value="Alimentação">🍔 Alimentação</option>
                  <option value="Transporte">🚗 Transporte</option>
                  <option value="Moradia">🏠 Moradia</option>
                  <option value="Lazer">🍿 Lazer</option>
                  <option value="Saúde">💊 Saúde</option>
                  <option value="Educação">📚 Educação</option>
                  <option value="Geral">📦 Geral</option>
                </>
              ) : (
                <>
                  <option value="Salário">💼 Salário</option>
                  <option value="Rendimentos">📈 Rendimentos</option>
                  <option value="Vendas">🤝 Vendas</option>
                  <option value="Geral">📦 Geral</option>
                </>
              )}
            </select>
          </div>

          {/* Data */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Data do Lançamento</span>
              {selectedDateMonth && selectedDateYear && (
                <span style={{ fontSize: '0.78rem', color: isDifferentMonth ? '#facc15' : 'var(--accent-primary)', fontWeight: 500 }}>
                  {MONTH_NAMES[selectedDateMonth - 1]}/{selectedDateYear}
                </span>
              )}
            </label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            {/* Alerta de data fora do mês */}
            {isDifferentMonth && selectedDateMonth && selectedDateYear && (
              <div className="date-warning-box">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    Atenção: A data selecionada pertence a <strong>{MONTH_NAMES[selectedDateMonth - 1]} de {selectedDateYear}</strong>, diferente do mês do extrato (<strong>{MONTH_NAMES[currentMonth - 1]} de {currentYear}</strong>).
                    <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '2px' }}>
                      Ao salvar, seu extrato será direcionado para {MONTH_NAMES[selectedDateMonth - 1]} para você acompanhar.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-date-reset"
                  onClick={() => setDate(getInitialDateForMonth(currentMonth, currentYear))}
                >
                  Restaurar para {MONTH_NAMES[currentMonth - 1]} de {currentYear}
                </button>
              </div>
            )}
          </div>

          {/* Recorrência */}
          {!editingTransaction && (
            <div className="form-group checkbox-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={repeat}
                  onChange={(e) => setRepeat(e.target.checked)}
                />
                <span>Repetir este lançamento pelos próximos 12 meses</span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ flex: 1 }}>
              {isSubmitting ? 'Salvando...' : editingTransaction ? 'Salvar Alterações' : 'Criar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
