# Executable Testing Profiles

Generated AI-Native projects should keep local testing profiles lightweight,
deterministic and safe.

Expected commands:

```bash
npm run validate:testing-profiles
npm run test:profiles
```

Expected profile IDs:

* `contract-smoke`
* `coverage-smoke`
* `mutation-smoke`
* `load-smoke`
* `performance-smoke`
* `chaos-smoke`

These profiles are local smoke checks. They do not replace production test
suites, remote CI, real load testing, real coverage reports, mutation score
runs or H5 evaluation runs.
