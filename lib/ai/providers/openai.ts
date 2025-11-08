import type { AIProvider, AIMessage, AIProviderConfig } from '../types';

/**
 * OpenAI Provider (Stub)
 *
 * This is a placeholder implementation showing how to add other providers.
 * To use: npm install openai, then implement the actual API calls.
 */
export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'gpt-4-turbo-preview') {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<string> {
    // TODO: Implement with OpenAI SDK
    // const openai = new OpenAI({ apiKey: this.apiKey });
    // const response = await openai.chat.completions.create({ ... });
    throw new Error('OpenAI provider not yet implemented. Add the openai package and implement this method.');
  }

  async streamResponse(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    config?: Partial<AIProviderConfig>
  ): Promise<void> {
    throw new Error('OpenAI provider not yet implemented.');
  }
}
