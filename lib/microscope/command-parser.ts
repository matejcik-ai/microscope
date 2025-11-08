/**
 * Parse AI commands from responses and extract object creation instructions
 */

export interface ParsedCommand {
  type: 'create-period' | 'create-bookend-period' | 'create-event' | 'create-scene' | 'add-palette' | 'none';
  data?: any;
  remainingMessage?: string; // Text that should go to the new object's conversation
}

/**
 * Parse an AI response for commands
 * Commands are expected on the first line in these formats:
 * - create period: Title (light|dark) | Description
 * - create bookend period: Title (light|dark) | Summary
 * - create event: Title (light|dark) in Period Title
 * - create scene: Question in Event Title
 * - add to palette yes: item
 * - add to palette no: item
 */
export function parseAIResponse(response: string): ParsedCommand {
  const lines = response.split('\n');
  const firstLine = lines[0].trim();
  const remainingMessage = lines.slice(1).join('\n').trim();

  // Parse create period command
  const periodMatch = firstLine.match(/^create period:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (periodMatch) {
    return {
      type: 'create-period',
      data: {
        title: periodMatch[1].trim(),
        tone: periodMatch[2].toLowerCase() as 'light' | 'dark',
        description: periodMatch[3].trim(),
      },
      remainingMessage: remainingMessage || undefined,
    };
  }

  // Parse create bookend period command
  const bookendMatch = firstLine.match(/^create bookend period:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (bookendMatch) {
    return {
      type: 'create-bookend-period',
      data: {
        title: bookendMatch[1].trim(),
        tone: bookendMatch[2].toLowerCase() as 'light' | 'dark',
        description: bookendMatch[3].trim(),
      },
      remainingMessage: undefined, // Bookends don't teleport message
    };
  }

  // Parse create event command
  const eventMatch = firstLine.match(/^create event:\s*(.+?)\s*\((light|dark)\)\s*in\s+(.+)$/i);
  if (eventMatch) {
    return {
      type: 'create-event',
      data: {
        title: eventMatch[1].trim(),
        tone: eventMatch[2].toLowerCase() as 'light' | 'dark',
        periodTitle: eventMatch[3].trim(),
      },
      remainingMessage: remainingMessage || undefined,
    };
  }

  // Parse create scene command
  const sceneMatch = firstLine.match(/^create scene:\s*(.+?)\s*in\s+(.+)$/i);
  if (sceneMatch) {
    return {
      type: 'create-scene',
      data: {
        question: sceneMatch[1].trim(),
        eventTitle: sceneMatch[2].trim(),
      },
      remainingMessage: remainingMessage || undefined,
    };
  }

  // Parse add to palette command
  const paletteYesMatch = firstLine.match(/^add to palette yes:\s*(.+)$/i);
  if (paletteYesMatch) {
    return {
      type: 'add-palette',
      data: {
        category: 'yes',
        item: paletteYesMatch[1].trim(),
      },
      remainingMessage: undefined,
    };
  }

  const paletteNoMatch = firstLine.match(/^add to palette no:\s*(.+)$/i);
  if (paletteNoMatch) {
    return {
      type: 'add-palette',
      data: {
        category: 'no',
        item: paletteNoMatch[1].trim(),
      },
      remainingMessage: undefined,
    };
  }

  // No command found - return the full message
  return {
    type: 'none',
    remainingMessage: response,
  };
}
