import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';
import type { AIMessage } from '@/lib/ai';

// Force this to run in Node.js runtime instead of Edge
export const runtime = 'nodejs';

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

function buildSystemMessage(gameContext?: {
  bigPicture?: string;
  bookends?: { start: string; end: string };
  palette?: { yes: string[]; no: string[] };
  currentContext?: string;
}): string {
  let message = `You are an AI co-player in a game of Microscope RPG, a collaborative timeline-building game where players create a vast history together.

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
