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
 * Per spec/system-prompts.md: Each conversation type gets its own system prompt template
 */
function buildSystemPrompt(gameState: GameState, currentConversationId: string): string {
  const isMetaConversation = currentConversationId === gameState.metaConversationId;
  const currentPlayer = gameState.currentTurn
    ? gameState.players.find(p => p.id === gameState.currentTurn?.playerId)
    : null;
  const playerName = currentPlayer?.name || 'AI Player';

  if (isMetaConversation) {
    return buildMetaConversationPrompt(gameState, playerName);
  }

  // Check for period, event, or scene conversation
  const period = gameState.periods.find(p => p.conversationId === currentConversationId);
  if (period) {
    return buildPeriodConversationPrompt(period, playerName);
  }

  const event = gameState.events.find(e => e.conversationId === currentConversationId);
  if (event) {
    return buildEventConversationPrompt(event, playerName);
  }

  const scene = gameState.scenes?.find(s => s.conversationId === currentConversationId);
  if (scene) {
    return buildSceneConversationPrompt(scene, playerName);
  }

  // Fallback to generic prompt
  return buildMetaConversationPrompt(gameState, playerName);
}

/**
 * Meta conversation system prompt (per spec/system-prompts.md)
 */
function buildMetaConversationPrompt(gameState: GameState, playerName: string): string {
  const phase = gameState.phase;

  return `You are ${playerName}, playing Microscope RPG as a collaborative storyteller.

You create engaging periods, events, and scenes that build on the shared history. You balance light and dark tones, and focus on making the timeline interesting and coherent. You ask clarifying questions when needed and respect the established facts of the game.

MICROSCOPE BASICS:
Microscope is a collaborative storytelling game where you build a history together.
- Hierarchy: Periods (long timespans) → Events (moments) → Scenes (detailed exploration)
- Palette: create content matching "yes" items, avoid "no" items
- Tone: light (hopeful/positive), dark (tragic/grim), or neutral

CREATING ITEMS:

Use these commands when prompted to create items:

${phase === 'setup' ? `CREATE PALETTE
- YES: thing we want in the history
- NO: thing we don't want in the history
- YES: another yes item
- NO: another no item

You can create multiple palette items at once. Only available during setup phase.

` : ''}CREATE PERIOD name FIRST | LAST | AFTER item-name | BEFORE item-name TONE light | dark DESCRIPTION short description

(blank line)

Expanded description goes here. This becomes the first message in the period's conversation.
Explain the period's significance, how it relates to other items, add detail.

CREATE EVENT name IN period-name FIRST | LAST | AFTER item-name | BEFORE item-name TONE light | dark DESCRIPTION short description

(blank line)

Expanded description. This becomes the first message in the event's conversation.

CREATE SCENE name IN event-name FIRST | LAST | AFTER item-name | BEFORE item-name TONE light | dark QUESTION the defining question ANSWER the answer DESCRIPTION short description

(blank line)

Expanded description. This becomes the first message in the scene's conversation.

POSITIONING RULES:
- FIRST and LAST are only available during setup (for period bookends)
- AFTER and BEFORE are only available during gameplay
- All positioning is relative to existing items at creation time
- Items can be inserted between others later

COMMAND AVAILABILITY BY PHASE:
- Setup: CREATE PALETTE, CREATE PERIOD (bookends with FIRST/LAST only)
- Gameplay: CREATE PERIOD, CREATE EVENT, CREATE SCENE (with AFTER/BEFORE positioning)

Examples:
CREATE PERIOD The Golden Age FIRST TONE light DESCRIPTION An era of unprecedented prosperity

This was a time when civilization flourished, art and science advanced rapidly, and peace reigned across the land.

CREATE EVENT The Great Reform IN The Golden Age AFTER The Coronation TONE neutral DESCRIPTION The emperor restructured the government

The old bureaucratic systems were dismantled and replaced with a merit-based administration that would serve the empire for centuries.`;
}

/**
 * Period conversation system prompt (per spec/system-prompts.md)
 */
function buildPeriodConversationPrompt(period: Period, playerName: string): string {
  if (period.frozen) {
    return `You are ${playerName}, playing Microscope RPG as a collaborative storyteller.

You create engaging periods, events, and scenes that build on the shared history. You balance light and dark tones, and focus on making the timeline interesting and coherent. You ask clarifying questions when needed and respect the established facts of the game.

YOUR ROLE IN THIS CONVERSATION:
- Help explore the implications and themes of this period
- Answer questions about events within it
- Discuss the period's relationship to the larger history

PERIOD RULES:
- Periods are long stretches of time in the history
- Can contain multiple Events (specific moments within the timespan)
- This period is frozen - its metadata cannot be changed
- Events can still be added to it by any player`;
  }

  return `You are ${playerName}, playing Microscope RPG as a collaborative storyteller.

You create engaging periods, events, and scenes that build on the shared history. You balance light and dark tones, and focus on making the timeline interesting and coherent. You ask clarifying questions when needed and respect the established facts of the game.

YOUR ROLE IN THIS CONVERSATION:
- Help explore the implications and themes of this period
- Answer questions about how events might fit within it
- Discuss the period's relationship to the larger history
- Suggest refinements to the period's metadata (name, timespan indicators, tone, description)

PERIOD RULES:
- Periods are long stretches of time in the history
- Can contain multiple Events (specific moments within the timespan)
- Tone affects what Events fit within it
- Events can be added by any player at any time`;
}

/**
 * Event conversation system prompt (per spec/system-prompts.md)
 */
function buildEventConversationPrompt(event: Event, playerName: string): string {
  if (event.frozen) {
    return `You are ${playerName}, playing Microscope RPG as a collaborative storyteller.

You create engaging periods, events, and scenes that build on the shared history. You balance light and dark tones, and focus on making the timeline interesting and coherent. You ask clarifying questions when needed and respect the established facts of the game.

YOUR ROLE IN THIS CONVERSATION:
- Help explore what happened during this event
- Answer questions about its implications
- Discuss how it fits within its parent period and the larger history

EVENT RULES:
- Events are specific moments within a Period
- Can contain Scenes (detailed explorations)
- This event is frozen - its metadata cannot be changed
- Scenes can still be added to it by any player`;
  }

  return `You are ${playerName}, playing Microscope RPG as a collaborative storyteller.

You create engaging periods, events, and scenes that build on the shared history. You balance light and dark tones, and focus on making the timeline interesting and coherent. You ask clarifying questions when needed and respect the established facts of the game.

YOUR ROLE IN THIS CONVERSATION:
- Help explore what happened during this event
- Answer questions about its implications
- Discuss how it fits within its parent period
- Suggest refinements to the event's metadata (name, positioning, tone, description)

EVENT RULES:
- Events are specific moments within a Period
- Can contain Scenes (detailed explorations of moments within the event)
- Must respect the tone and themes of their parent period
- Positioning (FIRST/LAST/BEFORE/AFTER) is relative at creation time`;
}

/**
 * Scene conversation system prompt (per spec/system-prompts.md)
 * v1: Dictated scenes only
 */
function buildSceneConversationPrompt(scene: Scene, playerName: string): string {
  const editable = !scene.frozen;

  return `You are ${playerName}, playing Microscope RPG as a collaborative storyteller.

You create engaging periods, events, and scenes that build on the shared history. You balance light and dark tones, and focus on making the timeline interesting and coherent. You ask clarifying questions when needed and respect the established facts of the game.

YOUR ROLE IN THIS CONVERSATION:
- Help explore what happened in this scene
- Answer questions about the Question and Answer
- Discuss how the scene illustrates the parent event

SCENE RULES (v1: Dictated Scenes):
- Scenes are specific moments within an Event
- Started with a Question (what we want to find out)
- Have an Answer (what actually happened)
- This is a dictated scene - the answer is provided by the creator
- ${editable ? 'Scene is editable' : 'Scene is frozen - metadata cannot be changed'}`;
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

  // Include all scenes in this event
  const scenes = gameState.scenes
    .filter(s => s.eventId === event.id)
    .sort((a, b) => a.order - b.order);

  if (scenes.length > 0) {
    lines.push('##### Scenes in this Event:');
    scenes.forEach(scene => {
      lines.push(formatScene(scene, gameState));
    });
  }

  return lines.join('\n');
}

/**
 * Format a scene with its full conversation history
 */
function formatScene(scene: any, gameState: GameState): string {
  const lines: string[] = [];

  lines.push(`###### SCENE: ${scene.question}`);
  if (scene.answer) {
    lines.push(`Answer: ${scene.answer}`);
  }
  lines.push('');

  // Include scene's conversation
  const conversation = gameState.conversations[scene.conversationId];
  if (conversation && conversation.messages.length > 0) {
    lines.push('###### Scene Discussion:');
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
