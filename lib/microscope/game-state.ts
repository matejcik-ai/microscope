'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameState, Period, Event, Message, Conversation, APISettings } from './types';
import { saveGameState, loadGameState } from './storage';

function createEmptyGameState(): GameState {
  const metaConversationId = crypto.randomUUID();

  return {
    id: crypto.randomUUID(),
    setup: {
      bigPicture: '',
      bookends: {
        start: '',
        end: '',
      },
      palette: {
        yes: [],
        no: [],
      },
    },
    periods: [],
    events: [],
    scenes: [],
    conversations: {
      [metaConversationId]: {
        id: metaConversationId,
        messages: [],
      },
    },
    players: [
      {
        id: 'human',
        name: 'You',
        type: 'human',
      },
    ],
    metaConversationId,
  };
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadGameState();
    if (loaded) {
      setGameState(loaded);
    } else {
      // Create new game
      const newGame = createEmptyGameState();
      setGameState(newGame);
      saveGameState(newGame);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (gameState && isLoaded) {
      saveGameState(gameState);
    }
  }, [gameState, isLoaded]);

  const addPeriod = useCallback((title: string, description: string, tone: 'light' | 'dark') => {
    setGameState((prev) => {
      if (!prev) return prev;

      const conversationId = crypto.randomUUID();
      const period: Period = {
        id: crypto.randomUUID(),
        title,
        description,
        tone,
        conversationId,
        order: prev.periods.length,
      };

      return {
        ...prev,
        periods: [...prev.periods, period],
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            id: conversationId,
            messages: [],
          },
        },
      };
    });
  }, []);

  const addEvent = useCallback((periodId: string, title: string, description: string, tone: 'light' | 'dark') => {
    setGameState((prev) => {
      if (!prev) return prev;

      const conversationId = crypto.randomUUID();
      const event: Event = {
        id: crypto.randomUUID(),
        periodId,
        title,
        description,
        tone,
        conversationId,
        order: prev.events.filter(e => e.periodId === periodId).length,
      };

      return {
        ...prev,
        events: [...prev.events, event],
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            id: conversationId,
            messages: [],
          },
        },
      };
    });
  }, []);

  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const conversation = prev.conversations[conversationId];
      if (!conversation) return prev;

      const newMessage: Message = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      return {
        ...prev,
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            ...conversation,
            messages: [...conversation.messages, newMessage],
          },
        },
      };
    });
  }, []);

  const setSelection = useCallback((type: 'meta' | 'period' | 'event' | 'scene', id?: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        currentSelection: id ? { type, id } : { type, id: prev.metaConversationId },
      };
    });
  }, []);

  const getSelectedConversation = useCallback((): Conversation | null => {
    if (!gameState || !gameState.currentSelection) return null;

    const { type, id } = gameState.currentSelection;

    if (type === 'meta') {
      return gameState.conversations[gameState.metaConversationId] || null;
    }

    if (type === 'period') {
      const period = gameState.periods.find(p => p.id === id);
      return period ? gameState.conversations[period.conversationId] || null : null;
    }

    if (type === 'event') {
      const event = gameState.events.find(e => e.id === id);
      return event ? gameState.conversations[event.conversationId] || null : null;
    }

    return null;
  }, [gameState]);

  const setAPISettings = useCallback((settings: APISettings) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        apiSettings: settings,
      };
    });
  }, []);

  const reset = useCallback(() => {
    const newGame = createEmptyGameState();
    setGameState(newGame);
    saveGameState(newGame);
  }, []);

  return {
    gameState,
    isLoaded,
    addPeriod,
    addEvent,
    addMessage,
    setSelection,
    getSelectedConversation,
    setAPISettings,
    reset,
  };
}
