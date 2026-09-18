"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, ChevronRight } from 'lucide-react';
import { CategoryRankingItem } from '@/types/finance';
import { CATEGORY_COLORS } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatters';

interface CategoryExpenseChartProps {
  pieData: { name: string; value: number }[];
  categoryRanking: CategoryRankingItem[];
  totalExpense: number;
  monthName: string;
  year: number;
  onSelectCategory: (name: string) => void;
}

export default function CategoryExpenseChart({
  pieData,
  categoryRanking,
  totalExpense,
  monthName,
  year,
  onSelectCategory,
}: CategoryExpenseChartProps) {
  if (pieData.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', width: '100%', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Nenhum gasto registrado em {monthName} de {year}.</p>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Vá para a aba "Lançamentos" e adicione algumas despesas.</p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ width: '100%', marginBottom: '2rem' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">
          <LayoutDashboard size={20} className="text-accent" />
          Gastos por Categoria em {monthName} de {year}
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Toque em uma categoria para ver os detalhes
        </span>
      </div>

      <div className="dashboard-breakdown-grid">
        {/* Gráfico de Rosca */}
        <div style={{ height: '320px', width: '100%', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Saídas
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCurrency(totalExpense)}
            </span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={6}
                dataKey="value"
                stroke="none"
                cornerRadius={6}
                onClick={(entry: { name?: string }) => {
                  if (entry && entry.name) onSelectCategory(entry.name);
                }}
                style={{ cursor: 'pointer' }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || CATEGORY_COLORS['Geral']} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown) => formatCurrency(Number(value))}
                contentStyle={{ background: 'rgba(18,18,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Ranking Lateral com Barra de Progresso */}
        <div className="category-rank-list">
          {categoryRanking.map((item) => (
            <div
              key={item.name}
              className="category-rank-item"
              onClick={() => onSelectCategory(item.name)}
              title={`Clique para ver o que gastou com ${item.name}`}
            >
              <div className="category-rank-header">
                <div className="category-rank-title">
                  <span>{item.emoji}</span>
                  <span>{item.name}</span>
                </div>
                <div className="category-rank-values">
                  <span className="category-rank-amount">{formatCurrency(item.amount)}</span>
                  <span className="category-rank-pct">({item.percentage.toFixed(1)}%)</span>
                  <ChevronRight size={16} color="var(--text-secondary)" />
                </div>
              </div>

              <div className="category-progress-track">
                <div
                  className="category-progress-fill"
                  style={{ width: `${item.percentage}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
