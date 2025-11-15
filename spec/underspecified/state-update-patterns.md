# State Update Patterns (UNDERSPECIFIED)

## Problem

React state updates and localStorage persistence need careful coordination, especially with async API calls.

## Missing Details

### Optimistic Updates

When user sends a message or creates an item:
- Add to state immediately (optimistic)?
- Wait for API response?
- Show loading state during API call?

**Trade-offs**:
- Optimistic: Better UX, but need rollback on error
- Wait: Simpler logic, but feels slow

### Concurrent Updates

Multiple async operations could be in flight:
- AI responding in meta conversation
- User editing in item conversation
- Turn end triggering state transitions

**Questions**:
1. Lock state during API calls?
2. Queue operations?
3. Allow concurrent with conflict resolution?

### localStorage Sync

When to write to localStorage:
- On every state change (current spec says this)?
- Debounced (batch writes)?
- Only on "important" changes?

**Concerns**:
- Performance with large games
- Quota exceeded errors
- localStorage write failures

### External Changes

If user edits localStorage directly (e.g., from DevTools):
- Detect changes and reload?
- Ignore until next app load?
- Watch storage events?

## Questions to Resolve

1. **Error recovery**: If API call fails after optimistic update, how to revert?

2. **Race conditions**: If AI creates item while human is creating item, who wins?

3. **Persistence failures**: What if localStorage.setItem() throws (quota exceeded)?

4. **State consistency**: How to ensure React state and localStorage never diverge?

## Recommended Approach (To Be Confirmed)

**Suggestion**:
- Use optimistic updates for user actions
- Add messages immediately, show "sending..." indicator
- On API error, mark message as failed (don't remove)
- Persist to localStorage after each reducer action
- Wrap persistence in try/catch, show error modal if it fails
- No concurrent API calls per conversation (queue them)
