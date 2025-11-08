import type { AIProvider } from './types';
import { ClaudeProvider } from './providers/claude';
import { OpenAIProvider } from './providers/openai';

export type ProviderType = 'claude' | 'openai';

export interface ProviderFactoryConfig {
  provider: ProviderType;
  apiKey: string;
  model?: string;
}

/**
 * Factory for creating AI providers
 *
 * Usage:
 *   const provider = createAIProvider({
 *     provider: 'claude',
 *     apiKey: process.env.ANTHROPIC_API_KEY!,
 *   });
 */
export function createAIProvider(config: ProviderFactoryConfig): AIProvider {
  switch (config.provider) {
    case 'claude':
      return new ClaudeProvider(config.apiKey, config.model);
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
