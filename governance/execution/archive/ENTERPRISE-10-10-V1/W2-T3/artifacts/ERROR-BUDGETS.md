# Error Budgets

Program: ENTERPRISE-10-10-V1
Workstream: W2 - Observability Engineering
Task: W2-T3 - Error Budgets
Date: 2026-06-10
Status: GOVERNED

## Purpose

This artifact defines the governed error budget layer for the enterprise observability workstream.

W2-T3 establishes how error budgets are represented, calculated, consumed, frozen, exhausted, reset,
and handed forward. It does not implement metric collection, alerting, dashboards, runtime
instrumentation, or platform configuration.

## Source Binding

The error budget layer is bound to the completed W2-T2 governed SLO definition.

Because numeric SLO targets and measurement sources require approved baselines and later governed
work, this task defines symbolic budget formulas and lifecycle rules. Numeric activation remains
pending until the required upstream data exists.

## Error Budget Contract

Each governed error budget MUST include:

* `budget_id`: stable error budget identifier.
* `slo_binding`: reference to one W2-T2 governed SLO.
* `budget_formula`: symbolic calculation for allowed unreliability.
* `consumption_formula`: symbolic calculation for consumed budget.
* `evaluation_window`: governed measurement window inherited from the SLO layer.
* `activation_state`: whether numeric activation is available.
* `measurement_state`: whether measurement inputs are available.
* `policy_state`: governance state for spend, freeze, and exhaustion handling.
* `alert_state`: alerting state.
* `dashboard_state`: dashboard state.
* `implementation_state`: operational readiness state.

## Canonical Error Budget Inventory

| Budget ID | SLO Binding | Budget Formula | Consumption Formula | Activation State | Implementation State |
| --- | --- | --- | --- | --- | --- |
| EB-01 | SLO-01 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-02 | SLO-02 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-03 | SLO-03 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-04 | SLO-04 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-05 | SLO-05 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-06 | SLO-06 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-07 | SLO-07 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-08 | SLO-08 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-09 | SLO-09 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |
| EB-10 | SLO-10 | total_eligible_events * (1 - slo_target) | bad_events / allowed_bad_events | PENDING_APPROVED_BASELINE | GOVERNANCE_DEFINED |

## Budget States

| State | Meaning |
| --- | --- |
| GOVERNANCE_DEFINED | Budget contract exists but is not operationally enforced. |
| PENDING_APPROVED_BASELINE | Numeric target, eligible event total, and measurement source are not yet approved. |
| ACTIVE | Numeric budget can be evaluated from approved SLO and measurement inputs. |
| FROZEN | Budget spend is paused by governance decision. |
| EXHAUSTED | Consumed budget is greater than or equal to allowed budget. |
| RESET_PENDING | Budget window has ended and reset evidence is pending. |

## Governance Rules

* Error budgets MUST remain one-to-one with the W2-T2 governed SLO set until a later governed task
  changes that relationship.
* Numeric budget values MUST NOT be activated without approved SLO target, eligible event total,
  bad event definition, evaluation window, and measurement source.
* Budget consumption MUST be calculated from the same good and total event semantics governed by
  the upstream SLI and SLO chain.
* Budget freeze and exhaustion are governance states only in this task.
* Alert thresholds MUST be defined only by W2-T5 or a later explicitly authorized task.
* Dashboards MUST be defined only by W2-T6 or a later explicitly authorized task.
* Metrics catalog bindings MUST be defined only by W2-T4 or a later explicitly authorized task.
* Runtime validation MUST be defined only by W2-T7 or a later explicitly authorized task.

## Handoff State

W2-T3 closes with error budget governance defined and operational implementation pending later
roadmap tasks.

Next eligible task after closure:

* W2-T4 - Metrics Catalog.
