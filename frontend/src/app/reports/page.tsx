"use client";

import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface YearlyData {
  name: string;
  income: number;
  expense: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<YearlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const { session } = useAuth();

  const fetchYearlyData = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/transactions/yearly?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Error fetching yearly data:', err);
    } finally {
      setLoading(false);
    }
  }, [session, year]);

  useEffect(() => {
    fetchYearlyData();
  }, [fetchYearlyData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Relatório Anual</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Visão macro de receitas e despesas.</p>
        </div>
        
        {/* Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--surface-light)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <button onClick={() => setYear(y => y - 1)} className="btn-icon" style={{ background: 'transparent' }}>
            <ChevronLeft size={20} color="var(--text-secondary)" />
          </button>
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {year}
          </span>
          <button onClick={() => setYear(y => y + 1)} className="btn-icon" style={{ background: 'transparent' }}>
            <ChevronRight size={20} color="var(--text-secondary)" />
          </button>
        </div>
      </header>

      {loading ? (
        <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>Carregando estatísticas...</div>
      ) : (
        <div className="glass-card" style={{ height: '500px', marginTop: '2rem' }}>
          <div className="card-header">
            <h2 className="card-title">Evolução de Patrimônio ({year})</h2>
          </div>
          
          <div style={{ width: '100%', height: 'calc(100% - 60px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(Number(value))}
                  contentStyle={{ background: 'rgba(18,18,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Receitas" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Despesas" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
