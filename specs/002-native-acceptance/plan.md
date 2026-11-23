# Plan — Native Acceptance

## Strategy

Use Feature 001's validated graph, the project validation contract and the
per-feature acceptance plan (together, the registry). A small
runtime runner validates scenario shape, executes allowlisted commands with
bounded captured output, and writes structured reports outside immutable source
inputs. Cross ownership is checked from consumer module IDs, not directory names.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1, RF-2, RF-12, RF-13 | Expand each dependency edge deterministically into a consumer-owned mandatory validation obligation. Missing/skip/unavailable test is BLOCKED; discard provider-owned cross tests and advisory optional obligations. |
| RF-3, RF-4 | Explicit state machine with mandatory-count checks; discard treating zero tests/skips as success. |
| RF-5, RF-6, RF-7, RF-11, RF-17, RF-18 | JSON evidence separates `sourceRevision` provenance from canonical scenario-input fingerprints; include verifiable non-secret configuration and declared environment inputs. Secret values are neither stored/logged nor directly hashed; unknown critical secret-derived configuration is BLOCKED. Discard whole-repository revision fingerprints and timestamp-only freshness. |
| RF-19, RF-20, RF-21, RF-22 | Deterministic plan validator over `specs/<slug>/acceptance/plan.json` (AC -> cases, seven-category applicability matrix, dataset digests/seeds). The Builder writes the plan and cases; the validator, the runner and the reviewer judge them. Discard LLM self-assessment of coverage and unconditional generation of every category. |
| RF-23, RF-24 | Project `acceptance/validation-contract.json` with runner entries `{ id, executable, argv, format: tap13 \| junit \| node-test, cwd }`; parse observed case IDs from structured output and match them to the plan. Zero observed, missing, skipped or unknown IDs are BLOCKED whatever the exit code. Discard exit-code-only success and a pure string blacklist (kept only as defense in depth). |
| RF-25 | `runtime/acceptance/downgrade.mjs` diffs BASE vs candidate contract, plan and spec acceptance section. It runs in CI from the BASE platform next to the existing `hitl.mjs` derivation (`ci.yml`), so the candidate cannot change the checker. `contracts/hitl-policy.json` gains the `acceptanceGovernance` force-required reason and the `acceptance:` unit key that `hitl.mjs` accepts. Approval is the existing human-only `ai-native-human-review` Environment of the merge gate; no agent-writable approval file. Discard adding `profiles/**` or consumer paths to control-plane globs (broad blast radius) and trusting the candidate's own contract. |
| RF-31 (CI closure) | The consumer CI (`runtime/consumer/l3.mjs`, run from the BASE lock's platform) and the factory `ci.yml` gain an acceptance job that re-runs the feature's mandatory cases on the evaluated commit in a fresh checkout and publishes the result bound to commit and run ID; merge requires it. The local git-dir ledger feeds `implement-all` and the review packet only. Discard trusting a ledger that code under test can append to. |
| RF-30, RF-31, RF-32 | Runner appends hash-chained entries to `<git-common-dir>/ai-native/acceptance/<slug>/ledger.jsonl` (same pattern as `runValidation` in `review-ledger.mjs`); gates read only that ledger and require `sourceRevision == ` evaluated revision for closure. Each case declares SUT input paths; changed paths outside all case inputs are BLOCKED. Plan validator requires a rejection-expecting or seeded-failure case per AC. Discard worktree JSON as evidence and cross-revision reuse for closure. |
| RF-15, RF-16 (tiers) | `restricted` is always available and labelled not isolated; `node-permission` uses Node's permission model where the runtime supports it (detected, never assumed); `container` uses the Docker CLI already used by the pilot. GI PostgreSQL uses `container` with a human-approved loopback network entry. Discard claiming OS sandboxing from plain spawn and blocking every scenario for lack of a universal sandbox. |
| RF-26, RF-27 | Render `specs/<slug>/acceptance/MANUAL.md` from the plan with a fixed template derived from the GI M-01..M-13 lessons (glossary, prerequisites, two-terminal layout when needed, explicit per-command exit capture for PowerShell and POSIX, restore section, run log). Parity check compares plan, manual and runner case sets. Discard hand-written manuals that drift from the runner. |
| RF-28, RF-29 | `contracts/acceptance-result.schema.json` with the six statuses and a fail-closed mapping to `result.mjs`; `acceptance/traceability.json` generated from plan + evidence. Discard adding BLOCKED to the shared `result-status` enum (changes existing consumers). |
| RF-8, RF-9, RF-10, RF-14, RF-15, RF-16, RF-33 | Spawn executable plus argv without shell only as injection defense, not sandbox. At the `node-permission` and `container` tiers require the tier's filesystem/child-process/network controls before execution, otherwise BLOCKED; `restricted` enforces only argv/env/timeout/output bounds and is labelled not isolated. Each mandatory case declares a minimum tier. Discard treating subprocess launch as isolation or inheriting `process.env`. |

## Probable files after approval

`contracts/acceptance-{plan,validation-contract,result}.schema.json`, `contracts/hitl-policy.json` (new force reason and unit key), `.github/workflows/ci.yml` and `runtime/consumer/l3.mjs` (acceptance job; control plane, human-gated), `runtime/acceptance/{plan,registry,runner,results-parser,evidence,downgrade,manual,traceability}.mjs`, a manual template under `knowledge/sdd/templates/`, focused tests and disposable fixtures. The validation contract names executable identity, argv tokens, timeout, isolation profile, permitted non-secret configuration/environment keys, filesystem roots and evidence root; no command string is accepted. Evidence retention is bounded and ignored unless governance explicitly selects versioned evidence. No consumer source changes.

## Evidence fingerprint and staleness contract

Scope of reuse (RF-30): fingerprint equality lets a consumer's cross obligation
stay current when the change did not affect it, and drives impact selection.
Feature closure and review approval always need evidence at the evaluated
revision. STALE is a reported status that every gate treats as blocking (RF-29).

The runner constructs canonical UTF-8 JSON (recursively sorted object keys,
arrays in declared contract/plan order, no wall-clock fields) and SHA-256 hashes it.
The **input fingerprint** contains only scenario-relevant data: schema version;
module/scenario/provider/consumer IDs; contract IDs and immutable references;
canonical dependency-manifest digest; runner entry and case digests; executable content
digest; argv tokens; declared fixture/input content digests; execution kind; and
environment identity (platform, architecture, runtime version and allowlisted
environment key names only); and the content digests of the case's declared SUT
input paths.

`sourceRevision` is stored in the evidence report as provenance of the report,
but is intentionally outside the input fingerprint. Timestamp, report path,
captured output, secret environment values and undeclared repository paths are
excluded. This prevents an unrelated source change from invalidating a module's
acceptance while preserving traceability of the report's originating revision.

Relevant configuration files are fingerprinted from declared, validated
non-secret fields only. Environment dependencies are enumerated by key name and
classified before reading values; allowlisted non-secret values may enter the
canonical fingerprint. Secret values never enter reports or direct hashes. A
protected secret version/rotation identifier may be fingerprinted only if it is
provided as a non-secret stable identifier; otherwise a critical
secret-dependent scenario is BLOCKED. Missing/unreadable or unclassifiable
critical config/environment is BLOCKED, not silently omitted.

One rule per condition: a fingerprint field that differs makes evidence STALE;
a missing mandatory result, an absent/unreadable input or an unsupported or
malformed record is BLOCKED (RF-3, RF-24); a recorded FAIL stays FAIL and is
never relabelled. Per RF-29 all three block every gate. Byte-identical canonical inputs remain current
regardless of mtime, JSON key order, report file name, `sourceRevision`, or
unrelated repository changes for the reuse purposes allowed by RF-30; closure
still requires evidence at the evaluated revision. Comparison is exact and never time-based. A stale
or malformed mandatory record is never silently rerun or reused.

## Test strategy and rollback

Use local Node fixture commands for deterministic runner semantics, labelled
`simulated`; reserve GI PostgreSQL/API tests for the later real pilot and label
them `real-integration`. Negative tests cover empty/missing/skip/fail/stale,
shell metacharacters, argument injection, path traversal/symlink escape,
undeclared environment variables, inherited secret-like variables, output limits
and timeout process cleanup. Isolation tests separately assert restricted
execution is not labelled sandbox, network/process/filesystem controls are
enforced, and absent host enforcement blocks before spawn. Evidence tests prove
configuration and non-secret environment changes invalidate, secret values are
never persisted/hashed, and unverifiable critical configuration blocks. They
also prove a relevant fixture/contract
change invalidates, while a changed unrelated file or `sourceRevision` alone
preserves the same input fingerprint and current evidence. The runner rejects
unregistered commands. Ledger tests forge a worktree report, edit and truncate
ledger lines and replay another revision's entry; all are BLOCKED. Downgrade
tests cover every kind in RF-25 plus contract creation and N/A on a new
feature. Rollback removes additive files.

## Lessons applied from GI-COMMON-REFERENCE M-01..M-13 (read-only input)

The reference manual was useful (per-case objective, expected result, PASS/FAIL
meaning, limitation, restore) but its 13/13 PASS record had no SHA or date, two
incidents came from shell exit-code handling (`$LASTEXITCODE` after a comment,
case-insensitive PowerShell variables), and coverage limits were only stated by
hand. The template therefore records sourceRevision/date/operator per run,
captures each command's exit status explicitly, uses non-colliding variable
names, and derives limitations and coverage from the plan.

## Risks

Command execution is a trust boundary: contract and plan validation occur before spawn;
the runner never uses a shell, logs only allowed environment key names, kills a
timed-out process tree, and records no environment values. Evidence must not
carry environment secrets.
