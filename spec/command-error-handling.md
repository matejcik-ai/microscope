# AI Command Error Handling (SPECIFIED)

## Product Owner Decision - 2025-11-15

## v1 Specification

### Error Handling Strategy

When AI outputs malformed commands, the system emits an error to the chat stream and asks the human to intervene.

**No automatic retries in v1** - human decides recovery method.

### Error Conditions

1. **Malformed syntax**: AI doesn't follow the plain English command format
2. **Missing required fields**: e.g., CREATE PERIOD without tone or description
3. **Invalid references**: e.g., "IN Period of X" when no such period exists
4. **Invalid positioning**: e.g., FIRST/LAST in gameplay phase, or AFTER/BEFORE in setup
5. **Invalid enum values**: e.g., `TONE purple` instead of `light` or `dark`

### Parsing Behavior

**Lenient parsing**: Handle minor formatting variations
- Case-insensitive keywords (TONE vs tone vs Tone)
- Flexible whitespace
- Alternative separators where reasonable

**Strict on structure**: Reject if:
- Required fields missing
- References don't exist
- Positioning invalid for current phase
- Multiple commands outside allowed cases (see below)

### Multiple Commands

AI can only issue multiple commands in these specific cases:

1. **CREATE PALETTE** with multiple items (setup phase only)
2. **Two CREATE PERIOD commands** for bookends (FIRST and LAST, setup phase only)
3. **Both of the above** in the same response

**All-or-nothing**: If ANY error in a multi-command response, abort ALL actions.

### Error Response Flow

1. **Parse AI's message** for commands
2. **If error detected**:
   - Do NOT execute any commands from this message
   - Emit system message to meta conversation: `⚠️ Command parsing error: [specific reason]`
   - AI's message is still added to conversation history
3. **Human decides recovery**:
   - Ask AI to try again (prompt in chat)
   - Use "reparse" action on the message (if format was close)
   - Use "restart from here" to regenerate AI's response
   - Manually create the item AI intended
   - Continue conversation without the item

### Message Action Menu

Each AI message in conversation has an action menu with options:
- **Show unparsed output**: Display the raw AI response before command parsing
- **Reparse**: Re-attempt command parsing on this message (if parser was updated)
- **Restart from here**: Delete this message and regenerate AI response from prior context
- **Copy text**: Copy message content to clipboard

**Note**: This action menu is part of UI design (see `spec/underspecified/ui-design.md`)

### Conversation History

**Everything goes in history**:
- AI's message (including malformed commands)
- System error messages
- Human's follow-up prompts
- All of this becomes part of cached context

This ensures AI sees its mistakes and can learn from human corrections.

### Examples

**Example 1: Missing required field**
```
AI: CREATE PERIOD The Golden Age FIRST DESCRIPTION An era of prosperity

System: ⚠️ Command parsing error: Missing required field TONE
```

**Example 2: Invalid reference**
```
AI: CREATE EVENT The Battle IN The Dark Times AFTER The Uprising TONE dark DESCRIPTION ...

System: ⚠️ Command parsing error: Parent period "The Dark Times" not found
```

**Example 3: Invalid positioning for phase**
```
AI: CREATE PERIOD The Renaissance FIRST TONE light DESCRIPTION ...

System: ⚠️ Command parsing error: FIRST/LAST positioning only available during setup phase. Use AFTER or BEFORE.
```

**Example 4: Partial palette failure (all-or-nothing)**
```
AI: CREATE PALETTE
- YES: Magic exists
- NO: Space travel
- MAYBE: Time travel

System: ⚠️ Command parsing error: Invalid palette item type "MAYBE" (must be YES or NO). No palette items were added.
```

### Implementation Notes

- Parser should provide specific, actionable error messages
- Error messages visible to both human and AI (in context)
- No retry limits - human controls when to move on
- Consider adding parser validation helper for testing
