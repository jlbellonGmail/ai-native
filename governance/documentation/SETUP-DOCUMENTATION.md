# Setup Documentation

Program: ENTERPRISE-10-10
Task: W7-T4
Status: IMPLEMENTED

## Scope

W7-T4 documents the reproducible setup path for the ENTERPRISE-10-10
workspace. The task is governance-only and records setup guidance, bootstrap
contracts and installation documentation without executing installation,
changing product repositories, modifying runtime behavior, changing pipelines
or updating VERSION files.

Documented setup surfaces:

* root governance repository
* `ai-foundation`
* `ai-knowledge`
* `ai-template`
* local validation commands and evidence archives

## Prerequisites

The setup flow assumes an operator has local access to the workspace and can
inspect each independent Git repository:

* `D:/proyectos/ai-native`
* `D:/proyectos/ai-native/ai-foundation`
* `D:/proyectos/ai-native/ai-knowledge`
* `D:/proyectos/ai-native/ai-template`

Required local tools are documented as prerequisites only:

* Git, for repository status and commit history inspection.
* Node.js and npm, for product validators where package scripts exist.
* PowerShell, for the documented Windows command examples.
* Engram CLI, as optional continuity memory. Git and governance remain the
  source of truth if Engram is unavailable.

## Bootstrap Flow

The reproducible bootstrap sequence is:

1. Verify the root governance repository status.
2. Verify each product repository status independently.
3. Read the roadmap before selecting a task.
4. Read `governance/SESSION-CONTEXT.md` and the relevant execution archive.
5. Confirm the next eligible task before implementation.
6. Run only validators that exist and apply to the impacted repository.
7. Commit product changes only in the impacted product repository.
8. Commit governance changes in the root repository.
9. Attempt push once per affected repository and record blocked push attempts
   as `CONTEXTUAL_NON_BLOCKING` when caused by external policy or remote
   verification.

This flow is documentation only. It does not install dependencies, bootstrap
services, create environments, change remotes, grant credentials or execute
runtime deployment.

## Installation Documentation

Installation guidance for ENTERPRISE-10-10 is limited to local repository
preparation and validation readiness:

| Surface | Installation guidance | Evidence |
| --- | --- | --- |
| root governance | Clone or open the governance repository and verify roadmap/session context before task work. | `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`, `governance/SESSION-CONTEXT.md` |
| `ai-foundation` | Open as an independent product Git repository and run available foundation validators when impacted. | `ai-foundation/scripts/`, `ai-foundation/validation/roadmap-coverage.json` |
| `ai-knowledge` | Open as an independent product Git repository and run available registry/evaluation validators when impacted. | `ai-knowledge/scripts/`, `ai-knowledge/validation/roadmap-coverage.json` |
| `ai-template` | Open as an independent product Git repository and run available template/testing validators when impacted. | `ai-template/scripts/`, `ai-template/validation/` |
| Engram | Use project `ai-native` for continuity checkpoints when available. | `engram context ai-native`, `engram search --project ai-native` |

No package installation is performed by this task. If a future task requires
dependency installation, that task must document the command, repository,
validation impact and approval requirements explicitly.

## Setup Guardrails

Setup documentation for ENTERPRISE-10-10 must:

1. Preserve the independent Git boundary between the root repository and the
   product repositories.
2. Treat the roadmap, session context and execution archive as the mandatory
   setup reading order.
3. Avoid installing packages, creating services or changing runtime state from
   documentation-only tasks.
4. Avoid changing VERSION files unless a roadmap task explicitly authorizes it.
5. Avoid changing remotes or retrying blocked pushes without human
   authorization.
6. Keep future roadmap tasks unopened until explicitly selected.
7. Record setup gaps without closing onboarding, runbook or final audit tasks.

## Contract

The machine-readable bootstrap contract is stored at:

`governance/documentation/setup-documentation.contract.json`

The contract records setup surfaces, prerequisites, bootstrap steps,
installation documentation, guardrails, explicit non-goals and roadmap
continuity for W7-T4.

## Non-Goals

* No product repo changes.
* No real installation.
* No dependency installation.
* No runtime environment creation.
* No workflow changes.
* No pipeline changes.
* No VERSION changes.
* No W7-T5 opening or closure.
