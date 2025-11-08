/**
 * Core Microscope RPG data types
 */

export type Tone = 'light' | 'dark';
export type PlayerType = 'human' | 'ai';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'error';
  playerId: string; // 'human' or AI player ID
  playerName?: string;
  content: string;
  timestamp: number;
  pending?: boolean; // True while waiting for AI response
  metadata?: {
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

export interface Period {
  id: string;
  title: string;
  description: string;
  tone: Tone;
  conversationId: string;
  order: number; // For display ordering
  isBookend?: boolean; // True for timeline start/end bookends
}

export interface Event {
  id: string;
  periodId: string;
  title: string;
  description: string;
  tone: Tone;
  conversationId: string;
  order: number;
}

export interface Scene {
  id: string;
  eventId: string;
  question: string;
  answer?: string;
  conversationId: string;
  order: number;
}

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  personaId?: string; // For future AI personas
}

export interface GameSetup {
  bigPicture: string;
  bookends: {
    start: string;
    end: string;
  };
  palette: {
    yes: string[]; // Things we want to see
    no: string[]; // Things we don't want
  };
}

export interface APISettings {
  provider: 'claude' | 'openai';
  apiKey: string;
  model?: string;
}

export interface GameState {
  id: string;
  setup: GameSetup;
  periods: Period[];
  events: Event[];
  scenes: Scene[];
  conversations: Record<string, Conversation>;
  players: Player[];
  metaConversationId: string; // For game setup, palette discussion
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
