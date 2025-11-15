# Concurrent Editing of Unfrozen Items (UNDERSPECIFIED)

## Problem

When AI creates an item, it becomes the current unfrozen item. During this phase:
- AI can edit metadata (v1 nice-to-have)
- Human can view the item
- Human might want to edit the item's metadata
- Players discuss in item conversation

**Critical questions**: How do concurrent edits work? How does AI see human's changes?

## Scenarios

### Scenario 1: AI Creates Item, Human Edits Metadata

1. AI creates "Period of Strife" via CREATE command
2. Item becomes current unfrozen item
3. Human opens item, sees AI's initial metadata
4. Human edits name: "Period of Strife" → "Period of Civil War"
5. AI is in item conversation, discussing the period

**Questions**:
- Does AI immediately see human's metadata change?
- Is the change in the cached context for AI's next response?
- Do we show human's edit as a system message in conversation?
- Can AI "undo" human's change by editing again?

### Scenario 2: Human Creates Item, AI Suggests Changes

1. Human creates "The Great Betrayal" event
2. Item is unfrozen, human discusses with AI in item conversation
3. AI suggests in conversation: "Perhaps change tone to 'dark'?"
4. Human manually changes tone in UI
5. AI continues discussion

**Questions**:
- Does conversation show that human changed the tone?
- Is this visible in cached context for next AI message?
- Should AI explicitly edit metadata, or just suggest in conversation?

### Scenario 3: AI Edits Its Own Item Metadata

1. AI creates period via CREATE command
2. Item is unfrozen
3. Human asks clarifying question: "Should this be dark or light?"
4. AI responds: "Good point, it should be dark" and issues metadata update
5. Metadata changes

**Questions**:
- What command format does AI use to edit metadata?
- Is this separate from CREATE command?
- How is this shown in conversation UI?
- Can AI edit any field, or only certain ones?

## Technical Considerations

### Cached Context Building

When building cached context for AI calls:
- Include current unfrozen item's metadata (as it exists now)
- Include conversation history about the item
- If metadata changed, how to represent that?

**Options**:
1. **Always show current state**: Cached context has latest metadata, no change history
2. **Show change history**: System messages in conversation when metadata edited
3. **Hybrid**: Current state + recent changes mentioned

### Metadata Update Commands (AI)

If AI can edit metadata of unfrozen items:

**Option A: Structured command**
```
UPDATE_ITEM:
item: "current"
changes:
  tone: dark
  description: "Updated description text"
```

**Option B: Natural language + system parse**
AI says in conversation: "I'll change the tone to dark" and system detects intent

**Option C: Not implemented in v1**
AI can only suggest changes in conversation, human applies them manually

### Ownership and Authority

**From game rules**: AI is ultimate authority on items it creates.

**For v1**: Don't enforce this - allow human to edit AI's items.

**Questions**:
- Should UI indicate "AI is working on this item"?
- Should human edits require confirmation?
- Or just treat all unfrozen items equally?

## Visibility and Caching Implications

### Human Edits AI's Unfrozen Item

**What happens**:
1. Human changes metadata in UI
2. State updates immediately
3. Next AI call to item conversation includes updated metadata in cached context

**This seems straightforward** - cached context always reflects current state.

### AI Edits Its Own Item

**What happens**:
1. AI issues UPDATE command (or similar)
2. System parses and updates metadata
3. Metadata change reflected in UI
4. Change visible in conversation? (system message?)

**Complexity**: If we show metadata changes as conversation messages, this adds to context. If we don't, human might not realize metadata changed.

## Questions to Resolve

1. **AI metadata editing in v1**: Implement or defer to v2?
   - If implement: What command format?
   - If defer: AI can only create, then human edits during discussion

2. **Human editing AI's items**: Always allowed, or show warning?
   - "This item was created by AI, are you sure you want to edit it?"
   - Or no distinction - all unfrozen items editable equally

3. **Metadata change visibility**:
   - Show system messages in conversation when metadata changes?
   - Or just silently update and reflect in cached context?

4. **Concurrent edit conflicts**:
   - Can human edit metadata while AI is generating response?
   - Last write wins? Or lock metadata during AI call?

5. **End turn authority**:
   - Can human end turn on AI's unfrozen item?
   - Or must AI end its own turn (explicit or implicit)?

## Recommended Approach (To Be Confirmed)

**For v1 MVP**:

1. **Defer AI metadata editing to v2**
   - AI creates items via CREATE command only
   - AI can suggest changes in conversation
   - Human applies changes manually via UI
   - Simpler implementation, no new command format needed

2. **Allow human to edit AI's unfrozen items freely**
   - No ownership enforcement
   - No warnings or confirmations
   - All unfrozen items treated equally

3. **No metadata change system messages**
   - Metadata changes happen silently
   - Reflected in UI immediately
   - Included in cached context on next AI call
   - Keeps conversation focused on content, not metadata mechanics

4. **Human can end AI's turn**
   - Click "End Turn" button on any unfrozen item
   - Freezes it, allows creation of next item
   - Or implicit: create new item or prompt AI to create

5. **Optimistic updates, last write wins**
   - UI updates immediately on human edit
   - If AI call in progress, human's edit still applies
   - No locking during API calls

**For v2**:
- Add AI metadata editing via UPDATE command
- Add system messages for metadata changes
- Add ownership indicators ("AI's item", "Your item")
- Possibly add conflict resolution UI
