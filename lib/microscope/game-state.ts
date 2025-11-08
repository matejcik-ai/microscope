'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameState, Period, Event, Message, Conversation } from './types';
import { saveGameState, loadGameState, getCurrentGameId, setCurrentGameId, createNewGame as createNewGameMetadata, migrateOldStorage } from './storage';

function createEmptyGameState(gameId: string): GameState {
  const metaConversationId = crypto.randomUUID();

  return {
    id: gameId,
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

export function useGameState(initialGameId?: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentGameId, setCurrentGameIdState] = useState<string | null>(null);

  // Load game from localStorage
  const loadGame = useCallback((gameId: string) => {
    const loaded = loadGameState(gameId);
    if (loaded) {
      setGameState(loaded);
      setCurrentGameIdState(gameId);
      setCurrentGameId(gameId);
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    // Run migration first (only happens if old data exists)
    migrateOldStorage();

    const gameId = initialGameId || getCurrentGameId();

    if (gameId) {
      const loaded = loadGameState(gameId);
      if (loaded) {
        setGameState(loaded);
        setCurrentGameIdState(gameId);
      } else {
        // Game ID exists but no data - create new
        const metadata = createNewGameMetadata('New Game');
        const newGame = createEmptyGameState(metadata.id);
        setGameState(newGame);
        setCurrentGameIdState(metadata.id);
        setCurrentGameId(metadata.id);
        saveGameState(newGame);
      }
    } else {
      // No current game - create first game
      const metadata = createNewGameMetadata('My First Game');
      const newGame = createEmptyGameState(metadata.id);
      setGameState(newGame);
      setCurrentGameIdState(metadata.id);
      setCurrentGameId(metadata.id);
      saveGameState(newGame);
    }
    setIsLoaded(true);
  }, [initialGameId]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (gameState && isLoaded) {
      saveGameState(gameState);
    }
  }, [gameState, isLoaded]);

  const addPeriod = useCallback((title: string, description: string, tone: 'light' | 'dark', isBookend: boolean = false): string | null => {
    let createdId: string | null = null;
    setGameState((prev) => {
      if (!prev) return prev;

      const conversationId = crypto.randomUUID();
      const periodId = crypto.randomUUID();
      createdId = periodId;

      const period: Period = {
        id: periodId,
        title,
        description,
        tone,
        conversationId,
        order: prev.periods.length,
        isBookend,
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
    return createdId;
  }, []);

  const addPaletteItem = useCallback((category: 'yes' | 'no', item: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const newPalette = { ...prev.setup.palette };
      if (!newPalette[category].includes(item)) {
        newPalette[category] = [...newPalette[category], item];
      }

      return {
        ...prev,
        setup: {
          ...prev.setup,
          palette: newPalette,
        },
      };
    });
  }, []);

  const findPeriodByTitle = useCallback((title: string): Period | null => {
    if (!gameState) return null;
    return gameState.periods.find(p =>
      p.title.toLowerCase() === title.toLowerCase()
    ) || null;
  }, [gameState]);

  const findEventByTitle = useCallback((title: string): Event | null => {
    if (!gameState) return null;
    return gameState.events.find(e =>
      e.title.toLowerCase() === title.toLowerCase()
    ) || null;
  }, [gameState]);

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

  const addMessageWithId = useCallback((conversationId: string, message: Message) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const conversation = prev.conversations[conversationId];
      if (!conversation) return prev;

      return {
        ...prev,
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            ...conversation,
            messages: [...conversation.messages, message],
          },
        },
      };
    });
  }, []);

  const updateMessage = useCallback((conversationId: string, messageId: string, updates: Partial<Message>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const conversation = prev.conversations[conversationId];
      if (!conversation) return prev;

      return {
        ...prev,
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            ...conversation,
            messages: conversation.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          },
        },
      };
    });
  }, []);

  const removeMessage = useCallback((conversationId: string, messageId: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const conversation = prev.conversations[conversationId];
      if (!conversation) return prev;

      return {
        ...prev,
        conversations: {
          ...prev.conversations,
          [conversationId]: {
            ...conversation,
            messages: conversation.messages.filter(msg => msg.id !== messageId),
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


  const reset = useCallback(() => {
    if (!currentGameId) return;
    const newGame = createEmptyGameState(currentGameId);
    setGameState(newGame);
    saveGameState(newGame);
  }, [currentGameId]);

  const switchGame = useCallback((gameId: string) => {
    loadGame(gameId);
  }, [loadGame]);

  const createNewGame = useCallback((name: string) => {
    const metadata = createNewGameMetadata(name);
    const newGame = createEmptyGameState(metadata.id);
    setGameState(newGame);
    setCurrentGameIdState(metadata.id);
    setCurrentGameId(metadata.id);
    saveGameState(newGame);
  }, []);

  return {
    gameState,
    isLoaded,
    currentGameId,
    addPeriod,
    addPaletteItem,
    findPeriodByTitle,
    findEventByTitle,
    addEvent,
    addMessage,
    addMessageWithId,
    updateMessage,
    removeMessage,
    setSelection,
    getSelectedConversation,
    reset,
    switchGame,
    createNewGame,
    loadGame,
  };
}
