# HARDENING-V1.1 H7 - First Client Project Playbook Spec

Related Governance Task: AI-NATIVE-HARDENING-V1.1/H7
Related Roadmap: governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md

## Objective

Create an operational playbook for starting the first real AI-Native client
project.

## Engineering Purpose

Turn the hardening assets from H1 through H6 into a concrete first-project path
that a human and agent team can execute with SDD, validation, evidence,
Inspector review and HITL closure.

## Affected Repositories

* root/governance for governance record, SDD artifacts and closure evidence.
* `ai-knowledge` for the canonical first client project playbook, contract and
  validator.
* `ai-template` for first project onboarding documentation and validator.

## Expected Files Or Areas

* `governance/documentation/FIRST-CLIENT-PROJECT-PLAYBOOK.md`
* `ai-knowledge/docs/playbooks/first-client-project-playbook.md`
* `ai-knowledge/docs/playbooks/first-client-project-playbook.contract.json`
* `ai-knowledge/scripts/validate-first-client-project-playbook.mjs`
* `ai-template/docs/onboarding/FIRST-PROJECT.md`
* `ai-template/scripts/validate-first-project-onboarding.mjs`
* `specs/hardening-v1.1-h7-first-client-project-playbook/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H7/`

## Non-Goals

* Do not open H8.
* Do not create a real client repository.
* Do not modify runtime behavior.
* Do not modify `ai-foundation`.
* Do not mark H7 as HITL approved.
* Do not push.
* Do not reopen H1 through H6 or `ENTERPRISE-10-10-V1`.
* Do not create `ENTERPRISE-10-10-V2`.

## Acceptance Criteria

* AC-001: The playbook lets a human or agent start a first client project.
* AC-002: The playbook references SDD, generator, testing, observability,
  security and evaluation.
* AC-003: The playbook distinguishes pilot/MVP from production-critical use.
* AC-004: The playbook includes stop conditions, escalation, local closure and
  HITL final review.
* AC-005: Machine-readable contract and local validators exist.
* AC-006: H1-H6 remain formally closed and H8 remains not opened.

## Expected Validations

* `node scripts/validate-first-client-project-playbook.mjs`
* `node scripts/validate-structure.mjs`
* `node sdd/validation/validate-sdd-package.mjs`
* `node scripts/validate-first-project-onboarding.mjs`
* `node scripts/validate-structure.mjs`
* JSON parse for H7 contracts.
* `git diff --check`
* negative checks for H8 and `ENTERPRISE-10-10-V2`

## Risks

* A generic playbook would not be operationally useful.
* Production readiness could be inferred incorrectly from a pilot path.
* H7 must not start H8 or create a real client repository.
