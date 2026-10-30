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
| RF-5, RF-7 | JSON evidence with digests and execution kind; discarded free-form logs as the sole evidence. |
| RF-6 | Input fingerprint comparison; discarded timestamp-only freshness. |

## Probable files after approval

`contracts/acceptance-*.schema.json`, `runtime/acceptance/{registry,runner,evidence}.mjs`, focused tests and disposable fixtures. Evidence destination and retention are bounded and ignored unless governance expressly selects versioned evidence. No consumer source changes.

## Test strategy and rollback

Use local Node fixture commands for deterministic runner semantics, labelled
`simulated`; reserve GI PostgreSQL/API tests for the later real pilot and label
them `real-integration`. Negative tests cover empty/missing/skip/fail/stale. The
runner must reject unregistered commands. Rollback removes additive files.

## Risks

Command execution is a trust boundary: allowlist and working-directory checks
must prevent arbitrary execution. Evidence must not carry environment secrets.
