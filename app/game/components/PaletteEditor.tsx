'use client';

import { useState, useEffect } from 'react';
import type { PaletteItem } from '@/lib/microscope/types';

interface PaletteEditorProps {
  palette: PaletteItem[];
  onSave: (items: Array<{ text: string; type: 'yes' | 'no' }>) => void;
  onClose: () => void;
}

export default function PaletteEditor({
  palette,
  onSave,
  onClose,
}: PaletteEditorProps) {
  const yesItems = palette.filter(p => p.type === 'yes').map(p => p.text);
  const noItems = palette.filter(p => p.type === 'no').map(p => p.text);

  const [yesText, setYesText] = useState(yesItems.join('\n'));
  const [noText, setNoText] = useState(noItems.join('\n'));

  const handleSave = () => {
    const newYesItems = yesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const newNoItems = noText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    // Convert to palette item format
    const paletteItems = [
      ...newYesItems.map(text => ({ text, type: 'yes' as const })),
      ...newNoItems.map(text => ({ text, type: 'no' as const })),
    ];

    onSave(paletteItems);
    onClose();
  };

  return (
    <div
      onClick={onClose}
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
        zIndex: 1100,
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
            Edit Palette
          </h2>
          <button
            onClick={onClose}
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

        <p style={{
          color: '#666',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
          lineHeight: '1.4',
        }}>
          The Palette defines what themes you want to explore ("Yes") and what you want to avoid ("No").
          Enter one item per line.
        </p>

        {/* Yes Items */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            color: '#4caf50',
          }}>
            <span style={{ fontSize: '1.25rem' }}>✓</span>
            Yes (things to include)
          </label>
          <textarea
            value={yesText}
            onChange={(e) => setYesText(e.target.value)}
            placeholder="Example:&#10;Magic and wonder&#10;Political intrigue&#10;Epic battles"
            rows={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #4caf50',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
              lineHeight: '1.5',
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#666',
            marginTop: '0.25rem',
          }}>
            {yesText.split('\n').filter(l => l.trim()).length} items
          </p>
        </div>

        {/* No Items */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem',
            fontWeight: '600',
            fontSize: '0.875rem',
            color: '#f44336',
          }}>
            <span style={{ fontSize: '1.25rem' }}>✗</span>
            No (things to exclude)
          </label>
          <textarea
            value={noText}
            onChange={(e) => setNoText(e.target.value)}
            placeholder="Example:&#10;Sexual content&#10;Gratuitous violence&#10;Modern technology"
            rows={8}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #f44336',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
              lineHeight: '1.5',
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#666',
            marginTop: '0.25rem',
          }}>
            {noText.split('\n').filter(l => l.trim()).length} items
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#fff',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
            }}
          >
            Save Palette
          </button>
        </div>
      </div>
    </div>
  );
}
