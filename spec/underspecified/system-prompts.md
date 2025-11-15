# System Prompts (UNDERSPECIFIED)

## Problem

The spec mentions that system prompts are part of the cached context, but doesn't specify their exact content.

## Missing Details

### Meta Conversation System Prompt

Should include:
- Game rules explanation?
- Command format reference?
- Current game phase instructions?
- Turn order information?
- Persona-specific instructions for AI player?

**Example stub**:
```
You are [AI Player Name] playing Microscope RPG.
Current phase: [setup/initial_round/playing]
Current turn: [Player Name]

[Game rules summary?]
[Command format reference?]
[Persona prompt from Player.personaPrompt?]
```

### Item Conversation System Prompt

Should include:
- Item metadata (name, type, tone)?
- Item's place in timeline?
- Related items (parent period, adjacent events)?
- Editing constraints (frozen or not)?

**Example stub**:
```
You are discussing: [Item Type] - [Item Name]
Created by: [Player Name]
Status: [Editable/Frozen]

[Item metadata?]
[Timeline context?]
```

## Questions to Resolve

1. **Persona integration**: How do AI player personas interact with system prompts?
   - Append to system prompt?
   - Separate system message?
   - Part of user message?

2. **Rule verbosity**: Should full Microscope RPG rules be in prompt, or assume AI knows them?

3. **Dynamic content**: Which parts of system prompt change per-message vs. stay constant?

4. **Command documentation**: Should command formats be in every meta conversation prompt, or only when relevant?

## Recommended Approach (To Be Confirmed)

**Suggestion**:
- Keep system prompts minimal and focused
- Include only current-phase relevant info
- Persona prompts appended to base system prompt
- Reference full game state via the cached context structure, not in system prompt
