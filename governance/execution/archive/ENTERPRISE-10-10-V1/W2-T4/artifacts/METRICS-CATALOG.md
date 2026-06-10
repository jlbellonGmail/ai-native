# Metrics Catalog

Program: ENTERPRISE-10-10-V1
Workstream: W2 - Observability Engineering
Task: W2-T4 - Metrics Catalog
Date: 2026-06-10
Status: GOVERNED

## Purpose

This artifact defines the governed metrics catalog layer for the enterprise observability
workstream.

W2-T4 establishes how metric records are cataloged, bound to the existing governed SLI/SLO/error
budget chain, and handed forward. It does not implement collectors, executable runtime queries,
alerting, dashboards, runtime instrumentation, product code, or platform configuration.

## Source Binding

The metrics catalog is bound to the completed governed observability chain:

* W2-T1 SLI Definition.
* W2-T2 SLO Definition.
* W2-T3 Error Budgets.

Metric records MUST bind to existing identifiers only. They MUST NOT redefine SLI semantics, SLO
targets, error budget formulas, alert thresholds, dashboard views, or runtime instrumentation.

## Metric Record Contract

Each governed metric record MUST include:

* `metric_id`: stable metric catalog identifier.
* `sli_binding`: reference to one existing governed SLI.
* `slo_binding`: reference to one existing governed SLO.
* `error_budget_binding`: reference to one existing governed error budget.
* `metric_semantics`: governed measurement semantics inherited from the upstream SLI/SLO chain.
* `good_event_source`: expected source for good-event counts.
* `total_event_source`: expected source for total-event counts.
* `bad_event_source`: expected source for error budget consumption inputs.
* `query_state`: whether executable queries are available.
* `measurement_state`: whether measurement inputs are approved.
* `ownership_state`: governance ownership status.
* `alert_state`: alerting state.
* `dashboard_state`: dashboard state.
* `implementation_state`: operational readiness state.

## Canonical Metrics Catalog Inventory

| Metric ID | SLI Binding | SLO Binding | Error Budget Binding | Metric Semantics | Query State | Implementation State |
| --- | --- | --- | --- | --- | --- | --- |
| MET-01 | SLI-01 | SLO-01 | EB-01 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-02 | SLI-02 | SLO-02 | EB-02 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-03 | SLI-03 | SLO-03 | EB-03 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-04 | SLI-04 | SLO-04 | EB-04 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-05 | SLI-05 | SLO-05 | EB-05 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-06 | SLI-06 | SLO-06 | EB-06 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-07 | SLI-07 | SLO-07 | EB-07 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-08 | SLI-08 | SLO-08 | EB-08 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-09 | SLI-09 | SLO-09 | EB-09 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |
| MET-10 | SLI-10 | SLO-10 | EB-10 | INHERITED_FROM_SLI | GOVERNANCE_DEFINED_NOT_EXECUTABLE | GOVERNANCE_DEFINED |

## Metric Catalog States

| State | Meaning |
| --- | --- |
| GOVERNANCE_DEFINED | Metric record exists as a governed catalog entry. |
| PENDING_APPROVED_SOURCE | Physical measurement source is not yet approved. |
| GOVERNANCE_DEFINED_NOT_EXECUTABLE | Query semantics are documented but no runtime query is implemented. |
| SOURCE_APPROVED | Measurement source has been approved by a later governed task. |
| QUERY_IMPLEMENTED | Executable query exists in an approved later task. |
| RUNTIME_VALIDATED | Runtime measurement has been validated by an approved later task. |

## Governance Rules

* Metric records MUST remain one-to-one with the governed SLI/SLO/error budget chain until a later
  governed task changes that relationship.
* Metric records MUST bind to existing SLI, SLO, and error budget identifiers only.
* Metric records MUST NOT redefine SLI good-event, total-event, or formula semantics.
* Metric records MUST NOT redefine SLO objectives, windows, or target policy.
* Metric records MUST NOT redefine error budget formulas, lifecycle states, or activation rules.
* Executable queries MUST be defined only by a later explicitly authorized implementation or
  validation task.
* Alert thresholds MUST be defined only by W2-T5 or a later explicitly authorized task.
* Dashboards MUST be defined only by W2-T6 or a later explicitly authorized task.
* Runtime validation MUST be defined only by W2-T7 or a later explicitly authorized task.

## Handoff State

W2-T4 closes with metrics catalog governance defined and operational implementation pending later
roadmap tasks.

Next eligible task after closure:

* W2-T5 - Alerting.
