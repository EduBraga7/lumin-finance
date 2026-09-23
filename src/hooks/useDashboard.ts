"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardData, Transaction, CategoryRankingItem } from '@/types/finance';
import { AiDiagnosis, generateAiDiagnosisFromData } from '@/utils/aiAdvisor';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/constants/categories';
import { DEMO_DASHBOARD, DEMO_TRANSACTIONS, DEMO_AI_DIAGNOSIS } from '@/utils/demoData';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useDashboard(month: number, year: number, enableAi = true) {
  const { user, isDemoMode } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [aiDiagnosis, setAiDiagnosis] = useState<AiDiagnosis | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const dashboardRef = useRef<DashboardData | null>(null);
  useEffect(() => {
    dashboardRef.current = dashboard;
  }, [dashboard]);

  const fetchAiDiagnosis = useCallback(
    async (currentDash?: DashboardData | null, forceRefresh = false) => {
      // Modo demo: retorna diagnóstico mockado
      if (isDemoMode) {
        setAiDiagnosis(DEMO_AI_DIAGNOSIS);
        return;
      }

      const dashToUse = currentDash !== undefined ? currentDash : dashboardRef.current;
      if (!dashToUse) return;

      setLoadingAi(true);

      try {
        const refreshParam = forceRefresh ? '&refresh=true' : '';
        const res = await fetch(
          `${API_URL}/api/ai/advisor?month=${month}&year=${year}${refreshParam}`,
          { credentials: 'include' }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.summary) {
            setAiDiagnosis({
              status: data.status || 'good',
              statusText: data.statusText || data.status_text || 'Orçamento Equilibrado',
              summary: data.summary,
              insights: Array.isArray(data.insights) ? data.insights : [],
              aiAdviceText: data.advice,
              cached: !!data.cached,
              updatedAt: data.updated_at,
            });
            return;
          }
        }

        // Fallback determinístico local
        const local = generateAiDiagnosisFromData(dashToUse, month, year);
        setAiDiagnosis(local);
      } catch {
        const local = generateAiDiagnosisFromData(dashToUse, month, year);
        setAiDiagnosis(local);
      } finally {
        setLoadingAi(false);
      }
    },
    [isDemoMode, month, year]
  );

  const fetchDashboard = useCallback(async () => {
    if (!user) return;

    // Modo demo: retorna dados mockados para setembro/2026; outros meses retornam vazio
    if (isDemoMode) {
      if (month === 9 && year === 2026) {
        setDashboard(DEMO_DASHBOARD);
        const filtered = DEMO_TRANSACTIONS.filter((t) => {
          const d = new Date(t.date);
          return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
        });
        setMonthTransactions(filtered);
        setAiDiagnosis(DEMO_AI_DIAGNOSIS);
      } else {
        setDashboard({ totalIncome: 0, totalExpense: 0, balance: 0, expensesByCategory: {} });
        setMonthTransactions([]);
        setAiDiagnosis(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const [dashRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/transactions/dashboard?month=${month}&year=${year}`, {
          credentials: 'include',
        }),
        fetch(`${API_URL}/api/transactions?month=${month}&year=${year}`, {
          credentials: 'include',
        }),
      ]);

      let dashData: DashboardData | null = null;

      if (dashRes.ok) {
        dashData = await dashRes.json();
        setDashboard(dashData);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setMonthTransactions(Array.isArray(txData) ? txData : []);
      }

      if (dashData && enableAi) {
        fetchAiDiagnosis(dashData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isDemoMode, month, year, enableAi, fetchAiDiagnosis]);

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      await Promise.resolve();
      if (!ignore) {
        fetchDashboard();
      }
    };
    run();
    return () => {
      ignore = true;
    };
  }, [fetchDashboard]);

  const pieData = useMemo(() => {
    if (!dashboard || !dashboard.expensesByCategory) return [];
    return Object.entries(dashboard.expensesByCategory).map(([name, value]) => ({
      name,
      value: Number(value) || 0,
    }));
  }, [dashboard]);

  const categoryRanking = useMemo((): CategoryRankingItem[] => {
    if (!dashboard || !dashboard.expensesByCategory) return [];
    const total = dashboard.totalExpense || 1;
    return Object.entries(dashboard.expensesByCategory)
      .map(([name, val]) => {
        const amount = Number(val) || 0;
        return {
          name,
          amount,
          percentage: (amount / total) * 100,
          color: CATEGORY_COLORS[name] || '#6b7280',
          emoji: CATEGORY_EMOJIS[name] || '🏷️',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [dashboard]);

  return {
    dashboard,
    monthTransactions,
    loading,
    aiDiagnosis,
    loadingAi,
    pieData,
    categoryRanking,
    fetchDashboard,
    refreshAi: () => fetchAiDiagnosis(dashboard, true),
  };
}
