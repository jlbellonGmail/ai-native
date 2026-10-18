# Executable Testing Profiles

H4 converts the existing testing readiness model into local executable profiles
that generated projects can run without external services.

Profiles:

* `contract-smoke` validates public operation behavior.
* `coverage-smoke` validates that smoke scenarios map to all required profiles.
* `mutation-smoke` validates a deterministic boundary mutant is killed.
* `load-smoke` validates bounded local concurrency.
* `performance-smoke` validates a deterministic local budget.
* `chaos-smoke` validates simulated dependency failure containment.

Factory profile catalog:

```text
testing/profiles/testing-profiles.json
```

Generated project commands:

```bash
npm run validate:testing-profiles
npm run test:profiles
```

The smoke profiles are adoption-readiness evidence only. They are not real
production load tests, real mutation scores, coverage percentage reports,
security scans or H5 evaluation runs.

## Safety Rules

* No network calls.
* No secrets.
* No external state mutation.
* No production endpoints.
* No destructive chaos injection.

## Validation

Run:

```bash
node scripts/validate-testing-profiles.mjs
```
