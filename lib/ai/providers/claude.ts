import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIMessage, AIProviderConfig } from '../types';

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel: string = 'claude-3-5-sonnet-20241022') {
    this.client = new Anthropic({
      apiKey,
      // Ensure compatibility with edge runtime
      dangerouslyAllowBrowser: false,
    });
    this.defaultModel = defaultModel;
  }

  /**
   * Prepare system messages with cache_control support
   */
  private prepareSystemMessages(messages: AIMessage[]) {
    const systemMessages = messages.filter(m => m.role === 'system');
    return systemMessages.length > 0
      ? systemMessages.map(m => ({
          type: 'text' as const,
          text: m.content,
          ...(m.cache_control ? { cache_control: m.cache_control } : {}),
        }))
      : undefined;
  }

  /**
   * Prepare conversation messages with cache_control support
   *
   * Note: When using cache_control, content must be an array of blocks
   */
  private prepareConversationMessages(messages: AIMessage[]) {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => {
        if (m.cache_control) {
          // Use content block format when cache_control is present
          return {
            role: m.role as 'user' | 'assistant',
            content: [
              {
                type: 'text' as const,
                text: m.content,
                cache_control: m.cache_control,
              }
            ],
          };
        } else {
          // Use simple string format when no cache_control
          return {
            role: m.role as 'user' | 'assistant',
            content: m.content,
          };
        }
      });
  }

  async generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<string> {
    const system = this.prepareSystemMessages(messages);
    const conversationMessages = this.prepareConversationMessages(messages);

    const response = await this.client.messages.create({
      model: config?.model || this.defaultModel,
      max_tokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 1.0,
      system,
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
    const system = this.prepareSystemMessages(messages);
    const conversationMessages = this.prepareConversationMessages(messages);

    const stream = await this.client.messages.create({
      model: config?.model || this.defaultModel,
      max_tokens: config?.maxTokens || 4096,
      temperature: config?.temperature || 1.0,
      system,
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
