# AI-NATIVE Factory Constitution

## Purpose

This constitution defines the stable Spec-Driven Development principles for the AI-NATIVE factory.

The AI-NATIVE factory is responsible for evolving:

- governance
- ai-foundation
- ai-knowledge
- ai-template
- project generation
- reusable SDD methodology
- agent operating standards
- skills
- validation systems
- adoption readiness

This file is not a roadmap.

This file is not a task tracker.

This file must not contain temporary execution state.

Temporary state belongs in governance.

---

## Core Principle

Specification is the persistent source of implementation intent.

Governance defines what is active.

Specs define what must be built.

Plans define how it will be built.

Tasks define the executable checklist.

Verification proves completion.

Inspection prevents drift.

Git records what changed.

Human approval records formal acceptance when required.

---

## SDD Mode

The AI-NATIVE factory uses spec-anchored development.

That means:

- every meaningful change must be anchored in a specification
- important changes must update the relevant spec before implementation
- code is derived from the spec, not guessed from prompts
- the spec remains alive during the task
- implementation must be verified against acceptance criteria

Spec-as-source may be evaluated later, but it is not the default operating model.

---

## Mandatory SDD Flow

Every executable factory task must follow:

1. Constitution
2. Specify
3. Plan
4. Tasks
5. Implement
6. Verify
7. Inspect
8. Close

No implementation is allowed before Specify and Plan.

No closure is allowed before Verify and Inspect.

---

## Artifact Model

Factory SDD artifacts live in:

.specify/
specs/

The `.specify/` directory contains stable memory and templates.

The `specs/` directory contains task or feature-specific artifacts.

A future factory task should use this shape:

specs/<task-or-feature-id>/
├── spec.md
├── plan.md
├── tasks.md
├── verification.md
└── inspector.md

Do not create a task spec unless governance confirms the task is active or explicitly requested by the user.

---

## Governance Boundary

Governance remains the official state machine.

Specs do not replace governance.

Governance owns:

- active roadmap
- current task
- eligibility
- closure state
- archive state
- HITL state
- final approval

Specs own:

- intent
- acceptance criteria
- technical plan
- task checklist
- verification evidence
- inspection evidence

If governance and specs conflict, stop and report the inconsistency.

---

## Factory Scope

The factory has four main areas:

governance/
Roadmaps, session state, execution current, archives, evidence and closure records.

ai-foundation/
Technical foundation, runtime, security, observability and reusable base components.

ai-knowledge/
Knowledge, standards, prompts, SDD assets, guardrails, quality gates and evaluation.

ai-template/
Project templates, generators, scaffolds, manifests and generated-project behavior.

Cross-repository changes require explicit justification.

---

## Multi-Agent Model

The factory supports multi-agent execution through logical roles.

Coordinator:
Reads governance and specs. Defines scope. Does not write implementation code.

Builder:
Implements only tasks listed in tasks.md.

Inspector:
Audits diffs, validations, governance, commits and closure readiness.

Verifier:
Runs tests, validators and acceptance checks.

One physical agent may perform multiple roles, but the roles must remain logically separate.

---

## Loop Engineering Policy

Controlled loops are allowed only inside the current task.

Allowed loop:

Implement → Verify → Fix → Verify

Limits:

- maximum 3 correction loops unless user approves more
- no silent scope expansion
- no silent spec changes
- no next-task work
- no bypassing tests
- no weakening validators

If failure is caused by unclear requirements, stop and request human decision.

If failure is caused by implementation bugs, fix within the current tasks.md.

If failure is caused by plan design, update plan.md before continuing.

---

## Token Discipline

The factory must reduce token usage by structure, not by losing rigor.

Rules:

- stable rules belong in AGENTS.md and this constitution
- procedures belong in skills
- task intent belongs in specs
- task state belongs in governance
- prompts must stay compact
- agents must read narrow files before broad files
- agents must summarize evidence instead of dumping logs

---

## Validation Principle

A task is not complete because the agent says it is complete.

A task is complete only when:

- acceptance criteria are satisfied
- relevant validations pass
- diff is inspected
- governance is consistent
- commits are auditable
- residual risks are documented
- human approval is recorded when required

---

## Human Responsibility

AI agents execute.

The human remains accountable for product direction, final approval and risk acceptance.

Power without control is not acceptable.

<!-- AI_NATIVE_FACTORY_DELIVERY_GOVERNANCE_POLICY_START -->

---

## Delivery Governance Policy

Every executable task is treated as one feature unless governance explicitly defines it as audit-only, documentation-only or governance-only.

A feature must have a clear boundary across:

- governance
- specs
- git
- branch or worktree
- validation
- documentation
- Security by Design
- DevSecOps
- observability / monitoring
- Engram checkpoint when available
- MCP context usage when available
- closure evidence
- human approval when required

Git records what changed.

GitHub records remote collaboration and external verification when configured.

GitHub Actions provides external CI evidence when configured.

Worktrees may isolate risky, parallel or recovery work.

Engram and MCP are context-efficiency tools. They reduce token and context-window pressure, but they do not replace governance, git or validators.

<!-- AI_NATIVE_FACTORY_DELIVERY_GOVERNANCE_POLICY_END -->
