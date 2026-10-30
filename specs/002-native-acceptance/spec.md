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
required Cross Acceptance obligations under the consumer and execute the
consumer-owned validations against the declared providers; each declared
dependency creates at least one mandatory validation obligation. A
dependency-free module shall be NOT_APPLICABLE for cross acceptance.

RF-3. IF a mandatory scenario is absent, empty, skipped, exits unsuccessfully or
cannot run, THEN THE SYSTEM SHALL consolidate FAIL or BLOCKED, never PASS.

RF-4. THE SYSTEM SHALL report PASS, FAIL, BLOCKED or NOT_APPLICABLE per scenario
and in a fail-closed consolidated result.

RF-5. THE SYSTEM SHALL write bounded, reproducible evidence linked to module,
feature, scenario, contract/provider/consumer IDs, input digests, sourceRevision,
environment, timestamp, execution kind and result.

RF-6. WHEN a relevant manifest, contract, fixture, command, code input or declared
environment identity changes, THE SYSTEM SHALL mark prior evidence stale rather
than use it as PASS. A change outside the selected module scenario inputs shall
not invalidate its evidence.

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

RF-11. THE SYSTEM SHALL store sourceRevision as report provenance outside the
acceptance input fingerprint. The input fingerprint shall contain only declared
scenario-relevant inputs, and a changed sourceRevision alone shall not alter it.

RF-12. THE SYSTEM SHALL derive a required Cross Acceptance obligation for every
dependency edge and assign ownership to the consuming module; provider-owned
acceptance cannot satisfy the consumer's obligation.

RF-13. IF any declared dependency lacks a registered mandatory validation, or a
mandatory validation is missing, skipped, unexecutable or lacks required
isolation, THEN THE SYSTEM SHALL report BLOCKED and SHALL NOT consolidate PASS.

RF-14. THE SYSTEM SHALL distinguish a restricted command execution profile from
an isolated sandbox. `spawn` without shell is command-injection defense only and
SHALL NOT be represented as filesystem, network or process isolation.

RF-15. THE SYSTEM SHALL declare and verify the required runner isolation profile:
filesystem read/write boundaries, network policy, child-process policy, OS
identity/privileges and resource limits. Network is denied by default; writes
are limited to the runner-owned evidence area; undeclared child processes and
privilege escalation are denied.

RF-16. IF the host/runtime cannot enforce and attest the scenario's required
filesystem, network, process or privilege isolation, THEN THE SYSTEM SHALL report
BLOCKED before executing the scenario.

RF-17. THE SYSTEM SHALL fingerprint declared non-secret configuration inputs
and relevant environment-variable names plus their non-secret values when
explicitly allowed. Secret values SHALL never be stored, logged or hashed
directly; a critical secret-dependent configuration that cannot be verified
without exposing or recoverably hashing its value SHALL cause BLOCKED.

RF-18. IF a critical configuration input or environment dependency cannot be
read, classified as secret/non-secret, or verified against the declared
configuration contract, THEN THE SYSTEM SHALL report BLOCKED rather than claim
fresh evidence or PASS.

## Non-goals

No unregistered shell command runs, arbitrary arguments, inherited secret-rich
environments, treating spawn-without-shell as a sandbox, storing or hashing
secret values, automatic scenario generation by an LLM, empty test directories,
or claim that fakes are external integration.

## Acceptance criteria

Fixture scenarios prove module PASS, consumer-owned cross PASS, missing/empty
mandatory scenario BLOCKED, command failure FAIL, dependency-free cross
NOT_APPLICABLE, per-dependency consumer-owned obligations and missing-test
BLOCKED, restricted-versus-isolated execution reporting, inability-to-isolate
BLOCKED, relevant configuration/environment staleness, secret-safe fingerprint
handling, critical-configuration BLOCKED, and unrelated-revision retention.
