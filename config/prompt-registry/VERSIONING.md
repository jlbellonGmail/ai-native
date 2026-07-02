# Prompt Registry Versioning

This document defines the W4-T3 versioning model for prompt registry entries in
`ai-knowledge`.

W4-T3 covers prompt version semantics, compatibility policy and versioning
governance rules. It does not define ownership, approvals, evaluation linkage,
runtime loading, migrations or global repository releases.

## Version Model

Prompt registry entries use semantic prompt versions in the `version` field:

```text
MAJOR.MINOR.PATCH
```

The prompt id remains stable across compatible updates. The storage slot is a
repository coordinate for a major version line, such as `v1`, `v2` or `v3`.

| Component | Meaning |
|---|---|
| `MAJOR` | Breaking prompt behavior, output contract, role or variable changes. |
| `MINOR` | Backward-compatible capability, guidance or optional variable additions. |
| `PATCH` | Editorial, formatting or typo changes that preserve behavior. |

## Compatibility Policy

| Change type | Compatible | Rule |
|---|---|---|
| Patch | Yes | May stay on the same major storage slot. |
| Minor | Yes | May stay on the same major storage slot when required variables remain compatible. |
| Major | No | Must use a new major prompt version and a matching major storage slot. |

Compatibility is evaluated per prompt id. A new major version does not replace
prior major lines automatically.

## Governance Rules

* Do not modify the repository `VERSION` file for prompt version changes.
* Do not change ownership or approval rules in W4-T3.
* Do not bind prompt versions to evaluation results in W4-T3.
* Every governed version record must reference an existing stored prompt file.
* Every governed version record must map to one storage entry in
  `registries/prompts/registry.storage.json`.
* Major compatibility decisions must be explicit in
  `versioning.compatibility.json`.

Run the W4-T3 validator after changing prompt versions:

```powershell
node scripts/validate-prompt-registry-versioning.mjs
```

