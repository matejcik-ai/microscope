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

**v1 simplification**: No automatic turn order. Human controls when to create, when to prompt AI, and when to end turn.

### The One-Unfrozen-Item Rule

**Critical constraint**: Only ONE item can be unfrozen at a time.

- When human creates an item, it starts **unfrozen** (metadata editable)
- Human cannot create another item while one is unfrozen
- Must "end turn" to freeze current item before creating next one

### Human Item Creation Flow

1. **Create item** (Period or Event):
   - Uses UI to create item
   - Fills metadata (name, tone, description, location in timeline)
   - Item is now **unfrozen** - metadata editable
   - **New item creation UI is locked** - can't create another until turn ends

2. **Work on item**:
   - Edit metadata as needed
   - Write expanded description in item conversation
   - Discuss with AI in item conversation
   - Switch to other conversations if desired (they remain frozen)

3. **End turn** (two ways):
   - **Explicit**: Click "End Turn" button → metadata freezes, can create next item
   - **Implicit**: Prompt AI to create next item → current item freezes, AI creates theirs

### AI Item Creation (When Prompted)

1. Human prompts AI in meta: "Create the next period"
2. **Implicit end turn**: If human has unfrozen item, it freezes now
3. AI uses CREATE command in meta conversation
4. System creates item with metadata from command
5. Expanded description becomes first message in item conversation
6. **Item becomes current unfrozen item** (AI's turn to work on it)
7. Item conversation now open for discussion

**During AI's editing phase**:
- Players can discuss item in its conversation
- Players can ask AI for clarification
- AI can edit item metadata (v1 nice-to-have feature)
- Human can view and potentially edit metadata (see underspecified/concurrent-editing.md)

**Ending AI's turn**:
- **Explicit**: Human clicks "End Turn" on AI's item → freezes it
- **Implicit**: Human prompts AI "create the next item" → current freezes, AI creates new one
- **Implicit**: Human creates their own item → AI's item freezes, human's becomes current

### Conversations During Editing

While human has unfrozen item:
- ✅ Can view/chat in ANY conversation (meta or item conversations)
- ✅ Can discuss unfrozen item with AI
- ✅ Can ask AI questions about other items
- ❌ Cannot edit metadata of other (frozen) items
- ❌ Cannot create new items (UI locked)

### Phase Transition

Human decides when initial setup is complete:
- Clicks "Finish Initial Round" button
- If item is unfrozen, it freezes now
- Phase becomes 'playing'

## Playing Phase (v1)
**Continue building the history collaboratively.**

1. **Same mechanics as Initial Round**:
   - Human creates items (unfrozen)
   - Works on them, then ends turn (explicit or implicit)
   - Prompts AI to create items when desired
   - One-unfrozen-item rule still applies

2. Human and AI create additional periods, events, scenes
3. Game continues until human decides it's complete

## v2 Features (Future)
- **Automatic turn management**: System tracks whose turn it is
- **Round-robin turns**: Each player gets one turn, then next player
- **Focus mechanic**: Player chooses focus for the round
- **Proactive AI**: AI can take turns automatically when it's their turn
