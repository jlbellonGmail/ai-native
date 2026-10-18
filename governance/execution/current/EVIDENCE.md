# EVIDENCE

## Governance and Candidate Sources

* Current v3.3.0 lifecycle status: `governance/SESSION-CONTEXT.md`.
* Candidate/release constraints: `governance/versioning/V3.3.0-RELEASE.md`.
* Human merge rule D6: `governance/security/HITL-MERGE-POLICY.md`.
* P0-T2 history (preserved, not edited):
  `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-IMPLEMENTATION/`.

## Main and Merged PR Evidence

After `git fetch origin` and `git merge --ff-only origin/main`, the verified
clean main baseline is `823b31976cfc255926a2e39a205b2c22472b8d85`.
GitHub API confirms PRs #127–#132 are merged; #131 is the current-snapshot
reconciliation and #132 records the prior audit. The previous audit report is
`.audit/reports/AUDIT-PLATFORM-e4dee28.md` (92.25/100; one MAJOR before the
remote trust-environment correction).

## Trust Environment — Complete Before/After API Evidence

The composite snapshots preserve the full environment GET, selected deployment
branch-policy response, and secret metadata (names/timestamps only; never
secret values):

* `TRUST-ENV-BEFORE.json`
* `TRUST-ENV-AFTER.json`

Before: `can_admins_bypass=true`; policy `main`; protection type `branch_policy`;
secret names `TRUST_APP_ID` and `TRUST_APP_PRIVATE_KEY`.
After: `can_admins_bypass=false`; policy remains `main`; same protection type
and same secret names/metadata. A full structural comparison, excluding only
the requested boolean, API `updated_at`, and capture timestamps, passed. This
closes the bypass capability; it does not establish whether a historical
bypass occurred.

## Revalidated Control Plane

* `ai-native-trust`: `can_admins_bypass=false`; custom deployment policy still
  selects only `main`; secrets metadata unchanged.
* `ai-native-human-review`: `can_admins_bypass=false`; reviewer
  `jlbellonGmail` and `main` branch policy remain.
* `ai-native-main` (ID `24405506`): active; default-branch target; no bypass
  actors; `strict_required_status_checks_policy=true`; PR rule unchanged; all
  six required contexts and integration IDs match the verified after snapshot.

## Candidate Publication State

* Local v3.3.0 tag: absent; GitHub tag ref: 404.
* GitHub v3.3.0 release: not found.
* New independent PLATFORM audit: pending.
* Final release-gate: pending; not run before the new audit.
* Audit host: Windows / `CONTEXTUAL_NON_BLOCKING`.

No P0-T2 archive files were changed.
