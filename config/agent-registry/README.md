# Agent Registry Schema

This folder documents the W5-T1 agent schema contract for `ai-knowledge`.

W5-T1 defines the canonical shape and governance rules for one agent registry
entry. It does not create agent registry storage, capability catalog records,
ownership approval chains, evaluation linkage, runtime orchestration or
execution.

## Contract Files

| File | Purpose |
|---|---|
| `../agent-registry.schema.json` | Machine-readable JSON Schema for one agent registry entry. |
| `../../examples/agent-registry-entry.valid.json` | Minimal valid example used by local validation. |
| `../../scripts/validate-agent-registry-schema.mjs` | Local validation contract for schema integrity and example conformance. |

## Governance Rules

Every agent registry entry must include:

| Field | Rule |
|---|---|
| `schemaVersion` | Must be `agent-registry-entry.v1`. |
| `id` | Stable dotted identifier. |
| `owner` | Team and contact are mandatory governance accountability fields. |
| `purpose` | Operational purpose must be explicit. |
| `version` | Per-agent semantic version string; not the global repository `VERSION`. |
| `status` | One of `draft`, `active`, `restricted` or `deprecated`. |
| `capabilities` | Declared capability ids only; W5-T3 catalog remains future scope. |
| `tools` | Declared tool references only; no runtime execution is granted. |
| `evaluationSuite` | Required before activation and must include a minimum score. |
| `runtimeControls` | Tool policy, data boundary and human approval are explicit. |
| `governance` | Must bind the schema to roadmap task `W5-T1`. |

Changes to `agent-registry.schema.json` require review of this README, the
valid example and `scripts/validate-agent-registry-schema.mjs`.
