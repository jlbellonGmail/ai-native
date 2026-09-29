# Setup

## Local Validation

Run:

```bash
npm run validate
```

The generated project has no external runtime dependencies by default. Add
project-specific dependencies only after the SDD specification and plan are
accepted.

## What This Baseline Includes

* Project README.
* AI-Native project manifest.
* SDD workflow reference.
* Runtime observability wiring with local/no-op defaults.
* Executable testing profiles with local smoke defaults.
* App, service, config, docs and validation directories.
* Local structure validator.

## What This Baseline Does Not Include

* Production deployment.
* Remote observability collector deployment.
* Production-grade testing infrastructure or remote CI setup.
* Security validation for a remote target repository.
* Real evaluation runs.
* Client-specific business logic.
