"use client";

import { Sparkles, Calendar, CheckCircle2, TrendingUp, AlertTriangle, AlertCircle, RefreshCw, Lightbulb } from 'lucide-react';
import { AiDiagnosis } from '@/utils/aiAdvisor';
import { formatDateTimeDisplay } from '@/utils/formatters';

interface AiAdvisorCardProps {
  aiDiagnosis: AiDiagnosis | null;
  loadingAi: boolean;
  onRefresh: () => void;
}

export default function AiAdvisorCard({
  aiDiagnosis,
  loadingAi,
  onRefresh,
}: AiAdvisorCardProps) {
  return (
    <div className="ai-advisor-card">
      <div className="ai-advisor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#c084fc" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Lumin AI Advisor
            </h2>
          </div>
          <span className="ai-sparkle-badge">Inteligência Financeira</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {aiDiagnosis?.updatedAt && (
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
              }}
            >
              <Calendar size={12} style={{ opacity: 0.7 }} />
              <span>
                {aiDiagnosis.cached ? 'Salvo em' : 'Gerado em'} {formatDateTimeDisplay(aiDiagnosis.updatedAt)}
              </span>
            </span>
          )}

          {aiDiagnosis && (
            <span className={`ai-status-pill ${aiDiagnosis.status}`}>
              {aiDiagnosis.status === 'excellent' && <CheckCircle2 size={14} />}
              {aiDiagnosis.status === 'good' && <TrendingUp size={14} />}
              {aiDiagnosis.status === 'warning' && <AlertTriangle size={14} />}
              {aiDiagnosis.status === 'critical' && <AlertCircle size={14} />}
              {aiDiagnosis.statusText}
            </span>
          )}

          <button
            onClick={onRefresh}
            disabled={loadingAi}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Forçar nova análise inteligente com IA"
          >
            <RefreshCw size={14} className={loadingAi ? 'animate-spin' : ''} />
            <span>{loadingAi ? 'Analisando...' : 'Recalcular'}</span>
          </button>
        </div>
      </div>

      {loadingAi && !aiDiagnosis ? (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <Sparkles size={26} className="animate-spin text-accent" style={{ margin: '0 auto 0.6rem', display: 'block' }} />
          Analisando receitas, despesas e hábitos financeiros do mês...
        </div>
      ) : aiDiagnosis ? (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6', margin: '0.25rem 0 1rem' }}>
            {aiDiagnosis.summary}
          </p>

          {aiDiagnosis.aiAdviceText && (
            <div
              style={{
                marginTop: '0.75rem',
                marginBottom: '1rem',
                padding: '1rem 1.25rem',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '10px',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                color: '#f3f4f6',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, color: '#c084fc', marginBottom: '0.4rem' }}>
                <Sparkles size={15} />
                <span>Parecer do Mentor IA:</span>
              </div>
              <div style={{ whiteSpace: 'pre-line' }}>{aiDiagnosis.aiAdviceText}</div>
            </div>
          )}

          <div className="ai-insights-grid">
            {aiDiagnosis.insights.map((insight, idx) => (
              <div key={idx} className={`ai-insight-item ${insight.type}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  {insight.type === 'positive' && <TrendingUp size={16} color="#10b981" />}
                  {insight.type === 'warning' && <AlertTriangle size={16} color="#f59e0b" />}
                  {insight.type === 'tip' && <Lightbulb size={16} color="#a855f7" />}
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {insight.title}
                  </strong>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {insight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
