# AI Commands

AI issues commands in meta conversation by outputting structured text:

## CREATE_PALETTE

```
CREATE_PALETTE:
- type: yes
  text: "Advanced technology exists"
- type: no
  text: "No widespread space travel"
```

## CREATE_PERIOD

```
CREATE_PERIOD:
name: "The Period of Strife"
location: "after Period of Awakening"
tone: dark
brief_description: "Decades of civil war tear apart the old order"
expanded_description: |
  The fragile peace established during the Awakening could not hold.
  Regional warlords, each claiming legitimacy from the old empire,
  plunged the continent into chaos. Cities burned, trade routes
  collapsed, and knowledge was lost as libraries became fortresses.
```

## CREATE_EVENT

```
CREATE_EVENT:
name: "Sacking of Volgograd"
parent: "Period of Strife"
location: "after The Great Schism"
tone: dark
brief_description: "The northern capital falls to General Zhao's forces"
expanded_description: |
  [detailed narrative goes here, becomes first message in item conversation]
```

## Command Parser

Extract these from AI messages, execute the creation, move expanded_description to new item's conversation.

## Error Handling

**UNDERSPECIFIED**: What happens when:
- AI fails to use proper command format?
- Required fields are missing?
- Referenced parent doesn't exist?
- Location reference is ambiguous?

See `spec/underspecified/command-error-handling.md` for details.
