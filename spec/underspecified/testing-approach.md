# Testing Approach (UNDERSPECIFIED)

## Problem

Implementation plan mentions testing but doesn't specify:
- Testing framework
- Test coverage targets
- What to test vs. what to skip
- TDD approach details

## Missing Details

### Testing Framework

**Options**:
- Jest + React Testing Library?
- Vitest?
- Playwright for E2E?

**Decision needed**:
- Unit test framework
- Integration test approach
- E2E test requirements (if any)

### Test Coverage

**What to test thoroughly**:
- Command parser logic?
- State management reducers?
- localStorage persistence?
- Prompt caching context building?
- Turn mechanics?
- Metadata freezing?

**What can be skipped in v1**:
- Visual regression testing?
- Accessibility testing?
- Performance testing?
- Cross-browser testing?

### TDD Approach

**Red-Green-Refactor for**:
- Core game logic (phases, turns, freezing)
- Command parsing
- Context building

**Non-TDD acceptable for**:
- UI components (test after)?
- Integration with Claude API (mock-based)?

### Test Data

**Fixtures needed**:
- Sample game states
- Sample AI responses
- Sample command formats
- Edge cases (empty games, large games, malformed data)

### Mocking Strategy

**Claude API**:
- Mock all API calls?
- Use real API in integration tests?
- Record/playback fixtures?

**localStorage**:
- Mock in unit tests?
- Use real localStorage in integration tests?

### CI/CD

**Automation**:
- Run tests on every commit?
- Pre-commit hooks?
- GitHub Actions?

**Coverage thresholds**:
- Minimum percentage?
- Block merges if coverage drops?

## Questions to Resolve

1. **TDD discipline**: Should ALL logic be TDD, or only critical paths?

2. **API testing**: How to test Claude API integration without hitting rate limits?

3. **UI testing**: Is component testing sufficient, or need E2E tests?

4. **Performance testing**: How to ensure app works with 100+ periods/events?

5. **Browser support**: Which browsers to test? (Chrome only for v1?)

## Recommended Approach (To Be Confirmed)

**Suggestion for v1**:
- Jest + React Testing Library for unit/integration tests
- TDD for: command parser, state reducers, context builder, turn mechanics
- Mock Claude API with fixture responses
- Test UI components after implementation (not strict TDD)
- Aim for 80% coverage on core logic, 50% on UI components
- Manual E2E testing (no automated E2E for v1)
- Chrome/Firefox support, Safari nice-to-have
