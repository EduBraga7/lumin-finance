"use client";

import { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: Record<string, number>;
}

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f97316', // Laranja
  'Transporte': '#a855f7',  // Roxo
  'Moradia': '#3b82f6',     // Azul
  'Lazer': '#eab308',       // Amarelo
  'Saúde': '#ef4444',       // Vermelho
  'Educação': '#10b981',    // Verde
  'Geral': '#6b7280'        // Cinza
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const { session } = useAuth();
  const { month, year } = useDateFilter();

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions/dashboard?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setDashboard(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [session, month, year]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const pieData = dashboard ? Object.keys(dashboard.expensesByCategory).map(key => ({
    name: key,
    value: dashboard.expensesByCategory[key]
  })) : [];

  if (loading) return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Carregando Dashboard...</div>;

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Resumo de {MONTH_NAMES[month - 1]}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Acompanhe sua saúde financeira no mês selecionado.</p>
        </div>
        <MonthSelector />
      </header>

      {dashboard && (
        <div className="dashboard-stats" style={{ marginBottom: '3rem' }}>
          <div className="glass-card stat-item">
            <div className="stat-label">Saldo Atual</div>
            <div className={`stat-value balance ${dashboard.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(dashboard.balance)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Receitas ({MONTH_NAMES[month - 1]})</div>
            <div className="stat-value income">
              {formatCurrency(dashboard.totalIncome)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Despesas ({MONTH_NAMES[month - 1]})</div>
            <div className="stat-value expense">
              {formatCurrency(dashboard.totalExpense)}
            </div>
          </div>
        </div>
      )}

      {pieData.length > 0 ? (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="card-header">
            <h2 className="card-title">
              <LayoutDashboard size={20} />
              Distribuição de Gastos em {MONTH_NAMES[month - 1]}
            </h2>
          </div>
          <div style={{ height: '400px', width: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '43%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block' }}>Despesas</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                {dashboard ? formatCurrency(dashboard.totalExpense) : ''}
              </span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="45%" 
                  innerRadius={90} 
                  outerRadius={130} 
                  paddingAngle={8} 
                  dataKey="value"
                  stroke="none"
                  cornerRadius={6}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Geral']} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ background: 'rgba(18,18,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={false}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum gasto registrado em {MONTH_NAMES[month - 1]}.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Vá para a aba "Lançamentos" e adicione algumas despesas.</p>
        </div>
      )}
    </div>
  );
}
