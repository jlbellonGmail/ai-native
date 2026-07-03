# Feature Specification

## Metadata

Feature ID: hardening-v1.1-h4-executable-testing-profiles

Feature Name: H4 - Executable Testing Profiles

Owner: AI-NATIVE Factory

Status: SPECIFIED

Created: 2026-07-02

Updated: 2026-07-02

Related Governance Task: AI-NATIVE-HARDENING-V1.1/H4

Related Roadmap: governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md

---

## Objective

Convert existing testing readiness contracts into lightweight executable testing
profiles that generated AI-Native projects can validate and run locally.

---

## Problem

The ecosystem already has W6 testing contracts and validators, but H4 requires
adoption-ready project testing profiles with real local smoke execution rather
than contract-only readiness.

---

## Scope

In scope:

- ai-template testing profile catalog.
- generated project testing instructions.
- generated project executable smoke tests.
- validators for profile definitions and generated project compatibility.
- governance closure evidence for H4.

Out of scope:

- H5 real evaluation runs.
- remote CI execution.
- real load generation against external services.
- production chaos injection.
- dependency additions.
- reopening H1, H2, H3 or ENTERPRISE-10-10-V1.

---

## Users / Consumers

- developers starting a generated project
- agents validating generated projects
- governance inspectors reviewing H4 evidence

---

## Functional Requirements

FR-001: The template must define contract, coverage, mutation smoke, load smoke,
performance smoke and chaos smoke profiles.

FR-002: A generated project must include local commands to validate profile
definitions and execute a safe smoke suite.

FR-003: The profile catalog must be present in the factory template, scaffold
output and project template baseline.

FR-004: H4 validators must verify profile consistency and run real smoke
commands.

---

## Non-Functional Requirements

NFR-001: Profiles must be local, deterministic and safe by default.

NFR-002: No profile may require secrets, remote endpoints, production traffic or
external services.

NFR-003: Validation must not claim real coverage percentages, real mutation
scores or real production load evidence when only local smoke checks were run.

---

## Acceptance Criteria

AC-001: At least one executable smoke profile exists and is executed.

AC-002: Contract, coverage, mutation, load, performance and chaos profiles are
defined with commands and safety limits.

AC-003: Generated project validation confirms the testing profile assets.

AC-004: Documentation explains local commands and output expectations.

AC-005: H5 is not opened and no evaluation run is implemented.

---

## Constraints

Technical constraints:

- Use Node.js scripts already available in generated projects.
- Do not add dependencies.
- Keep commands cross-platform.

Governance constraints:

- H4 may close locally only after real validation and inspector pass.
- HITL approval remains required for formal closure.

Security constraints:

- No secrets, endpoints or destructive tests.
- Chaos profile must be simulated locally with explicit abort boundaries.

Compatibility constraints:

- Existing H2/H3 generated-project validation must continue to pass.

---

## Dependencies

Internal dependencies:

- ai-template generator and scaffold.
- H3 runtime observability helper in generated project scaffold.
- W6 testing contracts and validators.

External dependencies:

- Node.js runtime.

---

## Risks

Risk 1: Smoke profiles could be mistaken for production-grade test evidence.

Mitigation: Documentation and contracts explicitly label them as local smoke
profiles and preserve separate future evaluation scope.

Risk 2: Generated project and project template standards could drift.

Mitigation: The H4 validator compares required profile IDs and commands across
factory, scaffold and project template catalogs.

---

## Open Questions

Q1: None blocking for local H4 closure.

---

## Validation Expectations

Expected validations:

- ai-template H4 profile validator.
- ai-template structure validator.
- create-ai-native-app validator.
- generated project validator.
- generated project smoke command.
- git diff checks.

Expected evidence:

- command outputs recorded in verification.md and governance archive.
