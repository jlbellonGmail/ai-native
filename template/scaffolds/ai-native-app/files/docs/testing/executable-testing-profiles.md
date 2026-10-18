# Executable Testing Profiles

This generated project includes local H4 testing profiles.

Run profile validation:

```bash
npm run validate:testing-profiles
```

Run the executable smoke suite:

```bash
npm run test:profiles
```

Run one profile:

```bash
npm run test:profiles -- --profile contract-smoke
```

Profiles:

* `contract-smoke`
* `coverage-smoke`
* `mutation-smoke`
* `load-smoke`
* `performance-smoke`
* `chaos-smoke`

These profiles are local smoke checks. They do not require network access,
secrets, external services, production traffic or destructive chaos injection.
They do not claim real production load evidence, real coverage percentages,
real mutation scores or H5 evaluation results.
