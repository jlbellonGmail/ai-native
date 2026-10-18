# Centralization audit — what is referenced, generated or copied

Baseline: `main` @ `697e927` (merge of PR #92), release `v3.0.2`, `VERSION` `3.0.0-dev` by policy. Evidence: repository inspection and the commands recorded in the PR; GI repositories inspected **read-only**.

> Superseded in part by `KNOWLEDGE-DISTRIBUTION-AUDIT.md`: the detail file and the `.specify/templates` copies are no longer KEEP_LOCAL.

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
| `docs/agents-contract-detail.md` (17.6 KB) | reusable and identical for every project, **but** the release bundle (`runtime/release/bundle.mjs` `INCLUDE_PREFIXES`) ships only `runtime/ contracts/ core/ mcp/ profiles/ audit/ .agents/skills/`: `knowledge/` is not in the cache, so a consumer cannot resolve a reference to it | KEEP_LOCAL for now. Removal was implemented, rejected by the independent review (CRITICAL: dangling pointer) and reverted. Prerequisite for centralizing it: add `knowledge/sdd/` to the bundle (changes the release digest; separate MINOR decision) |
| `.specify/memory/constitution.md` | project constitution, edited per repo | KEEP_LOCAL |
| `.specify/templates/*` (7) | spec/plan/tasks/… templates a repo may tailor; byte-identical to the factory's | KEEP_LOCAL. Not centralized: commands read the local template path and no fallback resolution exists; adding one is a behaviour change for a later MINOR |
| `.agents/prompts/*` (2) | project-level task/recovery prompts used by AGENTS routing | KEEP_LOCAL |
| `specs/README.md`, `docs/security/*`, `docs/testing/*`, `testing/*`, `scripts/validate-testing-profiles.mjs` | project-owned security/testing bootstrap with validators in `template/scripts` | KEEP_LOCAL |
| `template/examples`, `template/scaffolds` | scaffold of the enterprise reference app, not copied into consumers | out of consumer scope |

Outside `templates/project`, `template/` is the enterprise scaffold (generator, validators, reference app); 15 validators in CI reference it, so it is not shrunk without evidence of non-use.

## 4. Results

`template/` is unchanged by this work: no file was removed, because the only candidate (the 17.6 KB detail file) cannot be referenced until `knowledge/sdd/` ships in the release bundle. The honest finding is the gap itself, not a reduction.

Same gap, pre-existing: `.agents/skills/sdd/SKILL.md` says the methodology lives in `knowledge/sdd/methodology/`, which a consumer's cache does not contain. Consumers get the router skill and the command bodies, not the long methodology. Closing it (bundle `knowledge/sdd/`) is the recommended next MINOR, and would also allow removing the template copy.

| Metric | Value |
|---|---|
| `template/` | 180 files / 463,126 B (unchanged) |
| consumer managed files | 5 |
| generated projections per consumer (3 tools) | 46 files / 78,657 B (required by the runtimes) |

## 5. Drift, resolution, compatibility

* Drift: `consumer.mjs --drift` (`detectDrift`) reports `CLEAN | OUTDATED | DRIFT`; `DRIFT` (edited or deleted projection) fails. The L3 gate already warns on adopted-file hash changes.
* Resolution is deterministic: `ai-native.lock.json` → digest-pinned release in the cache (`runtime/bootstrap/install.mjs`) → `core/`, `contracts/`, `runtime/` → `knowledge/` → local overrides (`keepLocal`, project `AGENTS.md`). No absolute path is required.
* Version compatibility: the lock pins `version` + `commit` + `digest`; a central change cannot reach a consumer without a lock bump, so it cannot break one silently. Contract versions are `schemaVersion` fields.
* Offline: the cache makes the bundled surface (runtime, contracts, core, skills) usable without network. `knowledge/` is not bundled, hence the local detail copy above.
* Manifest: `ai-native.lock.json` already is the minimal manifest; no second file was created.
