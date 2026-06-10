# W2-T1 - SLI Definition

Program:
ENTERPRISE-10-10-V1

Status:
DEFINED

Scope:
Enterprise observability indicators for the AI-Native ecosystem:
- `ai-native` governance execution.
- `ai-foundation` runtime, error handling, and AI provider integration surfaces.
- `ai-template` application workflow, API, and request logging surfaces.

Out of scope for W2-T1:
- SLO targets.
- Error budget policy.
- Alert thresholds.
- Dashboard implementation.
- Product instrumentation changes.

## Principles

SLIs must be:
- Measurable from events, metrics, traces, or structured logs.
- Expressed as ratios, distributions, or freshness indicators.
- Bound to a clear surface and ownership area.
- Usable by W2-T2 for SLO definition without redefining the signal.

W2-T1 intentionally defines indicators only. Targets, objective windows, burn rates, and alert thresholds belong to later W2 tasks.

## Canonical Dimensions

Every SLI should support these dimensions when instrumentation exists:
- `repository`
- `service`
- `environment`
- `operation`
- `request_id`
- `session_id`
- `workflow_id`
- `provider`
- `error_type`
- `error_severity`

PII and secrets must not be emitted as metric labels, span attributes, or log fields.

## SLI Catalog

### SLI-001 - Governance Execution Completeness

Surface:
`ai-native` governance execution.

User promise:
Enterprise roadmap tasks can be audited from source documents and task evidence.

Good event:
A task execution has mandatory source review, scope, implementation notes, validation results, change list, and decision request recorded.

Total event:
Any active roadmap task execution.

Formula:
`complete_governance_executions / total_governance_executions`

Expected sources:
- `governance/execution/current/`
- `governance/execution/archive/ENTERPRISE-10-10-V1/`
- `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`

Implementation status:
Defined. Evidence is file-based until metrics catalog implementation.

### SLI-002 - Runtime Operation Success Rate

Surface:
`ai-foundation` runtime operations.

User promise:
Runtime operations complete without controlled or uncontrolled failure.

Good event:
A runtime operation exits successfully and records success state.

Total event:
Any started runtime operation.

Formula:
`successful_runtime_operations / total_runtime_operations`

Expected sources:
- Runtime execution events.
- Structured logs from `runtime/core/runtime.ts`.
- Future trace spans for runtime operations.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-003 - Workflow Completion Rate

Surface:
`ai-template` application workflows.

User promise:
Business workflows that start can reach a terminal successful state.

Good event:
A workflow execution completes successfully.

Total event:
Any workflow execution started.

Formula:
`successful_workflow_executions / total_workflow_executions`

Expected sources:
- Workflow engine events.
- Structured logs from `services/application/workflows/workflow-engine.ts`.
- Future trace spans for workflow execution.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-004 - API Request Success Rate

Surface:
`ai-template` API routes and controllers.

User promise:
API requests receive successful, controlled responses.

Good event:
An API request returns a successful response class.

Total event:
Any API request received by the application surface.

Formula:
`successful_api_requests / total_api_requests`

Expected sources:
- API response helpers.
- Route/controller structured logs.
- Future HTTP server metrics.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-005 - Request Latency Distribution

Surface:
`ai-template` API and workflow request handling.

User promise:
Requests complete within an observable latency distribution.

Good event:
Not applicable. This SLI is a distribution, not a pass/fail ratio.

Total event:
Any measured request, workflow, or orchestrator execution.

Formula:
`distribution(request_duration_ms)`

Expected sources:
- Request context.
- API route timing.
- Workflow and orchestrator timing.
- Future OpenTelemetry spans.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-006 - AI Provider Call Success Rate

Surface:
AI provider and external API integration paths.

User promise:
External AI/provider calls return usable responses or controlled failures.

Good event:
An external provider call returns a usable response without retry exhaustion.

Total event:
Any external provider call attempt.

Formula:
`successful_provider_calls / total_provider_calls`

Expected sources:
- Provider adapter events.
- Error handling integration.
- Future OpenTelemetry client spans.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-007 - Retry Recovery Rate

Surface:
`ai-foundation` retry and error handling paths.

User promise:
Retryable failures are recovered when retry policy can safely recover them.

Good event:
A retryable failure succeeds after one or more retries.

Total event:
Any retryable failure handled by retry logic.

Formula:
`recovered_retryable_failures / total_retryable_failures`

Expected sources:
- `observability/core/retry-engine.ts`
- Retry strategy execution events.
- Error handler events.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-008 - Incident Capture Rate

Surface:
`ai-foundation` and `ai-template` incident/error logging paths.

User promise:
High-severity failures produce durable diagnostic records.

Good event:
A high or critical failure creates a structured incident or diagnostic record.

Total event:
Any high or critical failure observed by error handling.

Formula:
`captured_high_severity_failures / total_high_severity_failures`

Expected sources:
- `observability/logging/incident-writer.ts`
- `services/infrastructure/observability/incident-logger.ts`
- Structured error logs.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

### SLI-009 - Observability Data Freshness

Surface:
Metrics, logs, traces, and governance evidence.

User promise:
Operational data is recent enough to support diagnosis and audit.

Good event:
An observability stream or evidence source has data newer than its configured freshness window.

Total event:
Any required observability stream or evidence source.

Formula:
`fresh_observability_sources / total_required_observability_sources`

Expected sources:
- Metrics backend.
- Log backend.
- Trace backend.
- Governance evidence files.

Implementation status:
Defined. Freshness windows are deferred to W2-T2.

### SLI-010 - Trace Correlation Coverage

Surface:
Runtime, workflow, API, and provider operations.

User promise:
Failures and slow paths can be correlated across request, workflow, runtime, and provider boundaries.

Good event:
An operation emits a correlation identifier and can be linked to logs or traces.

Total event:
Any operation requiring cross-surface diagnosis.

Formula:
`correlated_operations / total_operations_requiring_correlation`

Expected sources:
- Request context.
- Structured logs.
- Future OpenTelemetry traces.

Implementation status:
Defined. Product instrumentation is not changed in W2-T1.

## Minimum Validation Checklist

W2-T1 is valid when:
- Every SLI has a unique identifier.
- Every ratio SLI defines good and total events.
- Distribution SLIs explicitly state that good events are not applicable.
- Each SLI names expected sources.
- No SLO target, alert threshold, burn-rate policy, or error budget is defined.
- No product code changes are required for the definition.

