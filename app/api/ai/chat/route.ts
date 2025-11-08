import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';
import type { AIMessage } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { messages, gameContext, apiSettings } = await request.json();

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

    // Build context-aware system message
    const systemMessage = buildSystemMessage(gameContext);

    const aiMessages: AIMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];

    const response = await provider.generateResponse(aiMessages, {
      temperature: 1.0,
      maxTokens: 2048,
    });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}

function buildSystemMessage(gameContext?: {
  bigPicture?: string;
  bookends?: { start: string; end: string };
  palette?: { yes: string[]; no: string[] };
  currentContext?: string;
}): string {
  let message = `You are an AI player in a game of Microscope RPG, a collaborative timeline-building game.

Your role is to help build a rich, engaging historical timeline with the human player. You should:
- Suggest creative periods, events, and scenes that fit the game's themes
- Respect the established tone (Light or Dark) for each element
- Build on what has been established, maintaining continuity
- Ask questions to help explore interesting moments in the timeline
- Be collaborative and encouraging

`;

  if (gameContext?.bigPicture) {
    message += `\nThe Big Picture (overall theme/scope): ${gameContext.bigPicture}\n`;
  }

  if (gameContext?.bookends) {
    message += `\nBookends:\n- Start: ${gameContext.bookends.start}\n- End: ${gameContext.bookends.end}\n`;
  }

  if (gameContext?.palette) {
    if (gameContext.palette.yes.length > 0) {
      message += `\nThings we WANT to see: ${gameContext.palette.yes.join(', ')}\n`;
    }
    if (gameContext.palette.no.length > 0) {
      message += `\nThings we DON'T want: ${gameContext.palette.no.join(', ')}\n`;
    }
  }

  if (gameContext?.currentContext) {
    message += `\nCurrent context: ${gameContext.currentContext}\n`;
  }

  return message;
}
