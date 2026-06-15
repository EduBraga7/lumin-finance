"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Activity, CreditCard, TrendingUp, Receipt } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
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

  const { session } = useAuth();

  const fetchTransactions = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
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
  }, [session]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ title, amount: parseFloat(amount), type, category, date })
      });
      if (res.ok) {
        setTitle('');
        setAmount('');
        fetchTransactions();
      } else {
        const errData = await res.json();
        alert(`Erro da API: ${errData.error}`);
      }
    } catch (err: any) {
      alert(`Erro na requisição: ${err.message || err}`);
    }
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

  if (loading) return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Carregando...</div>;

  return (
    <div className="container">
      <header className="header">
        <h1>Lançamentos</h1>
      </header>

      <div className="main-grid">
        {/* Formulário */}
        <div>
          <div className="glass-card" style={{ position: 'sticky', top: '2rem' }}>
            <div className="card-header">
              <h2 className="card-title">
                <Plus size={20} className="text-accent" />
                Nova Transação
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
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
                <input type="text" className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} required placeholder="Alimentação, Moradia..." />
              </div>
              
              <div className="form-group">
                <label className="form-label">Data</label>
                <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              
              <button type="submit" className="btn-primary">
                Adicionar Lançamento
              </button>
            </form>
          </div>
        </div>

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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className={`tx-icon-wrap ${t.type}`}>
                        {t.type === 'income' ? <TrendingUp size={20} /> : <Receipt size={20} />}
                      </div>
                      <div className="tx-details">
                        <div className="tx-title">{t.title}</div>
                        <div className="tx-meta">
                          <span className="tx-category-badge">{t.category}</span>
                          <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="tx-right">
                      <div className={`tx-amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </div>
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
    </div>
  );
}
