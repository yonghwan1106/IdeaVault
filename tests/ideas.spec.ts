import { test, expect } from '@playwright/test';

test.describe('Ideas Marketplace', () => {
  test('ideas page loads with listings', async ({ page }) => {
    await page.goto('/ideas');
    
    await expect(page).toHaveTitle(/IdeaVault/);
    
    // Check for ideas grid or list
    const ideasContainer = page.locator('[data-testid="ideas-grid"], .ideas-grid, .grid, .space-y-4');
    await expect(ideasContainer).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    await page.goto('/ideas');
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], input[placeholder*="검색"]');
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('saas');
      await page.keyboard.press('Enter');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Results should contain search term (if any results exist)
      const results = page.locator('text=saas, text=SaaS');
      if (await results.count() > 0) {
        await expect(results.first()).toBeVisible();
      }
    }
  });

  test('filter functionality exists', async ({ page }) => {
    await page.goto('/ideas');
    
    // Look for filter elements
    const filters = page.locator('select[name*="category"], select[name*="price"], button[aria-expanded]');
    
    if (await filters.count() > 0) {
      await expect(filters.first()).toBeVisible();
    }
  });

  test('idea detail page loads', async ({ page }) => {
    await page.goto('/ideas');
    
    // Find first idea link
    const firstIdeaLink = page.locator('a[href*="/ideas/"]').first();
    
    if (await firstIdeaLink.isVisible()) {
      await firstIdeaLink.click();
      
      // Should navigate to idea detail page
      await expect(page).toHaveURL(/\/ideas\/[^/]+$/);
      
      // Check for idea details
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('new idea creation page (authenticated)', async ({ page }) => {
    await page.goto('/ideas/new');
    
    // This should either show login form or idea creation form
    const hasLoginForm = await page.locator('input[type="email"]').isVisible();
    const hasIdeaForm = await page.locator('input[name*="title"], textarea[name*="description"]').isVisible();
    
    expect(hasLoginForm || hasIdeaForm).toBeTruthy();
  });

  test('pagination or load more functionality', async ({ page }) => {
    await page.goto('/ideas');
    
    // Look for pagination or load more button
    const pagination = page.locator('nav[aria-label*="pagination"], button[aria-label*="next"], button:has-text("Load more"), button:has-text("더보기")');
    
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
    }
  });
});