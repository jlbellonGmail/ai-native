# Roadmap To Files Matrix

| Workstream | Repo | Product Files | State |
|---|---|---|---|
| W1 Security Engineering | ai-foundation | `.github/workflows/codeql.yml`, `.github/workflows/trivy.yml`, `.github/workflows/sbom.yml`, `.github/workflows/dependency-review.yml`, `.github/dependabot.yml`, `.github/workflows/supply-chain.yml`, `security/` | PRODUCT_COVERED |
| W2 Observability Engineering | ai-foundation | `observability/`, `observability/enterprise-10-10/observability-program.json`, `scripts/validate-enterprise-10-10.mjs` | PRODUCT_COVERED |
| W3 Evaluation Framework | ai-knowledge | `benchmarks/`, `datasets/`, `scoring/`, `evaluation/`, `quality-gates/`, `scripts/validate-enterprise-evaluation.mjs` | PRODUCT_COVERED |
| W4-T1 Prompt Schema | ai-knowledge | `config/prompt-registry.schema.json`, `config/prompt-registry/README.md`, `examples/prompt-registry-entry.valid.json`, `scripts/validate-prompt-registry-schema.mjs` | IMPLEMENTED |
| W4-T2 Prompt Registry Storage | ai-knowledge | `registries/prompts/` | PREPARED_NOT_CLOSED |
| W4-T3 Versioning | ai-knowledge | `config/prompt-registry.schema.json` | BASELINE_PRESENT |
| W4-T4 Ownership | ai-knowledge | `config/prompt-registry.schema.json` | BASELINE_PRESENT |
| W4-T5 Evaluation Linkage | ai-knowledge | `config/evaluation-policy.json`, `evaluation/enterprise-10-10/evaluation-program.json` | BASELINE_PRESENT |
| W4-T6 Prompt Registry Audit | ai-knowledge | validators available | READY_FOR_FUTURE_TASK |

`ai-template` remains a reusable scaffold/template surface and does not close
W4-T2 or later work.
