# SDD professional evolution — audit, gap analysis and measurements

Initiative started by explicit user instruction after the closed baseline. Baseline (verified with `gh` and Git, not assumed):

| Item | Value |
|---|---|
| PR | #91 `docs: cierre formal de la iniciativa (baseline v3.0.2)`, state `MERGED` 2026-10-10 |
| Merge commit / initial HEAD | `ed364a960867673815176ebd5ecb14312d414fb2` (`main`, clean tree) |
| Commits in the PR | `f1d3e89`, `925da8f` |
| Version / last tag | `VERSION` = `3.0.0-dev` (by policy); last release and tag `v3.0.2` |
| Governance | `STATUS: PLATFORM_CLEAN_AND_STABLE`, `INITIATIVE: CLOSED`, stable baseline `v3.0.2` — not reopened, not refactored |
| Local validators on baseline | all PASS (foundation, knowledge, template validators, parity `UNMAPPED=0`, contracts, core, compat, integrity, entrypoints, doc-drift, ci-listed, m52, audit, evals l1, full `node --test` suite) |

## 1. Reference project (MyStudyDiary) — read only, not modified

One commit (`24562d3`). Everything agent-related is OpenCode-flavoured and lives under `.opencode/`, `.agents/skills/`, `docs/` and `specs/`.

### Commands (11, all in `.opencode/commands/`)

| Command | Agent | Does | Gate / HITL | Disposition |
|---|---|---|---|---|
| `feature` | plan | plan a change without touching files | user approves plan | ADAPT: becomes the routing entry (Task/Feature/Milestone + level) |
| `sdd-spec` | planner | up to 5 questions, writes `spec.md` (EARS, draft) | questions | ADOPT, autonomous mode resolves from evidence |
| `sdd-clarify` | reviewer-style | QA of the spec, detect only | stop for approval | ADAPT: detect + resolve with documented defaults |
| `sdd-plan` | planner | `plan.md` from spec | user approval | ADOPT |
| `sdd-tasks` | planner | `tasks.md`, max ~10 | user approval | ADOPT; states `[ ]`,`[x]`,`[!]` |
| `sdd-implement` | build | one task, tests first, then STOP | — | ADOPT (already the canonical name) |
| `sdd-implement-all` | build | all tasks, stop on first failure | — | IMPROVE: bounded convergence, suite, review, validation |
| `sdd-validate` | reviewer | RF by RF validation, verdict line | — | ADOPT |
| `sdd-change` | planner | requirement change, spec first | user approves diff | ADOPT |
| `sdd-status` | plan | phase and next step | — | IMPROVE: derived deterministically from artifacts |
| `sdd-constitution` | planner | writes `docs/constitution.md` | user approval | REJECT: constitutions already exist (a third one would break the single hierarchy) |

Not present in the reference: `sdd-analyze` (new here), `sdd-implementer`, `sdd-implementer-all` (the reference already uses the canonical names; global search found no use of the retired names anywhere).

### Agents (`.opencode/agents/`)

| Agent | Responsibility | Permissions | Disposition |
|---|---|---|---|
| coordinator | runs the SDD flow, delegates, forwards context; edit/shell denied | delegate to 3 subagents only | ADAPT: conceptual role (no spawnable agent, no extra permissions) |
| cordinator.md | typo duplicate of coordinator with other subagent names | — | REJECT (duplicate) |
| planner-agent | spec/plan/tasks; edit only `specs/**` | no shell | MERGE into runtime `planner` |
| implementer-agent | one task, tests first, shell allowed | no subagents | MERGE into runtime `builder` (conceptual Implementer) |
| reviewer-agent | read-only; verdict line | read-only | MERGE into runtime `reviewer` (conceptual Reviewer; same as Inspector) |

### Skills, templates, memory

| Item | Kind | Disposition |
|---|---|---|
| `sdd` skill (flow, spec template, EARS, tasks format) | methodology | ADOPT → `knowledge/sdd/methodology/*` + thin router skill |
| `grill-me` | interview technique | MERGE into clarify methodology (one question at a time, bounded) |
| `systematic-debugging` (13 files) | general debugging method, third party | REJECT for now (not SDD; candidate for a separate knowledge asset) |
| `find-skills`, `writing-guidelines`, `frontend-design` | third-party/generic | REJECT (consumer-local if wanted) |
| `local-dates` | project-specific rule | consumer-local (stays in that project) |
| `docs/constitution.md` (6 project principles) | project constitution | consumer-local |
| `MEMORY.md` (42 lines, hand-updated after each task) | auxiliary state | REJECT as authoritative; memory stays auxiliary, Git/governance/evidence are the truth |
| `opencode.json`, `skills-lock.json` | runtime config | adapter (already generated here) |
| `tests/` (4 `node --test` files) | project tests | consumer-local |

Key behaviour difference: the reference **stops at every phase for human approval**. Here the same methodology also runs automatically; the only human gate is the final merge.

## 2. ai-native — what already existed

Work units Feature/Maintenance/Milestone and a circuit with deterministic ASSESS, `LIGHT/STANDARD/FULL` levels, a state machine, convergence (`decideConvergence`), review runs, roles `planner/builder/reviewer`, skills with lazy materialization, adapters for Claude/Codex/OpenCode, consumer adoption with journal, drift/integrity/parity validators. **Missing:** a canonical command catalog, `/feature` routing, `/sdd-implement-all` as an executable loop, a Coordinator concept, `sdd-analyze`, tasks.md states and a validator for the spec folder, guided-mode status, and an upgrade that applies only a delta.

## 3. Gap analysis

| Capability | MyStudyDiary | ai-native (before) | Decision | Destination | Why |
|---|---|---|---|---|---|
| Work units Task/Feature/Milestone | implicit | Maintenance/Feature/Milestone | IMPROVE | foundation (`contracts`, `runtime`) | Task is the conceptual name of `Maintenance`; no rename of runtime ids |
| Levels light/normal/full | none | LIGHT/STANDARD/FULL | KEEP + IMPROVE | foundation + knowledge | multi-dimension selection instead of file count alone |
| Command catalog | 11 OpenCode files | none | ADOPT | foundation (contract) + adapter (projection) | one source, N tool projections |
| `/feature` router | planning prompt | none | ADAPT | foundation + knowledge | classifies, never forces a Feature |
| spec/clarify/plan/tasks | prompts | templates in `knowledge/sdd` | ADOPT | knowledge | methodology, loaded on demand |
| implement (one) | yes | circuit build step | ADOPT | foundation | |
| implement-all | stop on failure | none | IMPROVE | foundation (`implement-all.mjs`) | bounded convergence + suite + review |
| validate / analyze | validate | review runs | ADOPT / new | foundation | analyze is read-only pre-implementation |
| change / status | yes | recovery only | ADOPT / IMPROVE | knowledge + foundation | status derived from artifacts |
| Coordinator | OpenCode agent | implicit main session | ADAPT | foundation contract | no new spawnable agent, no new permissions |
| Planner/Implementer/Reviewer | OpenCode agents | planner/builder/reviewer | MERGE | foundation (`core/agents.json` kept) | one role each; Builder is the Implementer, Inspector is the Reviewer |
| TDD | tests first | builder rules | KEEP + IMPROVE | knowledge | "where it makes technical sense" |
| Constitution | `docs/constitution.md` | `core/` + `.specify/` | KEEP | — | no third constitution |
| Memory | `MEMORY.md` authoritative-ish | Git/governance/STATUS | REJECT as authority | none | memory is auxiliary only |
| Runtime-specific files | `.opencode/*` canonical | generated adapters | KEEP | adapter | `.claude/commands`, `.opencode/commands` are projections |
| AGENTS.md | 45 lines | 883 lines | REPLACE | router | lossless: the full previous text is kept verbatim in `knowledge/sdd/agents-contract-detail.md` (factory-only) |
| Template upgrade | none | adopt (create-only) | IMPROVE | foundation | delta-only upgrade preserving local edits |

## 4. Consumption reality (documented, not assumed)

| Piece | How a v3 consumer gets it |
|---|---|
| foundation/knowledge/runtime/core | **referenced and pinned**: `ai-native.lock.json` pins a release; bootstrap downloads it into a content-addressed cache (verified, with rollback). Not copied. |
| per-tool adapters, role files, skills, commands | **generated** deterministically from the pinned release by `runtime/adapters/consumer.mjs`, brownfield-safe, journaled, revertible |
| `template/` payload (`templates/project`, scaffolds, generators) | **copied** into *new* generated projects by the generator; v3 consumers do not receive it |

## 5. `template/` classification

`template/` is the generator and scaffold source for new generated projects, not what a v3 GI consumer holds. Consumer footprint is measured by `evaluation/metrics`: 5 managed files (limit 12).

| Group | Files | Class | Justification |
|---|---|---|---|
| `templates/project/AGENTS.md` | 1 | REQUIRED_LOCAL, now a router | a generated project must be self-contained (factory contract) |
| `templates/project/docs/agents-contract-detail.md` | 1 (new) | REQUIRED_LOCAL | the detail moved out of always-on context; same project, loaded on demand |
| `templates/project/.specify/**` (8) | 8 | REQUIRED_LOCAL (KEEP, debt noted) | duplicates `knowledge/sdd/templates`; self-containment contract forbids referencing the factory; candidate to retire when `templates/project` is replaced by the lock-based model |
| `templates/project/CLAUDE.md`, `OPENCLAW.md` | 2 | ADAPTER | thin bridges |
| `templates/project/{scripts,testing,docs/security,specs}` | 6 | REQUIRED_LOCAL | executable per-project checks |
| `scaffolds/`, `generators/`, `examples/`, `validation/`, `scripts/`, `config/`, `docs/`, `manifests/` | 150+ | CONSUMER_SPECIFIC / GENERATED source | referenced by 15 template validators; none proven REMOVABLE with evidence, so none removed |

Nothing was deleted from `template/`: removing the `.specify` duplicates breaks the self-containment contract and removing others breaks validators. The honest gain is always-on context, not file count.

## 6. Measurements (before → after, same method: `git ls-files`, tokens ≈ bytes/4)

| Subject | Files | Lines | Bytes | ≈ Tokens |
|---|---|---|---|---|
| Factory `AGENTS.md` | 1 → 1 | 883 → 190 | 20,185 → 14,035 | 5,046 → 3,508 (−30%) |
| `template/templates/project/AGENTS.md` | 1 → 1 | 822 → 145 | 17,098 → 10,350 | 4,275 → 2,588 (−39%) |
| `template/` (whole area) | 179 → 180 | 15,238 → 15,387 | 460,762 → 471,602 | 115,190 → 117,900 (+2.4%) |
| Consumer managed files (lock + entry points) | 5 → 5 | — | 2,167 → 2,182 | — |
| Consumer derived files (generated adapters/skills/commands) | 15 → 42 | — | 49,310 → 78,788 | — |
| Skill frontmatter always-on (kernel + skills) | — | — | — | 702 → 753 (+51, limit 2,500) |

Reading: always-on context fell by roughly 1,500 tokens in the factory and 1,700 in the generated-project template; the new skill adds 51. The project template pays for it with one on-demand file (`docs/agents-contract-detail.md`, a lossless copy of the old contract, ~17 KB) in every newly generated project: a generated project must stay self-contained, so the detail cannot live only in the platform. This is an explicit trade-off of always-on tokens against on-disk bytes; it is why `template/` grew 2.4% instead of shrinking. Consumer-owned tracked files do not change; the derived set grows because the 11 commands are projected per tool (22 files) plus the `sdd` skill mirrors. Byte reduction versus the v2 baseline stays above the 0.90 target (0.9135 with derived files). The `template/` area itself did not shrink; the reduction goal there was met only for always-on context. Derived consumer files grow +60% in bytes (49,310 → 78,788) and 2.8× in count because 11 commands are projected for two tools; they are regenerable and not part of the managed set.

## 7. Anti-duplication, orphans, security

* Duplicates found: two constitutions with different scope (kept, hierarchy documented); `.specify/templates` vs `knowledge/sdd/templates` vs `templates/project/.specify` (kept, noted above); task-execution procedure vs old AGENTS phases (resolved: AGENTS routes, detail in one reference). No duplicate roles introduced (`builder` is the Implementer).
* Orphans: tests prove every command body is declared and every declared body exists; no retired command name appears in the repo outside migration notes.
* Security: commands add no permissions. Read-only commands pre-approve only `Read, Grep, Glob` (Claude Code `allowed-tools` pre-approves; it is not a sandbox, so running the test suite in `sdd-validate` still goes through the normal permission prompt) and use the `plan` agent on OpenCode. No command body asks for network, installs or secrets; `implement-all` never merges; the upgrade never overwrites a locally edited file and writes its journal atomically. Not covered: symlink resolution in `safeJoin` (inherited from `adopt.mjs`).
