# AI-NATIVE v4.1.0 (Native Acceptance) execution state

STATUS: `BLOCKED` (plan approval circuit incomplete: B2–B5; corrected plans and unblock proposal ready for human decision)
WORKTREE: `<workspace>/ai-native-acc41`
BRANCH: `feature/acceptance-v4` (PR #168, draft, base `develop`)
BASE: `develop` / `15548c122c221cfe0605247fc7d14c3e92baa622` (merge of #185;
v4.0.2 released and verified, tag `v4.0.2` on `d08531e`)

## History

- 2026-10-30: planning for the line then called v4.0.0 (base `c029c21`). The
  Coordinator returned `AWAITING_HUMAN_APPROVAL`; no approval was recorded.
  Evidence: `V4-AUDIT.md`.
- 2026-11-02: plan-approval run `41369500299` (head `0597141`) ended
  `BLOCKED` in `verify-request`; no receipt was ever issued.
- v4.0.0 became a consumed tag without release; v4.0.1 and v4.0.2 shipped other
  content. Native Acceptance is the MINOR `v4.1.0` (`V4.0.2-PATCH.md`).

## 2026-11-23 update (this revision)

- `origin/develop` (`15548c1`) merged into `feature/acceptance-v4` with a merge
  commit: the branch is published and `0597141` is referenced by run
  `41369500299`, so no rebase and no force push. No conflicts.
- The nine documents of scope `acceptance-v4-plans-v1` were updated to the
  v4.0.2 base and to guarantees G1–G6 (automatic activation, generation with
  applicability/N/A, dual agent/manual execution with parity, a governed
  validation contract with observed-case coverage and BASE-relative downgrade
  detection, a generated manual, and requirement-to-gate traceability). The
  scope's document list is unchanged, so `governance/gates/plan-approval.json`
  (control plane) is not touched.
- Main deltas: 002 RF-19..RF-29 and tasks T5..T9; 003 RF-1 rewritten (no new
  slash command; acceptance runs inside `/sdd-spec`, `/sdd-tasks`,
  `/sdd-implement-all` and the `sdd` dispatcher), RF-18..RF-21 (activation
  rule, closure gate, review packet, end-to-end consumer proof), upgrade matrix
  re-based on v4.0.1/v4.0.2 with v3.4.2/v3.4.3 as reported MAJOR crossings;
  001 only records its base.
- `sdd validate` on the three features: PASS at `normal` and `full`, no `WARN`.
- Plan review (independent, read-only, isolated subagent contexts; not
  runtime-attested receipts, which apply to implementation reviews):
  round 1 CHANGES_REQUESTED (4 BLOCKER, 3 HIGH, 5 MEDIUM, 1 LOW: forgeable
  worktree evidence, cross-revision reuse at closure, free-text `--command`
  counted by `validationOf`, N/A/contract abuse on new features, isolation
  feasibility, activation at level `normal`); round 2 CHANGES_REQUESTED (2 new
  HIGH: ledger writable by code under test, legacy-cutoff bypass); round 3
  CHANGES_REQUESTED with no BLOCKER/HIGH (1 MEDIUM: CI closure result must be
  derived outside the code under test; 3 LOW). All findings were applied
  (002 RF-29..RF-33, RF-9/15/16/25/27/31 rewrites; 003 RF-1/18/19). The final
  text has not had a fourth review; the human plan approval is the gate.

## 2026-11-23 second update: HITL preparation found the circuit incomplete

- Candidate `504af3e` (CI 11/11 PASS) had a fourth isolated, read-only review
  (not runtime-attested): CHANGES_REQUESTED, 1 HIGH (the downgrade detector
  was described as BASE-platform but `ci.yml` runs candidate code on
  `pull_request`; `develop` has no human-only gate), 2 MEDIUM (RF-30 vs
  legitimate spec/doc changes; v4.0.1/v4.0.2 fixtures missing), 2 LOW
  (injectable acceptance stage; N/A approval timing).
- Approval circuit check: dispatch needs the App key and has no tooling (B3);
  no component consumes the receipt (B4); continuity from the approved SHA to
  implementation commits is not supported (B5); `check-agent-isolation` is
  BLOCKED in the agent session (B2); `develop` has no ruleset or protection.
- Owner instruction (strict path): correct B1 in documentation only and prepare
  a coordinated B2–B5 proposal; no implementation of either.
- Applied: 002 RF-25 (trusted verdict path: `main` code via `workflow_run`,
  read-only job without secrets on candidate data, `ai-native-trust` publishes,
  pending mechanisms listed and BLOCKED until they exist), RF-30/RF-34
  (non-SUT path class without global exemption), RF-31 provenance, RF-35 (N/A
  and DOWNGRADE pending until the human Environment approval for the exact
  SHA); 003 RF-11/RF-13 (any admitted source), RF-19 (platform-owned stage, no
  callback), matrix re-checked for v4.0.1/v4.0.2 (lock schema blob
  `d67779957b93…`, protocol 1, upgrade engine), T3/T4 fixtures for the four
  releases. Unblock proposal: `governance/security/PLAN-APPROVAL-UNBLOCK-PLAN.md`.

## 2026-11-23 third update: U5 obligation, DONE/N/A semantics, U0 capabilities

Documentation only. U5 now derives the obligation from changed paths classified
by a trusted map read from `main` (default deny: unknown or ambiguous paths
BLOCKED; governed exemptions; PR metadata only selects the task). 002 RF-35
aligned with the real statuses (`implement-all` `DONE` is feature-level;
pending N/A ⇒ `NEEDS_HUMAN_DECISION`, never `DONE`/`READY_FOR_HITL`/`APPROVED`;
tasks may still complete). U0 separates approval, administration and push;
push removal limited to the bootstrap, builder App deferred to decision D-2.
U1 split into a no-bypass ruleset and a restrict-updates ruleset.

## Next permitted action

Human actions, in order (`PLAN-APPROVAL-UNBLOCK-PLAN.md`, section «Arranque»):
U0 identity separation executed and verified by the owner; decision D-0 on the
unblock plan, recorded by the owner from the human profile; U1 `develop`
ruleset. No receipt is dispatched for `acceptance-v4-plans-v1` until U2–U6 are
delivered to `main`; only then the receipt for the #168 head, the owner's
Environment approval, attestation and consumption allow implementation, one
task at a time in dependency order 001 -> 002 -> 003.

## Restrictions retained

No implementation, no real consumer modification, no merge, no release/tag, no
gate or audit-threshold weakening, no fabricated approval, nonce or receipt.
Implementation, pilot and end-to-end tests are NOT_RUN.
