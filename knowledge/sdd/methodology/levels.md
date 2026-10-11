# Work units and SDD levels

## Work units (never merged)

| Unit | What | Artifacts | Circuit mode |
|---|---|---|---|
| Task | small, concrete, reversible change (simple bug, local change, config, small refactor, point doc) | none required beyond objective, scope, acceptance, test, evidence | `Maintenance` |
| Feature | one functional capability | `specs/NNN-slug/{spec,plan,tasks}.md` | `Feature` |
| Milestone | coherent set of Features and Tasks | one manifest; each member keeps its own artifacts; never one mega-spec | `Milestone` |

The command name never decides the unit: `/feature "fix balance rounding"` is a Task at level light.

## Levels

Select by **risk, scope, reversibility, impact, complexity, criticality, uncertainty** — not by file count alone. `selectLevel` in `runtime/circuit/sdd-workflow.mjs` scores each dimension 0..2.

| Level | Circuit | When | Flow |
|---|---|---|---|
| light | LIGHT | low risk, reversible, clear | objective, scope, acceptance, implementation, sufficient test, evidence |
| normal | STANDARD | new capability or real design decision | spec, clarify only if ambiguous, plan, tasks, implement, test, review, validate |
| full | FULL | critical, architecture, migration, security, breaking change, relevant Milestone | normal + formal clarify, analysis, architecture/security/compatibility review, independent Reviewer, expanded evidence |

Forced to full: security, migration, breaking change, architecture, any highly irreversible/critical dimension.
A heavy Task is promoted to Feature instead of inflating its artifacts. `light` minimizes artifacts, agents, context, gates, handoffs and latency.

## Context rule

Always-on context is `AGENTS.md`. Everything else is loaded per phase: skill, then the one methodology file, then the active spec/task.
