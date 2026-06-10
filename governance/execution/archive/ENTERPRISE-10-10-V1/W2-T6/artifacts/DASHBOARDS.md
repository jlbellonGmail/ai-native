# W2-T6 Dashboard Definition

Program: ENTERPRISE-10-10-V1

Workstream: W2 - Observability Engineering

Task: W2-T6 - Dashboards

Status: GOVERNANCE_DEFINED

Date: 2026-06-10

## Purpose

Define dashboards as governed observability records for the existing W2 chain.

This artifact defines what a dashboard definition record must contain and how dashboard governance
binds to the governed metric catalog and alerting definitions.

## Scope

Dashboards are defined as governance only.

The scope includes:

* dashboard definition record structure;
* lifecycle states;
* one-to-one binding to the 10 canonical metric records from W2-T4;
* one-to-one binding to the 10 alert policy records from W2-T5;
* activation prerequisites;
* explicit non-runtime restrictions.

The scope excludes:

* runtime dashboard implementation;
* platform configuration;
* collectors;
* executable metric queries;
* panel query expressions;
* data source provisioning;
* deployments;
* product code changes;
* version changes;
* OpenTelemetry validation.

## Prerequisites

* W2-T1 - SLI Definition: completed.
* W2-T2 - SLO Definition: completed.
* W2-T3 - Error Budgets: completed.
* W2-T4 - Metrics Catalog: completed.
* W2-T5 - Alerting: completed.

## Dashboard Definition Record Contract

Each dashboard definition record contains:

* `dashboard_id`: stable governance identifier.
* `metric_record_id`: stable metric catalog identifier when available.
* `metric_record_binding`: binding to one canonical metric record from W2-T4.
* `alert_policy_binding`: binding to one alert policy record from W2-T5.
* `binding_mode`: documentary binding mode.
* `governance_state`: current lifecycle state.
* `layout_state`: whether dashboard layout is approved.
* `panel_state`: whether dashboard panels are approved.
* `query_state`: whether executable runtime queries are approved.
* `data_source_state`: whether dashboard data sources are approved.
* `refresh_state`: whether refresh behavior is approved.
* `ownership_state`: whether operational ownership is approved.
* `runtime_state`: whether runtime dashboard activation is allowed.
* `non_goals`: explicit exclusions preserved by W2-T6.

## Lifecycle States

* `GOVERNANCE_DEFINED`: dashboard definition exists as documentation.
* `PENDING_APPROVED_DATA_SOURCE`: activation requires an approved measurement source.
* `PENDING_RUNTIME_QUERY`: activation requires approved executable queries in a future authorized task.
* `PENDING_PLATFORM_CONFIGURATION`: activation requires approved platform configuration.
* `ACTIVE`: runtime activation is allowed only after all prerequisites are approved.
* `RETIRED`: dashboard definition is no longer eligible for activation.

W2-T6 sets all dashboard definition records to `GOVERNANCE_DEFINED`.

## Canonical Dashboard Definitions

The 10 dashboard definitions below bind one-to-one to the 10 canonical metric records governed by
W2-T4 and the 10 alert policy records governed by W2-T5.

They do not copy, alter, rename, redefine, or extend SLI, SLO, Error Budget, Metrics Catalog, or
Alerting definitions.

| Dashboard ID | Metric Record ID | Metric Binding | Alert Binding | Governance State | Runtime State |
| --- | --- | --- | --- | --- | --- |
| DB-W2-001 | MET-01 | W2-T4 canonical metric record 01 | AP-W2-001 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-002 | MET-02 | W2-T4 canonical metric record 02 | AP-W2-002 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-003 | MET-03 | W2-T4 canonical metric record 03 | AP-W2-003 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-004 | MET-04 | W2-T4 canonical metric record 04 | AP-W2-004 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-005 | MET-05 | W2-T4 canonical metric record 05 | AP-W2-005 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-006 | MET-06 | W2-T4 canonical metric record 06 | AP-W2-006 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-007 | MET-07 | W2-T4 canonical metric record 07 | AP-W2-007 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-008 | MET-08 | W2-T4 canonical metric record 08 | AP-W2-008 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-009 | MET-09 | W2-T4 canonical metric record 09 | AP-W2-009 | GOVERNANCE_DEFINED | NOT_ACTIVE |
| DB-W2-010 | MET-10 | W2-T4 canonical metric record 10 | AP-W2-010 | GOVERNANCE_DEFINED | NOT_ACTIVE |

## Activation Rules

A dashboard definition cannot become runtime active until all of the following are approved in
authorized future work:

* approved measurement source;
* approved executable query;
* approved dashboard platform configuration;
* approved layout and panel specification;
* approved refresh behavior;
* approved operational owner;
* approved access policy when required by the selected platform.

W2-T6 approves none of those runtime activation items.

## Restrictions

W2-T6 does not implement runtime dashboards.

W2-T6 does not define executable queries.

W2-T6 does not implement collectors.

W2-T6 does not configure an observability platform.

W2-T6 does not redefine SLI, SLO, error budget, metrics catalog, or alerting records.

W2-T6 does not validate OpenTelemetry.

W2-T6 does not change product code.

W2-T6 does not change repository versions.

## Closure Statement

Dashboards are complete as a governance definition for W2-T6.

The next eligible task is W2-T7 - OpenTelemetry Validation.

