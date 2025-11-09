/**
 * Parse AI commands from responses and extract object creation/editing instructions
 */

export interface ParsedCommand {
  type: 'create-period' | 'create-bookend-period' | 'create-event' | 'create-scene' |
        'add-palette' | 'edit-name' | 'edit-description' | 'edit-tone' | 'none';
  data?: any;
  remainingMessage?: string; // Text that should go to the conversation (after all commands)
}

export interface ParsedResponse {
  commands: ParsedCommand[];
  remainingMessage?: string; // Non-command text
}

/**
 * Parse an AI response for commands
 *
 * Commands can be:
 * 1. Single command on first line (legacy support)
 * 2. Multiple commands, each prefixed with # on its own line
 *
 * Supported commands:
 * - # create period: Title (light|dark) | Description
 * - # create bookend period: Title (light|dark) | Summary
 * - # create event: Title (light|dark) in Period Title
 * - # create scene: Question in Event Title
 * - # add to palette yes: item
 * - # add to palette no: item
 * - # edit name: New Name
 * - # edit description: New Description
 * - # edit tone: light|dark
 */
export function parseAIResponse(response: string): ParsedResponse {
  const lines = response.split('\n');
  const commands: ParsedCommand[] = [];
  const nonCommandLines: string[] = [];
  let isFirstLine = true;

  // Check if any lines start with #
  const hasHashCommands = lines.some(line => line.trim().startsWith('#'));

  for (const line of lines) {
    const trimmedLine = line.trim();

    // If we have hash commands, only process lines starting with #
    // Otherwise, only process first line as command (legacy support)
    const shouldTryParse = hasHashCommands
      ? trimmedLine.startsWith('#')
      : isFirstLine;

    if (shouldTryParse) {
      // Remove # prefix if present
      const commandLine = trimmedLine.startsWith('#')
        ? trimmedLine.substring(1).trim()
        : trimmedLine;

      const parsedCommand = parseSingleCommand(commandLine);

      if (parsedCommand.type !== 'none') {
        commands.push(parsedCommand);
      } else if (!hasHashCommands && isFirstLine) {
        // Legacy mode: first line didn't match any command, treat everything as message
        nonCommandLines.push(line);
      } else if (!trimmedLine.startsWith('#')) {
        // Not a command line, keep it
        nonCommandLines.push(line);
      }
    } else {
      // Not a command line, keep it
      nonCommandLines.push(line);
    }

    isFirstLine = false;
  }

  const remainingMessage = nonCommandLines.join('\n').trim();

  return {
    commands: commands.length > 0 ? commands : [{ type: 'none' }],
    remainingMessage: remainingMessage || undefined,
  };
}

/**
 * Parse a single command line (without # prefix)
 */
function parseSingleCommand(commandLine: string): ParsedCommand {
  // Parse create period command
  const periodMatch = commandLine.match(/^create period:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (periodMatch) {
    return {
      type: 'create-period',
      data: {
        title: periodMatch[1].trim(),
        tone: periodMatch[2].toLowerCase() as 'light' | 'dark',
        description: periodMatch[3].trim(),
      },
    };
  }

  // Parse create bookend period command
  const bookendMatch = commandLine.match(/^create bookend period:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (bookendMatch) {
    return {
      type: 'create-bookend-period',
      data: {
        title: bookendMatch[1].trim(),
        tone: bookendMatch[2].toLowerCase() as 'light' | 'dark',
        description: bookendMatch[3].trim(),
        position: bookendMatch[1].toLowerCase().includes('start') ||
                  bookendMatch[1].toLowerCase().includes('begin') ||
                  bookendMatch[1].toLowerCase().includes('first') ? 'start' : 'end',
      },
    };
  }

  // Parse create event command
  const eventMatch = commandLine.match(/^create event:\s*(.+?)\s*\((light|dark)\)\s*in\s+(.+)$/i);
  if (eventMatch) {
    return {
      type: 'create-event',
      data: {
        title: eventMatch[1].trim(),
        tone: eventMatch[2].toLowerCase() as 'light' | 'dark',
        periodTitle: eventMatch[3].trim(),
      },
    };
  }

  // Parse create scene command
  const sceneMatch = commandLine.match(/^create scene:\s*(.+?)\s*in\s+(.+)$/i);
  if (sceneMatch) {
    return {
      type: 'create-scene',
      data: {
        question: sceneMatch[1].trim(),
        eventTitle: sceneMatch[2].trim(),
      },
    };
  }

  // Parse add to palette command
  const paletteYesMatch = commandLine.match(/^add to palette yes:\s*(.+)$/i);
  if (paletteYesMatch) {
    return {
      type: 'add-palette',
      data: {
        category: 'yes',
        item: paletteYesMatch[1].trim(),
      },
    };
  }

  const paletteNoMatch = commandLine.match(/^add to palette no:\s*(.+)$/i);
  if (paletteNoMatch) {
    return {
      type: 'add-palette',
      data: {
        category: 'no',
        item: paletteNoMatch[1].trim(),
      },
    };
  }

  // Parse edit name command
  const editNameMatch = commandLine.match(/^edit name:\s*(.+)$/i);
  if (editNameMatch) {
    return {
      type: 'edit-name',
      data: {
        newName: editNameMatch[1].trim(),
      },
    };
  }

  // Parse edit description command
  const editDescMatch = commandLine.match(/^edit description:\s*(.+)$/i);
  if (editDescMatch) {
    return {
      type: 'edit-description',
      data: {
        newDescription: editDescMatch[1].trim(),
      },
    };
  }

  // Parse edit tone command
  const editToneMatch = commandLine.match(/^edit tone:\s*(light|dark)$/i);
  if (editToneMatch) {
    return {
      type: 'edit-tone',
      data: {
        newTone: editToneMatch[1].toLowerCase() as 'light' | 'dark',
      },
    };
  }

  // No command found
  return { type: 'none' };
}
