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

### Spec Compliance & Architecture Review (`agents/spec-compliance.md`)
- Critically evaluates BOTH specification AND code
- Reviews code against spec but applies engineering judgment
- Proposes spec changes when code deviates for good reasons
- Flags spec issues revealed by implementation
- Protects non-negotiable constraints

**When to use**: After Implementation completes a feature, before merging.

### QA/Testing (`agents/qa-tdd.md`)
- Writes tests BEFORE implementation (TDD)
- Verifies implementations pass tests
- Tests game mechanics, state management, persistence
- Ensures high test coverage on core logic

**When to use**: Before Implementation (write tests first), and after Implementation (verify tests pass).

## Workflow

### Standard Implementation Flow

```
Product Owner Request
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
            └─→ Launches Spec Compliance & Architecture Review
                    ↓
                Review Outcomes:

                ┌─→ PASS
                │      ├─→ Launch QA (verify tests)
                │      ├─→ Integrate code
                │      └─→ Report to PM
                │
                ├─→ REJECT (Critical violations)
                │      └─→ Back to Implementation (fix issues)
                │
                ├─→ CONDITIONAL PASS (Reasonable deviation)
                │      ├─→ Tech Lead evaluates proposal
                │      ├─→ Escalate to Product Owner
                │      └─→ Product Owner decides:
                │             ├─→ Approved: Update spec, merge code
                │             ├─→ Rejected: Back to Implementation
                │             └─→ Modified: Update spec, adjust code
                │
                └─→ BLOCKED (Spec issue found)
                       ├─→ Tech Lead validates issue
                       ├─→ Escalate to Product Owner
                       └─→ Product Owner resolves:
                              └─→ Clarify spec, resume implementation
```

### Spec Change Proposal Flow

When implementation reveals spec improvements:

```
Spec Compliance finds reasonable deviation
    ↓
Proposes spec change to Tech Lead
    ↓
Tech Lead evaluates:
    - Technical merit
    - Impact and risk
    - Alternatives
    ↓
Tech Lead escalates to Product Owner with:
    - Clear proposal
    - Rationale
    - Impact analysis
    - Recommendation
    ↓
Product Owner decides:
    ├─→ Approved
    │      ├─→ Tech Lead updates spec files
    │      ├─→ Code merged
    │      └─→ Team notified
    │
    ├─→ Rejected
    │      └─→ Implementation rewrites to match spec
    │
    └─→ Modified
           ├─→ Tech Lead updates spec with PO's version
           └─→ Implementation adjusts if needed
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
2. **Follow the workflow**: PM → Tech Lead → QA (tests) → Implementation → Spec Compliance → (handle review outcome)
3. **Reference spec files**: All agents should reference relevant spec files for their work
4. **Respect constraints**: See `spec/overview.md` for non-negotiable constraints
5. **Propose improvements**: When spec has issues, propose changes through Tech Lead
6. **Product Owner approves all spec changes**: No agent modifies spec without explicit approval
7. **Document decisions**: Record why spec changes were approved/rejected

## Key Constraints (from spec/overview.md)

DO:
1. Use conventional-commit formatting of commit messages

DO NOT:
1. Use a backend (v1 is localStorage only)
2. Truncate or summarize conversation history
3. Make metadata editable after freezing
4. Skip caching on game context
5. Merge conversations or lose per-item isolation
6. Add v2 features to v1
7. Store API key per-game (it's global only)
8. Allow gameplay without API key

## Key Principles

### Spec Evolution
- **Spec is living document**: Implementation insights lead to spec improvements
- **Critical thinking required**: Don't be pedantic for pedantry's sake
- **Product Owner is arbiter**: All spec changes require explicit approval
- **No silent drift**: Code must match spec; if they diverge, propose spec update

### Review Philosophy
- **Protect constraints**: Non-negotiables are truly non-negotiable
- **Apply judgment**: Distinguish real violations from nitpicks
- **Propose improvements**: If implementation is better, update the spec
- **Flag ambiguities**: Don't implement around unclear spec—clarify it

### Collaboration
- **Tech Lead coordinates**: Evaluates proposals, escalates to Product Owner
- **Spec Compliance critiques**: Reviews both code AND spec quality
- **Product Owner decides**: Final say on all spec changes
- **Team implements**: Builds exactly what spec defines

## Current Status

The specification has been organized and agent roles defined with spec evolution workflow.

### Agent Configuration Complete
- ✅ Project Manager (maintains todo list, coordinates work)
- ✅ Tech Lead (handles spec change proposals, delegates work)
- ✅ Implementation (writes code to spec)
- ✅ Spec Compliance & Architecture Review (critical evaluation of spec + code)
- ✅ QA/Testing (TDD approach)

### Next Steps
1. Project Manager reviews current codebase
2. PM creates initial todo list from `spec/implementation-plan.md`
3. PM identifies first task (likely Phase 0: Foundation)
4. PM launches Tech Lead to begin implementation
5. Team iterates with spec evolution as needed
