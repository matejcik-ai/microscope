/**
 * Tests for command parser
 * Run with: npx tsx lib/microscope/command-parser.test.ts
 */

import { parseAIResponse } from './command-parser';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error}`);
    process.exit(1);
  }
}

function assertEquals(actual: any, expected: any, message?: string) {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);
  if (actualStr !== expectedStr) {
    throw new Error(
      `${message || 'Assertion failed'}\nExpected:\n${expectedStr}\n\nActual:\n${actualStr}`
    );
  }
}

console.log('\n🧪 Running Command Parser Tests\n');

// Test 1: Legacy single command - create period
test('Legacy: create period on first line', () => {
  const result = parseAIResponse(
    'create period: The Golden Age (light) | A time of prosperity\nThis was a great era.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Golden Age');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'A time of prosperity');
  assertEquals(result.remainingMessage, 'This was a great era.');
});

// Test 2: Hash command - create start bookend
test('Hash command: create start bookend', () => {
  const result = parseAIResponse(
    '# create start bookend: The First Dawn (light) | When it all began\n\nI\'ve created the starting point!'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The First Dawn');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'When it all began');
  assertEquals(result.remainingMessage, 'I\'ve created the starting point!');
});

// Test 3: Hash command - create end bookend
test('Hash command: create end bookend', () => {
  const result = parseAIResponse(
    '# create end bookend: The Final Night (dark) | When everything ends'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-end-bookend');
  assertEquals(result.commands[0].data.title, 'The Final Night');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'When everything ends');
});

// Test 4: Multiple commands - both bookends
test('Multiple commands: create both bookends', () => {
  const result = parseAIResponse(
    '# create start bookend: The First Dawn (light) | Beginning of time\n# create end bookend: The Last Eclipse (dark) | End of all things\n\nBoth bookends are set!'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The First Dawn');
  assertEquals(result.commands[1].type, 'create-end-bookend');
  assertEquals(result.commands[1].data.title, 'The Last Eclipse');
  assertEquals(result.remainingMessage, 'Both bookends are set!');
});

// Test 5: Create event
test('Hash command: create event', () => {
  const result = parseAIResponse(
    '# create event: The Great War (dark) in The Middle Ages'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Great War');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.periodTitle, 'The Middle Ages');
});

// Test 6: Create scene
test('Hash command: create scene', () => {
  const result = parseAIResponse(
    '# create scene: What caused the final battle? in The Great War'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.question, 'What caused the final battle?');
  assertEquals(result.commands[0].data.eventTitle, 'The Great War');
});

// Test 7: Add to palette - multiple items
test('Multiple palette additions', () => {
  const result = parseAIResponse(
    '# add to palette yes: Magic\n# add to palette yes: Dragons\n# add to palette no: Technology\n# add to palette no: Time travel'
  );

  assertEquals(result.commands.length, 4);
  assertEquals(result.commands[0].type, 'add-palette');
  assertEquals(result.commands[0].data.category, 'yes');
  assertEquals(result.commands[0].data.item, 'Magic');
  assertEquals(result.commands[2].type, 'add-palette');
  assertEquals(result.commands[2].data.category, 'no');
  assertEquals(result.commands[2].data.item, 'Technology');
});

// Test 8: Edit name
test('Edit command: name', () => {
  const result = parseAIResponse(
    '# edit name: The Golden Façade\n\nI\'ve updated the name to better reflect the complexity.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-name');
  assertEquals(result.commands[0].data.newName, 'The Golden Façade');
});

// Test 9: Edit description
test('Edit command: description', () => {
  const result = parseAIResponse(
    '# edit description: An era marked by hidden tensions and power struggles'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-description');
  assertEquals(result.commands[0].data.newDescription, 'An era marked by hidden tensions and power struggles');
});

// Test 10: Edit tone
test('Edit command: tone to dark', () => {
  const result = parseAIResponse('# edit tone: dark');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-tone');
  assertEquals(result.commands[0].data.newTone, 'dark');
});

test('Edit command: tone to light', () => {
  const result = parseAIResponse('# edit tone: light');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-tone');
  assertEquals(result.commands[0].data.newTone, 'light');
});

// Test 11: No commands - plain message
test('No commands: plain message', () => {
  const result = parseAIResponse('This is just a regular message with no commands.');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
  assertEquals(result.remainingMessage, 'This is just a regular message with no commands.');
});

// Test 12: Mixed content with commands
test('Mixed content: commands interspersed with text', () => {
  const result = parseAIResponse(
    'Let me set up the timeline:\n\n# create start bookend: The Beginning (light) | When time started\n# create end bookend: The End (dark) | When time stops\n\nAnd add some themes:\n\n# add to palette yes: Epic battles\n# add to palette no: Romance\n\nThere we go!'
  );

  assertEquals(result.commands.length, 4);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[1].type, 'create-end-bookend');
  assertEquals(result.commands[2].type, 'add-palette');
  assertEquals(result.commands[3].type, 'add-palette');

  // Non-command text should be preserved
  const expectedText = 'Let me set up the timeline:\n\n\nAnd add some themes:\n\n\nThere we go!';
  assertEquals(result.remainingMessage, expectedText);
});

// Test 13: Case insensitivity
test('Case insensitivity: commands work in any case', () => {
  const result = parseAIResponse('# CREATE PERIOD: Test (LIGHT) | Testing case');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.tone, 'light'); // Should be normalized to lowercase
});

// Test 14: Complex titles and descriptions
test('Complex content: special characters in titles', () => {
  const result = parseAIResponse(
    '# create period: The Age of "Enlightenment" (light) | A time of questioning & discovery'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Age of "Enlightenment"');
  assertEquals(result.commands[0].data.description, 'A time of questioning & discovery');
});

// Test 15: Empty lines between commands
test('Empty lines: commands separated by blank lines', () => {
  const result = parseAIResponse(
    '# create start bookend: Start (light) | The beginning\n\n\n# create end bookend: End (dark) | The finale'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[1].type, 'create-end-bookend');
});

// Test 16: Multiple edits in one response
test('Multiple edits: name and description together', () => {
  const result = parseAIResponse(
    '# edit name: The Dark Times\n# edit description: An era of suffering and loss\n# edit tone: dark\n\nI\'ve updated everything to match our discussion.'
  );

  assertEquals(result.commands.length, 3);
  assertEquals(result.commands[0].type, 'edit-name');
  assertEquals(result.commands[1].type, 'edit-description');
  assertEquals(result.commands[2].type, 'edit-tone');
});

// Test 17: Legacy command with hash elsewhere
test('Legacy mode: first line without hash, hash appears elsewhere', () => {
  const result = parseAIResponse(
    'create period: Old Style (light) | Using old syntax\nThis has a # symbol in text but not as command.'
  );

  // Should use legacy mode since first line doesn't have #
  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.remainingMessage?.includes('#'), true);
});

// Test 18: Invalid command format
test('Invalid command: malformed syntax ignored', () => {
  const result = parseAIResponse(
    '# create period Missing Parentheses | No tone specified\n\nThis command is invalid.'
  );

  // Invalid command should be ignored, treated as text
  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

console.log('\n✅ All tests passed!\n');
