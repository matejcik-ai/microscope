'use client';

import { useState, useEffect } from 'react';
import { listGames, deleteGame, type GameMetadata } from '@/lib/microscope/storage';

interface GameSwitcherProps {
  currentGameId: string | null;
  onSwitchGame: (gameId: string) => void;
  onCreateNewGame: (name: string) => void;
  onClose: () => void;
}

export default function GameSwitcher({
  currentGameId,
  onSwitchGame,
  onCreateNewGame,
  onClose,
}: GameSwitcherProps) {
  const [games, setGames] = useState<GameMetadata[]>([]);
  const [showNewGameForm, setShowNewGameForm] = useState(false);
  const [newGameName, setNewGameName] = useState('');

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = () => {
    const gamesList = listGames();
    // Sort by last played, most recent first
    gamesList.sort((a, b) => b.lastPlayed - a.lastPlayed);
    setGames(gamesList);
  };

  const handleDeleteGame = (gameId: string) => {
    if (confirm('Are you sure you want to delete this game? This cannot be undone.')) {
      deleteGame(gameId);
      loadGames();
    }
  };

  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGameName.trim()) {
      onCreateNewGame(newGameName.trim());
      setShowNewGameForm(false);
      setNewGameName('');
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '600px',
          maxWidth: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Your Games</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            ×
          </button>
        </div>

        {/* New Game Form */}
        {showNewGameForm ? (
          <form onSubmit={handleCreateGame} style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Game Name
              </label>
              <input
                type="text"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
                placeholder="Enter a name for your new game..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                disabled={!newGameName.trim()}
                style={{
                  padding: '0.5rem 1rem',
                  background: newGameName.trim() ? '#1976d2' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: newGameName.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: '500',
                }}
              >
                Create Game
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewGameForm(false);
                  setNewGameName('');
                }}
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
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowNewGameForm(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            + New Game
          </button>
        )}

        {/* Games List */}
        {games.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
            No games yet. Create your first game!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {games.map((game) => (
              <div
                key={game.id}
                style={{
                  padding: '1rem',
                  border: game.id === currentGameId ? '2px solid #1976d2' : '1px solid #ddd',
                  borderRadius: '4px',
                  background: game.id === currentGameId ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => {
                  if (game.id !== currentGameId) {
                    onSwitchGame(game.id);
                    onClose();
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                        {game.name || 'Untitled Game'}
                      </h3>
                      {game.id === currentGameId && (
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          background: '#1976d2',
                          color: 'white',
                          borderRadius: '12px',
                          fontWeight: '500',
                        }}>
                          Current
                        </span>
                      )}
                    </div>
                    {game.bigPicture && (
                      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                        {game.bigPicture.length > 100
                          ? game.bigPicture.substring(0, 100) + '...'
                          : game.bigPicture}
                      </p>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#999' }}>
                      Last played: {new Date(game.lastPlayed).toLocaleDateString()} at{' '}
                      {new Date(game.lastPlayed).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGame(game.id);
                    }}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: 'transparent',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      color: '#d32f2f',
                    }}
                    title="Delete game"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
