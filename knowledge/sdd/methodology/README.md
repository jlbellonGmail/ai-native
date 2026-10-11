# SDD methodology (progressive disclosure)

Load one file per phase. The `sdd` skill (`.agents/skills/sdd/SKILL.md`) is the router; this folder is the reusable, evolvable knowledge.

| File | Phase |
|---|---|
| `levels.md` | work units (Task/Feature/Milestone) and levels (light/normal/full) |
| `specification.md` | spec, EARS |
| `clarify.md` | ambiguity handling |
| `planning.md` | plan |
| `tasks.md` | task decomposition and states |
| `implementation.md` | one task, all tasks, TDD, convergence |
| `validation.md` | validation and analysis |
| `review.md` | independent review, severities, convergence loop |
| `change-management.md` | requirement changes |
| `modes.md` | manual/guided/automatic, roles, handoffs |
| `architecture.md` | hexagonal layers, dependency rule, modules, contracts, stack replaceability |
| `autonomy.md` | human_gate (required/final-only/none), status per feature, Constitution inheritance |
| `quality.md` | tests vs review vs CodeQL vs security, TDD in one sentence |
| `migration.md` | renamed/retired names |

Relation to the older package files in `../`: `canonical-flow.md`, `gates.md` and `templates/` define the four mandatory phases (Specify, Plan, Implement, Verify) and their gates; this folder says how to run them proportionally.
