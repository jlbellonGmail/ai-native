# Modes, roles and handoffs

One methodology, three experiences. Only the driver changes.

| Mode | Driver | Typical use |
|---|---|---|
| manual | the user runs each phase | `/sdd-spec` -> `/sdd-plan` -> `/sdd-tasks` -> `/sdd-implement` |
| guided | the system derives state and the next step | `/sdd-status` prints phase, progress and the exact next command |
| automatic | the Coordinator runs the flow | `/feature "<goal>"`, `/sdd-implement-all`; ends at the human merge gate |

## Roles (conceptual) and runtime ids

| Role | Does | Runtime id | Writes |
|---|---|---|---|
| Coordinator | classify, route, delegate, validate handoffs, converge, track state; never implements | main session (no agent, no extra permissions) | state only |
| Planner | spec, clarification synthesis, plan, tasks | `planner` | spec artifacts |
| Implementer | executes tasks, TDD, evidence | `builder` | code and tests |
| Reviewer | independent read-only review | `reviewer` | nothing |

`Implementer` is the conceptual name of the runtime `builder`; there is one role, not two. The runtime id stays `builder` for the whole 3.x line because it is part of every consumer's generated adapters.

## Handoff

A handoff carries `from`, `to`, `phase`, `workUnit`, `level` and `artifacts` (paths). Phases never rely on hidden chat context: a receiving role reads the listed artifacts. `validateHandoff` rejects incomplete handoffs.

Runtime-specific files (`.claude/`, `.opencode/`, `.codex/`) are generated projections of this model, never its source.
