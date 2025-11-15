# Player Management (SPECIFIED)

## Product Owner Decision - 2025-11-15

The following decisions have been made:

## v1 Specification

### AI Player Count
- **v1: Exactly ONE AI player**
- One human player + one AI player per game
- Future versions will support multiple AI players with persona picker

### Persona System
**Personas are hard-coded by app provider (us)**:
- Not user-created or user-editable
- Referenced by short string ID (e.g., "optimist", "tragedian")
- Part of game configuration at creation time
- No persistence across games - just system prompt content

**Persona structure** (defined in code):
```typescript
type PersonaDefinition = {
  id: string;              // e.g., "optimist"
  name: string;            // e.g., "The Optimist"
  description: string;     // Short description for UI
  systemPrompt: string;    // Pre-prompt injected into AI calls
}
```

**v1 has ONE persona** - we'll create one default persona
**Future versions** will have persona library with picker UI

### Turn Mechanics (v1)
**Human-driven, not automated**:
- No automatic turn-taking in v1
- Human prompts AI whenever they want its input
- Human is fully in control of conversation flow
- AI responds when explicitly prompted by human
- Future versions may add automatic turn management

### Player Configuration
**At game creation**:
- Game config includes persona ID (hard-coded to default for v1)
- Players locked at creation time
- Cannot add/remove/change persona after game starts

**No player editing UI needed in v1**:
- Persona is selected implicitly (only one exists)
- No player management UI required
- Future versions will have persona picker

### Player Data Model
```typescript
type Player = {
  id: string;
  name: string;              // Display name
  type: 'human' | 'ai';
  personaId?: string;        // References PersonaDefinition.id (AI only)
}

// In Game:
type Game = {
  // ...
  players: Player[];  // Always [humanPlayer, aiPlayer] in v1
  // ...
}
```

### Implementation for v1

**Hard-coded persona**:
```typescript
const DEFAULT_PERSONA: PersonaDefinition = {
  id: 'generic',
  name: 'Generic Co-player',
  description: 'A balanced, neutral collaborator',
  systemPrompt: '' // Empty - relies on base system prompt (see system-prompts.md)
};
```

**Note**: The collaborative storyteller guidance ("You create engaging periods, events, and scenes...") is part of the **base system prompt** for all conversation types, not persona-specific. See `spec/system-prompts.md` for details.

**Game creation flow**:
1. Human creates new game
2. System automatically creates two players:
   - Human player (type: 'human')
   - AI player (type: 'ai', personaId: 'generic')
3. Players locked for duration of game

**AI prompting** (human-driven):
- Human can message AI in meta conversation anytime
- Human can message AI in any item conversation anytime
- No turn enforcement - fully conversational
- AI responds when prompted
