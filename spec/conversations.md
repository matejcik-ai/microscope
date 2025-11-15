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

## UI Flow Example
1. In meta chat, AI says "I'll create the Period of Strife" and executes CREATE command
2. System message appears: "🎯 AI created Period: Period of Strife [click to view]"
3. Human clicks through → opens per-item conversation for that Period
4. First message (from AI): expanded description from CREATE command
5. Human asks questions, AI elaborates
6. Human satisfied → clicks "End Turn" in UI
7. Period metadata freezes, turn advances
