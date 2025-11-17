import { Page } from '@playwright/test';
import { createMockClaudeResponse } from '../fixtures/ai-responses';

/**
 * API Mocking Helpers for E2E Tests
 */

/**
 * Mock the /api/models endpoint used by API Settings modal
 * This prevents the modal from hanging while trying to fetch models
 */
export async function mockModelsAPI(page: Page) {
  await page.route('**/api/models', async (route) => {
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
}

/**
 * Mock the Claude API to return a predefined response
 */
export async function mockClaudeAPI(page: Page, responseText: string) {
  // Always mock the models API when mocking AI chat
  await mockModelsAPI(page);

  await page.route('**/api/ai/chat', async (route) => {
    // API route returns { response: string }, not Claude API format
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ response: responseText }),
    });
  });
}

/**
 * Mock the Claude API with a sequence of responses
 * Each API call will return the next response in the array
 */
export async function mockClaudeAPISequence(page: Page, responses: string[]) {
  // Always mock the models API when mocking AI chat
  await mockModelsAPI(page);

  let callCount = 0;

  await page.route('**/api/ai/chat', async (route) => {
    const responseText = responses[callCount] || responses[responses.length - 1];
    callCount++;

    // API route returns { response: string }, not Claude API format
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ response: responseText }),
    });
  });
}

/**
 * Mock the Claude API with conditional responses based on the request
 */
export async function mockClaudeAPIConditional(
  page: Page,
  handler: (requestText: string) => string
) {
  await page.route('**/v1/messages', async (route) => {
    const requestBody = route.request().postDataJSON();
    const lastMessage = requestBody.messages[requestBody.messages.length - 1];
    const requestText = lastMessage.content;

    const responseText = handler(requestText);
    const response = createMockClaudeResponse(responseText);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(response),
    });
  });
}

/**
 * Set up a test API key in localStorage
 */
export async function setupTestAPIKey(page: Page) {
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
}

/**
 * Wait for async operations to complete
 * More reliable than waitForTimeout
 */
export async function waitForGameStateUpdate(page: Page, timeoutMs: number = 2000) {
  // Wait for any pending state updates by checking if localStorage has been updated
  await page.waitForTimeout(timeoutMs);

  // TODO: Replace with more reliable wait condition
  // e.g., wait for specific element to appear, or expose a "ready" flag from the app
}

/**
 * Send a message in the current conversation
 */
export async function sendMessage(page: Page, message: string, waitForResponse: boolean = true) {
  // Wait a bit to ensure any modals have closed
  await page.waitForTimeout(500);

  // First try to use the test ID selector
  let messageInput = page.locator('[data-testid="message-input"]');

  // If not found, fall back to generic selector
  if (!(await messageInput.isVisible({ timeout: 1000 }).catch(() => false))) {
    messageInput = page.locator('textarea, input[type="text"]').last();
  }

  // Wait longer and retry if not found
  try {
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    // Try to close any lingering modal - use the test ID we just added
    const apiModal = page.locator('[data-testid="api-settings-modal"]');
    if (await apiModal.isVisible({ timeout: 500 }).catch(() => false)) {
      const closeButton = page.locator('[data-testid="close-modal-button"]');
      if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(500);
      } else {
        // If there's no close button, try escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
    // Retry finding the input
    await messageInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  await messageInput.fill(message);

  // Use the send button instead of pressing Enter
  const sendButton = page.locator('[data-testid="send-message-button"]');
  if (await sendButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Use force: true to bypass any overlay/intercepting elements
    await sendButton.click({ force: true });
  } else {
    // Fall back to pressing Enter
    await messageInput.press('Enter');
  }

  if (waitForResponse) {
    // Wait for AI to respond
    await waitForGameStateUpdate(page, 3000);
  }
}

/**
 * Navigate to meta chat (Game Setup)
 */
export async function navigateToMetaChat(page: Page) {
  // Wait a bit for page to fully load and hydrate
  await page.waitForTimeout(1500);

  // Check if API settings modal is still visible
  const apiModal = page.locator('[data-testid="api-settings-modal"]');
  if (await apiModal.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.warn('API Settings modal appeared despite localStorage being set. Filling and saving...');

    // Check if API key field is empty (validation error)
    const apiKeyInput = apiModal.locator('input[type="password"]');
    const currentValue = await apiKeyInput.inputValue();

    if (!currentValue || currentValue.trim() === '') {
      // Field is empty, fill it
      await apiKeyInput.fill('sk-test-key-12345-do-not-use-in-production');
    }

    // Now click the save button
    const saveButton = page.locator('[data-testid="save-settings-button"]');
    await saveButton.click();

    // Wait for modal to actually disappear
    await apiModal.waitFor({ state: 'hidden', timeout: 5000 });
    await page.waitForTimeout(500); // Extra wait for animations
  }

  // Use the test ID to find meta chat
  const metaChat = page.locator('[data-testid="meta-chat"]');
  await metaChat.waitFor({ state: 'visible', timeout: 10000 });
  await metaChat.click({ timeout: 5000 });

  await page.waitForTimeout(500); // Wait for conversation to load
}

/**
 * Get all messages in the current conversation
 */
export async function getConversationMessages(page: Page) {
  const messages = page.locator('[class*="message"], [data-testid*="message"]');
  const count = await messages.count();
  const messageTexts: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await messages.nth(i).textContent();
    if (text) {
      messageTexts.push(text);
    }
  }

  return messageTexts;
}

/**
 * Verify a message containing specific text exists in the conversation
 */
export async function expectMessageContaining(page: Page, text: string | RegExp) {
  const messages = await getConversationMessages(page);
  const found = messages.some((msg) =>
    typeof text === 'string' ? msg.includes(text) : text.test(msg)
  );

  if (!found) {
    throw new Error(
      `Expected to find message containing "${text}", but found messages: ${JSON.stringify(messages, null, 2)}`
    );
  }
}
