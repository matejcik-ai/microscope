'use client';

import { useState, useRef, useEffect } from 'react';
import type { Conversation, Message, Period, Event, Scene } from '@/lib/microscope/types';
import ObjectEditor from './ObjectEditor';

interface ConversationProps {
  conversation: Conversation | null;
  title: string;
  onSendMessage: (content: string) => void;
  onNavigateToObject?: (type: 'period' | 'event' | 'scene', id: string) => void;
  restoreContent?: string | null;
  isLoading?: boolean;
  selectedObject?: {
    type: 'period' | 'event' | 'scene';
    data: Period | Event | Scene;
  } | null;
  onUpdateObject?: (updates: Partial<Period | Event | Scene>) => void;
}

export default function ConversationView({
  conversation,
  title,
  onSendMessage,
  onNavigateToObject,
  restoreContent = null,
  isLoading = false,
  selectedObject = null,
  onUpdateObject,
}: ConversationProps) {
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [enterToSend, setEnterToSend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current && !isFullscreen) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input, isFullscreen]);

  // Restore content to input field when error occurs
  useEffect(() => {
    if (restoreContent) {
      setInput(restoreContent);
    }
  }, [restoreContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // In fullscreen, never submit on Enter (always new line)
    if (isFullscreen) {
      return;
    }

    // Submit on Enter only if enterToSend is checked
    if (e.key === 'Enter' && enterToSend && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSendMessage(input.trim());
        setInput('');
      }
    }
  };

  if (!conversation) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
      }}>
        Select an item from the timeline to start a conversation
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid #e0e0e0',
        background: '#fafafa',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{title}</h2>
      </div>

      {/* Object Editor (for periods, events, scenes) */}
      {selectedObject && onUpdateObject && (
        <ObjectEditor
          type={selectedObject.type}
          object={selectedObject.data}
          onUpdate={onUpdateObject}
        />
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {conversation.messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#999',
            marginTop: '2rem',
            fontStyle: 'italic',
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          conversation.messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onNavigateToObject={onNavigateToObject}
            />
          ))
        )}

        {isLoading && (
          <div style={{
            padding: '0.75rem',
            background: '#f0f0f0',
            borderRadius: '8px',
            maxWidth: '80%',
            alignSelf: 'flex-start',
          }}>
            <span style={{ color: '#666' }}>AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{
        padding: '1rem',
        borderTop: '1px solid #e0e0e0',
        background: '#fafafa',
      }}>
        {/* Textarea - full width on mobile */}
        <div style={{ marginBottom: '0.5rem' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={enterToSend ? "Type your message... (Enter to send, Shift+Enter for new line)" : "Type your message..."}
            disabled={isLoading}
            rows={1}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
              resize: 'none',
              minHeight: '44px',
              maxHeight: isFullscreen ? 'none' : '200px',
              overflow: 'auto',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {!isFullscreen && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.875rem',
              color: '#666',
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <input
                type="checkbox"
                checked={enterToSend}
                onChange={(e) => setEnterToSend(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Enter to send
            </label>
          )}
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#f0f0f0',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
            title="Fullscreen editor"
          >
            ⤢ Fullscreen
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0.5rem 1.5rem',
              background: input.trim() && !isLoading ? '#1976d2' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: '500',
            }}
          >
            Send
          </button>
        </div>
      </form>

      {/* Fullscreen Editor Modal */}
      {isFullscreen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem',
          }}
          onClick={() => setIsFullscreen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '900px',
              height: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                Compose Message
              </h3>
              <button
                onClick={() => setIsFullscreen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                }}
              >
                ×
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter for new line)"
              disabled={isLoading}
              autoFocus
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                fontSize: '1rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{
              padding: '1rem',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end',
            }}>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f0f0f0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    onSendMessage(input.trim());
                    setInput('');
                    setIsFullscreen(false);
                  }
                }}
                disabled={!input.trim() || isLoading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: input.trim() && !isLoading ? '#1976d2' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  fontSize: '1rem',
                  fontWeight: '500',
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  onNavigateToObject,
}: {
  message: Message;
  onNavigateToObject?: (type: 'period' | 'event' | 'scene', id: string) => void;
}) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.role === 'error';
  const isPending = message.pending || false;
  const hasLink = message.metadata?.linkTo && onNavigateToObject;

  const handleClick = () => {
    if (hasLink) {
      onNavigateToObject(message.metadata!.linkTo!.type, message.metadata!.linkTo!.id);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      maxWidth: (isSystem || isError) ? '100%' : '80%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      opacity: isPending ? 0.6 : 1,
    }}>
      {!isSystem && !isError && (
        <div style={{
          fontSize: '0.75rem',
          color: '#666',
          marginBottom: '0.25rem',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
        }}>
          {message.playerName || (isUser ? 'You' : 'AI')}
          {isPending && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>(pending...)</span>}
        </div>
      )}
      {isError && (
        <div style={{
          fontSize: '0.75rem',
          color: '#d32f2f',
          marginBottom: '0.25rem',
          paddingLeft: '0.5rem',
          fontWeight: 'bold',
        }}>
          ⚠️ ERROR
        </div>
      )}
      <div
        onClick={hasLink ? handleClick : undefined}
        style={{
          padding: isSystem ? '0.5rem' : isError ? '1rem' : '0.75rem 1rem',
          background: isSystem ? 'transparent' : isError ? '#ffebee' : isUser ? '#1976d2' : '#f0f0f0',
          color: isSystem ? '#666' : isError ? '#c62828' : isUser ? 'white' : '#000',
          borderRadius: '8px',
          fontStyle: isSystem ? 'italic' : 'normal',
          fontSize: isSystem ? '0.875rem' : '1rem',
          border: isSystem ? '1px dashed #ddd' : isError ? '2px solid #ef5350' : 'none',
          width: '100%',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          cursor: hasLink ? 'pointer' : 'default',
          textDecoration: hasLink ? 'underline' : 'none',
        }}
      >
        {message.content}
      </div>
      <div style={{
        fontSize: '0.625rem',
        color: '#999',
        marginTop: '0.25rem',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
      }}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
