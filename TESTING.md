# Testing Guide for Microscope RPG AI Assistant

## Overview

This project now has **Playwright E2E testing** set up to catch bugs that the previous static analysis tests couldn't detect.

### Why Playwright?

The previous testing approach (`lib/microscope/bookend-meta-chat.test.ts`) used static code analysis - it just read the source files and pattern-matched for bugs. **It couldn't catch real runtime issues.**

Issue #7 proved this: the static test said the bug was fixed, but it actually wasn't. We needed **real E2E tests** that run the app in a browser.

## Test Structure

```
e2e/
├── fixtures/
│   └── ai-responses.ts        # Test data: human messages & AI responses
├── helpers/
│   └── api-mock.ts            # Helpers for mocking Claude API
├── smoke.spec.ts              # Basic smoke tests
├── bookend-meta-chat.spec.ts  # Template for issue #7 tests
├── bookend-meta-chat-full.spec.ts  # Full issue #7 test with mocking
├── game-setup.spec.ts         # Game setup phase tests
├── one-unfrozen-item.spec.ts  # One-unfrozen-item rule tests
├── timeline-navigation.spec.ts # Navigation tests
└── README.md                  # E2E testing docs
```

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run specific test file
npm run test:e2e e2e/smoke.spec.ts

# Interactive UI mode (best for debugging)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View HTML report
npm run test:report
```

## Test Fixtures & API Mocking

### Why Mock the API?

- **No API key needed** in test environment
- **Faster tests** - no network calls
- **Deterministic** - same inputs always produce same outputs
- **Offline testing** - works without internet

### How It Works

1. **Test fixtures** (`e2e/fixtures/ai-responses.ts`) contain:
   - Example human messages
   - Corresponding AI responses
   - Expected commands that should be parsed

2. **API mocking** (`e2e/helpers/api-mock.ts`) intercepts Claude API calls and returns fixture data

3. **Tests** use fixtures to simulate complete user flows without real API

### Example: Testing Bookend Creation

```typescript
import { setupPhaseScenarios } from './fixtures/ai-responses';
import { mockClaudeAPI, setupTestAPIKey, sendMessage } from './helpers/api-mock';

test('should create start bookend', async ({ page }) => {
  // Get test scenario
  const scenario = setupPhaseScenarios.find(s => s.name === 'Create start bookend');

  // Mock API to return the test response
  await mockClaudeAPI(page, scenario.aiResponse);

  // Send the human message
  await sendMessage(page, scenario.humanMessage);

  // Verify the expected behavior
  await expect(page.getByText(/Created start bookend/i)).toBeVisible();
});
```

## Current Test Coverage

### ✅ Implemented Tests

1. **Smoke tests** (`smoke.spec.ts`)
   - App loads without errors
   - Timeline sidebar appears
   - Meta chat is accessible

2. **Bookend meta chat** (`bookend-meta-chat-full.spec.ts`)
   - Creating start bookend shows meta chat message
   - **Updating existing bookend shows meta chat message** (Issue #7)
   - Creating end bookend shows meta chat message
   - Messages have clickable links
   - Sequential bookend creation works

### 📝 Template Tests (Need Implementation)

These tests are written but need:
- UI test IDs (`data-testid` attributes)
- More detailed selectors
- Possibly more test data

3. **Game setup** (`game-setup.spec.ts`)
   - Palette editing
   - Bookend creation during setup
   - Freezing bookends when game starts
   - Palette remains editable after game starts

4. **One-unfrozen-item rule** (`one-unfrozen-item.spec.ts`)
   - Creating item makes it unfrozen
   - Cannot create another while one is unfrozen
   - End turn freezes item
   - Implicit freezing when AI/human creates next item
   - Visual indicators for frozen/unfrozen state

5. **Timeline navigation** (`timeline-navigation.spec.ts`)
   - Clicking items opens conversations
   - Conversation view updates
   - Message history persists
   - Timeline hierarchy display

## Adding Test IDs to UI

To make tests more reliable, add `data-testid` attributes to key elements:

### Recommended Test IDs

```tsx
// Timeline
<div data-testid="timeline">
  <div data-testid="meta-chat">Game Setup</div>
  <div data-testid={`period-${period.id}`} data-frozen={period.frozen}>
    {period.title}
  </div>
</div>

// Conversation view
<div data-testid="conversation-view">
  <div data-testid={`message-${msg.id}`} data-link-type={msg.metadata?.linkTo?.type}>
    {msg.content}
  </div>
  <textarea data-testid="message-input" />
  <button data-testid="send-message">Send</button>
</div>

// Controls
<button data-testid="create-period-button">Create Period</button>
<button data-testid="end-turn-button">End Turn</button>
<button data-testid="start-game-button">Start Game</button>
```

### Using Test IDs in Tests

```typescript
// Much more reliable than text-based selectors
const messageInput = page.getByTestId('message-input');
const createButton = page.getByTestId('create-period-button');
const period = page.getByTestId('period-abc123');
```

## Debugging Failed Tests

### 1. View Screenshots

Failed tests automatically capture screenshots:

```
test-results/
└── [test-name]/
    ├── test-failed-1.png
    └── error-context.md
```

### 2. View HTML Report

```bash
npm run test:report
```

Opens interactive report in browser with:
- Test results
- Screenshots
- Video recordings (if enabled)
- Detailed error logs

### 3. Run in UI Mode

```bash
npm run test:e2e:ui
```

Interactive mode with:
- Time-travel debugging
- Watch mode
- Visual test picker
- Step-by-step execution

### 4. Run in Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector:
- Step through test line by line
- Inspect element selectors
- Evaluate expressions in console

### 5. Run with Visible Browser

```bash
npm run test:e2e:headed
```

See the test run in a real browser window.

## Common Issues

### Issue: "Element not found"

**Cause**: Selector doesn't match any elements

**Solutions**:
- Add `data-testid` attributes
- Use more flexible selectors (regex for text)
- Increase timeout: `{ timeout: 10000 }`
- Check if element is in shadow DOM

### Issue: "Element is not clickable"

**Cause**: Element is covered by another element

**Solutions**:
- Use `{ force: true }` to bypass checks
- Wait for overlay to disappear
- Scroll element into view first

### Issue: "Test timeout"

**Cause**: Test takes longer than default 30s

**Solutions**:
```typescript
test.setTimeout(60000); // 60 seconds

// Or per-action timeout
await element.click({ timeout: 10000 });
```

### Issue: "API not mocked"

**Cause**: Route pattern doesn't match actual API URL

**Solutions**:
- Check Network tab in browser dev tools
- Verify API endpoint pattern: `**/v1/messages`
- Ensure mock is set up before action

## CI/CD Integration

Tests are configured for CI via `playwright.config.ts`:

```typescript
{
  retries: process.env.CI ? 2 : 0,  // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined,  // Single worker in CI
  forbidOnly: !!process.env.CI,  // Prevent .only in CI
}
```

### Running in GitHub Actions

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Best Practices

### 1. Use Test Fixtures

**❌ Don't:**
```typescript
test('should work', async ({ page }) => {
  await mockClaudeAPI(page, 'CREATE PERIOD...');  // Hardcoded
});
```

**✅ Do:**
```typescript
test('should work', async ({ page }) => {
  const scenario = setupPhaseScenarios.find(s => s.name === 'Create start bookend');
  await mockClaudeAPI(page, scenario.aiResponse);
});
```

### 2. Use Helper Functions

**❌ Don't:**
```typescript
const input = page.locator('textarea').last();
await input.fill('message');
await input.press('Enter');
await page.waitForTimeout(2000);
```

**✅ Do:**
```typescript
await sendMessage(page, 'message');
```

### 3. Wait for Elements, Not Time

**❌ Don't:**
```typescript
await page.waitForTimeout(5000);
await expect(element).toBeVisible();
```

**✅ Do:**
```typescript
await expect(element).toBeVisible({ timeout: 5000 });
```

### 4. Use Meaningful Assertions

**❌ Don't:**
```typescript
const text = await element.textContent();
expect(text).toBe('Created start bookend: Ancient Times');
```

**✅ Do:**
```typescript
await expect(element).toContainText(/Created start bookend.*Ancient Times/i);
```

## Next Steps

1. **Add test IDs to UI components**
   - Prioritize Timeline, ConversationView, and message components
   - Makes tests more reliable and maintainable

2. **Implement template tests**
   - game-setup.spec.ts
   - one-unfrozen-item.spec.ts
   - timeline-navigation.spec.ts

3. **Add more test scenarios**
   - Error handling (API errors, invalid commands)
   - Complex multi-step flows
   - Edge cases from spec

4. **Visual regression testing**
   - Add screenshot comparison tests
   - Verify UI doesn't change unexpectedly

5. **Performance testing**
   - Measure page load times
   - Test with large timelines (100+ items)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)
