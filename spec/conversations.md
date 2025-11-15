# Conversation Architecture

## Meta Conversation
- **Purpose**: Coordination, setup, event stream
- **Participants**: All players
- **Content**:
  - Setup phase: discussion, AI commands to create palette/bookends
  - Game phase: "go create your next item", AI acknowledgments, system event messages
  - Event stream: system messages like "🎯 Alice created Event: The Betrayal"

## Per-Item Conversations
- **Purpose**: Deep discussion of specific item's details
- **Participants**: Any player can join
- **Created when**: Item is created
- **First message**: Expanded description (from CREATE command or human input)
- **Lifecycle**:
  - Editable phase: players discuss, refine, AI can ask clarifying questions
  - After "end turn": conversation continues but metadata frozen
  - Conversation never deleted, always in context

## Item Creation Flow (Detailed)

When AI creates an item via CREATE command:

### 1. Human Prompts AI
```
Human (in meta): "Create the next period"
```
Human's message added to meta conversation history.

### 2. AI Responds with Command
```
AI response:
CREATE PERIOD The Period of Strife AFTER The Golden Age TONE dark DESCRIPTION Decades of civil war

The fragile peace established during the Golden Age could not hold. Regional warlords...
```

### 3. System Processes Command
- Parse CREATE command from AI response
- Create new Period item with metadata
- Create item conversation for the Period
- **Extended description becomes first message** in item conversation (attributed to AI)
- **Remove AI's response from meta conversation** (doesn't go into meta history)
- **Add system message to meta**: "Period created: The Period of Strife" (clickable link)

### 4. System Message Details
- **Text**: "[Item type] created: [Item name]" (e.g., "Period created: The Period of Strife")
- **Clickable**: Links to item conversation
- **"Show raw" action**: Shows unparsed AI response with CREATE command
- **Style**: Distinct from regular chat messages (implementation detail)

### 5. UI Behavior
- **Option A (if animation works)**: Auto-switch to item conversation
- **Option B (v1 default)**: Stay in meta, human clicks link to view item
- Item conversation now open with extended description as first message
- Item is unfrozen, ready for discussion/editing

### 6. Conversation History Impact
**Meta conversation history**:
```
Human: "Create the next period"
System: "Period created: The Period of Strife" [link]
```
Note: AI's CREATE command response is NOT in meta history.

**Period conversation history**:
```
AI: The fragile peace established during the Golden Age could not hold...
```
Note: Only the extended description, not the CREATE command.

### 7. Access to Original Response
- System message has "show raw" action in message menu
- Shows complete unparsed AI response including CREATE command
- Useful for debugging/reparse

## Error Handling

### API Call Failure
When human sends message and API call fails:
1. Human's message already in conversation history
2. Show error message: "⚠️ API call failed: [reason]"
3. Include "Retry" button (functions same as "restart from here")
4. Retry deletes failed attempt and regenerates AI response from prior context

### Command Parse Failure
See `spec/command-error-handling.md` for complete specification.
