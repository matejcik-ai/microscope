# Component Hierarchy & UI Flows

## Component Hierarchy

```
App
├── GlobalHeader
│   ├── APIKeyInput (in settings menu)
│   ├── GameSelector (dropdown of all games)
│   └── NewGameButton
│
├── NoAPIKeyPrompt (when !apiKey)
│
├── GameList (when no active game)
│   └── GameCard[] (click to load, delete button)
│
├── GameSetup (when activeGame && phase === 'setup')
│   ├── HighConceptInput
│   ├── PaletteEditor
│   ├── BookendsEditor
│   └── MetaConversation
│
├── GameBoard (when activeGame && phase === 'initial_round' | 'playing')
│   ├── Timeline
│   │   ├── PeriodCard[]
│   │   │   └── EventCard[]
│   │
│   ├── ActiveConversation (right sidebar or modal)
│   │   ├── ConversationThread
│   │   ├── MessageInput
│   │   └── [EndTurnButton if item conversation]
│   │
│   └── MetaConversation (collapsible bottom panel)
│
└── Settings
    ├── APIKeyInput
    └── PlayerManagement (add/remove AI personas)
```

## UI Flow for Multi-Game

1. App loads → check for apiKey in localStorage
2. If no apiKey → show prompt, block everything else
3. If apiKey exists → show game list
4. User creates new game or selects existing → load that game's full state
5. Global header always shows: current game name, game selector dropdown, settings (with API key)
6. User can switch games anytime (saves current state first)
7. Delete game → confirm dialog → remove from localStorage

## Visual Design & UX

**UNDERSPECIFIED**:
- Timeline visualization layout (horizontal? vertical? zoomable?)
- How events are displayed within periods (nested? expandable?)
- Conversation UI design (chat bubbles? threaded? side-by-side with timeline?)
- Mobile responsiveness requirements?
- Accessibility requirements?
- System message styling and placement?
- Loading states during API calls?
- Error message display?

See `spec/underspecified/ui-design.md` for details.
