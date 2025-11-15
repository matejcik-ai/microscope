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

// ============================================================================
// SPEC FORMAT TESTS - New primary syntax
// ============================================================================

console.log('--- Spec Format: CREATE PERIOD Tests ---\n');

test('Spec: CREATE PERIOD with FIRST placement (becomes start bookend)', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Golden Age FIRST TONE light DESCRIPTION A time of prosperity and growth'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The Golden Age');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'A time of prosperity and growth');
});

test('Spec: CREATE PERIOD with LAST placement (becomes end bookend)', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Dark Ages LAST TONE dark DESCRIPTION An era of decline and chaos'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-end-bookend');
  assertEquals(result.commands[0].data.title, 'The Dark Ages');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'An era of decline and chaos');
});

test('Spec: CREATE PERIOD with AFTER placement', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Renaissance AFTER The Dark Ages TONE light DESCRIPTION A period of rebirth'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Renaissance');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'A period of rebirth');
  assertEquals(result.commands[0].data.placement, {
    type: 'after',
    relativeTo: 'The Dark Ages'
  });
});

test('Spec: CREATE PERIOD with BEFORE placement', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Age of Discovery BEFORE The Industrial Revolution TONE light DESCRIPTION Exploration and innovation'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Age of Discovery');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'Exploration and innovation');
  assertEquals(result.commands[0].data.placement, {
    type: 'before',
    relativeTo: 'The Industrial Revolution'
  });
});

test('Spec: CREATE PERIOD without placement', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Modern Era TONE dark DESCRIPTION Contemporary times full of uncertainty'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Modern Era');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'Contemporary times full of uncertainty');
  assertEquals(result.commands[0].data.placement, undefined);
});

console.log('\n--- Spec Format: Bookend Detection Tests ---\n');

test('Spec: CREATE PERIOD FIRST becomes start bookend', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The First Dawn FIRST TONE light DESCRIPTION When the world began'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The First Dawn');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'When the world began');
});

test('Spec: CREATE PERIOD LAST becomes end bookend', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Final Night LAST TONE dark DESCRIPTION When everything ends'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-end-bookend');
  assertEquals(result.commands[0].data.title, 'The Final Night');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'When everything ends');
});

console.log('\n--- Spec Format: CREATE EVENT Tests ---\n');

test('Spec: CREATE EVENT basic', () => {
  const result = parseAIResponse(
    'CREATE EVENT The Great War IN The Middle Ages TONE dark DESCRIPTION A devastating conflict'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Great War');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.periodTitle, 'The Middle Ages');
  assertEquals(result.commands[0].data.description, 'A devastating conflict');
  assertEquals(result.commands[0].data.placement, undefined);
});

test('Spec: CREATE EVENT with FIRST placement', () => {
  const result = parseAIResponse(
    'CREATE EVENT The Dawn of Magic IN The Age of Wonders FIRST TONE light DESCRIPTION The first spell is cast'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Dawn of Magic');
  assertEquals(result.commands[0].data.periodTitle, 'The Age of Wonders');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'The first spell is cast');
  assertEquals(result.commands[0].data.placement, {
    type: 'first'
  });
});

test('Spec: CREATE EVENT with AFTER placement', () => {
  const result = parseAIResponse(
    'CREATE EVENT The Final Battle IN The Great War AFTER The Siege TONE dark DESCRIPTION The climactic confrontation'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Final Battle');
  assertEquals(result.commands[0].data.periodTitle, 'The Great War');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'The climactic confrontation');
  assertEquals(result.commands[0].data.placement, {
    type: 'after',
    relativeTo: 'The Siege'
  });
});

test('Spec: CREATE EVENT with BEFORE placement', () => {
  const result = parseAIResponse(
    'CREATE EVENT The Gathering Storm IN The Age of Peace BEFORE The Great War TONE dark DESCRIPTION Warning signs ignored'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Gathering Storm');
  assertEquals(result.commands[0].data.periodTitle, 'The Age of Peace');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'Warning signs ignored');
  assertEquals(result.commands[0].data.placement, {
    type: 'before',
    relativeTo: 'The Great War'
  });
});

test('Spec: CREATE EVENT with LAST placement', () => {
  const result = parseAIResponse(
    'CREATE EVENT The Treaty Signed IN The Great War LAST TONE light DESCRIPTION Peace is finally achieved'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Treaty Signed');
  assertEquals(result.commands[0].data.periodTitle, 'The Great War');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'Peace is finally achieved');
  assertEquals(result.commands[0].data.placement, {
    type: 'last'
  });
});

console.log('\n--- Spec Format: CREATE SCENE Tests ---\n');

test('Spec: CREATE SCENE with QUESTION and ANSWER', () => {
  const result = parseAIResponse(
    'CREATE SCENE The Betrayal IN The Final Battle TONE dark QUESTION Who turned against the king? ANSWER His most trusted advisor DESCRIPTION A shocking revelation'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.title, 'The Betrayal');
  assertEquals(result.commands[0].data.eventTitle, 'The Final Battle');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.question, 'Who turned against the king?');
  assertEquals(result.commands[0].data.answer, 'His most trusted advisor');
  assertEquals(result.commands[0].data.description, 'A shocking revelation');
  assertEquals(result.commands[0].data.placement, undefined);
});

test('Spec: CREATE SCENE with placement FIRST', () => {
  const result = parseAIResponse(
    'CREATE SCENE Opening Salvo IN The Great War FIRST TONE dark QUESTION How did the war begin? ANSWER With an unexpected attack at dawn DESCRIPTION The conflict ignites'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.title, 'Opening Salvo');
  assertEquals(result.commands[0].data.eventTitle, 'The Great War');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.question, 'How did the war begin?');
  assertEquals(result.commands[0].data.answer, 'With an unexpected attack at dawn');
  assertEquals(result.commands[0].data.description, 'The conflict ignites');
  assertEquals(result.commands[0].data.placement, {
    type: 'first'
  });
});

test('Spec: CREATE SCENE with placement AFTER', () => {
  const result = parseAIResponse(
    'CREATE SCENE The Discovery IN The Investigation AFTER The Murder TONE dark QUESTION What did the detective find? ANSWER A hidden letter revealing the truth DESCRIPTION The case breaks open'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.title, 'The Discovery');
  assertEquals(result.commands[0].data.eventTitle, 'The Investigation');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.question, 'What did the detective find?');
  assertEquals(result.commands[0].data.answer, 'A hidden letter revealing the truth');
  assertEquals(result.commands[0].data.description, 'The case breaks open');
  assertEquals(result.commands[0].data.placement, {
    type: 'after',
    relativeTo: 'The Murder'
  });
});

console.log('\n--- Spec Format: Expanded Descriptions ---\n');

test('Spec: Expanded description with blank line separator', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Golden Age FIRST TONE light DESCRIPTION A time of prosperity\n\nThis was an era of unparalleled growth and innovation. Cities flourished, art and science advanced, and people lived in relative peace and abundance.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The Golden Age');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'A time of prosperity');
  assertEquals(
    result.commands[0].data.expandedDescription,
    'This was an era of unparalleled growth and innovation. Cities flourished, art and science advanced, and people lived in relative peace and abundance.'
  );
});

test('Spec: Multiple commands with expanded descriptions', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Age of Heroes FIRST TONE light DESCRIPTION When legends walked the earth\n\nThis was a time of great champions and mythical deeds.\n\nCREATE PERIOD The Dark Times LAST TONE dark DESCRIPTION When hope was lost\n\nThe world fell into shadow and despair reigned supreme.'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The Age of Heroes');
  assertEquals(result.commands[0].data.description, 'When legends walked the earth');
  assertEquals(
    result.commands[0].data.expandedDescription,
    'This was a time of great champions and mythical deeds.'
  );

  assertEquals(result.commands[1].type, 'create-end-bookend');
  assertEquals(result.commands[1].data.title, 'The Dark Times');
  assertEquals(result.commands[1].data.description, 'When hope was lost');
  assertEquals(
    result.commands[1].data.expandedDescription,
    'The world fell into shadow and despair reigned supreme.'
  );
});

test('Spec: Command without expanded description', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Middle Years TONE light DESCRIPTION A transitional period\n\nSome additional commentary that is not a command.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Middle Years');
  assertEquals(result.commands[0].data.description, 'A transitional period');
  assertEquals(
    result.commands[0].data.expandedDescription,
    'Some additional commentary that is not a command.'
  );
});

console.log('\n--- Spec Format: Case Insensitivity ---\n');

test('Spec: Lowercase commands work', () => {
  const result = parseAIResponse(
    'create period The Test FIRST tone light description Testing lowercase'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.tone, 'light');
});

test('Spec: Mixed case commands work', () => {
  const result = parseAIResponse(
    'CrEaTe EvEnT Test Event iN Test Period ToNe DaRk DeScRiPtIoN Mixed case test'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.tone, 'dark');
});

console.log('\n--- Spec Format: Edge Cases ---\n');

test('Spec: Period name with special characters', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Age of "Enlightenment" & Discovery FIRST TONE light DESCRIPTION A time of questioning & growth'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The Age of "Enlightenment" & Discovery');
  assertEquals(result.commands[0].data.description, 'A time of questioning & growth');
});

test('Spec: AFTER/BEFORE with multi-word reference', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The New Age AFTER The Long Dark Winter TONE light DESCRIPTION Spring arrives'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.placement, {
    type: 'after',
    relativeTo: 'The Long Dark Winter'
  });
});

test('Spec: Scene with complex question and answer', () => {
  const result = parseAIResponse(
    'CREATE SCENE Revelation IN The Trial TONE dark QUESTION Why did she confess to a crime she didn\'t commit? ANSWER To protect her daughter from the real killer DESCRIPTION A mother\'s sacrifice'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.question, 'Why did she confess to a crime she didn\'t commit?');
  assertEquals(result.commands[0].data.answer, 'To protect her daughter from the real killer');
});

console.log('\n--- Spec Format: Invalid Commands ---\n');

test('Spec: Missing TONE keyword', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Test FIRST light DESCRIPTION Missing tone keyword'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

test('Spec: Missing DESCRIPTION keyword', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Test FIRST TONE light no keyword here'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

test('Spec: Invalid tone value', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Test FIRST TONE neutral DESCRIPTION Invalid tone'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

test('Spec: Missing IN keyword for event', () => {
  const result = parseAIResponse(
    'CREATE EVENT Test Event TONE dark DESCRIPTION Missing IN keyword'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

test('Spec: Missing QUESTION for scene', () => {
  const result = parseAIResponse(
    'CREATE SCENE Test IN Event TONE dark ANSWER Missing question DESCRIPTION Invalid'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

test('Spec: Missing ANSWER for scene', () => {
  const result = parseAIResponse(
    'CREATE SCENE Test IN Event TONE dark QUESTION What? DESCRIPTION Missing answer'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
});

// ============================================================================
// BACKWARD COMPATIBILITY TESTS - Legacy format
// ============================================================================

console.log('\n--- Legacy Format: Backward Compatibility ---\n');

test('Legacy: create period with hash', () => {
  const result = parseAIResponse(
    '# create period: The Golden Age (light) | A time of prosperity'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'The Golden Age');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'A time of prosperity');
});

test('Legacy: create start bookend', () => {
  const result = parseAIResponse(
    '# create start bookend: The First Dawn (light) | When it all began'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'The First Dawn');
  assertEquals(result.commands[0].data.tone, 'light');
  assertEquals(result.commands[0].data.description, 'When it all began');
});

test('Legacy: create end bookend', () => {
  const result = parseAIResponse(
    '# create end bookend: The Final Night (dark) | When everything ends'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-end-bookend');
  assertEquals(result.commands[0].data.title, 'The Final Night');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.description, 'When everything ends');
});

test('Legacy: create event', () => {
  const result = parseAIResponse(
    '# create event: The Great War (dark) in The Middle Ages | A devastating conflict'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.title, 'The Great War');
  assertEquals(result.commands[0].data.tone, 'dark');
  assertEquals(result.commands[0].data.periodTitle, 'The Middle Ages');
  assertEquals(result.commands[0].data.description, 'A devastating conflict');
});

test('Legacy: create scene', () => {
  const result = parseAIResponse(
    '# create scene: What caused the final battle? in The Great War'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.question, 'What caused the final battle?');
  assertEquals(result.commands[0].data.eventTitle, 'The Great War');
});

test('Legacy: add to palette', () => {
  const result = parseAIResponse(
    '# add to palette yes: Magic\n\n# add to palette no: Technology'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'add-palette');
  assertEquals(result.commands[0].data.category, 'yes');
  assertEquals(result.commands[0].data.item, 'Magic');
  assertEquals(result.commands[1].type, 'add-palette');
  assertEquals(result.commands[1].data.category, 'no');
  assertEquals(result.commands[1].data.item, 'Technology');
});

test('Legacy: edit name', () => {
  const result = parseAIResponse('# edit name: New Name');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-name');
  assertEquals(result.commands[0].data.newName, 'New Name');
});

test('Legacy: edit description', () => {
  const result = parseAIResponse('# edit description: New description text');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-description');
  assertEquals(result.commands[0].data.newDescription, 'New description text');
});

test('Legacy: edit tone', () => {
  const result = parseAIResponse('# edit tone: dark');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'edit-tone');
  assertEquals(result.commands[0].data.newTone, 'dark');
});

test('Legacy: period with after placement', () => {
  const result = parseAIResponse(
    '# create period: New Era (light) after Old Era | A fresh start'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'New Era');
  assertEquals(result.commands[0].data.placement, {
    type: 'after',
    relativeTo: 'Old Era'
  });
});

test('Legacy: period with before placement', () => {
  const result = parseAIResponse(
    '# create period: Pre-War (dark) before The War | Tensions rising'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'Pre-War');
  assertEquals(result.commands[0].data.placement, {
    type: 'before',
    relativeTo: 'The War'
  });
});

test('Legacy: period with first placement', () => {
  const result = parseAIResponse(
    '# create period: Dawn (light) first | The beginning'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-period');
  assertEquals(result.commands[0].data.title, 'Dawn');
  assertEquals(result.commands[0].data.placement, {
    type: 'first'
  });
});

// ============================================================================
// GENERAL TESTS - Format-agnostic
// ============================================================================

console.log('\n--- General Tests ---\n');

test('No commands: plain message', () => {
  const result = parseAIResponse('This is just a regular message with no commands.');

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'none');
  assertEquals(result.remainingMessage, 'This is just a regular message with no commands.');
});

test('Mixed content: commands with chat messages', () => {
  const result = parseAIResponse(
    'Let me create the timeline for you.\n\nCREATE PERIOD The Beginning FIRST TONE light DESCRIPTION The start\n\nCREATE PERIOD The End LAST TONE dark DESCRIPTION The finish\n\nAll done!'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[1].type, 'create-end-bookend');
  // "All done!" becomes expanded description of the second command
  assertEquals(result.commands[1].data.expandedDescription, 'All done!');
  assertEquals(result.remainingMessage, 'Let me create the timeline for you.');
});

test('Multiple blank lines between commands', () => {
  const result = parseAIResponse(
    'CREATE PERIOD First FIRST TONE light DESCRIPTION One\n\n\n\nCREATE PERIOD Second LAST TONE dark DESCRIPTION Two'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[1].type, 'create-end-bookend');
});

test('Commands with surrounding whitespace', () => {
  const result = parseAIResponse(
    '  CREATE PERIOD Test FIRST TONE light DESCRIPTION Test  \n\n  Some text  '
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  // "Some text" becomes expanded description due to blank line separator
  assertEquals(result.commands[0].data.expandedDescription, 'Some text');
});

console.log('\n--- Additional Edge Case Tests ---\n');

test('Multiple scenes with different placements', () => {
  const result = parseAIResponse(
    'CREATE SCENE Opening IN Battle FIRST TONE dark QUESTION How did it start? ANSWER Unexpectedly DESCRIPTION The beginning\n\nCREATE SCENE Climax IN Battle AFTER Opening TONE dark QUESTION What happened next? ANSWER The heroes arrived DESCRIPTION The turning point'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.placement, { type: 'first' });
  assertEquals(result.commands[1].type, 'create-scene');
  assertEquals(result.commands[1].data.placement, { type: 'after', relativeTo: 'Opening' });
});

test('Mixed item types in single response', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Ancient Times FIRST TONE light DESCRIPTION The dawn of civilization\n\nCREATE EVENT The First City IN Ancient Times FIRST TONE light DESCRIPTION Settlement begins\n\nCREATE SCENE The Foundation IN The First City FIRST TONE light QUESTION Who laid the first stone? ANSWER The wise elder DESCRIPTION A momentous occasion'
  );

  assertEquals(result.commands.length, 3);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[1].type, 'create-event');
  assertEquals(result.commands[2].type, 'create-scene');
});

test('Scene with BEFORE and LAST placements', () => {
  const result = parseAIResponse(
    'CREATE SCENE Preparation IN Battle BEFORE The Charge TONE light QUESTION What did they plan? ANSWER A clever strategy DESCRIPTION Strategic planning'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.placement, { type: 'before', relativeTo: 'The Charge' });
});

test('Scene with LAST placement', () => {
  const result = parseAIResponse(
    'CREATE SCENE Aftermath IN Battle LAST TONE dark QUESTION What was the cost? ANSWER Too many lives DESCRIPTION The price of victory'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.placement, { type: 'last' });
});

test('Command with multi-line expanded description (single block)', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Golden Era FIRST TONE light DESCRIPTION A time of wonder\n\nThis was truly remarkable. Cities of gold rose from the earth.\nPeople lived in harmony. Science and magic coexisted.\nIt was paradise.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(
    result.commands[0].data.expandedDescription,
    'This was truly remarkable. Cities of gold rose from the earth.\nPeople lived in harmony. Science and magic coexisted.\nIt was paradise.'
  );
});

test('Command with single paragraph expanded description', () => {
  const result = parseAIResponse(
    'CREATE PERIOD The Golden Era FIRST TONE light DESCRIPTION A time of wonder\n\nThis was truly remarkable. Cities of gold rose from the earth.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(
    result.commands[0].data.expandedDescription,
    'This was truly remarkable. Cities of gold rose from the earth.'
  );
});

test('Expanded description that looks like a command but is not', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Test FIRST TONE light DESCRIPTION Brief\n\nTo create a period, you need to think carefully about the tone and description.'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(
    result.commands[0].data.expandedDescription,
    'To create a period, you need to think carefully about the tone and description.'
  );
});

test('Event with complex period name containing keywords', () => {
  const result = parseAIResponse(
    'CREATE EVENT The Great Discovery IN The Age of Light and Dark TONE light DESCRIPTION A breakthrough'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-event');
  assertEquals(result.commands[0].data.periodTitle, 'The Age of Light and Dark');
});

test('Scene with question containing special characters', () => {
  const result = parseAIResponse(
    'CREATE SCENE Mystery IN Investigation TONE dark QUESTION What secret lies in the vault? ANSWER A map to hidden treasure DESCRIPTION Uncovering clues'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.question, 'What secret lies in the vault?');
  assertEquals(result.commands[0].data.answer, 'A map to hidden treasure');
});

test('Period name with numbers and punctuation', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Year 2045: The Awakening FIRST TONE dark DESCRIPTION When AI achieved consciousness!'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'Year 2045: The Awakening');
  assertEquals(result.commands[0].data.description, 'When AI achieved consciousness!');
});

test('Empty expanded description block is not added', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Test FIRST TONE light DESCRIPTION Brief\n\n\n\nCREATE PERIOD Test2 LAST TONE dark DESCRIPTION Also brief'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].data.expandedDescription, undefined);
  assertEquals(result.commands[1].data.expandedDescription, undefined);
});

test('Legacy and spec formats mixed in same response', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Modern FIRST TONE light DESCRIPTION New format\n\n# create period: Legacy (dark) | Old format'
  );

  assertEquals(result.commands.length, 2);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'Modern');
  assertEquals(result.commands[1].type, 'create-period');
  assertEquals(result.commands[1].data.title, 'Legacy');
});

test('Very long titles and descriptions', () => {
  const longTitle = 'The Extraordinarily Long and Complicated Period Name That Goes On and On';
  const longDesc = 'This is a very detailed description that contains many words and explains the situation in great depth with numerous clauses and subclauses';

  const result = parseAIResponse(
    `CREATE PERIOD ${longTitle} FIRST TONE light DESCRIPTION ${longDesc}`
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, longTitle);
  assertEquals(result.commands[0].data.description, longDesc);
});

test('Commands without # prefix (spec format)', () => {
  const result = parseAIResponse(
    'CREATE PERIOD Test FIRST TONE light DESCRIPTION No hash needed'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-start-bookend');
  assertEquals(result.commands[0].data.title, 'Test');
});

test('Spec: CREATE SCENE without placement', () => {
  const result = parseAIResponse(
    'CREATE SCENE Discovery IN The Quest TONE light QUESTION What was found? ANSWER Ancient treasure DESCRIPTION The finding'
  );

  assertEquals(result.commands.length, 1);
  assertEquals(result.commands[0].type, 'create-scene');
  assertEquals(result.commands[0].data.placement, undefined);
});

console.log('\n✅ All tests passed!\n');
