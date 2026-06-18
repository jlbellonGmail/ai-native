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
