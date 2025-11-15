# Claude API Integration & Caching

## Context Structure (Every API Call)

```javascript
const messages = [
  {
    role: "user",
    content: [
      {
        type: "text",
        text: buildCachedGameContext(game), // ALL previous content
        cache_control: { type: "ephemeral" }
      }
    ]
  },
  ...currentConversationLast10Turns.map(msg => ({
    role: msg.role,
    content: msg.content
    // NO cache_control on recent messages
  }))
];
```

## buildCachedGameContext()

Returns a single string containing:

1. **System prompt** for current context (meta or specific item)
2. **High concept**
3. **Complete palette**
4. **All periods** (in timeline order):
   - Metadata
   - Full conversation history from item conversation
5. **All events** (in timeline order):
   - Metadata
   - Full conversation history from item conversation
6. **Meta conversation history** (except last 10 turns)

**Size**: This will grow large. That's fine - prompt caching makes repeated tokens cheap.

**Update frequency**: Regenerate on every API call, cache control on the concatenated text.

## API Call Sites

1. **Meta conversation**: Send message from human or trigger AI turn
2. **Item conversation**: Send message in specific item's thread
3. Both use same cached context, just different "current conversation" appended

## API Configuration

- Single global API key stored in localStorage
- Key is required before any gameplay
- Used for all AI calls (all players, all conversations)

## System Prompts

**UNDERSPECIFIED**: Exact system prompt content for:
- Meta conversation context
- Per-item conversation context
- AI persona integration

See `spec/underspecified/system-prompts.md` for details.
