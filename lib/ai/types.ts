/**
 * Pluggable AI Provider Architecture for Microscope RPG
 *
 * This allows users to bring their own AI provider (Claude, GPT-4, etc.)
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  cache_control?: {
    type: 'ephemeral';
  };
}

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  /**
   * The name of the provider (e.g., "claude", "openai")
   */
  name: string;

  /**
   * Generate a response from the AI
   */
  generateResponse(
    messages: AIMessage[],
    config?: Partial<AIProviderConfig>
  ): Promise<string>;

  /**
   * Stream a response from the AI (for real-time display)
   */
  streamResponse?(
    messages: AIMessage[],
    onChunk: (chunk: string) => void,
    config?: Partial<AIProviderConfig>
  ): Promise<void>;
}
