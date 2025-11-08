'use client';

import { useState } from 'react';
import type { APISettings } from '@/lib/microscope/types';

interface APISettingsModalProps {
  currentSettings?: APISettings;
  onSave: (settings: APISettings) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export default function APISettingsModal({
  currentSettings,
  onSave,
  onClose,
  canClose = false,
}: APISettingsModalProps) {
  const [provider, setProvider] = useState<'claude' | 'openai'>(
    currentSettings?.provider || 'claude'
  );
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '');
  const [model, setModel] = useState(currentSettings?.model || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSave({
        provider,
        apiKey: apiKey.trim(),
        model: model.trim() || undefined,
      });
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
      onClick={canClose ? onClose : undefined}
    >
      <div
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          width: '500px',
          maxWidth: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
          API Settings
        </h2>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Configure your AI provider. Your API key is stored locally in your browser.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as 'claude' | 'openai')}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            >
              <option value="claude">Anthropic Claude</option>
              <option value="openai">OpenAI GPT (not yet implemented)</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              API Key *
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                provider === 'claude'
                  ? 'sk-ant-...'
                  : 'sk-...'
              }
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              {provider === 'claude' ? (
                <>
                  Get your API key at{' '}
                  <a
                    href="https://console.anthropic.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2' }}
                  >
                    console.anthropic.com
                  </a>
                </>
              ) : (
                <>
                  Get your API key at{' '}
                  <a
                    href="https://platform.openai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2' }}
                  >
                    platform.openai.com
                  </a>
                </>
              )}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
              }}
            >
              Model (optional)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={
                provider === 'claude'
                  ? 'claude-3-5-sonnet-20241022 (default)'
                  : 'gpt-4-turbo-preview (default)'
              }
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              Leave blank to use the default model
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
            }}
          >
            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
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
            )}
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
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
