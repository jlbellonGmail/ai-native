# Professional final evolution — audit (candidate v3.1.0)

Baseline: PR #92 (`697e927`), #93 (`f040d54`), #94 (`eac3ea1`) merged; `main` = `eac3ea1`; latest published release `v3.0.2`; `v3.1.0` not published. Baseline suite on `main`: 787/788 (the one failure is the known git-clone environment signature of the "real starter" tests, see `governance/versioning/V3.0.2-PATCH.md`, "Estabilidad"); it did not recur.

## What already existed (reused, not rebuilt)

Task / Feature / Milestone, light / normal / full, manual / guided / automatic, the 11 commands (`core/commands/*`, projected), Coordinator + Planner / Implementer / Reviewer (`contracts/sdd-workflow.json`, runtime id `builder` kept), `/sdd-implement`, `/sdd-implement-all`, bounded convergence, TDD guidance (`methodology/implementation.md`), `deriveSddStatus`, central `knowledge/sdd` shipped in the release, CodeQL in CI, `safeJoin` / symlink / resolver / hash / cache protections of #94.

## What was missing and was added

| Gap | Where | Test |
|---|---|---|
| Human gate per work unit by risk (`required` / `final-only` / `none`), `none` explicit and low-risk only, protected cases stay `required` | `contracts/hitl-policy.*`, `runtime/policy/hitl.mjs` | `hitl.test.mjs` |
| Constitution inheritance: central is the default; local extension additions-only; overrides rejected structurally | `contracts/constitution-extension.*`, `runtime/policy/constitution-extension.mjs` | `constitution-extension.test.mjs` |
| Hexagonal layers, dependency direction, module public contracts, forbidden imports (optional contract) | `contracts/architecture.schema.json`, `runtime/policy/architecture.mjs`, `methodology/architecture.md` | `architecture.test.mjs` (hexagonal, direction, modules A/B, adapter swap with real modules) |
| Feature status derived (STATE, PROGRESS, LAST COMPLETED, NEXT, BLOCKERS), no status file | `formatSddStatus`, `/sdd-status` | `sdd-workflow.test.mjs` |
| TDD red → green → refactor evidence | `methodology/quality.md` | `tdd-cycle.test.mjs` |
| QA / review / CodeQL / security told apart; autonomy, status, Constitution in one guide | `methodology/{quality,autonomy}.md` | doc drift, knowledge package validator |
| Short human spec template | `feature-templates/spec-template.md` (153 → 31 lines) | — |
| Consumer inherits, resolves the new guides centrally, template stays minimal | — | `consumer-e2e.test.mjs` (2 tests) |

Decisions: no `status.md` (derivable, so it would diverge); no new framework or role; architecture check is opt-in (no contract = `NOT_APPLICABLE`); the factory's own `.specify/memory/constitution.md` stays (factory SDD, not a consumer file).

## Template (`templates/project`, 12 files → 11)

| Path | Class | Why |
|---|---|---|
| `AGENTS.md` | KEEP_LOCAL (router, project facts) | pointers resolve centrally (test) |
| `CLAUDE.md`, `OPENCLAW.md` | KEEP_LOCAL (thin bridges) | required entrypoints |
| `.specify/memory/constitution.md` | **REMOVE** (6.5 KB) | duplicated `core/constitution.md`; now an optional additions-only extension, absent by default |
| `specs/README.md` | KEEP_LOCAL | where specs live; points to central templates |
| `.agents/prompts/*` (2) | KEEP_LOCAL (debt noted) | project-run prompts, small |
| `docs/security/SECURITY-BOOTSTRAP.md`, `docs/testing/*` | KEEP_LOCAL | project facts to fill |
| `scripts/validate-testing-profiles.mjs`, `testing/**` | KEEP_LOCAL | executable per-project test profiles |

Not removed for aesthetics: the remaining files hold project facts or executable project checks.

## Measurements (before → after)

| Item | Before | After |
|---|---|---|
| project template files / bytes | 12 / 38,344 | 11 / 31,805 |
| whole `template/` files / bytes | 172 / 438,423 | 171 / 432,217 |
| factory `AGENTS.md` | 14,061 B | 14,061 B (unchanged) |
| project template `AGENTS.md` | 11,311 B | 11,493 B (+182: constitution rule, replaces the removed file) |
| spec template | 153 lines | 31 lines |
| official suite | 788 tests (787 pass) | 815 tests, 815 pass, 0 fail (≈250 s) |
| always-on context | `AGENTS.md` router + `sdd` skill description | same; the three new guides are loaded on demand |

## Not executed

Codex CLI and Headroom end-to-end runs: NOT_RUN unless the environment provides them (see the PR report). GI repositories: not touched; the adoption goal was updated (`knowledge/sdd/goals/GI-BATCH-UPGRADE.goal.md`).

## Note on older audits

`KNOWLEDGE-DISTRIBUTION-AUDIT.md` and `CENTRALIZATION-CONSUMER-AUDIT.md` record the state at their date, when the project template still carried a full constitution. That file is now removed; the current model is in this document and `knowledge/sdd/methodology/autonomy.md`. The factory's own `AGENTS.md` / `knowledge/sdd/ARCHITECTURE.md` mention of `.specify/memory/constitution.md` refers to the factory SDD constitution, which stays.

## Independent review (round 1) and resolution

2 HIGH, 7 MEDIUM, 5 LOW. HIGH: the human gate was prose only → CLI check `runtime/policy/hitl.mjs` now called by `/sdd-implement-all`, docs say where enforcement is; extension bypass by loose prose → any non-heading, non-comment, non-rule line is rejected (+ `waived`). MEDIUM fixed: prototype-key and unknown-key fail closed; Python relative imports; extension-less `public` match; backslash keys. MEDIUM documented as limits: path aliases and files outside layers (`methodology/architecture.md`). LOW: dead config flags left in the policy (documented constants), redundant `lstat` kept (cheap, defensive).

## Follow-up before release (audit findings F-12, F-13)

F-12 (policies not wired, gate self-declarable): the human gate is now derived from the diff (ASSESS risk, base control-plane config, environment, profile `governance.allowNone`), with only the `human_gate`/`autonomy` lines of the spec as declaration. Wired in: Coordinator and `implementAll` (derive before, re-derive from actual changes after, refuse = BLOCKED; `required` stops for plan approval; `none` = DONE), factory CI (`hitl.mjs --base`, central constitution), consumer L3 (`constitution`, `architecture` from the base contract, `human-gate`). The CLI lost its risk flags. F-13 (imports): comments/strings/docstrings are blanked before reading; Python `from x import (a, b)`, multi-line and continuation forms and JS/TS multi-line, `export from`, side-effect, `require`, dynamic `import("x")` are read; the doc no longer promises "never under-report" and lists what is not resolved (aliases, computed imports).
