# Microscope RPG AI Assistant - Technical Specification

## Project Overview
A React SPA for playing Microscope RPG with AI co-players. Fully local (v1), localStorage persistence, user-supplied API keys. Every game item has its own conversation thread that persists in cached context forever.

## Non-Negotiable Constraints

**DO NOT deviate from these without explicit user approval:**

1. **No backend** in v1 - everything localStorage
2. **Every conversation is permanent** - never delete or truncate conversation history
3. **Metadata is editable until "end turn"** - then frozen
4. **All game history goes into cached context** on every API call
5. **React** - no other framework
6. **User supplies single global API key** - stored in localStorage, used for all AI calls
7. **Support multiple game instances** - user can create/delete/switch between games

---

## Data Model

### Global App State

```typescript
// Top-level app state
type AppState = {
  // Global settings
  apiKey: string; // Single key for all AI calls
  
  // Game management
  games: Map<gameId, Game>;
  activeGameId: string | null;
  
  // UI state
  activeConversation: 'meta' | itemId;
  sidebarCollapsed: boolean;
}
```

### Game Structure

```typescript
// Core game structure
type Game = {
  id: string;
  created: timestamp;
  name: string; // User-provided game name
  
  // Setup phase data
  highConcept: string;
  palette: PaletteItem[];
  bookendPeriods: [Period, Period]; // start and end
  
  // Game state
  phase: 'setup' | 'initial_round' | 'playing';
  currentTurn: PlayerRef; // whose turn it is
  
  // Game timeline
  periods: Period[];
  
  // All conversations
  metaConversation: Conversation;
  itemConversations: Map<itemId, Conversation>;
  
  // Players
  players: Player[]; // mix of human and AI
}

type PaletteItem = {
  id: string;
  text: string;
  type: 'yes' | 'no'; // "yes and..." or "no and..."
  createdBy: PlayerRef;
}

type Period = {
  id: string;
  name: string;
  description: string; // brief
  tone: 'light' | 'dark';
  order: number; // position in timeline
  
  events: Event[];
  
  // Metadata - editable until frozen
  frozen: boolean;
  createdBy: PlayerRef;
}

type Event = {
  id: string;
  parentPeriod: string; // Period.id
  name: string;
  description: string;
  tone: 'light' | 'dark';
  order: number; // position within period
  
  scenes: Scene[]; // v2 feature
  
  frozen: boolean;
  createdBy: PlayerRef;
}

type Scene = {
  id: string;
  parentEvent: string;
  question: string; // what we're trying to answer
  answer: string; // resolved outcome
  tone: 'light' | 'dark';
  order: number;
  
  // v2: detailed roleplay
  // v1: just dictated outcome
  
  frozen: boolean;
  createdBy: PlayerRef;
}

type Conversation = {
  id: string;
  messages: Message[];
}

type Message = {
  id: string;
  timestamp: timestamp;
  role: 'user' | 'assistant' | 'system';
  content: string;
  
  // For system messages
  type?: 'item_created' | 'turn_ended' | 'phase_changed';
  metadata?: any;
}

type Player = {
  id: string;
  name: string;
  type: 'human' | 'ai';
  
  // For AI players
  personaPrompt?: string; // system prompt defining their playstyle
}

type PlayerRef = {
  playerId: string;
}
```

---

## Game Phases

### Setup Phase (v1)
**Occurs in meta conversation only.**

1. Human and AI(s) discuss and collaboratively create:
   - High concept (single sentence)
   - Palette (yes/no items)
   - Two bookend periods (earliest and latest in timeline)

2. AI can create items via commands (see Commands section)
3. **All items editable** during setup
4. Human confirms "start game" → moves to initial_round phase
5. At phase transition, freeze all existing items

### Initial Round (v1)
**Round-robin: each player creates one Period OR one Event.**

1. System assigns turn order
2. On player's turn:
   - Human: uses UI to fill metadata, writes expanded description in item conversation
   - AI: uses CREATE command in meta chat
3. Turn ends when:
   - Human clicks "End Turn" button
   - AI creates next item (implicit end turn)
4. Item metadata freezes on turn end
5. Round ends when all players have gone once → phase becomes 'playing'

### Playing Phase (v2 - not in scope for v1)
Focus mechanic, more complex turn logic.

---

## Conversation Architecture

### Meta Conversation
- **Purpose**: Coordination, setup, event stream
- **Participants**: All players
- **Content**:
  - Setup phase: discussion, AI commands to create palette/bookends
  - Game phase: "go create your next item", AI acknowledgments, system event messages
  - Event stream: system messages like "🎯 Alice created Event: The Betrayal"

### Per-Item Conversations
- **Purpose**: Deep discussion of specific item's details
- **Participants**: Any player can join
- **Created when**: Item is created
- **First message**: Expanded description (from CREATE command or human input)
- **Lifecycle**:
  - Editable phase: players discuss, refine, AI can ask clarifying questions
  - After "end turn": conversation continues but metadata frozen
  - Conversation never deleted, always in context

### UI Flow Example
1. In meta chat, AI says "I'll create the Period of Strife" and executes CREATE command
2. System message appears: "🎯 AI created Period: Period of Strife [click to view]"
3. Human clicks through → opens per-item conversation for that Period
4. First message (from AI): expanded description from CREATE command
5. Human asks questions, AI elaborates
6. Human satisfied → clicks "End Turn" in UI
7. Period metadata freezes, turn advances

---

## AI Commands

AI issues commands in meta conversation by outputting structured text:

```
CREATE_PALETTE:
- type: yes
  text: "Advanced technology exists"
- type: no
  text: "No widespread space travel"
```

```
CREATE_PERIOD:
name: "The Period of Strife"
location: "after Period of Awakening"
tone: dark
brief_description: "Decades of civil war tear apart the old order"
expanded_description: |
  The fragile peace established during the Awakening could not hold.
  Regional warlords, each claiming legitimacy from the old empire,
  plunged the continent into chaos. Cities burned, trade routes
  collapsed, and knowledge was lost as libraries became fortresses.
```

```
CREATE_EVENT:
name: "Sacking of Volgograd"
parent: "Period of Strife"
location: "after The Great Schism"
tone: dark
brief_description: "The northern capital falls to General Zhao's forces"
expanded_description: |
  [detailed narrative goes here, becomes first message in item conversation]
```

**Command Parser**: Extract these from AI messages, execute the creation, move expanded_description to new item's conversation.

---

## Claude API Integration & Caching

### Context Structure (Every API Call)

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

### buildCachedGameContext()

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

### API Call Sites

1. **Meta conversation**: Send message from human or trigger AI turn
2. **Item conversation**: Send message in specific item's thread
3. Both use same cached context, just different "current conversation" appended

---

## State Management

```typescript
const AppContext = {
  // Global
  apiKey: string,
  setApiKey: (key: string) => void,
  
  // Game management
  games: Map<gameId, Game>,
  activeGameId: string | null,
  createGame: () => string, // returns new game ID
  deleteGame: (gameId: string) => void,
  setActiveGame: (gameId: string) => void,
  
  // Active game state (when activeGameId !== null)
  activeGame: Game | null,
  activeConversation: 'meta' | itemId,
  
  // Actions (operate on active game)
  sendMessage: (conversationId, content) => void,
  createItem: (type, data) => void,
  endTurn: () => void,
  updateItemMetadata: (itemId, updates) => void,
  
  // API state
  apiCallInProgress: boolean,
}
```

Use React Context + useReducer, or Zustand if you prefer. Persist to localStorage on every state change.

---

## localStorage Structure

```javascript
// localStorage keys
{
  "microscope_apiKey": "sk-ant-...",
  "microscope_games": {
    "game-uuid-1": { /* full Game object */ },
    "game-uuid-2": { /* full Game object */ },
    // ...
  },
  "microscope_activeGameId": "game-uuid-1"
}
```

---

## Component Hierarchy

```
App
├── GlobalHeader
│   ├── APIKeyInput (in settings menu)
│   ├── GameSelector (dropdown of all games)
│   └── NewGameButton
│
├── NoAPIKeyPrompt (when !apiKey)
│
├── GameList (when no active game)
│   └── GameCard[] (click to load, delete button)
│
├── GameSetup (when activeGame && phase === 'setup')
│   ├── HighConceptInput
│   ├── PaletteEditor
│   ├── BookendsEditor
│   └── MetaConversation
│
├── GameBoard (when activeGame && phase === 'initial_round' | 'playing')
│   ├── Timeline
│   │   ├── PeriodCard[]
│   │   │   └── EventCard[]
│   │   
│   ├── ActiveConversation (right sidebar or modal)
│   │   ├── ConversationThread
│   │   ├── MessageInput
│   │   └── [EndTurnButton if item conversation]
│   │
│   └── MetaConversation (collapsible bottom panel)
│
└── Settings
    ├── APIKeyInput
    └── PlayerManagement (add/remove AI personas)
```

---

## UI Flow for Multi-Game

1. App loads → check for apiKey in localStorage
2. If no apiKey → show prompt, block everything else
3. If apiKey exists → show game list
4. User creates new game or selects existing → load that game's full state
5. Global header always shows: current game name, game selector dropdown, settings (with API key)
6. User can switch games anytime (saves current state first)
7. Delete game → confirm dialog → remove from localStorage

---

## Sub-Agent Workflow for Claude Code

Use CC's sub-agent feature to simulate a dev team:

### Main Agent: Tech Lead
- Reads this spec
- Breaks work into tasks
- Delegates to sub-agents
- Integrates their work
- Asks user for clarification only when spec is ambiguous

### Sub-Agent 1: Implementation
**Instructions**: "You are a React developer. Implement the exact component/feature specified. Use TypeScript. Follow the data model precisely. Do not add features not in spec."

**Tasks**:
- Build data model types
- Implement state management
- Build individual components
- API integration with caching

### Sub-Agent 2: Spec Compliance Checker
**Instructions**: "Review code against the specification. Flag any deviations: added features, missing constraints, different data structures, wrong conversation flow. Be pedantic."

**Tasks**:
- Review each PR/implementation
- Check data model matches spec
- Verify conversation flows
- Confirm caching architecture

### Sub-Agent 3: QA/Testing
**Instructions**: "Test the implementation. Verify: localStorage persistence, API caching headers, conversation isolation, metadata freezing, command parsing. Write test cases."

**Tasks**:
- Test game phase transitions
- Verify turn mechanics
- Test command parsing
- Check context building

---

## Implementation Phases

### Phase 0: Foundation
- [ ] Data model types
- [ ] Global app state management
- [ ] Game list/selection UI
- [ ] Create/delete game functionality
- [ ] Global API key management (persisted separately)
- [ ] "No API key" prompt/blocker
- [ ] localStorage persistence
- [ ] State management setup

### Phase 1: Setup Phase
- [ ] High concept input
- [ ] Palette editor (human can add/edit)
- [ ] Bookend period creation (human)
- [ ] Meta conversation component
- [ ] AI command parser for CREATE_PALETTE, CREATE_PERIOD
- [ ] "Start Game" transition

### Phase 2: Core Game Loop
- [ ] Timeline visualization (periods, events)
- [ ] Turn tracking system
- [ ] Per-item conversation creation
- [ ] CREATE_EVENT command
- [ ] End turn mechanism
- [ ] Metadata freezing

### Phase 3: Context & Caching
- [ ] buildCachedGameContext() implementation
- [ ] Prompt caching integration
- [ ] Test with growing game (10+ periods/events)

### Phase 4: Polish
- [ ] System messages in meta chat
- [ ] Click-through from event stream to item
- [ ] UI for switching between conversations
- [ ] Error handling, loading states

---

## Key Constraints to Enforce

When implementing, **refuse to**:
1. Truncate or summarize conversation history
2. Use a database instead of localStorage
3. Make metadata editable after freezing
4. Skip caching on game context
5. Merge conversations or lose per-item isolation
6. Add features not in v1 scope (scenes with roleplay, focus mechanic, proactive AI)
7. Store API key per-game or per-player (it's global only)
8. Allow gameplay without API key set

---

## Questions to Ask User Before Starting

(Claude Code should ask these if ambiguous):

1. Should bookend periods have conversations in setup phase, or stay empty until game starts?
2. What happens if AI fails to parse a command - retry automatically or ask human?
3. Should there be undo/redo during editable phase?
4. Max number of AI personas to support in v1?

---

## How to Use This Spec

"Implement this exactly. Use sub-agents: Tech Lead delegates to Implementation, Spec Checker reviews, QA tests. Ask me questions only if spec is genuinely ambiguous. Do not add features or deviate from data model."

**Expected behavior**: CC should break this into tasks, implement systematically, and check its own work against the spec using sub-agents. It should NOT ask "should I use Redux or Context?" because the answer is "whatever works, spec doesn't care" - make decision and move on.

---

## Version Scope Clarifications

### v0 (Minimal Viable)
- Single AI player
- Human manually instructs AI when to create items
- Basic setup phase + initial round only

### v1 (Current Target)
- Multiple AI players with personas
- Round-robin turn tracking (system manages whose turn)
- Human clicks "end turn" when satisfied
- Full prompt caching
- Multi-game support

### v2 (Future)
- Focus mechanic
- Detailed scenes with roleplay
- Proactive AI (detects when to speak based on conversation flow)
- Potentially multi-player with backend

**Current implementation should target v1.**
