'use client';

import { useState } from 'react';
import { useGameState } from '@/lib/microscope/game-state';
import Timeline from './components/Timeline';
import ConversationView from './components/Conversation';
import APISettingsModal from './components/APISettingsModal';
import type { APISettings } from '@/lib/microscope/types';

export default function GamePage() {
  const {
    gameState,
    isLoaded,
    addPeriod,
    addEvent,
    addMessage,
    setSelection,
    getSelectedConversation,
    setAPISettings,
  } = useGameState();

  const [isLoading, setIsLoading] = useState(false);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [showAPISettings, setShowAPISettings] = useState(false);

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

    // Check if API key is set
    if (!gameState.apiSettings?.apiKey) {
      setShowAPISettings(true);
      return;
    }

    const conversationId = getConversationId();
    if (!conversationId) return;

    // Add user message
    addMessage(conversationId, {
      role: 'user',
      playerId: 'human',
      playerName: 'You',
      content,
    });

    // Call AI to get response
    setIsLoading(true);
    try {
      const conversation = gameState.conversations[conversationId];
      const messages = conversation.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Add the new user message to the context
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
          gameContext,
          apiSettings: gameState.apiSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      addMessage(conversationId, {
        role: 'assistant',
        playerId: 'ai-1',
        playerName: 'AI Player',
        content: data.response,
      });
    } catch (error) {
      console.error('Failed to get AI response:', error);
      addMessage(conversationId, {
        role: 'system',
        playerId: 'system',
        content: 'Failed to get AI response. Please try again.',
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
    setAPISettings(settings);
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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
          Microscope RPG
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowAPISettings(true)}
            style={{
              padding: '0.5rem 1rem',
              background: gameState.apiSettings?.apiKey ? 'rgba(255,255,255,0.2)' : '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
            title={gameState.apiSettings?.apiKey ? 'Change API Settings' : 'Set API Key (Required)'}
          >
            {gameState.apiSettings?.apiKey ? '⚙️ API' : '⚠️ Set API Key'}
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
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        overflow: 'hidden',
      }}>
        {/* Left: Timeline */}
        <Timeline
          gameState={gameState}
          onSelect={(type, id) => setSelection(type, id)}
          selectedId={gameState.currentSelection?.id}
          selectedType={gameState.currentSelection?.type}
        />

        {/* Right: Conversation */}
        <ConversationView
          conversation={getSelectedConversation()}
          title={getTitle()}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* API Settings Modal */}
      {(showAPISettings || !gameState.apiSettings?.apiKey) && (
        <APISettingsModal
          currentSettings={gameState.apiSettings}
          onSave={handleSaveAPISettings}
          onClose={() => setShowAPISettings(false)}
          canClose={!!gameState.apiSettings?.apiKey}
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
    </div>
  );
}
