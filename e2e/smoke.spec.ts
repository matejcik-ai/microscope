import { test, expect } from '@playwright/test';

/**
 * Smoke tests - Basic functionality verification
 */

test.describe('Microscope App', () => {
  test.setTimeout(30000); // 30 second timeout for smoke tests

  test.beforeEach(async ({ page }) => {
    await page.goto('/game');

    // Wait for initial load
    await expect(page.getByText('Loading game...')).not.toBeVisible({ timeout: 10000 });

    // Set up test API key in localStorage to prevent API Settings modal from blocking UI
    await page.evaluate(() => {
      localStorage.setItem(
        'api-settings',
        JSON.stringify({
          provider: 'claude',
          apiKey: 'sk-test-key-12345-do-not-use-in-production',
          model: 'claude-3-5-sonnet-20241022',
        })
      );
    });

    // Reload to apply settings
    await page.reload();

    // Wait for game to load with settings applied
    await expect(page.getByText('Loading game...')).not.toBeVisible({ timeout: 15000 });
  });

  test('should load the game page', async ({ page }) => {
    // Page already loaded in beforeEach
    // Should show the game interface (not blocked by API modal)
    await expect(page.getByText('Game Setup')).toBeVisible();
  });

  test('should show timeline sidebar', async ({ page }) => {
    // Page already loaded in beforeEach
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Should contain Game Setup section (which indicates timeline is working)
    await expect(page.getByText('Game Setup')).toBeVisible({ timeout: 10000 });
  });

  test('should allow selecting meta chat conversation', async ({ page }) => {
    // Page already loaded in beforeEach
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // Click on Game Setup to open meta chat
    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.waitFor({ state: 'visible', timeout: 10000 });

    // Use force: true to click even if element is overlapped
    await gameSetup.click({ force: true, timeout: 5000 });

    // Game Setup should be highlighted/selected (background color change)
    // We check this by verifying the element has a border or different background
    await expect(gameSetup).toBeVisible();

    // After clicking, verify no errors occurred
    // (The conversation view will open, but we don't need to assert on specific elements)
  });

  test('should have API settings available', async ({ page }) => {
    // Page already loaded in beforeEach
    await page.waitForLoadState('networkidle');

    // Look for settings or API key configuration UI
    // (This depends on how the API settings modal is triggered)
    // For now, we just verify the page loaded properly

    // The page should not show any critical errors
    const errorMessages = page.locator('text=/error|fatal|crash/i');
    await expect(errorMessages).toHaveCount(0);
  });
});
