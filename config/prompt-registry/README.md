# Prompt Registry Schema

This folder documents the W4-T1 prompt schema contract for `ai-knowledge`.

W4-T1 defines the shape and governance rules for a single prompt registry entry.
It intentionally does not define registry storage, persistence, migration
behavior or runtime loading. Those concerns remain future work, starting with
W4-T2.

## Contract Files

| File | Purpose |
|---|---|
| `../prompt-registry.schema.json` | Machine-readable JSON Schema for one prompt registry entry. |
| `../../examples/prompt-registry-entry.valid.json` | Minimal valid example used by local validation. |
| `../../scripts/validate-prompt-registry-schema.mjs` | Local validation contract for schema integrity and example conformance. |

## Governance Rules

Every prompt registry entry must include:

| Field | Rule |
|---|---|
| `schemaVersion` | Must be `prompt-registry-entry.v1`. |
| `id` | Stable dotted identifier; storage layout is deferred to W4-T2. |
| `owner` | Team and contact are mandatory before activation. |
| `version` | Semantic version string. |
| `evaluationSuite` | Required before activation and must include a minimum score. |
| `riskControls` | Prompt injection, data boundary and human review policy are explicit. |
| `governance` | Must bind the schema to roadmap task `W4-T1`. |

Changes to `prompt-registry.schema.json` require review of this README, the
valid example and `scripts/validate-prompt-registry-schema.mjs`.
