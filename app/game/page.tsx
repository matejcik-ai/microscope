'use client';

import { useState, useEffect } from 'react';
import { useGameState } from '@/lib/microscope/game-state';
import { saveAPISettings, loadAPISettings } from '@/lib/microscope/storage';
import { parseAIResponse, type ParsedResponse, type ParsedCommand } from '@/lib/microscope/command-parser';
import Timeline from './components/Timeline';
import ConversationView from './components/Conversation';
import APISettingsModal from './components/APISettingsModal';
import DebugConsole from './components/DebugConsole';
import GameSwitcher from './components/GameSwitcher';
import PaletteEditor from './components/PaletteEditor';
import type { APISettings, Period, Event, Scene } from '@/lib/microscope/types';

export default function GamePage() {
  const {
    gameState,
    isLoaded,
    currentGameId,
    addPeriod,
    addPaletteItem,
    findPeriodByTitle,
    findEventByTitle,
    addEvent,
    addScene,
    addMessage,
    addMessageWithId,
    updateMessage,
    removeMessage,
    updatePeriod,
    updateEvent,
    updateScene,
    updateBigPicture,
    updatePalette,
    setSelection,
    getSelectedConversation,
    deletePeriod,
    deleteEvent,
    deleteScene,
    switchGame,
    createNewGame,
    startGame,
    endTurn,
    freezeItem,
  } = useGameState();

  const [isLoading, setIsLoading] = useState(false);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showAPISettings, setShowAPISettings] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true); // Start with sidebar open
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showGameSwitcher, setShowGameSwitcher] = useState(false);
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);
  const [restoreContent, setRestoreContent] = useState<string | null>(null);
  const [apiSettings, setApiSettings] = useState<APISettings | null>(null);

  // Load global API settings on mount
  useEffect(() => {
    const loaded = loadAPISettings();
    setApiSettings(loaded);
  }, []);

  if (!isLoaded || !gameState) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Loading game...
      </div>
    );
  }

  const handleAICommand = async (command: ParsedCommand, currentConversationId: string, remainingMessage?: string) => {
    const metaConversationId = gameState.metaConversationId;

    switch (command.type) {
      case 'create-period': {
        const { title, tone, description, placement, expandedDescription } = command.data;

        // Create the period with optional placement (AI created)
        const periodId = addPeriod(title, description, tone, false, placement, 'ai-1');

        if (!periodId) {
          console.error('Failed to create period:', title);
          break;
        }

        // Find the created period immediately (no setTimeout needed)
        const period = gameState.periods.find(p => p.id === periodId);
        if (!period) {
          console.error('Period not found after creation:', periodId);
          break;
        }

        // Add clickable link to meta chat
        addMessage(metaConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Created period: ${title}`,
          metadata: {
            linkTo: {
              type: 'period',
              id: period.id,
            },
          },
        });

        // Add expanded description as first message in period's conversation
        if (expandedDescription) {
          addMessage(period.conversationId, {
            role: 'assistant',
            playerId: 'ai-1',
            playerName: 'AI Player',
            content: expandedDescription,
          });
        }
        break;
      }

      case 'create-start-bookend':
      case 'create-end-bookend': {
        const { title, tone, description, expandedDescription } = command.data;
        const position = command.type === 'create-start-bookend' ? 'start' : 'end';

        // Check if we're editing an existing bookend
        const existingBookend = gameState.periods.find(p =>
          p.isBookend && (
            (position === 'start' && p.id === gameState.setup.bookends?.start) ||
            (position === 'end' && p.id === gameState.setup.bookends?.end)
          )
        );

        if (existingBookend) {
          // Edit existing bookend
          updatePeriod(existingBookend.id, { title, description, tone });
          addMessage(currentConversationId, {
            role: 'system',
            playerId: 'system',
            content: `Updated ${position} bookend: ${title}`,
          });
          break;
        }

        // Create new bookend (AI created)
        const periodId = addPeriod(title, description, tone, true, undefined, 'ai-1');

        if (!periodId) {
          console.error('Failed to create bookend:', title);
          break;
        }

        // Find the created period immediately
        const period = gameState.periods.find(p => p.id === periodId);
        if (!period) {
          console.error('Bookend period not found after creation:', periodId);
          break;
        }

        // Add clickable link to meta chat
        addMessage(metaConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Created ${position} bookend: ${title}`,
          metadata: {
            linkTo: {
              type: 'period',
              id: period.id,
            },
          },
        });

        // Add expanded description as first message in bookend's conversation
        if (expandedDescription) {
          addMessage(period.conversationId, {
            role: 'assistant',
            playerId: 'ai-1',
            playerName: 'AI Player',
            content: expandedDescription,
          });
        }
        break;
      }

      case 'create-event': {
        const { title, tone, periodTitle, description, expandedDescription } = command.data;
        const period = findPeriodByTitle(periodTitle);

        if (!period) {
          // Period not found - add error to meta conversation
          addMessage(metaConversationId, {
            role: 'error',
            playerId: 'system',
            content: `Cannot create event: Period "${periodTitle}" not found`,
          });
          return;
        }

        // Create the event (AI created) with description from command
        const eventId = addEvent(period.id, title, description || '', tone, 'ai-1');

        if (!eventId) {
          console.error('Failed to create event:', title);
          break;
        }

        // Find the created event immediately
        const event = gameState.events.find(e => e.id === eventId);
        if (!event) {
          console.error('Event not found after creation:', eventId);
          break;
        }

        // Add clickable link to meta chat
        addMessage(metaConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Created event: ${title} (in ${periodTitle})`,
          metadata: {
            linkTo: {
              type: 'event',
              id: event.id,
            },
          },
        });

        // Add expanded description as first message in event's conversation
        if (expandedDescription) {
          addMessage(event.conversationId, {
            role: 'assistant',
            playerId: 'ai-1',
            playerName: 'AI Player',
            content: expandedDescription,
          });
        }
        break;
      }

      case 'add-palette': {
        const { category, item } = command.data;
        addPaletteItem(category, item, 'ai-1'); // AI created

        // Add confirmation to current conversation
        addMessage(currentConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Added to palette (${category}): ${item}`,
        });
        break;
      }

      case 'create-scene': {
        const { title, tone, eventTitle, question, answer, description, expandedDescription } = command.data;
        const event = findEventByTitle(eventTitle);

        if (!event) {
          // Event not found - add error to meta conversation
          addMessage(metaConversationId, {
            role: 'error',
            playerId: 'system',
            content: `Cannot create scene: Event "${eventTitle}" not found`,
          });
          return;
        }

        // Create the scene (AI created)
        const sceneId = addScene(event.id, question, answer, tone, 'ai-1');

        if (!sceneId) {
          console.error('Failed to create scene:', title);
          break;
        }

        // Find the created scene immediately
        const scene = gameState.scenes.find(s => s.id === sceneId);
        if (!scene) {
          console.error('Scene not found after creation:', sceneId);
          break;
        }

        // Add clickable link to meta chat
        addMessage(metaConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Created scene: ${question} (in ${eventTitle})`,
          metadata: {
            linkTo: {
              type: 'scene',
              id: scene.id,
            },
          },
        });

        // Add expanded description as first message in scene's conversation
        if (expandedDescription) {
          addMessage(scene.conversationId, {
            role: 'assistant',
            playerId: 'ai-1',
            playerName: 'AI Player',
            content: expandedDescription,
          });
        }
        break;
      }

      case 'edit-name': {
        const { newName } = command.data;
        const currentObject = getCurrentObject(currentConversationId);

        if (!currentObject) {
          addMessage(currentConversationId, {
            role: 'error',
            playerId: 'system',
            content: 'Cannot edit name: Not in an object conversation',
          });
          return;
        }

        // Update the appropriate object
        if (currentObject.type === 'period') {
          updatePeriod(currentObject.id, { title: newName });
        } else if (currentObject.type === 'event') {
          updateEvent(currentObject.id, { title: newName });
        } else if (currentObject.type === 'scene') {
          updateScene(currentObject.id, { question: newName });
        }

        addMessage(currentConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Updated name to: ${newName}`,
        });
        break;
      }

      case 'edit-description': {
        const { newDescription } = command.data;
        const currentObject = getCurrentObject(currentConversationId);

        if (!currentObject) {
          addMessage(currentConversationId, {
            role: 'error',
            playerId: 'system',
            content: 'Cannot edit description: Not in an object conversation',
          });
          return;
        }

        // Update the appropriate object
        if (currentObject.type === 'period') {
          updatePeriod(currentObject.id, { description: newDescription });
        } else if (currentObject.type === 'event') {
          updateEvent(currentObject.id, { description: newDescription });
        } else if (currentObject.type === 'scene') {
          addMessage(currentConversationId, {
            role: 'error',
            playerId: 'system',
            content: 'Scenes do not have descriptions',
          });
          return;
        }

        addMessage(currentConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Updated description`,
        });
        break;
      }

      case 'edit-tone': {
        const { newTone } = command.data;
        const currentObject = getCurrentObject(currentConversationId);

        if (!currentObject) {
          addMessage(currentConversationId, {
            role: 'error',
            playerId: 'system',
            content: 'Cannot edit tone: Not in an object conversation',
          });
          return;
        }

        // Update the appropriate object
        if (currentObject.type === 'period') {
          updatePeriod(currentObject.id, { tone: newTone });
        } else if (currentObject.type === 'event') {
          updateEvent(currentObject.id, { tone: newTone });
        } else if (currentObject.type === 'scene') {
          updateScene(currentObject.id, { tone: newTone });
        }

        addMessage(currentConversationId, {
          role: 'system',
          playerId: 'system',
          content: `Updated tone to: ${newTone}`,
        });
        break;
      }

      default:
        break;
    }
  };

  // Helper function to get current object from conversation ID
  const getCurrentObject = (conversationId: string): { type: 'period' | 'event' | 'scene', id: string } | null => {
    // Check periods
    const period = gameState.periods.find(p => p.conversationId === conversationId);
    if (period) return { type: 'period', id: period.id };

    // Check events (stored at top level in gameState)
    const event = gameState.events.find(e => e.conversationId === conversationId);
    if (event) return { type: 'event', id: event.id };

    // Check scenes (stored at top level in gameState)
    const scene = gameState.scenes.find(s => s.conversationId === conversationId);
    if (scene) return { type: 'scene', id: scene.id };

    return null;
  };

  /**
   * Shared function to process AI response and handle commands
   * Used by both initial response and reparse functionality
   */
  const processAIResponse = async (responseContent: string, conversationId: string) => {
    // Parse AI response for commands
    const parsed = parseAIResponse(responseContent);

    // Determine if we have create commands that should teleport the message
    const hasCreateCommand = parsed.commands.some(cmd =>
      cmd.type === 'create-period' ||
      cmd.type === 'create-event' ||
      cmd.type === 'create-scene'
    );

    // Handle all commands
    if (parsed.commands.length > 0 && parsed.commands[0].type !== 'none') {
      for (const command of parsed.commands) {
        if (command.type !== 'none') {
          // Pass remaining message only to create commands for teleporting
          const shouldTeleport = (command.type === 'create-period' ||
                                  command.type === 'create-event' ||
                                  command.type === 'create-scene') &&
                                 hasCreateCommand;
          await handleAICommand(
            command,
            conversationId,
            shouldTeleport ? parsed.remainingMessage : undefined
          );
        }
      }
    }

    return parsed;
  };

  const handleReparseMessage = async (messageId: string) => {
    if (!gameState.currentSelection) return;

    const conversationId = getConversationId();
    if (!conversationId) return;

    const conversation = gameState.conversations[conversationId];
    if (!conversation) return;

    // Find the message
    const message = conversation.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;

    // Process using the EXACT same code path as initial response
    const parsed = await processAIResponse(message.content, conversationId);

    // Add a system message indicating reparse
    if (parsed.commands.length > 0 && parsed.commands[0].type !== 'none') {
      addMessage(conversationId, {
        role: 'system',
        playerId: 'system',
        content: `Reparsed AI message - found ${parsed.commands.length} command(s)`,
      });
    } else {
      addMessage(conversationId, {
        role: 'system',
        playerId: 'system',
        content: 'No commands found in message',
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!gameState.currentSelection) return;

    // Clear any previous restore content
    setRestoreContent(null);

    // Check if API key is set
    if (!apiSettings?.apiKey) {
      setShowAPISettings(true);
      return;
    }

    const conversationId = getConversationId();
    if (!conversationId) return;

    // Add message as PENDING immediately (visible in UI)
    const pendingMessageId = crypto.randomUUID();
    const pendingMessage = {
      id: pendingMessageId,
      role: 'user' as const,
      playerId: 'human',
      playerName: 'You',
      content,
      timestamp: Date.now(),
      pending: true,
    };

    // Add pending message to conversation
    addMessageWithId(conversationId, pendingMessage);
    setIsLoading(true);

    const conversation = gameState.conversations[conversationId];
    if (!conversation) return;

    try {
      // New API structure per spec: pass full gameState and currentConversationId
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState, // Full game state for context building
          currentConversationId: conversationId,
          apiSettings: apiSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      // SUCCESS: Update pending message to non-pending
      updateMessage(conversationId, pendingMessageId, { pending: false });

      // Add the AI response to the CURRENT conversation (not always meta)
      // This allows AI to participate in item conversations per spec
      addMessage(conversationId, {
        role: 'assistant',
        playerId: 'ai-1',
        playerName: 'AI Player',
        content: data.response,
        rawContent: data.response, // Store raw output for "show unprocessed"
      });

      // Process AI response using the EXACT same code path as reparse
      await processAIResponse(data.response, conversationId);
    } catch (error: any) {
      console.error('Failed to get AI response:', error);
      const errorMessage = error?.message || 'Unknown error occurred';

      // ERROR: Remove pending message
      removeMessage(conversationId, pendingMessageId);

      // Restore message to input field
      setRestoreContent(content);

      // Still add error message to conversation
      addMessage(conversationId, {
        role: 'error',
        playerId: 'system',
        content: `${errorMessage}\n\nPlease check:\n• Your API key is correct\n• You have available API credits\n• The selected model is available\n• Your internet connection is working`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentContext = (): string => {
    if (!gameState.currentSelection) return '';

    const { type, id } = gameState.currentSelection;

    if (type === 'meta') {
      return 'Setting up the game: defining the Big Picture, Bookends, and Palette';
    }

    if (type === 'period') {
      const period = gameState.periods.find(p => p.id === id);
      if (period) {
        return `Exploring Period: "${period.title}" (${period.tone})\nDescription: ${period.description}`;
      }
    }

    if (type === 'event') {
      const event = gameState.events.find(e => e.id === id);
      if (event) {
        const period = gameState.periods.find(p => p.id === event.periodId);
        return `Exploring Event: "${event.title}" (${event.tone})\nDescription: ${event.description}\nWithin Period: "${period?.title}"`;
      }
    }

    return '';
  };

  const handleAddPeriod = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tone = formData.get('tone') as 'light' | 'dark';

    if (title.trim()) {
      addPeriod(title.trim(), description.trim(), tone);
      setShowAddPeriod(false);
    }
  };

  const handleSaveAPISettings = (settings: APISettings) => {
    setApiSettings(settings);
    saveAPISettings(settings);
    setShowAPISettings(false);
  };

  const getConversationId = (): string | null => {
    if (!gameState.currentSelection) return null;

    const { type, id } = gameState.currentSelection;

    if (type === 'meta') {
      return gameState.metaConversationId;
    }

    if (type === 'period') {
      const period = gameState.periods.find(p => p.id === id);
      return period?.conversationId || null;
    }

    if (type === 'event') {
      const event = gameState.events.find(e => e.id === id);
      return event?.conversationId || null;
    }

    return null;
  };

  const getTitle = (): string => {
    if (!gameState.currentSelection) return 'Select an item';

    const { type, id } = gameState.currentSelection;

    if (type === 'meta') {
      return 'Game Setup';
    }

    if (type === 'period') {
      const period = gameState.periods.find(p => p.id === id);
      return period ? `Period: ${period.title}` : 'Unknown Period';
    }

    if (type === 'event') {
      const event = gameState.events.find(e => e.id === id);
      return event ? `Event: ${event.title}` : 'Unknown Event';
    }

    return 'Unknown';
  };

  const getSelectedObject = (): { type: 'period' | 'event' | 'scene'; data: Period | Event | Scene } | null => {
    if (!gameState.currentSelection) return null;

    const { type, id } = gameState.currentSelection;

    if (type === 'period') {
      const period = gameState.periods.find(p => p.id === id);
      return period ? { type: 'period', data: period } : null;
    }

    if (type === 'event') {
      const event = gameState.events.find(e => e.id === id);
      return event ? { type: 'event', data: event } : null;
    }

    if (type === 'scene') {
      const scene = gameState.scenes.find(s => s.id === id);
      return scene ? { type: 'scene', data: scene } : null;
    }

    return null;
  };

  const handleUpdateObject = (updates: Partial<Period | Event | Scene>) => {
    if (!gameState.currentSelection) return;

    const { type, id } = gameState.currentSelection;

    if (type === 'period') {
      updatePeriod(id, updates);
    } else if (type === 'event') {
      updateEvent(id, updates);
    } else if (type === 'scene') {
      updateScene(id, updates);
    }
  };

  const handleDeleteObject = () => {
    if (!gameState.currentSelection) return;

    const { type, id } = gameState.currentSelection;

    if (type === 'period') {
      deletePeriod(id);
    } else if (type === 'event') {
      deleteEvent(id);
    } else if (type === 'scene') {
      deleteScene(id);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    const conversation = getSelectedConversation();
    if (!conversation) return;

    updateMessage(conversation.id, messageId, { content: newContent });
  };

  const handleRerunFromMessage = async (messageId: string) => {
    if (!gameState.currentSelection) return;

    // Check if API key is set
    if (!apiSettings?.apiKey) {
      setShowAPISettings(true);
      return;
    }

    const conversationId = getConversationId();
    if (!conversationId) return;

    const conversation = gameState.conversations[conversationId];
    if (!conversation) return;

    // Find the message to rerun from
    const messageIndex = conversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const message = conversation.messages[messageIndex];

    // Delete all messages after (and including, if it's an AI message)
    let deleteFromIndex = messageIndex;
    if (message.role === 'assistant') {
      // If rerunning from AI message, delete it and regenerate
      deleteFromIndex = messageIndex;
    } else if (message.role === 'user') {
      // If rerunning from user message, delete all after and regenerate AI response
      deleteFromIndex = messageIndex + 1;
    } else {
      // Can't rerun from system/error messages
      return;
    }

    const messagesToDelete = conversation.messages.slice(deleteFromIndex);
    for (const msg of messagesToDelete) {
      removeMessage(conversationId, msg.id);
    }

    setIsLoading(true);

    try {
      // New API structure per spec: pass full gameState and currentConversationId
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState,
          currentConversationId: conversationId,
          apiSettings: apiSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      // Add the AI response
      addMessage(conversationId, {
        role: 'assistant',
        playerId: 'ai-1',
        playerName: 'AI Player',
        content: data.response,
      });

      // Process AI response
      await processAIResponse(data.response, conversationId);
    } catch (error: any) {
      console.error('Failed to rerun from message:', error);
      const errorMessage = error?.message || 'Unknown error occurred';

      addMessage(conversationId, {
        role: 'error',
        playerId: 'system',
        content: `${errorMessage}\n\nPlease check:\n• Your API key is correct\n• You have available API credits\n• The selected model is available\n• Your internet connection is working`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      height: '100dvh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Top Bar */}
      <div style={{
        padding: '1rem',
        background: '#1976d2',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            Microscope RPG
          </h1>

          {/* Phase indicator */}
          <div style={{
            padding: '0.25rem 0.75rem',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '600',
            textTransform: 'uppercase',
          }}>
            {gameState.phase === 'setup' ? '📋 Setup' :
             gameState.phase === 'initial_round' ? '🎯 Initial Round' :
             '🎮 Playing'}
          </div>

          {/* Turn indicator */}
          {gameState.currentTurn && (
            <div style={{
              padding: '0.25rem 0.75rem',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}>
              {(() => {
                const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurn?.playerId);
                return `Turn: ${currentPlayer?.name || 'Unknown'}`;
              })()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {/* Start Game button (only in setup phase) */}
          {gameState.phase === 'setup' && gameState.setup.bigPicture && gameState.setup.bookends.start && gameState.setup.bookends.end && (
            <button
              onClick={startGame}
              style={{
                padding: '0.5rem 1rem',
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
              title="Start the game (freezes setup and begins initial round)"
            >
              ▶️ Start Game
            </button>
          )}

          {/* End Turn button (only when it's human's turn and viewing an item) */}
          {gameState.currentTurn && gameState.currentTurn.playerId === 'human' && gameState.currentSelection && gameState.currentSelection.type !== 'meta' && (
            <button
              onClick={endTurn}
              style={{
                padding: '0.5rem 1rem',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
              title="End your turn (freezes current item and advances to next player)"
            >
              ✓ End Turn
            </button>
          )}

          <button
            onClick={() => setShowGameSwitcher(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            title="Switch Game"
          >
            📁
          </button>
          <button
            onClick={() => setShowDebugConsole(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            title="Debug Console"
          >
            🐛
          </button>
          <button
            onClick={() => setShowAPISettings(true)}
            style={{
              padding: '0.5rem 1rem',
              background: apiSettings?.apiKey ? 'rgba(255,255,255,0.2)' : '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            title={apiSettings?.apiKey ? 'Change API Settings' : 'Set API Key (Required)'}
          >
            {apiSettings?.apiKey ? '⚙️' : '⚠️'}
          </button>
          <button
            onClick={() => setShowAddPeriod(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'white',
              color: '#1976d2',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            + Add Period
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Backdrop */}
        {isTimelineOpen && (
          <div
            onClick={() => setIsTimelineOpen(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998,
            }}
          />
        )}

        {/* Hamburger Toggle - Always Visible (Fixed Position) */}
        <button
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1001,
            padding: '0.75rem',
            background: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '50px',
            height: '50px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          title={isTimelineOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          {isTimelineOpen ? '✕' : '☰'}
        </button>

        {/* Left: Timeline Sidebar (Overlay) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 'min(300px, 80vw)',
            background: 'white',
            transform: isTimelineOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            zIndex: 1000,
            boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
            borderRight: '1px solid #e0e0e0',
            overflow: 'hidden',
          }}
        >
          {/* Timeline Content */}
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            paddingTop: '70px', // Space for the hamburger button
          }}>
            <Timeline
              gameState={gameState}
              onSelect={(type, id) => {
                setSelection(type, id);
                // On mobile, close sidebar after selection
                if (window.innerWidth < 768) {
                  setIsTimelineOpen(false);
                }
              }}
              selectedId={gameState.currentSelection?.id}
              selectedType={gameState.currentSelection?.type}
              onUpdateBigPicture={updateBigPicture}
              onEditPalette={() => setShowPaletteEditor(true)}
            />
          </div>
        </div>

        {/* Right: Conversation (Full Width) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}>
          <ConversationView
            conversation={getSelectedConversation()}
            title={getTitle()}
            onSendMessage={handleSendMessage}
            onNavigateToObject={(type, id) => setSelection(type, id)}
            restoreContent={restoreContent}
            isLoading={isLoading}
            selectedObject={getSelectedObject()}
            onUpdateObject={handleUpdateObject}
            onDeleteObject={handleDeleteObject}
            onReparseMessage={handleReparseMessage}
            onEditMessage={handleEditMessage}
            onRerunFromMessage={handleRerunFromMessage}
          />
        </div>
      </div>

      {/* API Settings Modal */}
      {(showAPISettings || !apiSettings?.apiKey) && (
        <APISettingsModal
          currentSettings={apiSettings || undefined}
          onSave={handleSaveAPISettings}
          onClose={() => setShowAPISettings(false)}
          canClose={!!apiSettings?.apiKey}
        />
      )}

      {/* Add Period Modal */}
      {showAddPeriod && (
        <div
          onClick={() => {
            setShowAddPeriod(false);
            setIsTimelineOpen(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          overflowY: 'auto',
        }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Add Period</h2>
            <form onSubmit={handleAddPeriod}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontSize: '16px', // Prevent zoom on iOS
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    fontSize: '16px', // Prevent zoom on iOS
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Tone
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" name="tone" value="light" defaultChecked />
                    ☀️ Light
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="radio" name="tone" value="dark" />
                    🌙 Dark
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddPeriod(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Add Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debug Console */}
      {showDebugConsole && (
        <DebugConsole onClose={() => setShowDebugConsole(false)} />
      )}

      {/* Game Switcher */}
      {showGameSwitcher && (
        <GameSwitcher
          currentGameId={currentGameId}
          onSwitchGame={switchGame}
          onCreateNewGame={createNewGame}
          onClose={() => setShowGameSwitcher(false)}
        />
      )}

      {/* Palette Editor */}
      {showPaletteEditor && (
        <PaletteEditor
          palette={gameState.setup.palette}
          onSave={(paletteItems) => {
            updatePalette(paletteItems);
            setShowPaletteEditor(false);
          }}
          onClose={() => setShowPaletteEditor(false)}
        />
      )}
    </div>
  );
}
