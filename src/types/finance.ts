export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  is_paid?: boolean;
  is_offline?: boolean;
}

export interface TransactionPayload {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  is_paid?: boolean;
  repeat_months?: number;
}

export interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  expensesByCategory: Record<string, number>;
}

export interface CategoryRankingItem {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  emoji: string;
}

export interface YearlyMonthData {
  name: string;
  income: number;
  expense: number;
}

export interface MonthHighlight {
  name: string;
  net: number;
}

export interface ExpenseHighlight {
  name: string;
  expense: number;
}

export interface AnnualSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  avgMonthlyExpense: number;
  avgMonthlyIncome: number;
  bestMonth: MonthHighlight | null;
  worstExpenseMonth: ExpenseHighlight | null;
  activeMonthsCount: number;
}
