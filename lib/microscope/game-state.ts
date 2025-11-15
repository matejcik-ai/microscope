'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameState, Period, Event, Message, Conversation } from './types';
import { saveGameState, loadGameState, getCurrentGameId, setCurrentGameId, createNewGame as createNewGameMetadata, migrateOldStorage } from './storage';

function createEmptyGameState(gameId: string, gameName: string = 'New Game'): GameState {
  const metaConversationId = crypto.randomUUID();

  return {
    id: gameId,
    name: gameName,
    created: Date.now(),

    // Start in setup phase
    phase: 'setup',
    currentTurn: null, // No turns during setup

    setup: {
      bigPicture: '',
      bookends: {
        start: undefined,
        end: undefined,
      },
      palette: [],
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
        const newGame = createEmptyGameState(metadata.id, metadata.name);
        setGameState(newGame);
        setCurrentGameIdState(metadata.id);
        setCurrentGameId(metadata.id);
        saveGameState(newGame);
      }
    } else {
      // No current game - create first game
      const metadata = createNewGameMetadata('My First Game');
      const newGame = createEmptyGameState(metadata.id, metadata.name);
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
    placement?: { type: 'first' } | { type: 'after' | 'before', relativeTo: string },
    createdByPlayerId: string = 'human'
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
        frozen: false, // New periods start unfrozen
        createdBy: { playerId: createdByPlayerId },
      };

      // Insert period at the calculated index
      const newPeriods = [...prev.periods];
      newPeriods.splice(insertIndex, 0, period);

      // Recalculate order for all periods
      newPeriods.forEach((p, idx) => {
        p.order = idx;
      });

      // Update bookend references if this is a bookend
      let updatedSetup = prev.setup;
      if (isBookend) {
        // Determine if this should be start or end based on position
        // If no bookends exist yet, first one is start, second is end
        const existingBookends = prev.periods.filter(p => p.isBookend);
        if (existingBookends.length === 0) {
          // First bookend - make it the start
          updatedSetup = {
            ...prev.setup,
            bookends: { ...prev.setup.bookends, start: periodId },
          };
        } else if (existingBookends.length === 1 && !prev.setup.bookends.end) {
          // Second bookend - make it the end
          updatedSetup = {
            ...prev.setup,
            bookends: { ...prev.setup.bookends, end: periodId },
          };
        }
      }

      return {
        ...prev,
        setup: updatedSetup,
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

  const addPaletteItem = useCallback((category: 'yes' | 'no', item: string, createdByPlayerId: string = 'human') => {
    setGameState((prev) => {
      if (!prev) return prev;

      // Check if item already exists
      const exists = prev.setup.palette.some(p => p.text === item && p.type === category);
      if (exists) return prev;

      const newItem = {
        id: crypto.randomUUID(),
        text: item,
        type: category,
        createdBy: { playerId: createdByPlayerId },
      };

      return {
        ...prev,
        setup: {
          ...prev.setup,
          palette: [...prev.setup.palette, newItem],
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

  const addEvent = useCallback((
    periodId: string,
    title: string,
    description: string,
    tone: 'light' | 'dark',
    createdByPlayerId: string = 'human'
  ): string | null => {
    let createdId: string | null = null;
    setGameState((prev) => {
      if (!prev) return prev;

      const conversationId = crypto.randomUUID();
      const eventId = crypto.randomUUID();
      createdId = eventId;

      const event: Event = {
        id: eventId,
        periodId,
        title,
        description,
        tone,
        conversationId,
        order: prev.events.filter(e => e.periodId === periodId).length,
        frozen: false, // New events start unfrozen
        createdBy: { playerId: createdByPlayerId },
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
    return createdId;
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

      // SPEC REQUIREMENT: "Metadata is editable until 'end turn' - then frozen"
      // Reject updates to frozen items
      const period = prev.periods.find(p => p.id === id);
      if (period?.frozen) {
        console.warn('Cannot update frozen period:', id);
        return prev;
      }

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

      // SPEC REQUIREMENT: "Metadata is editable until 'end turn' - then frozen"
      // Reject updates to frozen items
      const event = prev.events.find(e => e.id === id);
      if (event?.frozen) {
        console.warn('Cannot update frozen event:', id);
        return prev;
      }

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

      // SPEC REQUIREMENT: "Metadata is editable until 'end turn' - then frozen"
      // Reject updates to frozen items
      const scene = prev.scenes.find(s => s.id === id);
      if (scene?.frozen) {
        console.warn('Cannot update frozen scene:', id);
        return prev;
      }

      return {
        ...prev,
        scenes: prev.scenes.map(scene =>
          scene.id === id ? { ...scene, ...updates } : scene
        ),
      };
    });
  }, []);

  const updatePalette = useCallback((paletteItems: Array<{ text: string; type: 'yes' | 'no' }>) => {
    setGameState((prev) => {
      if (!prev) return prev;

      // Convert to PaletteItem objects, preserving existing IDs and creators
      const newPalette = paletteItems.map((item, index) => {
        // Try to find existing item with same text and type
        const existing = prev.setup.palette.find(p => p.text === item.text && p.type === item.type);
        if (existing) {
          return existing; // Keep the existing item with its ID and creator
        }

        // If not exact match, try to preserve creator from same position and type
        // This handles case where AI created an item and human edits the text
        const sameTypeItems = prev.setup.palette.filter(p => p.type === item.type);
        const sameTypeNewItems = paletteItems.filter(i => i.type === item.type);
        const positionInType = sameTypeNewItems.indexOf(item);
        const creatorToPreserve = sameTypeItems[positionInType]?.createdBy;

        // Create new item, preserving creator if possible
        return {
          id: crypto.randomUUID(),
          text: item.text,
          type: item.type,
          createdBy: creatorToPreserve || { playerId: 'human' }, // Preserve creator or default to human
        };
      });

      return {
        ...prev,
        setup: {
          ...prev.setup,
          palette: newPalette,
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

      // SPEC REQUIREMENT: "Every conversation is permanent - never delete or truncate conversation history"
      // DO NOT delete conversations even when items are removed
      const eventsToRemove = prev.events.filter(e => e.periodId === id);

      return {
        ...prev,
        periods: prev.periods.filter(p => p.id !== id),
        events: prev.events.filter(e => e.periodId !== id),
        scenes: prev.scenes.filter(s => !eventsToRemove.some(e => e.id === s.eventId)),
        // Keep all conversations intact per spec
        currentSelection: prev.currentSelection?.id === id ? undefined : prev.currentSelection,
      };
    });
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const event = prev.events.find(e => e.id === id);
      if (!event) return prev;

      // SPEC REQUIREMENT: "Every conversation is permanent - never delete or truncate conversation history"
      // DO NOT delete conversations even when items are removed

      return {
        ...prev,
        events: prev.events.filter(e => e.id !== id),
        scenes: prev.scenes.filter(s => s.eventId !== id),
        // Keep all conversations intact per spec
        currentSelection: prev.currentSelection?.id === id ? undefined : prev.currentSelection,
      };
    });
  }, []);

  const deleteScene = useCallback((id: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      const scene = prev.scenes.find(s => s.id === id);
      if (!scene) return prev;

      // SPEC REQUIREMENT: "Every conversation is permanent - never delete or truncate conversation history"
      // DO NOT delete conversations even when items are removed

      return {
        ...prev,
        scenes: prev.scenes.filter(s => s.id !== id),
        // Keep all conversations intact per spec
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
    const newGame = createEmptyGameState(metadata.id, name);
    setGameState(newGame);
    setCurrentGameIdState(metadata.id);
    setCurrentGameId(metadata.id);
    saveGameState(newGame);
  }, []);

  // Phase transitions
  const startGame = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.phase !== 'setup') return prev;

      // Freeze all existing periods and events
      const frozenPeriods = prev.periods.map(p => ({ ...p, frozen: true }));
      const frozenEvents = prev.events.map(e => ({ ...e, frozen: true }));

      // Determine first player (human goes first by default)
      const firstPlayer = prev.players[0];

      // Add system message to meta conversation
      const metaConversation = prev.conversations[prev.metaConversationId];
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        playerId: 'system',
        content: `Game started! Entering Initial Round. It's ${firstPlayer.name}'s turn.`,
        timestamp: Date.now(),
        metadata: { type: 'phase_changed' },
      };

      return {
        ...prev,
        phase: 'initial_round',
        currentTurn: { playerId: firstPlayer.id },
        periods: frozenPeriods,
        events: frozenEvents,
        conversations: {
          ...prev.conversations,
          [prev.metaConversationId]: {
            ...metaConversation,
            messages: [...metaConversation.messages, newMessage],
          },
        },
      };
    });
  }, []);

  const endTurn = useCallback(() => {
    setGameState((prev) => {
      if (!prev || !prev.currentTurn) return prev;

      // Freeze the current item being edited
      // This will be the item in currentSelection
      let updatedPeriods = prev.periods;
      let updatedEvents = prev.events;
      let updatedScenes = prev.scenes;

      if (prev.currentSelection) {
        const { type, id } = prev.currentSelection;

        if (type === 'period') {
          updatedPeriods = prev.periods.map(p =>
            p.id === id ? { ...p, frozen: true } : p
          );
        } else if (type === 'event') {
          updatedEvents = prev.events.map(e =>
            e.id === id ? { ...e, frozen: true } : e
          );
        } else if (type === 'scene') {
          updatedScenes = prev.scenes.map(s =>
            s.id === id ? { ...s, frozen: true } : s
          );
        }
      }

      // Advance to next player
      const currentPlayerIndex = prev.players.findIndex(p => p.id === prev.currentTurn?.playerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % prev.players.length;
      const nextPlayer = prev.players[nextPlayerIndex];

      // Check if round is complete (everyone has gone once)
      // For initial_round, transition to playing after everyone goes
      let newPhase = prev.phase;
      if (prev.phase === 'initial_round' && nextPlayerIndex === 0) {
        // Round complete, everyone has gone once
        newPhase = 'playing';
      }

      // Add system message to meta conversation
      const metaConversation = prev.conversations[prev.metaConversationId];
      const turnEndMessage: Message = {
        id: crypto.randomUUID(),
        role: 'system',
        playerId: 'system',
        content: newPhase !== prev.phase
          ? `Initial Round complete! Entering Playing phase. It's ${nextPlayer.name}'s turn.`
          : `Turn ended. It's now ${nextPlayer.name}'s turn.`,
        timestamp: Date.now(),
        metadata: { type: 'turn_ended' },
      };

      return {
        ...prev,
        phase: newPhase,
        currentTurn: { playerId: nextPlayer.id },
        periods: updatedPeriods,
        events: updatedEvents,
        scenes: updatedScenes,
        conversations: {
          ...prev.conversations,
          [prev.metaConversationId]: {
            ...metaConversation,
            messages: [...metaConversation.messages, turnEndMessage],
          },
        },
      };
    });
  }, []);

  const freezeItem = useCallback((type: 'period' | 'event' | 'scene', id: string) => {
    setGameState((prev) => {
      if (!prev) return prev;

      if (type === 'period') {
        return {
          ...prev,
          periods: prev.periods.map(p =>
            p.id === id ? { ...p, frozen: true } : p
          ),
        };
      } else if (type === 'event') {
        return {
          ...prev,
          events: prev.events.map(e =>
            e.id === id ? { ...e, frozen: true } : e
          ),
        };
      } else if (type === 'scene') {
        return {
          ...prev,
          scenes: prev.scenes.map(s =>
            s.id === id ? { ...s, frozen: true } : s
          ),
        };
      }

      return prev;
    });
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
    startGame,
    endTurn,
    freezeItem,
  };
}
