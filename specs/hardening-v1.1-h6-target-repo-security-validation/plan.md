# HARDENING-V1.1 H6 - Target Repository Security Validation Plan

## Change Strategy

Add the minimum reusable security validation package for future target
repositories: governance checklist, foundation procedure/contract/validator and
template bootstrap documentation copied into generated projects.

## Repository Scope

* root/governance: checklist, SDD artifacts and closure evidence.
* `ai-foundation`: target repository security procedure, contract and validator.
* `ai-template`: security bootstrap docs, generated project manifest/contract
  updates and validators.
* `ai-knowledge`: read-only; run existing SDD validation only.

## Files Allowed To Change

* `governance/security/TARGET-REPO-SECURITY-CHECKLIST.md`
* `governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md`
* `governance/SESSION-CONTEXT.md`
* `governance/execution/current/**`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H6/**`
* `ai-foundation/security/target-repo-validation.md`
* `ai-foundation/security/target-repo-validation.contract.json`
* `ai-foundation/scripts/validate-target-repo-security.mjs`
* `ai-foundation/package.json`
* `ai-template/docs/security/SECURITY-BOOTSTRAP.md`
* `ai-template/scaffolds/ai-native-app/files/**`
* `ai-template/templates/project/docs/security/SECURITY-BOOTSTRAP.md`
* `ai-template/scripts/validate-security-bootstrap.mjs`
* `ai-template/scripts/validate-generated-project.mjs`
* `ai-template/package.json`
* `specs/hardening-v1.1-h6-target-repo-security-validation/**`

## Validators To Run

* `ai-foundation`: H6 validator, W1 enterprise validator, structure validator
  where applicable, git checks.
* `ai-template`: H6 validator, generated project validator, generator validator,
  structure/template validators, smoke generation if needed, git checks.
* `ai-knowledge`: SDD package validator and git checks.
* root/governance: JSON parse for H6 contracts, roadmap/current/archive checks,
  git checks.

## Governance Update Strategy

After product validation passes, archive H6 evidence, update roadmap and
session context, replace current execution snapshot with H6 state, and leave H7
and H8 not opened.

## Commit Strategy

* Commit `ai-foundation` product changes separately.
* Commit `ai-template` product changes separately.
* Commit root/governance specs and closure evidence separately.
* Do not push.

## Recovery Considerations

If validation fails, do not close H6. Keep H7/H8 not opened and report the
blocking command with evidence.
