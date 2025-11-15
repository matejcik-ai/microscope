# Game Phases

## Setup Phase (v1)
**Occurs in meta conversation only.**

1. Human and AI discuss and collaboratively create:
   - High concept (single sentence)
   - Palette (yes/no items)
   - Two bookend periods (earliest and latest in timeline)

2. **Human-driven conversation**:
   - Human prompts AI for input whenever desired
   - AI responds when prompted
   - AI can create items via commands (see Commands section)

3. **All items editable** during setup
4. Human confirms "start game" → moves to initial_round phase
5. At phase transition, freeze all existing items

## Initial Round (v1)
**Human-driven creation of initial periods and events.**

**v1 simplification**: No automatic turn management. Human controls conversation flow.

1. **Human creates items**:
   - Uses UI to create Period or Event
   - Fills metadata (name, tone, description, location in timeline)
   - Writes expanded description in item conversation
   - Clicks "End Turn" when done → metadata freezes

2. **AI creates items when prompted**:
   - Human asks AI to create an item in meta conversation
   - AI uses CREATE command in meta chat
   - System creates item with metadata from command
   - Expanded description becomes first message in item conversation
   - Metadata immediately frozen (AI doesn't have "editing phase")

3. **Conversation**:
   - Human can prompt AI anytime for discussion
   - Human can ask AI questions in meta or item conversations
   - Fully conversational - no turn enforcement

4. **Phase transition**:
   - Human decides when initial setup is complete
   - Clicks "Finish Initial Round" → phase becomes 'playing'

## Playing Phase (v1)
**Continue building the history collaboratively.**

1. **Same as Initial Round** - human-driven, conversational
2. Human and AI create additional periods, events, scenes
3. All items frozen on creation
4. Human prompts AI whenever they want its input
5. Game continues until human decides it's complete

## v2 Features (Future)
- **Automatic turn management**: System tracks whose turn it is
- **Round-robin turns**: Each player gets one turn, then next player
- **Focus mechanic**: Player chooses focus for the round
- **Proactive AI**: AI can take turns automatically when it's their turn
