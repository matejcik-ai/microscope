# Bug Fixes - Microscope RPG Implementation

This document provides specific code fixes for all identified bugs.

---

## Critical Bugs (Must Fix Immediately)

### BUG #1: Missing Create Period Without Placement
**File:** `/home/user/microscope/lib/microscope/command-parser.ts`
**Line:** After line 123
**Severity:** CRITICAL

**Problem:**
Parser doesn't support: `create period: Title (tone) | Description`

**Fix:**
Add this code after line 123 (after `periodFirstMatch`):

```typescript
// Parse create period command without placement (append to end)
const periodSimpleMatch = commandLine.match(/^create period:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
if (periodSimpleMatch) {
  return {
    type: 'create-period',
    data: {
      title: periodSimpleMatch[1].trim(),
      tone: periodSimpleMatch[2].toLowerCase() as 'light' | 'dark',
      placement: undefined, // Will append to end by default
      description: periodSimpleMatch[3].trim(),
    },
  };
}
```

**Test:**
```bash
npx tsx lib/microscope/command-parser.test.ts
# Should now pass TC-CP-001
```

---

### BUG #2: Event Description Always Empty
**Files:**
1. `/home/user/microscope/lib/microscope/command-parser.ts` (Line 152)
2. `/home/user/microscope/app/game/page.tsx` (Line 190)

**Severity:** CRITICAL

**Problem:**
- Command parser doesn't extract event description
- Event creation hardcodes empty string for description

**Fix 1: Update Parser (command-parser.ts:152)**

Change:
```typescript
// OLD
const eventMatch = commandLine.match(/^create event:\s*(.+?)\s*\((light|dark)\)\s*in\s+(.+)$/i);
if (eventMatch) {
  return {
    type: 'create-event',
    data: {
      title: eventMatch[1].trim(),
      tone: eventMatch[2].toLowerCase() as 'light' | 'dark',
      periodTitle: eventMatch[3].trim(),
    },
  };
}
```

To:
```typescript
// NEW - Support optional description after |
const eventMatch = commandLine.match(/^create event:\s*(.+?)\s*\((light|dark)\)\s*in\s+(.+?)(?:\s*\|\s*(.+))?$/i);
if (eventMatch) {
  return {
    type: 'create-event',
    data: {
      title: eventMatch[1].trim(),
      tone: eventMatch[2].toLowerCase() as 'light' | 'dark',
      periodTitle: eventMatch[3].trim(),
      description: eventMatch[4]?.trim() || '', // Optional description
    },
  };
}
```

**Fix 2: Use Description (page.tsx:190)**

Change:
```typescript
// OLD
const eventId = addEvent(period.id, title, '', tone, 'ai-1');
```

To:
```typescript
// NEW
const { title, tone, periodTitle, description } = command.data;
const eventId = addEvent(period.id, title, description || '', tone, 'ai-1');
```

**Test:**
```typescript
parseAIResponse('# create event: War (dark) in Middle Ages | A brutal conflict');
// Should return: { description: 'A brutal conflict' }
```

---

### BUG #3: No Validation Preventing Frozen Item Edits
**File:** `/home/user/microscope/lib/microscope/game-state.ts`
**Lines:** 365-401
**Severity:** CRITICAL

**Problem:**
Frozen items can still be edited via `updatePeriod`, `updateEvent`, `updateScene`

**Fix 1: updatePeriod (line 365)**

Change:
```typescript
// OLD
const updatePeriod = useCallback((id: string, updates: Partial<Period>) => {
  setGameState((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      periods: prev.periods.map(period =>
        period.id === id ? { ...period, ...updates } : period
      ),
    };
  });
}, []);
```

To:
```typescript
// NEW
const updatePeriod = useCallback((id: string, updates: Partial<Period>) => {
  setGameState((prev) => {
    if (!prev) return prev;

    // Check if period is frozen
    const period = prev.periods.find(p => p.id === id);
    if (period?.frozen) {
      console.warn('Cannot update frozen period:', id);
      return prev; // Don't allow updates
    }

    return {
      ...prev,
      periods: prev.periods.map(period =>
        period.id === id ? { ...period, ...updates } : period
      ),
    };
  });
}, []);
```

**Fix 2: updateEvent (line 378)**

Add same check:
```typescript
const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
  setGameState((prev) => {
    if (!prev) return prev;

    // Check if event is frozen
    const event = prev.events.find(e => e.id === id);
    if (event?.frozen) {
      console.warn('Cannot update frozen event:', id);
      return prev;
    }

    return {
      ...prev,
      events: prev.events.map(event =>
        event.id === id ? { ...event, ...updates } : event
      ),
    };
  });
}, []);
```

**Fix 3: updateScene (line 391)**

Add same check:
```typescript
const updateScene = useCallback((id: string, updates: Partial<any>) => {
  setGameState((prev) => {
    if (!prev) return prev;

    // Check if scene is frozen
    const scene = prev.scenes.find(s => s.id === id);
    if (scene?.frozen) {
      console.warn('Cannot update frozen scene:', id);
      return prev;
    }

    return {
      ...prev,
      scenes: prev.scenes.map(scene =>
        scene.id === id ? { ...scene, ...updates } : scene
      ),
    };
  });
}, []);
```

**Test:**
```typescript
const periodId = addPeriod('Test', 'Desc', 'light');
freezeItem('period', periodId);
updatePeriod(periodId, { title: 'New' });
// Console should show: "Cannot update frozen period"
// Period title should remain "Test"
```

---

### BUG #4: Palette Item Creator Lost on Update
**File:** `/home/user/microscope/lib/microscope/game-state.ts`
**Line:** 404-432
**Severity:** CRITICAL

**Problem:**
`updatePalette` takes simple objects without `createdBy`, loses creator metadata

**Fix:**

Change function signature:
```typescript
// OLD
const updatePalette = useCallback((paletteItems: Array<{ text: string; type: 'yes' | 'no' }>) => {
  // ...
}, []);
```

To:
```typescript
// NEW - Accept full PaletteItem objects
const updatePalette = useCallback((paletteItems: PaletteItem[]) => {
  setGameState((prev) => {
    if (!prev) return prev;

    return {
      ...prev,
      setup: {
        ...prev.setup,
        palette: paletteItems, // Just use as-is
      },
    };
  });
}, []);
```

Then update **PaletteEditor.tsx** to pass full objects:
```typescript
// In PaletteEditor component
const handleSave = () => {
  onSave(items); // items should be PaletteItem[] with id and createdBy
};
```

**Alternative (if PaletteEditor can't be changed easily):**

Keep current signature but preserve creator:
```typescript
const updatePalette = useCallback((paletteItems: Array<{ text: string; type: 'yes' | 'no' }>) => {
  setGameState((prev) => {
    if (!prev) return prev;

    const newPalette = paletteItems.map(item => {
      const existing = prev.setup.palette.find(p => p.text === item.text && p.type === item.type);
      if (existing) {
        return existing; // Preserve ALL fields including createdBy
      }
      return {
        id: crypto.randomUUID(),
        text: item.text,
        type: item.type,
        createdBy: { playerId: 'human' },
      };
    });

    return {
      ...prev,
      setup: {
        ...prev.setup,
        palette: newPalette,
      },
    };
  });
}, []);
```

---

## Moderate Bugs (Should Fix Soon)

### BUG #5: Scene Conversations Missing from Context
**File:** `/home/user/microscope/lib/microscope/game-context-builder.ts`
**Line:** After line 253
**Severity:** MODERATE

**Problem:**
`buildCachedGameContext` doesn't include scene conversations

**Fix:**

1. Add `formatScene` function after `formatEvent`:

```typescript
/**
 * Format a scene with its full conversation history
 */
function formatScene(scene: Scene, gameState: GameState): string {
  const lines: string[] = [];

  lines.push(`##### SCENE: ${scene.question}`);
  lines.push(`Tone: ${scene.tone === 'light' ? '☀️ Light' : '🌙 Dark'}`);
  if (scene.answer) {
    lines.push(`Answer: ${scene.answer}`);
  }
  lines.push('');

  // Include scene's conversation
  const conversation = gameState.conversations[scene.conversationId];
  if (conversation && conversation.messages.length > 0) {
    lines.push('###### Scene Discussion:');
    conversation.messages.forEach(msg => {
      lines.push(formatMessage(msg));
    });
    lines.push('');
  }

  return lines.join('\n');
}
```

2. Update `formatEvent` to include scenes (after line 250):

```typescript
function formatEvent(event: Event, gameState: GameState): string {
  const lines: string[] = [];

  lines.push(`#### EVENT: ${event.title}`);
  lines.push(`Tone: ${event.tone === 'light' ? '☀️ Light' : '🌙 Dark'}`);
  if (event.description) {
    lines.push(`Description: ${event.description}`);
  }
  lines.push('');

  // Include event's conversation
  const conversation = gameState.conversations[event.conversationId];
  if (conversation && conversation.messages.length > 0) {
    lines.push('##### Event Discussion:');
    conversation.messages.forEach(msg => {
      lines.push(formatMessage(msg));
    });
    lines.push('');
  }

  // ✅ ADD THIS: Include all scenes in this event
  const scenes = gameState.scenes
    .filter(s => s.eventId === event.id)
    .sort((a, b) => a.order - b.order);

  if (scenes.length > 0) {
    lines.push('##### Scenes in this Event:');
    scenes.forEach(scene => {
      lines.push(formatScene(scene, gameState));
    });
  }

  return lines.join('\n');
}
```

---

### BUG #6: No API Key Check Before Game Start
**File:** `/home/user/microscope/app/game/page.tsx`
**Line:** 810
**Severity:** MODERATE

**Problem:**
"Start Game" button shows even without API key

**Fix:**

Change:
```typescript
// OLD
{gameState.phase === 'setup' &&
 gameState.setup.bigPicture &&
 gameState.setup.bookends.start &&
 gameState.setup.bookends.end && (
```

To:
```typescript
// NEW - Add API key check
{gameState.phase === 'setup' &&
 gameState.setup.bigPicture &&
 gameState.setup.bookends.start &&
 gameState.setup.bookends.end &&
 apiSettings?.apiKey && ( // ✅ Added
```

**Optional:** Add warning if setup complete but no API key:
```typescript
{gameState.phase === 'setup' &&
 gameState.setup.bigPicture &&
 gameState.setup.bookends.start &&
 gameState.setup.bookends.end &&
 !apiSettings?.apiKey && (
  <div style={{ color: '#ff9800', padding: '0.5rem' }}>
    ⚠️ Set API key to start game
  </div>
)}
```

---

### BUG #7: Turn Advancement Only Works with 1 Player
**File:** `/home/user/microscope/lib/microscope/game-state.ts`
**Line:** 643-648
**Severity:** MODERATE

**Problem:**
Transition from `initial_round` to `playing` assumes only 1 player

**Fix:**

Change:
```typescript
// OLD
let newPhase = prev.phase;
if (prev.phase === 'initial_round' && nextPlayerIndex === 0) {
  // Round complete, everyone has gone once
  newPhase = 'playing';
}
```

To:
```typescript
// NEW - Track turns properly
let newPhase = prev.phase;

if (prev.phase === 'initial_round') {
  // Initialize turn counter if not exists
  const turnCount = (prev as any).initialRoundTurns || 0;
  const updatedTurnCount = turnCount + 1;

  // Check if everyone has gone once
  if (updatedTurnCount >= prev.players.length) {
    newPhase = 'playing';
  } else {
    // Store turn count temporarily (won't persist to types, but works)
    (prev as any).initialRoundTurns = updatedTurnCount;
  }
}
```

**Better Fix (with type support):**

1. Update types.ts to add `initialRoundTurns`:
```typescript
export interface GameState {
  // ... existing fields
  initialRoundTurns?: number; // Track how many turns in initial round
}
```

2. Then use cleaner code:
```typescript
let newPhase = prev.phase;
let updatedInitialRoundTurns = prev.initialRoundTurns || 0;

if (prev.phase === 'initial_round') {
  updatedInitialRoundTurns += 1;

  // Check if everyone has gone once
  if (updatedInitialRoundTurns >= prev.players.length) {
    newPhase = 'playing';
    updatedInitialRoundTurns = 0; // Reset
  }
}

return {
  ...prev,
  phase: newPhase,
  initialRoundTurns: updatedInitialRoundTurns,
  // ... rest of update
};
```

---

### BUG #8: No Duplicate Palette Item Validation in Editor
**File:** Needs to be added to PaletteEditor component
**Severity:** MODERATE

**Problem:**
Users can manually create duplicate palette items

**Fix:**

In PaletteEditor component (wherever it is), add validation:

```typescript
const handleSave = () => {
  // Check for duplicates
  const seen = new Set<string>();
  const duplicates: string[] = [];

  items.forEach(item => {
    const key = `${item.type}:${item.text}`;
    if (seen.has(key)) {
      duplicates.push(item.text);
    }
    seen.add(key);
  });

  if (duplicates.length > 0) {
    alert(`Duplicate items found: ${duplicates.join(', ')}`);
    return; // Don't save
  }

  onSave(items);
};
```

---

### BUG #9: End Turn Doesn't Handle Meta Conversation
**File:** `/home/user/microscope/lib/microscope/game-state.ts`
**Line:** 619-635
**Severity:** MINOR

**Problem:**
If user ends turn while in meta conversation, no item gets frozen

**Fix:**

This might be **intentional** (you don't create items during meta), but add a warning:

```typescript
if (prev.currentSelection) {
  const { type, id } = prev.currentSelection;

  if (type === 'period') {
    updatedPeriods = prev.periods.map(p =>
      p.id === id ? { ...p, frozen: true } : p
    );
  } else if (type === 'event') {
    updatedEvents = prev.events.map(e =>
      e.id === id ? { ...e, frozen: true } : e
    );
  } else if (type === 'scene') {
    updatedScenes = prev.scenes.map(s =>
      s.id === id ? { ...s, frozen: true } : s
    );
  } else if (type === 'meta') {
    // ✅ ADD THIS WARNING
    console.warn('Ending turn while in meta conversation - no item to freeze');
  }
}
```

**Or prevent ending turn from meta:**

```typescript
// In page.tsx, update End Turn button condition:
{gameState.currentTurn &&
 gameState.currentTurn.playerId === 'human' &&
 gameState.currentSelection &&
 gameState.currentSelection.type !== 'meta' && ( // ✅ Already has this!
  <button onClick={endTurn}>✓ End Turn</button>
)}
```

**Status:** Actually already fixed! Button only shows when viewing an item, not meta.

---

### BUG #10: No Timeout on API Calls
**File:** `/home/user/microscope/app/api/ai/chat/route.ts`
**Line:** 47
**Severity:** MODERATE

**Problem:**
API calls can hang indefinitely

**Fix:**

Add timeout:

```typescript
export async function POST(request: NextRequest) {
  try {
    const { gameState, currentConversationId, apiSettings } = await request.json();

    // ... validation ...

    const provider = createAIProvider({
      provider: apiSettings.provider || 'claude',
      apiKey: apiSettings.apiKey,
      model: apiSettings.model,
    });

    const context = buildCachedGameContext(gameState, currentConversationId);
    const aiMessages = buildCachedMessages(context);

    // ✅ ADD TIMEOUT
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 60 seconds')), 60000)
    );

    const responsePromise = provider.generateResponse(aiMessages, {
      temperature: 1.0,
      maxTokens: 2048,
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI chat error:', error);

    const errorMessage = error?.message || 'Unknown error';
    const errorType = error?.constructor?.name || 'Error';

    return NextResponse.json(
      {
        error: 'Failed to generate AI response',
        details: errorMessage,
        type: errorType,
      },
      { status: 500 }
    );
  }
}
```

---

## Testing After Fixes

After applying all fixes, run:

```bash
# 1. Command parser tests
npx tsx lib/microscope/command-parser.test.ts

# 2. Manual testing checklist
# - Create game
# - Add items
# - Freeze items
# - Try to edit frozen items (should fail)
# - Start game
# - End turn
# - Verify phase transitions

# 3. Check browser console for warnings
# Should see: "Cannot update frozen period" when trying to edit frozen items
```

---

## Priority Order

1. **BUG #1** - Command parser (breaks basic functionality)
2. **BUG #2** - Event descriptions (data loss)
3. **BUG #3** - Frozen validation (game logic broken)
4. **BUG #4** - Palette creator (metadata loss)
5. **BUG #5** - Scene context (affects AI quality)
6. **BUG #6** - API key check (UX issue)
7. **BUG #10** - API timeout (reliability)
8. **BUG #7** - Multi-player turns (only if planning multi-player)
9. **BUG #8** - Duplicate palette (minor UX)
10. **BUG #9** - Meta conversation (already handled by UI)

**Estimated Time:**
- Bugs #1-4: 1 hour
- Bugs #5-7: 1 hour
- Bugs #8-10: 30 minutes
- **Total: 2.5 hours**

---

## Verification Checklist

After applying fixes:

- [ ] All command parser tests pass
- [ ] Can create periods without placement
- [ ] Events have descriptions
- [ ] Frozen items cannot be edited
- [ ] Palette creators preserved
- [ ] Scene conversations in context
- [ ] Cannot start game without API key
- [ ] API calls timeout after 60s
- [ ] No duplicate palette items

---

**End of Bug Fixes Document**
