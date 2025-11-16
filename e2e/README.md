# E2E Tests with Playwright

This directory contains end-to-end tests for the Microscope RPG AI Assistant.

## Setup

Playwright has been installed and configured. Browsers are downloaded automatically.

## Running Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Debug tests (step through with debugging)
npm run test:e2e:debug

# View test report
npm run test:report
```

## Test Structure

- `smoke.spec.ts` - Basic smoke tests to verify the app loads
- `bookend-meta-chat.spec.ts` - Tests for issue #7 (bookend meta chat messages)

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/game');
  await expect(page.getByText('Game Setup')).toBeVisible();
});
```

### Mocking AI API Calls

To test AI interactions without real API calls, use network mocking:

```typescript
test('should handle AI response', async ({ page }) => {
  // Intercept API calls to Claude
  await page.route('**/api.anthropic.com/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        content: [{
          text: 'CREATE PERIOD Ancient Times FIRST TONE light DESCRIPTION The beginning'
        }]
      })
    });
  });

  // Now interact with the app
  await page.goto('/game');
  // ... test continues
});
```

## Current State: Issue #7

The tests for issue #7 (bookend meta chat) are currently templates. To make them fully functional, we need to:

1. **Add test IDs to the UI components** - Make elements easier to select
2. **Mock the Claude API** - Simulate AI responses without real API calls
3. **Add test helpers** - Expose game state for testing

### Adding Test IDs

In React components, add `data-testid` attributes:

```tsx
<div data-testid="meta-chat-messages">
  {messages.map(msg => (
    <div data-testid={`message-${msg.id}`} key={msg.id}>
      {msg.content}
    </div>
  ))}
</div>
```

Then in tests:

```typescript
const metaChat = page.getByTestId('meta-chat-messages');
const message = page.getByTestId('message-123');
```

## Debugging

### Visual Debugging

```bash
# UI Mode - best for debugging
npm run test:e2e:ui

# Shows browser while running
npm run test:e2e:headed
```

### Trace Viewer

If a test fails, check the trace:

```bash
npx playwright show-trace trace.zip
```

### Screenshots

Failed tests automatically capture screenshots in `test-results/`.

## CI/CD

In CI environments, tests run in headless mode with:
- 2 retries on failure
- Single worker (no parallelization)
- HTML reporter for results

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Next.js E2E Testing](https://nextjs.org/docs/testing)
- [Issue #7](https://github.com/matejcik-ai/microscope/issues/7)
