import { test, expect } from '@playwright/test';

test.describe('Transactions', () => {
  test.beforeEach(async ({ page }) => {
    // Enter demo mode before each test
    await page.goto('/login');
    await page.click('text=Acessar Demonstração Interativa');
    await page.waitForURL('/');
  });

  test('should navigate to transactions page', async ({ page }) => {
    await page.click('text=Lançamentos');
    await expect(page).toHaveURL('/transactions');
    await expect(page.locator('text=Extrato de Movimentações')).toBeVisible();
  });

  test('should display transaction summary cards', async ({ page }) => {
    await page.click('text=Lançamentos');
    await expect(page.locator('text=Receitas')).toBeVisible();
    await expect(page.locator('text=Despesas')).toBeVisible();
    await expect(page.locator('text=Saldo Líquido')).toBeVisible();
  });

  test('should display quick add bar', async ({ page }) => {
    await page.click('text=Lançamentos');
    await expect(page.locator('placeholder="Digite algo como: Almoço 65 alimentacao hoje"')).toBeVisible();
  });

  test('should display transaction filters', async ({ page }) => {
    await page.click('text=Lançamentos');
    await expect(page.locator('text=Todas')).toBeVisible();
    await expect(page.locator('text=Receitas')).toBeVisible();
    await expect(page.locator('text=Despesas')).toBeVisible();
  });

  test('should open new transaction modal', async ({ page }) => {
    await page.click('text=Lançamentos');
    await page.click('text=Novo Lançamento');
    await expect(page.locator('text=Nova Transação')).toBeVisible();
  });

  test('should filter transactions by type', async ({ page }) => {
    await page.click('text=Lançamentos');
    await page.click('text=Receitas');
    await page.waitForTimeout(500);
    // Verify filter is applied
    const activeFilter = page.locator('.filter-tab.active');
    await expect(activeFilter).toContainText('Receitas');
  });
});