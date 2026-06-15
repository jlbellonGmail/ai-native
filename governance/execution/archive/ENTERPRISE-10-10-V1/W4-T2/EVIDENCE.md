# Evidence

W4-T2 roadmap requirements:

| Requirement | Evidence |
|---|---|
| registry structure | `ai-knowledge/registries/prompts/README.md` and `ai-knowledge/registries/prompts/code-generator/v*/system-prompt.md` |
| storage contract | `ai-knowledge/registries/prompts/registry.storage.json` |
| storage lifecycle | `registry.storage.json` lifecycle block with `stored`, `candidate`, `active`, `retired` |
| machine-readable artifact | `ai-knowledge/registries/prompts/registry.storage.json` |
| rules documented | `ai-knowledge/registries/prompts/README.md` |
| validation real | `ai-knowledge/scripts/validate-prompt-registry-storage.mjs` |

Product commit:

* `ai-knowledge` W4-T2 commit: `e3b322f`

Scope constraints:

* W4-T3 Versioning remains open.
* W4-T4 Ownership remains open.
* W4-T5 Evaluation Linkage remains open.
* W4-T6 Prompt Registry Audit remains open.
* No runtime persistence, database, migration or service API was introduced.

