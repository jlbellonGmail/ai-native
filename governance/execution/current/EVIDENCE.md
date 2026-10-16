# EVIDENCE

## Governance and Candidate Sources

* Current v3.3.0 lifecycle status: `governance/SESSION-CONTEXT.md`.
* Candidate and release constraints: `governance/versioning/V3.3.0-RELEASE.md`.
* Human merge rule D6 and ruleset intent:
  `governance/security/HITL-MERGE-POLICY.md`.
* P0-T2 historical evidence (preserved, not edited):
  `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-IMPLEMENTATION/`.

## Main and Merged PR Evidence

Pre-reconciliation main was clean at
`9faf58534fa45102da9518de2edc7b7db5a15c3a`, equal to `origin/main` after
`git fetch origin` and `git merge --ff-only origin/main`.

GitHub API confirmed these PRs are merged:

| PR | Merge SHA | Relevance |
|---|---|---|
| #127 | `64bc11ec139388fb9140c36bc29ffc7413a30cfb` | Previous PLATFORM audit record |
| #128 | `2ef6b5ba8a31c5871eb9a697c5af5f19122ffeb8` | B-01 lock-validation remediation |
| #129 | `0d9cea46b36a16d2c32737ad7722262f9c61dd41` | Previous PLATFORM audit record |
| #130 | `9faf58534fa45102da9518de2edc7b7db5a15c3a` | Require fresh base for status checks |

## A-02 — Complete Remote Ruleset Snapshots

The full GET responses for ruleset `ai-native-main` (ID `24405506`) are stored
in:

* `governance/execution/current/A02-RULESET-BEFORE.json`
* `governance/execution/current/A02-RULESET-AFTER.json`

The API values show `strict_required_status_checks_policy=false` before and
`true` after. A structural comparison, excluding only that intended field and
the server-maintained `updated_at` timestamp, passed. Enforcement, target,
conditions, bypass actors, all pull-request parameters and all six required
check contexts/source app IDs are unchanged.

## F-001 — Live Environment

GitHub REST API GET for `ai-native-human-review` reports
`can_admins_bypass=false`; the required reviewer and branch-policy protection
remain configured. This confirms F-001 remains closed at the remote-config
level. No claim is made here about `prevent_self_review` or a new behavioral
end-to-end exercise.

## Candidate Publication State

* Local `refs/tags/v3.3.0`: absent.
* GitHub tag ref `v3.3.0`: API returned 404.
* GitHub release `v3.3.0`: not found.
* New final PLATFORM audit: pending and not run in this execution.
* Final release-gate: pending and not run in this execution.
* Audit host: Windows; `CONTEXTUAL_NON_BLOCKING` for this governance task.

No files in the P0-T2 archive were changed.
