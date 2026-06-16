# Agent Registry Schema

This folder documents the W5-T1 agent schema contract for `ai-knowledge`.

W5-T1 defines the canonical shape and governance rules for one agent registry
entry. W5-T2 adds repository-backed storage. W5-T3 adds a governed capability
catalog and dependency model. W5-T4 adds governed ownership and approval-chain
rules. These contracts do not create evaluation linkage, runtime orchestration,
IAM or execution.

## Contract Files

| File | Purpose |
|---|---|
| `../agent-registry.schema.json` | Machine-readable JSON Schema for one agent registry entry. |
| `../agent-registry.capability.schema.json` | Machine-readable JSON Schema for one W5-T3 capability record. |
| `../../examples/agent-registry-entry.valid.json` | Minimal valid example used by local validation. |
| `../../scripts/validate-agent-registry-schema.mjs` | Local validation contract for schema integrity and example conformance. |
| `capabilities.catalog.json` | W5-T3 catalog of governed capabilities and dependencies. |
| `CAPABILITIES.md` | Human-readable W5-T3 catalog rules and non-goals. |
| `ownership.policy.json` | W5-T4 ownership, accountability and approval-chain contract. |
| `OWNERSHIP.md` | Human-readable W5-T4 ownership rules and non-goals. |

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

Changes to `capabilities.catalog.json` require review of `CAPABILITIES.md`,
`agent-registry.capability.schema.json` and
`scripts/validate-agent-registry-capabilities.mjs`.

Changes to `ownership.policy.json` require review of `OWNERSHIP.md`,
`agent-registry.schema.json` and
`scripts/validate-agent-registry-ownership.mjs`.
