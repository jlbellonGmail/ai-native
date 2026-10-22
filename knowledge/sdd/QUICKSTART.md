# SDD in five minutes

```text
Small change                    /feature "fix the balance calculation"
Control every phase (manual)    /sdd-spec 001-balance "..."  ->  /sdd-plan 001-balance  ->  /sdd-tasks 001-balance  ->  /sdd-implement 001-balance T1
Where am I? (guided)            /sdd-status 001-balance      ->  prints the phase and the exact next command
All tasks, no stops             /sdd-implement-all 001-balance
Hands-off (automatic)           /feature "<goal>" in automatic mode: the Coordinator runs everything and stops at the merge
Large initiative                Milestone: the Coordinator splits it into Features and Tasks
```

## What `/feature` decides for you

| You describe | It becomes | Level | Artifacts |
|---|---|---|---|
| a small, reversible change | Task | light | none: objective, test, evidence |
| one new capability | Feature | normal | `specs/NNN-slug/spec.md`, `plan.md`, `tasks.md` |
| security, migration, breaking or architectural change | Feature | full | normal + formal clarify and extra reviews |
| several capabilities | Milestone | full | one Feature/Task per capability, never a mega-spec |

## The four roles

Coordinator routes and tracks state. Planner writes spec, plan, tasks. Implementer builds one task at a time, tests first. Reviewer checks independently and never edits; when the tool cannot run it isolated, the result says `REVIEW_PENDING` instead of approving. You always keep the final merge.

## Other commands

`/sdd-clarify` removes ambiguity (skipped when there is none) · `/sdd-analyze` checks spec/plan/tasks agree before coding · `/sdd-validate` checks the result against the spec · `/sdd-change` handles a new requirement: spec first, code last.

If a task cannot be made to pass within its budget, the whole unit stops as blocked with the evidence; nothing is reported as done that is not.

Details per phase: `knowledge/sdd/methodology/`. Contract: `contracts/sdd-workflow.json`.

## Autonomy, status and architecture (one line each)

* Hands-off for a low-risk change: declare `autonomy: full` and `human_gate: none`; it is derived from the real diff and the repo policy, so high risk, protected areas or a repo without `allowNone` refuse it and say why. Merge and release stay human (`methodology/autonomy.md`).
* Where am I: `/sdd-status <spec>` prints STATE, PROGRESS, LAST COMPLETED, NEXT, BLOCKERS, derived from `tasks.md`; there is no status file to maintain.
* Layers and modules: domain, application, infrastructure, interfaces; modules talk through contracts (`methodology/architecture.md`, optional check `runtime/policy/architecture.mjs`).
