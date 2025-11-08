import { NextRequest, NextResponse } from 'next/server';
import { createAIProvider } from '@/lib/ai';

/**
 * Test API endpoint to verify AI provider is working
 *
 * POST /api/test-ai
 * Body: { message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY environment variable is not set' },
        { status: 500 }
      );
    }

    const provider = createAIProvider({
      provider: 'claude',
      apiKey,
    });

    const response = await provider.generateResponse([
      {
        role: 'system',
        content: 'You are a helpful assistant for the Microscope RPG game.',
      },
      {
        role: 'user',
        content: message,
      },
    ]);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI provider error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}
