# AI-NATIVE v4.1.0 roadmap (Native Acceptance)

Status: **PLANNING_UPDATED / IMPLEMENTATION_AWAITING_HUMAN_PLAN_APPROVAL**

Authority: current user request (2026-11-23), governance execution evidence
and the SDD artifacts below. Base: v4.0.2 (`develop` `15548c1`). This roadmap
is additive; it does not reopen completed roadmaps or authorize merge, `main`
promotion, tags or releases. Originally planned as v4.0.0 (2026-10-30); that tag
was consumed without release and v4.0.1/v4.0.2 shipped other content.

| Order | Feature | State | Dependency | Evidence |
|---|---|---|---|---|
| 1 | `001-dependency-graph` | pending human plan approval | none | `specs/001-dependency-graph/` |
| 2 | `002-native-acceptance` | pending human plan approval | 001 | `specs/002-native-acceptance/` |
| 3 | `003-acceptance-integration` | pending human plan approval | 001, 002 | `specs/003-acceptance-integration/` |

## Gate

The trusted `develop` control-plane configuration includes `contracts/**`, so
`human_gate` is `required`. Approval is the plan-approval receipt of scope
`acceptance-v4-plans-v1` bound to PR #168's head SHA
(`governance/security/PLAN-APPROVAL-RECEIPT.md`). No task checkbox may be marked
done before a verified receipt exists.

As of 2026-11-23 that receipt cannot be issued or consumed safely (dispatch
tooling, consumer, continuity and human/agent separation are missing); the
prerequisites are proposed in `governance/security/PLAN-APPROVAL-UNBLOCK-PLAN.md`
and the line is `BLOCKED` until they are delivered.

## Completion conditions

All feature tasks done with current validation evidence; G1–G6 compliance
matrix with evidence; end-to-end isolated-consumer proof (003 RF-21); real pilot
results or justified BLOCKED records; final independent review runtime-attested
or correctly `REVIEW_PENDING`; PLATFORM audit >= 90 without threshold changes;
PR prepared for human merge. Human merge, promotion, tag and publication are out
of scope.
