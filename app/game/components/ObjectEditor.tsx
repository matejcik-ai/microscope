'use client';

import { useState } from 'react';
import type { Period, Event, Scene } from '@/lib/microscope/types';

interface ObjectEditorProps {
  type: 'period' | 'event' | 'scene';
  object: Period | Event | Scene;
  onUpdate: (updates: Partial<Period | Event | Scene>) => void;
}

export default function ObjectEditor({ type, object, onUpdate }: ObjectEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('title' in object ? object.title : '');
  const [description, setDescription] = useState('description' in object ? object.description : '');
  const [tone, setTone] = useState<'light' | 'dark'>('tone' in object ? object.tone : 'light');
  const [question, setQuestion] = useState('question' in object ? object.question : '');

  const handleSave = () => {
    const updates: any = {};

    if ('title' in object && title !== object.title) {
      updates.title = title;
    }
    if ('description' in object && description !== object.description) {
      updates.description = description;
    }
    if ('tone' in object && tone !== object.tone) {
      updates.tone = tone;
    }
    if ('question' in object && question !== object.question) {
      updates.question = question;
    }

    if (Object.keys(updates).length > 0) {
      onUpdate(updates);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle('title' in object ? object.title : '');
    setDescription('description' in object ? object.description : '');
    setTone('tone' in object ? object.tone : 'light');
    setQuestion('question' in object ? object.question : '');
    setIsEditing(false);
  };

  const getTypeLabel = () => {
    if (type === 'period') return 'Period';
    if (type === 'event') return 'Event';
    return 'Scene';
  };

  const isPeriod = type === 'period';
  const isEvent = type === 'event';
  const isScene = type === 'scene';

  return (
    <div style={{
      padding: '1rem',
      background: '#f5f5f5',
      borderBottom: '2px solid #e0e0e0',
      marginBottom: '1rem',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
      }}>
        <div style={{
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {getTypeLabel()} Details
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '0.25rem 0.75rem',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '600',
            }}
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div>
          {/* Title (for periods and events) */}
          {(isPeriod || isEvent) && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
                color: '#333',
              }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* Question (for scenes) */}
          {isScene && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
                color: '#333',
              }}>
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* Description (for periods and events) */}
          {(isPeriod || isEvent) && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
                color: '#333',
              }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Tone (for periods, events, and scenes) */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginBottom: '0.25rem',
              color: '#333',
            }}>
              Tone
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setTone('light')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: tone === 'light' ? '#fff3e0' : '#fff',
                  border: tone === 'light' ? '2px solid #ff9800' : '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: tone === 'light' ? '600' : 'normal',
                  fontSize: '0.875rem',
                }}
              >
                ☀️ Light (Good Times)
              </button>
              <button
                onClick={() => setTone('dark')}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: tone === 'dark' ? '#e0e0e0' : '#fff',
                  border: tone === 'dark' ? '2px solid #666' : '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: tone === 'dark' ? '600' : 'normal',
                  fontSize: '0.875rem',
                }}
              >
                🌙 Dark (Bad Times)
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '0.5rem 1rem',
                background: '#fff',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '0.5rem 1rem',
                background: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Display Mode */}
          {(isPeriod || isEvent) && (
            <>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#333',
              }}>
                {title}
              </h3>
              {description && (
                <p style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  color: '#666',
                  lineHeight: '1.4',
                }}>
                  {description}
                </p>
              )}
            </>
          )}

          {isScene && (
            <p style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1rem',
              fontWeight: '600',
              color: '#333',
            }}>
              {question}
            </p>
          )}

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.25rem 0.75rem',
            background: tone === 'light' ? '#fff3e0' : '#e0e0e0',
            border: `1px solid ${tone === 'light' ? '#ff9800' : '#666'}`,
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: tone === 'light' ? '#e65100' : '#333',
          }}>
            {tone === 'light' ? '☀️ Light' : '🌙 Dark'}
          </div>
        </div>
      )}
    </div>
  );
}
