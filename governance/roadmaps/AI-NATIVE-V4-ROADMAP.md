# AI-NATIVE v4.0.0 roadmap

Status: **PLANNING_COMPLETE / IMPLEMENTATION_AWAITING_HUMAN_APPROVAL**
Authority: user goal `GOAL-V4.md`, current execution evidence and SDD artifacts.

This roadmap is an additive v4 work unit. It does not reopen completed v3
roadmaps or authorize merge, main promotion, tags or releases.

| Order | Feature | State | Dependency | Evidence |
|---|---|---|---|---|
| 1 | `001-dependency-graph` | pending human plan approval | none | `specs/001-dependency-graph/` |
| 2 | `002-native-acceptance` | pending human plan approval | 001 | `specs/002-native-acceptance/` |
| 3 | `003-acceptance-integration` | pending human plan approval | 001, 002 | `specs/003-acceptance-integration/` |

## Gate

The trusted `develop` control-plane configuration includes `contracts/**`.
The actual Coordinator flow therefore returns `AWAITING_HUMAN_APPROVAL` after
planning and before implementation. See `governance/execution/current/V4-AUDIT.md`.
No task checkbox may be marked done until explicit human approval of these plans.

## Completion conditions

All feature tasks are done with current validation evidence; real pilot results
or justified BLOCKED records are preserved; final independent review is runtime
attested or correctly remains `REVIEW_PENDING`; PR is prepared for human merge.
Human merge, release promotion, tag and publication are out of scope.
