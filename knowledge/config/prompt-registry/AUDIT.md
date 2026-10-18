# Prompt Registry Audit

W4-T6 closes the ENTERPRISE-10-10 prompt registry workstream with a final audit
contract.

This task validates that W4-T1 through W4-T5 are internally consistent,
documented and backed by machine-readable artifacts. It does not open W5, define
agent registry behavior, execute prompts or approve runtime activation.

## Audit Inputs

| Task | Audit input |
|---|---|
| W4-T1 | `../prompt-registry.schema.json` and `../../examples/prompt-registry-entry.valid.json` |
| W4-T2 | `../../registries/prompts/registry.storage.json` and stored prompt files |
| W4-T3 | `versioning.compatibility.json` |
| W4-T4 | `ownership.policy.json` |
| W4-T5 | `evaluation-linkage.json`, `../evaluation-policy.json` and `../../evaluation/enterprise-10-10/evaluation-program.json` |

## Audit Outputs

| File | Purpose |
|---|---|
| `prompt-registry.audit.json` | Machine-readable W4-T6 audit contract and checklist. |
| `../../scripts/validate-prompt-registry-audit.mjs` | Local validator for the final W4 prompt registry audit. |

## Closure Rules

W4-T6 may be closed only when:

* W4-T1 through W4-T5 are marked `IMPLEMENTED` in roadmap coverage.
* W4 prompt registry artifacts exist and are mapped in the roadmap-to-files matrix.
* Prompt storage, versioning, ownership and evaluation linkage agree on prompt id,
  version and storage slot coordinates.
* Documentation and machine-readable contracts are present.
* W5 tasks remain unopened and are not marked implemented by this audit.

## Non-Goals

W4-T6 does not create agent registry schema, storage, capabilities, ownership,
evaluation linkage or audit closure for W5.
