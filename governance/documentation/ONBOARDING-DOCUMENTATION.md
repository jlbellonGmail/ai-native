# Onboarding Documentation

Program: ENTERPRISE-10-10
Task: W7-T5
Status: IMPLEMENTED

## Scope

W7-T5 documents the onboarding path for contributors and operators working on
ENTERPRISE-10-10. The task is governance-only and records an onboarding guide,
learning path and onboarding contract without automating onboarding, changing
product repositories, modifying runtime behavior, changing workflows, changing
pipelines or updating VERSION files.

Documented onboarding audiences:

* governance operator
* product repository contributor
* validation reviewer
* continuity maintainer

## Onboarding Guide

The onboarding guide starts from the existing governance source of truth:

1. Open the root governance repository.
2. Read `governance/SESSION-CONTEXT.md`.
3. Read `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`.
4. Inspect the latest archive under
   `governance/execution/archive/ENTERPRISE-10-10-V1/`.
5. Confirm the next eligible task from the roadmap before making changes.
6. Verify each independent product repository before any task implementation.
7. Use Engram project `ai-native` only as auxiliary continuity memory.
8. Record validation, commits and push status in governance evidence.

This guide does not provision accounts, create user records, configure access,
send invitations, run onboarding automation or modify team membership.

## Learning Path

| Stage | Learning objective | Required evidence |
| --- | --- | --- |
| 1. Governance model | Understand that roadmap, session context and archive evidence control task closure. | `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`, `governance/SESSION-CONTEXT.md` |
| 2. Repository boundaries | Understand root governance and the three independent product Git repositories. | `governance/documentation/ARCHITECTURE-DOCUMENTATION.md` |
| 3. Setup flow | Understand local status checks, validation readiness and one-attempt push recording. | `governance/documentation/SETUP-DOCUMENTATION.md` |
| 4. Product evidence | Understand where product artifacts and validators live when a task impacts product code. | `ai-foundation/`, `ai-knowledge/`, `ai-template/` |
| 5. Closure discipline | Understand product commit rules, governance commit rules and future-task guardrails. | `governance/execution/current/`, latest archive directory |

The learning path is sequential. A contributor should not implement a roadmap
task until stages 1 through 3 are understood and the current roadmap task has
been read directly.

## Role-Specific Checklist

Governance operators must:

* verify git status before editing files.
* confirm the exact roadmap task name and deliverables.
* avoid opening or closing future tasks.
* update current and archive evidence after validation.

Product contributors must:

* work only in the product repository named by the roadmap.
* run existing validators relevant to that repository.
* avoid changing VERSION files without explicit authorization.
* leave unrelated product repositories untouched.

Validation reviewers must:

* compare evidence against the roadmap deliverables.
* confirm machine-readable contracts parse successfully.
* confirm non-goals are preserved.
* record blockers as `STOP HUMAN REQUIRED` only when the local state cannot be
  safely reconciled.

Continuity maintainers must:

* use Engram project `ai-native`.
* treat Engram as auxiliary and git/governance as primary.
* record blocked Engram or push operations as `CONTEXTUAL_NON_BLOCKING` when
  caused by external policy or unverified remote destination.

## Onboarding Guardrails

Onboarding documentation for ENTERPRISE-10-10 must:

1. Preserve the independent Git boundary between root governance and product
   repositories.
2. Require direct roadmap reading before task execution.
3. Avoid automating onboarding or changing identity/access systems from this
   documentation-only task.
4. Avoid modifying product runtime, workflows, pipelines or VERSION files.
5. Avoid treating Engram as a primary source of truth.
6. Keep future roadmap tasks unopened until explicitly selected.
7. Record onboarding gaps without closing runbook or final audit tasks.

## Contract

The machine-readable onboarding contract is stored at:

`governance/documentation/onboarding-documentation.contract.json`

The contract records onboarding audiences, onboarding steps, learning path,
role-specific checklists, guardrails, explicit non-goals and roadmap continuity
for W7-T5.

## Non-Goals

* No product repo changes.
* No onboarding automation.
* No identity or access changes.
* No runtime changes.
* No workflow changes.
* No pipeline changes.
* No VERSION changes.
* No W7-T6 opening or closure.
