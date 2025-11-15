# AI Command Error Handling (UNDERSPECIFIED)

## Problem

When AI players issue commands in the meta conversation, several error conditions can occur:

1. **Malformed syntax**: AI doesn't follow the exact YAML-like format
2. **Missing required fields**: e.g., CREATE_PERIOD without `name`
3. **Invalid references**: e.g., `parent: "Period of X"` when no such period exists
4. **Ambiguous location**: e.g., `location: "after Period Y"` when multiple positions are valid
5. **Invalid enum values**: e.g., `tone: medium` instead of `light` or `dark`

## Questions to Resolve

1. **Parsing failures**: Should the system:
   - Silently ignore and let AI continue?
   - Show error in meta chat and ask AI to retry?
   - Show error to human and ask for intervention?

2. **Retry logic**: If we ask AI to retry:
   - How many retries before giving up?
   - Should we include the error message in context?
   - Should we provide examples of correct format?

3. **Human intervention**: When human needs to fix:
   - Can they manually create the item AI intended?
   - Can they edit the AI's command text and re-execute?
   - Or must AI be told to try again?

4. **Turn progression**: If command fails:
   - Does turn stay with current player?
   - Or does it advance anyway (failed turn)?

## Recommended Approach (To Be Confirmed)

**Suggestion**: Use graceful degradation:
1. Parse leniently (handle minor formatting variations)
2. On critical error, post system message to meta: "⚠️ Command failed: [reason]"
3. Keep turn with same player
4. Include error context in next AI response
5. Allow human to manually create item if needed
