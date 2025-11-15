# Claude Code Sub-Agent Configuration

This directory contains persistent sub-agent configurations for the Microscope RPG AI Assistant project.

## Agent Roles

### Project Manager (`agents/project-manager.md`)
- Maintains big picture and full spec context
- Keeps persistent todo list
- Determines next atomic task
- Coordinates all other agents
- Escalates underspecified areas to user

**When to use**: Always start here. PM decides what to work on next and launches appropriate agents.

### Tech Lead (`agents/tech-lead.md`)
- Reads spec and breaks down tasks
- Delegates to Implementation agent
- Integrates work from sub-agents
- Requests reviews and testing
- Asks user for clarification on ambiguities

**When to use**: When PM identifies a task that needs breakdown or coordination.

### Implementation (`agents/implementation.md`)
- Writes TypeScript/React code
- Follows spec exactly
- Uses types from spec/data-model.md
- Respects all constraints
- Does not add features not in spec

**When to use**: When Tech Lead has a clearly defined implementation task.

### Spec Compliance Checker (`agents/spec-compliance.md`)
- Reviews code against specification
- Flags any deviations (pedantically)
- Checks data model, constraints, flows
- Provides detailed review reports

**When to use**: After Implementation completes a feature, before merging.

### QA/Testing (`agents/qa-tdd.md`)
- Writes tests BEFORE implementation (TDD)
- Verifies implementations pass tests
- Tests game mechanics, state management, persistence
- Ensures high test coverage on core logic

**When to use**: Before Implementation (write tests first), and after Implementation (verify tests pass).

## Workflow

```
User Request
    ↓
Project Manager
    ├─→ Identifies next task
    ├─→ Updates todo list
    └─→ Launches Tech Lead
            ↓
        Tech Lead
            ├─→ Breaks down task
            ├─→ Launches QA (write tests first)
            ├─→ Launches Implementation
            ├─→ Launches Spec Compliance (review)
            └─→ Launches QA (verify tests pass)
```

## Spec Organization

The specification has been split into thematic files:

- `spec/overview.md` - Project goals, constraints, version scope
- `spec/data-model.md` - TypeScript type definitions
- `spec/game-phases.md` - Setup, Initial Round, Playing phases
- `spec/conversations.md` - Meta and per-item conversation architecture
- `spec/ai-commands.md` - AI command formats and parsing
- `spec/api-integration.md` - Claude API usage and prompt caching
- `spec/state-management.md` - React state patterns
- `spec/ui-components.md` - Component hierarchy and UI flows
- `spec/implementation-plan.md` - Implementation phases and checklist
- `spec/open-questions.md` - Questions for user
- `spec/underspecified/` - Areas needing more specification

## Underspecified Areas

Items in `spec/underspecified/` need user input before full implementation:

1. `command-error-handling.md` - How to handle AI command parsing errors
2. `system-prompts.md` - Exact content of system prompts
3. `state-update-patterns.md` - Optimistic updates, concurrency, persistence
4. `ui-design.md` - Visual layout, timeline design, responsive behavior
5. `player-management.md` - AI persona creation and management UX
6. `testing-approach.md` - Testing framework, coverage targets, TDD scope

## How to Use

1. **Start with Project Manager**: Always begin by consulting PM agent to determine next task
2. **Follow the workflow**: PM → Tech Lead → QA (tests) → Implementation → Spec Compliance → QA (verify)
3. **Reference spec files**: All agents should reference relevant spec files for their work
4. **Respect constraints**: See `spec/overview.md` for non-negotiable constraints
5. **Flag ambiguities**: When spec is unclear, escalate to user (don't guess)

## Key Constraints (from spec/overview.md)

DO NOT:
1. Use a backend (v1 is localStorage only)
2. Truncate or summarize conversation history
3. Make metadata editable after freezing
4. Skip caching on game context
5. Merge conversations or lose per-item isolation
6. Add v2 features to v1
7. Store API key per-game (it's global only)
8. Allow gameplay without API key

## Current Status

The specification has been organized and agent roles defined. Next steps:
1. Project Manager reviews current codebase
2. PM creates initial todo list from `spec/implementation-plan.md`
3. PM identifies first task (likely Phase 0: Foundation)
4. PM launches Tech Lead to begin implementation
