import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect to login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('should show demo mode button on login page', async ({ page }) => {
    await page.goto('/login');
    const demoButton = page.getByText('Acessar Demonstração Interativa');
    await expect(demoButton).toBeVisible();
  });

  test('should enter demo mode and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Acessar Demonstração Interativa');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('Resumo');
  });

  test('should show demo banner in demo mode', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Acessar Demonstração Interativa');
    const demoBanner = page.locator('[class*="demo"]');
    await expect(demoBanner).toBeVisible();
  });
});