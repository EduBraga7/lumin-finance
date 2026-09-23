"use client";

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Transaction, TransactionPayload } from '@/types/finance';
import {
  addToOfflineQueue,
  getOfflineQueue,
  cacheTransactionsLocally,
  getCachedTransactionsLocally,
} from '@/utils/offlineQueue';
import { DEMO_TRANSACTIONS } from '@/utils/demoData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

function getCsrfHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {};
  const match = document.cookie.match(/lumin_csrf_token=([^;]+)/);
  return match ? { 'x-csrf-token': match[1] } : {};
}

export function useTransactions(month: number, year: number) {
  const { user, isDemoMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper para extrair lançamentos pendentes na fila offline para o período selecionado
  const getPendingForMonth = useCallback((): Transaction[] => {
    const queue = getOfflineQueue();
    return queue
      .filter((q) => {
        const parts = q.date.split('-');
        return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month;
      })
      .map((q) => ({
        id: q.tempId,
        title: q.title,
        amount: q.amount,
        type: q.type,
        category: q.category,
        date: q.date,
        is_paid: q.is_paid,
        is_offline: true,
      }));
  }, [month, year]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    // Modo demo: retorna dados mockados filtrados pelo mês/ano
    if (isDemoMode) {
      const filtered = DEMO_TRANSACTIONS.filter((t) => {
        const d = new Date(t.date);
        return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
      });
      setTransactions(filtered);
      setLoading(false);
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = getCachedTransactionsLocally<Transaction>(month, year);
      const pending = getPendingForMonth();
      setTransactions([...pending, ...cached]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/transactions?month=${month}&year=${year}`,
        { credentials: 'include' }
      );

      if (res.ok) {
        const data = (await res.json()) as Transaction[];
        cacheTransactionsLocally(month, year, data);
        const pending = getPendingForMonth();
        setTransactions([...pending, ...data]);
      } else {
        const cached = getCachedTransactionsLocally<Transaction>(month, year);
        const pending = getPendingForMonth();
        setTransactions([...pending, ...cached]);
      }
    } catch {
      const cached = getCachedTransactionsLocally<Transaction>(month, year);
      const pending = getPendingForMonth();
      setTransactions([...pending, ...cached]);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, month, year, getPendingForMonth]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchTransactions();
      }
    };
    run();

    const handleSynced = () => {
      fetchTransactions();
    };

    window.addEventListener('lumin:synced', handleSynced);
    return () => {
      ignore = true;
      window.removeEventListener('lumin:synced', handleSynced);
    };
  }, [fetchTransactions]);

  const createTransaction = useCallback(
    async (payload: TransactionPayload): Promise<{ success: boolean; isOffline?: boolean; error?: string }> => {
      // Modo demo: simula sucesso sem salvar nada
      if (isDemoMode) {
        alert('Modo Demo — alterações não são salvas.');
        return { success: false, error: 'Modo demo' };
      }

      // Se estiver explicitamente offline no navegador
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const offlineItem = addToOfflineQueue(payload);
        setTransactions((prev) => [
          {
            id: offlineItem.tempId,
            title: offlineItem.title,
            amount: offlineItem.amount,
            type: offlineItem.type,
            category: offlineItem.category,
            date: offlineItem.date,
            is_paid: true,
            is_offline: true,
          },
          ...prev,
        ]);
        return { success: true, isOffline: true };
      }

      try {
        const res = await fetch(`${API_URL}/api/transactions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeader(),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await fetchTransactions();
          return { success: true };
        }

        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.error || 'Falha ao salvar transação' };
      } catch (err: unknown) {
        // Fallback para fila offline se a conexão falhar durante o envio
        const offlineItem = addToOfflineQueue(payload);
        setTransactions((prev) => [
          {
            id: offlineItem.tempId,
            title: offlineItem.title,
            amount: offlineItem.amount,
            type: offlineItem.type,
            category: offlineItem.category,
            date: offlineItem.date,
            is_paid: true,
            is_offline: true,
          },
          ...prev,
        ]);
        const msg = err instanceof Error ? err.message : 'Falha na requisição';
        return { success: true, isOffline: true, error: msg };
      }
    },
    [isDemoMode, fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, payload: Partial<TransactionPayload>): Promise<boolean> => {
      if (isDemoMode) { alert('Modo Demo — alterações não são salvas.'); return false; }
      try {
        const res = await fetch(`${API_URL}/api/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeader(),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await fetchTransactions();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [isDemoMode, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (isDemoMode) { alert('Modo Demo — alterações não são salvas.'); return false; }
      try {
        const res = await fetch(`${API_URL}/api/transactions/${id}`, {
          method: 'DELETE',
          headers: {
            ...getCsrfHeader(),
          },
          credentials: 'include',
        });

        if (res.ok) {
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [isDemoMode]
  );

  // Cálculos consolidados do mês
  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const monthlyBalance = useMemo(() => {
    return monthlyIncome - monthlyExpense;
  }, [monthlyIncome, monthlyExpense]);

  const savingsRate = useMemo(() => {
    if (monthlyIncome <= 0) return monthlyBalance >= 0 ? 100 : 0;
    return Math.max(0, (monthlyBalance / monthlyIncome) * 100);
  }, [monthlyIncome, monthlyBalance]);

  return {
    transactions,
    loading,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    savingsRate,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
