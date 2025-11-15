import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';
import type { AIMessage } from '@/lib/ai';
import { buildCachedGameContext } from '@/lib/microscope/game-context-builder';
import type { GameState } from '@/lib/microscope/types';

// Force this to run in Node.js runtime instead of Edge
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { gameState, currentConversationId, apiSettings } = await request.json();

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game state is required' },
        { status: 400 }
      );
    }

    if (!currentConversationId) {
      return NextResponse.json(
        { error: 'Current conversation ID is required' },
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

    // Build cached game context per spec
    const context = buildCachedGameContext(gameState, currentConversationId);

    // Build messages with prompt caching structure
    const aiMessages = buildCachedMessages(context);

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
 * Build messages with prompt caching structure per spec
 *
 * Per spec, the structure is:
 * 1. User message with:
 *    - System prompt + ALL game history (CACHED)
 * 2. Last ~10 conversation messages (UNCACHED)
 *
 * This creates one large cached block that grows with game history,
 * making repeated tokens very cheap via Claude's prompt caching.
 */
function buildCachedMessages(
  context: {
    systemPrompt: string;
    cachedContext: string;
    recentMessages: Array<{ role: string; content: string }>;
  }
): AIMessage[] {
  const messages: AIMessage[] = [];

  // CACHED BLOCK: System prompt + complete game history
  // This is the single large cached context per spec
  const fullCachedContent = `${context.systemPrompt}

---

${context.cachedContext}`;

  messages.push({
    role: 'user',
    content: fullCachedContent,
    cache_control: { type: 'ephemeral' },
  });

  // UNCACHED: Recent conversation messages (last ~10)
  context.recentMessages.forEach(msg => {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  });

  return messages;
}
