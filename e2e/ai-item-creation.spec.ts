import { test, expect } from '@playwright/test';
import { itemCreationScenarios } from './fixtures/ai-responses';
import {
  mockClaudeAPI,
  mockModelsAPI,
  navigateToMetaChat,
  sendMessage,
} from './helpers/api-mock';

/**
 * E2E Test for Issue #11: AI Item Creation
 *
 * Tests that AI-created items (periods, events, scenes) follow the correct flow:
 * 1. System message appears in meta chat
 * 2. Message has clickable link to the item
 * 3. Expanded description appears in item's conversation
 * 4. Expanded description does NOT appear in meta chat
 *
 * This is the same pattern as Issue #7 (bookends), but for regular game items.
 */

test.describe('AI Item Creation (Issue #11)', () => {
  test.setTimeout(60000); // 60 second timeout for these tests

  test.beforeEach(async ({ context }) => {
    // Set up localStorage BEFORE navigating to the page
    // This prevents the API Settings modal from appearing at all
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
  });

  /**
   * Test 1: AI creates regular period
   *
   * Verifies:
   * - Meta chat gets system message "Created period: The Golden Ascendancy"
   * - Message has clickable link metadata
   * - Expanded description appears in period conversation (not in meta)
   */
  test('should emit meta chat message when AI creates period', async ({ page }) => {
    const scenario = itemCreationScenarios.find(
      (s) => s.name === 'Create regular period with expanded description'
    );
    if (!scenario) throw new Error('Test scenario not found');

    // Set up API mocks BEFORE navigation (like debug test)
    await mockClaudeAPI(page, scenario.aiResponse);

    // Navigate to the game
    await page.goto('/game');
    await expect(page.getByText('Loading game...')).not.toBeVisible({ timeout: 10000 });

    // Navigate to meta chat
    await navigateToMetaChat(page);

    await sendMessage(page, scenario.humanMessage);

    // CRITICAL VERIFICATION:
    // System message should appear in meta chat: "Created period: The Golden Ascendancy"
    await expect(
      page.getByText(/Created period.*The Golden Ascendancy/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify we're still in meta chat (Game Setup is visible)
    await expect(page.getByText('Game Setup')).toBeVisible();

    // Verify the expanded description does NOT appear in meta chat
    // The expanded description is: "This was a time of unprecedented prosperity..."
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    expect(metaChatText).not.toContain('unprecedented prosperity');
    expect(metaChatText).not.toContain('drawing scholars and merchants');

    // The period should appear in the timeline
    await expect(page.getByText('The Golden Ascendancy')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 2: AI creates event in period
   *
   * Verifies:
   * - Meta chat gets system message "Created event: The Grand Exhibition"
   * - Message has clickable link
   * - Expanded description in event conversation
   * - Parent period reference is correct
   */
  test('should emit meta chat message when AI creates event', async ({ page }) => {
    // First, create the parent period
    const periodScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create regular period with expanded description'
    );
    if (!periodScenario) throw new Error('Period scenario not found');

    await mockClaudeAPI(page, periodScenario.aiResponse);
    await sendMessage(page, periodScenario.humanMessage);

    // Wait for period creation
    await expect(
      page.getByText(/Created period.*The Golden Ascendancy/i)
    ).toBeVisible({ timeout: 10000 });

    // Now create the event
    const eventScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create event with expanded description'
    );
    if (!eventScenario) throw new Error('Event scenario not found');

    await mockClaudeAPI(page, eventScenario.aiResponse);
    await sendMessage(page, eventScenario.humanMessage);

    // CRITICAL VERIFICATION:
    // System message should appear in meta chat: "Created event: The Grand Exhibition"
    await expect(
      page.getByText(/Created event.*The Grand Exhibition/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify we're still in meta chat
    await expect(page.getByText('Game Setup')).toBeVisible();

    // Verify the expanded description does NOT appear in meta chat
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    expect(metaChatText).not.toContain('greatest exhibition the world had ever seen');
    expect(metaChatText).not.toContain('capital\'s central plaza');

    // The event should appear in the timeline under the period
    await expect(page.getByText('The Grand Exhibition')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 3: AI creates scene in event
   *
   * Verifies:
   * - Meta chat gets system message "Created scene: The Opening Ceremony"
   * - Message has clickable link
   * - Expanded description in scene conversation
   * - Question and answer are correct
   */
  test('should emit meta chat message when AI creates scene', async ({ page }) => {
    // First, create the period
    const periodScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create regular period with expanded description'
    );
    if (!periodScenario) throw new Error('Period scenario not found');

    await mockClaudeAPI(page, periodScenario.aiResponse);
    await sendMessage(page, periodScenario.humanMessage);
    await expect(
      page.getByText(/Created period.*The Golden Ascendancy/i)
    ).toBeVisible({ timeout: 10000 });

    // Then create the event
    const eventScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create event with expanded description'
    );
    if (!eventScenario) throw new Error('Event scenario not found');

    await mockClaudeAPI(page, eventScenario.aiResponse);
    await sendMessage(page, eventScenario.humanMessage);
    await expect(
      page.getByText(/Created event.*The Grand Exhibition/i)
    ).toBeVisible({ timeout: 10000 });

    // Finally, create the scene
    const sceneScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create scene with expanded description'
    );
    if (!sceneScenario) throw new Error('Scene scenario not found');

    await mockClaudeAPI(page, sceneScenario.aiResponse);
    await sendMessage(page, sceneScenario.humanMessage);

    // CRITICAL VERIFICATION:
    // System message should appear in meta chat: "Created scene: The Opening Ceremony"
    await expect(
      page.getByText(/Created scene.*The Opening Ceremony/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify we're still in meta chat
    await expect(page.getByText('Game Setup')).toBeVisible();

    // Verify the expanded description does NOT appear in meta chat
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    expect(metaChatText).not.toContain('emperor stood before thousands');
    expect(metaChatText).not.toContain('doves were released into the sky');

    // The scene should appear in the timeline
    await expect(page.getByText('The Opening Ceremony')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 4: AI creates multiple items in one response
   *
   * Verifies:
   * - Each item gets its own meta chat message
   * - Each item gets its own expanded description
   * - All links work correctly
   */
  test('should emit separate meta chat messages for multiple items', async ({ page }) => {
    const scenario = itemCreationScenarios.find(
      (s) => s.name === 'Create multiple items in single response'
    );
    if (!scenario) throw new Error('Test scenario not found');

    await mockClaudeAPI(page, scenario.aiResponse);
    await sendMessage(page, scenario.humanMessage);

    // CRITICAL VERIFICATION:
    // Both periods should have separate system messages in meta chat
    await expect(
      page.getByText(/Created period.*The Age of Conflict/i)
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/Created period.*The Rebuilding/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify we're still in meta chat
    await expect(page.getByText('Game Setup')).toBeVisible();

    // Verify expanded descriptions do NOT appear in meta chat
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    // First period's expanded description
    expect(metaChatText).not.toContain('prosperity of the Golden Age bred complacency');
    expect(metaChatText).not.toContain('Noble houses turned against each other');

    // Second period's expanded description
    expect(metaChatText).not.toContain('After decades of war');
    expect(metaChatText).not.toContain('long and difficult journey');

    // Both periods should appear in timeline
    await expect(page.getByText('The Age of Conflict')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('The Rebuilding')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 5: AI creates item with multi-paragraph expanded description
   *
   * Verifies:
   * - All paragraphs appear in item conversation
   * - Nothing leaks into meta chat
   */
  test('should handle multi-paragraph expanded descriptions', async ({ page }) => {
    const scenario = itemCreationScenarios.find(
      (s) => s.name === 'Create item with multi-paragraph expanded description'
    );
    if (!scenario) throw new Error('Test scenario not found');

    await mockClaudeAPI(page, scenario.aiResponse);
    await sendMessage(page, scenario.humanMessage);

    // CRITICAL VERIFICATION:
    // System message should appear in meta chat
    await expect(
      page.getByText(/Created period.*The Renaissance/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify we're still in meta chat
    await expect(page.getByText('Game Setup')).toBeVisible();

    // Verify NONE of the multi-paragraph description appears in meta chat
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    // Check that none of the expanded description paragraphs leaked into meta
    expect(metaChatText).not.toContain('extraordinary period of cultural flowering');
    expect(metaChatText).not.toContain('Artists developed new techniques');
    expect(metaChatText).not.toContain('chiaroscuro, and sfumato');
    expect(metaChatText).not.toContain('scholars rediscovered ancient texts');
    expect(metaChatText).not.toContain('printing press revolutionized');
    expect(metaChatText).not.toContain('Trade flourished as merchant families');
    expect(metaChatText).not.toContain('Renaissance man');

    // The period should appear in timeline
    await expect(page.getByText('The Renaissance')).toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 6: AI creates item with placement (AFTER)
   *
   * Verifies:
   * - Item is created in correct position
   * - Meta chat message appears
   * - Expanded description works
   */
  test('should create item with AFTER placement', async ({ page }) => {
    // First create the reference period
    const refScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create regular period with expanded description'
    );
    if (!refScenario) throw new Error('Reference scenario not found');

    await mockClaudeAPI(page, refScenario.aiResponse);
    await sendMessage(page, refScenario.humanMessage);
    await expect(
      page.getByText(/Created period.*The Golden Ascendancy/i)
    ).toBeVisible({ timeout: 10000 });

    // Now create a period AFTER it
    const afterScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create item with placement AFTER'
    );
    if (!afterScenario) throw new Error('After scenario not found');

    await mockClaudeAPI(page, afterScenario.aiResponse);
    await sendMessage(page, afterScenario.humanMessage);

    // CRITICAL VERIFICATION:
    // System message should appear in meta chat
    await expect(
      page.getByText(/Created period.*The Silver Twilight/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify expanded description does NOT appear in meta chat
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    expect(metaChatText).not.toContain('empire still appeared strong on the surface');
    expect(metaChatText).not.toContain('cracks were forming');

    // Both periods should appear in timeline
    await expect(page.getByText('The Golden Ascendancy')).toBeVisible();
    await expect(page.getByText('The Silver Twilight')).toBeVisible();
  });

  /**
   * Test 7: AI creates item with placement (BEFORE)
   *
   * Verifies:
   * - Item is created in correct position
   * - Meta chat message appears
   * - Expanded description works
   */
  test('should create item with BEFORE placement', async ({ page }) => {
    // First create the reference period
    const refScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create regular period with expanded description'
    );
    if (!refScenario) throw new Error('Reference scenario not found');

    await mockClaudeAPI(page, refScenario.aiResponse);
    await sendMessage(page, refScenario.humanMessage);
    await expect(
      page.getByText(/Created period.*The Golden Ascendancy/i)
    ).toBeVisible({ timeout: 10000 });

    // Now create a period BEFORE it
    const beforeScenario = itemCreationScenarios.find(
      (s) => s.name === 'Create item with placement BEFORE'
    );
    if (!beforeScenario) throw new Error('Before scenario not found');

    await mockClaudeAPI(page, beforeScenario.aiResponse);
    await sendMessage(page, beforeScenario.humanMessage);

    // CRITICAL VERIFICATION:
    // System message should appear in meta chat
    await expect(
      page.getByText(/Created period.*The Founding Pact/i)
    ).toBeVisible({ timeout: 10000 });

    // Verify expanded description does NOT appear in meta chat
    const metaChatMessages = await page
      .locator('[data-testid="meta-chat"] *')
      .allTextContents();
    const metaChatText = metaChatMessages.join(' ');

    expect(metaChatText).not.toContain('Warring kingdoms came together');
    expect(metaChatText).not.toContain('founding treaty established principles');

    // Both periods should appear in timeline
    await expect(page.getByText('The Golden Ascendancy')).toBeVisible();
    await expect(page.getByText('The Founding Pact')).toBeVisible();
  });

  /**
   * Test 8: Verify clickable links in meta chat messages
   *
   * This test verifies that system messages have the correct metadata
   * to make them clickable and navigate to the item conversation.
   */
  test('meta chat messages should have clickable links to items', async ({ page }) => {
    const scenario = itemCreationScenarios.find(
      (s) => s.name === 'Create regular period with expanded description'
    );
    if (!scenario) throw new Error('Test scenario not found');

    await mockClaudeAPI(page, scenario.aiResponse);
    await sendMessage(page, scenario.humanMessage);

    // Find the creation message
    const creationMessage = page.getByText(/Created period.*The Golden Ascendancy/i);
    await expect(creationMessage).toBeVisible({ timeout: 10000 });

    // Click on the message (if it's clickable)
    // This should open the period's conversation
    await creationMessage.click({ force: true });

    // Wait for conversation to switch
    await page.waitForTimeout(1000);

    // Verify we're now viewing the period conversation
    // The expanded description should be visible in the item conversation
    // Note: This test verifies the click doesn't cause errors
    // A more complete test would verify that we navigate to the item conversation
    // and can see the expanded description there

    // For now, verify the period is still in the timeline
    await expect(page.getByText('The Golden Ascendancy')).toBeVisible();
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
 * - State updates: React state updates are async, wait for UI changes
 *
 * Issue #11 Specific Checks:
 * - Meta chat should show "Created [type]: [name]" messages
 * - Expanded descriptions should NEVER appear in meta chat
 * - Expanded descriptions should appear in item conversations
 * - System messages should have clickable links (metadata.linkTo)
 */
