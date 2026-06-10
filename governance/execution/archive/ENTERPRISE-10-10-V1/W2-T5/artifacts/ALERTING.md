# W2-T5 Alerting Definition

Program: ENTERPRISE-10-10-V1

Workstream: W2 - Observability Engineering

Task: W2-T5 - Alerting

Status: GOVERNANCE_DEFINED

Date: 2026-06-10

## Purpose

Define alerting as a governed observability contract for the existing W2 chain.

This artifact defines what an alert policy record must contain and how alerting binds to the governed metric catalog from W2-T4.

## Scope

Alerting is defined as governance only.

The scope includes:

* alert policy record structure;
* lifecycle states;
* one-to-one binding to the 10 canonical metric records from W2-T4;
* activation prerequisites;
* explicit non-runtime restrictions.

The scope excludes:

* runtime alert rules;
* platform configuration;
* collectors;
* executable metric queries;
* dashboards;
* notification integrations;
* numeric threshold activation;
* product code changes.

## Prerequisites

* W2-T1 - SLI Definition: completed.
* W2-T2 - SLO Definition: completed.
* W2-T3 - Error Budgets: completed.
* W2-T4 - Metrics Catalog: completed.

## Alert Policy Record Contract

Each alert policy record contains:

* `alert_policy_id`: stable governance identifier.
* `metric_record_binding`: binding to one canonical metric record from W2-T4.
* `binding_mode`: documentary binding mode.
* `governance_state`: current lifecycle state.
* `activation_state`: whether runtime activation is allowed.
* `threshold_state`: whether alert thresholds are approved.
* `query_state`: whether executable runtime queries are approved.
* `dashboard_state`: whether dashboard linkage is approved.
* `routing_state`: whether notification routing is approved.
* `ownership_state`: whether operational ownership is approved.
* `non_goals`: explicit exclusions preserved by W2-T5.

## Lifecycle States

* `GOVERNANCE_DEFINED`: alert policy exists as documentation.
* `PENDING_APPROVED_BASELINE`: activation requires approved baseline and target context.
* `PENDING_RUNTIME_QUERY`: activation requires an approved executable query in a future authorized task.
* `PENDING_OPERATIONAL_OWNERSHIP`: activation requires approved owner and routing policy.
* `ACTIVE`: runtime activation is allowed only after all prerequisites are approved.
* `RETIRED`: alert policy is no longer eligible for activation.

W2-T5 sets all alert policy records to `GOVERNANCE_DEFINED`.

## Canonical Alert Policies

The 10 alert policies below bind one-to-one to the 10 canonical metric records governed by W2-T4.

They do not copy, alter, rename, redefine, or extend the SLI, SLO, Error Budget, or Metrics Catalog definitions.

| Alert Policy ID | Metric Binding | Governance State | Activation State |
| --- | --- | --- | --- |
| AP-W2-001 | W2-T4 canonical metric record 01 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-002 | W2-T4 canonical metric record 02 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-003 | W2-T4 canonical metric record 03 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-004 | W2-T4 canonical metric record 04 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-005 | W2-T4 canonical metric record 05 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-006 | W2-T4 canonical metric record 06 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-007 | W2-T4 canonical metric record 07 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-008 | W2-T4 canonical metric record 08 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-009 | W2-T4 canonical metric record 09 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| AP-W2-010 | W2-T4 canonical metric record 10 | GOVERNANCE_DEFINED | NOT_ACTIVE |

## Activation Rules

An alert policy cannot become runtime active until all of the following are approved in authorized future work:

* approved numeric SLO target or equivalent governed objective context;
* approved measurement source;
* approved executable query;
* approved threshold or burn policy;
* approved operational owner;
* approved routing policy;
* approved platform configuration.

W2-T5 approves none of those runtime activation items.

## Restrictions

W2-T5 does not define alert thresholds.

W2-T5 does not define executable queries.

W2-T5 does not define dashboards.

W2-T5 does not configure an observability platform.

W2-T5 does not change product code.

W2-T5 does not change repository versions.

## Closure Statement

Alerting is complete as a governance definition for W2-T5.

The next eligible task is W2-T6 - Dashboards.
