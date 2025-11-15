# Claude API Integration & Caching

## Request Structure (Every API Call)

See `spec/underspecified/system-prompts.md` for detailed architecture.

```javascript
const apiRequest = {
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 4096,
  system: [
    {
      type: "text",
      text: getSystemPromptForConversationType(conversationType), // base instructions
      cache_control: { type: "ephemeral" }
    },
    {
      type: "text",
      text: getPersonaPrompt(aiPlayer.personaId), // persona-specific
      cache_control: { type: "ephemeral" }
    }
  ],
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: buildGameContext(game), // high concept, palette, timeline
          cache_control: { type: "ephemeral" }
        }
      ]
    },
    {
      role: "user", // or system for item metadata
      content: [
        {
          type: "text",
          text: buildCurrentItemMetadata(item), // for item conversations only
          cache_control: { type: "ephemeral" }
        }
      ]
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: buildConversationHistory(conversationId), // full history
          cache_control: { type: "ephemeral" }
        }
      ]
    },
    // New human message (not cached)
    {
      role: "user",
      content: newHumanMessage
    }
  ]
};
```

## buildGameContext()

Returns formatted string containing:

1. **High concept**
2. **Complete palette** (yes/no items)
3. **Current phase**
4. **Full timeline** (all periods, events, scenes in chronological order with metadata)

**Note**: This does NOT include conversation histories - those are built separately.

## buildCurrentItemMetadata()

For item conversations only. Returns formatted string:

```
CURRENT ITEM:
Type: Period
Name: The Golden Age
Tone: light
Created by: AI Player
Status: Editable
```

## buildConversationHistory()

Returns the full conversation history for the specified conversation (meta or specific item).

Includes all messages from conversation start to present, formatted chronologically.

**Size**: This will grow large. That's fine - prompt caching makes repeated tokens cheap.

**Update frequency**: Regenerate on every API call with cache control.

## API Call Sites

1. **Meta conversation**: Send message from human or trigger AI turn
2. **Item conversation**: Send message in specific item's thread
3. Both use same cached context, just different "current conversation" appended

## API Configuration

- Single global API key stored in localStorage
- Key is required before any gameplay
- Used for all AI calls (all players, all conversations)

## System Prompts

See `spec/underspecified/system-prompts.md` for complete specifications including:
- Base system prompt templates for each conversation type
- Persona prompt library (v1: single "generic RPG player" persona)
- Game context formatting
- Cache structure and breakpoint strategy
