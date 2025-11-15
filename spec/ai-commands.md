# AI Commands

AI issues commands in meta conversation by outputting plain English structured text.

## Command Format

Commands follow this pattern:
```
CREATE <TYPE> <name> <POSITIONING> TONE <tone> DESCRIPTION <brief description>

(blank line)

Expanded description goes here. This becomes the first message in the item's conversation.
```

## CREATE PALETTE (Setup Phase Only)

**Available in setup phase only.** AI can create multiple palette items in a single response.

```
CREATE PALETTE
- YES: Advanced technology exists
- NO: Widespread space travel
- YES: Magic is real but rare
- NO: Time travel
```

**Rules**:
- Only available during setup phase
- Can include multiple items in one command
- Each item must specify YES or NO
- Items are added to the game's palette
- Human can edit/delete palette items at any time (palette never freezes)
- During gameplay, AI does not have palette editing commands

## CREATE PERIOD

**Setup phase (bookends only)**:
```
CREATE PERIOD The Dawn of Civilization FIRST TONE light DESCRIPTION Humanity's first flourishing

The earliest period in our history, when small tribes began to settle and form the foundations of what would become great civilizations. Agriculture took root, language developed, and the first stories were told around fires.
```

**Playing phase**:
```
CREATE PERIOD The Period of Strife AFTER The Golden Age TONE dark DESCRIPTION Decades of civil war

The fragile peace established during the Golden Age could not hold. Regional warlords, each claiming legitimacy from the old empire, plunged the continent into chaos. Cities burned, trade routes collapsed, and knowledge was lost as libraries became fortresses.
```

**Positioning**:
- Setup phase: `FIRST` or `LAST` (for bookend periods only)
- Playing phase: `AFTER <item-name>` or `BEFORE <item-name>`

## CREATE EVENT

```
CREATE EVENT The Sacking of Volgograd IN The Period of Strife AFTER The Great Schism TONE dark DESCRIPTION The northern capital falls to General Zhao's forces

General Zhao's army breached the ancient walls at dawn. For three days, the city burned as centuries of accumulated wealth and knowledge were destroyed. The fall of Volgograd marked the point of no return in the civil war.
```

**Positioning**: `FIRST`, `LAST`, `AFTER <item-name>`, or `BEFORE <item-name>` (within parent period)

## CREATE SCENE (v1: Dictated Scenes)

```
CREATE SCENE The Confrontation IN The Sacking of Volgograd AFTER The Breach TONE dark QUESTION Does General Zhao show mercy to the defeated defenders? ANSWER No, he orders them executed as traitors DESCRIPTION Zhao's ruthless judgment

Standing among the ruins of the city gate, General Zhao addresses the captured defenders. Despite their pleas and the counsel of his advisors, he declares them traitors to the old empire and orders their execution. This act of brutality cements his reputation and eliminates any hope of reconciliation.
```

**v1 Note**: Scenes in v1 are "dictated" - both question AND answer are provided at creation time. The scene is fully specified upfront, not collaboratively explored.

**v2 Future**: Roleplayed scenes where only the question is specified, and the answer emerges through conversation.

**Positioning**: `FIRST`, `LAST`, `AFTER <item-name>`, or `BEFORE <item-name>` (within parent event)

## Command Parser

The system extracts these commands from AI messages:
1. Parse command header line for type, name, positioning, tone, description
2. Extract expanded description (text after blank line)
3. Execute the creation (update game state)
4. Create item conversation with expanded description as first message
5. Set item as current unfrozen item

## Error Handling

**v1 Strategy**: Emit error to chat, human decides recovery method.

When commands fail to parse:
- AI fails to use proper command format → error message in chat
- Required fields are missing → error message specifies which field
- Referenced parent doesn't exist → error message identifies missing reference
- Location reference is ambiguous → error message (implementation detail)
- Multiple commands outside allowed cases → error message

**All-or-nothing**: If ANY error in multi-command response, abort ALL actions.

See `spec/command-error-handling.md` for complete specification including error examples, message action menu, and recovery options.
