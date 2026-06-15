# Prompt Registry Schema

This folder documents the W4-T1 prompt schema contract for `ai-knowledge`.

W4-T1 defines the shape and governance rules for a single prompt registry entry.
W4-T2 defines repository-backed storage. W4-T3 defines per-prompt versioning and
compatibility policy. W4-T4 defines ownership, approval rules and accountability.
Runtime loading, IAM permissions and migrations remain out of scope.

## Contract Files

| File | Purpose |
|---|---|
| `../prompt-registry.schema.json` | Machine-readable JSON Schema for one prompt registry entry. |
| `versioning.compatibility.json` | Machine-readable W4-T3 prompt versioning and compatibility contract. |
| `VERSIONING.md` | Human-readable W4-T3 versioning usage guide. |
| `ownership.policy.json` | Machine-readable W4-T4 ownership and approval contract. |
| `OWNERSHIP.md` | Human-readable W4-T4 ownership usage guide. |
| `../../examples/prompt-registry-entry.valid.json` | Minimal valid example used by local validation. |
| `../../scripts/validate-prompt-registry-schema.mjs` | Local validation contract for schema integrity and example conformance. |
| `../../scripts/validate-prompt-registry-versioning.mjs` | Local validation contract for W4-T3 versioning. |
| `../../scripts/validate-prompt-registry-ownership.mjs` | Local validation contract for W4-T4 ownership. |

## Governance Rules

Every prompt registry entry must include:

| Field | Rule |
|---|---|
| `schemaVersion` | Must be `prompt-registry-entry.v1`. |
| `id` | Stable dotted identifier. |
| `owner` | Team and contact are mandatory governance accountability fields. |
| `version` | Per-prompt semantic version string; not the global repository `VERSION`. |
| `evaluationSuite` | Required before activation and must include a minimum score. |
| `riskControls` | Prompt injection, data boundary and human review policy are explicit. |
| `governance` | Must bind the schema to roadmap task `W4-T1`. |

Changes to `prompt-registry.schema.json` require review of this README, the
valid example and `scripts/validate-prompt-registry-schema.mjs`.

Changes to prompt version semantics require review of `VERSIONING.md`,
`versioning.compatibility.json` and
`scripts/validate-prompt-registry-versioning.mjs`.

Changes to prompt ownership require review of `OWNERSHIP.md`,
`ownership.policy.json` and
`scripts/validate-prompt-registry-ownership.mjs`.
