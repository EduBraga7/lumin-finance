"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DashboardData, Transaction, CategoryRankingItem } from '@/types/finance';
import { AiDiagnosis, generateAiDiagnosisFromData } from '@/utils/aiAdvisor';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/constants/categories';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useDashboard(month: number, year: number) {
  const { session } = useAuth();
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
      const dashToUse = currentDash !== undefined ? currentDash : dashboardRef.current;
      if (!dashToUse) return;

      setLoadingAi(true);

      try {
        const refreshParam = forceRefresh ? '&refresh=true' : '';
        const res = await fetch(
          `${API_URL}/api/ai/advisor?month=${month}&year=${year}${refreshParam}`,
          {
            headers: { Authorization: `Bearer ${session?.access_token}` },
          }
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
    [session, month, year]
  );

  const fetchDashboard = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);

    try {
      const [dashRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/transactions/dashboard?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        fetch(`${API_URL}/api/transactions?month=${month}&year=${year}&status=paid`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
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

      if (dashData) {
        fetchAiDiagnosis(dashData);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [session, month, year, fetchAiDiagnosis]);

  useEffect(() => {
    fetchDashboard();
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
