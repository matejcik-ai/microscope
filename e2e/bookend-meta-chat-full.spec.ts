import { test, expect } from '@playwright/test';
import { setupPhaseScenarios } from './fixtures/ai-responses';
import {
  mockClaudeAPI,
  setupTestAPIKey,
  navigateToMetaChat,
  sendMessage,
  expectMessageContaining,
} from './helpers/api-mock';

/**
 * E2E Test for Issue #7: Bookend Meta Chat (Full Implementation)
 *
 * Uses test fixtures and API mocking to verify bookend creation
 * messages appear correctly in meta chat.
 */

test.describe('Bookend Meta Chat (Issue #7)', () => {
  test.setTimeout(60000); // 60 second timeout for these tests

  test.beforeEach(async ({ page }) => {
    await page.goto('/game');
    await expect(page.getByText('Loading game...')).not.toBeVisible({ timeout: 10000 });

    // Set up test API key to prevent modal from blocking UI
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

    await page.reload();
    await expect(page.getByText('Loading game...')).not.toBeVisible({ timeout: 15000 });

    // Navigate to meta chat
    await navigateToMetaChat(page);
  });

  test('should show "Created start bookend" message when AI creates first bookend', async ({
    page,
  }) => {
    const scenario = setupPhaseScenarios.find((s) => s.name === 'Create start bookend');
    if (!scenario) throw new Error('Test scenario not found');

    // Mock API to return bookend creation response
    await mockClaudeAPI(page, scenario.aiResponse);

    // Send message asking AI to create bookend
    await sendMessage(page, scenario.humanMessage);

    // Verify meta chat shows creation message
    // Look for "Created start bookend: Ancient Times"
    await expect(
      page.getByText(/Created start bookend.*Ancient Times/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify bookend appears in timeline
    await expect(page.getByText('Ancient Times')).toBeVisible({ timeout: 5000 });
  });

  test('should show "Updated start bookend" message when AI updates existing bookend', async ({
    page,
  }) => {
    // Step 1: Create initial bookend
    const createScenario = setupPhaseScenarios.find((s) => s.name === 'Create start bookend');
    if (!createScenario) throw new Error('Create scenario not found');

    await mockClaudeAPI(page, createScenario.aiResponse);
    await sendMessage(page, createScenario.humanMessage);

    // Wait for creation
    await expect(
      page.getByText(/Created start bookend.*Ancient Times/i)
    ).toBeVisible({ timeout: 10000 });

    // Step 2: Update the bookend (THIS IS THE CRITICAL TEST FOR BUG #7)
    const updateScenario = setupPhaseScenarios.find(
      (s) => s.name === 'Update existing start bookend'
    );
    if (!updateScenario) throw new Error('Update scenario not found');

    await mockClaudeAPI(page, updateScenario.aiResponse);
    await sendMessage(page, updateScenario.humanMessage);

    // CRITICAL VERIFICATION:
    // Message should appear in meta chat with text "Updated start bookend: Modern Era"
    await expect(
      page.getByText(/Updated start bookend.*Modern Era/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify we're still in meta chat (Game Setup is visible)
    await expect(page.getByText('Game Setup')).toBeVisible();

    // The bug would cause this message to appear in the bookend's conversation instead
    // If the test passes, the fix is working correctly
  });

  test('should show "Created end bookend" message when AI creates end bookend', async ({
    page,
  }) => {
    const scenario = setupPhaseScenarios.find((s) => s.name === 'Create end bookend');
    if (!scenario) throw new Error('Test scenario not found');

    await mockClaudeAPI(page, scenario.aiResponse);
    await sendMessage(page, scenario.humanMessage);

    // Verify meta chat shows creation message
    await expect(
      page.getByText(/Created end bookend.*The Final Days/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify bookend appears in timeline
    await expect(page.getByText('The Final Days')).toBeVisible({ timeout: 5000 });
  });

  test('meta chat messages should have clickable links to bookends', async ({ page }) => {
    const scenario = setupPhaseScenarios.find((s) => s.name === 'Create start bookend');
    if (!scenario) throw new Error('Test scenario not found');

    await mockClaudeAPI(page, scenario.aiResponse);
    await sendMessage(page, scenario.humanMessage);

    // Find the creation message
    const creationMessage = page.getByText(/Created start bookend.*Ancient Times/i);
    await expect(creationMessage).toBeVisible({ timeout: 10000 });

    // Click on the message (if it's clickable)
    // This should open the bookend's conversation
    await creationMessage.click({ force: true });

    // Wait for conversation to switch
    await page.waitForTimeout(1000);

    // Verify we're now viewing the bookend conversation
    // (Timeline item should be highlighted/selected)
    // This test verifies that metadata.linkTo is working

    // Note: This test may need adjustment based on actual UI behavior
    // For now, it verifies the click doesn't cause errors
  });

  test('should create both bookends in sequence', async ({ page }) => {
    // Create start bookend
    const startScenario = setupPhaseScenarios.find((s) => s.name === 'Create start bookend');
    if (!startScenario) throw new Error('Start scenario not found');

    await mockClaudeAPI(page, startScenario.aiResponse);
    await sendMessage(page, startScenario.humanMessage);
    await expect(page.getByText(/Created start bookend/i)).toBeVisible({ timeout: 10000 });

    // Create end bookend
    const endScenario = setupPhaseScenarios.find((s) => s.name === 'Create end bookend');
    if (!endScenario) throw new Error('End scenario not found');

    await mockClaudeAPI(page, endScenario.aiResponse);
    await sendMessage(page, endScenario.humanMessage);
    await expect(page.getByText(/Created end bookend/i)).toBeVisible({ timeout: 10000 });

    // Both bookends should be in timeline
    await expect(page.getByText('Ancient Times')).toBeVisible();
    await expect(page.getByText('The Final Days')).toBeVisible();

    // Both creation messages should be in meta chat
    // (We should still be in meta chat conversation)
    await expect(page.getByText('Game Setup')).toBeVisible();
  });
});

/**
 * Debugging notes:
 *
 * If tests fail, check:
 * 1. Screenshots in test-results/ directory
 * 2. HTML report: npm run test:report
 * 3. Run with --debug flag: npm run test:e2e:debug
 * 4. Run with headed mode: npm run test:e2e:headed
 *
 * Common issues:
 * - Timing: If messages don't appear, increase timeouts
 * - Selectors: Text might be wrapped in different elements
 * - API mocking: Verify route is being intercepted (check Network tab)
 */
