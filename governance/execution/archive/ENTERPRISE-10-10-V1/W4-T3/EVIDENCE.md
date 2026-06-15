# Evidence

W4-T3 roadmap requirements:

| Requirement | Evidence |
|---|---|
| prompt versioning model | `ai-knowledge/config/prompt-registry/VERSIONING.md` and `ai-knowledge/config/prompt-registry/versioning.compatibility.json` |
| compatibility policy | `ai-knowledge/config/prompt-registry/versioning.compatibility.json` |
| governance rules | `ai-knowledge/config/prompt-registry/VERSIONING.md` |
| machine-readable artifact | `ai-knowledge/config/prompt-registry/versioning.compatibility.json` |
| validation real | `ai-knowledge/scripts/validate-prompt-registry-versioning.mjs` |

Product commit:

* `ai-knowledge` W4-T3 commit: `785f0d8`

Scope constraints:

* W4-T4 Ownership remains open.
* W4-T5 Evaluation Linkage remains open.
* W4-T6 Prompt Registry Audit remains open.
* Repository `VERSION` was not modified.
* No runtime loader, migration, database or service API was introduced.

