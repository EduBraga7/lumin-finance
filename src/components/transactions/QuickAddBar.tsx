"use client";

import { useState, useMemo } from 'react';
import { Zap, ArrowRight, Check } from 'lucide-react';
import { parseQuickAddInput, ParsedQuickAdd } from '@/utils/quickAddParser';
import { formatCurrency, formatDateDisplay } from '@/utils/formatters';
import { TransactionPayload } from '@/types/finance';

interface QuickAddBarProps {
  month: number;
  year: number;
  onSubmit: (payload: TransactionPayload) => Promise<{ success: boolean; isOffline?: boolean; error?: string }>;
  onReviewInModal: (parsed: ParsedQuickAdd) => void;
}

export default function QuickAddBar({
  month,
  year,
  onSubmit,
  onReviewInModal,
}: QuickAddBarProps) {
  const [quickAddText, setQuickAddText] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedQuickAdd = useMemo(() => {
    return parseQuickAddInput(quickAddText, month, year);
  }, [quickAddText, month, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedQuickAdd.isValid || !parsedQuickAdd.title) return;

    setIsSubmitting(true);
    const payload: TransactionPayload = {
      title: parsedQuickAdd.title,
      amount: parsedQuickAdd.amount,
      type: parsedQuickAdd.type,
      category: parsedQuickAdd.category,
      date: parsedQuickAdd.date,
      is_paid: true,
    };

    const res = await onSubmit(payload);
    setIsSubmitting(false);

    if (res.success) {
      setQuickAddText('');
      const msg = res.isOffline
        ? `Salvo no aparelho: "${parsedQuickAdd.title}" (Offline)`
        : `Lançado com sucesso: "${parsedQuickAdd.title}" (${formatCurrency(parsedQuickAdd.amount)})`;
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 4000);
    } else if (res.error) {
      setFeedback(`Erro: ${res.error}`);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="quick-add-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Zap size={18} className="text-accent" />
          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Lançamento Rápido com IA</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            (Ex: <em>Almoço 45</em>, <em>Uber 23,50 ontem</em>, <em>Salário 5000 dia 5</em>)
          </span>
        </div>

        {feedback && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
            <Check size={14} />
            {feedback}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="quick-add-input-row">
        <input
          type="text"
          className="quick-add-input"
          placeholder="Digite naturalmente: Ex: 'Supermercado 320' ou 'Gasolina 150 ontem'..."
          value={quickAddText}
          onChange={(e) => setQuickAddText(e.target.value)}
        />

        <button
          type="submit"
          disabled={!parsedQuickAdd.isValid || isSubmitting}
          className="btn-primary"
          style={{
            padding: '0.75rem 1.25rem',
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            opacity: parsedQuickAdd.isValid ? 1 : 0.5,
            cursor: parsedQuickAdd.isValid ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
          }}
          title="Lançar diretamente sem abrir modal"
        >
          <span>{isSubmitting ? 'Lançando...' : 'Lançar'}</span>
          <ArrowRight size={16} />
        </button>

        {quickAddText.trim().length > 0 && (
          <button
            type="button"
            onClick={() => onReviewInModal(parsedQuickAdd)}
            className="btn-secondary"
            style={{ padding: '0.75rem 1rem', margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
            title="Abrir o modal com estes dados preenchidos para revisar detalhes"
          >
            Revisar no Modal
          </button>
        )}
      </form>

      {/* Chips de Pré-visualização Detectados */}
      {quickAddText.trim().length > 0 && (
        <div className="quick-add-preview-row">
          <div className="quick-add-chips">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.2rem' }}>
              Detectado:
            </span>

            <span
              className="quick-add-chip"
              style={{
                border: `1px solid ${parsedQuickAdd.type === 'income' ? '#10b981' : '#ef4444'}`,
              }}
            >
              {parsedQuickAdd.type === 'income' ? '📈 Receita' : '📉 Despesa'}
            </span>

            <span className="quick-add-chip" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
              🏷️ {parsedQuickAdd.category}
            </span>

            {parsedQuickAdd.amount > 0 ? (
              <span className="quick-add-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                💰 {formatCurrency(parsedQuickAdd.amount)}
              </span>
            ) : (
              <span className="quick-add-chip" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                ⚠️ Digite o valor (ex: 45)
              </span>
            )}

            <span className="quick-add-chip">
              📅 {formatDateDisplay(parsedQuickAdd.date)}
            </span>

            {parsedQuickAdd.title && (
              <span className="quick-add-chip" style={{ opacity: 0.85 }}>
                📝 {parsedQuickAdd.title}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
