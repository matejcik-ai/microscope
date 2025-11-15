# Open Questions

## Unresolved

Questions still needing Product Owner input:

1. **Undo/redo functionality**: Should there be undo/redo during editable phase?

2. **Conversation switching**: When creating an item, should UI auto-switch to that item's conversation, or stay in meta?

6. **System message format**: What's the exact format and styling for system messages in meta chat?

7. **Error recovery**: If API call fails mid-turn, should we retry, or require manual retry?

8. **localStorage quotas**: What happens when localStorage is full? Warn user? Block new games?

## Resolved

**Date: 2025-11-15 - Player Management**

**Q: AI persona limits**: Max number of AI personas to support in v1?
**A**: v1 has exactly ONE AI player with ONE hard-coded persona ("generic"). Future versions will have persona library with picker.

**Q: Player turn order**: Should turn order be randomized, or in player creation order, or user-specified?
**A**: v1 is human-driven - no automatic turn management. Human prompts AI whenever they want input. Turn order is a v2 feature.

**Date: 2025-11-15 - Bookend Periods**

**Q: Bookend periods in setup**: Should bookend periods have conversations in setup phase, or stay empty until game starts?
**A**: Bookend periods work like any other period in terms of UI and data model - they DO have conversations. However, in typical play, these conversations are created empty (no initial message like items created via CREATE command). Human players CAN switch to bookend period conversations and discuss them, but the content is typically never created. The conversation exists but starts empty.

**Date: 2025-11-15 - AI Command Parsing Errors**

**Q: AI command parsing errors**: What happens if AI fails to parse a command - retry automatically or ask human?
**A**: v1 emits error to chat stream, human decides recovery method. No automatic retries. Lenient parsing for minor variations, strict on structure. All-or-nothing for multi-command responses (palette, bookends). Message action menu provides: show unparsed output, reparse, restart from here. Everything goes in conversation history so AI sees its errors. See `spec/command-error-handling.md` for complete specification.

**Date: 2025-11-15 - Timeline Insertion Logic**

**Q: Timeline insertion logic**: When AI says "after Period X", how to handle if multiple valid positions exist?
**A**: No ambiguity exists. Positioning is type-scoped - items are positioned relative to items of the same type only. Periods positioned relative to Periods, Events relative to Events (within parent Period), Scenes relative to Scenes (within parent Event). `AFTER X` means immediately after X in the same-type list. Cross-type positioning (e.g., "Event X AFTER Period Y") is invalid and triggers parse error. See `spec/ai-commands.md` Positioning Rules section.
