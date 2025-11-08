'use client';

import { useEffect, useState } from 'react';

interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export default function DebugConsole({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);

  useEffect(() => {
    // Capture console messages
    const originalError = console.error;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addMessage = (type: ConsoleMessage['type'], args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setMessages(prev => [...prev, {
        type,
        message,
        timestamp: Date.now(),
      }].slice(-50)); // Keep last 50 messages
    };

    console.error = (...args) => {
      originalError(...args);
      addMessage('error', args);
    };

    console.log = (...args) => {
      originalLog(...args);
      addMessage('log', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addMessage('warn', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addMessage('info', args);
    };

    return () => {
      console.error = originalError;
      console.log = originalLog;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, []);

  const getColor = (type: string) => {
    switch (type) {
      case 'error': return '#ef5350';
      case 'warn': return '#ff9800';
      case 'info': return '#29b6f6';
      default: return '#666';
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
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1rem',
          background: '#252526',
          borderBottom: '1px solid #3e3e42',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 'bold' }}>Debug Console</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setMessages([])}
              style={{
                padding: '0.25rem 0.75rem',
                background: '#3e3e42',
                color: '#d4d4d4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.25rem 0.75rem',
                background: '#3e3e42',
                color: '#d4d4d4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.5rem',
        }}>
          {messages.length === 0 ? (
            <div style={{ padding: '1rem', color: '#858585', textAlign: 'center' }}>
              No console messages yet
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  padding: '0.5rem',
                  borderBottom: '1px solid #3e3e42',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem',
                  color: '#858585',
                }}>
                  <span style={{ color: getColor(msg.type), fontWeight: 'bold' }}>
                    {msg.type.toUpperCase()}
                  </span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ color: getColor(msg.type) }}>
                  {msg.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
