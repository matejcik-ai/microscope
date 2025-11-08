'use client';

import { useState, useRef, useEffect } from 'react';
import type { Conversation, Message } from '@/lib/microscope/types';

interface ConversationProps {
  conversation: Conversation | null;
  title: string;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

export default function ConversationView({
  conversation,
  title,
  onSendMessage,
  isLoading = false,
}: ConversationProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
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
            <MessageBubble key={message.id} message={message} />
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
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
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      maxWidth: isSystem ? '100%' : '80%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
    }}>
      {!isSystem && (
        <div style={{
          fontSize: '0.75rem',
          color: '#666',
          marginBottom: '0.25rem',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
        }}>
          {message.playerName || (isUser ? 'You' : 'AI')}
        </div>
      )}
      <div style={{
        padding: isSystem ? '0.5rem' : '0.75rem 1rem',
        background: isSystem ? 'transparent' : isUser ? '#1976d2' : '#f0f0f0',
        color: isSystem ? '#666' : isUser ? 'white' : '#000',
        borderRadius: '8px',
        fontStyle: isSystem ? 'italic' : 'normal',
        fontSize: isSystem ? '0.875rem' : '1rem',
        border: isSystem ? '1px dashed #ddd' : 'none',
        width: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
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
