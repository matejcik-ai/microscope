/**
 * Test Fixtures: AI Response Vectors
 *
 * Contains example human requests and corresponding AI responses
 * for testing without calling the live Claude API.
 */

export interface TestScenario {
  name: string;
  humanMessage: string;
  aiResponse: string;
  expectedCommands?: string[];
}

/**
 * Setup Phase Scenarios
 */
export const setupPhaseScenarios: TestScenario[] = [
  {
    name: 'Create start bookend',
    humanMessage: 'Create a start bookend called Ancient Times',
    aiResponse: `I'll create the start bookend for our history.

CREATE PERIOD Ancient Times FIRST TONE light DESCRIPTION The dawn of civilization

This period marks the beginning of our story, when humanity first began to organize into societies and develop early technologies.`,
    expectedCommands: ['create-start-bookend'],
  },
  {
    name: 'Create end bookend',
    humanMessage: 'Create an end bookend called The Final Days',
    aiResponse: `I'll create the end bookend.

CREATE PERIOD The Final Days LAST TONE dark DESCRIPTION When everything comes to an end

This marks the conclusion of our timeline, a period of uncertainty and finality.`,
    expectedCommands: ['create-end-bookend'],
  },
  {
    name: 'Update existing start bookend',
    humanMessage: 'Actually, change the start to Modern Era instead',
    aiResponse: `I'll update the start bookend.

CREATE PERIOD Modern Era FIRST TONE dark DESCRIPTION The contemporary age

This revision moves our starting point to the modern era, where technology and globalization define human experience.`,
    expectedCommands: ['create-start-bookend'],
  },
  {
    name: 'Add palette items',
    humanMessage: 'Add magic to the yes list and technology to the no list',
    aiResponse: `I'll add those to the palette.

# add to palette yes: Magic
# add to palette no: Technology

These palette items will help guide what belongs in our story.`,
    expectedCommands: ['add-palette', 'add-palette'],
  },
];

/**
 * Initial Round Scenarios
 */
export const initialRoundScenarios: TestScenario[] = [
  {
    name: 'Create first period',
    humanMessage: 'Create a period called The Age of Discovery',
    aiResponse: `I'll create that period.

CREATE PERIOD The Age of Discovery TONE light DESCRIPTION An era of exploration and innovation

During this time, humanity ventured into unknown territories, both geographical and intellectual. Great discoveries were made that would shape the future.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'Create period with placement',
    humanMessage: 'Create a period called The Dark Ages before The Age of Discovery',
    aiResponse: `CREATE PERIOD The Dark Ages BEFORE The Age of Discovery TONE dark DESCRIPTION A time of struggle and decline

Following the collapse of great civilizations, this period saw widespread hardship and the loss of much knowledge.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'Create event in period',
    humanMessage: 'Create an event called The Great Voyage in The Age of Discovery',
    aiResponse: `CREATE EVENT The Great Voyage IN The Age of Discovery TONE light DESCRIPTION A legendary journey across unknown seas

This expedition opened new trade routes and forever changed our understanding of the world.`,
    expectedCommands: ['create-event'],
  },
  {
    name: 'Create scene in event',
    humanMessage: 'Create a scene in The Great Voyage asking what they found',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE light QUESTION What did the explorers find in the new lands? ANSWER A thriving civilization with advanced agriculture DESCRIPTION An unexpected encounter

The explorers were amazed to find not an empty wilderness, but a sophisticated society that had developed independently.`,
    expectedCommands: ['create-scene'],
  },
];

/**
 * Playing Phase Scenarios
 */
export const playingPhaseScenarios: TestScenario[] = [
  {
    name: 'Nested period creation',
    humanMessage: 'Create a period called The Industrial Revolution after The Age of Discovery',
    aiResponse: `CREATE PERIOD The Industrial Revolution AFTER The Age of Discovery TONE light DESCRIPTION The age of machines and mass production

Steam power and mechanization transformed society, bringing both prosperity and new challenges.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'Event with complex placement',
    humanMessage: 'Add an event called The Great Strike in The Industrial Revolution, place it first',
    aiResponse: `CREATE EVENT The Great Strike IN The Industrial Revolution FIRST TONE dark DESCRIPTION Workers unite against harsh conditions

This event marked a turning point in labor relations, as workers organized to demand better treatment and fair wages.`,
    expectedCommands: ['create-event'],
  },
  {
    name: 'Multiple items in one response',
    humanMessage: 'Create a new period called The Space Age, then add an event called First Contact',
    aiResponse: `I'll create both items for you.

CREATE PERIOD The Space Age TONE light DESCRIPTION Humanity reaches for the stars

An era of unprecedented technological advancement allowed humans to leave their home planet.

CREATE EVENT First Contact IN The Space Age TONE light DESCRIPTION Humanity meets alien intelligence

This momentous event changed our understanding of our place in the universe forever.`,
    expectedCommands: ['create-period', 'create-event'],
  },
];

/**
 * Item Creation Scenarios (Issue #11)
 *
 * Tests for regular period/event/scene creation with expanded descriptions.
 * Verifies:
 * - System message appears in meta chat
 * - Message has clickable link
 * - Expanded description goes to item conversation
 * - Expanded description NOT in meta chat
 */
export const itemCreationScenarios: TestScenario[] = [
  {
    name: 'Create regular period with expanded description',
    humanMessage: 'Create a new period about the Golden Age',
    aiResponse: `I'll create that period for you.

CREATE PERIOD The Golden Ascendancy TONE light DESCRIPTION The empire reaches its zenith

This was a time of unprecedented prosperity and artistic achievement. The capital city became a wonder of the world, drawing scholars and merchants from distant lands. Future generations would remember this era with longing and nostalgia.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'Create event with expanded description',
    humanMessage: 'Add an event to The Golden Ascendancy',
    aiResponse: `I'll create that event.

CREATE EVENT The Grand Exhibition IN The Golden Ascendancy TONE light DESCRIPTION A magnificent showcase of imperial achievements

The emperor commissioned the greatest exhibition the world had ever seen. Artisans, inventors, and scholars from across the empire displayed their finest works in the capital's central plaza. The event lasted for three months and attracted visitors from neighboring kingdoms.`,
    expectedCommands: ['create-event'],
  },
  {
    name: 'Create scene with expanded description',
    humanMessage: 'Create a scene in The Grand Exhibition',
    aiResponse: `I'll create that scene.

CREATE SCENE The Opening Ceremony IN The Grand Exhibition TONE light QUESTION How did the emperor open the exhibition? ANSWER With a speech celebrating unity and progress DESCRIPTION A momentous occasion

The emperor stood before thousands of gathered citizens. His voice rang out across the plaza as he spoke of the empire's achievements and its bright future. The crowd erupted in cheers when he declared the exhibition open, and doves were released into the sky.`,
    expectedCommands: ['create-scene'],
  },
  {
    name: 'Create multiple items in single response',
    humanMessage: 'Create two new periods',
    aiResponse: `I'll create both periods.

CREATE PERIOD The Age of Conflict TONE dark DESCRIPTION Wars and strife tear the empire apart

The prosperity of the Golden Age bred complacency and greed. Noble houses turned against each other in devastating conflicts that would last for generations.

CREATE PERIOD The Rebuilding TONE light DESCRIPTION Slowly piecing the empire back together

After decades of war, the survivors sought to rebuild what was lost. It would be a long and difficult journey, but hope remained.`,
    expectedCommands: ['create-period', 'create-period'],
  },
  {
    name: 'Create item with multi-paragraph expanded description',
    humanMessage: 'Create a period with a detailed description',
    aiResponse: `CREATE PERIOD The Renaissance TONE light DESCRIPTION A rebirth of art and learning

This was an extraordinary period of cultural flowering. Artists developed new techniques that brought unprecedented realism to their work. Perspective, chiaroscuro, and sfumato became standard tools of the painter's craft.

Meanwhile, scholars rediscovered ancient texts that had been lost for centuries. Libraries grew as knowledge was carefully copied and preserved. The printing press revolutionized the spread of ideas.

Trade flourished as merchant families grew wealthy. They became patrons of the arts, commissioning great works that still inspire us today. The very concept of the "Renaissance man" - someone learned in many fields - emerged during this era.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'Create item with placement AFTER',
    humanMessage: 'Create a new period after The Golden Ascendancy',
    aiResponse: `CREATE PERIOD The Silver Twilight AFTER The Golden Ascendancy TONE dark DESCRIPTION The beginning of decline

While the empire still appeared strong on the surface, cracks were forming in its foundation. The seeds of future troubles were being sown during this transitional era.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'Create item with placement BEFORE',
    humanMessage: 'Create a period before The Golden Ascendancy',
    aiResponse: `CREATE PERIOD The Founding Pact BEFORE The Golden Ascendancy TONE light DESCRIPTION When the empire was forged

Warring kingdoms came together to form a unified empire. The founding treaty established principles that would guide the realm for centuries.`,
    expectedCommands: ['create-period'],
  },
];

/**
 * Error Scenarios
 *
 * These test malformed or invalid commands that should NOT create items.
 * The parser should return type: 'none' and no items should be created.
 */
export const errorScenarios: TestScenario[] = [
  // === Missing Required Fields ===
  {
    name: 'CREATE PERIOD - missing title',
    humanMessage: 'Create a period',
    aiResponse: `CREATE PERIOD TONE light DESCRIPTION Missing the title field`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE PERIOD - missing TONE keyword',
    humanMessage: 'Create a period',
    aiResponse: `CREATE PERIOD The Broken Age DESCRIPTION This is missing TONE keyword`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE PERIOD - missing TONE value',
    humanMessage: 'Create a period',
    aiResponse: `CREATE PERIOD The Broken Age TONE DESCRIPTION This is missing TONE value`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE PERIOD - missing DESCRIPTION keyword',
    humanMessage: 'Create a period',
    aiResponse: `CREATE PERIOD The Broken Age TONE light This has no description keyword`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE PERIOD - missing DESCRIPTION value',
    humanMessage: 'Create a period',
    aiResponse: `CREATE PERIOD The Broken Age TONE light DESCRIPTION`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - missing title',
    humanMessage: 'Create an event',
    aiResponse: `CREATE EVENT IN The Golden Age TONE dark DESCRIPTION Missing the title`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - missing IN keyword',
    humanMessage: 'Create an event',
    aiResponse: `CREATE EVENT The Battle TONE dark DESCRIPTION Missing IN keyword`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - missing parent period',
    humanMessage: 'Create an event',
    aiResponse: `CREATE EVENT The Battle IN TONE dark DESCRIPTION Missing period name`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - missing TONE',
    humanMessage: 'Create an event',
    aiResponse: `CREATE EVENT The Battle IN The Golden Age DESCRIPTION Missing TONE`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - missing DESCRIPTION',
    humanMessage: 'Create an event',
    aiResponse: `CREATE EVENT The Battle IN The Golden Age TONE dark`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing title',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE IN The Great Voyage TONE light QUESTION What happened? ANSWER They landed DESCRIPTION Missing title`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing IN keyword',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE The Discovery TONE light QUESTION What happened? ANSWER They landed DESCRIPTION Missing IN`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing QUESTION keyword',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE light ANSWER They landed DESCRIPTION Missing question`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing QUESTION value',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE light QUESTION ANSWER They landed DESCRIPTION Missing question text`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing ANSWER keyword',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE light QUESTION What happened? DESCRIPTION Missing answer`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing ANSWER value',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE light QUESTION What happened? ANSWER DESCRIPTION Missing answer text`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - missing DESCRIPTION',
    humanMessage: 'Create a scene',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE light QUESTION What happened? ANSWER They landed`,
    expectedCommands: ['none'],
  },

  // === Invalid TONE Values ===
  {
    name: 'CREATE PERIOD - invalid TONE value',
    humanMessage: 'Create a period with invalid tone',
    aiResponse: `CREATE PERIOD The Twilight TONE medium DESCRIPTION Should only be light or dark`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - invalid TONE value',
    humanMessage: 'Create an event with invalid tone',
    aiResponse: `CREATE EVENT The Battle IN The Golden Age TONE neutral DESCRIPTION Invalid tone`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE SCENE - invalid TONE value',
    humanMessage: 'Create a scene with invalid tone',
    aiResponse: `CREATE SCENE The Discovery IN The Great Voyage TONE gray QUESTION What? ANSWER Yes DESCRIPTION Invalid tone`,
    expectedCommands: ['none'],
  },

  // === Invalid Command Structure ===
  {
    name: 'Lowercase CREATE keyword',
    humanMessage: 'Create with lowercase',
    aiResponse: `create period The Dark Age TONE dark DESCRIPTION Lowercase create`,
    expectedCommands: ['none'],
  },
  {
    name: 'Typo in command type - PERIODO',
    humanMessage: 'Create with typo',
    aiResponse: `CREATE PERIODO The Dark Age TONE dark DESCRIPTION Typo in PERIOD`,
    expectedCommands: ['none'],
  },
  {
    name: 'Typo in command type - EVENTO',
    humanMessage: 'Create with typo',
    aiResponse: `CREATE EVENTO The Battle IN The Golden Age TONE dark DESCRIPTION Typo in EVENT`,
    expectedCommands: ['none'],
  },
  {
    name: 'Random text with no command',
    humanMessage: 'Just say something',
    aiResponse: `This is just a normal conversational response with no commands at all.`,
    expectedCommands: ['none'],
  },
  {
    name: 'Command-like text but not a command',
    humanMessage: 'Talk about creating periods',
    aiResponse: `When you want to create a period, you should use the CREATE PERIOD command, but this is just me explaining it, not actually issuing a command.`,
    expectedCommands: ['none'],
  },

  // === Invalid Placement ===
  {
    name: 'CREATE PERIOD - conflicting placement FIRST LAST',
    humanMessage: 'Create with conflicting placement',
    aiResponse: `CREATE PERIOD The Paradox FIRST LAST TONE light DESCRIPTION Can't be both first and last`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE PERIOD - invalid placement keyword MIDDLE',
    humanMessage: 'Create with invalid placement',
    aiResponse: `CREATE PERIOD The Middle Ages MIDDLE TONE dark DESCRIPTION MIDDLE is not a valid placement`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE EVENT - FIRST LAST conflict',
    humanMessage: 'Create event with conflicting placement',
    aiResponse: `CREATE EVENT The Paradox IN The Golden Age FIRST LAST TONE dark DESCRIPTION Conflicting placement`,
    expectedCommands: ['none'],
  },

  // === Reference Errors (these will parse but fail at execution) ===
  {
    name: 'CREATE EVENT - reference to non-existent period',
    humanMessage: 'Create an event in a period that does not exist',
    aiResponse: `CREATE EVENT The Battle IN The Nonexistent Period TONE dark DESCRIPTION Period doesn't exist

This command will parse correctly, but execution should fail with an error message.`,
    expectedCommands: ['create-event'],
  },
  {
    name: 'CREATE SCENE - reference to non-existent event',
    humanMessage: 'Create a scene in an event that does not exist',
    aiResponse: `CREATE SCENE The Discovery IN The Nonexistent Event TONE light QUESTION What? ANSWER Yes DESCRIPTION Event doesn't exist

This command will parse correctly, but execution should fail.`,
    expectedCommands: ['create-scene'],
  },
  {
    name: 'CREATE PERIOD - AFTER non-existent period',
    humanMessage: 'Create period after non-existent period',
    aiResponse: `CREATE PERIOD The New Era AFTER The Nonexistent Period TONE light DESCRIPTION Reference doesn't exist

This will parse but may fail at execution depending on implementation.`,
    expectedCommands: ['create-period'],
  },
  {
    name: 'CREATE PERIOD - BEFORE non-existent period',
    humanMessage: 'Create period before non-existent period',
    aiResponse: `CREATE PERIOD The Early Days BEFORE The Nonexistent Period TONE dark DESCRIPTION Reference doesn't exist

This will parse but may fail at execution.`,
    expectedCommands: ['create-period'],
  },

  // === Legacy Format Errors (backward compatibility) ===
  {
    name: 'Legacy format - missing tone',
    humanMessage: 'Legacy format missing tone',
    aiResponse: `# create period: The Old Way | Missing tone in parentheses`,
    expectedCommands: ['none'],
  },
  {
    name: 'Legacy format - missing description separator',
    humanMessage: 'Legacy format missing pipe',
    aiResponse: `# create period: The Old Way (light) Missing pipe separator`,
    expectedCommands: ['none'],
  },

  // === Edge Cases ===
  {
    name: 'Empty command line',
    humanMessage: 'Send empty',
    aiResponse: ``,
    expectedCommands: ['none'],
  },
  {
    name: 'Only whitespace',
    humanMessage: 'Send whitespace',
    aiResponse: `

    `,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE keyword alone',
    humanMessage: 'Just CREATE',
    aiResponse: `CREATE`,
    expectedCommands: ['none'],
  },
  {
    name: 'CREATE PERIOD alone',
    humanMessage: 'Just CREATE PERIOD',
    aiResponse: `CREATE PERIOD`,
    expectedCommands: ['none'],
  },
];

/**
 * Helper function to create mock Claude API response
 */
export function createMockClaudeResponse(text: string) {
  return {
    id: `msg_test_${Date.now()}`,
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: text,
      },
    ],
    model: 'claude-3-5-sonnet-20241022',
    stop_reason: 'end_turn',
    usage: {
      input_tokens: 100,
      output_tokens: text.split(' ').length,
    },
  };
}

/**
 * All test scenarios combined
 */
export const allScenarios = [
  ...setupPhaseScenarios,
  ...initialRoundScenarios,
  ...playingPhaseScenarios,
  ...itemCreationScenarios,
  ...errorScenarios,
];
