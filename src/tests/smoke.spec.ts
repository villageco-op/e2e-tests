import { test, expect } from '@playwright/test';

test.describe('App Smoke Test', () => {
  test('should_load_the_homepage_successfully', async ({ page }) => {
    await page.goto('/');

    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
  });

  test('should_not_have_severe_console_errors', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') logs.push(msg.text());
    });

    await page.goto('/');

    expect(logs).not.toContain(expect.stringContaining('404'));
  });

  test('login page should load successfully', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome to the Village' })).toBeVisible();
  });

  test('contact page should load successfully', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: 'Get in touch' })).toBeVisible();
  });

  test('buyer browse page should load successfully', async ({ page }) => {
    await page.goto('/buyer/browse');
    await expect(page.getByRole('heading', { name: 'Browse Produce' })).toBeVisible();
  });

  test('buyer help page should load successfully', async ({ page }) => {
    await page.goto('/buyer/help');
    await expect(page.getByRole('heading', { name: 'Buyer Support' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Your Name *' })).toBeVisible();
  });

  test('become seller page should load successfully', async ({ page }) => {
    await page.goto('/become-seller');
    await expect(page.getByRole('heading', { name: 'Become a Seller & Grower' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Accept Online Payments' })).toBeVisible();
  });
});
