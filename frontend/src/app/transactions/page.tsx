"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  TrendingUp, 
  Receipt, 
  Edit2, 
  X, 
  Download, 
  Search, 
  Calendar,
  AlertCircle,
  Filter,
  Zap,
  ArrowRight,
  Check,
  Sparkles,
  CloudUpload
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';
import { parseQuickAddInput } from '@/utils/quickAddParser';
import { 
  addToOfflineQueue, 
  getOfflineQueue, 
  cacheTransactionsLocally, 
  getCachedTransactionsLocally 
} from '@/utils/offlineQueue';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  is_paid?: boolean;
  is_offline?: boolean;
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros de visualização do extrato
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Inicializa categoria via query param se existir (ex: /transactions?category=Moradia)
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setCategoryFilter(cat);
    }
  }, [searchParams]);

  // Form state do modal
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { session } = useAuth();
  const { month, year, setMonth, setYear } = useDateFilter();

  // Estados do Lançamento Inteligente por Texto Livre (Quick-Add)
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddFeedback, setQuickAddFeedback] = useState<string | null>(null);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState(false);

  const parsedQuickAdd = useMemo(() => {
    return parseQuickAddInput(quickAddText, month, year);
  }, [quickAddText, month, year]);

  // Helper para inicializar a data com base no mês e ano selecionados
  const getInitialDateForSelectedMonth = useCallback((targetMonth: number, targetYear: number) => {
    const now = new Date();
    const isCurrentMonthYear = (now.getMonth() + 1 === targetMonth) && (now.getFullYear() === targetYear);
    
    if (isCurrentMonthYear) {
      const d = String(now.getDate()).padStart(2, '0');
      return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${d}`;
    } else {
      return `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!session?.access_token) return;

    // Helper para extrair itens pendentes da fila offline para o mês/ano atual
    const getPendingForMonth = () => {
      const queue = getOfflineQueue();
      return queue
        .filter(q => {
          const parts = q.date.split('-');
          return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
        })
        .map(q => ({
          id: q.tempId,
          title: q.title,
          amount: q.amount,
          type: q.type,
          category: q.category,
          date: q.date,
          is_paid: q.is_paid,
          is_offline: true
        }));
    };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = getCachedTransactionsLocally(month, year);
      const pending = getPendingForMonth();
      setTransactions([...pending, ...cached]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions?month=${month}&year=${year}&status=paid`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        cacheTransactionsLocally(month, year, data);
        const pending = getPendingForMonth();
        setTransactions([...pending, ...data]);
      } else {
        const cached = getCachedTransactionsLocally(month, year);
        const pending = getPendingForMonth();
        setTransactions([...pending, ...cached]);
      }
    } catch (err) {
      console.warn('Conexão instável, carregando do cache local:', err);
      const cached = getCachedTransactionsLocally(month, year);
      const pending = getPendingForMonth();
      setTransactions([...pending, ...cached]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, month, year]);

  useEffect(() => {
    fetchTransactions();

    const handleSynced = () => {
      fetchTransactions();
    };

    window.addEventListener('lumin:synced', handleSynced);
    return () => {
      window.removeEventListener('lumin:synced', handleSynced);
    };
  }, [fetchTransactions]);

  // Cálculos do resumo mensal
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const monthlyExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [transactions]);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Lista filtrada pelo usuário (busca + tipo + categoria)
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' ? true : t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  // Total gasto na categoria filtrada
  const categoryFilterTotal = useMemo(() => {
    if (categoryFilter === 'all') return 0;
    return filteredTransactions.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [filteredTransactions, categoryFilter]);

  // Checagem inteligente de divergência de mês da data selecionada
  const dateParts = date ? date.split('-') : [];
  const selectedDateYear = dateParts[0] ? parseInt(dateParts[0], 10) : null;
  const selectedDateMonth = dateParts[1] ? parseInt(dateParts[1], 10) : null;
  const isDifferentMonth = Boolean(
    selectedDateMonth && 
    selectedDateYear && 
    (selectedDateMonth !== month || selectedDateYear !== year)
  );

  const openNewTransactionModal = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory(categoryFilter !== 'all' ? categoryFilter : 'Alimentação');
    setRepeat(false);
    setDate(getInitialDateForSelectedMonth(month, year));
    setIsModalOpen(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setTitle(t.title);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    const dateFormatted = t.date ? t.date.split('T')[0] : '';
    setDate(dateFormatted);
    setRepeat(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setTitle('');
    setAmount('');
    setDate('');
    setRepeat(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    const txPayload = { 
      title, 
      amount: parseFloat(amount), 
      type, 
      category, 
      date,
      is_paid: true,
      repeat_months: repeat && !editingId ? 12 : 1 
    };

    // Modo Offline: se o navegador estiver sem conexão
    if (typeof navigator !== 'undefined' && !navigator.onLine && !editingId) {
      const offlineItem = addToOfflineQueue(txPayload);
      setTransactions(prev => [{
        id: offlineItem.tempId,
        title: offlineItem.title,
        amount: offlineItem.amount,
        type: offlineItem.type,
        category: offlineItem.category,
        date: offlineItem.date,
        is_paid: true,
        is_offline: true
      }, ...prev]);
      closeModal();
      setIsSubmitting(false);
      return;
    }

    try {
      const url = editingId ? `${API_URL}/api/transactions/${editingId}` : `${API_URL}/api/transactions`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(txPayload)
      });

      if (res.ok) {
        closeModal();
        
        if (selectedDateMonth && selectedDateYear && (selectedDateMonth !== month || selectedDateYear !== year)) {
          setMonth(selectedDateMonth);
          setYear(selectedDateYear);
        } else {
          fetchTransactions();
        }
      } else {
        const errData = await res.json();
        alert(`Erro da API: ${errData.error || 'Falha ao salvar'}`);
      }
    } catch (err: any) {
      // Se a conexão falhou durante o envio
      if (!editingId) {
        const offlineItem = addToOfflineQueue(txPayload);
        setTransactions(prev => [{
          id: offlineItem.tempId,
          title: offlineItem.title,
          amount: offlineItem.amount,
          type: offlineItem.type,
          category: offlineItem.category,
          date: offlineItem.date,
          is_paid: true,
          is_offline: true
        }, ...prev]);
        closeModal();
      } else {
        alert(`Erro na requisição: ${err.message || err}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (res.ok) {
        fetchTransactions();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-');
    return `${d}/${m}/${y}`;
  };

  const exportCSV = () => {
    if (transactions.length === 0) return alert('Nenhuma transação para exportar neste mês.');
    const header = ['Data,Título,Categoria,Tipo,Valor(R$)'];
    const rows = transactions.map(t => {
      return `${t.date ? t.date.split('T')[0] : ''},"${t.title.replace(/"/g, '""')}",${t.category},${t.type === 'income' ? 'Receita' : 'Despesa'},${t.amount}`;
    });
    const csvString = [header, ...rows].join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lumin_finance_${month}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedQuickAdd.isValid || !parsedQuickAdd.title) {
      return;
    }

    setIsSubmittingQuickAdd(true);

    const txPayload = {
      title: parsedQuickAdd.title,
      amount: parsedQuickAdd.amount,
      type: parsedQuickAdd.type,
      category: parsedQuickAdd.category,
      date: parsedQuickAdd.date,
      is_paid: true
    };

    const dateParts = parsedQuickAdd.date.split('-');
    const pYear = parseInt(dateParts[0], 10);
    const pMonth = parseInt(dateParts[1], 10);

    // Se estiver explicitamente offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const offlineItem = addToOfflineQueue(txPayload);
      setTransactions(prev => [{
        id: offlineItem.tempId,
        title: offlineItem.title,
        amount: offlineItem.amount,
        type: offlineItem.type,
        category: offlineItem.category,
        date: offlineItem.date,
        is_paid: true,
        is_offline: true
      }, ...prev]);
      setQuickAddText('');
      setQuickAddFeedback(`📱 Salvo no aparelho: "${parsedQuickAdd.title}" (Offline)`);
      setTimeout(() => setQuickAddFeedback(null), 4000);
      setIsSubmittingQuickAdd(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...txPayload,
          repeat_months: 1
        })
      });

      if (res.ok) {
        const addedTitle = parsedQuickAdd.title;
        const addedAmount = parsedQuickAdd.amount;
        setQuickAddText('');
        setQuickAddFeedback(`Lançado: "${addedTitle}" (${formatCurrency(addedAmount)})`);
        setTimeout(() => setQuickAddFeedback(null), 3500);

        if (pMonth && pYear && (pMonth !== month || pYear !== year)) {
          setMonth(pMonth);
          setYear(pYear);
        } else {
          fetchTransactions();
        }
      } else {
        const err = await res.json();
        alert(`Erro ao salvar lançamento rápido: ${err.error || 'Falha na requisição'}`);
      }
    } catch (err: any) {
      // Falha de conexão: guarda na fila offline
      const offlineItem = addToOfflineQueue(txPayload);
      setTransactions(prev => [{
        id: offlineItem.tempId,
        title: offlineItem.title,
        amount: offlineItem.amount,
        type: offlineItem.type,
        category: offlineItem.category,
        date: offlineItem.date,
        is_paid: true,
        is_offline: true
      }, ...prev]);
      setQuickAddText('');
      setQuickAddFeedback(`📱 Salvo no aparelho: "${parsedQuickAdd.title}" (Offline)`);
      setTimeout(() => setQuickAddFeedback(null), 4000);
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  const handleQuickAddReview = () => {
    setTitle(parsedQuickAdd.title);
    setAmount(parsedQuickAdd.amount > 0 ? parsedQuickAdd.amount.toString() : '');
    setType(parsedQuickAdd.type);
    setCategory(parsedQuickAdd.category);
    setDate(parsedQuickAdd.date);
    setRepeat(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Carregando extrato...
      </div>
    );
  }

  return (
    <div className="container">
      {/* Cabeçalho da Página */}
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt className="text-accent" size={28} />
            Lançamentos
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Extrato detalhado de <strong>{MONTH_NAMES[month - 1]} de {year}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} title="Exportar dados do mês em planilha CSV" className="btn-secondary">
            <Download size={18} />
            <span>Exportar CSV</span>
          </button>
          
          <MonthSelector />

          <button 
            onClick={openNewTransactionModal} 
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'auto', margin: 0, padding: '0.7rem 1.25rem' }}
          >
            <Plus size={20} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </header>

      {/* Mini Resumo Mensal */}
      <div className="extrato-summary-grid">
        <div className="extrato-summary-card">
          <span className="summary-label">Entradas ({MONTH_NAMES[month - 1]})</span>
          <span className="summary-val text-income">+{formatCurrency(monthlyIncome)}</span>
        </div>
        <div className="extrato-summary-card">
          <span className="summary-label">Saídas ({MONTH_NAMES[month - 1]})</span>
          <span className="summary-val text-expense">-{formatCurrency(monthlyExpense)}</span>
        </div>
        <div className="extrato-summary-card">
          <span className="summary-label">Saldo do Mês</span>
          <span className={`summary-val ${monthlyBalance >= 0 ? 'text-income' : 'text-expense'}`}>
            {formatCurrency(monthlyBalance)}
          </span>
        </div>
      </div>

      {/* Lançamento Rápido Inteligente por Texto Livre */}
      <div className="quick-add-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Zap size={18} className="text-accent" />
            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>Lançamento Rápido com IA</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              (Ex: <em>"Almoço 45"</em>, <em>"Uber 23,50 ontem"</em>, <em>"Salário 5000 dia 5"</em>)
            </span>
          </div>

          {quickAddFeedback && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
              <Check size={14} />
              {quickAddFeedback}
            </div>
          )}
        </div>

        <form onSubmit={handleQuickAddSubmit} className="quick-add-input-row">
          <input
            type="text"
            className="quick-add-input"
            placeholder="Digite naturalmente: Ex: 'Supermercado 320' ou 'Gasolina posto 150 ontem'..."
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
          />

          <button
            type="submit"
            disabled={!parsedQuickAdd.isValid || isSubmittingQuickAdd}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.25rem',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: parsedQuickAdd.isValid ? 1 : 0.5,
              cursor: parsedQuickAdd.isValid ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap'
            }}
            title="Lançar diretamente sem abrir modal"
          >
            <span>{isSubmittingQuickAdd ? 'Lançando...' : 'Lançar'}</span>
            <ArrowRight size={16} />
          </button>

          {quickAddText.trim().length > 0 && (
            <button
              type="button"
              onClick={handleQuickAddReview}
              className="btn-secondary"
              style={{ padding: '0.75rem 1rem', margin: 0, fontSize: '0.85rem', whiteSpace: 'nowrap' }}
              title="Abrir o modal com estes dados preenchidos para revisar detalhes"
            >
              Revisar no Modal
            </button>
          )}
        </form>

        {/* Live Detected Preview Chips */}
        {quickAddText.trim().length > 0 && (
          <div className="quick-add-preview-row">
            <div className="quick-add-chips">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '0.2rem' }}>
                Detectado:
              </span>
              
              <span className="quick-add-chip" style={{ border: `1px solid ${parsedQuickAdd.type === 'income' ? '#10b981' : '#ef4444'}` }}>
                {parsedQuickAdd.type === 'income' ? '📈 Receita' : '📉 Despesa'}
              </span>

              <span className="quick-add-chip" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                🏷️ {parsedQuickAdd.category}
              </span>

              {parsedQuickAdd.amount > 0 ? (
                <span className="quick-add-chip" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 700 }}>
                  💰 {formatCurrency(parsedQuickAdd.amount)}
                </span>
              ) : (
                <span className="quick-add-chip" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                  ⚠️ Digite o valor (ex: 45)
                </span>
              )}

              <span className="quick-add-chip">
                📅 {formatDateDisplay(parsedQuickAdd.date)}
              </span>

              {parsedQuickAdd.title && (
                <span className="quick-add-chip" style={{ opacity: 0.85 }}>
                  📝 "{parsedQuickAdd.title}"
                </span>
              )}
            </div>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Pressione <strong>Enter</strong> para lançar
            </span>
          </div>
        )}
      </div>

      {/* Barra de Filtros e Busca com Categoria Integrada */}
      <div className="extrato-filter-bar">
        {/* Busca por texto */}
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por descrição ou categoria..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="search-clear-btn" title="Limpar busca">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filtro por Categoria */}
        <select 
          className="category-filter-select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          title="Filtrar por categoria"
        >
          <option value="all">Todas as Categorias</option>
          <option value="Alimentação">🍔 Alimentação</option>
          <option value="Transporte">🚗 Transporte</option>
          <option value="Moradia">🏠 Moradia</option>
          <option value="Lazer">🍿 Lazer</option>
          <option value="Saúde">💊 Saúde</option>
          <option value="Educação">📚 Educação</option>
          <option value="Salário">💰 Salário</option>
          <option value="Rendimentos">📈 Rendimentos</option>
          <option value="Vendas">🛍️ Vendas</option>
          <option value="Geral">📦 Geral</option>
        </select>

        {/* Abas de Tipo */}
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            Todos ({transactions.length})
          </button>
          <button 
            className={`filter-tab ${typeFilter === 'expense' ? 'active' : ''}`}
            onClick={() => setTypeFilter('expense')}
          >
            📉 Despesas ({transactions.filter(t => t.type === 'expense').length})
          </button>
          <button 
            className={`filter-tab ${typeFilter === 'income' ? 'active' : ''}`}
            onClick={() => setTypeFilter('income')}
          >
            📈 Receitas ({transactions.filter(t => t.type === 'income').length})
          </button>
        </div>
      </div>

      {/* Banner de Categoria Ativa (se filtrada) */}
      {categoryFilter !== 'all' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '0.65rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.88rem'
        }}>
          <span style={{ color: '#60a5fa', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Filter size={15} />
            Filtrando por <strong>{categoryFilter}</strong> • Total nesta categoria: <strong>{formatCurrency(categoryFilterTotal)}</strong>
          </span>
          <button 
            onClick={() => setCategoryFilter('all')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#93c5fd', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.25rem', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              textDecoration: 'underline'
            }}
          >
            <X size={14} /> Remover filtro
          </button>
        </div>
      )}

      {/* Extrato em Largura Total */}
      <div className="glass-card" style={{ width: '100%' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="card-title">
            <CreditCard size={20} />
            Extrato de Movimentações
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="empty-state" style={{ padding: '3.5rem 1rem' }}>
            <CreditCard size={48} style={{ opacity: 0.4 }} />
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>
              {transactions.length === 0 
                ? `Nenhum lançamento registrado em ${MONTH_NAMES[month - 1]} de ${year}.` 
                : 'Nenhum lançamento encontrado para os filtros aplicados.'}
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              {transactions.length === 0 
                ? 'Clique no botão abaixo para adicionar sua primeira movimentação.'
                : 'Tente alterar os termos de busca ou filtros.'}
            </p>
            {transactions.length === 0 ? (
              <button 
                onClick={openNewTransactionModal} 
                className="btn-primary" 
                style={{ width: 'auto', marginTop: '1.25rem', padding: '0.6rem 1.5rem' }}
              >
                <Plus size={18} style={{ marginRight: '0.4rem' }} />
                Adicionar Lançamento
              </button>
            ) : (
              <button 
                onClick={() => { setSearchTerm(''); setTypeFilter('all'); setCategoryFilter('all'); }} 
                className="btn-secondary" 
                style={{ marginTop: '1rem' }}
              >
                Limpar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="transaction-list" style={{ maxHeight: 'calc(100vh - 380px)', minHeight: '300px' }}>
            {filteredTransactions.map((t) => (
              <div key={t.id} className="tx-item">
                <div className={`tx-icon-wrap ${t.type}`}>
                  {t.type === 'income' ? <TrendingUp size={20} /> : <Receipt size={20} />}
                </div>
                
                <div className="tx-title-container">
                  <div className="tx-title" title={t.title}>{t.title}</div>
                </div>

                <div className="tx-amount-container">
                  <div className={`tx-amount ${t.type}`}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </div>
                </div>
                
                <div className="tx-meta-container">
                  <span 
                    className="tx-category-badge" 
                    onClick={() => setCategoryFilter(t.category)}
                    style={{ cursor: 'pointer' }}
                    title={`Filtrar somente ${t.category}`}
                  >
                    {t.category}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} style={{ opacity: 0.7 }} />
                    {formatDateDisplay(t.date)}
                  </span>
                  {t.is_offline && (
                    <span style={{
                      fontSize: '0.72rem',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#facc15',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontWeight: 600
                    }} title="Salvo localmente no aparelho. Será enviado à nuvem assim que você se conectar.">
                      <CloudUpload size={12} />
                      Offline
                    </span>
                  )}
                </div>
                
                <div className="tx-actions-container">
                  <button onClick={() => handleEdit(t)} className="btn-icon" title="Editar lançamento" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="btn-delete" title="Remover lançamento">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button - Mobile */}
      {!isModalOpen && (
        <button 
          className="fab-button mobile-only" 
          onClick={openNewTransactionModal}
          title="Novo Lançamento"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Modal Universal (Desktop & Mobile) */}
      {isModalOpen && (
        <div className="app-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="app-modal-content">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 className="card-title" style={{ fontSize: '1.25rem' }}>
                  {editingId ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
                  {editingId ? 'Editar Lançamento' : 'Novo Lançamento'}
                </h2>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className="month-badge-pill">
                    <Calendar size={12} />
                    Mês de referência: {MONTH_NAMES[month - 1]} de {year}
                  </span>
                </div>
              </div>

              <button 
                type="button" 
                onClick={closeModal} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                title="Fechar"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Seletor de Tipo (Despesa / Receita) */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    if (['Salário', 'Rendimentos', 'Vendas'].includes(category)) {
                      setCategory('Alimentação');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: type === 'expense' ? '2px solid var(--color-expense)' : '1px solid var(--border-subtle)',
                    background: type === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                    color: type === 'expense' ? 'var(--color-expense)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  📉 Despesa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    if (['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação'].includes(category)) {
                      setCategory('Salário');
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: type === 'income' ? '2px solid var(--color-income)' : '1px solid var(--border-subtle)',
                    background: type === 'income' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: type === 'income' ? 'var(--color-income)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  📈 Receita
                </button>
              </div>

              {/* Título */}
              <div className="form-group">
                <label className="form-label">Título / Descrição</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder={type === 'expense' ? 'Ex: Supermercado, Aluguel, Farmácia...' : 'Ex: Salário mensal, Freelance...'} 
                />
              </div>

              {/* Valor */}
              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="form-input" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                  required 
                  placeholder="0,00" 
                />
              </div>

              {/* Categoria */}
              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select 
                  className="form-input form-select" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  required
                >
                  {type === 'expense' ? (
                    <>
                      <option value="Alimentação">🍔 Alimentação</option>
                      <option value="Transporte">🚗 Transporte</option>
                      <option value="Moradia">🏠 Moradia</option>
                      <option value="Lazer">🍿 Lazer</option>
                      <option value="Saúde">💊 Saúde</option>
                      <option value="Educação">📚 Educação</option>
                      <option value="Geral">📦 Geral</option>
                    </>
                  ) : (
                    <>
                      <option value="Salário">💰 Salário</option>
                      <option value="Rendimentos">📈 Rendimentos</option>
                      <option value="Vendas">🛍️ Vendas</option>
                      <option value="Geral">📦 Geral</option>
                    </>
                  )}
                </select>
              </div>

              {/* Data com Proteção Inteligente de Mês */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Data do Lançamento</span>
                  {selectedDateMonth && selectedDateYear && (
                    <span style={{ fontSize: '0.78rem', color: isDifferentMonth ? '#facc15' : 'var(--accent-primary)', fontWeight: 500 }}>
                      {MONTH_NAMES[selectedDateMonth - 1]}/{selectedDateYear}
                    </span>
                  )}
                </label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required
                />

                {/* Caixa de aviso caso o usuário selecione uma data fora do mês ativo */}
                {isDifferentMonth && selectedDateMonth && selectedDateYear && (
                  <div className="date-warning-box">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        Atenção: A data selecionada pertence a <strong>{MONTH_NAMES[selectedDateMonth - 1]} de {selectedDateYear}</strong>, diferente do mês atual do extrato (<strong>{MONTH_NAMES[month - 1]} de {year}</strong>).
                        <div style={{ fontSize: '0.78rem', opacity: 0.9, marginTop: '2px' }}>
                          Ao salvar, seu extrato será direcionado para {MONTH_NAMES[selectedDateMonth - 1]} para você acompanhar.
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn-date-reset"
                      onClick={() => setDate(getInitialDateForSelectedMonth(month, year))}
                    >
                      Restaurar para {MONTH_NAMES[month - 1]} de {year}
                    </button>
                  </div>
                )}
              </div>

              {/* Repetir */}
              {!editingId && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <input 
                    type="checkbox" 
                    id="repeatCheckbox" 
                    checked={repeat} 
                    onChange={(e) => setRepeat(e.target.checked)} 
                    style={{ width: '1.1rem', height: '1.1rem', cursor: 'pointer' }} 
                  />
                  <label htmlFor="repeatCheckbox" style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Repetir todo mês (12 parcelas fixas)
                  </label>
                </div>
              )}

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="btn-secondary" 
                  style={{ flex: 1 }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ flex: 2, margin: 0 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : (editingId ? 'Salvar Alterações' : 'Adicionar Lançamento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}>Carregando extrato...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
