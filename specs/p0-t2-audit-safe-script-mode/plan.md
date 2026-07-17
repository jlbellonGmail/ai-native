# P0-T2 - Audit-Safe Script Mode Plan

Status: SPEC_CLOSED_LOCALLY / HITL_REQUIRED
Created: 2026-07-17
Updated: 2026-07-17

## Summary

Create a versioned, auditable SDD specification for P0-T2 without implementing
Audit-Safe Script Mode. The change defines the normative behavior, package-level
script policy, execution contract and validation expectations needed for a later
implementation task.

## Change Strategy

* Add SDD artifacts under `specs/p0-t2-audit-safe-script-mode/`.
* Add a machine-readable contract in the same spec directory.
* Update governance current execution evidence to record the specification-only
  closure.
* Archive the specification evidence under
  `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-SPEC/`.
* Do not modify product repositories or product scripts.
* Do not run package-level scripts.

## Architecture Impact

Affected areas:

* root/governance specs and execution evidence only.

Architecture decisions:

* Audit-Safe Script Mode is specified as a behavior contract first.
* The spec allows future implementation through env var, wrapper, manifest,
  script classifier or dedicated command, but does not require one mechanism.

Layer or boundary changes:

* No runtime, product, generator, dependency or package-script behavior changes
  are made in this specification task.

## Repository Scope

root/governance:

* SDD artifacts.
* Governance current execution evidence.
* Governance archive evidence.

`ai-foundation`:

* Read-only evidence only.

`ai-knowledge`:

* Read-only evidence only.

`ai-template`:

* Read-only evidence only.

## Files Allowed To Change

Allowed:

* `specs/p0-t2-audit-safe-script-mode/**`
* `governance/execution/current/README.md`
* `governance/execution/current/SUMMARY.md`
* `governance/execution/current/EVIDENCE.md`
* `governance/execution/current/VALIDATION.md`
* `governance/execution/current/CHANGES.md`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-SPEC/**`
* `governance/SESSION-CONTEXT.md`

Explicitly not allowed:

* product scripts;
* `package.json`;
* lockfiles;
* `VERSION`;
* H1-H8 archive content;
* H9 artifacts;
* `ENTERPRISE-10-10-V2` artifacts;
* generated real application files.

## Implementation Strategy For This Specification Task

Step 1: Confirm clean repository baseline.

Step 2: Discover local governance, SDD templates, package script evidence,
lifecycle hooks and side-effect surfaces.

Step 3: Draft the P0-T2 SDD artifacts and contract.

Step 4: Run static validations only.

Step 5: Perform Inspector review against scope, sufficiency and governance
constraints.

Step 6: Update verification and governance evidence with actual command
results.

Step 7: Commit locally without push.

## Future Implementation Orientation

A later implementation task should:

* choose the minimal local mechanism for audit-safe mode;
* implement script classification;
* implement blocking or allowlisting behavior;
* implement baseline/final git evidence capture;
* add tests or validators for lifecycle blocking and mutation detection;
* update product repositories only where the implementation contract requires.

This plan does not authorize that implementation.

## Data / Contracts / Interfaces

New contract:

* `specs/p0-t2-audit-safe-script-mode/audit-safe-script-mode.contract.json`

Changed contracts:

* None.

Backward compatibility:

* Normal package-script behavior is not changed by this specification.
* Future implementation must preserve normal mode unless governance explicitly
  changes it.

## Validation Strategy

Validation commands:

* Parse `audit-safe-script-mode.contract.json`.
* Verify required spec files exist.
* Search for forbidden scope expansion: H9, `ENTERPRISE-10-10-V2`, first real
  application creation.
* Verify P0-T1 remains formally accepted in governance text.
* Verify H1-H8 remain formally closed in governance text.
* `git diff --check`.
* Final git status, branch, HEAD, diff stat and diff check for all four
  repositories.

Manual checks:

* Diff inspection.
* Inspector checklist.
* Confirmation that no package-level scripts were executed.
* Confirmation that no push occurred.

Expected outputs:

* JSON parse PASS.
* Static scope checks PASS.
* Root repository contains only spec/governance evidence changes.
* Product repositories remain clean.

## Governance Strategy

Governance files expected to change:

* `governance/execution/current/**`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-SPEC/**`
* `governance/SESSION-CONTEXT.md`

Archive requirements:

* Archive the specification-only execution evidence under `P0-T2-SPEC`.

HITL requirements:

* Record only `HITL_REQUIRED`.
* Do not record human approval.

## Commit Strategy

Expected commits:

1. `docs(specs): define P0-T2 audit-safe script mode`

Commit separation:

* One root/governance commit is sufficient because this is specification and
  governance evidence only.
* No product commits are expected.

## Recovery Strategy

If interrupted, recover by checking:

* git status in all four repositories;
* `specs/p0-t2-audit-safe-script-mode/`;
* `governance/execution/current/`;
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-SPEC/`;
* recent root commits.

## Risk Controls

Risk: Specification over-prescribes implementation.

Control: Define required behavior and observable contract while allowing
multiple future mechanisms.

Risk: Specification under-defines package-level policy.

Control: Include package-level, lifecycle, recursive and generated-output
rules tied to local evidence.

Risk: Scope creep into implementation.

Control: Restrict changes to root specs/governance and avoid product edits or
package script execution.
