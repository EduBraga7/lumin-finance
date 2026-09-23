"use client";

import { useState } from 'react';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Calculator,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/formatters';

interface SimulationResult {
  baseline: {
    income: number;
    expense: number;
    balance: number;
  };
  simulated: {
    income: number;
    expense: number;
    balance: number;
    savingsRate: number;
  };
  projection: Array<{
    month: string;
    baselineBalance: number;
    simulatedBalance: number;
    simulatedIncome: number;
    simulatedExpense: number;
    projectedReserve: number;
  }>;
  riskLevel: 'low' | 'moderate' | 'high';
  opinion: string;
}

export default function ScenarioSimulator() {
  const [incomeChangePercent, setIncomeChangePercent] = useState<number>(0);
  const [newRecurringExpense, setNewRecurringExpense] = useState<string>('0');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('3000');
  const [installments, setInstallments] = useState<number>(10);
  const [emergencyFund, setEmergencyFund] = useState<string>('12000');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          incomeChangePercent,
          newRecurringExpense: parseFloat(newRecurringExpense) || 0,
          purchaseAmount: parseFloat(purchaseAmount) || 0,
          installments,
          emergencyFund: parseFloat(emergencyFund) || 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Erro ao simular cenário:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Formulário de Parâmetros */}
      <div className="glass-card">
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <h2 className="card-title">
            <Sliders size={20} className="text-accent" />
            Parâmetros do Cenário Futuro
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Simule variações de renda, novas contas fixas e compras parceladas
          </span>
        </div>

        <form onSubmit={handleSimulate}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
          }}>
            {/* Variação de Renda */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Variação de Renda Mensal</span>
                <strong style={{ color: incomeChangePercent >= 0 ? 'var(--color-income)' : 'var(--color-expense)' }}>
                  {incomeChangePercent >= 0 ? `+${incomeChangePercent}%` : `${incomeChangePercent}%`}
                </strong>
              </label>
              <input
                type="range"
                min="-40"
                max="60"
                step="5"
                value={incomeChangePercent}
                onChange={(e) => setIncomeChangePercent(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                <span>-40% (Queda)</span>
                <span>0% (Atual)</span>
                <span>+60% (Promoção)</span>
              </div>
            </div>

            {/* Nova Despesa Recorrente */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nova Despesa Fixa (R$/mês)</label>
              <input
                type="number"
                step="50"
                className="form-input"
                value={newRecurringExpense}
                onChange={(e) => setNewRecurringExpense(e.target.value)}
                placeholder="Ex: 400 (novo aluguel, condomínio)"
              />
            </div>

            {/* Compra Planejada */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Compra Planejada (R$ Total)</label>
              <input
                type="number"
                step="100"
                className="form-input"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="Ex: 3500 (viagem, notebook)"
              />
            </div>

            {/* Parcelas */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Parcelamento ({installments}x)</label>
              <select
                className="form-input form-select"
                value={installments}
                onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n === 1 ? '1x à vista' : `${n} parcelas mensais`}
                  </option>
                ))}
              </select>
            </div>

            {/* Reserva de Emergência Atual */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Reserva Financeira Disponível (R$)</label>
              <input
                type="number"
                step="500"
                className="form-input"
                value={emergencyFund}
                onChange={(e) => setEmergencyFund(e.target.value)}
                placeholder="Ex: 10000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem' }}
          >
            <Calculator size={18} />
            <span>{loading ? 'Calculando projeção...' : 'Calcular Cenário com IA'}</span>
          </button>
        </form>
      </div>

      {/* Resultados da Simulação */}
      {result && (
        <>
          {/* Cards de Métricas do Cenário */}
          <div className="dashboard-stats">
            <div className="glass-card stat-item">
              <div className="stat-label">Novo Saldo Mensal (Mês 1)</div>
              <div className={`stat-value balance ${result.simulated.balance >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(result.simulated.balance)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Antes: {formatCurrency(result.baseline.balance)}
              </div>
            </div>

            <div className="glass-card stat-item">
              <div className="stat-label">Nova Taxa de Poupança</div>
              <div className="stat-value income">
                {result.simulated.savingsRate.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Renda total: {formatCurrency(result.simulated.income)}
              </div>
            </div>

            <div className="glass-card stat-item">
              <div className="stat-label">Classificação de Risco</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                {result.riskLevel === 'low' ? (
                  <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '1.25rem' }}>
                    <ShieldCheck size={24} /> Baixo Risco
                  </span>
                ) : result.riskLevel === 'moderate' ? (
                  <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '1.25rem' }}>
                    <AlertTriangle size={24} /> Risco Moderado
                  </span>
                ) : (
                  <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '1.25rem' }}>
                    <AlertOctagon size={24} /> Alto Risco
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                {result.riskLevel === 'low'
                  ? 'Orçamento absorve o impacto com folga'
                  : result.riskLevel === 'moderate'
                  ? 'Exige corte em gastos supérfluos'
                  : 'Compromete o fluxo de caixa'}
              </div>
            </div>
          </div>

          {/* Parecer Executivo do CFO */}
          <div className="glass-card" style={{
            borderLeft: `4px solid ${result.riskLevel === 'low' ? 'var(--color-income)' : result.riskLevel === 'moderate' ? '#f59e0b' : 'var(--color-expense)'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Sparkles size={18} className="text-accent" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Parecer Executivo da IA</h3>
            </div>
            <div style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
              {result.opinion}
            </div>
          </div>

          {/* Gráfico de Projeção de 12 Meses */}
          <div className="glass-card">
            <div className="card-header" style={{ marginBottom: '1.5rem' }}>
              <h3 className="card-title">
                <TrendingUp size={20} className="text-accent" />
                Trajetória Projetada de Fluxo de Caixa (12 Meses)
              </h3>
            </div>
            <div style={{ width: '100%', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.projection} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `R$ ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                  <Tooltip
                    formatter={(val: unknown) => formatCurrency(Number(val))}
                    contentStyle={{
                      background: 'rgba(18, 18, 20, 0.95)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="baselineBalance"
                    name="Saldo Atual Médio"
                    stroke="var(--text-secondary)"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="simulatedBalance"
                    name="Saldo Projetado (Novo Cenário)"
                    stroke="var(--accent-primary)"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="projectedReserve"
                    name="Reserva Acumulada"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
