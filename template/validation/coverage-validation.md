# Coverage Validation

W6-T6 defines coverage validation governance for generated projects. It
connects the configured coverage thresholds in `vitest.config.ts` with the W6
testing contracts that were created before it.

This document does not execute coverage, collect runtime measurements, change
pipelines, or close W6-T7 testing audit final. It defines the minimum
completeness model needed to decide whether the template has a coherent testing
coverage surface.

## Coverage Governance

Coverage validation must be traceable to both executable configuration and
testing governance artifacts. A coverage item is eligible only when it has:

* an owner responsible for maintaining the signal;
* a source task from W6-T1 through W6-T5;
* a machine-readable contract or validation script;
* the coverage signal it supports;
* an explicit status confirming no W6-T6 coverage execution was performed.

The initial model covers the password validator reference boundary because it
is already represented by contract testing, mutation readiness, load testing,
performance testing and chaos testing governance.

## Validation Model

The validation model treats `vitest.config.ts` as the coverage threshold source
for generated projects. It requires the V8 provider, text/json/html reporters
and line, function, branch and statement thresholds before a generated project
can claim coverage readiness.

W6-T6 checks configuration and completeness only. Future generated projects may
execute coverage and attach reports, but this task records no coverage result.

## Completeness Contract

Coverage completeness requires every prior W6 testing task to remain
implemented and mapped to files. W6-T6 adds a coverage contract and validator
that confirm those mappings exist, the threshold configuration is present and
W6-T7 remains open.

## Non-goals

W6-T6 does not:

* run coverage;
* change coverage thresholds;
* modify pipelines;
* collect runtime measurements;
* close W6-T7.

The machine-readable contract lives in `coverage-validation.contract.json`;
validation is implemented by `scripts/validate-coverage-validation.mjs`.
