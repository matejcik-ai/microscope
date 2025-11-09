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

  const addPeriod = useCallback((
    title: string,
    description: string,
    tone: 'light' | 'dark',
    isBookend: boolean = false,
    placement?: { type: 'first' } | { type: 'after' | 'before', relativeTo: string }
  ): string | null => {
    let createdId: string | null = null;
    setGameState((prev) => {
      if (!prev) return prev;

      const conversationId = crypto.randomUUID();
      const periodId = crypto.randomUUID();
      createdId = periodId;

      // Determine the insertion index based on placement
      let insertIndex = prev.periods.length; // Default: append to end

      if (placement) {
        if (placement.type === 'first') {
          // Find first non-bookend period
          insertIndex = prev.periods.findIndex(p => !p.isBookend);
          if (insertIndex === -1) insertIndex = prev.periods.length;
        } else {
          // Find the referenced period
          const referencePeriod = prev.periods.find(p =>
            p.title.toLowerCase() === placement.relativeTo.toLowerCase()
          );
          if (referencePeriod) {
            const refIndex = prev.periods.indexOf(referencePeriod);
            insertIndex = placement.type === 'after' ? refIndex + 1 : refIndex;
          }
        }
      }

      const period: Period = {
        id: periodId,
        title,
        description,
        tone,
        conversationId,
        order: 0, // Will be recalculated below
        isBookend,
      };

      // Insert period at the calculated index
      const newPeriods = [...prev.periods];
      newPeriods.splice(insertIndex, 0, period);

      // Recalculate order for all periods
      newPeriods.forEach((p, idx) => {
        p.order = idx;
      });

      return {
        ...prev,
        periods: newPeriods,
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

  const updatePeriod = useCallback((id: string, updates: Partial<Period>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        periods: prev.periods.map(period =>
          period.id === id ? { ...period, ...updates } : period
        ),
      };
    });
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<Event>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        events: prev.events.map(event =>
          event.id === id ? { ...event, ...updates } : event
        ),
      };
    });
  }, []);

  const updateScene = useCallback((id: string, updates: Partial<any>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        scenes: prev.scenes.map(scene =>
          scene.id === id ? { ...scene, ...updates } : scene
        ),
      };
    });
  }, []);

  const updatePalette = useCallback((yesItems: string[], noItems: string[]) => {
    setGameState((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        setup: {
          ...prev.setup,
          palette: {
            yes: yesItems,
            no: noItems,
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


  const deletePeriod = useCallback((id: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const period = prev.periods.find(p => p.id === id);
      if (!period) return prev;

      // Remove period and its conversation
      const { [period.conversationId]: _, ...remainingConversations } = prev.conversations;

      // Remove all events in this period and their conversations
      const eventsToRemove = prev.events.filter(e => e.periodId === id);
      const eventConvIds = eventsToRemove.map(e => e.conversationId);
      const filteredConversations = Object.fromEntries(
        Object.entries(remainingConversations).filter(([k]) => !eventConvIds.includes(k))
      );

      // Remove all scenes in those events and their conversations
      const scenesToRemove = prev.scenes.filter(s => eventsToRemove.some(e => e.id === s.eventId));
      const sceneConvIds = scenesToRemove.map(s => s.conversationId);
      const finalConversations = Object.fromEntries(
        Object.entries(filteredConversations).filter(([k]) => !sceneConvIds.includes(k))
      );

      return {
        ...prev,
        periods: prev.periods.filter(p => p.id !== id),
        events: prev.events.filter(e => e.periodId !== id),
        scenes: prev.scenes.filter(s => !eventsToRemove.some(e => e.id === s.eventId)),
        conversations: finalConversations,
        currentSelection: prev.currentSelection?.id === id ? undefined : prev.currentSelection,
      };
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const event = prev.events.find(e => e.id === id);
      if (!event) return prev;

      // Remove event and its conversation
      const { [event.conversationId]: _, ...remainingConversations } = prev.conversations;

      // Remove all scenes in this event and their conversations
      const scenesToRemove = prev.scenes.filter(s => s.eventId === id);
      const sceneConvIds = scenesToRemove.map(s => s.conversationId);
      const finalConversations = Object.fromEntries(
        Object.entries(remainingConversations).filter(([k]) => !sceneConvIds.includes(k))
      );

      return {
        ...prev,
        events: prev.events.filter(e => e.id !== id),
        scenes: prev.scenes.filter(s => s.eventId !== id),
        conversations: finalConversations,
        currentSelection: prev.currentSelection?.id === id ? undefined : prev.currentSelection,
      };
    });
  }, []);

  const deleteScene = useCallback((id: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const scene = prev.scenes.find(s => s.id === id);
      if (!scene) return prev;

      // Remove scene and its conversation
      const { [scene.conversationId]: _, ...remainingConversations } = prev.conversations;

      return {
        ...prev,
        scenes: prev.scenes.filter(s => s.id !== id),
        conversations: remainingConversations,
        currentSelection: prev.currentSelection?.id === id ? undefined : prev.currentSelection,
      };
    });
  }, []);

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
    updatePeriod,
    updateEvent,
    updateScene,
    updatePalette,
    setSelection,
    getSelectedConversation,
    deletePeriod,
    deleteEvent,
    deleteScene,
    reset,
    switchGame,
    createNewGame,
    loadGame,
  };
}
