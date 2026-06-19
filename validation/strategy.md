# Testing Strategy

Generated projects should ship with:

* contract tests for public interfaces and repository boundaries
* mutation-testing readiness through small pure-domain services
* load scenario definitions for API and workflow entry points
* performance budgets for request handlers and workflow execution
* chaos/resilience scenarios for external automation providers
* coverage validation model bound to `vitest.config.ts`

This file is a product contract for generated projects, not governance evidence.

## Mutation Testing

W6-T2 defines mutation-testing readiness for generated projects. Mutation targets
must be deterministic, owned and connected to an existing test target before
real mutation execution is considered in a future project.

The W6-T2 contract lives in `mutation-testing.contract.json`; the human-readable
rules live in `mutation-testing.md`.

## Load Testing

W6-T3 defines load testing governance for generated projects. Load scenarios
must identify stable service, API or workflow entry points, bounded traffic
profiles, dependency policy, stop conditions, data safety controls and required
observability signals before any real load generation is considered.

The W6-T3 contract lives in `load-testing.contract.json`; the human-readable
scenario catalog and execution rules live in `load-testing.md`.

## Performance Testing

W6-T4 defines the performance testing model for generated projects. Performance
targets must bind to governed load scenarios, declare metric definitions,
planned thresholds, sample policy and report shape before any real benchmark
execution is considered.

The W6-T4 contract lives in `performance-testing.contract.json`; the
human-readable model, measurement contract and reporting schema live in
`performance-testing.md`.

## Chaos Testing

W6-T5 defines chaos testing governance for generated projects. Resilience
scenarios must bind to planned performance targets, define a single failure
mode, blast-radius limits, rollback plans, abort triggers, data safety controls
and required observability signals before any real failure injection is
considered.

The W6-T5 contract lives in `chaos-testing.contract.json`; the human-readable
governance model, resilience scenarios and validation contract live in
`chaos-testing.md`.

## Coverage Validation

W6-T6 defines the coverage validation model for generated projects. Coverage
readiness must bind configured Vitest thresholds to the W6 testing contracts,
roadmap coverage mapping and a machine-readable completeness contract before
any future project claims coverage results.

The W6-T6 contract lives in `coverage-validation.contract.json`; the
human-readable coverage governance, validation model and completeness contract
live in `coverage-validation.md`.
