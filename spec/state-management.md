# State Management

## Context API Structure

```typescript
const AppContext = {
  // Global
  apiKey: string,
  setApiKey: (key: string) => void,

  // Game management
  games: Map<gameId, Game>,
  activeGameId: string | null,
  createGame: () => string, // returns new game ID
  deleteGame: (gameId: string) => void,
  setActiveGame: (gameId: string) => void,

  // Active game state (when activeGameId !== null)
  activeGame: Game | null,
  activeConversation: 'meta' | itemId,

  // Actions (operate on active game)
  sendMessage: (conversationId, content) => void,
  createItem: (type, data) => void,
  endTurn: () => void,
  updateItemMetadata: (itemId, updates) => void,

  // API state
  apiCallInProgress: boolean,
}
```

## Implementation Options

Use React Context + useReducer, or Zustand if you prefer.

**Requirement**: Persist to localStorage on every state change.

## State Persistence

- All state changes must be immediately persisted to localStorage
- No in-memory-only state (except UI ephemera like modals)
- On app load, restore from localStorage
- Handle localStorage quota exceeded errors gracefully

## State Update Patterns

**UNDERSPECIFIED**:
- Optimistic updates vs. wait for AI response?
- How to handle concurrent state updates?
- Conflict resolution if localStorage is edited externally?

See `spec/underspecified/state-update-patterns.md` for details.
