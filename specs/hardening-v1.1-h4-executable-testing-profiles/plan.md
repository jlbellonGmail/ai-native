# Implementation Plan

## Metadata

Feature ID: hardening-v1.1-h4-executable-testing-profiles

Feature Name: H4 - Executable Testing Profiles

Status: PLANNED

Created: 2026-07-02

Updated: 2026-07-02

---

## Summary

Add a lightweight testing profile system to ai-template and generated projects.
The system keeps W6 readiness contracts intact while adding runnable local smoke
profiles for adoption readiness.

---

## Architecture Impact

Affected areas:

- ai-template validation assets
- ai-template generated project scaffold
- ai-template project template baseline
- root specs and governance

Architecture decisions:

- Profiles are JSON contracts plus Node.js validators.
- Smoke execution is local, deterministic and dependency-free.
- Generated projects are self-contained.

Layer or boundary changes:

- No runtime service boundary changes.
- No ai-foundation or ai-knowledge product changes.

---

## Files Expected To Change

Allowed files or directories:

- specs/hardening-v1.1-h4-executable-testing-profiles/
- ai-template/package.json
- ai-template/docs/setup/PROJECT_BOOTSTRAP.md
- ai-template/validation/
- ai-template/testing/
- ai-template/scripts/
- ai-template/scaffolds/ai-native-app/files/
- ai-template/templates/project/
- governance H4 roadmap/current/archive/session files

Files or directories explicitly not allowed:

- ai-foundation product files
- ai-knowledge product files
- H5/H6/H7/H8 implementation files
- VERSION files
- remotes, pipelines or dependency lockfiles unless already required

---

## Implementation Strategy

Step 1: Add H4 SDD artifacts in root specs.

Step 2: Add ai-template testing profile catalog, docs, smoke runner and validator.

Step 3: Add generated-project scaffold testing profiles, docs, scripts and smoke
runner.

Step 4: Add equivalent project template baseline assets under
ai-template/templates/project/.

Step 5: Update existing validators and generated project validation to include
H4 assets.

Step 6: Run validations, inspect diff, commit ai-template, then update and
commit governance.

---

## Data / Contracts / Interfaces

New contracts:

- testing/profiles/testing-profiles.json
- validation/testing-profiles.md

Changed contracts:

- validation/roadmap-coverage.json maps H4 to concrete files.
- generated project manifest adds H4 testing profile metadata.

Backward compatibility notes:

- Existing H2/H3 validators remain valid.
- Generated projects gain new scripts but keep `npm run validate`.

---

## Validation Strategy

Validation commands:

- node scripts/validate-testing-profiles.mjs
- node scripts/validate-structure.mjs
- node scripts/validate-create-ai-native-app.mjs
- node scripts/validate-generated-project.mjs --target <smoke-target>
- npm run validate in generated smoke project
- npm run test:profiles in generated smoke project
- git diff --check

Manual checks:

- inspect diff for H4 scope only
- verify H5 not opened
- verify no generated junk or local artifacts

Expected outputs:

- H4 profile validation PASS
- ai-template structure validation PASS
- generated project validation PASS
- executable testing profiles smoke PASS

---

## Governance Strategy

Governance files expected to change:

- governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md
- governance/SESSION-CONTEXT.md
- governance/execution/current/README.md
- governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H4/

Archive requirements:

- README.md
- SUMMARY.md
- CHANGES.md
- VALIDATION.md
- EVIDENCE.md
- executable-testing-profiles.contract.json

HITL requirements:

- H4 closes locally only as CLOSED_LOCALLY / HITL_REQUIRED.

---

## Commit Strategy

Expected commits:

1. feat(template): implement HARDENING-V1.1 H4 executable testing profiles
2. docs(governance): close HARDENING-V1.1 H4 executable testing profiles

Commit separation rules:

- Product/template changes stay in ai-template.
- Governance and specs stay in root/governance.

---

## Recovery Strategy

If interrupted, recover by checking:

- governance
- current spec directory
- git status
- recent commits
- validation evidence

---

## Risk Controls

Risk: Smoke profiles are overstated as full testing evidence.

Control: Documentation calls them local smoke profiles and avoids fake coverage,
load, mutation or chaos claims.

Risk: Project template and scaffold drift.

Control: H4 validator checks profile ID and command consistency across catalogs.
