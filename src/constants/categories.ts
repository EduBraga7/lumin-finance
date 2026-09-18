export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#f97316', // Laranja
  'Transporte': '#a855f7',  // Roxo
  'Moradia': '#3b82f6',     // Azul
  'Lazer': '#eab308',       // Amarelo
  'Saúde': '#ef4444',       // Vermelho
  'Educação': '#10b981',    // Verde
  'Salário': '#10b981',     // Verde
  'Rendimentos': '#06b6d4', // Ciano
  'Vendas': '#3b82f6',      // Azul
  'Geral': '#6b7280'        // Cinza
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  'Alimentação': '🍔',
  'Transporte': '🚗',
  'Moradia': '🏠',
  'Lazer': '🍿',
  'Saúde': '💊',
  'Educação': '📚',
  'Salário': '💼',
  'Rendimentos': '📈',
  'Vendas': '🤝',
  'Geral': '📦'
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Geral'
] as const;

export const DEFAULT_INCOME_CATEGORIES = [
  'Salário',
  'Rendimentos',
  'Vendas',
  'Geral'
] as const;
