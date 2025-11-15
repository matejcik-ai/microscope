# Microscope RPG AI Assistant - Overview

## Project Overview
A React SPA for playing Microscope RPG with AI co-players. Fully local (v1), localStorage persistence, user-supplied API keys. Every game item has its own conversation thread that persists in cached context forever.

## Non-Negotiable Constraints

**DO NOT deviate from these without explicit user approval:**

1. **No backend** in v1 - everything localStorage
2. **Every conversation is permanent** - never delete or truncate conversation history
3. **Metadata is editable until "end turn"** - then frozen
4. **All game history goes into cached context** on every API call
5. **React** - no other framework
6. **User supplies single global API key** - stored in localStorage, used for all AI calls
7. **Support multiple game instances** - user can create/delete/switch between games

## Version Scope Clarifications

### v0 (Minimal Viable)
- Single AI player
- Human manually instructs AI when to create items
- Basic setup phase + initial round only

### v1 (Current Target)
- Multiple AI players with personas
- Round-robin turn tracking (system manages whose turn)
- Human clicks "end turn" when satisfied
- Full prompt caching
- Multi-game support

### v2 (Future)
- Focus mechanic
- Detailed scenes with roleplay
- Proactive AI (detects when to speak based on conversation flow)
- Potentially multi-player with backend

**Current implementation should target v1.**

## Key Constraints to Enforce

When implementing, **refuse to**:
1. Truncate or summarize conversation history
2. Use a database instead of localStorage
3. Make metadata editable after freezing
4. Skip caching on game context
5. Merge conversations or lose per-item isolation
6. Add features not in v1 scope (scenes with roleplay, focus mechanic, proactive AI)
7. Store API key per-game or per-player (it's global only)
8. Allow gameplay without API key set
