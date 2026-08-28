# HARDENING-V1.1 H7 - First Client Project Playbook Plan

## Change Strategy

Add a canonical first client project playbook in `ai-knowledge`, a template
onboarding reference in `ai-template`, and governance/spec evidence in root.
Keep the implementation documentation-only and auditable.

## Repository Scope

* root/governance: governance record, SDD artifacts and closure evidence.
* `ai-knowledge`: playbook, contract and validator.
* `ai-template`: onboarding document, validator and package script.
* `ai-foundation`: no changes planned.

## Files Allowed To Change

* `governance/documentation/FIRST-CLIENT-PROJECT-PLAYBOOK.md`
* `governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md`
* `governance/SESSION-CONTEXT.md`
* `governance/execution/current/**`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H7/**`
* `ai-knowledge/docs/playbooks/first-client-project-playbook.md`
* `ai-knowledge/docs/playbooks/first-client-project-playbook.contract.json`
* `ai-knowledge/scripts/validate-first-client-project-playbook.mjs`
* `ai-template/docs/onboarding/FIRST-PROJECT.md`
* `ai-template/scripts/validate-first-project-onboarding.mjs`
* `ai-template/package.json`
* `specs/hardening-v1.1-h7-first-client-project-playbook/**`

## Validators To Run

* `ai-knowledge`: H7 validator, structure validator and SDD validator.
* `ai-template`: H7 onboarding validator and structure validator.
* root/governance: H7 JSON parse, roadmap/current/archive text checks and git
  checks.
* all repos: `git diff --check` and `git status --short`.

## Governance Update Strategy

After product validation passes, archive H7 evidence, update roadmap and
session context, replace current execution snapshot with H7 state, and leave H8
not opened.

## Commit Strategy

* Commit `ai-knowledge` playbook changes separately.
* Commit `ai-template` onboarding changes separately.
* Commit root/governance specs and closure evidence separately.
* Do not push.

## Recovery Considerations

If validation fails, do not close H7. Keep H8 not opened and report the failing
command with evidence.
