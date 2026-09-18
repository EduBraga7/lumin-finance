import { describe, it, expect } from 'vitest';
import { parseQuickAddInput } from '../quickAddParser';

describe('quickAddParser', () => {
  const currentMonth = 9;
  const currentYear = 2026;

  it('deve retornar inválido para texto vazio ou espaços em branco', () => {
    const result = parseQuickAddInput('', currentMonth, currentYear);
    expect(result.isValid).toBe(false);
    expect(result.amount).toBe(0);
  });

  it('deve extrair valor simples e categoria padrão Alimentação', () => {
    const result = parseQuickAddInput('Almoço 45', currentMonth, currentYear);
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(45);
    expect(result.type).toBe('expense');
    expect(result.category).toBe('Alimentação');
    expect(result.title).toContain('Almoço');
  });

  it('deve extrair valor com vírgula e formato R$', () => {
    const result = parseQuickAddInput('Uber para o centro R$ 32,50', currentMonth, currentYear);
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(32.5);
    expect(result.type).toBe('expense');
    expect(result.category).toBe('Transporte');
  });

  it('deve identificar receitas através de palavras-chave', () => {
    const result = parseQuickAddInput('Salário mensal 6500', currentMonth, currentYear);
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(6500);
    expect(result.type).toBe('income');
    expect(result.category).toBe('Salário');
  });

  it('deve interpretar "dia 15" e gerar a data correta no mês selecionado', () => {
    const result = parseQuickAddInput('Condomínio 650 dia 15', currentMonth, currentYear);
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(650);
    expect(result.date).toBe('2026-09-15');
    expect(result.category).toBe('Moradia');
  });

  it('deve interpretar "ontem" gerando data válida', () => {
    const result = parseQuickAddInput('Remédio 48 ontem', currentMonth, currentYear);
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(48);
    expect(result.category).toBe('Saúde');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('deve identificar gastos com educação como categoria Educação', () => {
    const result = parseQuickAddInput('Livro de finanças 89', currentMonth, currentYear);
    expect(result.isValid).toBe(true);
    expect(result.amount).toBe(89);
    expect(result.category).toBe('Educação');
  });
});
