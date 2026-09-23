"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@/types/finance';
import { DEMO_TRANSACTIONS } from '@/utils/demoData';

export interface TransactionSuggestion {
  title: string;
  category: string;
  type: 'income' | 'expense';
  amount?: number;
}

const STORAGE_KEY = 'lumin_recent_suggestions';

export function useTransactionSuggestions(currentTransactions: Transaction[] = []) {
  const { user, isDemoMode } = useAuth();
  const [suggestions, setSuggestions] = useState<TransactionSuggestion[]>([]);

  // 1. Carrega do cache local / dados demo no início
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isDemoMode) {
      const demoList: TransactionSuggestion[] = [];
      const seen = new Set<string>();
      DEMO_TRANSACTIONS.forEach((t) => {
        const key = t.title.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          demoList.push({
            title: t.title,
            category: t.category,
            type: t.type,
            amount: t.amount,
          });
        }
      });
      setSuggestions(demoList);
      return;
    }

    let localList: TransactionSuggestion[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        localList = JSON.parse(stored);
      }
    } catch {
      // Ignora falhas de parsing
    }

    if (localList.length > 0) {
      setSuggestions(localList);
    }

    // 2. Busca do servidor em segundo plano
    if (user) {
      fetch('/api/transactions/suggestions', { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : []))
        .then((serverData: TransactionSuggestion[]) => {
          if (Array.isArray(serverData) && serverData.length > 0) {
            const mergedMap = new Map<string, TransactionSuggestion>();
            serverData.forEach((s) => mergedMap.set(s.title.toLowerCase(), s));
            localList.forEach((s) => {
              if (!mergedMap.has(s.title.toLowerCase())) {
                mergedMap.set(s.title.toLowerCase(), s);
              }
            });
            const finalList = Array.from(mergedMap.values());
            setSuggestions(finalList);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(finalList.slice(0, 60)));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [user, isDemoMode]);

  // 3. Mescla com lançamentos visíveis na tela
  useEffect(() => {
    if (!currentTransactions || currentTransactions.length === 0) return;

    setSuggestions((prev) => {
      const map = new Map<string, TransactionSuggestion>();
      currentTransactions.forEach((t) => {
        if (t.title?.trim()) {
          map.set(t.title.trim().toLowerCase(), {
            title: t.title.trim(),
            category: t.category,
            type: t.type,
            amount: t.amount,
          });
        }
      });
      prev.forEach((s) => {
        const key = s.title.toLowerCase();
        if (!map.has(key)) {
          map.set(key, s);
        }
      });
      const updated = Array.from(map.values());
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 60)));
      } catch {}
      return updated;
    });
  }, [currentTransactions]);

  // 4. Salva nova sugestão imediatamente ao registrar um lançamento
  const addSuggestion = useCallback((item: TransactionSuggestion) => {
    setSuggestions((prev) => {
      const filtered = prev.filter((p) => p.title.toLowerCase() !== item.title.trim().toLowerCase());
      const updated = [{ ...item, title: item.title.trim() }, ...filtered].slice(0, 60);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { suggestions, addSuggestion };
}
