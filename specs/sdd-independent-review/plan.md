# SDD Independent Review - Plan

## Change Strategy

Keep the runtime-neutral judge in the core, move every runtime mechanic to its adapter, and make the CLI the only
path that writes review state. Reuse the existing pieces (`decideConvergence`, `deriveHumanGate`,
`checkChangeAgainstBase`, the adapter projection pipeline); no new dependency.

## Repository Scope

Single repository (`ai-native`, worktree `ai-native-sdd-independent-review`, branch `feature/sdd-independent-review`).

## Files Allowed To Change

* `runtime/circuit/independent-review.mjs` (core judge), `review-ledger.mjs` (persisted chain), `implement-all.mjs`,
  `coordinator.mjs`, `sdd-cli.mjs`, `sdd-workflow.mjs` and their tests.
* `runtime/adapters/review-evidence.mjs`, `claude-review.mjs`, `commands.mjs`, `sync.mjs`, `codex.mjs` and tests.
* `runtime/policy/hitl.mjs` (`checkChangeAgainstBase` extracted, behavior unchanged).
* `core/agents.json`, `core/validate-core.mjs` (+test), `core/commands/sdd-implement-all.md`, `sdd-validate.md`,
  `sdd-status.md`, `core/roles/reviewer.md`, `builder.md`.
* `contracts/sdd-workflow.json`, `contracts/sdd-workflow.schema.json` (control plane).
* `knowledge/sdd/**` (methodology), `.agents/skills/sdd/SKILL.md`, `evaluation/compat/**` (evidence).
* `specs/sdd-independent-review/**` (this record).

## Validators To Run

`core/validate-core.mjs`, `contracts/validate-contracts.mjs`, `evaluation/compat/validate-compat-matrix.mjs`,
`runtime/adapters/validate-entrypoints.mjs`, `runtime/docs/validate-doc-drift.mjs`, `parity/validate-parity.mjs`,
`runtime/status/validate-integrity.mjs`, and every `node --test` group listed in `.github/workflows/ci.yml`.
Mutation run: `verification.md`.

## Governance Update Strategy

This folder is the SDD record. `governance/SESSION-CONTEXT.md` is not changed: no release, candidate or roadmap
state changes until the human decides on the PR (a version record goes into `governance/versioning/` when a
candidate is cut).

## Commit Strategy

Not in this execution (explicit instruction: no commit). Suggested: one product commit (runtime + core + contracts +
tests), one docs/evidence commit (knowledge, evaluation/compat), one SDD record commit (this folder).

## Recovery Considerations

Everything is uncommitted in the worktree. Rollback = `git checkout -- <paths>` plus removing the new files; the
review state of a consumer lives in `<git common dir>/ai-native/review` and is disposable.
