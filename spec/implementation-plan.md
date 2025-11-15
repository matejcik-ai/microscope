# Implementation Plan

## Phase 0: Foundation
- [ ] Data model types
- [ ] Global app state management
- [ ] Game list/selection UI
- [ ] Create/delete game functionality
- [ ] Global API key management (persisted separately)
- [ ] "No API key" prompt/blocker
- [ ] localStorage persistence
- [ ] State management setup

## Phase 1: Setup Phase
- [ ] High concept input
- [ ] Palette editor (human can add/edit)
- [ ] Bookend period creation (human)
- [ ] Meta conversation component
- [ ] AI command parser for CREATE_PALETTE, CREATE_PERIOD
- [ ] "Start Game" transition

## Phase 2: Core Game Loop
- [ ] Timeline visualization (periods, events)
- [ ] Turn tracking system
- [ ] Per-item conversation creation
- [ ] CREATE_EVENT command
- [ ] End turn mechanism
- [ ] Metadata freezing

## Phase 3: Context & Caching
- [ ] buildCachedGameContext() implementation
- [ ] Prompt caching integration
- [ ] Test with growing game (10+ periods/events)

## Phase 4: Polish
- [ ] System messages in meta chat
- [ ] Click-through from event stream to item
- [ ] UI for switching between conversations
- [ ] Error handling, loading states

## Testing Strategy

Each phase should include:
- Unit tests for core logic
- Integration tests for state changes
- Manual testing of UI flows
- Verification against spec constraints

See also: `spec/testing-approach.md` (UNDERSPECIFIED)
