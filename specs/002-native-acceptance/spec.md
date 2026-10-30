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

RF-8. THE SYSTEM SHALL execute a scenario only through a registry entry with a
fixed executable identity, argument vector and working-directory root; shell
interpretation, inline script text, command substitution and environment-derived
executables shall be rejected.

RF-9. THE SYSTEM SHALL enforce a finite per-scenario timeout, a minimal
allowlisted environment, bounded stdout/stderr capture and a filesystem boundary
that permits only declared read inputs and a runner-owned evidence directory.

RF-10. IF a command requests an undeclared argument, executable, environment
variable, path escape, forbidden shell feature or exceeds its timeout, THEN THE
SYSTEM SHALL report BLOCKED with a safe diagnostic and shall not execute a
fallback command.

## Non-goals

No unregistered shell command runs, arbitrary arguments, inherited secret-rich
environments, automatic scenario generation by an LLM, empty test directories,
or claim that fakes are external integration.

## Acceptance criteria

Fixture scenarios prove module PASS, consumer-owned cross PASS, missing/empty
mandatory scenario BLOCKED, command failure FAIL, dependency-free cross
NOT_APPLICABLE and stale evidence detection.
