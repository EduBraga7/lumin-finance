"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, Edit2, X, Calendar, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { Transaction, TransactionPayload, TransactionType } from '@/types/finance';
import { MONTH_NAMES } from '@/constants/dates';
import { formatCurrency, formatInputDate } from '@/utils/formatters';
import { CATEGORY_EMOJIS } from '@/constants/categories';
import { useTransactionSuggestions, TransactionSuggestion } from '@/hooks/useTransactionSuggestions';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  initialValues?: Partial<TransactionPayload> | null;
  currentMonth: number;
  currentYear: number;
  existingTransactions?: Transaction[];
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
  existingTransactions = [],
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

  // Hook de sugestões baseadas no histórico do usuário
  const { suggestions, addSuggestion } = useTransactionSuggestions(existingTransactions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  // Filtra sugestões baseadas no que o usuário digita ou no tipo atual
  const filteredSuggestions = useMemo(() => {
    if (!suggestions || suggestions.length === 0) return [];
    const query = title.trim().toLowerCase();

    // Se estiver digitando, filtra por correspondência no título
    if (query) {
      return suggestions
        .filter((s) => s.title.toLowerCase().includes(query))
        .sort((a, b) => {
          // Prioriza o mesmo tipo (despesa vs receita)
          if (a.type === type && b.type !== type) return -1;
          if (b.type === type && a.type !== type) return 1;
          // Prioriza os que começam com o termo
          const aStarts = a.title.toLowerCase().startsWith(query);
          const bStarts = b.title.toLowerCase().startsWith(query);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;
          return 0;
        })
        .slice(0, 6);
    }

    // Se o campo estiver vazio, exibe as mais recentes do mesmo tipo (despesa ou receita)
    return suggestions.filter((s) => s.type === type).slice(0, 5);
  }, [suggestions, title, type]);

  const handleSelectSuggestion = (s: TransactionSuggestion) => {
    setTitle(s.title);
    setType(s.type);
    setCategory(s.category);
    if ((!amount || amount === '0') && s.amount && s.amount > 0) {
      setAmount(String(s.amount));
    }
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        titleInputRef.current &&
        !titleInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredSuggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setShowSuggestions(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

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
    const parsedAmount = parseFloat(amount);
    const payload: TransactionPayload = {
      title: title.trim(),
      amount: parsedAmount,
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

    // Grava no cache de sugestões para os próximos lançamentos
    addSuggestion({
      title: title.trim(),
      category,
      type,
      amount: parsedAmount,
    });

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

          {/* Título com Autocomplete de Lançamentos Anteriores */}
          <div className="form-group" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Título / Descrição</label>
              {suggestions.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={12} className="text-accent" />
                  Sugestões ativas
                </span>
              )}
            </div>

            <input
              ref={titleInputRef}
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setShowSuggestions(true);
                setActiveSuggestionIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleTitleKeyDown}
              autoComplete="off"
              required
              placeholder={type === 'expense' ? 'Ex: Supermercado, Aluguel, Farmácia...' : 'Ex: Salário mensal, Freelance...'}
            />

            {/* Menu Dropdown de Sugestões Anteriores */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div ref={suggestionsRef} className="suggestions-dropdown">
                <div className="suggestion-header">
                  <Clock size={12} />
                  <span>{title.trim() ? 'Lançamentos correspondentes' : 'Lançamentos anteriores frequentes'}</span>
                </div>
                {filteredSuggestions.map((s, idx) => (
                  <button
                    key={`${s.title}-${s.category}-${idx}`}
                    type="button"
                    className={`suggestion-item ${activeSuggestionIndex === idx ? 'active' : ''}`}
                    onClick={() => handleSelectSuggestion(s)}
                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                  >
                    <div className="suggestion-item-left">
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>
                        {CATEGORY_EMOJIS[s.category] || (s.type === 'income' ? '📈' : '📉')}
                      </span>
                      <span className="suggestion-item-title">{s.title}</span>
                      <span className="suggestion-item-pill">
                        {s.category}
                      </span>
                    </div>
                    {s.amount && s.amount > 0 && (
                      <span className="suggestion-item-right">
                        {formatCurrency(s.amount)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
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
