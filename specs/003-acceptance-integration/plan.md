# Plan — acceptance integration and compatibility

## Strategy

Extend the existing command contract and projections, add `acceptance` to the
runtime dispatcher, then integrate its result into existing quality composition
without changing branch-protection semantics. Reuse the upgrade transaction and
review ledger. Run the GI pilot from an isolated source copy with its source SHA
explicitly recorded, never in its parent factory Git identity.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1 | Extend command schema/catalog/body, adapter projections and `runtime/main.mjs`; discard an undocumented standalone script. |
| RF-2, RF-3 | Reuse graph/runner selection and existing gates; discard unconditional all-consumer runs and a second governance system. |
| RF-4, RF-8, RF-9, RF-10, RF-11 | Extend the verified-bundle upgrade transaction and `applyUpgrade` journal. Add v3.4.3 fixture/protocol admission before writes; snapshot project-owned sentinels, managed drift, Git/index state; require verified rollback and second-run idempotence. Discard overwriting consumer-owned files, broad filesystem snapshots and running upgrade in this factory. |
| RF-5 | Targeted docs/versioning candidate handoff; discard release/tag publication. |
| RF-6 | Disposable GI copy, pinned source and PostgreSQL fixture; discard `gi_dev.py` because its exit code is not a gate. |
| RF-7 | Existing review ledger plus Claude attester; discard self-review or an OpenCode subagent as approval. |

## Probable files after approval

Command contract/schema/body, dispatcher/adapters and tests; gates/consumer L3
only if existing composition requires it; upgrade tests; docs/versioning and
pilot fixtures/evidence policy. Any `.github/**` or governance-gate edit is
separately assessed and remains human-gated.

## Migration, rollout and rollback

Create hermetic synthetic v3.4.3 fixtures using the actual locked protocol shape,
not a merely renamed current lock. Before/after compare project-owned sentinels,
managed drift, Git status/index and collision reports. Force failures after each
write boundary through injected test hooks; assert `ROLLED_BACK` byte identity or
explicit `ROLLBACK_INCOMPLETE` paths. Apply the same verified bundle twice and
compare resulting manifests/projections byte-for-byte. A release bundle test
proves new runtime files ship.

Build the GI pilot only after implementation-plan approval; use the
`postgres:16-alpine` digest recorded in `V4-AUDIT.md` and classify
ASGI/PostgreSQL correctly as real integration. Delete only pilot resources
created by the run. Revert an additive factory change through Git if rejected.

## Risks

This crosses contracts/runtime/adapters and may affect control-plane gates. A
v3 consumer upgrade PR is judged initially from its trusted BASE platform, so it
cannot claim that the new v4 gate protected that same PR. Merge/release remains
human-only.
