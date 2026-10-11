# Centralization audit — what is referenced, generated or copied

Baseline: `main` @ `697e927` (merge of PR #92), release `v3.0.2`, `VERSION` `3.0.0-dev` by policy. Evidence: repository inspection and the commands recorded in the PR; GI repositories inspected **read-only**.

## 1. Capability inventory (ai-native)

| Capability | Canonical path | Type | Local projection | Consumer copy | Generated | Versioned |
|---|---|---|---|---|---|---|
| Command bodies (11) | `core/commands/*.md` + `contracts/sdd-workflow.json` | data + contract | `.claude/commands`, `.opencode/commands` (Codex: none, via AGENTS router + skill) | no | yes (`runtime/adapters/commands.mjs`) | release digest |
| `sdd` skill | `.agents/skills/sdd/SKILL.md` + `knowledge/sdd/methodology/` | skill + knowledge | `.claude/skills/sdd`, `.opencode/skills/sdd` (runtimes need a real `SKILL.md`) | no | yes (`skills.mjs`) | release digest |
| Coordinator, work units, levels, modes | `runtime/circuit/{coordinator,sdd-workflow,implement-all}.mjs`, `contracts/sdd-*.json` | executable runtime | none (runs from the pinned release) | no | n/a | release digest |
| Planner / Builder (=Implementer) / Reviewer (=Inspector) | `core/agents.json` | data | `.claude/agents`, `.opencode/roles`, `.codex/*.config.toml` | no | yes (`claude/opencode/codex.mjs`) | release digest |
| Methodology, EARS, clarify, TDD, review, change mgmt | `knowledge/sdd/methodology/*`, `.specify/memory/constitution.md` | knowledge | none | no | n/a | release digest |
| Upgrade / drift | `runtime/migrate/{adopt,upgrade-delta}.mjs`, `runtime/adapters/consumer.mjs` | executable | n/a | no | n/a | release digest |
| Consumer manifest | `ai-native.lock.json` (`contracts/lock.schema.json`) | data | n/a | the only managed file | no | schemaVersion 1 |

Every reusable capability already has one canonical home and a generator. A v3 consumer holds `ai-native.lock.json` plus generated, journaled, hash-checked projections. No manual copy is required by design.

## 2. Real consumers (read-only)

`gi-clinicadental`, `gi-ocr`, `gi-ot`, `gi-common-{crm,persons,tenants}`, `gi-platform-core`, `gi-vertical-dental` (found in `C:\Proyectos`; `D:\proyectos` absent). All are generation-1 adopters: no `ai-native.lock.json`, no `.claude/commands`, no `.opencode/commands`, no `sdd` skill, no `.specify`.

| Local item (all 8 repos) | Classification | Evidence |
|---|---|---|
| `.agentic/roles/{planner,reviewer}.md` (15–22 files, 6–31 KB per repo) | LEGACY_COPY of roles | replaced by generated `.claude/agents`, `.opencode/roles` |
| `.claude/agents/{planner,reviewer}(-agent).md`, `.codex/*.config.toml`, `.opencode/agent/*` | LEGACY_COPY, becomes GENERATED_PROJECTION after adoption | same role set, hand-maintained per repo |
| `.claude/skills`, `.opencode/skills`, `.agents/skills` (0.4–26 KB) | LEGACY_COPY of skills | superseded by lazily selected generated mirrors |
| `docs/{tecnica,usuario}/sdd-adaptativo.md` (5 repos) | REDUNDANT_COPY of methodology | now `knowledge/sdd/methodology/` |
| `AGENTS.md` (96–447 lines) | LOCAL_REQUIRED, reducible to the router | router is 145 lines plus local config |
| `CONSTITUTION.md`, `STATUS.md`, `ROADMAP.md`, `GOAL.md`, `specs/`, `opencode.json`, `.mcp.json`, product code | LOCAL_REQUIRED / LOCAL_PRODUCT_SPECIFIC | project state and configuration |

No GI repository contains a copy of a canonical SDD command (none exist there yet), so nothing needs removal for commands. The batch adds projections and retires legacy role/skill copies through the journaled delta (`keepLocal` preserves anything edited).

## 3. Template, file by file (`template/templates/project`, the per-project bootstrap)

| Path | Why local | Decision |
|---|---|---|
| `AGENTS.md`, `CLAUDE.md`, `OPENCLAW.md` | tool entrypoints must exist in the repo | KEEP_LOCAL (router, thin) |
| `docs/agents-contract-detail.md` (17.6 KB) | no technical reason: reusable, identical for every project | REFERENCE — removed; `AGENTS.md` points to `knowledge/sdd/agents-contract-detail.md` of the pinned release (lock + content-addressed cache, offline-capable) |
| `.specify/memory/constitution.md` | project constitution, edited per repo | KEEP_LOCAL |
| `.specify/templates/*` (7) | spec/plan/tasks/… templates a repo may tailor; byte-identical to the factory's | KEEP_LOCAL. Not centralized: commands read the local template path and no fallback resolution exists; adding one is a behaviour change for a later MINOR |
| `.agents/prompts/*` (2) | project-level task/recovery prompts used by AGENTS routing | KEEP_LOCAL |
| `specs/README.md`, `docs/security/*`, `docs/testing/*`, `testing/*`, `scripts/validate-testing-profiles.mjs` | project-owned security/testing bootstrap with validators in `template/scripts` | KEEP_LOCAL |
| `template/examples`, `template/scaffolds` | scaffold of the enterprise reference app, not copied into consumers | out of consumer scope |

Outside `templates/project`, `template/` is the enterprise scaffold (generator, validators, reference app); 15 validators in CI reference it, so it is not shrunk without evidence of non-use.

## 4. Results (blob sizes from git, same method before and after)

| Metric | Before (`697e927`) | After |
|---|---|---|
| `template/` files | 180 | 179 |
| `template/` bytes | 463,126 | 445,785 (−3.7 %) |
| `templates/project` files / bytes | 20 / 62,203 | 19 / 44,862 (−27.9 %) |
| project `AGENTS.md` | 145 lines / 10,350 B | 145 lines / 10,597 B (longer pointer; the 17.6 KB copy is gone) |
| consumer managed files | 5 | 5 |
| generated projections per consumer (3 tools) | 46 files / 78,657 B | unchanged (required by the runtimes) |

The earlier figure of 471,602 B for `template/` came from a different counting method; only the table above is comparable.

## 5. Drift, resolution, compatibility

* Drift: `consumer.mjs --drift` (`detectDrift`) reports `CLEAN | OUTDATED | DRIFT`; `DRIFT` (edited or deleted projection) fails. The L3 gate already warns on adopted-file hash changes.
* Resolution is deterministic: `ai-native.lock.json` → digest-pinned release in the cache (`runtime/bootstrap/install.mjs`) → `core/`, `contracts/`, `runtime/` → `knowledge/` → local overrides (`keepLocal`, project `AGENTS.md`). No absolute path is required.
* Version compatibility: the lock pins `version` + `commit` + `digest`; a central change cannot reach a consumer without a lock bump, so it cannot break one silently. Contract versions are `schemaVersion` fields.
* Offline: the cache makes a pinned release usable without network; that is not a reason to duplicate files in the repo.
* Manifest: `ai-native.lock.json` already is the minimal manifest; no second file was created.
