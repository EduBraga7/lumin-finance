"use client";

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Receipt, Download, Plus } from 'lucide-react';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';
import { MONTH_NAMES } from '@/constants/dates';
import { Transaction, TransactionPayload, TransactionType } from '@/types/finance';
import { ParsedQuickAdd } from '@/utils/quickAddParser';
import { exportTransactionsToCsv } from '@/utils/csvExport';
import { useTransactions } from '@/hooks/useTransactions';
import dynamic from 'next/dynamic';

const TransactionSummaryCards = dynamic(() => import('@/components/transactions/TransactionSummaryCards'));
const QuickAddBar = dynamic(() => import('@/components/transactions/QuickAddBar'));
const TransactionFilters = dynamic(() => import('@/components/transactions/TransactionFilters'));
const TransactionTable = dynamic(() => import('@/components/transactions/TransactionTable'), {
  loading: () => <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Carregando transações...</div>
});
const TransactionModal = dynamic(() => import('@/components/transactions/TransactionModal'));

function TransactionsContent() {
  const searchParams = useSearchParams();
  const { month, year, setMonth, setYear } = useDateFilter();

  const {
    transactions,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    savingsRate,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions(month, year);

  // Filtros de visualização
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>(
    () => searchParams.get('category') || 'all'
  );

  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalInitialValues, setModalInitialValues] = useState<Partial<TransactionPayload> | null>(null);

  // Filtragem dos lançamentos
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        searchTerm === '' ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;

      return matchSearch && matchType && matchCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const handleOpenNewModal = () => {
    setEditingTransaction(null);
    setModalInitialValues(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalInitialValues(null);
    setIsModalOpen(true);
  };

  const handleReviewQuickAdd = (parsed: ParsedQuickAdd) => {
    setEditingTransaction(null);
    setModalInitialValues({
      title: parsed.title,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      date: parsed.date,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload: TransactionPayload, editingId: string | null) => {
    if (editingId) {
      const ok = await updateTransaction(editingId, payload);
      return { success: ok, error: ok ? undefined : 'Falha ao atualizar lançamento' };
    } else {
      const res = await createTransaction(payload);
      return res;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
    await deleteTransaction(id);
  };

  const handleExportCsv = () => {
    const ok = exportTransactionsToCsv(transactions, month, year);
    if (!ok) {
      alert('Nenhuma transação para exportar neste mês.');
    }
  };

  const monthName = MONTH_NAMES[month - 1];

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      {/* Cabeçalho do Extrato */}
      <header className="header" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt className="text-accent" size={28} />
            Lançamentos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Extrato detalhado de <strong>{monthName} de {year}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleExportCsv} title="Exportar dados do mês em planilha CSV" className="btn-secondary">
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>

          <MonthSelector />

          <button
            onClick={handleOpenNewModal}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', margin: 0, padding: '0.7rem 1.25rem' }}
          >
            <Plus size={20} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </header>

      {/* Mini Resumo Mensal */}
      <TransactionSummaryCards
        month={month}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        monthlyBalance={monthlyBalance}
        savingsRate={savingsRate}
      />

      {/* Lançamento Rápido com IA */}
      <QuickAddBar
        month={month}
        year={year}
        onSubmit={createTransaction}
        onReviewInModal={handleReviewQuickAdd}
      />

      {/* Barra de Filtros e Busca */}
      <TransactionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        totalCount={transactions.length}
        expenseCount={transactions.filter((t) => t.type === 'expense').length}
        incomeCount={transactions.filter((t) => t.type === 'income').length}
      />

      {/* Tabela de Lançamentos */}
      <TransactionTable
        transactions={filteredTransactions}
        hasFiltersApplied={searchTerm !== '' || typeFilter !== 'all' || categoryFilter !== 'all'}
        monthName={monthName}
        year={year}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSelectCategory={setCategoryFilter}
        onClearFilters={() => {
          setSearchTerm('');
          setTypeFilter('all');
          setCategoryFilter('all');
        }}
        onOpenNewModal={handleOpenNewModal}
      />

      {/* Modal de Criação / Edição */}
      <TransactionModal
        isOpen={isModalOpen}
        editingTransaction={editingTransaction}
        initialValues={modalInitialValues}
        currentMonth={month}
        currentYear={year}
        existingTransactions={transactions}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        onNavigateToMonth={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      {/* Botão Flutuante (Mobile) */}
      {!isModalOpen && (
        <button
          className="fab-button mobile-only"
          onClick={handleOpenNewModal}
          title="Novo Lançamento"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '2rem' }}>Carregando Extrato...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
