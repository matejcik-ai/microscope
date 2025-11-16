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
 * Error Scenarios
 */
export const errorScenarios: TestScenario[] = [
  {
    name: 'Invalid command format',
    humanMessage: 'Create a period without proper format',
    aiResponse: `I'll create that period with the correct format.

create period The Broken Age tone light description This has wrong syntax`,
    expectedCommands: ['none'],
  },
  {
    name: 'Reference to non-existent period',
    humanMessage: 'Create an event in The Nonexistent Period',
    aiResponse: `I don't see a period called "The Nonexistent Period" in the timeline. Could you specify which period you'd like me to create the event in?`,
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
  ...errorScenarios,
];
