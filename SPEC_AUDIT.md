# Spec Compliance Audit - 2025-11-15

## Executive Summary

**Build Status**: ✅ App builds successfully
**Test Status**: ✅ Command parser tests pass (18/18)
**Spec Conformance**: ⚠️ Multiple critical gaps identified

The current implementation has solid foundations but deviates from the spec in several key areas, particularly around command syntax, system prompts, and game initialization.

---

## Critical Gaps (Priority 1 - Must Fix)

### 1. Command Syntax Mismatch 🔴
**Current**: Uses `# create period:` format with hash and colon
**Spec**: Requires `CREATE PERIOD` format (uppercase, no hash, no colon)

**Impact**: AI receives wrong instructions in system prompt, tests validate wrong format

**Files Affected**:
- `lib/microscope/command-parser.ts` - regex patterns need complete rewrite
- `lib/microscope/command-parser.test.ts` - all test cases need updating
- `lib/ai/prompts/microscope-default.ts` - system prompt has wrong syntax
- `spec/ai-commands.md` - spec defines correct format

**Example**:
```
Current: # create period: The Golden Age (light) first | Description
Spec:    CREATE PERIOD The Golden Age FIRST TONE light DESCRIPTION Brief desc

         (blank line)

         Expanded description here
```

**Decision**: Spec format is more clear and structured. Must update code to match spec.

### 2. System Prompt Architecture Mismatch 🔴
**Current**: Single generic prompt for all conversations
**Spec**: Per-conversation-type prompts (meta, period, event, scene)

**Impact**: AI doesn't receive context-specific instructions

**Files Affected**:
- `lib/microscope/game-context-builder.ts` - `buildSystemPrompt()` is minimal
- `spec/system-prompts.md` - defines complete prompt structure
- API doesn't use 4-breakpoint caching structure from spec

**Spec Requirements**:
- Meta conversation prompt (different for setup vs playing phase)
- Period conversation prompt (different for editable vs frozen)
- Event conversation prompt (different for editable vs frozen)
- Scene conversation prompt (dictated scenes in v1)
- Persona prompt as separate cache block

**Decision**: Current implementation is placeholder. Must build per-type prompts.

### 3. Missing AI Player in Game Initialization 🔴
**Current**: Only creates human player in `createEmptyGameState()`
**Spec**: v1 requires exactly 2 players (1 human, 1 AI with 'generic' persona)

**Files Affected**:
- `lib/microscope/game-state.ts:36-43` - player initialization
- `spec/overview.md` - "v1: always 2 players (1 human, 1 AI)"

**Impact**: Games can't function correctly without AI player

**Decision**: Add AI player with id='ai-1', name='AI Player', type='ai' in initialization.

### 4. Missing Big Picture Input UI 🔴
**Current**: No UI to set `gameState.setup.bigPicture`
**Spec**: Required for setup phase

**Files Affected**:
- `app/game/components/Timeline.tsx` or new component
- Setup phase requires this before game can start

**Impact**: Can't properly complete setup phase

**Decision**: Add simple text input in Timeline when viewing meta conversation during setup.

---

## Important Gaps (Priority 2 - Should Fix)

### 5. Prompt Caching Structure Incomplete 🟡
**Current**: 1 cached block (system + game context)
**Spec**: 4 cache breakpoints (base prompt, persona, game context, item metadata + history)

**Files Affected**:
- `app/api/ai/chat/route.ts` - `buildCachedMessages()` function
- `spec/system-prompts.md` - defines 4-breakpoint structure

**Impact**: Less efficient caching, higher token costs

**Decision**: Can work with current structure but should implement full spec for efficiency.

### 6. One-Unfrozen-Item Rule Not Visibly Enforced 🟡
**Current**: No visible UI enforcement
**Spec**: "UI locked - can't create another until turn ends"

**Files Affected**:
- `app/game/page.tsx` - creation button logic
- `lib/microscope/game-state.ts` - tracking unfrozen item

**Impact**: User can violate game rules

**Decision**: Disable "Add Period" button when an unfrozen item exists.

### 7. Phase Transition Verification Needed 🟡
**Current**: `startGame()` and `endTurn()` exist but need verification
**Spec**: setup → initial_round → playing with specific freezing behavior

**Files Affected**:
- `lib/microscope/game-state.ts` - phase transition logic
- Needs manual testing

**Decision**: Test thoroughly, verify all items freeze correctly on transitions.

### 8. Scene Creation Incomplete 🟡
**Current**: Command parser supports scenes, but UI flow incomplete
**Spec**: Dictated scenes in v1 (question + answer specified at creation)

**Files Affected**:
- `app/game/page.tsx` - `handleAICommand()` missing scene case
- Need to add scene metadata to creation flow

**Impact**: Cannot create scenes (v1 feature)

**Decision**: Implement scene creation to match period/event pattern.

---

## Minor Gaps (Priority 3 - Nice to Have)

### 9. Test Infrastructure Incomplete 🟢
**Current**: One test file, custom test runner, no Jest
**Spec**: Recommends Jest + React Testing Library

**Files Affected**:
- `package.json` - no test dependencies
- Need test setup for state management, UI components

**Decision**: Current test works. Add proper Jest setup for v1 completion.

### 10. UI Design vs Spec 🟢
**Current**: Working UI but not fully spec-compliant
**Spec**: Mobile-first, chat bubbles, vertical timeline

**Files Affected**:
- All UI components
- `spec/ui-design.md`

**Impact**: Functional but UX could be improved

**Decision**: Current UI is acceptable for v1. Document as TODO for v2.

---

## Test Conformance Analysis

### Existing Tests: `lib/microscope/command-parser.test.ts`
- ✅ **18/18 tests pass**
- ❌ **Tests validate WRONG syntax** (# create period: vs CREATE PERIOD)
- ❌ **Missing tests**: Spec format, placement syntax, error cases
- ✅ **Good coverage**: Multiple commands, edge cases, malformed input

**Test Gaps**:
1. No tests for uppercase spec syntax (CREATE PERIOD, TONE, DESCRIPTION)
2. No tests for placement keywords (FIRST, LAST, AFTER X, BEFORE X)
3. No tests for spec's expanded description pattern (blank line separator)
4. No tests for QUESTION/ANSWER in scenes
5. No tests for state management functions
6. No tests for UI components

**Decision**: After fixing command parser, update all tests to match spec syntax.

---

## Proposed Spec Updates (For User Approval)

### PROPOSED-1: Command Syntax Flexibility
**Issue**: Spec requires strict uppercase (CREATE PERIOD) but AI may vary case
**Proposal**: Accept case-insensitive commands
**Rationale**: More robust parsing, current tests already validate this
**Spec Change**: Add note "Commands are case-insensitive"

### PROPOSED-2: Placement Optional for First Period
**Issue**: Spec unclear if first period needs FIRST keyword
**Current**: Allows periods without placement (adds at end)
**Proposal**: If no periods exist, placement is optional (auto-first)
**Rationale**: Better UX, prevents errors
**Spec Change**: "FIRST placement optional if timeline empty"

### PROPOSED-3: Description Optional for Events in v1
**Issue**: Spec format shows description in brief, current allows optional
**Current**: Events can be created without description
**Proposal**: Description optional in v1, expanded description in conversation
**Rationale**: Matches actual usage pattern
**Spec Change**: Mark description as optional in v1

### PROPOSED-4: Frozen Conversations Continue
**Issue**: Spec asks "forbid continuing frozen conversations?" (open question)
**Current**: Can continue conversations after freezing
**Proposal**: Allow continued discussion in frozen conversations
**Rationale**: Matches Microscope RPG spirit, cache handles it fine
**Spec Change**: "Frozen items can still be discussed, metadata locked"

---

## Implementation Plan

### Phase 1: Core Functionality (Priority 1)
1. ✅ **Audit complete**
2. Fix command parser syntax to match spec
3. Add AI player to game initialization
4. Add Big Picture input UI
5. Verify phase transitions
6. Update all tests to match spec syntax

### Phase 2: Spec Compliance (Priority 2)
7. Update system prompts per spec (per-conversation-type)
8. Implement 4-breakpoint caching structure
9. Enforce one-unfrozen-item rule in UI
10. Complete scene creation flow

### Phase 3: Testing & Polish (Priority 3)
11. Add Jest test infrastructure
12. Test app end-to-end
13. Document decisions
14. Commit and push

### Estimated TODOs Remaining: ~10-12 tasks

---

## Files Requiring Changes

### High Priority
- ✏️ `lib/microscope/command-parser.ts` - Complete rewrite for spec syntax
- ✏️ `lib/microscope/command-parser.test.ts` - Update all tests
- ✏️ `lib/ai/prompts/microscope-default.ts` - Fix command examples
- ✏️ `lib/microscope/game-state.ts` - Add AI player init
- ✏️ `lib/microscope/game-context-builder.ts` - Build per-type prompts
- ✏️ `app/game/page.tsx` - Add Big Picture UI, scene handling
- ✏️ `app/api/ai/chat/route.ts` - Update caching structure

### Medium Priority
- ✏️ `app/game/components/Timeline.tsx` - Big Picture input, UI enforcement
- ✏️ `package.json` - Add Jest dependencies

### Documentation
- ✏️ `SPEC_UPDATES.md` - Proposed spec changes (new file)
- ✏️ Code TODOs for unresolved items

---

## Conclusion

**Severity**: 🟡 Moderate - App builds and has core functionality, but spec deviations prevent proper v1 compliance

**Recommendation**: Systematically address Priority 1 items, then Priority 2. Priority 3 can be deferred if time-constrained.

**Estimated Effort**: 4-6 hours for full compliance, 2-3 hours for Priority 1 only
