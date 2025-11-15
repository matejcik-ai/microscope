# Data Model

## Global App State

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

## Game Structure

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
