import { test, expect } from '@playwright/test';

test('landing and dashboard load', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Practice interviews. Get structured feedback.' })).toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Your interview workspace' })).toBeVisible();
});

test('session setup loads', async ({ page }) => {
  await page.goto('/sessions/new');
  await expect(page.getByRole('heading', { name: 'Select a mode' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
});
