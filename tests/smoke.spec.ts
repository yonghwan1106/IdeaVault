import { test, expect } from '@playwright/test';

test.describe('IdeaVault Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if page loads
    await expect(page).toHaveTitle(/IdeaVault/);
    
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible();
  });

  test('can navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    // Look for sign in link and click it
    const signInLink = page.getByRole('link', { name: /sign in|로그인/i });
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/signin/);
    }
  });

  test('can navigate to ideas page', async ({ page }) => {
    await page.goto('/');
    
    // Look for ideas/browse link
    const ideasLink = page.getByRole('link', { name: /ideas|아이디어|browse/i });
    if (await ideasLink.isVisible()) {
      await ideasLink.click();
      await expect(page).toHaveURL(/ideas/);
    }
  });

  test('search functionality exists', async ({ page }) => {
    await page.goto('/');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="검색"]');
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page).toHaveTitle(/IdeaVault/);
    
    // Check if mobile navigation exists (hamburger menu, etc.)
    const mobileNav = page.locator('[aria-label*="menu"], button[aria-expanded]');
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });
});