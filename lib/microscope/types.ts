/**
 * Core Microscope RPG data types
 */

export type Tone = 'light' | 'dark';
export type PlayerType = 'human' | 'ai';
export type GamePhase = 'setup' | 'initial_round' | 'playing';

export interface PlayerRef {
  playerId: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  playerId: string; // 'human' or AI player ID
  playerName?: string;
  content: string;
  timestamp: number;
  pending?: boolean; // True while waiting for AI response
  rawContent?: string; // Store raw AI output including commands (for "show unprocessed")
  metadata?: {
    type?: 'item_created' | 'turn_ended' | 'phase_changed';
    linkTo?: {
      type: 'period' | 'event' | 'scene';
      id: string;
    };
  };
}

export interface Conversation {
  id: string;
  messages: Message[];
}

export interface PaletteItem {
  id: string;
  text: string;
  type: 'yes' | 'no'; // "yes and..." or "no and..."
  createdBy: PlayerRef;
}

export interface Period {
  id: string;
  title: string;
  description: string;
  tone: Tone;
  conversationId: string;
  order: number; // For display ordering
  isBookend?: boolean; // True for timeline start/end bookends
  frozen: boolean; // Metadata editable until frozen
  createdBy: PlayerRef;
}

export interface Event {
  id: string;
  periodId: string;
  title: string;
  description: string;
  tone: Tone;
  conversationId: string;
  order: number;
  frozen: boolean;
  createdBy: PlayerRef;
}

export interface Scene {
  id: string;
  eventId: string;
  question: string;
  answer?: string;
  conversationId: string;
  order: number;
  tone: 'light' | 'dark';
  frozen: boolean;
  createdBy: PlayerRef;
}

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  personaPrompt?: string; // System prompt defining their playstyle (for AI players)
}

export interface GameSetup {
  bigPicture: string;
  bookends: {
    start?: string; // Period ID of start bookend
    end?: string; // Period ID of end bookend
  };
  palette: PaletteItem[];
}

export interface APISettings {
  provider: 'claude' | 'openai';
  apiKey: string;
  model?: string;
}

export interface GameState {
  id: string;
  name: string; // User-provided game name
  created: number; // timestamp

  // Game phase tracking
  phase: GamePhase;
  currentTurn: PlayerRef | null; // whose turn it is (null during setup)

  // Setup and timeline
  setup: GameSetup;
  periods: Period[];
  events: Event[];
  scenes: Scene[];

  // Conversations
  conversations: Record<string, Conversation>;
  metaConversationId: string; // For game setup, palette discussion

  // Players
  players: Player[];

  // UI state
  currentSelection?: {
    type: 'meta' | 'period' | 'event' | 'scene';
    id: string;
  };
}

// Helper type for selected item
export type SelectedItem =
  | { type: 'meta' }
  | { type: 'period'; period: Period }
  | { type: 'event'; event: Event; period: Period }
  | { type: 'scene'; scene: Scene; event: Event; period: Period };
