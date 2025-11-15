/**
 * Build cached game context for AI API calls
 * Per spec: This includes ALL game history and conversation threads
 * for effective prompt caching
 */

import type { GameState, Period, Event, Scene, Conversation } from './types';

export interface GameContext {
  systemPrompt: string;
  cachedContext: string; // Everything to be cached
  recentMessages: Array<{ role: string; content: string }>; // Last ~10 messages (not cached)
}

/**
 * Build the complete cached game context
 * This will be a large string containing:
 * 1. System prompt for current context
 * 2. High concept
 * 3. Complete palette
 * 4. All periods in timeline order with full conversation history
 * 5. All events in timeline order with full conversation history
 * 6. Meta conversation history (except last 10 turns)
 */
export function buildCachedGameContext(
  gameState: GameState,
  currentConversationId: string,
  lastNMessagesToExclude: number = 10
): GameContext {
  const sections: string[] = [];

  // 1. System prompt based on context
  const systemPrompt = buildSystemPrompt(gameState, currentConversationId);

  // 2. High concept
  if (gameState.setup.bigPicture) {
    sections.push(`# BIG PICTURE\n${gameState.setup.bigPicture}\n`);
  }

  // 3. Palette
  if (gameState.setup.palette.length > 0) {
    sections.push('# PALETTE');
    const yesItems = gameState.setup.palette.filter(p => p.type === 'yes');
    const noItems = gameState.setup.palette.filter(p => p.type === 'no');

    if (yesItems.length > 0) {
      sections.push('\n## YES (things we want to see):');
      yesItems.forEach(item => {
        sections.push(`- ${item.text}`);
      });
    }

    if (noItems.length > 0) {
      sections.push('\n## NO (things we don\'t want):');
      noItems.forEach(item => {
        sections.push(`- ${item.text}`);
      });
    }
    sections.push('');
  }

  // 4. All periods with their full conversations
  if (gameState.periods.length > 0) {
    sections.push('# TIMELINE\n');

    const sortedPeriods = [...gameState.periods].sort((a, b) => a.order - b.order);

    sortedPeriods.forEach(period => {
      sections.push(formatPeriod(period, gameState));
    });
  }

  // 5. Meta conversation history (except last N messages if this is the meta conversation)
  const metaConversation = gameState.conversations[gameState.metaConversationId];
  if (metaConversation) {
    const isMetaConversation = currentConversationId === gameState.metaConversationId;
    const messagesToInclude = isMetaConversation
      ? metaConversation.messages.slice(0, -lastNMessagesToExclude)
      : metaConversation.messages;

    if (messagesToInclude.length > 0) {
      sections.push('# META CONVERSATION (Game Setup & Coordination)\n');
      messagesToInclude.forEach(msg => {
        sections.push(formatMessage(msg));
      });
      sections.push('');
    }
  }

  // Build the cached context string
  const cachedContext = sections.join('\n');

  // Get recent messages from current conversation (not cached)
  const currentConversation = gameState.conversations[currentConversationId];
  const recentMessages = currentConversation
    ? currentConversation.messages
        .slice(-lastNMessagesToExclude)
        .map(msg => ({
          role: msg.role === 'system' || msg.role === 'error' ? 'user' : msg.role,
          content: msg.content,
        }))
    : [];

  return {
    systemPrompt,
    cachedContext,
    recentMessages,
  };
}

/**
 * Build system prompt based on current context
 */
function buildSystemPrompt(gameState: GameState, currentConversationId: string): string {
  const isMetaConversation = currentConversationId === gameState.metaConversationId;

  let prompt = `You are an AI player in a game of Microscope RPG. Microscope is a fractal, GM-less game where players collaboratively build a sweeping history.

GAME PHASE: ${gameState.phase}
`;

  if (gameState.currentTurn) {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentTurn?.playerId);
    prompt += `CURRENT TURN: ${currentPlayer?.name || 'Unknown'}\n`;
  }

  if (isMetaConversation) {
    if (gameState.phase === 'setup') {
      prompt += `
You are in the SETUP PHASE, discussing and creating:
- The Big Picture (one sentence high concept)
- The Palette (yes/no items defining what we want/don't want in the game)
- Two Bookend Periods (the earliest and latest points in the timeline)

You can create items using these commands:
- # add to palette yes: [item text]
- # add to palette no: [item text]
- # create start bookend: [Title] (light|dark) | [Expanded description]
- # create end bookend: [Title] (light|dark) | [Expanded description]

When you create a Period or Event with a command, any text AFTER the command in your message will be teleported to that item's conversation thread as the first message.
`;
    } else {
      prompt += `
You are in the ${gameState.phase.toUpperCase()} phase. This is the META CONVERSATION for coordination.

You can create items using these commands:
- # create period: [Title] (light|dark) [after|before PeriodName | first] | [Brief description]
- # create event: [Title] (light|dark) in [Period Name]

When you create a Period or Event, any text AFTER the command will be teleported to that item's conversation thread as the first message.
`;
    }
  } else {
    // In an item conversation
    const period = gameState.periods.find(p => p.conversationId === currentConversationId);
    const event = gameState.events.find(e => e.conversationId === currentConversationId);

    if (period) {
      prompt += `
You are discussing PERIOD: "${period.title}"
Tone: ${period.tone}
${period.frozen ? '(METADATA FROZEN - can discuss but cannot edit title/description/tone)' : '(Metadata editable)'}

You can edit metadata with these commands (only if not frozen):
- # edit name: [New Name]
- # edit description: [New Description]
- # edit tone: light|dark
`;
    } else if (event) {
      prompt += `
You are discussing EVENT: "${event.title}"
Tone: ${event.tone}
${event.frozen ? '(METADATA FROZEN - can discuss but cannot edit title/description/tone)' : '(Metadata editable)'}

You can edit metadata with these commands (only if not frozen):
- # edit name: [New Name]
- # edit description: [New Description]
- # edit tone: light|dark
`;
    }
  }

  prompt += `
Be creative, collaborative, and respectful of the established game history. Build on what exists rather than contradicting it.`;

  return prompt;
}

/**
 * Format a period with its full conversation history
 */
function formatPeriod(period: Period, gameState: GameState): string {
  const lines: string[] = [];

  lines.push(`## PERIOD: ${period.title} ${period.isBookend ? '(BOOKEND)' : ''}`);
  lines.push(`Tone: ${period.tone === 'light' ? '☀️ Light' : '🌙 Dark'}`);
  if (period.description) {
    lines.push(`Description: ${period.description}`);
  }
  lines.push('');

  // Include period's conversation
  const conversation = gameState.conversations[period.conversationId];
  if (conversation && conversation.messages.length > 0) {
    lines.push('### Period Discussion:');
    conversation.messages.forEach(msg => {
      lines.push(formatMessage(msg));
    });
    lines.push('');
  }

  // Include all events in this period
  const events = gameState.events
    .filter(e => e.periodId === period.id)
    .sort((a, b) => a.order - b.order);

  if (events.length > 0) {
    lines.push('### Events in this Period:');
    events.forEach(event => {
      lines.push(formatEvent(event, gameState));
    });
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Format an event with its full conversation history
 */
function formatEvent(event: Event, gameState: GameState): string {
  const lines: string[] = [];

  lines.push(`#### EVENT: ${event.title}`);
  lines.push(`Tone: ${event.tone === 'light' ? '☀️ Light' : '🌙 Dark'}`);
  if (event.description) {
    lines.push(`Description: ${event.description}`);
  }
  lines.push('');

  // Include event's conversation
  const conversation = gameState.conversations[event.conversationId];
  if (conversation && conversation.messages.length > 0) {
    lines.push('##### Event Discussion:');
    conversation.messages.forEach(msg => {
      lines.push(formatMessage(msg));
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format a message
 */
function formatMessage(msg: { role: string; playerName?: string; content: string; timestamp: number }): string {
  const speaker = msg.playerName || (msg.role === 'system' ? 'System' : msg.role);
  const date = new Date(msg.timestamp).toLocaleString();
  return `[${date}] ${speaker}: ${msg.content}`;
}
