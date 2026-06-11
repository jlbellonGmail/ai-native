# Datasets

Program: ENTERPRISE-10-10-V1

Task: W3-T5

Status: GOVERNANCE_DEFINED

## Purpose

Define dataset governance for future evaluation work. The framework establishes dataset contracts, catalog schema, classification rules, ownership placeholders, retention expectations, and traceability before any future dataset is created, loaded, stored, or used.

## Non-Goals

* Do not create real datasets.
* Do not load real datasets.
* Do not store data payloads.
* Do not access production data.
* Do not introduce dataset storage runtime.
* Do not execute evaluations.
* Do not modify product code.
* Do not modify VERSION files.

## Dataset Governance Model

Datasets are governed as document-first records. Each future dataset record must define identity, intended evaluation binding, data classification, provenance, approved source reference, schema reference, retention rule, privacy and security posture, ownership placeholders, evidence requirements, lifecycle state, and approval state.

## Dataset Contract

Future dataset records must define:

* dataset_id
* program_id
* task_id
* dataset_name
* evaluation_binding
* benchmark_binding
* score_binding
* data_classification
* source_reference
* schema_reference
* allowed_usage
* prohibited_usage
* retention_rule
* privacy_security_attestation
* owner_role_placeholder
* reviewer_role_placeholder
* approver_role_placeholder
* lifecycle_state
* approval_state
* evidence_requirements

No real rows, documents, prompts, traces, secrets, credentials, production records, or payloads are required by W3-T5.

## Catalog Schema

The future dataset catalog must support:

* catalog_id
* dataset_records
* classification_index
* benchmark_bindings
* evaluation_bindings
* score_bindings
* retention_index
* evidence_paths
* approval_index
* audit_traceability

W3-T5 defines catalog structure only.

## Lifecycle States

* DRAFT: Dataset record is being drafted.
* GOVERNANCE_DEFINED: Dataset contract structure and required fields are defined.
* PENDING_REVIEW: Dataset record is ready for review but not approved.
* APPROVED_FOR_FUTURE_USE: Dataset may be used by a future authorized task.
* DATA_UNAVAILABLE: Dataset payload is not available.
* BLOCKED_BY_CLASSIFICATION: Dataset requires classification or privacy review.
* RETENTION_PENDING: Retention rule must be approved.
* SUPERSEDED: Dataset record was replaced by a later governed version.
* RETIRED: Dataset record is no longer eligible for use.

W3-T5 closes at GOVERNANCE_DEFINED only.

## Traceability To Workstream 3

* W3-T1 Prompt Evaluation Framework: prompt evaluation inputs may bind to approved future dataset records.
* W3-T2 Agent Evaluation Framework: agent evaluation inputs may bind to approved future dataset records.
* W3-T3 Benchmark Framework: benchmark records may require dataset bindings.
* W3-T4 Score Framework: numeric scoring may require dataset governance.
* W3-T6 Evaluation Reports: reports may reference dataset evidence and approval state.
* W3-T7 Evaluation Audit Final: final audit may validate dataset governance consistency.

No future task is executed by W3-T5.

## Closure Boundary

W3-T5 closes when dataset governance, dataset contract, catalog schema, ownership placeholders, lifecycle states, and machine-readable artifact are present and aligned. W3-T6 remains the next eligible task.
