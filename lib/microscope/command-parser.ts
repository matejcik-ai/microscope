/**
 * Parse AI commands from responses and extract object creation/editing instructions
 *
 * Spec: Commands use uppercase keywords (case-insensitive matching):
 * - CREATE PERIOD name FIRST|LAST|AFTER item|BEFORE item TONE light|dark DESCRIPTION short
 * - CREATE EVENT name IN period FIRST|LAST|AFTER item|BEFORE item TONE light|dark DESCRIPTION short
 * - CREATE SCENE name IN event FIRST|LAST|AFTER item|BEFORE item TONE light|dark QUESTION q ANSWER a DESCRIPTION short
 * - CREATE PALETTE with YES/NO list
 *
 * Expanded descriptions come after a blank line.
 */

export interface ParsedCommand {
  type: 'create-period' | 'create-start-bookend' | 'create-end-bookend' | 'create-event' | 'create-scene' |
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
 * New spec format:
 * - Commands start with CREATE keyword (case-insensitive)
 * - No # prefix required
 * - Expanded description comes after blank line
 * - Multiple commands separated by blank lines
 *
 * Legacy format (backward compatibility):
 * - Commands prefixed with #
 * - Old syntax: # create period: Title (tone) placement | Description
 */
export function parseAIResponse(response: string): ParsedResponse {
  const commands: ParsedCommand[] = [];
  let remainingMessage = '';

  // Split response into blocks separated by blank lines
  const blocks = splitIntoBlocks(response);

  // Process blocks, checking if each is a command
  // If it is, check if the next block is the expanded description
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const lines = block.lines;
    if (lines.length === 0) continue;

    const firstLine = lines[0].trim();

    // Special handling for CREATE PALETTE - multi-line command
    if (/^CREATE\s+PALETTE$/i.test(firstLine)) {
      // Parse palette items from subsequent lines in this block
      const paletteCommands = parsePaletteItems(lines.slice(1));
      commands.push(...paletteCommands);
      continue;
    }

    // Try to parse as a command
    const parsedCommand = parseSingleCommand(firstLine);

    if (parsedCommand.type !== 'none') {
      // Command found! Check if next block is the expanded description
      const nextBlock = i + 1 < blocks.length ? blocks[i + 1] : null;

      if (nextBlock) {
        const nextFirstLine = nextBlock.lines[0]?.trim() || '';
        const nextParsed = parseSingleCommand(nextFirstLine);

        // If next block is NOT a command, treat it as expanded description
        if (nextParsed.type === 'none') {
          const expandedDescription = nextBlock.original.trim();
          if (expandedDescription && parsedCommand.data) {
            parsedCommand.data.expandedDescription = expandedDescription;
          }
          // Skip the next block since we've consumed it
          i++;
        }
      }

      commands.push(parsedCommand);
    } else {
      // Not a command, add to remaining message
      if (remainingMessage) {
        remainingMessage += '\n\n';
      }
      remainingMessage += block.original;
    }
  }

  return {
    commands: commands.length > 0 ? commands : [{ type: 'none' }],
    remainingMessage: remainingMessage.trim() || undefined,
  };
}

/**
 * Split response into blocks separated by blank lines
 * Returns array of blocks with their lines and original text
 */
function splitIntoBlocks(response: string): Array<{ lines: string[], original: string }> {
  const allLines = response.split('\n');
  const blocks: Array<{ lines: string[], original: string }> = [];
  let currentBlock: string[] = [];

  for (const line of allLines) {
    const trimmed = line.trim();

    if (trimmed === '') {
      // Blank line - end current block if it has content
      if (currentBlock.length > 0) {
        blocks.push({
          lines: [...currentBlock],
          original: currentBlock.join('\n')
        });
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }

  // Don't forget the last block
  if (currentBlock.length > 0) {
    blocks.push({
      lines: [...currentBlock],
      original: currentBlock.join('\n')
    });
  }

  return blocks;
}

/**
 * Parse palette items from CREATE PALETTE command
 * Format:
 * - YES: Item description
 * - NO: Item description
 */
function parsePaletteItems(lines: string[]): ParsedCommand[] {
  const commands: ParsedCommand[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Match "- YES: description" or "- NO: description"
    const yesMatch = /^-\s*YES:\s*(.+)$/i.exec(trimmed);
    const noMatch = /^-\s*NO:\s*(.+)$/i.exec(trimmed);

    if (yesMatch) {
      const item = yesMatch[1].trim();
      commands.push({
        type: 'add-palette',
        data: {
          category: 'yes',
          item: item,
        },
      });
    } else if (noMatch) {
      const item = noMatch[1].trim();
      commands.push({
        type: 'add-palette',
        data: {
          category: 'no',
          item: item,
        },
      });
    }
    // Ignore lines that don't match the pattern
  }

  return commands;
}

/**
 * Parse a single command line
 *
 * Supports both new spec format and legacy format for backward compatibility.
 */
function parseSingleCommand(commandLine: string): ParsedCommand {
  const trimmed = commandLine.trim();

  // Remove legacy # prefix if present
  const line = trimmed.startsWith('#') ? trimmed.substring(1).trim() : trimmed;

  // Try new spec format first
  const newFormatResult = parseNewFormat(line);
  if (newFormatResult.type !== 'none') {
    return newFormatResult;
  }

  // Fall back to legacy format for backward compatibility
  return parseLegacyFormat(line);
}

/**
 * Parse new spec format commands
 *
 * CREATE PERIOD name FIRST|LAST|AFTER item|BEFORE item TONE light|dark DESCRIPTION short
 * CREATE EVENT name IN period FIRST|LAST|AFTER item|BEFORE item TONE light|dark DESCRIPTION short
 * CREATE SCENE name IN event FIRST|LAST|AFTER item|BEFORE item TONE light|dark QUESTION q ANSWER a DESCRIPTION short
 * CREATE PALETTE
 */
function parseNewFormat(line: string): ParsedCommand {
  // CREATE PALETTE is handled specially in parseAIResponse
  // because it's a multi-line command

  // CREATE PERIOD
  const periodResult = parseCreatePeriod(line);
  if (periodResult.type !== 'none') return periodResult;

  // CREATE EVENT
  const eventResult = parseCreateEvent(line);
  if (eventResult.type !== 'none') return eventResult;

  // CREATE SCENE
  const sceneResult = parseCreateScene(line);
  if (sceneResult.type !== 'none') return sceneResult;

  return { type: 'none' };
}

/**
 * Parse CREATE PERIOD command
 * Format: CREATE PERIOD name FIRST|LAST|AFTER item|BEFORE item TONE light|dark DESCRIPTION short
 *
 * Special cases for bookends:
 * - CREATE PERIOD name FIRST TONE tone DESCRIPTION desc → start bookend
 * - CREATE PERIOD name LAST TONE tone DESCRIPTION desc → end bookend
 */
function parseCreatePeriod(line: string): ParsedCommand {
  // Pattern: CREATE PERIOD <name> <placement> TONE <tone> DESCRIPTION <description>
  // Placement can be: FIRST, LAST, AFTER <item>, BEFORE <item>

  const createPeriodMatch = /^CREATE\s+PERIOD\s+(.+)$/i.exec(line);
  if (!createPeriodMatch) return { type: 'none' };

  const rest = createPeriodMatch[1];

  // Extract TONE keyword and value
  const toneMatch = /\bTONE\s+(light|dark)\b/i.exec(rest);
  if (!toneMatch) return { type: 'none' };
  const tone = toneMatch[1].toLowerCase() as 'light' | 'dark';

  // Extract DESCRIPTION keyword and value
  const descMatch = /\bDESCRIPTION\s+(.+)$/i.exec(rest);
  if (!descMatch) return { type: 'none' };
  const description = descMatch[1].trim();

  // Extract name and placement (everything before TONE)
  const beforeTone = rest.substring(0, toneMatch.index).trim();

  // Parse placement and name
  const { name, placement } = parseNameAndPlacement(beforeTone);
  if (!name) return { type: 'none' };

  // Check if this is a bookend (FIRST or LAST placement)
  if (placement.type === 'first') {
    return {
      type: 'create-start-bookend',
      data: {
        title: name,
        tone,
        description,
      },
    };
  }

  if (placement.type === 'last') {
    return {
      type: 'create-end-bookend',
      data: {
        title: name,
        tone,
        description,
      },
    };
  }

  // Regular period
  return {
    type: 'create-period',
    data: {
      title: name,
      tone,
      placement: placement.type === 'none' ? undefined : placement,
      description,
    },
  };
}

/**
 * Parse CREATE EVENT command
 * Format: CREATE EVENT name IN period FIRST|LAST|AFTER item|BEFORE item TONE light|dark DESCRIPTION short
 */
function parseCreateEvent(line: string): ParsedCommand {
  const createEventMatch = /^CREATE\s+EVENT\s+(.+)$/i.exec(line);
  if (!createEventMatch) return { type: 'none' };

  const rest = createEventMatch[1];

  // Extract IN keyword and parent period
  const inMatch = /\bIN\s+(.+?)(?:\s+(?:FIRST|LAST|AFTER|BEFORE)\b|\s+TONE\b)/i.exec(rest);
  if (!inMatch) return { type: 'none' };
  const periodTitle = inMatch[1].trim();

  // Extract TONE keyword and value
  const toneMatch = /\bTONE\s+(light|dark)\b/i.exec(rest);
  if (!toneMatch) return { type: 'none' };
  const tone = toneMatch[1].toLowerCase() as 'light' | 'dark';

  // Extract DESCRIPTION keyword and value
  const descMatch = /\bDESCRIPTION\s+(.+)$/i.exec(rest);
  if (!descMatch) return { type: 'none' };
  const description = descMatch[1].trim();

  // Extract name and placement
  // Name is between "CREATE EVENT" and "IN"
  const nameMatch = /^(.+?)\s+IN\s+/i.exec(rest);
  if (!nameMatch) return { type: 'none' };
  const nameAndMaybePlacement = nameMatch[1].trim();

  // Extract placement (between period name and TONE)
  const afterIn = rest.substring(rest.toLowerCase().indexOf(' in ') + 4);
  const beforeTone = afterIn.substring(0, afterIn.toLowerCase().indexOf(' tone ')).trim();
  const afterPeriodName = beforeTone.substring(periodTitle.length).trim();

  const placement = parsePlacement(afterPeriodName);

  return {
    type: 'create-event',
    data: {
      title: nameAndMaybePlacement,
      tone,
      periodTitle,
      placement: placement.type === 'none' ? undefined : placement,
      description,
    },
  };
}

/**
 * Parse CREATE SCENE command
 * Format: CREATE SCENE name IN event FIRST|LAST|AFTER item|BEFORE item TONE light|dark QUESTION q ANSWER a DESCRIPTION short
 */
function parseCreateScene(line: string): ParsedCommand {
  const createSceneMatch = /^CREATE\s+SCENE\s+(.+)$/i.exec(line);
  if (!createSceneMatch) return { type: 'none' };

  const rest = createSceneMatch[1];

  // Extract IN keyword and parent event
  const inMatch = /\bIN\s+(.+?)(?:\s+(?:FIRST|LAST|AFTER|BEFORE)\b|\s+TONE\b)/i.exec(rest);
  if (!inMatch) return { type: 'none' };
  const eventTitle = inMatch[1].trim();

  // Extract TONE keyword and value
  const toneMatch = /\bTONE\s+(light|dark)\b/i.exec(rest);
  if (!toneMatch) return { type: 'none' };
  const tone = toneMatch[1].toLowerCase() as 'light' | 'dark';

  // Extract QUESTION keyword and value
  const questionMatch = /\bQUESTION\s+(.+?)\s+ANSWER\b/i.exec(rest);
  if (!questionMatch) return { type: 'none' };
  const question = questionMatch[1].trim();

  // Extract ANSWER keyword and value
  const answerMatch = /\bANSWER\s+(.+?)\s+DESCRIPTION\b/i.exec(rest);
  if (!answerMatch) return { type: 'none' };
  const answer = answerMatch[1].trim();

  // Extract DESCRIPTION keyword and value
  const descMatch = /\bDESCRIPTION\s+(.+)$/i.exec(rest);
  if (!descMatch) return { type: 'none' };
  const description = descMatch[1].trim();

  // Extract name and placement
  const nameMatch = /^(.+?)\s+IN\s+/i.exec(rest);
  if (!nameMatch) return { type: 'none' };
  const nameAndMaybePlacement = nameMatch[1].trim();

  // Extract placement (between event name and TONE)
  const afterIn = rest.substring(rest.toLowerCase().indexOf(' in ') + 4);
  const beforeTone = afterIn.substring(0, afterIn.toLowerCase().indexOf(' tone ')).trim();
  const afterEventName = beforeTone.substring(eventTitle.length).trim();

  const placement = parsePlacement(afterEventName);

  return {
    type: 'create-scene',
    data: {
      title: nameAndMaybePlacement,
      tone,
      eventTitle,
      placement: placement.type === 'none' ? undefined : placement,
      question,
      answer,
      description,
    },
  };
}

/**
 * Parse name and placement from a string like "The Golden Age FIRST" or "War AFTER Peace"
 * Returns the name and placement info
 */
function parseNameAndPlacement(text: string): {
  name: string,
  placement: { type: 'first' | 'last' | 'after' | 'before' | 'none', relativeTo?: string }
} {
  const placement = parsePlacement(text);

  if (placement.type === 'none') {
    return { name: text.trim(), placement };
  }

  // Remove placement text to get name
  let name = text;

  if (placement.type === 'first') {
    name = text.replace(/\s+FIRST$/i, '').trim();
  } else if (placement.type === 'last') {
    name = text.replace(/\s+LAST$/i, '').trim();
  } else if (placement.type === 'after' && placement.relativeTo) {
    const afterRegex = new RegExp(`\\s+AFTER\\s+${escapeRegex(placement.relativeTo)}$`, 'i');
    name = text.replace(afterRegex, '').trim();
  } else if (placement.type === 'before' && placement.relativeTo) {
    const beforeRegex = new RegExp(`\\s+BEFORE\\s+${escapeRegex(placement.relativeTo)}$`, 'i');
    name = text.replace(beforeRegex, '').trim();
  }

  return { name, placement };
}

/**
 * Parse placement keywords from text
 * Supports: FIRST, LAST, AFTER <item>, BEFORE <item>
 */
function parsePlacement(text: string): { type: 'first' | 'last' | 'after' | 'before' | 'none', relativeTo?: string } {
  const trimmed = text.trim();

  // FIRST
  if (/\bFIRST$/i.test(trimmed)) {
    return { type: 'first' };
  }

  // LAST
  if (/\bLAST$/i.test(trimmed)) {
    return { type: 'last' };
  }

  // AFTER <item>
  const afterMatch = /\bAFTER\s+(.+)$/i.exec(trimmed);
  if (afterMatch) {
    return { type: 'after', relativeTo: afterMatch[1].trim() };
  }

  // BEFORE <item>
  const beforeMatch = /\bBEFORE\s+(.+)$/i.exec(trimmed);
  if (beforeMatch) {
    return { type: 'before', relativeTo: beforeMatch[1].trim() };
  }

  return { type: 'none' };
}

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse legacy format commands (backward compatibility)
 *
 * Legacy formats:
 * - create period: Title (light|dark) [after|before PeriodTitle | first] | Description
 * - create start bookend: Title (light|dark) | Summary
 * - create end bookend: Title (light|dark) | Summary
 * - create event: Title (light|dark) in Period Title [placement] | Description
 * - create scene: Question in Event Title
 * - add to palette yes: item
 * - add to palette no: item
 * - edit name: New Name
 * - edit description: New Description
 * - edit tone: light|dark
 */
function parseLegacyFormat(commandLine: string): ParsedCommand {
  // Parse create period command with placement
  // Format: create period: Title (light|dark) [after|before PeriodTitle | first] | Description
  const periodMatch = commandLine.match(/^create period:\s*(.+?)\s*\((light|dark)\)\s+(after|before)\s+(.+?)\s*\|\s*(.+)$/i);
  if (periodMatch) {
    return {
      type: 'create-period',
      data: {
        title: periodMatch[1].trim(),
        tone: periodMatch[2].toLowerCase() as 'light' | 'dark',
        placement: {
          type: periodMatch[3].toLowerCase() as 'after' | 'before',
          relativeTo: periodMatch[4].trim(),
        },
        description: periodMatch[5].trim(),
      },
    };
  }

  // Parse create period command with "first" placement
  const periodFirstMatch = commandLine.match(/^create period:\s*(.+?)\s*\((light|dark)\)\s+first\s*\|\s*(.+)$/i);
  if (periodFirstMatch) {
    return {
      type: 'create-period',
      data: {
        title: periodFirstMatch[1].trim(),
        tone: periodFirstMatch[2].toLowerCase() as 'light' | 'dark',
        placement: {
          type: 'first' as const,
        },
        description: periodFirstMatch[3].trim(),
      },
    };
  }

  // Parse create period command without placement (adds at end)
  // Format: create period: Title (light|dark) | Description
  const periodNoPlacementMatch = commandLine.match(/^create period:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (periodNoPlacementMatch) {
    return {
      type: 'create-period',
      data: {
        title: periodNoPlacementMatch[1].trim(),
        tone: periodNoPlacementMatch[2].toLowerCase() as 'light' | 'dark',
        placement: undefined, // Will be handled by adding at the end
        description: periodNoPlacementMatch[3].trim(),
      },
    };
  }

  // Parse create start bookend command
  const startBookendMatch = commandLine.match(/^create start bookend:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (startBookendMatch) {
    return {
      type: 'create-start-bookend',
      data: {
        title: startBookendMatch[1].trim(),
        tone: startBookendMatch[2].toLowerCase() as 'light' | 'dark',
        description: startBookendMatch[3].trim(),
      },
    };
  }

  // Parse create end bookend command
  const endBookendMatch = commandLine.match(/^create end bookend:\s*(.+?)\s*\((light|dark)\)\s*\|\s*(.+)$/i);
  if (endBookendMatch) {
    return {
      type: 'create-end-bookend',
      data: {
        title: endBookendMatch[1].trim(),
        tone: endBookendMatch[2].toLowerCase() as 'light' | 'dark',
        description: endBookendMatch[3].trim(),
      },
    };
  }

  // Parse create event command with description
  // Format: create event: Title (light|dark) in PeriodTitle | Description
  const eventMatch = commandLine.match(/^create event:\s*(.+?)\s*\((light|dark)\)\s*in\s+(.+?)\s*\|\s*(.+)$/i);
  if (eventMatch) {
    return {
      type: 'create-event',
      data: {
        title: eventMatch[1].trim(),
        tone: eventMatch[2].toLowerCase() as 'light' | 'dark',
        periodTitle: eventMatch[3].trim(),
        description: eventMatch[4].trim(),
      },
    };
  }

  // Parse create event command without description (backward compatibility)
  const eventMatchNoDesc = commandLine.match(/^create event:\s*(.+?)\s*\((light|dark)\)\s*in\s+(.+)$/i);
  if (eventMatchNoDesc) {
    return {
      type: 'create-event',
      data: {
        title: eventMatchNoDesc[1].trim(),
        tone: eventMatchNoDesc[2].toLowerCase() as 'light' | 'dark',
        periodTitle: eventMatchNoDesc[3].trim(),
        description: '',
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
