'use client';

import { useState, useEffect } from 'react';
import { useGameState } from '@/lib/microscope/game-state';
import { saveAPISettings, loadAPISettings } from '@/lib/microscope/storage';
import Timeline from './components/Timeline';
import ConversationView from './components/Conversation';
import APISettingsModal from './components/APISettingsModal';
import DebugConsole from './components/DebugConsole';
import GameSwitcher from './components/GameSwitcher';
import type { APISettings } from '@/lib/microscope/types';

export default function GamePage() {
  const {
    gameState,
    isLoaded,
    currentGameId,
    addPeriod,
    addEvent,
    addMessage,
    setSelection,
    getSelectedConversation,
    switchGame,
    createNewGame,
  } = useGameState();

  const [isLoading, setIsLoading] = useState(false);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showAPISettings, setShowAPISettings] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  const [showGameSwitcher, setShowGameSwitcher] = useState(false);
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

    // Call AI to get response (DON'T add user message yet)
    setIsLoading(true);
    try {
      const conversation = gameState.conversations[conversationId];
      const messages = conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Add the new user message to the context for API call
      messages.push({ role: 'user', content });

      // Build game context
      const gameContext = {
        bigPicture: gameState.setup.bigPicture,
        bookends: gameState.setup.bookends,
        palette: gameState.setup.palette,
        currentContext: getCurrentContext(),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          gameState, // Full game state for prompt caching
          gameContext,
          apiSettings: apiSettings,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to get AI response');
      }

      const data = await response.json();

      // SUCCESS: Add both user message and AI response
      addMessage(conversationId, {
        role: 'user',
        playerId: 'human',
        playerName: 'You',
        content,
      });

      addMessage(conversationId, {
        role: 'assistant',
        playerId: 'ai-1',
        playerName: 'AI Player',
        content: data.response,
      });
    } catch (error: any) {
      console.error('Failed to get AI response:', error);
      const errorMessage = error?.message || 'Unknown error occurred';

      // ERROR: Restore message to input field
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

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Top Bar */}
      <div style={{
        padding: '1rem',
        background: '#1976d2',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setIsTimelineOpen(!isTimelineOpen)}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
            }}
            title="Toggle Timeline"
          >
            ☰
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            Microscope RPG
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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

        {/* Left: Timeline (Sidebar) */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '300px',
            maxWidth: '80vw',
            background: 'white',
            transform: isTimelineOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease-in-out',
            zIndex: 999,
            boxShadow: isTimelineOpen ? '2px 0 8px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          <Timeline
            gameState={gameState}
            onSelect={(type, id) => {
              setSelection(type, id);
              setIsTimelineOpen(false);
            }}
            selectedId={gameState.currentSelection?.id}
            selectedType={gameState.currentSelection?.type}
          />
        </div>

        {/* Right: Conversation (Full Width) */}
        <div style={{
          height: '100%',
          width: '100%',
        }}>
          <ConversationView
            conversation={getSelectedConversation()}
            title={getTitle()}
            onSendMessage={handleSendMessage}
            restoreContent={restoreContent}
            isLoading={isLoading}
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
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
    </div>
  );
}
