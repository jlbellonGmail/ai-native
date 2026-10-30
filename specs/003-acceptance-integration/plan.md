# Plan — acceptance integration and compatibility

## Strategy

Extend the existing command contract and projections, add `acceptance` to the
runtime dispatcher, then integrate its result into existing quality composition
without changing branch protection semantics. Reuse upgrade transaction and
review ledger. Run the GI pilot from an isolated source copy with its source SHA
explicitly recorded, never in its parent factory Git identity.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1 | Extend command schema/catalog/body, adapter projections and `runtime/main.mjs`; discarded undocumented standalone script. |
| RF-2, RF-3 | Reuse graph/runner selection and existing gates; discarded unconditional all-consumer test runs and a new governance system. |
| RF-4 | Extend tested upgrade delta additively; discarded overwriting consumer-owned manifests or invoking upgrade in this factory. |
| RF-5 | Targeted docs/versioning candidate handoff; discarded release/tag publication. |
| RF-6 | Disposable GI copy, pinned source and PostgreSQL fixture; discarded `gi_dev.py` because its exit code is not a gate. |
| RF-7 | Existing review ledger plus Claude attester; discarded self-review or OpenCode subagent as approval. |

## Probable files after approval

Command contract/schema/body, dispatcher/adapters and tests; gates/consumer L3
only if existing composition requires it; upgrade tests; docs/versioning and
pilot fixtures/evidence policy. Any `.github/**` or governance-gate edit is
separately assessed and remains human-gated.

## Migration, rollout and rollback

Test synthetic v3 locks first: unchanged owned files, repeat upgrade, collision,
failure/rollback and customized projection/profile. A release bundle test proves
new runtime files ship. Build pilot environment only after implementation plan
approval; use `postgres:16-alpine` digest recorded in `V4-AUDIT.md` and classify
ASGI/PostgreSQL correctly as real integration. Delete only pilot resources created
by the run. Revert additive factory change through Git if rejected.

## Risks

This crosses contracts/runtime/adapters and may affect control-plane gates.
Existing BASE trust means a v3 consumer upgrade PR cannot assume its new v4 gate
already protects itself. Merge/release remains human-only.
