import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage, AIProviderConfig } from '../types';

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({ apiKey });
    this.defaultModel = defaultModel;
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await this.client.messages.create({
      model: config?.model || this.defaultModel,
      max_tokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 1.0,
      system: systemMessage,
      messages: conversationMessages,
    });

    const textContent = response.content.find(c => c.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : '';
  }

  async streamResponse(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    config?: Partial<AIProviderConfig>
  ): Promise<void> {
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const stream = await this.client.messages.create({
      model: config?.model || this.defaultModel,
      max_tokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 1.0,
      system: systemMessage,
      messages: conversationMessages,
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        onChunk(event.delta.text);
      }
    }
  }
}
