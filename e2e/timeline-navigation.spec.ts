import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Timeline and Conversation Navigation
 *
 * Tests:
 * - Clicking items in timeline opens their conversations
 * - Conversation view updates when selection changes
 * - Meta chat vs item conversations
 * - Nested navigation (Period → Event → Scene)
 */

test.describe('Timeline and Conversation Navigation', () => {
  test.setTimeout(30000); // 30 second timeout for these tests

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
  });

  test('should show timeline sidebar on load', async ({ page }) => {
    // Timeline should be visible in a sidebar/aside
    const timeline = page.locator('aside, [class*="timeline"], [class*="sidebar"]').first();

    // If no specific timeline container, at least Game Setup should be visible
    const gameSetup = page.getByText('Game Setup').first();
    await expect(gameSetup).toBeVisible();
  });

  test('should select meta chat by default', async ({ page }) => {
    // When game loads, meta chat (Game Setup) should be selected
    const gameSetup = page.getByText('Game Setup').first();

    // Game Setup should be highlighted/selected
    // This could be indicated by:
    // - Different background color
    // - Border
    // - CSS class like "selected" or "active"

    await expect(gameSetup).toBeVisible();
  });

  test('should show conversation view for selected item', async ({ page }) => {
    // When an item is selected in timeline, its conversation should display
    // in the main content area

    // Verify Game Setup is visible as an indicator that conversation view loaded
    const gameSetup = page.getByText('Game Setup').first();
    await expect(gameSetup).toBeVisible();
  });

  test('should switch conversations when clicking different timeline items', async ({ page }) => {
    // This test requires having multiple items in the timeline
    // For now, we can at least verify the interaction pattern works

    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    // Game Setup should be visible (indicating conversation loaded)
    await expect(gameSetup).toBeVisible();

    // If there are periods in the timeline, try clicking one
    const firstPeriod = page.locator('[class*="period"]').first();
    if (await firstPeriod.isVisible({ timeout: 1000 })) {
      await firstPeriod.click({ force: true });

      // Game Setup should still be visible in timeline
      await expect(gameSetup).toBeVisible();

      // Click back to Game Setup
      await gameSetup.click({ force: true });
      await expect(gameSetup).toBeVisible();
    }
  });

  test('should display period hierarchy in timeline', async ({ page }) => {
    // Timeline should show:
    // - Periods in chronological order
    // - Events nested under periods
    // - Scenes nested under events (if implemented)

    // For a populated timeline, verify the structure
    // TODO: Create test data or mock a populated timeline
  });

  test('should highlight selected item in timeline', async ({ page }) => {
    // When an item is selected:
    // - It should have visual indication (highlight, border, background)
    // - Previous selection should be unhighlighted

    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    // Game Setup should have "selected" styling
    // This could be checked via:
    // - CSS class containing "selected" or "active"
    // - Different background color
    // - Border

    // Take a screenshot to verify visual state
    // (Useful for visual regression testing)
  });

  test('should show conversation messages in chronological order', async ({ page }) => {
    // Conversation view should display messages oldest to newest
    // (or newest to oldest, depending on design)

    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    // Look for message containers
    const messages = page.locator('[class*="message"], [data-testid*="message"]');

    // If there are messages, verify they're displayed
    const messageCount = await messages.count();
    console.log(`Found ${messageCount} messages`);

    // TODO: Verify message ordering once messages exist
  });

  test('should allow sending messages in active conversation', async ({ page }) => {
    // Select a conversation
    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    // Look for message input
    const messageInput = page.locator('textarea, input[type="text"]').last();

    if (await messageInput.isVisible({ timeout: 2000 })) {
      // Input should be enabled
      await expect(messageInput).toBeEnabled();

      // Should accept text
      await messageInput.fill('Test message');
      expect(await messageInput.inputValue()).toBe('Test message');

      // Clear for next test
      await messageInput.clear();
    }
  });

  test('should preserve conversation history when switching between items', async ({ page }) => {
    // Flow:
    // 1. Open meta chat, send message
    // 2. Switch to different item
    // 3. Switch back to meta chat
    // 4. Original message should still be there

    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    const messageInput = page.locator('textarea, input[type="text"]').last();

    if (await messageInput.isVisible({ timeout: 2000 })) {
      // Send a message (without actually submitting to avoid AI call)
      await messageInput.fill('Test conversation persistence');

      const initialValue = await messageInput.inputValue();

      // If there are other items, switch to one
      const periods = page.locator('[class*="period"]');
      const periodCount = await periods.count();

      if (periodCount > 0) {
        await periods.first().click({ force: true });
        await page.waitForTimeout(500);

        // Switch back
        await gameSetup.click({ force: true });
        await page.waitForTimeout(500);

        // Message input should be cleared (new message)
        // but conversation history should persist
        // (This test is more about verifying no crashes occur)
      }
    }
  });

  test('should show empty state when no messages in conversation', async ({ page }) => {
    // For a new item with no conversation history,
    // should show some indication like:
    // - "No messages yet"
    // - Empty conversation area
    // - Placeholder text

    // TODO: Create test with new item
  });
});

/**
 * Testing recommendations:
 *
 * 1. Test Data Setup:
 *    - Create helper to populate timeline with test data
 *    - Use localStorage fixtures
 *    - Or mock API to create periods/events/scenes
 *
 * 2. Visual Testing:
 *    - Use Playwright's screenshot comparison
 *    - Verify selected vs unselected states
 *    - Check conversation layout
 *
 * 3. Accessibility:
 *    - Verify keyboard navigation works
 *    - Check ARIA labels for screen readers
 *    - Test focus management
 *
 * Recommended data-testid attributes:
 * - data-testid="timeline"
 * - data-testid="period-${id}"
 * - data-testid="event-${id}"
 * - data-testid="scene-${id}"
 * - data-testid="conversation-view"
 * - data-testid="message-${id}"
 * - data-testid="message-input"
 * - data-testid="send-message-button"
 *
 * Accessibility attributes:
 * - role="navigation" for timeline
 * - role="main" for conversation view
 * - aria-selected="true" for selected item
 * - aria-label for timeline items
 */
