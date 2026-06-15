"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Activity, CreditCard, TrendingUp, Receipt, Edit2, X, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  is_paid?: boolean;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Geral');
  const [date, setDate] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { session } = useAuth();
  const { month, year } = useDateFilter();

  const fetchTransactions = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [session, month, year]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API_URL}/api/transactions/${editingId}` : `${API_URL}/api/transactions`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          title, 
          amount: parseFloat(amount), 
          type, 
          category, 
          date,
          is_paid: isPaid,
          repeat_months: repeat && !editingId ? 12 : 1 
        })
      });
      if (res.ok) {
        cancelEdit();
        fetchTransactions();
      } else {
        const errData = await res.json();
        alert(`Erro da API: ${errData.error}`);
      }
    } catch (err: any) {
      alert(`Erro na requisição: ${err.message || err}`);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setTitle(t.title);
    setAmount(t.amount.toString());
    setType(t.type);
    setCategory(t.category);
    setDate(t.date);
    setIsPaid(t.is_paid !== false);
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setType('expense');
    setCategory('Geral');
    setDate('');
    setRepeat(false);
    setIsPaid(true);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
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

  const exportCSV = () => {
    if (transactions.length === 0) return alert('Nenhuma transação para exportar neste mês.');
    const header = ['Data,Título,Categoria,Tipo,Valor(R$)'];
    const rows = transactions.map(t => {
      return `${t.date},"${t.title}",${t.category},${t.type === 'income' ? 'Receita' : 'Despesa'},${t.amount}`;
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

  if (loading) return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Carregando...</div>;

  const FormContent = () => (
    <>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">
          {editingId ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
          {editingId ? 'Editar Lançamento' : 'Nova Transação'}
        </h2>
        {(editingId || isModalOpen) && (
          <button type="button" onClick={cancelEdit} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={(e) => { handleSubmit(e); setIsModalOpen(false); }}>
        <div className="form-group">
          <label className="form-label">Qual o título?</label>
          <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Salário, Netflix..." />
        </div>
        
        <div className="form-group">
          <label className="form-label">Valor (R$)</label>
          <input type="number" step="0.01" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" />
        </div>
        
        <div className="form-group">
          <label className="form-label">Tipo de Lançamento</label>
          <select className="form-input form-select" value={type} onChange={(e) => setType(e.target.value as 'income'|'expense')}>
            <option value="expense">📉 Despesa</option>
            <option value="income">📈 Receita</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">Categoria</label>
          <select className="form-input form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
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
        
        <div className="form-group">
          <label className="form-label">Data</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        
        {type === 'expense' && (
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <input type="checkbox" id="isPaidCheckbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
            <label htmlFor="isPaidCheckbox" style={{ cursor: 'pointer', color: isPaid ? 'var(--accent-primary)' : 'var(--color-expense)', fontWeight: 600 }}>
              {isPaid ? '✅ Despesa Paga' : '⏳ Conta Pendente (A Pagar)'}
            </label>
          </div>
        )}
        
        {!editingId && (
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="repeatCheckbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
            <label htmlFor="repeatCheckbox" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Repetir todo mês (1 ano)
            </label>
          </div>
        )}
        
        <button type="submit" className="btn-primary">
          {editingId ? 'Salvar Alterações' : 'Adicionar Lançamento'}
        </button>
      </form>
    </>
  );

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Lançamentos</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={exportCSV} title="Baixar planilha" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <Download size={18} />
            Exportar CSV
          </button>
          <MonthSelector />
        </div>
      </header>

      <div className="main-grid">
        {/* Formulário Desktop */}
        <div className="desktop-only">
          <div className="glass-card sticky-card">
            <FormContent />
          </div>
        </div>

        {/* Modal Mobile */}
        {isModalOpen && (
          <div className="bottom-sheet-overlay mobile-only" onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false); }}>
            <div className="bottom-sheet-content">
              <FormContent />
            </div>
          </div>
        )}

        {/* Lista de Transações */}
        <div>
          <div className="glass-card">
            <div className="card-header">
              <h2 className="card-title">
                <Activity size={20} />
                Histórico Completo
              </h2>
            </div>
            
            {transactions.length === 0 ? (
              <div className="empty-state">
                <CreditCard size={48} />
                <p>Nenhuma transação registrada no sistema.</p>
                <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Adicione um novo lançamento ao lado para começar.</p>
              </div>
            ) : (
              <div className="transaction-list" style={{ maxHeight: '600px' }}>
                {transactions.map((t) => (
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
                      <span className="tx-category-badge">{t.category}</span>
                      {t.type === 'expense' && t.is_paid === false && (
                        <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'var(--color-expense-bg)', color: 'var(--color-expense)', fontWeight: 600, textTransform: 'uppercase' }}>Pendente</span>
                      )}
                      <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div className="tx-actions-container">
                      <button onClick={() => handleEdit(t)} className="btn-icon" title="Editar transação" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="btn-delete" title="Remover transação">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating Action Button - Mobile Only */}
      {!isModalOpen && (
        <button 
          className="fab-button mobile-only" 
          onClick={() => setIsModalOpen(true)}
          title="Nova transação"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}
