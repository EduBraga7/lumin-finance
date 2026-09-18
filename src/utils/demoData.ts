import { DashboardData, Transaction, YearlyMonthData } from '@/types/finance';
import { AiDiagnosis } from '@/utils/aiAdvisor';

// ─── Transações do mês de demonstração ────────────────────────────────────────
export const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'demo-1', title: 'Salário', amount: 7500, type: 'income', category: 'Salário', date: '2026-09-05T12:00:00.000Z', is_paid: true },
  { id: 'demo-2', title: 'Freelance — Projeto UI', amount: 1800, type: 'income', category: 'Freelance', date: '2026-09-12T12:00:00.000Z', is_paid: true },
  { id: 'demo-3', title: 'Aluguel', amount: 1900, type: 'expense', category: 'Moradia', date: '2026-09-10T12:00:00.000Z', is_paid: true },
  { id: 'demo-4', title: 'Supermercado Extra', amount: 420, type: 'expense', category: 'Alimentação', date: '2026-09-08T12:00:00.000Z', is_paid: true },
  { id: 'demo-5', title: 'Ifood — semana 1', amount: 187, type: 'expense', category: 'Alimentação', date: '2026-09-06T12:00:00.000Z', is_paid: true },
  { id: 'demo-6', title: 'Uber / transporte', amount: 215, type: 'expense', category: 'Transporte', date: '2026-09-11T12:00:00.000Z', is_paid: true },
  { id: 'demo-7', title: 'Netflix + Spotify', amount: 89, type: 'expense', category: 'Lazer', date: '2026-09-03T12:00:00.000Z', is_paid: true },
  { id: 'demo-8', title: 'Academia Smart Fit', amount: 99, type: 'expense', category: 'Saúde', date: '2026-09-01T12:00:00.000Z', is_paid: true },
  { id: 'demo-9', title: 'Conta de Luz', amount: 148, type: 'expense', category: 'Moradia', date: '2026-09-15T12:00:00.000Z', is_paid: true },
  { id: 'demo-10', title: 'Plano de Saúde', amount: 320, type: 'expense', category: 'Saúde', date: '2026-09-02T12:00:00.000Z', is_paid: true },
  { id: 'demo-11', title: 'Ifood — semana 2', amount: 203, type: 'expense', category: 'Alimentação', date: '2026-09-14T12:00:00.000Z', is_paid: true },
  { id: 'demo-12', title: 'Curso Next.js Avançado', amount: 197, type: 'expense', category: 'Educação', date: '2026-09-09T12:00:00.000Z', is_paid: true },
  { id: 'demo-13', title: 'Farmácia', amount: 76, type: 'expense', category: 'Saúde', date: '2026-09-13T12:00:00.000Z', is_paid: true },
  { id: 'demo-14', title: 'Happy hour com amigos', amount: 145, type: 'expense', category: 'Lazer', date: '2026-09-16T12:00:00.000Z', is_paid: true },
  { id: 'demo-15', title: 'Internet fibra', amount: 110, type: 'expense', category: 'Moradia', date: '2026-09-04T12:00:00.000Z', is_paid: true },
];

// ─── Dados do dashboard ────────────────────────────────────────────────────────
export const DEMO_DASHBOARD: DashboardData = {
  totalIncome: 9300,
  totalExpense: 4109,
  balance: 5191,
  expensesByCategory: {
    Moradia: 2158,
    Alimentação: 810,
    Saúde: 495,
    Transporte: 215,
    Lazer: 234,
    Educação: 197,
  },
};

// ─── Diagnóstico da IA ────────────────────────────────────────────────────────
export const DEMO_AI_DIAGNOSIS: AiDiagnosis = {
  status: 'good',
  statusText: 'Orçamento Saudável',
  summary:
    'Setembro está excelente! Você manteve as despesas em 44% da renda e gerou uma taxa de poupança de 55,8%. O maior destaque positivo é a receita de freelance que reforçou o caixa do mês.',
  insights: [
    {
      type: 'positive',
      title: 'Moradia Equilibrada',
      description: 'Moradia consome 23% da sua renda — dentro do limite recomendado de 30%.',
      badge: '23% da renda',
    },
    {
      type: 'positive',
      title: 'Alimentação sob Controle',
      description: 'Alimentação está bem controlada em 8,7% da renda total.',
      badge: 'Saudável',
    },
    {
      type: 'tip',
      title: 'Capital Humano',
      description: 'Investimento em educação este mês — sinal claro de capacitação e desenvolvimento.',
      badge: 'Educação',
    },
    {
      type: 'positive',
      title: 'Superávit Líquido',
      description: 'Com R$ 5.191 de saldo positivo, você pode aportar em reserva de emergência.',
      badge: '+R$ 5.191',
    },
  ],
  aiAdviceText:
    'Parabéns pelo equilíbrio financeiro! Considere direcionar parte do saldo excedente para um fundo de investimento ou reserva de emergência. A diversificação de renda (salário + freelance) é um ponto muito positivo no seu perfil.',
  cached: true,
  updatedAt: new Date().toISOString(),
};

// ─── Dados anuais para a tela de relatórios ────────────────────────────────────
export const DEMO_YEARLY_DATA: YearlyMonthData[] = [
  { name: 'Jan', income: 7500, expense: 5100 },
  { name: 'Fev', income: 7500, expense: 4870 },
  { name: 'Mar', income: 8200, expense: 5400 },
  { name: 'Abr', income: 7500, expense: 4990 },
  { name: 'Mai', income: 9100, expense: 5200 },
  { name: 'Jun', income: 7500, expense: 6100 },
  { name: 'Jul', income: 7500, expense: 4750 },
  { name: 'Ago', income: 7500, expense: 5300 },
  { name: 'Set', income: 9300, expense: 4109 },
  { name: 'Out', income: 0, expense: 0 },
  { name: 'Nov', income: 0, expense: 0 },
  { name: 'Dez', income: 0, expense: 0 },
];

export const DEMO_USER = { id: 'demo-user', username: 'Modo Demo' };
