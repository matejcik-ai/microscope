/**
 * AI System Prompts
 *
 * This module manages system prompts for different AI personas and use cases.
 * Each prompt is stored in a separate file for easy maintenance and version control.
 */

import { MICROSCOPE_DEFAULT_PROMPT } from './microscope-default';

/**
 * Available prompt personas
 */
export type PromptPersona = 'default' | 'creative' | 'analytical' | 'minimal';

/**
 * Prompt registry mapping persona names to their system prompts
 */
const PROMPT_REGISTRY: Record<PromptPersona, string> = {
  default: MICROSCOPE_DEFAULT_PROMPT,
  // Future personas can be added here:
  // creative: MICROSCOPE_CREATIVE_PROMPT,
  // analytical: MICROSCOPE_ANALYTICAL_PROMPT,
  // minimal: MICROSCOPE_MINIMAL_PROMPT,
  creative: MICROSCOPE_DEFAULT_PROMPT, // TODO: Implement creative variant
  analytical: MICROSCOPE_DEFAULT_PROMPT, // TODO: Implement analytical variant
  minimal: MICROSCOPE_DEFAULT_PROMPT, // TODO: Implement minimal variant
};

/**
 * Get system prompt for a specific persona
 *
 * @param persona - The persona to use (defaults to 'default')
 * @returns The system prompt text
 */
export function getSystemPrompt(persona: PromptPersona = 'default'): string {
  return PROMPT_REGISTRY[persona];
}

/**
 * Get list of available personas
 */
export function getAvailablePersonas(): PromptPersona[] {
  return Object.keys(PROMPT_REGISTRY) as PromptPersona[];
}

/**
 * Re-export for convenience
 */
export { MICROSCOPE_DEFAULT_PROMPT };
