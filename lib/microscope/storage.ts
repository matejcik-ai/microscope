/**
 * LocalStorage utilities for game state persistence
 */

import type { GameState } from './types';

const STORAGE_KEY = 'microscope-game-state';

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
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
