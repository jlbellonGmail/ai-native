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
| W4-T1 | Prompt Schema | `config/prompt-registry.schema.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Schema exists without closing W4. |
| W4-T2 | Prompt Registry Storage | `registries/prompts/` | `validate-structure.mjs` | IMPLEMENTED_BY_EXISTING_FILES | Versioned prompt files are stored in registry. |
| W4-T3 | Versioning | `config/prompt-registry.schema.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Versioning policy is machine-readable. |
| W4-T4 | Ownership | `config/prompt-registry.schema.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Owner is a required registry field. |
| W4-T5 | Evaluation Linkage | `config/evaluation-policy.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Registry requires evaluation suite linkage. |
| W4-T6 | Prompt Registry Audit | `scripts/validate-structure.mjs` | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Registry structure is validated. |
| W5-T1 | Agent Schema | `config/agent-registry.schema.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Agent schema is machine-readable. |
| W5-T2 | Agent Registry Storage | `registries/agents/` | `validate-structure.mjs` | IMPLEMENTED_BY_EXISTING_FILES | Agent material is stored in registry. |
| W5-T3 | Capabilities Catalog | `registries/agents/skills-index.md` | `validate-structure.mjs` | IMPLEMENTED_BY_EXISTING_FILES | Skills index acts as capability catalog. |
| W5-T4 | Ownership | `config/agent-registry.schema.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Owner is required for agents. |
| W5-T5 | Evaluation Linkage | `config/evaluation-policy.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Agents require evaluation suite linkage. |
| W5-T6 | Agent Registry Audit | `scripts/validate-structure.mjs` | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Agent registry is checked locally. |
| W7-T1 | README Review | `README.md`, folder READMEs | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Repo is navigable from README. |
| W7-T2 | CONTRIBUTING Review | `CONTRIBUTING.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Contribution rules exist. |
| W7-T3 | Architecture Documentation | `docs/architecture/architecture-principles.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Architecture docs exist. |
| W7-T4 | Setup Documentation | `docs/onboarding/developer-onboarding.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Setup/onboarding guidance exists. |
| W7-T5 | Onboarding Documentation | `docs/onboarding/developer-onboarding.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Onboarding path exists. |
| W7-T6 | Runbooks & Playbooks | `docs/runbooks/ops-runbook.md`, `docs/playbooks/working-with-ai-agents.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Operational procedures exist. |
| W8-T1 | Legacy Inventory | `_deprecated/2026-06-11/README.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Tool-context legacy is isolated. |
| W8-T5 | Reference Validation | `scripts/validate-structure.mjs` | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Coverage files are checked. |
