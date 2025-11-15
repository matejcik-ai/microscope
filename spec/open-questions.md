# Open Questions

## Unresolved

Questions still needing Product Owner input:

1. **Bookend periods in setup**: Should bookend periods have conversations in setup phase, or stay empty until game starts?

2. **AI command parsing errors**: What happens if AI fails to parse a command - retry automatically or ask human?

3. **Undo/redo functionality**: Should there be undo/redo during editable phase?

4. **Timeline insertion logic**: When AI says "after Period X", how to handle if multiple valid positions exist?

5. **Conversation switching**: When creating an item, should UI auto-switch to that item's conversation, or stay in meta?

6. **System message format**: What's the exact format and styling for system messages in meta chat?

7. **Error recovery**: If API call fails mid-turn, should we retry, or require manual retry?

8. **localStorage quotas**: What happens when localStorage is full? Warn user? Block new games?

## Resolved

**Date: 2025-11-15 - Player Management**

**Q: AI persona limits**: Max number of AI personas to support in v1?
**A**: v1 has exactly ONE AI player with ONE hard-coded persona ("balanced"). Future versions will have persona library with picker.

**Q: Player turn order**: Should turn order be randomized, or in player creation order, or user-specified?
**A**: v1 is human-driven - no automatic turn management. Human prompts AI whenever they want input. Turn order is a v2 feature.
