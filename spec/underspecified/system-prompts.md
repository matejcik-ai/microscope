# System Prompts (SPECIFIED)

## Architecture Decision

**Per-conversation-type system prompts**: Each conversation type (meta, period, event, scene) gets its own system prompt template with context-specific instructions.

**Rationale**:
- Context-specific instructions are clearer and more authoritative in system prompts
- Cache duplication across conversation types is acceptable (saves token processing)
- Easier to reason about and modify per-type
- Better for experimentation and iteration

## Cache Structure

Each API request follows this structure:

### Static Content (Cached)
```
[System message 1: Base instructions for this conversation type]
  ↑ cache_control: ephemeral

[System message 2: Persona prompt]
  ↑ cache_control: ephemeral

[User message part 1: Full game context - high concept, palette, timeline]
  ↑ cache_control: ephemeral
```

### Dynamic Content (Can be cached as conversation grows)
```
[System message: Current item metadata]
  ↑ cache_control: ephemeral

[User message part 2: Conversation history]
  ↑ cache_control: ephemeral

[System messages: Edits by players - inserted when they happen]
  ↑ cache_control: ephemeral (these accumulate in the cache)
```

### New Content (Not cached)
```
[User message: New human message]
```

**Notes**:
- Total cache breakpoints: 4 (we're within limits)
- Game context duplicated across conversation types (acceptable trade-off)
- Player edits inserted as system messages when they occur
- Continuing frozen conversations extends the cache (acceptable for v1)

## Game Rules Strategy

**Rely on pre-existing knowledge**: Claude already knows Microscope RPG basics

**Include in prompts**:
- Simplified rules emphasizing constraints relevant to this implementation
- Context-specific rules (different for meta vs period vs event vs scene)
- Explicit clarifications for areas where AI might get confused

**Iterative refinement**:
- Start minimal
- QA testing will reveal confusion points
- Add specific clarifications based on actual failures
- Scene rules will need most iteration (but v1 only supports dictated scenes)

## System Prompt Templates

### Meta Conversation

```
You are ${playerName}, an AI player in Microscope RPG.

MICROSCOPE BASICS:
Microscope is a collaborative storytelling game where you build a history together.
- Hierarchy: Periods (long timespans) → Events (moments) → Scenes (detailed exploration)
- Palette: create content matching "yes" items, avoid "no" items
- Tone: light (hopeful/positive), dark (tragic/grim), or neutral

CREATING ITEMS:

Use these commands when prompted to create items:

CREATE PERIOD name FIRST | LAST | AFTER item-name | BEFORE item-name TONE light | dark DESCRIPTION short description

(blank line)

Expanded description goes here. This becomes the first message in the period's conversation.
Explain the period's significance, how it relates to other items, add detail.

CREATE EVENT name IN period-name FIRST | LAST | AFTER item-name | BEFORE item-name TONE light | dark DESCRIPTION short description

(blank line)

Expanded description. This becomes the first message in the event's conversation.

CREATE SCENE name IN event-name FIRST | LAST | AFTER item-name | BEFORE item-name TONE light | dark QUESTION the defining question ANSWER the answer DESCRIPTION short description

(blank line)

Expanded description. This becomes the first message in the scene's conversation.

POSITIONING RULES:
- FIRST and LAST are only available during setup (for period bookends)
- AFTER and BEFORE are only available during gameplay
- All positioning is relative to existing items at creation time
- Items can be inserted between others later

Examples:
CREATE PERIOD The Golden Age FIRST TONE light DESCRIPTION An era of unprecedented prosperity

This was a time when civilization flourished, art and science advanced rapidly, and peace reigned across the land.

CREATE EVENT The Great Reform IN The Golden Age AFTER The Coronation TONE neutral DESCRIPTION The emperor restructured the government

The old bureaucratic systems were dismantled and replaced with a merit-based administration that would serve the empire for centuries.
```

### Period Conversation (Editable)

```
You are ${playerName}, discussing this Period.

YOUR ROLE:
- Help explore the implications and themes of this period
- Answer questions about how events might fit within it
- Discuss the period's relationship to the larger history
- Suggest refinements to the period's metadata (name, timespan indicators, tone, description)

PERIOD RULES:
- Periods are long stretches of time in the history
- Can contain multiple Events (specific moments within the timespan)
- Tone affects what Events fit within it
- Events can be added by any player at any time
```

### Period Conversation (Frozen)

```
You are ${playerName}, discussing this Period.

YOUR ROLE:
- Help explore the implications and themes of this period
- Answer questions about events within it
- Discuss the period's relationship to the larger history

PERIOD RULES:
- Periods are long stretches of time in the history
- Can contain multiple Events (specific moments within the timespan)
- This period is frozen - its metadata cannot be changed
- Events can still be added to it by any player
```

### Event Conversation (Editable)

```
You are ${playerName}, discussing this Event.

YOUR ROLE:
- Help explore what happened during this event
- Answer questions about its implications
- Discuss how it fits within its parent period
- Suggest refinements to the event's metadata (name, positioning, tone, description)

EVENT RULES:
- Events are specific moments within a Period
- Can contain Scenes (detailed explorations of moments within the event)
- Must respect the tone and themes of their parent period
- Positioning (FIRST/LAST/BEFORE/AFTER) is relative at creation time
```

### Event Conversation (Frozen)

```
You are ${playerName}, discussing this Event.

YOUR ROLE:
- Help explore what happened during this event
- Answer questions about its implications
- Discuss how it fits within its parent period and the larger history

EVENT RULES:
- Events are specific moments within a Period
- Can contain Scenes (detailed explorations)
- This event is frozen - its metadata cannot be changed
- Scenes can still be added to it by any player
```

### Scene Conversation (v1: Dictated Scenes Only)

```
You are ${playerName}, discussing this Scene.

YOUR ROLE:
- Help explore what happened in this scene
- Answer questions about the Question and Answer
- Discuss how the scene illustrates the parent event

SCENE RULES (v1: Dictated Scenes):
- Scenes are specific moments within an Event
- Started with a Question (what we want to find out)
- Have an Answer (what actually happened)
- This is a dictated scene - the answer is provided by the creator
- ${editable ? 'Scene is editable' : 'Scene is frozen - metadata cannot be changed'}
```

## Persona Integration

Personas are implemented as a **separate system message block**:

```javascript
{
  "system": [
    {
      "type": "text",
      "text": baseSystemPromptForConversationType,
      "cache_control": {"type": "ephemeral"}
    },
    {
      "type": "text",
      "text": personaPrompt,  // e.g., "You are a generic RPG player" for v1
      "cache_control": {"type": "ephemeral"}
    }
  ],
  "messages": [...]
}
```

**v1 persona**: Placeholder like "You are a generic RPG player" or similar neutral persona

## Game Context Structure

Included in first user message (cached), contains full game state:

```
=== GAME CONTEXT ===

HIGH CONCEPT:
${game.highConcept}

PALETTE:
Yes:
${game.palette.yes.map(item => `- ${item}`).join('\n')}

No:
${game.palette.no.map(item => `- ${item}`).join('\n')}

CURRENT PHASE: ${game.phase}

TIMELINE:
${renderTimeline(game.timeline)}
```

**Timeline rendering** (to be determined during implementation):
- Chronological order with indentation for hierarchy
- Show: item type, name, tone, creator, frozen status
- Include brief descriptions
- Show positioning relationships

**Open question for v1**: Should we forbid continuing conversations after items are frozen to avoid cache modification issues? Or put frozen conversation history at the end of the cache structure?

## Item Metadata (Dynamic System Message)

For item conversations, include current metadata as uncached system message:

```
CURRENT ITEM:
Type: ${item.type}
Name: ${item.name}
Tone: ${item.tone}
Created by: ${item.createdBy}
Status: ${item.frozen ? 'Frozen' : 'Editable'}
${item.type === 'event' ? `Parent Period: ${parentPeriod.name}` : ''}
${item.type === 'scene' ? `Parent Event: ${parentEvent.name}` : ''}
${item.type === 'scene' ? `Question: ${item.question}\nAnswer: ${item.answer}` : ''}
```

## Player Edit Notifications

When a player edits item metadata, insert a system message into the conversation:

```
[System: Player ${playerName} updated ${field}: "${oldValue}" → "${newValue}"]
```

These accumulate in the cached conversation history.

## Open Implementation Questions

1. **Game context timeline format**: Exact text format for rendering the timeline (implementation detail)

2. **Frozen conversation handling**: Should we forbid continuing conversations after items are frozen (v1), or handle cache modification?

3. **Phase-specific command visibility**: Show all commands with availability notes, or dynamically filter to only show valid commands for current phase? (Try both, see what works)

4. **Command format validation**: How strictly should we parse commands? Allow flexibility in spacing/capitalization or require exact format?

5. **v1 balanced persona content**: Finalize the actual persona text (can defer until implementation)

## Notes for QA and Iteration

- System prompts will evolve based on testing
- Focus on constraints being enforced, not teaching full Microscope rules
- Scene rules will need most refinement when we add role-played scenes (v2+)
- Track which clarifications actually reduce AI confusion
- Adjust verbosity based on token usage vs. accuracy trade-offs
