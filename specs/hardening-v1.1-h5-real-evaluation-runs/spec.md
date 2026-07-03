# HARDENING-V1.1 H5 - Real Evaluation Runs Spec

Related Governance Task: AI-NATIVE-HARDENING-V1.1/H5
Related Roadmap: governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md

## Objective

Provide a real, local, controlled evaluation execution path in `ai-knowledge`.

## Engineering Purpose

Move evaluation evidence from contract-only assets to an executable baseline that
uses repository datasets, benchmarks, scoring and quality gates.

## Affected Repositories

* `ai-knowledge`
* root/governance for SDD and closure evidence

## Expected Files Or Areas

* `ai-knowledge/evaluation/runs/`
* `ai-knowledge/evaluation/README.md`
* `ai-knowledge/quality-gates/`
* `ai-knowledge/scripts/run-evaluation.mjs`
* `ai-knowledge/scripts/validate-real-evaluation-runs.mjs`
* `specs/hardening-v1.1-h5-real-evaluation-runs/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H5/`

## Non-Goals

* Do not reopen H1, H2, H3 or H4.
* Do not open H6.
* Do not create remote CI, push, PR or external evaluation service calls.
* Do not modify `ai-template/templates/project/` unless generated-project
  behavior is affected.
* Do not modify `VERSION` files.

## Acceptance Criteria

* AC-001: At least one evaluation can be run locally with controlled fixture data.
* AC-002: A machine-readable score report exists and parses as JSON.
* AC-003: Quality gates reference the real evaluation output path and command.
* AC-004: Evidence policy distinguishes evaluation output from governance-only
  closure text.
* AC-005: H6 remains not opened.

## Expected Validations

* `node scripts/run-evaluation.mjs --benchmark bench-prompt-grounding`
* `node scripts/validate-real-evaluation-runs.mjs`
* `node scripts/validate-enterprise-evaluation.mjs`
* `node scripts/validate-structure.mjs`
* `node sdd/validation/validate-sdd-package.mjs`
* `git diff --check`

## Risks

* Controlled fixture data must not be represented as external production model
  evaluation.
* Existing W4/W5 linkage contracts must continue to state that those historical
  tasks did not execute runtime evaluations.
