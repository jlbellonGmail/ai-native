# Score Framework

Program: ENTERPRISE-10-10-V1

Task: W3-T4

Status: GOVERNANCE_DEFINED

## Purpose

Define a governance contract for future evaluation scoring. The framework establishes score definitions, weighting model rules, aggregation semantics, lifecycle states, evidence requirements, and traceability before any future score is produced.

## Non-Goals

* Do not produce real scores.
* Do not activate numeric weights.
* Do not activate score thresholds.
* Do not produce pass/fail decisions.
* Do not execute benchmarks.
* Do not create datasets.
* Do not implement scoring pipelines, deployments, runtime configuration, or platform configuration.
* Do not modify product code.
* Do not modify VERSION files.

## Score Governance Model

Scoring is governed as a document-first contract. Each future score record must define the evaluated artifact, evaluation surface, scoring dimension, allowed score state, optional numeric range, optional weight, aggregation rule, evidence reference, reviewer rationale, lifecycle state, and approval state.

The model separates definition from execution:

* Definition: governed score terms, states, dimensions, weights, aggregation semantics, lifecycle, and evidence requirements.
* Approval: placeholder governance state indicating whether a score model is ready for future use.
* Execution: explicitly out of scope for W3-T4.
* Dataset binding: deferred to W3-T5.
* Reporting: deferred to W3-T6.

## Score Definitions

Future score records must support these governed score states:

* NOT_EVALUATED: No real evaluation has occurred.
* DEFINED: Score dimension is defined and eligible for future scoring.
* QUALITATIVE_ONLY: Future review may use non-numeric judgment with rationale.
* NUMERIC_PENDING_BASELINE: Numeric scoring requires a benchmark baseline.
* NUMERIC_PENDING_DATASET: Numeric scoring requires approved dataset governance.
* NUMERIC_READY_FOR_FUTURE_USE: Numeric scoring may be used by a future authorized task.
* NOT_APPLICABLE: Dimension is excluded with rationale.
* BLOCKED: Score cannot be produced until a documented prerequisite is resolved.

W3-T4 does not assign any measured score.

## Weighting Model

The weighting model is defined only as governance structure:

* weight_id
* dimension_id
* evaluation_surface
* weight_state
* numeric_weight_placeholder
* normalization_rule
* rationale_placeholder
* evidence_reference
* approval_state

Weight states:

* NOT_WEIGHTED: No weight is assigned.
* WEIGHT_DEFINED_AS_PLACEHOLDER: A future weight slot exists.
* PENDING_BASELINE: Weight requires benchmark baseline.
* PENDING_APPROVAL: Weight requires review approval.
* APPROVED_FOR_FUTURE_USE: Weight may be used by a future authorized scoring task.

No numeric weights are activated by W3-T4.

## Scoring Lifecycle

* DRAFT: Score model is being drafted.
* GOVERNANCE_DEFINED: Score structure and required fields are defined.
* PENDING_REVIEW: Score model is ready for review but not approved.
* APPROVED_FOR_FUTURE_USE: Score model may be used by a future authorized task.
* EXECUTION_DEFERRED: Real scoring is intentionally deferred.
* BLOCKED_BY_MISSING_BENCHMARK: Future score requires W3-T3 benchmark binding.
* BLOCKED_BY_MISSING_DATASET: Future score requires W3-T5 dataset governance.
* SUPERSEDED: Score model was replaced by a later governed version.
* RETIRED: Score model is no longer eligible for use.

W3-T4 closes at GOVERNANCE_DEFINED only.

## Aggregation Rules

Future aggregation rules must declare:

* aggregation_id
* input_score_references
* weight_references
* normalization_rule
* missing_score_policy
* qualitative_result_policy
* threshold_dependency
* evidence_reference
* approval_state

W3-T4 defines aggregation structure only. No aggregate score, rank, certification result, threshold, or pass/fail output is produced.

## Traceability To Workstream 3

* W3-T1 Prompt Evaluation Framework: prompt evaluation dimensions may bind to score definitions.
* W3-T2 Agent Evaluation Framework: agent evaluation dimensions may bind to score definitions.
* W3-T3 Benchmark Framework: benchmark families may provide future baselines.
* W3-T5 Datasets: future dataset governance may enable numeric score interpretation.
* W3-T6 Evaluation Reports: future reports may consume score records and aggregation evidence.
* W3-T7 Evaluation Audit Final: final audit may validate consistency across W3-T1 through W3-T6.

No future task is executed by W3-T4.

## Closure Boundary

W3-T4 closes when score definitions, weighting model, scoring lifecycle, aggregation rules, and machine-readable artifact are present and aligned. W3-T5 remains the next eligible task.
