import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';
import type { AIMessage } from '@/lib/ai';
import { serializeGameState } from '@/lib/microscope/game-state-serializer';
import type { GameState } from '@/lib/microscope/types';
import { getSystemPrompt } from '@/lib/ai/prompts';

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
 * Check if we should enable prompt caching
 *
 * Prompt caching is now enabled for all models. Providers that don't support
 * caching will simply ignore the cache_control metadata.
 */
function shouldEnablePromptCaching(): boolean {
  return true;
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
  const useCaching = shouldEnablePromptCaching();

  // CACHE BLOCK 1: Game rules and instructions (stable, rarely changes)
  const rulesMessage = getSystemPrompt('default');

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
