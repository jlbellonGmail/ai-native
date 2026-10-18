# Agent Registry Audit

W5-T6 closes the ENTERPRISE-10-10 agent registry workstream with a final audit
contract.

This task validates that W5-T1 through W5-T5 are internally consistent,
documented and backed by machine-readable artifacts. It does not open W6,
define testing enterprise contracts, execute agents or approve runtime
activation.

## Audit Inputs

| Task | Audit input |
|---|---|
| W5-T1 | `../agent-registry.schema.json` and `../../examples/agent-registry-entry.valid.json` |
| W5-T2 | `../../registries/agents/registry.storage.json` and stored agent files |
| W5-T3 | `capabilities.catalog.json` and `../agent-registry.capability.schema.json` |
| W5-T4 | `ownership.policy.json` |
| W5-T5 | `evaluation-linkage.json`, `../evaluation-policy.json` and `../../evaluation/enterprise-10-10/evaluation-program.json` |

## Audit Outputs

| File | Purpose |
|---|---|
| `agent-registry.audit.json` | Machine-readable W5-T6 audit contract and checklist. |
| `../../scripts/validate-agent-registry-audit.mjs` | Local validator for the final W5 agent registry audit. |

## Closure Rules

W5-T6 may be closed only when:

* W5-T1 through W5-T6 are marked `IMPLEMENTED` in roadmap coverage.
* W5 agent registry artifacts exist and are mapped in the roadmap-to-files matrix.
* Agent storage, capability catalog, ownership and evaluation linkage agree on
  agent id, source storage entry and capability coordinates.
* Documentation and machine-readable contracts are present.
* W6-T1 remains unopened and is only identified as the next eligible task.

## Non-Goals

W5-T6 does not create testing contracts, execute agents, run evaluations,
approve runtime activation, grant tools or close any W6 task.
