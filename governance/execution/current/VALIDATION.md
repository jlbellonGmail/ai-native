# VALIDATION

## Precheck

* `git fetch origin`: PASS.
* `git merge --ff-only origin/main`: PASS; local `main` fast-forwarded.
* `git rev-parse HEAD` equals `git rev-parse origin/main` at pre-reconciliation
  baseline `9faf58534fa45102da9518de2edc7b7db5a15c3a`: PASS.
* Pre-reconciliation working tree clean: PASS.
* GitHub API reports PR #130 `MERGED` with merge SHA equal to the baseline: PASS.
* PRs #127–#129 also report `MERGED`: PASS.
* Local v3.3.0 tag absent, GitHub tag ref 404, release not found: PASS.

## Remote Security Configuration

* Ruleset GET before: `strict_required_status_checks_policy=false`: PASS.
* Ruleset PUT changed the requested strict policy to `true`: PASS.
* Fresh ruleset GET after: `strict_required_status_checks_policy=true`: PASS.
* Structural before/after comparison: PASS. Only the requested strict policy
  and server-maintained `updated_at` changed; bypass actors, enforcement,
  branch targeting, PR protections and six required checks/source apps match.
* F-001 recheck: environment GET reports `can_admins_bypass=false` and retains
  the required reviewer and branch-policy rule: PASS.

## Governance and Documentation

* Complete before/after ruleset JSON parses and contains the expected false / true
  strict values: PASS.
  Command: `node -e "const fs=require('node:fs'); for (const [p,expected] of [['governance/execution/current/A02-RULESET-BEFORE.json',false],['governance/execution/current/A02-RULESET-AFTER.json',true]]) { const d=JSON.parse(fs.readFileSync(p,'utf8')); const r=d.rules.find(x=>x.type==='required_status_checks'); if (!r || r.parameters.strict_required_status_checks_policy !== expected) throw new Error('bad snapshot '+p); } console.log('PASS: both full ruleset snapshots are valid JSON with expected strict values');"`.
* `git diff --check`: PASS.
* `node runtime/docs/validate-doc-drift.mjs`: PASS.
* P0-T2 archive unchanged: PASS (`git diff --name-only -- governance/execution/archive`
  returned no paths).
* Scope limited to `governance/execution/current/`: PASS (`git status --short`
  showed only the five current records and two ruleset snapshots).

## Explicitly Not Run

* New PLATFORM audit: `NOT_RUN` by instruction.
* Final release-gate: `NOT_RUN` by instruction.
* Tag creation and release publication: `NOT_RUN` by instruction.
* No product code or MINOR remediation was performed.

The local host is Windows and is recorded as `CONTEXTUAL_NON_BLOCKING`; it does
not replace any required cross-platform evidence in the later final audit.
