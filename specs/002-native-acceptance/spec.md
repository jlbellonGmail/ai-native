# Native Acceptance

Status: draft
human_gate: required
autonomy: full

## Goal

Execute and report module and consumer-owned cross acceptance from public
interfaces and the declared dependency graph.

## Requirements

RF-1. THE SYSTEM SHALL discover declared Module Acceptance scenarios for a
resolved module and execute only their registered commands.

RF-2. WHEN a module has declared dependencies, THE SYSTEM SHALL discover its
required Cross Acceptance scenarios under the consumer and execute them against
the declared providers; a dependency-free module shall be NOT_APPLICABLE for
cross acceptance.

RF-3. IF a mandatory scenario is absent, empty, skipped, exits unsuccessfully or
cannot run, THEN THE SYSTEM SHALL consolidate FAIL or BLOCKED, never PASS.

RF-4. THE SYSTEM SHALL report PASS, FAIL, BLOCKED or NOT_APPLICABLE per scenario
and in a fail-closed consolidated result.

RF-5. THE SYSTEM SHALL write bounded, reproducible evidence linked to module,
feature, scenario, contract/provider/consumer IDs, input digests, commit,
environment, timestamp, execution kind and result.

RF-6. WHEN a relevant manifest, contract, fixture, command or code input changes,
THE SYSTEM SHALL mark prior evidence stale rather than use it as PASS.

RF-7. THE SYSTEM SHALL distinguish real execution from mock/simulated execution
in result metadata.

## Non-goals

No unregistered shell command runs, no automatic scenario generation by an LLM,
no empty test directories, no claim that fakes are external integration.

## Acceptance criteria

Fixture scenarios prove module PASS, consumer-owned cross PASS, missing/empty
mandatory scenario BLOCKED, command failure FAIL, dependency-free cross
NOT_APPLICABLE and stale evidence detection.
