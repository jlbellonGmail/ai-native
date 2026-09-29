# Runtime Observability Wiring

## Specify

H3 connects existing observability governance to runtime execution without
requiring a vendor, endpoint or secret. The goal is to make runtime operations
emit trace, metric and log signals through a safe local/no-op default that can
be validated before a real observability backend exists.

Problem solved:

* The ecosystem already defines observability records, SLI/SLO intent and OTel
  bindings.
* Runtime execution did not yet have an explicit wiring point for traces,
  metrics and structured logs.
* Generated projects needed a concrete, configurable starting point.

In scope:

* Runtime observability wiring contract.
* Runtime helper for operation spans, outcome metrics and structured events.
* Safe defaults with no endpoint, token or external service requirement.
* Local smoke validation.
* Documentation for later dashboard and alert binding.

Out of scope:

* Remote collector deployment.
* Dashboard provisioning.
* Alert provisioning.
* H4 testing profile execution.
* H5 real evaluation runs.
* H6 target repository security validation.
* H7 first client project playbook.
* H8 final adoption audit.

Acceptance criteria:

* Runtime can wrap an operation and record success/failure outcomes.
* Configuration is explicit and defaults to no external export.
* The wiring can be validated locally without secrets or internet.
* The contract maps runtime signals to existing observability program records.
* Generated projects receive a compatible baseline.

## Plan

Product changes:

* Add `observability/runtime-wiring/runtime-observability.ts`.
* Add `observability/runtime-wiring/runtime-observability.contract.json`.
* Add `observability/opentelemetry-example/runtime-observability-example.ts`.
* Add `observability/smoke-tests/validate-runtime-observability-wiring.mjs`.
* Wire `runtime/core/runtime.ts` through the runtime observability helper.
* Update structure and enterprise validators.

Validation:

```bash
node observability/smoke-tests/validate-runtime-observability-wiring.mjs
node scripts/validate-structure.mjs
node scripts/validate-enterprise-10-10.mjs
pnpm typecheck
git diff --check
```

## Implement

The runtime helper uses OpenTelemetry API primitives when enabled. With the
default configuration, it does not export to any remote system. A project can
later attach an SDK/provider and collector through its own runtime deployment
without changing the application wiring.

Runtime signals:

* Trace span: `runtime.agent_task`.
* Metric counter: `ai_runtime_operation_total`.
* Metric histogram: `ai_runtime_operation_duration_ms`.
* Structured event fields: `service.name`, `operation.name`, `outcome`.

## Verify

Run the smoke validator from `ai-foundation`:

```bash
node observability/smoke-tests/validate-runtime-observability-wiring.mjs
```

The validator checks contract shape, required files, runtime integration and
that no endpoint or token is required by the default configuration.
