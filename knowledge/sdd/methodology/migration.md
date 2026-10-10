# Migration notes

Naming rule: **Implementer is the ROLE, implement is the ACTION.** The canonical commands are `/sdd-implement` and `/sdd-implement-all`.

Retired names (declared in `contracts/sdd-workflow.json` `retiredNames`, enforced by tests): `sdd-implementer`, `sdd-implementer-all`, `sdd-planner`, `sdd-validator`, `sdd-tasks-all`.

No alias is kept: no consumer in the repository or in the reference project uses them (searched globally). The reference project (MyStudyDiary) already uses `/sdd-implement` and `/sdd-implement-all`; its `/sdd-constitution` is not adopted because constitutions already have canonical homes and a new one would add a third: `core/constitution.md` (platform principles) and `.specify/memory/constitution.md` (factory SDD principles). Authority order stays `AGENTS.md` -> constitution -> contracts and skills -> active work unit.

Existing v3.0.x consumers: nothing breaks. New projections appear as additive files (`.claude/commands/*`, `.opencode/commands/*`, skill `sdd`); apply them with the delta-only upgrade (`runtime/adapters/consumer.mjs --plan` shows the delta before anything is written).
