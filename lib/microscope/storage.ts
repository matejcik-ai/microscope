/**
 * LocalStorage utilities for game state persistence
 */

import type { GameState, APISettings } from './types';

const GAMES_LIST_KEY = 'microscope-games-list';
const CURRENT_GAME_KEY = 'microscope-current-game-id';
const GAME_PREFIX = 'microscope-game-';
const API_SETTINGS_KEY = 'microscope-api-settings'; // Global API settings
const OLD_STORAGE_KEY = 'microscope-game-state'; // Legacy key for migration

export interface GameMetadata {
  id: string;
  name: string;
  created: number;
  lastPlayed: number;
  bigPicture: string; // For quick preview
}

// Multi-game support functions
export function listGames(): GameMetadata[] {
  try {
    const stored = localStorage.getItem(GAMES_LIST_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to list games:', error);
    return [];
  }
}

export function saveGamesList(games: GameMetadata[]): void {
  try {
    localStorage.setItem(GAMES_LIST_KEY, JSON.stringify(games));
  } catch (error) {
    console.error('Failed to save games list:', error);
  }
}

export function getCurrentGameId(): string | null {
  try {
    return localStorage.getItem(CURRENT_GAME_KEY);
  } catch (error) {
    console.error('Failed to get current game ID:', error);
    return null;
  }
}

export function setCurrentGameId(gameId: string): void {
  try {
    localStorage.setItem(CURRENT_GAME_KEY, gameId);
  } catch (error) {
    console.error('Failed to set current game ID:', error);
  }
}

export function createNewGame(name: string): GameMetadata {
  const gameId = `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const metadata: GameMetadata = {
    id: gameId,
    name,
    created: Date.now(),
    lastPlayed: Date.now(),
    bigPicture: '',
  };

  const games = listGames();
  games.push(metadata);
  saveGamesList(games);

  return metadata;
}

export function deleteGame(gameId: string): void {
  try {
    // Remove from games list
    const games = listGames().filter(g => g.id !== gameId);
    saveGamesList(games);

    // Remove game data
    localStorage.removeItem(GAME_PREFIX + gameId);

    // Clear current game if it was deleted
    if (getCurrentGameId() === gameId) {
      localStorage.removeItem(CURRENT_GAME_KEY);
    }
  } catch (error) {
    console.error('Failed to delete game:', error);
  }
}

export function updateGameMetadata(gameId: string, updates: Partial<GameMetadata>): void {
  const games = listGames();
  const gameIndex = games.findIndex(g => g.id === gameId);
  if (gameIndex !== -1) {
    games[gameIndex] = { ...games[gameIndex], ...updates, lastPlayed: Date.now() };
    saveGamesList(games);
  }
}

// Game state functions (updated for multi-game)
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_PREFIX + state.id, JSON.stringify(state));

    // Update metadata
    updateGameMetadata(state.id, {
      name: state.setup.bigPicture || 'Untitled Game',
      bigPicture: state.setup.bigPicture,
    });
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(gameId: string): GameState | null {
  try {
    const stored = localStorage.getItem(GAME_PREFIX + gameId);
    if (!stored) return null;

    // Update last played
    updateGameMetadata(gameId, {});

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export function clearGameState(gameId: string): void {
  try {
    localStorage.removeItem(GAME_PREFIX + gameId);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

export function exportGameState(state: GameState): string {
  return JSON.stringify(state, null, 2);
}

export function importGameState(json: string): GameState {
  return JSON.parse(json);
}

// Global API Settings functions
export function saveAPISettings(settings: APISettings): void {
  try {
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save API settings:', error);
  }
}

export function loadAPISettings(): APISettings | null {
  try {
    const stored = localStorage.getItem(API_SETTINGS_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load API settings:', error);
    return null;
  }
}

/**
 * Migrate old single-game storage to new multi-game format
 * Called automatically when loading games
 */
export function migrateOldStorage(): void {
  try {
    const oldData = localStorage.getItem(OLD_STORAGE_KEY);
    if (!oldData) return; // Nothing to migrate

    // Check if already migrated
    const games = listGames();
    if (games.length > 0) {
      // Already have games in new format, don't migrate
      // But clean up old key
      localStorage.removeItem(OLD_STORAGE_KEY);
      return;
    }

    // Parse old game state
    const oldGameState: GameState = JSON.parse(oldData);

    // Migrate API settings to global storage if they exist
    if (oldGameState.apiSettings) {
      saveAPISettings(oldGameState.apiSettings);
    }

    // Create a new game ID if the old one doesn't have one
    const gameId = oldGameState.id || `game-${Date.now()}-migrated`;

    // Update game state with proper ID (remove apiSettings from game state)
    const { apiSettings: _, ...gameStateWithoutApiSettings } = oldGameState;
    const migratedGameState: GameState = {
      ...gameStateWithoutApiSettings,
      id: gameId,
    };

    // Create metadata
    const metadata: GameMetadata = {
      id: gameId,
      name: migratedGameState.setup.bigPicture || 'Migrated Game',
      created: Date.now(),
      lastPlayed: Date.now(),
      bigPicture: migratedGameState.setup.bigPicture || '',
    };

    // Save to new format
    localStorage.setItem(GAME_PREFIX + gameId, JSON.stringify(migratedGameState));
    saveGamesList([metadata]);
    setCurrentGameId(gameId);

    // Remove old key
    localStorage.removeItem(OLD_STORAGE_KEY);

    console.log('Successfully migrated game from old storage format');
  } catch (error) {
    console.error('Failed to migrate old storage:', error);
  }
}
