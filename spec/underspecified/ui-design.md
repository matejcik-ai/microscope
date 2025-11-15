# UI Design & Visual Layout (UNDERSPECIFIED)

## Problem

Component hierarchy is specified, but visual design and UX patterns are not detailed.

## Missing Details

### Timeline Visualization

**Layout options**:
- Horizontal timeline (left to right)?
- Vertical timeline (top to bottom)?
- Tree view?
- Zoomable/pannable canvas?

**Event nesting**:
- Events shown inside period cards?
- Events in separate expandable section?
- Hierarchical tree structure?

**Ordering**:
- Visual indication of chronological order?
- Drag-and-drop to reorder (during editable phase)?

**Tone indication**:
- Color coding (light vs dark)?
- Icons?
- Border styles?

### Conversation UI

**Layout**:
- Side-by-side: timeline on left, conversation on right?
- Modal overlay?
- Bottom panel?
- Separate tabs?

**Message display**:
- Chat bubbles (left/right aligned by role)?
- Threaded view?
- Flat chronological list?

**Switching conversations**:
- Tabs for each open conversation?
- Click item in timeline to open?
- Breadcrumb navigation?

### System Messages

**Styling**:
- Centered gray text?
- Notification cards?
- Timeline events?
- Toast notifications?

**Interactivity**:
- Clickable to jump to item?
- Dismiss button?
- Grouped by type?

### Loading & Error States

**API calls**:
- Spinner on message send?
- Skeleton loaders?
- Loading bar?

**Errors**:
- Toast notifications?
- Inline error messages?
- Modal dialogs?

### Responsive Design

**Mobile support**:
- Required for v1?
- Tablet-friendly layout?
- Touch gestures?

**Breakpoints**:
- Desktop-only?
- Minimum screen width?

### Accessibility

**Requirements**:
- Screen reader support?
- Keyboard navigation?
- ARIA labels?
- Color contrast standards?
- Focus management?

## Questions to Resolve

1. **Timeline visualization**: Which layout provides best UX for complex, branching histories?

2. **Conversation focus**: Should conversation UI be prominent, or timeline be primary?

3. **Mobile priority**: Is mobile support required for v1, or desktop-only acceptable?

4. **Visual design system**: Use a component library (Material-UI, Chakra), or custom?

5. **Theme support**: Light mode only, or dark mode too?

## Recommended Approach (To Be Confirmed)

**Suggestion for v1 MVP**:
- Desktop-first (mobile as stretch goal)
- Horizontal timeline at top, conversation below
- Simple chat-bubble UI for messages
- System messages as centered gray text
- Toast notifications for errors
- No drag-and-drop (v2 feature)
- Use component library for faster development (e.g., Chakra UI)
