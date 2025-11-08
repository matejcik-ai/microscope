'use client';

import type { GameState, Period, Event } from '@/lib/microscope/types';

interface TimelineProps {
  gameState: GameState;
  onSelect: (type: 'meta' | 'period' | 'event', id?: string) => void;
  selectedId?: string;
  selectedType?: string;
}

export default function Timeline({ gameState, onSelect, selectedId, selectedType }: TimelineProps) {
  const getEventsForPeriod = (periodId: string): Event[] => {
    return gameState.events
      .filter(e => e.periodId === periodId)
      .sort((a, b) => a.order - b.order);
  };

  const isSelected = (type: string, id: string) => {
    return selectedType === type && selectedId === id;
  };

  return (
    <div className="timeline" style={{
      height: '100%',
      overflowY: 'auto',
      borderRight: '1px solid #e0e0e0',
      padding: '1rem'
    }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Timeline
      </h2>

      {/* Meta / Setup */}
      <div
        onClick={() => onSelect('meta')}
        style={{
          padding: '0.75rem',
          marginBottom: '0.5rem',
          background: isSelected('meta', gameState.metaConversationId) ? '#e3f2fd' : '#f5f5f5',
          borderRadius: '4px',
          cursor: 'pointer',
          border: isSelected('meta', gameState.metaConversationId) ? '2px solid #1976d2' : '2px solid transparent',
        }}
      >
        <strong>Game Setup</strong>
        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
          Big Picture, Palette, Bookends
        </div>
      </div>

      {/* Periods and Events */}
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
          Periods
        </h3>

        {gameState.periods.length === 0 ? (
          <p style={{ color: '#999', fontSize: '0.875rem', fontStyle: 'italic' }}>
            No periods yet. Add one to get started!
          </p>
        ) : (
          gameState.periods
            .sort((a, b) => a.order - b.order)
            .map(period => (
              <div key={period.id} style={{ marginBottom: '1rem' }}>
                {/* Period */}
                <div
                  onClick={() => onSelect('period', period.id)}
                  style={{
                    padding: '0.75rem',
                    background: isSelected('period', period.id) ? '#e8f5e9' : '#fff',
                    border: `2px solid ${isSelected('period', period.id) ? '#4caf50' : '#ddd'}`,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '9999px',
                      background: period.tone === 'light' ? '#fff3e0' : '#e0e0e0',
                      border: `1px solid ${period.tone === 'light' ? '#ff9800' : '#666'}`,
                    }}>
                      {period.tone === 'light' ? '☀️' : '🌙'}
                    </span>
                    <strong>{period.title}</strong>
                  </div>
                  {period.description && (
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#666',
                      marginTop: '0.25rem',
                      marginLeft: '1.75rem',
                    }}>
                      {period.description}
                    </div>
                  )}
                </div>

                {/* Events for this period */}
                {getEventsForPeriod(period.id).map(event => (
                  <div
                    key={event.id}
                    onClick={() => onSelect('event', event.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      marginLeft: '1.5rem',
                      marginBottom: '0.25rem',
                      background: isSelected('event', event.id) ? '#fff3e0' : '#fafafa',
                      border: `1px solid ${isSelected('event', event.id) ? '#ff9800' : '#e0e0e0'}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem' }}>
                        {event.tone === 'light' ? '☀️' : '🌙'}
                      </span>
                      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        {event.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
