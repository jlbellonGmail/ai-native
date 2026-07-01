# AI-NATIVE HARDENING-V1.1 — Adoption Readiness Roadmap

## Status

```text
Status: IN_PROGRESS
Parent Program: AI-NATIVE ENTERPRISE-10-10-V1
Parent Status: GLOBALLY CLOSED
Parent Final Governance Commit: 02a67b0
Parent Governance Score: 10 / 10
Readiness Audit Decision: READY_WITH_CONDITIONS
Readiness Score: 7.4 / 10
Purpose: Convert governance-ready ecosystem into adoption-ready project baseline
```

---

## 1. Context

`AI-NATIVE ENTERPRISE-10-10-V1` was globally closed with a governance score of `10 / 10`.

A subsequent read-only readiness audit determined that the ecosystem is strong in governance, structure, documentation, contracts, validators and architectural intent, but not yet a low-risk production baseline for real client projects.

The readiness decision was:

```text
READY_WITH_CONDITIONS
```

This means the ecosystem can be used for a controlled real pilot, MVP or first internal/client project, but it requires a focused hardening layer before being treated as production-ready.

---

## 2. Objective

The objective of `AI-NATIVE HARDENING-V1.1` is to close only the practical adoption gaps identified by the readiness audit.

This roadmap must not reopen `ENTERPRISE-10-10-V1`.

This roadmap must not repeat closed governance work.

This roadmap must convert the existing ecosystem into a usable, validated and repeatable baseline for real AI-Native projects.

---

## 3. Execution Rules

* Execute one task at a time.
* Follow SDD: Specify → Plan → Implement → Verify.
* Use Builder + Inspector mode.
* Require HITL only at task closure.
* Do not batch tasks.
* Do not reimplement closed ENTERPRISE-10-10-V1 tasks.
* Do not modify runtime, pipelines, remotes or VERSION unless explicitly required by the current hardening task.
* Prefer minimal, adoption-focused changes.
* Every task must produce evidence.
* Every task must have validation.
* Every task must leave all repos clean.
* Product commits are allowed only when the task explicitly affects product repos.
* Governance commits are required for task closure.
* Engram should be registered when available.
* Push should be attempted once only if local policy allows it.

---

## 4. Scope

In scope:

* SDD package.
* Project generation path.
* Runtime observability wiring.
* Executable testing profiles.
* Real evaluation runs.
* Target repository security validation.
* First client project playbook.
* Final adoption readiness audit.

Out of scope:

* Reopening ENTERPRISE-10-10-V1.
* Creating ENTERPRISE-10-10-V2.
* Large architectural rewrites.
* Unbounded platform expansion.
* Client-specific business logic.
* Production deployment for a real client.
* Remote credential or GitHub organization changes unless explicitly approved.

---

# HARDENING TASKS

---

## H1 — SDD Package

Status:

```text
[x] CLOSED
Closed at: 2026-06-30
Product repo: ai-knowledge
Product scope: SDD package only
Governance archive: governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H1/
Next eligible: H2 — Project Generator / create-ai-native-app
H2 opened: NO
```

### Objective

Create a canonical Spec-Driven Development package that agents and developers can use consistently in real projects.

### Problem

The ecosystem contains workflows, requirements skills and acceptance concepts, but it does not yet have a complete, explicit and validated SDD system named and structured as:

```text
Specify → Plan → Implement → Verify
```

### Expected Deliverables

* Canonical SDD guide.
* Feature specification template.
* Implementation plan template.
* Acceptance criteria template or schema.
* Verification checklist.
* Agent instructions for SDD execution.
* SDD validator or validation contract where applicable.

### Candidate Files

```text
governance/standards/SDD-STANDARD.md
governance/templates/sdd/feature-spec.template.md
governance/templates/sdd/implementation-plan.template.md
governance/templates/sdd/acceptance-criteria.template.md
governance/templates/sdd/verification-report.template.md
ai-template/config/ai/sdd_workflow.md
ai-template/validation/sdd-validation.md
```

### Acceptance Criteria

* SDD is explicitly defined.
* Each phase has required inputs and outputs.
* Agents know when to stop.
* Acceptance criteria are mandatory before implementation.
* Verification is mandatory before closure.
* The package is reusable by future projects.
* The package does not depend on chat memory.

### Validation

* Markdown structure validation.
* JSON/schema parse if any contract is created.
* Cross-reference validation from template docs.
* Inspector confirms no overlap with closed ENTERPRISE-10-10-V1 tasks.

### Closure Condition

`H1` is closed only when a new agent can follow the SDD package without needing prior conversation context.

### Closure Evidence

* Canonical SDD package added under `ai-knowledge/sdd/`.
* Flow defined as `Specify -> Plan -> Implement -> Verify`.
* Templates added for spec, plan, implementation and verification.
* Gates defined: `SPEC_READY`, `PLAN_READY`, `IMPLEMENTATION_READY`,
  `VERIFICATION_READY` and `DONE`.
* Machine-readable contract added at
  `ai-knowledge/sdd/contracts/sdd-package.contract.json`.
* Local validator added at
  `ai-knowledge/sdd/validation/validate-sdd-package.mjs`.
* H2-H8 were not opened.
* `ENTERPRISE-10-10-V1` was not reopened.
* `ENTERPRISE-10-10-V2` was not created.

---

## H2 — Project Generator / create-ai-native-app

### Objective

Turn `ai-template` from a validated scaffold into a practical project bootstrap path.

### Problem

The template contains scaffolds, generator documentation and a reference app, but the readiness audit found that it is not yet a full CLI-style generator.

### Expected Deliverables

* Clear project creation command or script.
* Generated project structure from `ai-template`.
* Bootstrap documentation.
* Post-generation validation command.
* Example generated project smoke path.

### Candidate Files

```text
ai-template/generators/create-ai-native-app/
ai-template/generators/README.md
ai-template/scaffolds/ai-native-app/
ai-template/docs/setup/PROJECT_BOOTSTRAP.md
ai-template/scripts/validate-generated-project.mjs
```

### Acceptance Criteria

* A new project can be created from the template with minimal manual copying.
* Generated structure follows the intended architecture.
* Generated project has README/setup instructions.
* Generated project can run at least one local validation.
* The process is documented for agents and humans.

### Validation

* Generator dry run or fixture generation.
* Generated project structure validation.
* No hardcoded local machine paths.
* No accidental product-specific naming.

### Closure Condition

`H2` is closed only when `ai-template` can produce or clearly materialize a new AI-Native project baseline.

---

## H3 — Runtime Observability Wiring

### Objective

Move observability from validated governance/contracts toward executable runtime wiring.

### Problem

The readiness audit found observability artifacts, SLIs, SLOs, dashboards and OpenTelemetry validation, but no complete runtime collectors/exporters/dashboard deployment path.

### Expected Deliverables

* Runtime observability wiring guide.
* OpenTelemetry integration example.
* Metrics export example.
* Logging/tracing conventions.
* Local observability smoke test.
* Dashboard/alert deployment notes or placeholders.

### Candidate Files

```text
ai-foundation/observability/runtime-wiring.md
ai-foundation/observability/opentelemetry-example/
ai-foundation/observability/smoke-tests/
ai-template/examples/reference-app/observability/
```

### Acceptance Criteria

* A generated or reference app can show where traces/metrics/logs are emitted.
* Observability wiring is documented beyond governance declarations.
* Local smoke validation exists or is clearly specified.
* Dashboard and alert artifacts are linked to runtime signals.

### Validation

* Read-only or local smoke validation.
* Static validation of OTEL config/examples.
* Inspector confirms no unsupported remote deployment assumptions.

### Closure Condition

`H3` is closed only when observability becomes actionable for a real project baseline.

---

## H4 — Executable Testing Profiles

### Objective

Convert testing readiness contracts into executable project testing profiles.

### Problem

The ecosystem has strong testing documentation and W6 validators, but mutation, load, performance, chaos and coverage are mostly readiness contracts rather than executed evidence.

### Expected Deliverables

* Contract testing profile.
* Coverage profile.
* Mutation testing smoke profile.
* Load/performance smoke profile.
* Chaos testing smoke profile.
* Testing execution matrix.
* Generated project testing instructions.

### Candidate Files

```text
ai-template/validation/testing-profiles.md
ai-template/testing/
ai-template/scripts/validate-testing-profiles.mjs
ai-template/examples/reference-app/tests/
```

### Acceptance Criteria

* At least one executable smoke profile exists.
* Advanced testing profiles are realistic and lightweight.
* Profiles can be run locally or clearly marked as CI-only.
* Testing output expectations are documented.
* No fake PASS evidence is created.

### Validation

* Execute safe local test profile if available.
* Validate test profile definitions.
* Confirm generated/reference project compatibility.

### Closure Condition

`H4` is closed only when testing moves from contract-only to executable baseline evidence.

---

## H5 — Real Evaluation Runs

### Objective

Run or define real evaluation execution paths using `ai-knowledge`.

### Problem

The ecosystem has evaluation programs, scoring, quality gates and registries, but the readiness audit found execution status as not fully executed.

### Expected Deliverables

* Evaluation runbook.
* Minimal evaluation dataset or fixture.
* Prompt/agent evaluation execution example.
* Score report format.
* Evidence policy for evaluation runs.

### Candidate Files

```text
ai-knowledge/evaluation/runs/
ai-knowledge/evaluation/README.md
ai-knowledge/scoring/
ai-knowledge/quality-gates/
ai-knowledge/scripts/run-evaluation.mjs
```

### Acceptance Criteria

* At least one evaluation can be run or simulated with controlled fixture data.
* Score report is machine-readable if applicable.
* Quality gates reference real evaluation outputs.
* Results are not confused with governance-only validation.

### Validation

* Evaluation command PASS if implemented.
* JSON parse for score reports.
* Inspector verifies evidence is real and not synthetic closure text.

### Closure Condition

`H5` is closed only when evaluation has at least one real executable path or clearly documented controlled run.

---

## H6 — Target Repository Security Validation

### Objective

Define and verify security posture for a future real project repository.

### Problem

Security posture is strong inside `ai-foundation`, but remote platform checks such as Dependency Review, Dependabot and attestations may depend on the target GitHub organization/repository.

### Expected Deliverables

* Target repository security checklist.
* GitHub security setup guide.
* Dependency Review validation procedure.
* Dependabot validation procedure.
* SBOM/attestation evidence procedure.
* Client/project security onboarding notes.

### Candidate Files

```text
governance/security/TARGET-REPO-SECURITY-CHECKLIST.md
ai-foundation/security/target-repo-validation.md
ai-template/docs/security/SECURITY-BOOTSTRAP.md
```

### Acceptance Criteria

* A new project repo can be security-validated after creation.
* Remote limitations are explicitly documented.
* No remote assumptions are treated as local PASS.
* Security evidence requirements are clear.

### Validation

* Static validation of checklist.
* Cross-reference with existing W1 security artifacts.
* Inspector confirms no remote credentials/remotes were modified.

### Closure Condition

`H6` is closed only when target repo security validation is repeatable and auditable.

---

## H7 — First Client Project Playbook

### Objective

Create a practical playbook for starting the first real AI-Native project.

### Problem

Documentation is strong, but the readiness audit found that first adoption still needs senior guidance.

### Expected Deliverables

* First Client Project Playbook.
* Project kickoff checklist.
* Repository creation checklist.
* SDD usage instructions.
* Agent workflow instructions.
* Definition of MVP/pilot readiness.
* Definition of production-readiness escalation.

### Candidate Files

```text
governance/documentation/FIRST-CLIENT-PROJECT-PLAYBOOK.md
ai-template/docs/onboarding/FIRST-PROJECT.md
```

### Acceptance Criteria

* A human or agent can start a first project using the playbook.
* The playbook references SDD, generator, testing, observability, security and evaluation.
* It distinguishes pilot/MVP from production-critical use.
* It includes stop conditions.

### Validation

* Documentation structure validation.
* Cross-reference validation.
* Inspector dry-run review.

### Closure Condition

`H7` is closed only when the first project path is operationally clear.

---

## H8 — Adoption Readiness Final Audit

### Objective

Perform a final read-only audit of `AI-NATIVE HARDENING-V1.1`.

### Problem

The hardening work must prove that the ecosystem moved from `READY_WITH_CONDITIONS` toward `ADOPTION_READY`.

### Expected Deliverables

* Final adoption readiness audit.
* Hardening evidence summary.
* Updated readiness score.
* Remaining gaps.
* Final recommendation:

  * Start real project.
  * Start pilot only.
  * Continue hardening.

### Candidate Files

```text
governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H8/
governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md
governance/SESSION-CONTEXT.md
```

### Acceptance Criteria

* H1-H7 are closed or explicitly marked not applicable.
* Final audit distinguishes governance, validation and runtime evidence.
* Final decision is evidence-based.
* No ENTERPRISE-10-10-V1 task is reopened.
* Next eligible action is clearly declared.

### Validation

* Git status clean across all repos.
* Roadmap status consistent.
* Archive evidence complete.
* JSON contracts parse if present.
* Inspector confirms no hidden product drift.

### Closure Condition

`H8` is closed only when the ecosystem has a final adoption readiness decision.

---

## 5. Target Outcome

Expected final state:

```text
AI-NATIVE HARDENING-V1.1: CLOSED
Adoption Readiness: ADOPTION_READY or READY_FOR_FIRST_PROJECT
Recommended next action: Start first controlled real project from ai-template
```

---

## 6. Non-Goals

This roadmap does not certify production deployment for every possible client scenario.

This roadmap does not replace project-specific architecture, security review, legal review, infrastructure setup or business requirements.

This roadmap prepares the ecosystem to be used safely and consistently as the baseline for a first real AI-Native project.
