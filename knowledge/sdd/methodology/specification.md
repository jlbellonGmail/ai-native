# Specification (`spec.md`) and EARS

`spec` answers WHAT and WHY. No stack, architecture or file names unless they are a legitimate constraint.

## Sections

Context and goal · users · user stories · definitions (only where a term can be read two ways) · functional requirements · non-functional requirements · edge cases · non-goals · acceptance criteria · open questions (`[NEEDS CLARIFICATION] <question>`).

Status: `draft | approved | implemented`.

## EARS requirements

```text
RF-1. WHEN <event>, THE SYSTEM SHALL <response>.
RF-2. IF <unwanted condition>, THEN THE SYSTEM SHALL <response>.
RF-3. WHILE <state>, THE SYSTEM SHALL <response>.
RF-4. THE SYSTEM SHALL <permanent behavior>.
```

Use EARS where it removes ambiguity; do not force it on prose that is already exact. Every requirement is verifiable: no "fast", "intuitive" or "nice" without a measurable criterion. Identifiers (`RF-n`) are stable and never renumbered; tasks and tests cite them.

## Autonomous mode

Resolve open questions from evidence; otherwise apply a documented default and list it under assumptions. Escalate only a real block.
