import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('sign up page loads and form exists', async ({ page }) => {
    await page.goto('/signup');
    
    await expect(page).toHaveTitle(/IdeaVault/);
    
    // Check for sign up form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign up|가입|create/i });
    await expect(submitButton).toBeVisible();
  });

  test('sign in page loads and form exists', async ({ page }) => {
    await page.goto('/signin');
    
    await expect(page).toHaveTitle(/IdeaVault/);
    
    // Check for sign in form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign in|로그인|login/i });
    await expect(submitButton).toBeVisible();
  });

  test('form validation works', async ({ page }) => {
    await page.goto('/signin');
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in|로그인|login/i });
    await submitButton.click();
    
    // Check for validation messages (could be various implementations)
    const errorMessages = page.locator('[role="alert"], .error, .text-red-500, .text-destructive');
    const emailInput = page.locator('input[type="email"]');
    
    // Check if validation is triggered
    const isEmailInvalid = await emailInput.evaluate(el => !el.checkValidity());
    const hasErrorMessages = await errorMessages.count() > 0;
    
    expect(isEmailInvalid || hasErrorMessages).toBeTruthy();
  });

  test('password toggle functionality', async ({ page }) => {
    await page.goto('/signin');
    
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.locator('button[aria-label*="password"], button[type="button"]').filter({ hasText: /👁|eye|show|hide/ });
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      
      // After clicking toggle, password should be visible (type="text")
      await expect(page.locator('input[type="text"]')).toBeVisible();
    }
  });
});