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
| Trusted verdict | `runtime/acceptance/verdict.mjs`, `.github/workflows/acceptance-governance.yml` | candidate read as Git objects, verdict posted by the trust App (pending human configuration) |
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

## Limits of this candidate (honest state)

- The trusted verdict path (002 RF-25/RF-31/RF-35) depends on human configuration that does not exist yet: the
  `develop` ruleset, `ai-native/acceptance-governance` as a required check, the Environment restrictions and
  human/agent identity separation. Until then the governance verdict is reported `BLOCKED`, never satisfied by the
  candidate-run `ci.yml` derivation, which is early feedback only.
- CI closure evidence from a fresh checkout (RF-31) and the consumer L3 acceptance job are not implemented in this
  candidate; local ledger evidence is circuit evidence only.
- The `container` tier needs a container runtime; on a host without one it is `BLOCKED` without fallback.
- The GI PostgreSQL reference pilot (003 RF-6, RF-14..RF-17) was not executed: it needs a disposable PostgreSQL
  container and no container runtime was available. It is reported `BLOCKED`.
