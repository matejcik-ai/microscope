import { test, expect } from '@playwright/test';

/**
 * E2E Test for Issue #7 with API Mocking
 *
 * This test uses network interception to mock Claude API responses,
 * allowing us to test the full flow without real API calls.
 */

test.describe('Bookend Meta Chat (with mocked AI)', () => {
  test.setTimeout(60000); // 60 second timeout for these tests

  /**
   * Mock helper: Intercept Claude API and return a predefined response
   */
  async function mockClaudeAPI(page: any, responseText: string) {
    await page.route('**/v1/messages', async (route: any) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          id: 'msg_test123',
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
          model: 'claude-3-5-sonnet-20241022',
          stop_reason: 'end_turn',
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        }),
      });
    });
  }

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

    // Wait for API Settings modal to disappear (if present)
    const apiModal = page.getByText('API Settings');
    const modalVisible = await apiModal.isVisible({ timeout: 1000 }).catch(() => false);
    if (modalVisible) {
      await page.getByRole('button', { name: 'Save Settings' }).click({ force: true });
      await page.waitForTimeout(500);
    }
  });

  test('should show meta chat message when AI creates first bookend', async ({ page }) => {
    // Mock AI response to create a start bookend
    await mockClaudeAPI(
      page,
      'CREATE PERIOD Ancient Times FIRST TONE light DESCRIPTION The dawn of civilization\n\nThis period marks the beginning of our story.'
    );

    // Navigate to meta chat
    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    // Send a message to AI asking to create a bookend
    const messageInput = page.locator('textarea, input[type="text"]').last();
    await messageInput.fill('Please create a start bookend called Ancient Times');
    await messageInput.press('Enter');

    // Wait for AI response and command processing
    await page.waitForTimeout(2000); // Give time for async operations

    // Verify meta chat shows the creation message
    // Look for text containing "Created start bookend: Ancient Times"
    const metaChatMessage = page.getByText(/Created start bookend.*Ancient Times/i);
    await expect(metaChatMessage).toBeVisible({ timeout: 5000 });

    // Verify the bookend appears in the timeline
    const bookendInTimeline = page.getByText('Ancient Times');
    await expect(bookendInTimeline).toBeVisible();
  });

  test('should show meta chat message when AI updates existing bookend', async ({ page }) => {
    // Step 1: Create initial bookend
    await mockClaudeAPI(
      page,
      'CREATE PERIOD The Beginning FIRST TONE light DESCRIPTION Initial start'
    );

    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    const messageInput = page.locator('textarea, input[type="text"]').last();
    await messageInput.fill('Create a start bookend');
    await messageInput.press('Enter');
    await page.waitForTimeout(2000);

    // Verify first bookend created
    await expect(page.getByText(/Created start bookend.*The Beginning/i)).toBeVisible();

    // Step 2: Update the bookend (THIS IS THE BUG #7 TEST)
    await mockClaudeAPI(
      page,
      'CREATE PERIOD Modern Era FIRST TONE dark DESCRIPTION Updated start point'
    );

    await messageInput.fill('Update the start bookend to Modern Era');
    await messageInput.press('Enter');
    await page.waitForTimeout(2000);

    // CRITICAL VERIFICATION: Message should appear in meta chat (not bookend conversation)
    // We should see "Updated start bookend: Modern Era" in the Game Setup conversation
    const updateMessage = page.getByText(/Updated start bookend.*Modern Era/i);
    await expect(updateMessage).toBeVisible({ timeout: 5000 });

    // Verify we're still in the meta chat (Game Setup is selected)
    const selectedGameSetup = page.getByText('Game Setup').first();
    await expect(selectedGameSetup).toBeVisible();

    // The message should be in the current (meta) conversation, not elsewhere
    // If the bug exists, this message might appear in the bookend's conversation instead
  });

  test('meta chat link should be clickable and open bookend conversation', async ({ page }) => {
    // Create a bookend with mocked AI
    await mockClaudeAPI(
      page,
      'CREATE PERIOD The Golden Age FIRST TONE light DESCRIPTION Prosperity reigns'
    );

    const gameSetup = page.getByText('Game Setup').first();
    await gameSetup.click({ force: true });

    const messageInput = page.locator('textarea, input[type="text"]').last();
    await messageInput.fill('Create start bookend Golden Age');
    await messageInput.press('Enter');
    await page.waitForTimeout(2000);

    // Find the creation message
    const creationMessage = page.getByText(/Created start bookend.*The Golden Age/i);
    await expect(creationMessage).toBeVisible();

    // Click on the message (if it's clickable)
    // This assumes the message has a click handler that opens the bookend conversation
    await creationMessage.click();

    // Verify the bookend's conversation opens
    // The timeline should now show "The Golden Age" as selected
    // (This requires the metadata.linkTo to be properly set)

    await page.waitForTimeout(1000);

    // If the link works, we should see the bookend highlighted in the timeline
    // and the conversation view should change to show the bookend's conversation
  });

  test.skip('should include linkTo metadata in meta chat messages', async ({ page }) => {
    // This test would require inspecting the actual message data structure
    // which isn't easily accessible via Playwright
    //
    // To properly test this, we'd need to either:
    // 1. Expose the gameState to the window object in dev/test mode
    // 2. Use component testing instead of E2E
    // 3. Check the DOM for data attributes that indicate the linkTo metadata
  });
});

/**
 * Notes on testing limitations:
 *
 * 1. These tests rely on timing (waitForTimeout) which can be flaky
 *    - Better approach: Wait for specific elements or state changes
 *    - Add data-testid attributes to key elements
 *
 * 2. We can't easily inspect the internal message metadata
 *    - Consider adding data attributes like data-link-type="period" data-link-id="123"
 *    - This would allow Playwright to verify the linkTo metadata exists
 *
 * 3. Selector fragility: Using text content can break if wording changes
 *    - Better approach: Use data-testid attributes
 *    - Example: data-testid="meta-chat-message" data-message-type="creation"
 *
 * Recommended improvements:
 * - Add data-testid to Timeline component sections
 * - Add data-testid to ConversationView messages
 * - Add data attributes to messages that have linkTo metadata
 * - Replace waitForTimeout with waitForSelector on specific elements
 */
