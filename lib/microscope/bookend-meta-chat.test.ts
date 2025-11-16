/**
 * Test case for bookend meta chat emission
 * Run with: npx tsx lib/microscope/bookend-meta-chat.test.ts
 *
 * Bug #7: When AI creates/edits bookends, the message should appear in meta chat
 * with a clickable link. This test verifies the fix is in place.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Test Scenario 1: Creating a NEW bookend
 *
 * Input: AI command "CREATE PERIOD Ancient Times FIRST TONE dark DESCRIPTION Beginning"
 * Expected behavior:
 * - Bookend period created in timeline
 * - Meta chat receives message: "Created start bookend: Ancient Times"
 * - Message has metadata.linkTo: { type: 'period', id: <bookend-id> }
 * - Message sent to metaConversationId
 *
 * Current status: ✓ WORKING (lines 163-173 in app/game/page.tsx)
 */

/**
 * Test Scenario 2: Editing an EXISTING bookend
 *
 * Input: AI command "CREATE PERIOD Modern Era FIRST TONE light DESCRIPTION New start"
 * (when a start bookend already exists)
 *
 * Expected behavior:
 * - Existing bookend updated in timeline
 * - Meta chat receives message: "Updated start bookend: Modern Era"
 * - Message has metadata.linkTo: { type: 'period', id: <bookend-id> }
 * - Message sent to metaConversationId
 *
 * Current status: ✗ BROKEN (lines 136-143 in app/game/page.tsx)
 * - Message sent to currentConversationId (wrong!)
 * - Message missing metadata.linkTo (wrong!)
 */

/**
 * Expected meta chat message format (should match create-period pattern):
 */
export const EXPECTED_META_MESSAGE_FORMAT = {
  role: 'system' as const,
  playerId: 'system',
  content: 'Updated start bookend: <title>',
  metadata: {
    linkTo: {
      type: 'period' as const,
      id: '<bookend-period-id>',
    },
  },
};

/**
 * Test verification steps:
 * 1. Run: npm run dev
 * 2. Create a new game
 * 3. In setup phase, ask AI to create a start bookend
 * 4. Verify meta chat shows "Created start bookend: X" with clickable link
 * 5. Ask AI to create another start bookend (different name)
 * 6. Verify meta chat shows "Updated start bookend: Y" with clickable link
 * 7. Click the link - should open the bookend's conversation
 */

export const TEST_STEPS = [
  'Start new game',
  'Ask AI: "Create a start bookend called Ancient Times"',
  'Verify: Meta chat shows "Created start bookend: Ancient Times" (clickable)',
  'Ask AI: "Create a start bookend called Modern Era"',
  'Verify: Meta chat shows "Updated start bookend: Modern Era" (clickable)',
  'Click link in meta chat',
  'Verify: Bookend conversation opens',
];

/**
 * Automated verification test
 */
function verifyBookendMetaChatFix() {
  console.log('🔍 Verifying Bookend Meta Chat Bug #7\n');
  console.log('=====================================\n');

  const gamePagePath = join(__dirname, '../../app/game/page.tsx');
  const content = readFileSync(gamePagePath, 'utf-8');

  console.log('📋 Test Case: Editing existing bookend\n');

  const lines = content.split('\n');
  let foundBug = false;
  let bugLocation = -1;

  // Find the bookend edit section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Edit existing bookend')) {
      // Check next few lines for the bug
      const nextLines = lines.slice(i, i + 15).join('\n');
      if (nextLines.includes('addMessage(currentConversationId') &&
          nextLines.includes('Updated') &&
          nextLines.includes('bookend')) {
        foundBug = true;
        bugLocation = i + 1;

        // Check if metadata.linkTo exists
        const hasLinkTo = nextLines.includes('metadata:') && nextLines.includes('linkTo:');

        console.log('❌ BUG FOUND at line', bugLocation);
        console.log('\nBuggy code pattern:');
        console.log('  - Uses currentConversationId instead of metaConversationId');
        console.log('  - Missing metadata.linkTo:', !hasLinkTo ? '✗ YES' : '✓ NO');
        console.log('\nExpected behavior:');
        console.log('  - Should use metaConversationId');
        console.log('  - Should include metadata.linkTo with type and id');
        break;
      }
    }
  }

  if (!foundBug) {
    console.log('✅ Bug appears to be fixed!');
    console.log('\nVerifying correct pattern exists...\n');

    // Look for the correct pattern
    const correctPattern = /addMessage\(metaConversationId,\s*\{[^}]*Updated.*bookend.*metadata:\s*\{.*linkTo:/s;
    if (correctPattern.test(content)) {
      console.log('✓ Correct pattern found:');
      console.log('  - Uses metaConversationId');
      console.log('  - Has metadata.linkTo');
      console.log('\n🎉 Test PASSES - Bug is fixed!');
      return true;
    } else {
      console.log('⚠️  Could not verify correct pattern');
      return false;
    }
  } else {
    console.log('\n💡 Fix required:');
    console.log('  1. Change currentConversationId → metaConversationId');
    console.log('  2. Add metadata.linkTo object');
    console.log('\n📝 Test status: FAILS');
    return false;
  }
}

// Run the test
const testPassed = verifyBookendMetaChatFix();
if (!testPassed) {
  process.exit(1);
}

console.log('\n📋 Manual Verification Steps (if needed):');
console.log('==========================================');
console.log(TEST_STEPS.join('\n'));
