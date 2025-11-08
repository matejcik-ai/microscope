'use client';

import { useState, useEffect } from 'react';
import type { APISettings } from '@/lib/microscope/types';

interface APISettingsModalProps {
  currentSettings?: APISettings;
  onSave: (settings: APISettings) => void;
  onClose?: () => void;
  canClose?: boolean;
}

// Fallback models if API fetch fails
const FALLBACK_CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5 ⭐', recommended: true },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Oct 2024)' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
];

const FALLBACK_OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Latest)', recommended: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

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
  const [model, setModel] = useState(
    currentSettings?.model || FALLBACK_CLAUDE_MODELS[0].id
  );
  const [fetchedModels, setFetchedModels] = useState<{
    claude: any[];
    openai: any[];
  } | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Fetch models from API on mount
  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        setFetchedModels(data);
        setIsLoadingModels(false);
      })
      .catch(err => {
        console.error('Failed to fetch models:', err);
        // Fall back to hardcoded list
        setFetchedModels({
          claude: FALLBACK_CLAUDE_MODELS,
          openai: FALLBACK_OPENAI_MODELS,
        });
        setIsLoadingModels(false);
      });
  }, []);

  const models = provider === 'claude'
    ? (fetchedModels?.claude || FALLBACK_CLAUDE_MODELS)
    : (fetchedModels?.openai || FALLBACK_OPENAI_MODELS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSave({
        provider,
        apiKey: apiKey.trim(),
        model: model || undefined,
      });
    }
  };

  const handleProviderChange = (newProvider: 'claude' | 'openai') => {
    setProvider(newProvider);
    // Set default model for the new provider
    const defaultModels = newProvider === 'claude'
      ? (fetchedModels?.claude || FALLBACK_CLAUDE_MODELS)
      : (fetchedModels?.openai || FALLBACK_OPENAI_MODELS);
    setModel(defaultModels[0].id);
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
              onChange={(e) => handleProviderChange(e.target.value as 'claude' | 'openai')}
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
              Model {isLoadingModels && <span style={{ color: '#999', fontWeight: 'normal', fontSize: '0.875rem' }}>(loading...)</span>}
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={isLoadingModels}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                opacity: isLoadingModels ? 0.6 : 1,
              }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.recommended ? '⭐' : ''}
                </option>
              ))}
            </select>
            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
              {isLoadingModels ? (
                'Fetching latest models...'
              ) : (
                <>Recommended: {models.find(m => m.recommended)?.name}</>
              )}
            </p>
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
