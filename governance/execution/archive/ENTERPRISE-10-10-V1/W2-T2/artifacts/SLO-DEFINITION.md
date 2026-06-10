# SLO Definition

Program: ENTERPRISE-10-10-V1
Workstream: W2 - Observability Engineering
Task: W2-T2 - SLO Definition
Date: 2026-06-10
Status: GOVERNED

## Purpose

This artifact defines the governed Service Level Objective layer for the enterprise observability
workstream.

W2-T2 establishes how SLOs are represented, governed, validated, and handed forward. It does not
implement measurement, alerting, dashboards, error budgets, runtime instrumentation, or platform
configuration.

## Source Binding

The SLO layer is bound to the completed W2-T1 canonical SLI definition.

Because W2-T2 is constrained to the mandated governance sources, this task does not invent SLI
names, metric names, instrumentation details, or platform-specific queries. Each SLO entry is
therefore bound to the corresponding governed SLI position from the W2-T1 canonical set.

## SLO Definition Contract

Each governed SLO MUST include:

* `slo_id`: stable SLO identifier.
* `sli_binding`: reference to one W2-T1 canonical SLI.
* `objective_statement`: business-readable service objective.
* `evaluation_window`: governed measurement window.
* `target_policy`: governed target policy state.
* `measurement_state`: whether measurement is implemented.
* `budget_state`: whether an error budget exists.
* `alert_state`: whether alerting exists.
* `dashboard_state`: whether dashboards exist.
* `owner_state`: governance ownership state.
* `implementation_state`: operational readiness state.

## Canonical SLO Inventory

| SLO ID | SLI Binding | Objective Statement | Evaluation Window | Target Policy | Implementation State |
| --- | --- | --- | --- | --- | --- |
| SLO-01 | W2-T1 canonical SLI 01 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-02 | W2-T1 canonical SLI 02 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-03 | W2-T1 canonical SLI 03 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-04 | W2-T1 canonical SLI 04 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-05 | W2-T1 canonical SLI 05 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-06 | W2-T1 canonical SLI 06 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-07 | W2-T1 canonical SLI 07 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-08 | W2-T1 canonical SLI 08 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-09 | W2-T1 canonical SLI 09 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |
| SLO-10 | W2-T1 canonical SLI 10 | Maintain the governed service behavior represented by the associated SLI. | GOVERNED_WINDOW_PENDING_METRICS_CATALOG | DEFINED_PENDING_BASELINE | GOVERNANCE_DEFINED |

## Governance Rules

* SLOs MUST remain one-to-one with the W2-T1 canonical SLI set until a later governed task changes
  that relationship.
* SLO target values MUST NOT be invented without approved baseline, measurement, and ownership
  evidence.
* Error budgets MUST be defined only by W2-T3 or a later explicitly authorized task.
* Alert thresholds MUST be defined only by W2-T5 or a later explicitly authorized task.
* Dashboards MUST be defined only by W2-T6 or a later explicitly authorized task.
* Metrics catalog bindings MUST be defined only by W2-T4 or a later explicitly authorized task.
* Runtime validation MUST be defined only by W2-T7 or a later explicitly authorized task.

## Handoff State

W2-T2 closes with SLO governance defined and operational implementation pending later roadmap tasks.

Next eligible task after closure:

* W2-T3 - Error Budgets.
