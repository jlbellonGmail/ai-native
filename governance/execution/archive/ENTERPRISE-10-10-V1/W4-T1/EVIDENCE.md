# Evidence

W4-T1 roadmap requirements:

| Requirement | Evidence |
|---|---|
| prompt schema | `ai-knowledge/config/prompt-registry.schema.json` |
| validation contract | `ai-knowledge/scripts/validate-prompt-registry-schema.mjs` |
| schema governance | `ai-knowledge/config/prompt-registry/README.md` |
| machine-readable artifact | JSON Schema in `ai-knowledge/config/prompt-registry.schema.json` |
| restrictions documented | README states no runtime, no migrations and W4-T2 deferred |

Product commit:

* `ai-knowledge` W4-T1 commit: `4ea42cf`

Supporting alignment commits:

* `ai-foundation`: `5345c5e`
* `ai-template`: `d233c95`

Final realignment commits preserved:

* `ai-foundation`: `3944cf6`
* `ai-knowledge`: `779522c`
* `ai-template`: `9a6a2d0`
