# ENTERPRISE-10-10 Roadmap To Files

`ai-knowledge` owns evaluation, benchmarks, scoring, datasets, prompt registry,
agent registry and knowledge quality gates.

| Task | Objective | Real files | Validation | Status | Reason |
|---|---|---|---|---|---|
| W3-T1 | Prompt Evaluation Framework | `evaluation/enterprise-10-10/evaluation-program.json`, `config/evaluation-policy.json` | `validate-enterprise-evaluation.mjs` | IMPLEMENTED_BY_REPAIR | Prompt dimensions and lifecycle exist. |
| W3-T2 | Agent Evaluation Framework | `evaluation/enterprise-10-10/evaluation-program.json`, `registries/agents/skills-index.md` | `validate-enterprise-evaluation.mjs` | IMPLEMENTED_BY_REPAIR | Agent inputs, outputs and states exist. |
| W3-T3 | Benchmark Framework | `benchmarks/catalog.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Benchmarks bind datasets and scoring. |
| W3-T4 | Score Framework | `scoring/rubric.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Weighted rubric and thresholds exist. |
| W3-T5 | Datasets | `datasets/registry.json`, `datasets/synthetic/*.jsonl` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Synthetic datasets are registered and present. |
| W3-T6 | Evaluation Reports | `evaluation/enterprise-10-10/evaluation-program.json` | `validate-enterprise-evaluation.mjs` | IMPLEMENTED_BY_REPAIR | Required report sections are defined. |
| W3-T7 | Evaluation Audit Final | `scripts/validate-enterprise-evaluation.mjs`, this file | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Evaluation workstream is product-validatable. |
| W4-T1 | Prompt Schema | `config/prompt-registry.schema.json`, `config/prompt-registry/README.md`, `examples/prompt-registry-entry.valid.json`, `scripts/validate-prompt-registry-schema.mjs` | `validate-prompt-registry-schema.mjs`, `validate-structure.mjs` | IMPLEMENTED | Prompt schema, validation contract and schema governance are product-validatable. |
| W4-T2 | Prompt Registry Storage | `registries/prompts/README.md`, `registries/prompts/registry.storage.json`, `registries/prompts/code-generator/v*/system-prompt.md`, `scripts/validate-prompt-registry-storage.mjs` | `validate-prompt-registry-storage.mjs`, `validate-structure.mjs` | IMPLEMENTED | Repository-backed prompt storage, integrity checks and lifecycle contract are product-validatable. |
| W4-T3 | Versioning | `config/prompt-registry.schema.json`, `config/prompt-registry/VERSIONING.md`, `config/prompt-registry/versioning.compatibility.json`, `scripts/validate-prompt-registry-versioning.mjs` | `validate-prompt-registry-versioning.mjs`, `validate-structure.mjs` | IMPLEMENTED | Per-prompt semantic versioning, compatibility policy and governance rules are product-validatable. |
| W4-T4 | Ownership | `config/prompt-registry.schema.json`, `config/prompt-registry/OWNERSHIP.md`, `config/prompt-registry/ownership.policy.json`, `scripts/validate-prompt-registry-ownership.mjs` | `validate-prompt-registry-ownership.mjs`, `validate-structure.mjs` | IMPLEMENTED | Prompt ownership model, approval rules and accountability contract are product-validatable. |
| W4-T5 | Evaluation Linkage | `config/prompt-registry/EVALUATION-LINKAGE.md`, `config/prompt-registry/evaluation-linkage.json`, `config/evaluation-policy.json`, `evaluation/enterprise-10-10/evaluation-program.json`, `scripts/validate-prompt-registry-evaluation-linkage.mjs` | `validate-prompt-registry-evaluation-linkage.mjs`, `validate-enterprise-evaluation.mjs`, `validate-structure.mjs` | IMPLEMENTED | Prompt registry entries are linked to evaluation policy, benchmark, dataset and rubric assets without executing evaluations. |
| W4-T6 | Prompt Registry Audit | `config/prompt-registry/AUDIT.md`, `config/prompt-registry/prompt-registry.audit.json`, `scripts/validate-prompt-registry-audit.mjs`, `scripts/validate-structure.mjs`, this file, `validation/roadmap-coverage.json` | `validate-prompt-registry-audit.mjs`, `validate-structure.mjs` | IMPLEMENTED | Final prompt registry audit validates schema, storage, versioning, ownership, evaluation linkage, documentation and machine-readable artifacts while leaving W5 unopened. |
| W5-T1 | Agent Schema | `config/agent-registry.schema.json`, `config/agent-registry/README.md`, `examples/agent-registry-entry.valid.json`, `scripts/validate-agent-registry-schema.mjs` | `validate-agent-registry-schema.mjs`, `validate-structure.mjs` | IMPLEMENTED | Canonical agent schema, documentation, valid example and validation contract are product-validatable without opening W5-T2. |
| W5-T2 | Agent Registry Storage | `registries/agents/` | Future W5 validation | PREPARED_NOT_CLOSED | Agent registry files are baseline material only; W5 is not opened. |
| W5-T3 | Capabilities Catalog | `registries/agents/skills-index.md` | Future W5 validation | BASELINE_PRESENT | Capability catalog baseline exists; W5 is not opened. |
| W5-T4 | Ownership | `config/agent-registry.schema.json` | Future W5 validation | BASELINE_PRESENT | Agent owner fields are baseline only; W5 is not opened. |
| W5-T5 | Evaluation Linkage | `config/evaluation-policy.json` | Future W5 validation | BASELINE_PRESENT | Evaluation policy is baseline only; W5 is not opened. |
| W5-T6 | Agent Registry Audit | `scripts/validate-structure.mjs` | Future W5 validation | READY_FOR_FUTURE_TASK | Agent registry audit remains unopened. |
| W7-T1 | README Review | `README.md`, folder READMEs | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Repo is navigable from README. |
| W7-T2 | CONTRIBUTING Review | `CONTRIBUTING.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Contribution rules exist. |
| W7-T3 | Architecture Documentation | `docs/architecture/architecture-principles.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Architecture docs exist. |
| W7-T4 | Setup Documentation | `docs/onboarding/developer-onboarding.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Setup/onboarding guidance exists. |
| W7-T5 | Onboarding Documentation | `docs/onboarding/developer-onboarding.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Onboarding path exists. |
| W7-T6 | Runbooks & Playbooks | `docs/runbooks/ops-runbook.md`, `docs/playbooks/working-with-ai-agents.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Operational procedures exist. |
| W8-T1 | Legacy Inventory | `_deprecated/2026-06-11/README.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Tool-context legacy is isolated. |
| W8-T5 | Reference Validation | `scripts/validate-structure.mjs` | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Coverage files are checked. |
