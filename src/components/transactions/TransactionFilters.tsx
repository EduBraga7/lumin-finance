"use client";

import { Search, X } from 'lucide-react';
import { TransactionType } from '@/types/finance';

interface TransactionFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: 'all' | TransactionType;
  onTypeFilterChange: (type: 'all' | TransactionType) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  totalCount: number;
  expenseCount: number;
  incomeCount: number;
}

export default function TransactionFilters({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  totalCount,
  expenseCount,
  incomeCount,
}: TransactionFiltersProps) {
  return (
    <div className="extrato-filter-bar">
      {/* Busca por texto */}
      <div className="search-input-wrap">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por descrição ou categoria..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={() => onSearchChange('')} className="search-clear-btn" title="Limpar busca">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtro por Categoria */}
      <select
        className="category-filter-select"
        value={categoryFilter}
        onChange={(e) => onCategoryFilterChange(e.target.value)}
        title="Filtrar por categoria"
      >
        <option value="all">Todas as Categorias</option>
        <option value="Alimentação">🍔 Alimentação</option>
        <option value="Transporte">🚗 Transporte</option>
        <option value="Moradia">🏠 Moradia</option>
        <option value="Lazer">🍿 Lazer</option>
        <option value="Saúde">💊 Saúde</option>
        <option value="Educação">📚 Educação</option>
        <option value="Salário">💼 Salário</option>
        <option value="Rendimentos">📈 Rendimentos</option>
        <option value="Vendas">🤝 Vendas</option>
        <option value="Geral">📦 Geral</option>
      </select>

      {/* Abas de Tipo */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => onTypeFilterChange('all')}
        >
          Todos ({totalCount})
        </button>
        <button
          className={`filter-tab ${typeFilter === 'expense' ? 'active' : ''}`}
          onClick={() => onTypeFilterChange('expense')}
        >
          Despesas ({expenseCount})
        </button>
        <button
          className={`filter-tab ${typeFilter === 'income' ? 'active' : ''}`}
          onClick={() => onTypeFilterChange('income')}
        >
          Receitas ({incomeCount})
        </button>
      </div>
    </div>
  );
}
