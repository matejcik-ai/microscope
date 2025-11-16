import { Page } from '@playwright/test';
import { createMockClaudeResponse } from '../fixtures/ai-responses';

/**
 * API Mocking Helpers for E2E Tests
 */

/**
 * Mock the Claude API to return a predefined response
 */
export async function mockClaudeAPI(page: Page, responseText: string) {
  await page.route('**/v1/messages', async (route) => {
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
 * Mock the Claude API with a sequence of responses
 * Each API call will return the next response in the array
 */
export async function mockClaudeAPISequence(page: Page, responses: string[]) {
  let callCount = 0;

  await page.route('**/v1/messages', async (route) => {
    const responseText = responses[callCount] || responses[responses.length - 1];
    callCount++;

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

  const messageInput = page.locator('textarea, input[type="text"]').last();

  // Wait longer and retry if not found
  try {
    await messageInput.waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    // Try to close any lingering modal
    const modalOverlay = page.locator('[class*="modal"], [role="dialog"]').first();
    if (await modalOverlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    // Retry finding the input
    await messageInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  await messageInput.fill(message);
  await messageInput.press('Enter');

  if (waitForResponse) {
    // Wait for AI to respond
    await waitForGameStateUpdate(page, 3000);
  }
}

/**
 * Navigate to meta chat (Game Setup)
 */
export async function navigateToMetaChat(page: Page) {
  // Wait for API Settings modal to close completely
  // The modal might appear briefly even with localStorage set
  await page.waitForTimeout(1000);

  // Check if modal is still visible and close it
  const closeButton = page.getByRole('button', { name: /close|cancel|×/i });
  const saveButton = page.getByRole('button', { name: /save/i });

  // Try to close modal if it exists
  if (await closeButton.isVisible({ timeout: 500 }).catch(() => false)) {
    await closeButton.click({ force: true });
    await page.waitForTimeout(500);
  } else if (await saveButton.isVisible({ timeout: 500 }).catch(() => false)) {
    await saveButton.click({ force: true });
    await page.waitForTimeout(500);
  }

  const gameSetup = page.getByText('Game Setup').first();
  await gameSetup.waitFor({ state: 'visible', timeout: 10000 });

  // Use force: true to bypass any overlapping elements
  await gameSetup.click({ force: true, timeout: 5000 });

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
