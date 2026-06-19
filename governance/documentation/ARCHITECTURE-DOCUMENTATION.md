# Architecture Documentation

Program: ENTERPRISE-10-10
Task: W7-T3
Status: IMPLEMENTED

## Scope

W7-T3 documents the current architecture for the documentation completion
workstream. The task is governance-only and records architecture boundaries,
system documentation and an architecture map without changing product repos,
runtime behavior, pipelines, workflows or VERSION files.

Documented architecture surfaces:

* root governance repository
* `ai-foundation`
* `ai-knowledge`
* `ai-template`
* roadmap and execution evidence model

## System Boundaries

The workspace is organized as one governance root plus three independent
product repositories:

* root governance stores roadmap, session continuity, standards and execution
  evidence. It does not contain product runtime code.
* `ai-foundation` owns foundation concerns such as security, observability,
  runtime references, roles, validation and supporting documentation.
* `ai-knowledge` owns knowledge governance, prompt registry, agent registry,
  evaluation assets, benchmarks, datasets, scoring and quality gates.
* `ai-template` owns reusable template, scaffold, generator, manifest and
  testing governance assets.

The root Git repository does not capture product repo commits because the
product repositories are independent Git repositories under the workspace.

## Architecture Map

| Surface | Responsibility | Evidence |
| --- | --- | --- |
| root governance | Roadmap, session context, execution evidence and standards | `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`, `governance/SESSION-CONTEXT.md`, `governance/execution/` |
| `ai-foundation` | Foundation validation, security and observability documentation | `ai-foundation/security/`, `ai-foundation/observability/`, `ai-foundation/validation/roadmap-coverage.json` |
| `ai-knowledge` | Prompt registry, agent registry and evaluation governance | `ai-knowledge/registries/`, `ai-knowledge/config/`, `ai-knowledge/evaluation/`, `ai-knowledge/validation/roadmap-coverage.json` |
| `ai-template` | Reusable scaffolds, templates and testing governance contracts | `ai-template/templates/`, `ai-template/scaffolds/`, `ai-template/validation/` |

## Consistency Rules

Architecture documentation for ENTERPRISE-10-10 must:

1. Preserve the independent Git boundary between root governance and product
   repositories.
2. Treat governance roadmap and execution evidence as the closure source for
   roadmap tasks.
3. Treat product repos as the source for product artifacts, validators and
   contracts.
4. Avoid claiming runtime architecture changes unless product diffs prove
   those changes.
5. Avoid changing VERSION files from documentation-only tasks.
6. Keep future roadmap tasks unopened until explicitly selected.
7. Record architecture gaps as documentation evidence without closing setup,
   onboarding, runbook or final audit tasks.

## Contract

The machine-readable architecture contract is stored at:

`governance/documentation/architecture-documentation.contract.json`

The contract records architecture surfaces, boundaries, the architecture map,
consistency checks, explicit non-goals and roadmap continuity for W7-T3.

## Non-Goals

* No product repo changes.
* No runtime architecture changes.
* No workflow changes.
* No pipeline changes.
* No VERSION changes.
* No W7-T4 opening or closure.
