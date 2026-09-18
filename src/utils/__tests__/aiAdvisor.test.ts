import { describe, it, expect } from 'vitest';
import { getCategoryNature, generateAiDiagnosisFromData } from '../aiAdvisor';

describe('aiAdvisor', () => {
  describe('getCategoryNature', () => {
    it('deve classificar cursos e livros como human_capital', () => {
      expect(getCategoryNature('Educação')).toBe('human_capital');
      expect(getCategoryNature('Curso de Programação')).toBe('human_capital');
      expect(getCategoryNature('Livros e Estudos')).toBe('human_capital');
      expect(getCategoryNature('Workshop Técnico')).toBe('human_capital');
    });

    it('deve classificar saúde, moradia e alimentação como essential', () => {
      expect(getCategoryNature('Saúde')).toBe('essential');
      expect(getCategoryNature('Farmácia')).toBe('essential');
      expect(getCategoryNature('Aluguel')).toBe('essential');
      expect(getCategoryNature('Supermercado')).toBe('essential');
      expect(getCategoryNature('Transporte')).toBe('essential');
    });

    it('deve classificar lazer e compras como lifestyle', () => {
      expect(getCategoryNature('Lazer')).toBe('lifestyle');
      expect(getCategoryNature('Restaurante')).toBe('lifestyle');
      expect(getCategoryNature('Delivery')).toBe('lifestyle');
    });

    it('deve classificar investimentos e dívidas como financial', () => {
      expect(getCategoryNature('Investimentos')).toBe('financial');
      expect(getCategoryNature('Reserva de Emergência')).toBe('financial');
      expect(getCategoryNature('Empréstimo')).toBe('financial');
    });
  });

  describe('generateAiDiagnosisFromData', () => {
    it('deve emitir status de aviso quando não houver transações', () => {
      const diag = generateAiDiagnosisFromData(
        { totalIncome: 0, totalExpense: 0, balance: 0, expensesByCategory: {} },
        9,
        2026
      );
      expect(diag.status).toBe('warning');
      expect(diag.statusText).toBe('Sem Movimentações');
    });

    it('deve emitir status critical quando houver déficit', () => {
      const diag = generateAiDiagnosisFromData(
        {
          totalIncome: 3000,
          totalExpense: 4500,
          balance: -1500,
          expensesByCategory: { 'Moradia': 2500, 'Alimentação': 2000 }
        },
        9,
        2026
      );
      expect(diag.status).toBe('critical');
      expect(diag.statusText).toBe('Déficit no Período');
      expect(diag.insights.some(i => i.title.includes('Queima de Caixa'))).toBe(true);
    });

    it('deve emitir status excellent quando taxa de poupança for >= 30%', () => {
      const diag = generateAiDiagnosisFromData(
        {
          totalIncome: 10000,
          totalExpense: 6000,
          balance: 4000,
          expensesByCategory: { 'Moradia': 3000, 'Educação': 1500, 'Alimentação': 1500 }
        },
        9,
        2026
      );
      expect(diag.status).toBe('excellent');
      expect(diag.statusText).toBe('Poupança de Alto Nível');
      expect(diag.metrics?.savingsRate).toBe(40);
      expect(diag.metrics?.humanCapitalInvestment).toBe(1500);
      expect(diag.metrics?.projectedWealth12m).toBeGreaterThan(4000 * 12);
    });
  });
});
