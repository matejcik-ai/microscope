# Game Phases

## Setup Phase (v1)
**Occurs in meta conversation only.**

1. Human and AI(s) discuss and collaboratively create:
   - High concept (single sentence)
   - Palette (yes/no items)
   - Two bookend periods (earliest and latest in timeline)

2. AI can create items via commands (see Commands section)
3. **All items editable** during setup
4. Human confirms "start game" → moves to initial_round phase
5. At phase transition, freeze all existing items

## Initial Round (v1)
**Round-robin: each player creates one Period OR one Event.**

1. System assigns turn order
2. On player's turn:
   - Human: uses UI to fill metadata, writes expanded description in item conversation
   - AI: uses CREATE command in meta chat
3. Turn ends when:
   - Human clicks "End Turn" button
   - AI creates next item (implicit end turn)
4. Item metadata freezes on turn end
5. Round ends when all players have gone once → phase becomes 'playing'

## Playing Phase (v2 - not in scope for v1)
Focus mechanic, more complex turn logic.
