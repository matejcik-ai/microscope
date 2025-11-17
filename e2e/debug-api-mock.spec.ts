import { test, expect } from '@playwright/test';
import { mockClaudeAPI, navigateToMetaChat, sendMessage } from './helpers/api-mock';

/**
 * Minimal test to debug API mocking
 */

test.describe('Debug API Mock', () => {
  test('minimal API mock test', async ({ page, context }) => {
    // Set up localStorage BEFORE navigating
    await context.addInitScript(() => {
      localStorage.setItem(
        'api-settings',
        JSON.stringify({
          provider: 'claude',
          apiKey: 'sk-test-key-12345-do-not-use-in-production',
          model: 'claude-3-5-sonnet-20241022',
        })
      );
    });

    // Mock the /api/models endpoint (needed for API Settings modal)
    await page.route('**/api/models', async (route) => {
      console.log('📦 Models API intercepted');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          claude: [
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', recommended: true }
          ],
          openai: []
        }),
      });
    });

    // Set up API route interception with logging
    await mockClaudeAPI(page, 'CREATE PERIOD Test Period TONE light DESCRIPTION A test period for debugging');

    // Add logging to the mock
    await page.route('**/api/ai/chat', async (route) => {
      console.log('🎯 API ROUTE INTERCEPTED!');
      console.log('Request URL:', route.request().url());
      console.log('Request method:', route.request().method());

      const requestBody = await route.request().postDataJSON().catch(() => null);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: 'CREATE PERIOD Test Period TONE light DESCRIPTION A test period for debugging'
        }),
      });

      console.log('✅ Response sent');
    });

    // Navigate to the game
    await page.goto('/game');
    console.log('📍 Page loaded');

    // Wait for loading to complete
    await expect(page.getByText('Loading game...')).not.toBeVisible({ timeout: 10000 });
    console.log('✅ Loading complete');

    // Use the helper to navigate to meta chat (handles API modal if it appears)
    await navigateToMetaChat(page);
    console.log('✅ Navigated to meta chat');

    // Send a message using the helper
    await sendMessage(page, 'Create a test period', true);
    console.log('✅ Message sent');

    // Check if the message appears in chat
    const userMessage = page.getByText('Create a test period');
    const isMessageVisible = await userMessage.isVisible().catch(() => false);
    console.log('📝 User message visible:', isMessageVisible);

    // Check if AI response appears
    await page.waitForTimeout(2000);
    const aiResponse = page.getByText(/Test Period/i);
    const isResponseVisible = await aiResponse.isVisible().catch(() => false);
    console.log('🤖 AI response visible:', isResponseVisible);

    // Check if period was created
    const period = page.getByText('Test Period');
    const isPeriodVisible = await period.isVisible().catch(() => false);
    console.log('📅 Period visible:', isPeriodVisible);

    // CHECK FOR META CHAT MESSAGE (Issue #11)
    const metaChatMessage = page.getByText(/Created period.*Test Period/i);
    const isMetaChatMessageVisible = await metaChatMessage.isVisible().catch(() => false);
    console.log('💬 Meta chat message visible:', isMetaChatMessageVisible);

    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'test-results/debug-api-mock.png', fullPage: true });
    console.log('📸 Screenshot saved');

    // This test is just for debugging, so we don't assert anything
    // We just want to see the console output
  });
});
