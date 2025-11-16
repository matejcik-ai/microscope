/**
 * Verification script for bookend meta chat bug #7
 * Run with: npx tsx verify-bookend-bug.ts
 */

console.log('🔍 Verifying Bookend Meta Chat Bug #7\n');
console.log('=====================================\n');

// Read the game page to check the code
import { readFileSync } from 'fs';

const gamePagePath = './app/game/page.tsx';
const content = readFileSync(gamePagePath, 'utf-8');

console.log('📋 Test Case: Editing existing bookend\n');

// Check if the buggy pattern exists
const buggyPattern1 = /addMessage\(currentConversationId,\s*\{[^}]*Updated.*bookend/s;
const buggyPattern2 = /Updated.*bookend.*\n.*\}\);/s;

const lines = content.split('\n');
let foundBug = false;
let bugLocation = -1;

// Find the bookend edit section
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Edit existing bookend')) {
    // Check next few lines for the bug
    const nextLines = lines.slice(i, i + 10).join('\n');
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
  } else {
    console.log('⚠️  Could not verify correct pattern');
  }
} else {
  console.log('\n💡 Fix required:');
  console.log('  1. Change currentConversationId → metaConversationId');
  console.log('  2. Add metadata.linkTo object');
  console.log('\n📝 Test status: FAILS (as expected before fix)');
  process.exit(1);
}
