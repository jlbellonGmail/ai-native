# Chaos Testing

W6-T5 defines chaos testing governance for generated projects. It describes
resilience scenarios and validation rules that can be reviewed before any real
failure injection exists.

This document does not inject failures, alter environments, create runtime
experiments, or close W6-T6 coverage validation. It defines the minimum
governance surface needed for future chaos testing to be bounded, reversible and
observable.

## Chaos Governance

Chaos scenarios must be connected to a stable product boundary and to the
performance measurement model from W6-T4. A scenario is eligible only when it
has:

* an owner responsible for approving experiment intent;
* a source performance target from the W6-T4 catalog;
* an explicit failure mode and blast-radius limit;
* rollback and abort controls;
* observability signals required before future execution;
* an execution status confirming no W6-T5 injection was performed.

The initial scenario covers a dependency-latency degradation around the password
validator service boundary because that boundary is already covered by contract
testing, mutation readiness, load governance and performance measurement
planning.

## Resilience Scenarios

Resilience scenarios must describe a single failure mode and a bounded expected
system response. They must avoid live third-party side effects unless a future
generated project creates an isolated environment and explicit approval chain.

Required scenario controls:

* blast-radius classification;
* maximum experiment duration;
* abort triggers;
* rollback plan;
* data safety posture;
* required observability signals.

## Validation Contract

W6-T5 records the validation contract only. Future generated projects may use
the contract to decide when a chaos scenario is ready for a controlled
experiment, but W6-T5 itself produces no runtime evidence.

## Non-goals

W6-T5 does not:

* inject failures;
* alter runtime environments;
* execute chaos experiments;
* collect resilience measurements;
* change coverage thresholds;
* close W6-T6 or W6-T7.

The machine-readable contract lives in `chaos-testing.contract.json`;
validation is implemented by `scripts/validate-chaos-testing.mjs`.
