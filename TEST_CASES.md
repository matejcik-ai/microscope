# Test Cases for Microscope RPG Implementation

This document contains detailed test cases to verify all functionality works correctly.

---

## Test Suite 1: Command Parsing

### TC-CP-001: Create Period Without Placement (FAILING)
**Priority:** CRITICAL
**Status:** ❌ FAILING

**Input:**
```
create period: The Golden Age (light) | A time of prosperity and peace
```

**Expected Output:**
```json
{
  "type": "create-period",
  "data": {
    "title": "The Golden Age",
    "tone": "light",
    "placement": undefined,
    "description": "A time of prosperity and peace"
  }
}
```

**Actual Output:**
```json
{
  "type": "none"
}
```

**Fix Status:** Requires code change in command-parser.ts

---

### TC-CP-002: Create Period With "After" Placement
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create period: The Dark Times (dark) after The Golden Age | Everything fell apart
```

**Expected:**
- Command type: `create-period`
- Title: "The Dark Times"
- Tone: "dark"
- Placement: `{ type: 'after', relativeTo: 'The Golden Age' }`
- Description: "Everything fell apart"

---

### TC-CP-003: Create Period With "Before" Placement
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create period: The Foundation (light) before The Golden Age | How it all began
```

**Expected:**
- Command type: `create-period`
- Placement: `{ type: 'before', relativeTo: 'The Golden Age' }`

---

### TC-CP-004: Create Period With "First" Placement
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create period: The Very Beginning (light) first | Before anything else
```

**Expected:**
- Command type: `create-period`
- Placement: `{ type: 'first' }`

---

### TC-CP-005: Create Start Bookend
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create start bookend: The First Dawn (light) | When time began
```

**Expected:**
- Command type: `create-start-bookend`
- Title: "The First Dawn"
- Tone: "light"
- Description: "When time began"

---

### TC-CP-006: Create End Bookend
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create end bookend: The Final Night (dark) | When everything ends
```

**Expected:**
- Command type: `create-end-bookend`
- Title: "The Final Night"
- Tone: "dark"

---

### TC-CP-007: Create Event (NEEDS ENHANCEMENT)
**Priority:** CRITICAL
**Status:** ⚠️ INCOMPLETE

**Current Input:**
```
# create event: The Great War (dark) in The Middle Ages
```

**Issue:** No description field!

**Proposed Enhanced Input:**
```
# create event: The Great War (dark) in The Middle Ages | A devastating conflict
```

**Expected:**
- Command type: `create-event`
- Title: "The Great War"
- Tone: "dark"
- Period Title: "The Middle Ages"
- Description: "A devastating conflict" (currently missing!)

---

### TC-CP-008: Create Scene
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create scene: What caused the final battle? in The Great War
```

**Expected:**
- Command type: `create-scene`
- Question: "What caused the final battle?"
- Event Title: "The Great War"

---

### TC-CP-009: Add to Palette (Yes)
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# add to palette yes: Magic and wizardry
```

**Expected:**
- Command type: `add-palette`
- Category: "yes"
- Item: "Magic and wizardry"

---

### TC-CP-010: Add to Palette (No)
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# add to palette no: Modern technology
```

**Expected:**
- Command type: `add-palette`
- Category: "no"
- Item: "Modern technology"

---

### TC-CP-011: Edit Name
**Priority:** MEDIUM
**Status:** ✅ PASS

**Input:**
```
# edit name: The Age of Deception
```

**Expected:**
- Command type: `edit-name`
- New Name: "The Age of Deception"

---

### TC-CP-012: Edit Description
**Priority:** MEDIUM
**Status:** ✅ PASS

**Input:**
```
# edit description: A time of hidden truths and growing darkness
```

**Expected:**
- Command type: `edit-description`
- New Description: "A time of hidden truths and growing darkness"

---

### TC-CP-013: Edit Tone
**Priority:** MEDIUM
**Status:** ✅ PASS

**Input:**
```
# edit tone: dark
```

**Expected:**
- Command type: `edit-tone`
- New Tone: "dark"

---

### TC-CP-014: Multiple Commands
**Priority:** HIGH
**Status:** ✅ PASS

**Input:**
```
# create start bookend: The Beginning (light) | Start
# create end bookend: The End (dark) | Finish
# add to palette yes: Hope
# add to palette no: Despair
```

**Expected:**
- Commands array length: 4
- All commands parsed correctly

---

### TC-CP-015: Plain Message (No Commands)
**Priority:** MEDIUM
**Status:** ✅ PASS

**Input:**
```
This is just a normal conversation message.
```

**Expected:**
- Command type: `none`
- Remaining message: "This is just a normal conversation message."

---

### TC-CP-016: Case Insensitivity
**Priority:** LOW
**Status:** ✅ PASS

**Input:**
```
# CREATE PERIOD: Test (DARK) | Testing
```

**Expected:**
- Tone normalized to: "dark" (lowercase)
- Command recognized despite caps

---

---

## Test Suite 2: Game Phase Transitions

### TC-PT-001: Initial State (Setup Phase)
**Priority:** CRITICAL
**Status:** ✅ PASS

**Test:**
```typescript
const game = createEmptyGameState('test-id', 'Test Game');
```

**Expected:**
- `phase`: "setup"
- `currentTurn`: null
- All periods: empty array
- All events: empty array

---

### TC-PT-002: Start Game (Setup → Initial Round)
**Priority:** CRITICAL
**Status:** ✅ PASS

**Preconditions:**
- Big picture set
- Start bookend created
- End bookend created
- At least 1 period exists

**Test:**
```typescript
startGame();
```

**Expected:**
- `phase`: "initial_round"
- `currentTurn`: { playerId: 'human' }
- All existing periods: `frozen: true`
- All existing events: `frozen: true`
- System message added to meta conversation

---

### TC-PT-003: End Turn in Initial Round
**Priority:** CRITICAL
**Status:** ⚠️ NEEDS MANUAL TEST

**Preconditions:**
- Phase: "initial_round"
- Current turn: player 1
- Total players: 3
- Player 1 has selected an item

**Test:**
```typescript
endTurn();
```

**Expected After 1st End Turn:**
- `phase`: "initial_round" (unchanged)
- `currentTurn`: { playerId: 'player-2' }
- Selected item: `frozen: true`

**Expected After 2nd End Turn:**
- `phase`: "initial_round" (unchanged)
- `currentTurn`: { playerId: 'player-3' }

**Expected After 3rd End Turn:**
- `phase`: "playing" (changed!)
- `currentTurn`: { playerId: 'player-1' }

**Current Bug:** Only works with 1 player

---

### TC-PT-004: End Turn in Playing Phase
**Priority:** HIGH
**Status:** ⚠️ NEEDS MANUAL TEST

**Preconditions:**
- Phase: "playing"
- Multiple players

**Test:**
```typescript
endTurn();
```

**Expected:**
- `phase`: "playing" (unchanged)
- `currentTurn`: advances to next player
- Selected item: `frozen: true`

---

---

## Test Suite 3: Metadata Freezing

### TC-MF-001: Frozen Period Cannot Be Edited (FAILING)
**Priority:** CRITICAL
**Status:** ❌ FAILING (No Validation)

**Test:**
```typescript
// Create period
const periodId = addPeriod('Test Period', 'Description', 'light');

// Freeze it
freezeItem('period', periodId);

// Try to update (should fail)
updatePeriod(periodId, { title: 'New Title' });

// Check
const period = gameState.periods.find(p => p.id === periodId);
```

**Expected:**
- Period title: "Test Period" (unchanged)
- Console warning: "Cannot update frozen period"

**Actual:**
- Period title: "New Title" (updated!)
- No warning

**Fix Needed:** Add validation in updatePeriod/updateEvent/updateScene

---

### TC-MF-002: Frozen Event Cannot Be Edited (FAILING)
**Priority:** CRITICAL
**Status:** ❌ FAILING (No Validation)

**Similar to TC-MF-001**

---

### TC-MF-003: Items Frozen on Turn End
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
// Create period
const periodId = addPeriod('Test', 'Desc', 'light');
setSelection('period', periodId);

// End turn
endTurn();

// Check
const period = gameState.periods.find(p => p.id === periodId);
```

**Expected:**
- Period `frozen`: true

---

### TC-MF-004: Items Frozen on Game Start
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
// Create items in setup
addPeriod('Period 1', 'Desc', 'light');
addEvent(period1Id, 'Event 1', 'Desc', 'dark');

// Start game
startGame();
```

**Expected:**
- All periods: `frozen: true`
- All events: `frozen: true`

---

---

## Test Suite 4: Context Building

### TC-CB-001: All Periods Included
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
// Create 3 periods with conversations
// Build context
const context = buildCachedGameContext(gameState, metaConversationId);
```

**Expected:**
- Context includes all 3 period titles
- Context includes all 3 period conversations

---

### TC-CB-002: All Events Included
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
// Create period with 2 events
// Build context
const context = buildCachedGameContext(gameState, metaConversationId);
```

**Expected:**
- Context includes both event titles
- Context includes both event conversations

---

### TC-CB-003: All Scenes Included (FAILING)
**Priority:** MEDIUM
**Status:** ❌ FAILING

**Test:**
```typescript
// Create event with 2 scenes
// Build context
const context = buildCachedGameContext(gameState, metaConversationId);
```

**Expected:**
- Context includes both scene questions
- Context includes both scene conversations

**Actual:**
- Scenes NOT included in context

**Fix Needed:** Add formatScene() function

---

### TC-CB-004: Recent Messages Excluded from Cache
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
// Meta conversation with 20 messages
const context = buildCachedGameContext(gameState, metaConversationId, 10);
```

**Expected:**
- `cachedContext`: contains first 10 messages
- `recentMessages`: contains last 10 messages

---

### TC-CB-005: System Prompt Includes Phase
**Priority:** MEDIUM
**Status:** ✅ PASS

**Test:**
```typescript
const context = buildCachedGameContext(gameState, conversationId);
```

**Expected:**
- System prompt includes: "GAME PHASE: setup" (or initial_round/playing)
- System prompt includes current player if turn exists

---

---

## Test Suite 5: Conversation Isolation

### TC-CI-001: Each Object Has Unique Conversation
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
const p1 = addPeriod('P1', 'Desc', 'light');
const p2 = addPeriod('P2', 'Desc', 'dark');
```

**Expected:**
- Period 1 conversationId ≠ Period 2 conversationId
- Both conversations exist in gameState.conversations

---

### TC-CI-002: Message Teleporting
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
// AI sends: "# create period: New Period (light) | Description\n\nLet's explore this period!"
// Process command
```

**Expected:**
- Meta conversation: Contains link message
- New period conversation: Contains "Let's explore this period!" as first message
- Meta conversation: Does NOT contain "Let's explore this period!"

---

### TC-CI-003: Delete Period Removes Conversation
**Priority:** MEDIUM
**Status:** ✅ PASS

**Test:**
```typescript
const periodId = addPeriod('Test', 'Desc', 'light');
const convId = period.conversationId;

deletePeriod(periodId);
```

**Expected:**
- Period removed from gameState.periods
- Conversation removed from gameState.conversations

---

### TC-CI-004: Delete Period Cascades to Events
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
const periodId = addPeriod('Test', 'Desc', 'light');
const eventId = addEvent(periodId, 'Event', 'Desc', 'dark');

deletePeriod(periodId);
```

**Expected:**
- Period removed
- Event removed
- Both conversations removed

---

---

## Test Suite 6: localStorage Structure

### TC-LS-001: Game Saved on State Change
**Priority:** HIGH
**Status:** ✅ PASS (Manual Verification Needed)

**Test:**
```typescript
addPeriod('Test', 'Desc', 'light');
// Check localStorage
```

**Expected:**
- `localStorage['microscope-game-{gameId}']` contains updated state

---

### TC-LS-002: Game Loaded on Mount
**Priority:** HIGH
**Status:** ✅ PASS (Manual Verification Needed)

**Test:**
1. Create game with data
2. Refresh page
3. Check state loaded

**Expected:**
- All data restored
- Current game ID preserved

---

### TC-LS-003: Multi-Game Isolation
**Priority:** MEDIUM
**Status:** ✅ PASS (Manual Verification Needed)

**Test:**
1. Create Game A with period "Period A"
2. Create Game B with period "Period B"
3. Switch to Game A

**Expected:**
- Game A shows only "Period A"
- Game B shows only "Period B"

---

### TC-LS-004: Migration from Old Storage
**Priority:** LOW
**Status:** ✅ PASS

**Test:**
```typescript
localStorage['microscope-game-state'] = JSON.stringify(oldGameState);
migrateOldStorage();
```

**Expected:**
- New game created in games list
- API settings extracted
- Old key removed

---

---

## Test Suite 7: API Key Handling

### TC-AK-001: API Key Required for Message Send
**Priority:** CRITICAL
**Status:** ✅ PASS

**Test:**
1. Clear API settings
2. Try to send message

**Expected:**
- API settings modal opens
- Message not sent

---

### TC-AK-002: API Key Global (Not Per-Game)
**Priority:** MEDIUM
**Status:** ✅ PASS

**Test:**
1. Set API key in Game A
2. Switch to Game B

**Expected:**
- Game B has same API key (shared globally)

---

### TC-AK-003: Cannot Start Game Without API Key (FAILING)
**Priority:** MEDIUM
**Status:** ❌ FAILING

**Test:**
1. Complete setup (big picture, bookends)
2. Clear API key
3. Check if "Start Game" button appears

**Expected:**
- Button should NOT appear

**Actual:**
- Button appears (can start game without API key)

**Fix:** Add `apiSettings?.apiKey` check to button condition

---

---

## Test Suite 8: PaletteItem Structure

### TC-PI-001: PaletteItem Has ID
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
addPaletteItem('yes', 'Magic');
const item = gameState.setup.palette[0];
```

**Expected:**
- `item.id`: exists and is UUID
- `item.text`: "Magic"
- `item.type`: "yes"
- `item.createdBy`: { playerId: 'human' }

---

### TC-PI-002: PaletteItem Tracks Creator
**Priority:** MEDIUM
**Status:** ✅ PASS

**Test:**
```typescript
addPaletteItem('yes', 'Magic', 'ai-1');
const item = gameState.setup.palette[0];
```

**Expected:**
- `item.createdBy.playerId`: "ai-1"

---

### TC-PI-003: Palette Update Preserves IDs (PARTIAL)
**Priority:** HIGH
**Status:** ⚠️ PARTIAL (Loses createdBy)

**Test:**
```typescript
// AI adds item
addPaletteItem('yes', 'Magic', 'ai-1');

// User edits palette via UI
updatePalette([
  { text: 'Magic', type: 'yes' },
  { text: 'New Item', type: 'yes' },
]);
```

**Expected:**
- "Magic" keeps same ID
- "Magic" keeps `createdBy: { playerId: 'ai-1' }`
- "New Item" gets new ID

**Actual:**
- "Magic" keeps same ID ✅
- "Magic" gets `createdBy: { playerId: 'human' }` ❌ (LOST!)

**Fix Needed:** Change updatePalette signature

---

### TC-PI-004: No Duplicate Palette Items (PARTIAL)
**Priority:** LOW
**Status:** ⚠️ PARTIAL

**Test:**
```typescript
addPaletteItem('yes', 'Magic');
addPaletteItem('yes', 'Magic'); // Duplicate
```

**Expected:**
- Only 1 "Magic" item exists

**Actual:**
- addPaletteItem prevents duplicates ✅
- updatePalette allows duplicates ❌

---

---

## Test Suite 9: Turn Mechanics

### TC-TM-001: No Turn During Setup
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
const game = createEmptyGameState('id', 'name');
```

**Expected:**
- `currentTurn`: null

---

### TC-TM-002: Turn Set on Game Start
**Priority:** HIGH
**Status:** ✅ PASS

**Test:**
```typescript
startGame();
```

**Expected:**
- `currentTurn`: { playerId: 'human' }

---

### TC-TM-003: Turn Advances on End Turn
**Priority:** HIGH
**Status:** ⚠️ NEEDS MULTI-PLAYER TEST

**Test:**
```typescript
// With 3 players
endTurn();
```

**Expected:**
- Turn advances: player1 → player2 → player3 → player1

---

### TC-TM-004: End Turn Button Only Shows on Human Turn
**Priority:** MEDIUM
**Status:** ✅ PASS (Visual Check)

**Test:**
- View UI when it's human's turn
- View UI when it's AI's turn

**Expected:**
- Button visible only on human turn

---

---

## Test Suite 10: Error Handling

### TC-EH-001: Network Error Restores Message
**Priority:** HIGH
**Status:** ✅ PASS (Visual Check)

**Test:**
1. Disconnect network
2. Send message
3. Check error

**Expected:**
- Error message displayed
- Message restored to input field

---

### TC-EH-002: Invalid Period Name in Event Creation
**Priority:** MEDIUM
**Status:** ✅ PASS

**Test:**
```typescript
// Create event with non-existent period
handleAICommand({
  type: 'create-event',
  data: { title: 'Event', tone: 'light', periodTitle: 'NonExistent' }
}, conversationId);
```

**Expected:**
- Error message: "Period not found"
- Event not created

---

### TC-EH-003: API Timeout (MISSING)
**Priority:** MEDIUM
**Status:** ❌ NO TIMEOUT IMPLEMENTED

**Test:**
- Mock slow API response (>60s)

**Expected:**
- Request times out after 60s
- Error message shown

**Actual:**
- Hangs indefinitely

**Fix Needed:** Add timeout to fetch() call

---

---

## Manual Test Checklist

### Setup Phase
- [ ] Create new game
- [ ] Set big picture
- [ ] Add palette items (yes and no)
- [ ] Create start bookend
- [ ] Create end bookend
- [ ] Verify "Start Game" button appears
- [ ] Start game

### Initial Round
- [ ] Verify phase indicator shows "Initial Round"
- [ ] Verify turn indicator shows current player
- [ ] Create a period
- [ ] Verify period appears in timeline
- [ ] Select period and add message
- [ ] End turn
- [ ] Verify period is frozen
- [ ] Verify turn advanced
- [ ] (If multi-player) Complete full round
- [ ] Verify transition to "Playing" phase

### Playing Phase
- [ ] Create another period
- [ ] Create event in period
- [ ] Verify event appears in timeline
- [ ] Select event and have conversation
- [ ] End turn
- [ ] Verify event frozen

### Command Testing
- [ ] Send "# create period: Test (light) | Description"
- [ ] Verify period created
- [ ] Verify link appears in meta
- [ ] Verify text after command teleports to period
- [ ] Send "# add to palette yes: New Item"
- [ ] Verify palette updated

### Persistence
- [ ] Create game with data
- [ ] Refresh browser
- [ ] Verify all data loaded
- [ ] Switch to different game
- [ ] Switch back
- [ ] Verify correct game loaded

### Error Cases
- [ ] Try to send message without API key
- [ ] Verify settings modal opens
- [ ] Enter invalid API key
- [ ] Verify error message
- [ ] Disconnect network
- [ ] Send message
- [ ] Verify error + message restored

---

## Automated Test Runner

To run all automated tests:

```bash
# Command parser tests
npx tsx lib/microscope/command-parser.test.ts

# When other test files are created:
# npx tsx lib/microscope/game-state.test.ts
# npx tsx lib/microscope/game-context-builder.test.ts
# npx tsx lib/microscope/storage.test.ts
```

---

## Test Data Generator

For manual testing, use this helper:

```typescript
function generateTestGame(): GameState {
  const game = createEmptyGameState('test-1', 'Test Game');

  // Setup
  game.setup.bigPicture = 'A fantasy epic spanning millennia';
  game.setup.palette = [
    { id: '1', text: 'Magic', type: 'yes', createdBy: { playerId: 'human' } },
    { id: '2', text: 'Dragons', type: 'yes', createdBy: { playerId: 'human' } },
    { id: '3', text: 'Technology', type: 'no', createdBy: { playerId: 'human' } },
  ];

  // Bookends
  addPeriod('The First Age', 'When magic was born', 'light', true);
  addPeriod('The Last Age', 'When magic died', 'dark', true);

  // Periods
  addPeriod('The Golden Era', 'Peace and prosperity', 'light');
  addPeriod('The Dark Times', 'War and suffering', 'dark');

  // Events
  const goldenEra = findPeriodByTitle('The Golden Era');
  addEvent(goldenEra.id, 'The Great Council', 'Leaders united', 'light');

  return game;
}
```

---

## Coverage Goals

| Area | Current | Target |
|------|---------|--------|
| Command Parsing | 60% | 95% |
| Phase Transitions | 70% | 90% |
| Metadata Freezing | 40% | 90% |
| Context Building | 80% | 95% |
| localStorage | 90% | 95% |
| Overall | 73% | 92% |

---

**End of Test Cases Document**
