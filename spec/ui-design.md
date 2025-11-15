# UI Design & Visual Layout (SPECIFIED)

## Product Owner Decision - 2025-11-15

## v1 UI Specification

### Design Priorities

1. **Mobile-first** - Design for small screens, scale up for desktop
2. **Simple and functional** - UI prettiness deferred to post-v1
3. **Minimal complexity** - Take shortcuts where proper solutions add too much complexity

### Timeline Visualization

**Layout**: Vertical, nested, collapsible tree
- Periods → Events → Scenes hierarchy
- Simple expandable/collapsible items (like file explorer)
- Chronological order top to bottom
- **Rationale**: Much easier to implement than horizontal/canvas layouts

**Tone Indication**:
- Icon indicator only (☀️ light / 🌙 dark)
- No special UI treatment beyond the icon

**Drag-and-drop**: Not in v1 (defer to v2)

### Conversation Layout

**Mobile**:
- Full screen conversation view when item selected
- Navigate back to timeline via:
  - Slide-out left tab (timeline drawer), OR
  - Back arrow button
- One view at a time (timeline OR conversation)

**Desktop**:
- Two-pane split view
- Timeline on left
- Conversation on right
- Both visible simultaneously

### Message Display

**Format**: Chat bubbles
- Left-aligned: Messages from others (AI players)
- Right-aligned: Messages from current user
- **Future-proof**: Design accounts for multiple players (not just human vs AI)

**Message States**:
- Sent: Message appears in conversation immediately
- Waiting for response: Spinner indicator in conversation (like messenger apps)
- Delivered/read indicators: Optional nice-to-have (like messenger "sent/delivered" status)

### System Messages

**Styling**: Bubble in center
- Centered in conversation flow
- Basic styling (don't focus on visual polish for v1)
- Distinct from regular messages (simple visual difference)

**Clickable Links**:
- Item creation messages ("Period created: Name") are clickable
- Navigate to that item's conversation on click

**Action Menu**:
- "Show raw" option on system messages
- Shows unparsed AI response for debugging/reparse

### Error Messages

**Styling**: Similar to system messages but styled differently
- Centered bubbles (like system messages)
- Visually distinct (e.g., red border, warning icon)
- Include "Retry" button for API failures

**Types**:
- API call failures
- Command parse errors
- General errors

### Loading States

**API Calls**:
- Human's message immediately appears as "sent"
- Spinner shown in conversation while waiting for AI response
- Optional: Sent/delivered indicators (like messaging apps)

**No skeleton loaders** for v1 - keep it simple

### Theme Support

**v1**: Light mode only

**Future considerations**:
- Keep themes in mind during implementation
- Account for themes if reasonably easy
- Take shortcuts where proper theming would increase complexity
- Don't bend over backwards for theme support in v1

### Component Library

**Decision**: Tech lead decides
- Use whatever works best for rapid development
- Options: Chakra UI, Material-UI, Tailwind, or custom CSS
- Preference for library that handles responsive layouts well

### Accessibility

**v1 Minimum**:
- Keyboard navigation for core flows
- Basic semantic HTML
- Focus management for modals/drawers

**Deferred to v2**:
- Full screen reader support
- ARIA labels comprehensive coverage
- Color contrast compliance (but try to avoid terrible contrast)
