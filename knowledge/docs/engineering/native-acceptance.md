# Native Acceptance (v4.1.0 candidate)

Status: candidate, not released. This page describes the code on the v4.1.0 candidate branch; it makes no release claim.

Native Acceptance makes acceptance a mandatory, automatic phase of every SDD feature that declares acceptance
criteria. The developer does not ask for it: `/sdd-spec` writes `AC-n` criteria, `/sdd-tasks` emits the acceptance
task, and `/sdd-implement-all` runs the feature-level acceptance stage after the task loop and before the review loop.
Specs: `specs/001-dependency-graph`, `specs/002-native-acceptance`, `specs/003-acceptance-integration`.

## Architecture

| Piece | File | Role |
|---|---|---|
| Dependency manifest | `acceptance/dependency-manifest.json` (project-owned), `contracts/dependency-manifest.schema.json` | modules, public contracts, explicit dependencies |
| Graph and impact | `runtime/acceptance/{manifest,graph,impact}.mjs` | deterministic resolution; public-contract change declarations verified by commit + path + SHA-256 |
| Validation contract | `acceptance/validation-contract.json`, `contracts/acceptance-validation-contract.schema.json` | the only runners that may execute: fixed executable, argv, cwd, format, timeout, isolation tier, env allowlist, non-SUT paths |
| Acceptance plan | `specs/<slug>/acceptance/plan.json`, `contracts/acceptance-plan.schema.json` | written by the Builder; judged by `runtime/acceptance/plan.mjs` |
| Runner | `runtime/acceptance/runner.mjs` | shell-free spawn, minimal env, timeout with process-tree kill, bounded output; tiers `restricted` (not isolated), `node-permission`, `container` |
| Results | `runtime/acceptance/results-parser.mjs`, `result.mjs` | observed case IDs from TAP 13 / JUnit / node test output; six statuses mapped fail-closed to `result.mjs` |
| Evidence | `runtime/acceptance/evidence.mjs` | input fingerprint, hash-chained ledger in `<git-common-dir>/ai-native/acceptance/<slug>/ledger.jsonl` |
| Feature stage | `runtime/acceptance/feature.mjs` | platform-owned run + status read back from the ledger only |
| Downgrade detector | `runtime/acceptance/downgrade.mjs`, `runtime/policy/hitl.mjs` | BASE vs candidate data diff; forces `human_gate: required` |
| Trusted verdict | `runtime/acceptance/verdict.mjs`, `.github/workflows/merge-gate.yml` (`acceptance-analyze`), `runtime/gates/merge-gate.mjs` | candidate read as Git objects by a secret-free job; the existing trust-App publisher folds the verdict into the merge decision |
| Consumer L3 acceptance | `.github/workflows/l3-consumer.yml`, `runtime/consumer/acceptance-gate.mjs` | closure, analysis and decision jobs from the consumer's BASE-lock platform; consumer-owned human Environment |
| GI reference pilot | `.github/workflows/acceptance-pilot.yml`, `evaluation/pilot-gi/` | disposable pinned copy of gi-common-reference, real PostgreSQL, two runs |
| CI closure | `runtime/acceptance/ci-closure.mjs`, `ci.yml` job `acceptance-closure` | raw runner output of the evaluated commit; the trusted analyzer derives the result |
| Manual and traceability | `runtime/acceptance/manual.mjs`, `knowledge/sdd/templates/acceptance-manual-template.md` | manual rendered from plan + contract, parity check, traceability report |
| Upgrade matrix | `contracts/upgrade-matrix.json`, `runtime/bootstrap/upgrade-matrix.mjs` | exact admitted sources for the v4.1 line; legacy cutoff writer |

## Commands (existing dispatcher, no new slash command)

```text
node .ai-native/ai-native.mjs sdd acceptance plan <slug>                 check the plan (writes a skeleton only when absent)
node .ai-native/ai-native.mjs sdd acceptance manual <slug>               render MANUAL.md and check parity
node .ai-native/ai-native.mjs sdd acceptance run <slug> --base <ref>     platform-owned run; ledger in the git dir
node .ai-native/ai-native.mjs sdd acceptance status <slug> --base <ref>  status at this revision, from the ledger only
node .ai-native/ai-native.mjs sdd validate <slug> --level full           fails a non-legacy feature without criteria
```

## Statuses and gates

`PASS`, `FAIL`, `BLOCKED`, `STALE`, `NOT_RUN`, `NOT_APPLICABLE`. Only `PASS` and an approved or structural
`NOT_APPLICABLE` are non-blocking. `FAIL` maps to `FAIL`; `BLOCKED`, `STALE`, `NOT_RUN` map to `ERROR`.

- Zero observed cases, a missing, skipped or unknown case ID: `BLOCKED`, whatever the exit code (`node -e 0` cannot pass).
- Evidence of another revision: `STALE`. A changed path covered by no case input and not in the non-SUT class: `BLOCKED`.
- An edited, truncated or reordered ledger: `BLOCKED`. Worktree reports are renderings, never evidence.
- A `NOT_APPLICABLE` category or feature, or a DOWNGRADE, is `PENDING_APPROVAL`: tasks still complete, the feature
  acceptance stays `BLOCKED`, `implement-all`, the review outcome and the Coordinator return `NEEDS_HUMAN_DECISION`.
- `sdd review validate --command ...` runs never count toward acceptance.

## Activation and migration

A feature is REQUIRED when its spec has `AC-n` criteria, NOT_APPLICABLE only through `acceptance: not-applicable` plus
`acceptance-justification:` citing requirements (pending human approval), LEGACY when listed in
`acceptance/legacy-cutoff.json`, and otherwise BLOCKED at closure (`sdd validate --level normal` keeps the v4.0.2 warning).
The upgrade to the v4.1 line admits exactly v4.0.1, v4.0.2, v3.4.2 and v3.4.3 (v3.4.x reports the MAJOR crossing),
rejects any other source before writing, records the legacy cutoff, and rolls back byte for byte on failure.
A consumer without a validation contract gets `BLOCKED` with an actionable diagnostic; nothing is created silently.

## Trusted verdict path (002 RF-25, RF-31, RF-35)

- **Factory.** `merge-gate.yml` (pull_request_target to `main`, BASE code) runs `acceptance-analyze`: read-only
  token, no secret, no Environment; the PR head is fetched as Git objects only; it waits (bounded) for the
  registered `ci.yml` pull_request run of the exact head SHA, downloads its raw `acceptance-closure` artifact and
  the closure job's log as data, and runs `runtime/acceptance/verdict.mjs`. The existing trust-App holders
  (`merge-gate`, `finalize`) read ONLY that verdict JSON (bounded, no symlink, schema and head SHA checked), fold
  it into the merge decision (`governance/gates/gates.json` `acceptanceGovernance.required`) and publish
  `ai-native/acceptance-governance`. No third key holder exists. `NEEDS_HUMAN` clears only with the
  `ai-native-human-review` Environment approval of that run by a `governance.humanMergers` login, recorded with
  run id, reviewer, time, head SHA and findings digest; `FAIL` and `BLOCKED` never clear.
- **Consumers.** The reusable `l3-consumer.yml`, from the platform commit pinned by the consumer's BASE lock, runs
  `acceptance-closure` (its own job, fresh head checkout), `acceptance-analyze` (no product test, candidate as Git
  objects), `acceptance-human` (consumer-owned Environment, input `acceptance-environment`) and
  `acceptance-governance` (`runtime/consumer/acceptance-gate.mjs`). The consumer requires
  `l3 / acceptance-governance`. `NEEDS_HUMAN` clears only with an approval record of that Environment in this run
  by a login of `acceptance-reviewers` (type User, not the PR author); a job result alone, an Environment without
  reviewers or no reviewers configured is BLOCKED. Limit: the whole pipeline runs inside the consumer PR's own
  `pull_request` workflow, so a PR that replaces its caller workflow with a job of the same name runs no platform
  code at all. In consumers RF-25 is therefore enforced only together with a required human review of
  `.github/**` changes (CODEOWNERS plus the consumer ruleset); without it, consumer acceptance governance is
  advisory against a hostile PR author, and is reported as such (BLOCKED for the guarantee, not PASS).
- **Closure derivation.** The analyzer re-parses the raw bytes against the head's plan and contract, re-judges the
  plan (AC coverage, matrix, dataset bytes), requires the recorded tier to equal the contract's and meet every
  case minimum, requires every criterion to have a mandatory case labelled rejection-expecting (RF-32 at merge: a
  seeded-failure history is not verifiable from one commit's closure; the label is checked, whether the case
  really can fail is the review's job), checks the producing run (workflow path,
  `pull_request`, head SHA) and is BLOCKED when the producer (`ci.yml` plus the imports of `ci-closure.mjs`, or the
  consumer's caller workflow) differs from BASE.
- **Candidate code next to the closure.** Each runner's output digest is written to the producing job's log from
  memory before anything reaches disk (`ACCEPTANCE_RAW_DIGEST`); the analyzer requires exactly one matching anchor
  per runner, so a process rewriting the artifact after a runner finished, or writing to the log, yields BLOCKED.
  A runner's process group is killed when it exits (POSIX), and the tree on timeout (both OSes). What anchors do
  not prevent: candidate code of one runner modifying files a later runner loads, before that runner starts. Only
  the `container` tier isolates runners from each other and from the job, so a closure whose runners did not all
  run at `container` adds the governance finding `CLOSURE_NOT_ISOLATED` (NEEDS_HUMAN): it never closes silently.
- **Selection.** A changed feature is one with a changed `specs/<slug>/` path, or any feature whose plan (at BASE or
  at the head) declares a changed path among its case inputs; a code-only change re-runs those features and is
  never PASS without their closure.
- **Impact.** The BASE dependency graph and the head graph are analysed together: deleting the manifest, a module,
  a public contract or an edge never drops a BASE obligation and is itself a DOWNGRADE; an affected consumer
  module with no plan is BLOCKED.
- **Configuration (002 RF-17/RF-18).** A runner declares `configFiles` (non-secret repository files, fingerprinted
  by content and counted as inputs) and `envValues` (allowlisted non-secret names whose values are fingerprinted).
  Secret-like files or names are refused; an unreadable one is BLOCKED; dropping one is `CONFIG_INPUT_REMOVED`.

## Own acceptance of specs 001-003 and the GI pilot

- `acceptance/validation-contract.json` and `specs/00{1,2,3}-*/acceptance/plan.json` (generated by
  `acceptance/cases/generate-plans.cjs`) with the cases in `acceptance/cases/` (TAP, named by case ID, exercising
  the real modules; 003 I-16 runs the per-source upgrade tests). Their declared inputs are the whole platform tree:
  conservative for STALE and for selection (any platform change re-runs them), but it makes the per-feature
  uncovered-path check vacuous for these three features. The runners are `restricted`, so their merge closure
  always carries `CLOSURE_NOT_ISOLATED` for the human. I-15 validates the pilot definition; the PostgreSQL
  execution itself is the `acceptance-pilot` workflow's evidence.
- The GI PostgreSQL reference pilot (003 RF-6, RF-14 to RF-17) runs in `acceptance-pilot.yml` on a disposable clone
  of `gi-common-reference` at a pinned SHA with the remote removed; the overlay (`evaluation/pilot-gi/`) is
  committed only inside the copy. PostgreSQL comes from a pinned `postgres:16-alpine` digest through GI's own
  testcontainers fixtures; the platform stage runs twice and must PASS identically. Evidence classes: real
  PostgreSQL integration, simulated (`test_sim_*`), API in-process through FastAPI TestClient; nothing is labelled
  HTTP-socket end-to-end. Its result is recorded in `governance/execution/current/V4.1.0-PILOT-EVIDENCE.md`.

## Limits of this candidate (honest state)

- Human configuration outside the repository is still required: the `ai-native-human-review` Environment with the
  human as only required reviewer, `ai-native-trust` restricted to `main`, the `main` ruleset requiring
  `ai-native/merge-gate` from the trust App, and human/agent identity separation (U0).
- **Bootstrap.** `merge-gate.yml` runs on `pull_request_target`, i.e. the BASE copy of the workflow. The v4.1.0
  release PR itself is therefore judged by the v4.0.2 merge-gate (no acceptance verdict), and once v4.1.0 is on
  `main`, a PR that changes the closure producer (`ci.yml`, `ci-closure.mjs` and its imports) is BLOCKED by design
  until a human decides it. The first PR the acceptance verdict binds is a PR to `main` opened after v4.1.0 is
  merged there. The acceptance verdict only binds where `merge-gate.yml` runs: PRs to `main`. RF-25 asks for it on every protected target
  branch; for `develop` it is BLOCKED (no trusted verdict is posted there; the `ci.yml` closure is early feedback
  only), pending a human decision to run the gate on `develop` too.
- A consumer must make `l3 / acceptance-governance` required and own a human Environment; otherwise its acceptance
  governance is not enforced (BLOCKED without the Environment, unenforced without the required check).
- A case's own code decides its own result: the platform verifies that the declared cases ran, were observed,
  can fail (a rejection-expecting case per criterion) and were not swapped, but it cannot prove that a test
  asserts what its name says. That remains the review's job.
- `restricted` is labelled not isolated; `node-permission` only where the runtime supports it; `container` needs a
  container runtime and is BLOCKED without one (no fallback). `loopback` service networks are refused.
- The local acceptance ledger is a keyless hash chain: anything with the developer's OS rights can append a
  chain-valid entry. It is circuit evidence for `implement-all` and the review packet only; merge closure never
  reads it.
- On Windows an orphan whose parent already exited is not reachable by `taskkill /T` (POSIX kills the group).
- Fork PRs: GitHub leaves `pull_requests` empty on workflow runs from forks, so `acceptance-analyze` finds no CI
  run of the PR, waits its full bound (45 min) and reports BLOCKED (fail closed, at an availability cost).
- `implementAll` runs the stage only when the caller passes `feature`; the Coordinator refuses a Feature without it.
