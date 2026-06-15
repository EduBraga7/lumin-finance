"use client";

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Calendar, Edit2, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDateFilter } from '@/context/DateFilterContext';
import MonthSelector from '@/components/MonthSelector';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `http://${window.location.hostname}:3001` : 'http://localhost:3001');

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  is_paid?: boolean;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [billType, setBillType] = useState<'expense' | 'reminder'>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Moradia');
  const [date, setDate] = useState('');
  const [repeat, setRepeat] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { session } = useAuth();
  const { month, year } = useDateFilter();

  const fetchBills = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch(`${API_URL}/api/transactions?month=${month}&year=${year}&status=pending`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      setBills(data);
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  }, [session, month, year]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

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
          amount: billType === 'reminder' ? 0 : (parseFloat(amount) || 0), 
          type: billType, 
          category: billType === 'reminder' ? 'Lembrete' : category, 
          date,
          is_paid: false, // Sempre pendente
          repeat_months: repeat && !editingId ? 12 : 1 
        })
      });
      if (res.ok) {
        cancelEdit();
        fetchBills();
      } else {
        const errData = await res.json();
        alert(`Erro da API: ${errData.error}`);
      }
    } catch (err: any) {
      alert(`Erro na requisição: ${err.message || err}`);
    }
  };

  const handlePay = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/${id}/pay`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (res.ok) {
        fetchBills();
      }
    } catch (err) {
      console.error('Error paying bill:', err);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setBillType(t.type === 'reminder' ? 'reminder' : 'expense');
    setTitle(t.title);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setDate(t.date);
    setIsModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBillType('expense');
    setTitle('');
    setAmount('');
    setCategory('Moradia');
    setDate('');
    setRepeat(false);
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
        fetchBills();
      }
    } catch (err) {
      console.error('Error deleting bill:', err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) return <div style={{display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center'}}>Carregando...</div>;

  const renderFormContent = () => (
    <>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="card-title">
          {editingId ? <Edit2 size={20} className="text-accent" /> : <Plus size={20} className="text-accent" />}
          {editingId ? 'Editar Conta' : 'Agendar Conta'}
        </h2>
        {(editingId || isModalOpen) && (
          <button type="button" onClick={cancelEdit} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <form onSubmit={(e) => { handleSubmit(e); setIsModalOpen(false); }}>
        <div className="form-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button type="button" onClick={() => setBillType('expense')} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: billType === 'expense' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-base)', color: billType === 'expense' ? 'var(--color-expense)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            💸 Despesa Real
          </button>
          <button type="button" onClick={() => setBillType('reminder')} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: billType === 'reminder' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-base)', color: billType === 'reminder' ? '#3b82f6' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            🔔 Apenas Aviso
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">{billType === 'reminder' ? 'Nome do Lembrete' : 'Nome da Conta'}</label>
          <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder={billType === 'reminder' ? 'Ex: Fatura do Cartão...' : 'Ex: Internet, Luz, Cartão...'} />
        </div>
        
        {billType === 'expense' && (
          <>
            <div className="form-group">
              <label className="form-label">Valor Estimado (R$)</label>
              <input type="number" step="0.01" className="form-input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>Deixe em branco se não souber o valor ainda.</span>
            </div>
            
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select className="form-input form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="Moradia">🏠 Moradia</option>
                <option value="Alimentação">🍔 Alimentação</option>
                <option value="Transporte">🚗 Transporte</option>
                <option value="Lazer">🍿 Lazer</option>
                <option value="Saúde">💊 Saúde</option>
                <option value="Educação">📚 Educação</option>
                <option value="Geral">📦 Geral</option>
              </select>
            </div>
          </>
        )}
        
        <div className="form-group">
          <label className="form-label">Data de Vencimento</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        
        {!editingId && (
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input type="checkbox" id="repeatCheckbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
            <label htmlFor="repeatCheckbox" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
              Repetir mensalmente (Assinatura)
            </label>
          </div>
        )}
        
        <button type="submit" className="btn-primary" style={{ background: billType === 'reminder' ? '#3b82f6' : 'var(--color-expense)', color: '#fff' }}>
          {editingId ? 'Salvar Alterações' : (billType === 'reminder' ? 'Criar Aviso' : 'Agendar Conta')}
        </button>
      </form>
    </>
  );

  return (
    <div className="container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1>Agenda de Contas</h1>
        <MonthSelector />
      </header>

      <div className="main-grid">
        {/* Formulário Desktop */}
        <div className="desktop-only">
          <div className="glass-card sticky-card">
            {renderFormContent()}
          </div>
        </div>

        {/* Modal Mobile */}
        {isModalOpen && (
          <div className="bottom-sheet-overlay mobile-only" onClick={(e) => { if(e.target === e.currentTarget) setIsModalOpen(false); }}>
            <div className="bottom-sheet-content">
              {renderFormContent()}
            </div>
          </div>
        )}

        {/* Lista de Contas */}
        <div>
          <div className="glass-card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar size={20} />
                Contas a Pagar ({month}/{year})
              </h2>
            </div>
            
            {bills.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} color="var(--accent-primary)" />
                <p>Nenhuma conta pendente para este mês!</p>
                <p style={{fontSize: '0.8rem', marginTop: '0.5rem'}}>Você está com tudo em dia. Agende novas contas ao lado.</p>
              </div>
            ) : (
              <div className="transaction-list" style={{ maxHeight: '600px' }}>
                {bills.map((t) => {
                  const dueDate = new Date(`${t.date}T12:00:00Z`);
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const isOverdue = dueDate < today;

                  return (
                    <div key={t.id} className="tx-item" style={{ borderLeft: isOverdue ? '4px solid var(--color-expense)' : (t.type === 'reminder' ? '4px solid #3b82f6' : '4px solid var(--accent-primary)'), paddingLeft: '1rem' }}>
                      
                      <div className="tx-title-container" style={{ flex: 1 }}>
                        <div className="tx-title" style={{ color: isOverdue ? 'var(--color-expense)' : 'var(--text-primary)' }}>
                          {t.type === 'reminder' ? '🔔 ' : ''}{t.title} {isOverdue && <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-expense)' }}>(Atrasada)</span>}
                        </div>
                        <div className="tx-meta-container" style={{ marginTop: '0.2rem' }}>
                          {t.type !== 'reminder' && <span className="tx-category-badge">{t.category}</span>}
                          <span>Vence: {new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      <div className="tx-amount-container" style={{ marginRight: '1rem' }}>
                        <div className="tx-amount" style={{ color: t.type === 'reminder' ? '#3b82f6' : 'var(--color-expense)', fontSize: t.type === 'reminder' ? '0.9rem' : '1.1rem', fontWeight: t.type === 'reminder' ? 500 : 700 }}>
                          {t.type === 'reminder' ? 'Aviso' : `- ${formatCurrency(t.amount)}`}
                        </div>
                      </div>
                      
                      <div className="tx-actions-container">
                        <button onClick={() => handlePay(t.id)} title={t.type === 'reminder' ? "Marcar como Lida" : "Marcar como Pago"} style={{ background: t.type === 'reminder' ? '#3b82f6' : 'var(--color-expense)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle size={14} /> {t.type === 'reminder' ? 'OK / Feito' : 'Pagar'}
                        </button>
                        <button onClick={() => handleEdit(t)} className="btn-icon" title="Editar conta" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '0.4rem' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(t.id)} className="btn-delete" title="Excluir agendamento" style={{ padding: '0.4rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
          title="Nova Conta"
          style={{ background: 'var(--color-expense)' }}
        >
          <Plus size={24} color="#fff" />
        </button>
      )}
    </div>
  );
}
