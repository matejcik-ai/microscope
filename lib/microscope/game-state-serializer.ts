/**
 * Serializes complete game state into a comprehensive text document
 * for AI context with prompt caching
 */

import type { GameState, Period, Event, Scene, Conversation } from './types';

export function serializeGameState(gameState: GameState): string {
  const sections: string[] = [];

  // Header
  sections.push('=== COMPLETE GAME STATE ===\n');

  // Game Setup
  sections.push('--- GAME SETUP ---');
  sections.push(`Big Picture: ${gameState.setup.bigPicture || '(not yet defined)'}`);
  sections.push('');
  sections.push('Bookends:');
  sections.push(`  Start: ${gameState.setup.bookends.start || '(not yet defined)'}`);
  sections.push(`  End: ${gameState.setup.bookends.end || '(not yet defined)'}`);
  sections.push('');

  if (gameState.setup.palette.length > 0) {
    sections.push('Palette:');
    const yesItems = gameState.setup.palette.filter(p => p.type === 'yes');
    const noItems = gameState.setup.palette.filter(p => p.type === 'no');

    if (yesItems.length > 0) {
      sections.push(`  Things we WANT: ${yesItems.map(p => p.text).join(', ')}`);
    }
    if (noItems.length > 0) {
      sections.push(`  Things we DON'T want: ${noItems.map(p => p.text).join(', ')}`);
    }
    sections.push('');
  }

  // Meta conversation (game setup discussion)
  const metaConv = gameState.conversations[gameState.metaConversationId];
  if (metaConv && metaConv.messages.length > 0) {
    sections.push('--- META CONVERSATION (Game Setup Discussion) ---');
    sections.push(serializeConversation(metaConv));
    sections.push('');
  }

  // Timeline overview
  if (gameState.periods.length > 0) {
    sections.push('--- TIMELINE OVERVIEW ---');
    const sortedPeriods = [...gameState.periods].sort((a, b) => a.order - b.order);

    for (const period of sortedPeriods) {
      sections.push(`PERIOD ${period.order + 1} [${period.tone.toUpperCase()}]: ${period.title}`);

      const periodEvents = gameState.events
        .filter(e => e.periodId === period.id)
        .sort((a, b) => a.order - b.order);

      for (const event of periodEvents) {
        sections.push(`  EVENT ${event.order + 1} [${event.tone.toUpperCase()}]: ${event.title}`);

        const eventScenes = gameState.scenes
          .filter(s => s.eventId === event.id)
          .sort((a, b) => a.order - b.order);

        for (const scene of eventScenes) {
          sections.push(`    SCENE ${scene.order + 1}: ${scene.question}`);
          if (scene.answer) {
            sections.push(`      Answer: ${scene.answer}`);
          }
        }
      }
    }
    sections.push('');
  }

  // Detailed Period/Event/Scene information with full conversations
  if (gameState.periods.length > 0) {
    sections.push('--- DETAILED TIMELINE WITH FULL CONVERSATIONS ---');
    sections.push('');

    const sortedPeriods = [...gameState.periods].sort((a, b) => a.order - b.order);

    for (const period of sortedPeriods) {
      sections.push(`========================================`);
      sections.push(`PERIOD ${period.order + 1}: ${period.title} [${period.tone.toUpperCase()}]`);
      sections.push(`========================================`);
      sections.push(`Description: ${period.description}`);
      sections.push('');

      // Period conversation
      const periodConv = gameState.conversations[period.conversationId];
      if (periodConv && periodConv.messages.length > 0) {
        sections.push('--- Period Discussion ---');
        sections.push(serializeConversation(periodConv));
        sections.push('');
      }

      // Events in this period
      const periodEvents = gameState.events
        .filter(e => e.periodId === period.id)
        .sort((a, b) => a.order - b.order);

      for (const event of periodEvents) {
        sections.push(`  --------------------------------`);
        sections.push(`  EVENT ${event.order + 1}: ${event.title} [${event.tone.toUpperCase()}]`);
        sections.push(`  --------------------------------`);
        sections.push(`  Description: ${event.description}`);
        sections.push('');

        // Event conversation
        const eventConv = gameState.conversations[event.conversationId];
        if (eventConv && eventConv.messages.length > 0) {
          sections.push('  --- Event Discussion ---');
          sections.push(indentText(serializeConversation(eventConv), 2));
          sections.push('');
        }

        // Scenes in this event
        const eventScenes = gameState.scenes
          .filter(s => s.eventId === event.id)
          .sort((a, b) => a.order - b.order);

        for (const scene of eventScenes) {
          sections.push(`    ++++++++++++++++++`);
          sections.push(`    SCENE ${scene.order + 1}: ${scene.question}`);
          sections.push(`    ++++++++++++++++++`);
          if (scene.answer) {
            sections.push(`    Answer: ${scene.answer}`);
          }
          sections.push('');

          // Scene conversation
          const sceneConv = gameState.conversations[scene.conversationId];
          if (sceneConv && sceneConv.messages.length > 0) {
            sections.push('    --- Scene Discussion ---');
            sections.push(indentText(serializeConversation(sceneConv), 4));
            sections.push('');
          }
        }
      }

      sections.push('');
    }
  }

  // Indices for easy reference
  sections.push('--- QUICK REFERENCE INDICES ---');
  sections.push('');

  // Extract characters, locations, concepts mentioned across all conversations
  const entities = extractEntities(gameState);

  if (entities.characters.size > 0) {
    sections.push('Characters mentioned:');
    sections.push(Array.from(entities.characters).sort().join(', '));
    sections.push('');
  }

  if (entities.locations.size > 0) {
    sections.push('Locations mentioned:');
    sections.push(Array.from(entities.locations).sort().join(', '));
    sections.push('');
  }

  sections.push('=== END OF GAME STATE ===');

  return sections.join('\n');
}

function serializeConversation(conversation: Conversation): string {
  const lines: string[] = [];

  for (const message of conversation.messages) {
    // Skip error messages in the cached context
    if (message.role === 'error') continue;

    const speaker = message.role === 'user'
      ? (message.playerName || 'Human')
      : message.role === 'assistant'
      ? (message.playerName || 'AI')
      : 'System';

    const timestamp = new Date(message.timestamp).toLocaleString();
    lines.push(`[${timestamp}] ${speaker}: ${message.content}`);
  }

  return lines.join('\n');
}

function indentText(text: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return text.split('\n').map(line => indent + line).join('\n');
}

function extractEntities(gameState: GameState): {
  characters: Set<string>;
  locations: Set<string>;
} {
  const characters = new Set<string>();
  const locations = new Set<string>();

  // This is a simple implementation - could be enhanced with NLP
  // For now, we'll just extract capitalized words that might be names

  const allText: string[] = [];

  // Collect all text from periods, events, scenes
  for (const period of gameState.periods) {
    allText.push(period.title, period.description);
  }
  for (const event of gameState.events) {
    allText.push(event.title, event.description);
  }
  for (const scene of gameState.scenes) {
    allText.push(scene.question, scene.answer || '');
  }

  // Collect from conversations
  for (const conv of Object.values(gameState.conversations)) {
    for (const msg of conv.messages) {
      if (msg.role !== 'error') {
        allText.push(msg.content);
      }
    }
  }

  // Extract potential proper nouns (capitalized words)
  const properNouns = new Set<string>();
  for (const text of allText) {
    const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    words.forEach(word => {
      // Filter out common words that are often capitalized
      if (!['The', 'A', 'An', 'In', 'On', 'At', 'To', 'For', 'Of', 'And', 'But', 'Or'].includes(word)) {
        properNouns.add(word);
      }
    });
  }

  // For now, add all proper nouns to characters
  // In a more sophisticated version, we could classify them better
  properNouns.forEach(noun => characters.add(noun));

  return { characters, locations };
}
