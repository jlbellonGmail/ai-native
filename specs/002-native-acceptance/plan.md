# Plan — Native Acceptance

## Strategy

Use Feature 001's validated graph and a declarative acceptance registry. A small
runtime runner validates scenario shape, executes allowlisted commands with
bounded captured output, and writes structured reports outside immutable source
inputs. Cross ownership is checked from consumer module IDs, not directory names.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1, RF-2, RF-12, RF-13 | Expand each dependency edge deterministically into a consumer-owned mandatory validation obligation. Missing/skip/unavailable test is BLOCKED; discard provider-owned cross tests and advisory optional obligations. |
| RF-3, RF-4 | Explicit state machine with mandatory-count checks; discard treating zero tests/skips as success. |
| RF-5, RF-6, RF-7, RF-11, RF-17, RF-18 | JSON evidence separates `sourceRevision` provenance from canonical scenario-input fingerprints; include verifiable non-secret configuration and declared environment inputs. Secret values are neither stored/logged nor directly hashed; unknown critical secret-derived configuration is BLOCKED. Discard whole-repository revision fingerprints and timestamp-only freshness. |
| RF-8, RF-9, RF-10, RF-14, RF-15, RF-16 | Spawn executable plus argv without shell only as injection defense, not sandbox. Require a verified isolation profile for filesystem roots, network-deny default, child processes, OS privileges and resource limits before execution; otherwise BLOCKED. Discard treating subprocess launch as isolation or inheriting `process.env`. |

## Probable files after approval

`contracts/acceptance-*.schema.json`, `runtime/acceptance/{registry,runner,evidence}.mjs`, focused tests and disposable fixtures. The registry names executable identity, argv tokens, timeout, isolation profile, permitted non-secret configuration/environment keys, filesystem roots and evidence root; no command string is accepted. Evidence retention is bounded and ignored unless governance explicitly selects versioned evidence. No consumer source changes.

## Evidence fingerprint and staleness contract

The runner constructs canonical UTF-8 JSON (recursively sorted object keys,
arrays in declared registry order, no wall-clock fields) and SHA-256 hashes it.
The **input fingerprint** contains only scenario-relevant data: schema version;
module/scenario/provider/consumer IDs; contract IDs and immutable references;
canonical dependency-manifest digest; registry entry digest; executable content
digest; argv tokens; declared fixture/input content digests; execution kind; and
environment identity (platform, architecture, runtime version and allowlisted
environment key names only).

`sourceRevision` is stored in the evidence report as provenance of the report,
but is intentionally outside the input fingerprint. Timestamp, report path,
captured output, secret environment values and undeclared repository paths are
excluded. This prevents an unrelated source change from invalidating a module's
acceptance while preserving traceability of the report's originating revision.

Relevant configuration files are fingerprinted from declared, validated
non-secret fields only. Environment dependencies are enumerated by key name and
classified before reading values; allowlisted non-secret values may enter the
canonical fingerprint. Secret values never enter reports or direct hashes. A
protected secret version/rotation identifier may be fingerprinted only if it is
provided as a non-secret stable identifier; otherwise a critical
secret-dependent scenario is BLOCKED. Missing/unreadable or unclassifiable
critical config/environment is BLOCKED, not silently omitted.

Evidence is stale if a fingerprint field differs, a required input is absent or
unreadable, the report schema is unsupported, a mandatory scenario has no result,
or its recorded result is not PASS. Byte-identical canonical inputs remain current
regardless of mtime, JSON key order, report file name, `sourceRevision`, or
unrelated repository changes. Comparison is exact and never time-based. A stale
or malformed mandatory record is `BLOCKED`, never silently rerun or reused.

## Test strategy and rollback

Use local Node fixture commands for deterministic runner semantics, labelled
`simulated`; reserve GI PostgreSQL/API tests for the later real pilot and label
them `real-integration`. Negative tests cover empty/missing/skip/fail/stale,
shell metacharacters, argument injection, path traversal/symlink escape,
undeclared environment variables, inherited secret-like variables, output limits
and timeout process cleanup. Isolation tests separately assert restricted
execution is not labelled sandbox, network/process/filesystem controls are
enforced, and absent host enforcement blocks before spawn. Evidence tests prove
configuration and non-secret environment changes invalidate, secret values are
never persisted/hashed, and unverifiable critical configuration blocks. They
also prove a relevant fixture/contract
change invalidates, while a changed unrelated file or `sourceRevision` alone
preserves the same input fingerprint and current evidence. The runner rejects
unregistered commands. Rollback removes additive files.

## Risks

Command execution is a trust boundary: registry validation occurs before spawn;
the runner never uses a shell, logs only allowed environment key names, kills a
timed-out process tree, and records no environment values. Evidence must not
carry environment secrets.
