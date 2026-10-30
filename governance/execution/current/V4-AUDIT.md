# v4.0.0 — preflight and implementation audit

Date: 2026-10-30. **PARTIAL / AWAITING_HUMAN_APPROVAL**. This is discovery and
planning evidence, not evidence that v4 works or that its release is ready.

## Identity and authority

- Worktree: `C:/Proyectos/worktrees/ai-native/acceptance-v4`.
- Branch: `feature/acceptance-v4`; initial HEAD and merge-base with `develop`:
  `c029c21220a3b0ae28bdca95464d199ae636ec73`.
- `node runtime/cli/ai-native.mjs --version`: `CLI: v3.4.3`.
  `VERSION` is separately `3.0.0-dev`; neither version was changed.
- Initial status: only `?? GOAL-V4.md`. User-owned input read in full (2152
  lines), preserved without modification. SHA-256:
  `260b6d46dbfbae2d7c0258c942d6cd4ab4d6f1ca12ac7a1242924205c47b92ca`.
- Existing governance records v3.4.3 as released/verified, with no pending
  candidate. The new user request authorizes v4 planning, not reopening that
  release. Historical execution records remain intact.
- Available: Node `v26.12.1`, Git, authenticated GitHub CLI, authenticated Claude
  Code `2.1.314`, Docker daemon `29.9.2`. No credentials are included here.

## Actual orchestration and the blocking gate

`/goal` and `/loops` were not found as registered repository commands in
`contracts/sdd-workflow.json`, `core/commands/` or the inspected runtime routing.
The session goal is not proof that either command exists in AI-NATIVE.
The available equivalent is `/feature` with the Coordinator and the bounded,
sequential `/sdd-implement-all` loop (`runtime/circuit/implement-all.mjs`).

The actual `runCoordinator` API was executed: three capabilities, architecture
and migration signals produced `DECOMPOSED`, `milestone`, `full`, with work units
`001-dependency-graph` -> `002-native-acceptance` ->
`003-acceptance-integration`. This was a real decomposition invocation, not an
implementation loop. **No implementation loop was activated.**

`knowledge/sdd/methodology/autonomy.md:9`,
`core/commands/sdd-implement-all.md:13` and
`runtime/circuit/coordinator.mjs:77` require human plan approval before
implementation when `human_gate` is `required`.
`contracts/hitl-policy.json` forces this for control-plane changes;
`governance/gates/gates.json` at the trusted `develop` base includes
`contracts/**`.

For planned paths `contracts/dependency-manifest.schema.json` and
`runtime/acceptance/graph.mjs`, loading the trusted base patterns through
`loadGateConfig(process.cwd(), 'develop').controlPlane` produced:

```text
DERIVED_GATE: ok=true, risk=medium, gate=required
REASON: controlPlane keeps the human gate required (external protection wins)
COORDINATOR: AWAITING_HUMAN_APPROVAL
REASON: human_gate required: a human approves the plan before implementation
```

Architecture forces SDD `full`; it does not itself make the path assessment
`high`. An initial incomplete API probe omitted trusted control-plane patterns:
it derived `final-only`, then returned `BLOCKED` because its test planner had no
`readTasks` callback. It did not invoke any implementer. That failed diagnostic
is not gate evidence; the corrected trusted-base invocation above is.

**No human plan approval has been received.** General authorization to pursue
the goal is not recorded as approval of plans that did not yet exist. The user
also expressly forbids bypassing HITL. Implementation and subsequent dependent
phases must wait; no policy, gate or validator was weakened.

## Reuse and integration findings

| Area | Existing implementation / required work after approval |
|---|---|
| Commands | Catalog `contracts/sdd-workflow.json`, schema `contracts/sdd-workflow.schema.json`, bodies `core/commands/`. Schema currently only allows `feature` / `sdd-*`; `/acceptance` requires an explicit contract extension. |
| Adapters | `runtime/adapters/{commands,sync,consumer,launcher}.mjs`; dispatcher `runtime/main.mjs`. Claude/OpenCode get slash projections; Codex uses routing/skills. Test all supported paths rather than inventing a separate CLI. |
| Architecture | `runtime/policy/architecture.mjs` is static architectural checking, not the requested public-contract dependency graph. Native Acceptance is not already implemented. |
| Validation | `runtime/lib/schema-lite.mjs` does not enforce every JSON Schema keyword (`minLength`, `uniqueItems`, external refs); strict manifests need explicit semantic tests/validation. `runtime/lib/result.mjs` lacks terminal `BLOCKED`; map acceptance results fail-closed without weakening existing results. |
| Acceptance ownership | Cross scenarios belong to the consumer; do not add artificial cross suites for dependency-free modules. Deterministic graph authority must be versioned declarations, never LLM inference. |
| Reviews | `core/agents.json`, `runtime/adapters/review-evidence.mjs`, `runtime/circuit/review-ledger.mjs`: only Claude delegated fresh-context review has a verified attester. An OpenCode general subagent is not an attested approval. Preserve nonce, packet, receipts and revision binding. |
| Upgrade | `runtime/bootstrap/upgrade.mjs`, `runtime/migrate/upgrade-delta.mjs`, `contracts/bootstrap-protocol.json`: reuse transaction/rollback and preserve project-owned manifests, contracts, specs, fixtures and historical evidence. Verify customized projections, profile/MCP settings, collisions, idempotence and partial failures. No actual v3-to-v4 upgrade has been proven. |
| Bundles | `runtime/release/{bundle,build}.mjs` packages committed blobs, including runtime/contracts/core/skills/SDD methodology, not factory governance or tests. Uncommitted implementation would not ship. |
| Generator | `template/generators/create-ai-native-app.mjs` copies scaffold; editing only `template/templates/project/AGENTS.md` does not demonstrate generated-project behavior. Verify the actual generation path. |
| CI | `.github/workflows/{ci,l3-consumer,release}.yml`, `runtime/consumer/l3.mjs`, `scripts/validate-ci-tests-listed.mjs`. Suites are explicitly listed. Respect trusted BASE platform on upgrades and keep develop checks informational under current policy. |
| Evidence | Bind reports to actual code/contracts/fixtures/environment, reject stale/empty/skipped mandatory acceptance; distinguish real database/API runs from fakes. Avoid self-invalidating report paths and unbounded/secret-bearing logs. |

No new Acceptance Agent is assumed necessary: first reuse Builder, technical
verification and read-only Reviewer with distinct acceptance execution ownership.
Its final design remains in the plans, not in an unverified runtime declaration.

## GI reference pilot discovery (tests NOT_RUN)

Read-only GitHub source inspection and disposable tar extraction used public
`jlbellonGmail/gi-common-reference`, pinned to
`ad0762b8ae381fd5438b07a93cb0f0b475c67870`.
Archive SHA-256:
`2a4d48bac309c01f943686f5e37a2bf1cf5401adcff5faabd66363091442a580`.
The archive remains ignored under `.cache/v4-pilot/`; no consumer repository or
shared branch was modified.

- Regions consumes Locales through SQL/FK in the same schema, **not** a Locales
  HTTP client (`specs/002-regions-subregions/plan.md:29` and
  `regions/infrastructure/postgres_repository.py:122` in that source).
- Existing `tests/contract/test_{locales,regions}_api.py` include ASGI TestClient
  plus real PostgreSQL scenarios, alongside fake/error scenarios. They are not
  all real integration, and are not network-socket E2E.
- Python `3.12.13` is available; the project dependencies are not installed in
  that interpreter. Pinned dependencies are in source `constraints.txt`.
- Docker has `postgres:16-alpine` locally, digest
  `postgres@sha256:3c5c8892d184f738f4fe282d14ddaa613a38f00f4189d2d94725ebe6f2909ddb`.
  No v4 pilot container was started and no dependencies were installed.
- Use `acceptance/locales/gi-dev/locale-snapshot.v1.2.json` for Regions-compatible
  locale UUIDs; the standalone contract examples have different identities.
- Source helper `tools/acceptance/gi_dev.py` may print FAIL without propagating
  nonzero exit codes and defaults to Supabase. Do not treat it as a passing gate
  or execute it blindly.
- A real incompatible-data pilot can deactivate required `en`, then attempt a
  **new** Regions incorporation (RF-33 rejection); an already incorporated
  snapshot may NOOP and miss the negative. Distinguish this from OpenAPI breakage.
- Extraction has no `.git`; parent Git would report the factory SHA. A later
  pilot must use explicit `sourceCommit` or isolate source Git identity.

Original contract SHA-256 values, compared with GitHub source bytes:

| Contract | SHA-256 |
|---|---|
| `locales-api.v1.openapi.json` | `29374c92f284c39d2d194f2188388cf236b83ff0d1c36f76479da827fa5330b6` |
| `regions-api.v1.openapi.json` | `77ca1dea05c352df9a12fe3a2588f2660f591e4bb64e0157d1bf5eab4f99df74` |
| `locale-snapshot.v1.schema.json` | `ad068518ede0a429c8f9d4c55582a9087227c2a38af3b2040d63ec30fcbd885d` |
| `region-snapshot.v1.schema.json` | `badd71958a3ea436ea004e3e6952bc1c68a63708ceb3b04d81c0c82784243494` |

The temporary extraction caused `doc-drift` to fail on 10 duplicate canonical
skills even though `.cache` is Git-ignored. It was not a product defect. The
pilot auditor checked all 204 files/54 directories against the archive (no
extra/modified files, links or `.git`) and removed **only its own extraction**.
The original archive, SHA file, cleanup inventory and before/after logs remain
under `.cache/v4-pilot/`. The validator was rerun unchanged and passed.

## Commands actually run

These are baseline/discovery validations, **not v4 implementation tests**.

| Command | Result |
|---|---|
| `git status --short`, `git branch --show-current`, `git log --oneline --decorate -5`, `git rev-parse --show-toplevel`, `git merge-base HEAD develop` | PASS: identity above; user source untracked. |
| `node --test --test-concurrency=1 runtime/circuit/sdd-workflow.test.mjs runtime/circuit/implement-all.test.mjs runtime/circuit/independent-review.test.mjs` | PASS: 67 tests, 67 pass, 0 fail/cancelled/skipped/todo. |
| `node --test runtime/lib/result.test.mjs runtime/lib/schema-lite.test.mjs` | PASS: 12 tests, 12 pass, 0 fail/cancelled/skipped/todo. Total unique baseline tests: 79 PASS. |
| `node contracts/validate-contracts.mjs` | PASS: 20 schemas, 7 data files. |
| `node core/validate-core.mjs` | PASS: kernel 52/60 lines, 3 roles, 2 MCP profiles, 8 project profiles. |
| `node runtime/adapters/validate-entrypoints.mjs` | PASS. |
| `node scripts/validate-ci-tests-listed.mjs` | PASS: all 99 committed test files listed in a workflow. |
| `node runtime/docs/validate-doc-drift.mjs` | FAIL with temporary extraction (10 errors); PASS after removing only the auditor-created extraction; independently rerun PASS by Coordinator. |
| `git diff --check` | PASS before planning changes; rerun required on final planning diff. |

Full regression, v4 graph/acceptance/migration tests, real pilot, remote CI of a
v4 implementation and runtime-attested Independent Review: **NOT_RUN**. Existing
tests/green validators do not constitute v4 quality-gate completion or approval.

## Recovery and required human action

## Planning addendum — 2026-10-30

The full SDD packages now define four unimplemented commitments: owner-validated
public contract-change declarations; registry-only shell-free commands with
argv, environment, filesystem and timeout controls; canonical SHA-256 evidence
fingerprints with exact stale rules; and actual-shape v3.4.3 upgrade fixtures
for admission, preservation, rollback and idempotence. Details live in the three
feature `spec.md` and `plan.md` files. They remain subject to the existing human
plan approval before implementation.

Read `V4-STATE.md`, the v4 roadmap and the three feature plans. Explicit human
approval of the implementation plans is required before opening T1 of the first
feature. After that approval, resume sequential bounded execution; verify, repair,
record evidence, run an attested independent review and prepare the implementation
PR for human merge. Merge, main promotion, final tag and release publication
remain separately forbidden without the corresponding human authorization.
