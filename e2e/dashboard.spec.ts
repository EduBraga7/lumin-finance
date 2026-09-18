import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Enter demo mode before each test
    await page.goto('/login');
    await page.click('text=Acessar Demonstração Interativa');
    await page.waitForURL('/');
  });

  test('should display dashboard metrics', async ({ page }) => {
    await expect(page.locator('text=Saldo Atual')).toBeVisible();
    await expect(page.locator('text=Receitas')).toBeVisible();
    await expect(page.locator('text=Despesas')).toBeVisible();
  });

  test('should display AI Advisor card', async ({ page }) => {
    await expect(page.locator('text=AI Advisor')).toBeVisible();
    await expect(page.locator('text=Diagnóstico')).toBeVisible();
  });

  test('should display category expense chart', async ({ page }) => {
    await expect(page.locator('text=Gastos por Categoria')).toBeVisible();
    await expect(page.locator('text=Total Saídas')).toBeVisible();
  });

  test('should allow month navigation', async ({ page }) => {
    const monthSelector = page.locator('[class*="month-selector"]');
    await expect(monthSelector).toBeVisible();
    
    // Click next month
    await page.click('button[title="Próximo mês"]');
    await page.waitForTimeout(500); // Wait for state update
  });

  test('should show category drilldown when clicking category', async ({ page }) => {
    // Click on a category in the chart
    await page.click('.category-rank-item', { timeout: 5000 });
    
    // Check if drilldown modal appears
    await expect(page.locator('text=Detalhamento')).toBeVisible({ timeout: 5000 });
  });
});