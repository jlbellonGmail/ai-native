# Testing Strategy

Generated projects should ship with:

* contract tests for public interfaces and repository boundaries
* mutation-testing readiness through small pure-domain services
* load scenario definitions for API and workflow entry points
* performance budgets for request handlers and workflow execution
* chaos/resilience scenarios for external automation providers
* coverage thresholds enforced by `vitest.config.ts`

This file is a product contract for generated projects, not governance evidence.
