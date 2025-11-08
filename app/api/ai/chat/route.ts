import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';
import type { AIMessage } from '@/lib/ai';
import { serializeGameState } from '@/lib/microscope/game-state-serializer';
import type { GameState } from '@/lib/microscope/types';

// Force this to run in Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { messages, gameState, gameContext, apiSettings } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    if (!apiSettings?.apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const provider = createAIProvider({
      provider: apiSettings.provider || 'claude',
      apiKey: apiSettings.apiKey,
      model: apiSettings.model,
    });

    // Build messages with prompt caching structure
    const aiMessages = buildCachedMessages(messages, gameState, gameContext, apiSettings.model);

    const response = await provider.generateResponse(aiMessages, {
      temperature: 1.0,
      maxTokens: 2048,
    });

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('AI chat error:', error);

    // Return more detailed error info
    const errorMessage = error?.message || 'Unknown error';
    const errorType = error?.constructor?.name || 'Error';

    return NextResponse.json(
      {
        error: 'Failed to generate AI response',
        details: errorMessage,
        type: errorType,
      },
      { status: 500 }
    );
  }
}

/**
 * Check if a model supports prompt caching
 */
function supportsPromptCaching(model?: string): boolean {
  if (!model) return false;

  // Models that support prompt caching
  const cachingSupportedModels = [
    'claude-3-5-sonnet',
    'claude-3-5-haiku',
    'claude-3-7-sonnet',
    'claude-3-opus',
    'claude-3-haiku',
    'claude-sonnet-4',
    'claude-opus-4',
  ];

  return cachingSupportedModels.some(supported => model.startsWith(supported));
}

/**
 * Build messages with prompt caching structure for optimal performance
 *
 * Structure:
 * 1. System: Game rules (CACHED - rarely changes)
 * 2. System: Full game state (CACHED - changes when timeline updates)
 * 3. User/Assistant conversation history (last message CACHED)
 * 4. New user message (UNCACHED)
 */
function buildCachedMessages(
  conversationMessages: any[],
  gameState: GameState | null,
  gameContext?: {
    bigPicture?: string;
    bookends?: { start: string; end: string };
    palette?: { yes: string[]; no: string[] };
    currentContext?: string;
  },
  model?: string
): AIMessage[] {
  const messages: AIMessage[] = [];
  const useCaching = supportsPromptCaching(model);

  // CACHE BLOCK 1: Game rules and instructions (stable, rarely changes)
  const rulesMessage = `You are an AI co-player in a game of Microscope RPG, a collaborative timeline-building game where players create a vast history together.

CRITICAL FORMATTING RULES:
- DO NOT use markdown formatting (no **, ##, -, *, etc.)
- Write plain text only
- Use natural paragraph breaks for readability
- Never use code blocks, bullet points, or headers

GAME RULES - MICROSCOPE RPG:
Microscope is about creating an epic history spanning vast periods of time. The timeline has three levels:
1. PERIODS - Large spans of time (e.g., "The Golden Age of Magic"). Each has a tone: Light (good times) or Dark (bad times)
2. EVENTS - Important moments within a Period (e.g., "The Great Library Burns"). Each has its own tone
3. SCENES - Detailed roleplay moments where we explore specific questions about an Event

The game has a Palette (things we want/don't want), Bookends (start and end of history), and a Big Picture (the overall scope).

YOUR ROLE:
- Help build a rich, engaging timeline collaboratively
- Suggest creative Periods, Events, and Scenes that fit the themes
- Respect established tones (Light/Dark) and maintain continuity
- Ask thoughtful questions to explore interesting moments
- Be encouraging and build on the human player's ideas
- Keep responses conversational and concise (2-4 sentences typically)
- When suggesting ideas, offer 2-3 options for the player to choose from

CREATING GAME OBJECTS (when in Game Setup conversation):
When the user asks you to create timeline objects, use these EXACT command formats as the FIRST LINE of your response:

create period: [Title] (light|dark) | [short description]
create bookend period: [Title] (light|dark) | [short summary]
create event: [Title] (light|dark) in [Period Title]
create scene: [Question to explore] in [Event Title]
add to palette yes: [item]
add to palette no: [item]

IMPORTANT RULES FOR COMMANDS:
- Commands MUST be on the FIRST LINE of your response
- For regular periods/events/scenes: Everything AFTER the command line will appear in the newly created object's conversation
- For bookend periods: Include description on the same line (after |), do NOT add additional text - stay in current chat
- Only use these commands when explicitly asked by the user
- After a create command (except bookends), continue your message naturally - it will appear in the new object's chat
- You can ONLY create objects when you are in the Game Setup conversation (the meta/top-level chat)

Examples:
User: "Create a period for when humanity discovers magic"
You: "create period: The Awakening (light) | The first era of magical discovery
This marks the beginning of a new era. The first humans discover they can manipulate reality itself, leading to wonder and transformation across the world."
(First line creates the period with description, rest teleports to that period's conversation)

User: "Create a bookend for the start"
You: "create bookend period: The First Dawn (light) | Before civilization, when the world was young and wild"
(Creates bookend period with summary, stays in current conversation)

You have access to the complete game state below, including all conversations from all Periods, Events, and Scenes. Use this knowledge to maintain continuity, reference earlier events, and create rich connections across the timeline.`;

  messages.push({
    role: 'system',
    content: rulesMessage,
    ...(useCaching ? { cache_control: { type: 'ephemeral' } } : {}),
  });

  // CACHE BLOCK 2: Complete game state (changes when timeline updates)
  if (gameState) {
    const fullGameState = serializeGameState(gameState);
    messages.push({
      role: 'system',
      content: fullGameState,
      ...(useCaching ? { cache_control: { type: 'ephemeral' } } : {}),
    });
  }

  // CACHE BLOCK 3: Conversation history (last message gets cached)
  // This allows the conversation to grow without re-processing old messages
  if (conversationMessages.length > 0) {
    conversationMessages.forEach((msg, index) => {
      const isLastMessage = index === conversationMessages.length - 1;
      messages.push({
        role: msg.role,
        content: msg.content,
        ...(useCaching && isLastMessage ? { cache_control: { type: 'ephemeral' } } : {}),
      });
    });
  }

  // Current context hint (if provided, for backward compatibility)
  if (gameContext?.currentContext) {
    messages.push({
      role: 'system',
      content: `Current focus: ${gameContext.currentContext}`,
    });
  }

  return messages;
}
