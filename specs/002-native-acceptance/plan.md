# Plan — Native Acceptance

## Strategy

Use Feature 001's validated graph and a declarative acceptance registry. A small
runtime runner validates scenario shape, executes allowlisted commands with
bounded captured output, and writes structured reports outside immutable source
inputs. Cross ownership is checked from consumer module IDs, not directory names.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1, RF-2 | Registry/discovery plus graph resolution; discarded filesystem-only discovery because it cannot prove declared ownership. |
| RF-3, RF-4 | Explicit state machine with mandatory-count checks; discarded treating zero tests/skips as success. |
| RF-5, RF-6, RF-7 | JSON evidence with canonical input fingerprints and execution kind; discarded free-form logs and timestamp-only freshness. |
| RF-8, RF-9, RF-10 | Spawn executable plus argv without shell, registry-only absolute/verified command identity, root-contained working directory and paths, fixed timeout, minimal env allowlist, bounded streams and runner-owned output directory; discarded `shell: true`, inherited `process.env`, relative path trust and arbitrary command text. |

## Probable files after approval

`contracts/acceptance-*.schema.json`, `runtime/acceptance/{registry,runner,evidence}.mjs`, focused tests and disposable fixtures. The registry names executable digest/path, argv tokens, timeout, permitted environment keys, input roots and evidence root; no command string is accepted. Evidence destination and retention are bounded and ignored unless governance expressly selects versioned evidence. No consumer source changes.

## Evidence fingerprint and staleness contract

The runner will construct canonical UTF-8 JSON (recursively sorted object keys,
arrays in declared registry order, no wall-clock fields) and SHA-256 it. The
fingerprint fields are: schema version; module/scenario/provider/consumer IDs;
contract IDs and immutable references; canonical dependency-manifest digest;
registry entry digest; executable content digest; argv token list; fixture/input
file content digests in declared order; execution kind; selected environment
identity (platform, architecture, runtime version and only allowlisted key
**names**); and source revision. Timestamp, report path, captured output and
secret environment values are excluded.

Evidence is stale if any fingerprint field differs, any required input is absent
or unreadable, the report schema is unsupported, the scenario was mandatory but
has no result, or its recorded result is not PASS. Byte-identical canonical inputs
are valid regardless of filesystem mtime, JSON key order or evidence file name.
Comparison is exact and never uses a freshness duration. A stale/malformed record
is reported as `BLOCKED` for a mandatory check, not silently rerun or reused.

## Test strategy and rollback

Use local Node fixture commands for deterministic runner semantics, labelled
`simulated`; reserve GI PostgreSQL/API tests for the later real pilot and label
them `real-integration`. Negative tests cover empty/missing/skip/fail/stale,
shell metacharacters, argument injection, path traversal/symlink escape,
undeclared environment variables, inherited secret-like variables, output limits
and timeout process cleanup. The runner must reject unregistered commands.
Rollback removes additive files.

## Risks

Command execution is a trust boundary: registry validation occurs before spawn;
the runner never uses a shell, logs only allowed environment key names, kills a
timed-out process tree, and records no environment values. Evidence must not
carry environment secrets.
