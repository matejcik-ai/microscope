# Player Management (UNDERSPECIFIED)

## Problem

Spec mentions AI players with personas but doesn't detail how they're created, edited, or managed.

## Missing Details

### Player Creation

**During setup**:
- How many AI players can be added?
- Are they added during game setup, or pre-game?
- Can players be added/removed mid-game?

**Human players**:
- Is there always exactly one human player?
- Or can multiple humans play together (v2)?
- How is the human player represented in Player array?

### AI Persona Definition

**UI for persona creation**:
- Text area for free-form prompt?
- Template selection (e.g., "Aggressive", "Creative", "Logical")?
- Structured form (playstyle traits, preferences)?

**Persona prompt content**:
- What guidance to give users?
- Example personas provided?
- Character limits?

**Persona examples**:
```
"You play Microscope by focusing on tragedy and irony.
You prefer dark-toned events and explore the consequences
of hubris and failed ambitions."
```

vs.

```
"You are optimistic and create hopeful moments even in
dark periods. You focus on heroism and redemption."
```

### Player Editing

**During setup phase**:
- Can personas be edited?
- Can player names be changed?
- Can players be removed?

**After game starts**:
- Are players locked in?
- Or can personas be tweaked between turns?

### Turn Order

**Initialization**:
- Random order?
- User-specified order?
- Creation order?

**Display**:
- Show turn order in UI?
- Highlight current player?
- Show upcoming player?

### Player Limits

**Maximum players**:
- Technical limit (performance)?
- Practical limit (UX)?
- Recommended number for v1?

**Minimum players**:
- Can game have 0 AI players (human solo)?
- Must have at least 1 AI?

## Questions to Resolve

1. **Player setup timing**: When are AI players configured - before creating game, or during setup phase?

2. **Persona complexity**: Should v1 support simple text prompts, or richer persona configuration?

3. **Player identification**: How to visually distinguish players in UI (colors, avatars, icons)?

4. **Human player config**: Does human player have a name/avatar, or just "You"?

5. **Player persistence**: Are AI personas stored per-game, or can they be saved globally and reused?

## Recommended Approach (To Be Confirmed)

**Suggestion for v1**:
- Configure players during game setup phase (before "Start Game")
- Support 1 human + 1-3 AI players
- Simple text area for persona prompts
- Provide 2-3 example personas as templates
- Random turn order on game start
- Players locked in once game starts (no add/remove mid-game)
- Show current turn player prominently in UI
