import { test, expect } from '@playwright/test';

test.describe('Reports', () => {
  test.beforeEach(async ({ page }) => {
    // Enter demo mode before each test
    await page.goto('/login');
    await page.click('text=Acessar Demonstração Interativa');
    await page.waitForURL('/');
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.click('text=Relatórios Anuais');
    await expect(page).toHaveURL('/reports');
    await expect(page.locator('text=Relatório Anual')).toBeVisible();
  });

  test('should display annual KPI cards', async ({ page }) => {
    await page.click('text=Relatórios Anuais');
    await expect(page.locator('text=Faturamento Anual')).toBeVisible();
    await expect(page.locator('text=Despesas Acumuladas')).toBeVisible();
    await expect(page.locator('text=Saldo do Exercício')).toBeVisible();
  });

  test('should display annual cash flow chart', async ({ page }) => {
    await page.click('text=Relatórios Anuais');
    await expect(page.locator('text=Fluxo de Caixa Anual')).toBeVisible();
  });

  test('should display annual summary table', async ({ page }) => {
    await page.click('text=Relatórios Anuais');
    await expect(page.locator('text=Mês')).toBeVisible();
    await expect(page.locator('text=Receitas')).toBeVisible();
    await expect(page.locator('text=Despesas')).toBeVisible();
  });

  test('should allow year navigation', async ({ page }) => {
    await page.click('text=Relatórios Anuais');
    const yearSelector = page.locator('text=2026');
    await expect(yearSelector).toBeVisible();
    
    // Click next year
    await page.click('button[title="Próximo ano"]');
    await page.waitForTimeout(500); // Wait for state update
  });

  test('should highlight best month and worst expense month', async ({ page }) => {
    await page.click('text=Relatórios Anuais');
    await expect(page.locator('text=Mês com Maior Economia')).toBeVisible();
    await expect(page.locator('text=Mês com Mais Gastos')).toBeVisible();
  });
});