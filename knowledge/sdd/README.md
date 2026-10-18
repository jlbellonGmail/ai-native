# SDD Package

This package defines the canonical Spec-Driven Development flow for AI-native
projects.

SDD has four mandatory phases:

1. Specify
2. Plan
3. Implement
4. Verify

Each phase produces a reusable artifact, passes a named gate and records the
evidence needed by the next phase. A task is not ready for implementation until
the specification and plan gates are both passed.

## Package Contents

| Path | Purpose |
|---|---|
| `canonical-flow.md` | Canonical phase model and transition rules. |
| `gates.md` | Acceptance gates, Definition of Ready and Definition of Done. |
| `templates/spec-template.md` | Feature specification template. |
| `templates/plan-template.md` | Implementation plan template. |
| `templates/implementation-template.md` | Execution record template. |
| `templates/verification-template.md` | Verification report template. |
| `contracts/sdd-package.contract.json` | Machine-readable SDD package contract. |
| `validation/validate-sdd-package.mjs` | Local validator for package structure and scope. |
| `methodology/` | Per-phase methodology (levels, EARS, clarify, plan, tasks, implementation/TDD, validation, review, change, modes), loaded on demand. |
| `QUICKSTART.md` | The whole workflow in five minutes (`/feature`, `/sdd-*`). |
| `ARCHITECTURE.md` | Where each capability lives (foundation / knowledge / template / consumer) and why. |
| `agents-contract-detail.md` | Verbatim detailed checklists behind the `AGENTS.md` routers (factory and generated projects; shipped in the release). |
| `feature-templates/` | Seven feature-artifact templates (spec, plan, tasks, documentation, security, inspector, verification). A project overrides one by placing its own in `.specify/templates/`. |
| `KNOWLEDGE.json` | Package version descriptor (`contracts/knowledge-package.schema.json`): schema, version, required workflow contract, minimum platform. |
| `goals/GI-BATCH-UPGRADE.goal.md` | Ready-to-run goal template for adopting, then upgrading, consumer repositories (factory-only, not shipped). |

## Use In A Real Project

Start every non-trivial feature by copying the four templates into the project
evidence area. Fill them in order and stop at the first failed gate.

Required order:

```text
SPEC_READY -> PLAN_READY -> IMPLEMENTATION_READY -> VERIFICATION_READY -> DONE
```

The package is self-contained and does not depend on chat history. If a project
team cannot reconstruct the objective, constraints, acceptance criteria, plan,
implementation evidence and verification evidence from the artifacts, the SDD
cycle is incomplete.

## Validate

Run from `ai-knowledge`:

```bash
node sdd/validation/validate-sdd-package.mjs
```
