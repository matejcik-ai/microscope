# Open Questions

Questions to ask user before implementation:

1. **Bookend periods in setup**: Should bookend periods have conversations in setup phase, or stay empty until game starts?

2. **AI command parsing errors**: What happens if AI fails to parse a command - retry automatically or ask human?

3. **Undo/redo functionality**: Should there be undo/redo during editable phase?

4. **AI persona limits**: Max number of AI personas to support in v1?

5. **Timeline insertion logic**: When AI says "after Period X", how to handle if multiple valid positions exist?

6. **Player turn order**: Should turn order be randomized, or in player creation order, or user-specified?

7. **Conversation switching**: When creating an item, should UI auto-switch to that item's conversation, or stay in meta?

8. **System message format**: What's the exact format and styling for system messages in meta chat?

9. **Error recovery**: If API call fails mid-turn, should we retry, or require manual retry?

10. **localStorage quotas**: What happens when localStorage is full? Warn user? Block new games?
