# Observability

Observability primitives for runtime safety and service reliability.

Current modules:

* `core/` - error context, error types, handler and retry engine.
* `integration/` - wrapper for error-handled execution.
* `logging/` - incident and logger utilities.
* `runtime-wiring/` - runtime operation tracing, metrics and structured events.
* `strategies/` - retry strategy definitions.
* `tracing/` - OpenTelemetry configuration.
* `enterprise-10-10/` - SLI/SLO/error-budget/metric/alert/dashboard/OTel bindings.

The enterprise observability program is intentionally executable as data:
validators load it and verify that every record has concrete identifiers,
signals and runtime surfaces.

H3 adds executable runtime wiring with safe local/no-op defaults. See
`runtime-wiring.md` and run:

```bash
node observability/smoke-tests/validate-runtime-observability-wiring.mjs
```
