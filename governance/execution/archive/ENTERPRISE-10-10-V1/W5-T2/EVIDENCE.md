# Evidence

W5-T2 roadmap requirements:

| Requirement | Evidence |
|---|---|
| registry storage model | `ai-knowledge/registries/agents/registry.storage.json` |
| lifecycle contract | `ai-knowledge/registries/agents/registry.storage.json` |
| retention rules | `ai-knowledge/registries/agents/README.md` and `ai-knowledge/registries/agents/registry.storage.json` |
| machine-readable artifact | `ai-knowledge/registries/agents/registry.storage.json` |
| validation real | `ai-knowledge/scripts/validate-agent-registry-storage.mjs` |

Product commit:

* `ai-knowledge` W5-T2 commit: `f168138`

Scope constraints:

* W5-T3 Capabilities Catalog remains open.
* W5-T4 through W5-T6 remain open or baseline-only.
* No runtime persistence, database migration, service API, capability catalog semantics, ownership chain or evaluation linkage was introduced.
