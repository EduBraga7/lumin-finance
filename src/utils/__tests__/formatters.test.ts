import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, formatDateDisplay, formatInputDate } from '../formatters';

describe('formatters', () => {
  describe('formatCurrency', () => {
    it('deve formatar valor numérico para padrão Real Brasileiro (BRL)', () => {
      const formatted = formatCurrency(1250.5);
      // Remove espaços inquebráveis para comparação segura entre ambientes
      const clean = formatted.replace(/\u00a0/g, ' ');
      expect(clean).toContain('R$');
      expect(clean).toContain('1.250,50');
    });

    it('deve formatar 0 quando receber NaN ou número inválido', () => {
      const formatted = formatCurrency(NaN);
      const clean = formatted.replace(/\u00a0/g, ' ');
      expect(clean).toContain('0,00');
    });
  });

  describe('formatPercentage', () => {
    it('deve formatar taxa percentual com precisão configurável', () => {
      expect(formatPercentage(33.3333, 1)).toBe('33.3%');
      expect(formatPercentage(25, 0)).toBe('25%');
    });
  });

  describe('formatDateDisplay', () => {
    it('deve converter YYYY-MM-DD para DD/MM/YYYY', () => {
      expect(formatDateDisplay('2026-09-18')).toBe('18/09/2026');
      expect(formatDateDisplay('2026-09-18T12:00:00.000Z')).toBe('18/09/2026');
    });

    it('deve retornar string vazia para entrada indefinida', () => {
      expect(formatDateDisplay(undefined)).toBe('');
    });
  });

  describe('formatInputDate', () => {
    it('deve formatar Date para YYYY-MM-DD', () => {
      const d = new Date(2026, 8, 18); // mês 8 é Setembro
      expect(formatInputDate(d)).toBe('2026-09-18');
    });
  });
});
