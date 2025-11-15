# Underspecified Areas - Summary

This document summarizes the areas of the specification that need more detail before full implementation. Each area has a detailed stub file in `spec/underspecified/`.

## Critical (Blocks Core Features)

### 1. AI Command Error Handling - RESOLVED ✅
**File**: `spec/command-error-handling.md`

**Problem**: When AI fails to parse a command properly, the spec doesn't define what happens.

**Resolution**:
- Emit error to chat stream, human decides recovery method
- No automatic retries in v1
- Lenient parsing for minor variations, strict on structure
- All-or-nothing for multi-command responses
- Message action menu: show unparsed, reparse, restart from here
- Everything goes in conversation history (AI sees its errors)

**Date Resolved**: 2025-11-15

---

### 2. System Prompts - RESOLVED ✅
**File**: `spec/system-prompts.md`

**Problem**: Spec mentions system prompts but doesn't specify exact content.

**Resolution**:
- Detailed system prompt templates for each conversation type (meta, period, event, scene)
- Base prompts include collaborative storyteller guidance
- Persona prompts add personality variations on top
- v1 has single 'generic' persona with empty persona prompt
- Phase-specific command availability documented
- Cache structure with 4 breakpoints specified

**Date Resolved**: 2025-11-15

---

### 3. Player Management - RESOLVED ✅
**File**: `spec/underspecified/player-management.md`

**Problem**: Spec mentions AI players with personas but not how they're created/edited.

**Decisions Needed**:
- When are AI players configured (before game or during setup)?
- How many AI players supported (1-3? more?)?
- What UI for creating personas (text area, templates, forms)?
- Can players be added/removed mid-game?
- How is turn order determined (random, sequential, user-specified)?

**Impact**: Blocks setup phase implementation (Phase 1)

**Recommendation**: Configure during setup phase, support 1-3 AI players, simple text area with example templates, random turn order, lock players after game starts

---

## Important (Affects UX)

### 4. UI Design & Layout
**File**: `spec/underspecified/ui-design.md`

**Problem**: Component hierarchy exists but visual design and UX patterns not specified.

**Decisions Needed**:
- Timeline layout: horizontal, vertical, tree, zoomable canvas?
- How are events displayed within periods (nested, expandable)?
- Conversation UI: side-by-side, modal, bottom panel, tabs?
- System message styling?
- Mobile support required for v1?
- Which component library to use (Material-UI, Chakra, custom)?

**Impact**: Affects all UI implementation (Phases 1, 2, 4)

**Recommendation**: Desktop-first, horizontal timeline at top, conversation below, simple chat bubbles, toast notifications for errors, use component library (Chakra UI)

---

### 5. State Update Patterns
**File**: `spec/underspecified/state-update-patterns.md`

**Problem**: React state updates and localStorage persistence patterns not fully specified.

**Decisions Needed**:
- Optimistic updates or wait for API response?
- How to handle concurrent updates?
- When to write to localStorage (every change, debounced)?
- How to handle localStorage quota exceeded?
- How to detect/handle external localStorage changes?

**Impact**: Blocks state management implementation (Phase 0)

**Recommendation**: Optimistic updates with error recovery, queue API calls per conversation, persist after each reducer action in try/catch, show error modal if quota exceeded

---

## Nice-to-Have (Can Use Defaults)

### 6. Testing Approach
**File**: `spec/underspecified/testing-approach.md`

**Problem**: Testing strategy not fully defined.

**Decisions Needed**:
- Which testing framework (Jest, Vitest)?
- Test coverage targets?
- How strict on TDD (all logic or just critical paths)?
- E2E testing required for v1?
- Which browsers to support?

**Impact**: Affects development workflow but has reasonable defaults

**Recommendation**: Jest + React Testing Library, TDD for core logic (command parser, state reducers, turn mechanics), 80% coverage on logic/50% on UI, manual E2E for v1, Chrome/Firefox support

---

## Open Questions from Original Spec

From `spec/open-questions.md`:

1. **Bookend periods**: Should they have conversations in setup phase, or stay empty until game starts?

2. **AI command parsing errors**: What happens if AI fails to parse - retry or ask human?

3. **Undo/redo**: Should there be undo/redo during editable phase?

4. **Max AI personas**: How many to support in v1?

5. **Timeline insertion**: When AI says "after Period X", how to handle multiple valid positions?

6. **Player turn order**: Randomized, creation order, or user-specified?

7. **Conversation auto-switch**: When creating item, auto-switch to its conversation or stay in meta?

8. **System message format**: Exact format and styling?

9. **API error recovery**: If call fails mid-turn, retry automatically or require manual retry?

10. **localStorage quotas**: What happens when full - warn user or block new games?

---

## Priority for User Input

**High Priority** (blocks core implementation):
1. System Prompts - needed for API integration
2. Player Management - needed for setup phase
3. Command Error Handling - needed for command parser

**Medium Priority** (affects UX but has workable defaults):
4. UI Design & Layout - can start with simple default
5. State Update Patterns - can use standard patterns

**Low Priority** (can use defaults):
6. Testing Approach - has industry standard defaults

---

## Recommended Next Steps

1. **Start with defaults**: For items marked "Recommendation" above, begin implementation using suggested approach

2. **Flag for review**: Mark these areas in code with comments like:
   ```typescript
   // UNDERSPECIFIED: Using graceful degradation for command errors
   // See spec/underspecified/command-error-handling.md
   ```

3. **User input sessions**: Schedule dedicated sessions to resolve:
   - System prompt content
   - Player management UX
   - UI layout preferences

4. **Iterate**: Implement with defaults, get user feedback, refine

---

## Summary Table

| Area | File | Priority | Blocks | Recommendation Provided | Status |
|------|------|----------|--------|------------------------|--------|
| Command Error Handling | `command-error-handling.md` | High | Command parser | Yes | ✅ Resolved |
| System Prompts | `system-prompts.md` | High | API integration | Yes | ✅ Resolved |
| Player Management | `player-management.md` | High | Setup phase | Yes | ✅ Resolved |
| UI Design | `ui-design.md` | Medium | All UI | Yes | Open |
| State Updates | `state-update-patterns.md` | Medium | State management | Yes | Open |
| Testing Approach | `testing-approach.md` | Low | Development flow | Yes | Open |

All areas have recommended approaches to unblock development. User can review and approve/modify these recommendations.
