"use client";

import { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

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
      <header className="header">
        <h1>Resumo Financeiro</h1>
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
            <div className="stat-label">Receitas (Mês)</div>
            <div className="stat-value income">
              {formatCurrency(dashboard.totalIncome)}
            </div>
          </div>
          <div className="glass-card stat-item">
            <div className="stat-label">Despesas (Mês)</div>
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
              Distribuição de Gastos
            </h2>
          </div>
          <div style={{ height: '400px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" cy="50%" 
                  innerRadius={100} 
                  outerRadius={140} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ background: 'rgba(18,18,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Nenhum dado para o gráfico ainda.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Vá para a aba "Lançamentos" e adicione algumas despesas para visualizar o gráfico de pizza.</p>
        </div>
      )}
    </div>
  );
}
