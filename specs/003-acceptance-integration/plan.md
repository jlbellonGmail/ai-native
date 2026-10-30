# Plan — acceptance integration and compatibility

## Strategy

Extend the existing command contract and projections, add `acceptance` to the
runtime dispatcher, then integrate its result into existing quality composition
without changing branch-protection semantics. Reuse the upgrade transaction and
review ledger. Run the GI pilot from an isolated source copy with its source SHA
explicitly recorded, never in its parent factory Git identity.

## Inspected v3 compatibility matrix

The matrix below is derived from local annotated tags, not documentation claims.
For `v3.3.0` through `v3.4.3`, `contracts/lock.schema.json` has blob
`d67779957b93…`, `contracts/bootstrap-protocol.json` declares protocol `1`, and
the release tree has `runtime/bootstrap/upgrade.mjs`. `v3.4.2` and `v3.4.3` each
declare CLI protocol `1` with `adopt`, `upgrade`, `detach` capabilities. Releases
`v3.0.0` through `v3.2.0` do not provide the complete inspected
lock/protocol/upgrade family; specifically, v3.2.0 has a lock schema but no
upgrade engine.

| Source releases | Observed family | v4 admission | Fixture / behavior |
|---|---|---|---|
| `v3.0.0`–`v3.2.0` | No complete inspected lock/protocol/upgrade family; v3.2.0 has a lock schema but no upgrade engine | Rejected | Representative real release-shape absence fixtures; reject before writes. |
| `v3.3.0`–`v3.4.1` | Lock schema blob `d67779957b93…`, protocol 1, upgrade engine present | Not admitted in initial v4 scope | One real-shape fixture per distinct observed protocol/lock family; reject by matrix before writes until a later approved expansion. |
| `v3.4.2` | Same observed lock family; CLI `v3.4.2`, protocol 1, includes `upgrade` | Admitted | Individual fixture generated from v3.4.2 lock/protocol artifacts; preservation, failure rollback and second-run idempotence. |
| `v3.4.3` | Same observed lock family; CLI `v3.4.3`, protocol 1, includes `upgrade` | Admitted | Individual fixture generated from v3.4.3 lock/protocol artifacts; preservation, failure rollback and second-run idempotence. |
| Unknown/future/malformed | Not in an exact matrix row | Rejected | Negative fixtures assert no filesystem, index or cache mutation. |

The equal schema/protocol family does not itself imply admission. The initial v4
release explicitly supports the two latest release fixtures requested here;
expanding to `v3.3.0`–`v3.4.1` requires fixtures and approval, not an implicit
range check.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1 | Extend command schema/catalog/body, adapter projections and `runtime/main.mjs`; discard an undocumented standalone script. |
| RF-2, RF-3 | Reuse graph/runner selection and existing gates; discard unconditional all-consumer runs and a second governance system. |
| RF-4, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13 | Add matrix validation before the current verified-bundle upgrade transaction. Use individual v3.4.2/v3.4.3 fixtures, project-owned sentinels, managed drift, Git/index snapshots, injected failures and second-run comparison. Discard version-prefix admission, overwriting consumer-owned files, broad filesystem snapshots and running upgrade in this factory. |
| RF-5 | Targeted docs/versioning candidate handoff; discard release/tag publication. |
| RF-6 | Disposable GI copy, pinned source and PostgreSQL fixture; discard `gi_dev.py` because its exit code is not a gate. |
| RF-7 | Existing review ledger plus Claude attester; discard self-review or an OpenCode subagent as approval. |

## Probable files after approval

Command contract/schema/body, dispatcher/adapters and tests; an upgrade matrix
contract/validator; release-derived test fixtures; upgrade tests; and targeted
docs/versioning. Gates/consumer L3 change only if existing composition requires
it. Any `.github/**` or governance-gate edit is separately assessed and remains
human-gated.

## Migration, rollout and rollback

Generate hermetic fixtures from the tagged v3.4.2 and v3.4.3 lock/protocol
artifacts, retaining each source version rather than relabelling one fixture.
Before/after compare project-owned sentinels, managed drift, Git status/index and
collision reports. Force failures after every write boundary through existing or
new test seams; assert `ROLLED_BACK` byte identity or explicit
`ROLLBACK_INCOMPLETE` paths. Apply the same verified v4 bundle twice and compare
manifests/projections byte-for-byte. Matrix rejection tests snapshot filesystem,
index and cache before invocation and prove no mutation.

Build the GI pilot only after implementation-plan approval; use the
`postgres:16-alpine` digest recorded in `V4-AUDIT.md` and classify
ASGI/PostgreSQL correctly as real integration. Delete only pilot resources
created by the run. Revert an additive factory change through Git if rejected.

## Risks

This crosses contracts/runtime/adapters and may affect control-plane gates. A
v3 consumer upgrade PR is judged initially from its trusted BASE platform, so it
cannot claim that the new v4 gate protected that same PR. Merge/release remains
human-only.
