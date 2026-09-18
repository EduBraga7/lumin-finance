import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { YearlyMonthData } from '@/types/finance';
import { formatCurrency } from '@/utils/formatters';

interface AnnualCashFlowChartProps {
  data: YearlyMonthData[];
  year: number;
}

export default function AnnualCashFlowChart({ data, year }: AnnualCashFlowChartProps) {
  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div className="card-header">
        <h2 className="card-title">
          <BarChart3 size={20} className="text-accent" />
          Comparativo Mensal de Fluxo de Caixa ({year})
        </h2>
      </div>

      <div style={{ width: '100%', height: '380px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="var(--text-secondary)" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
            />
            <YAxis 
              stroke="var(--text-secondary)" 
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
              tickFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`} 
            />
            <Tooltip 
              formatter={(value: unknown) => formatCurrency(Number(value))}
              contentStyle={{ 
                background: 'rgba(18,18,20,0.95)', 
                border: '1px solid rgba(255,255,255,0.12)', 
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ color: '#fff' }}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '15px' }} />
            <Bar 
              dataKey="income" 
              name="Receitas" 
              fill="var(--color-income)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="expense" 
              name="Despesas" 
              fill="var(--color-expense)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
