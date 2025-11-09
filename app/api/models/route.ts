import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Cache models for 1 hour
let cachedModels: any = null;
let cacheTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Model definitions (single source of truth)
const CLAUDE_MODELS = [
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5 ⭐', recommended: true },
  { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Oct 2024)' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
];

const OPENAI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o (Latest)', recommended: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
];

export async function GET() {
  try {
    const now = Date.now();

    // Return cached models if still fresh
    if (cachedModels && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json(cachedModels);
    }

    // Get models (currently using hardcoded lists)
    // Future: Could fetch from provider APIs if they offer public endpoints
    const models = {
      claude: CLAUDE_MODELS,
      openai: OPENAI_MODELS,
    };

    // Cache the result
    cachedModels = models;
    cacheTime = now;

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);

    // Return fallback hardcoded list
    return NextResponse.json({
      claude: CLAUDE_MODELS,
      openai: OPENAI_MODELS,
    });
  }
}
