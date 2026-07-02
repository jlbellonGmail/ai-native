# Performance Testing

W6-T4 defines the performance testing model for generated projects. It turns the
load-testing governance from W6-T3 into measurable performance expectations
without running benchmarks, changing runtime code or creating release gates.

This document defines what a generated project must measure before it can make
performance claims. It does not execute benchmarks, provision environments,
publish reports, enforce budgets in CI, or close W6-T5 chaos testing.

## Performance Model

Performance measurements must be tied to a governed scenario and a stable
boundary. Each measurement target needs:

* an owner responsible for interpreting results;
* a source scenario from the W6-T3 load-testing catalog;
* explicit metrics and units;
* thresholds expressed as reporting expectations, not release gates;
* required sample metadata for repeatability;
* an execution status confirming no W6-T4 benchmark was run.

The initial model uses the password validator service scenario because it is
already covered by contract testing, mutation readiness and load testing
governance.

## Measurement Contract

Generated projects should capture enough context to compare future runs without
pretending that W6-T4 produced runtime evidence. A measurement record must
include:

* scenario id and measured boundary;
* environment label and runtime version;
* sample window and iteration count;
* latency distribution fields;
* throughput and error-rate fields;
* dependency assumptions;
* reviewer and report status.

W6-T4 records the schema and governance only. Actual benchmark execution,
trend analysis, release gating and production performance budgets belong to
generated-project implementation or later roadmap tasks.

## Reporting Schema

Performance reports must separate planned thresholds from observed results.
Before a report can be used as evidence, it must identify whether values are
planned, measured, simulated or unavailable. W6-T4 only defines the report
shape and allowed statuses.

## Non-goals

W6-T4 does not:

* run benchmarks;
* collect runtime measurements;
* modify product runtime code;
* create release gates;
* create chaos or resilience scenarios;
* close W6-T5, W6-T6 or W6-T7.

The machine-readable contract lives in `performance-testing.contract.json`;
validation is implemented by `scripts/validate-performance-testing.mjs`.
