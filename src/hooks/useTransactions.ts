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

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useTransactions(month: number, year: number) {
  const { session } = useAuth();
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
    if (!session?.access_token) return;

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
        `${API_URL}/api/transactions?month=${month}&year=${year}&status=paid`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
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
  }, [session, month, year, getPendingForMonth]);

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

  const createTransaction = useCallback(
    async (payload: TransactionPayload): Promise<{ success: boolean; isOffline?: boolean; error?: string }> => {
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
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          fetchTransactions();
          return { success: true };
        }

        const errData = await res.json();
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
    [session, fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, payload: Partial<TransactionPayload>): Promise<boolean> => {
      try {
        const res = await fetch(`${API_URL}/api/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          fetchTransactions();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [session, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const res = await fetch(`${API_URL}/api/transactions/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
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
    [session]
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
