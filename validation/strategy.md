# Testing Strategy

Generated projects should ship with:

* contract tests for public interfaces and repository boundaries
* mutation-testing readiness through small pure-domain services
* load scenario definitions for API and workflow entry points
* performance budgets for request handlers and workflow execution
* chaos/resilience scenarios for external automation providers
* coverage thresholds enforced by `vitest.config.ts`

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
