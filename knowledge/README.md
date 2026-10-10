# ai-knowledge

`ai-knowledge` is the knowledge, registry and evaluation product repository for
the AI-native ecosystem. It owns benchmark definitions, datasets, scoring,
quality gates, prompt and agent registries, and the documentation standards used
to decide whether AI-native work is acceptable.

## Main areas

| Area | Purpose |
|---|---|
| `evaluation/` | Prompt and agent evaluation contracts and lifecycle definitions. |
| `benchmarks/` | Benchmark suites that bind evaluation tasks to datasets and scores. |
| `datasets/` | Dataset registry and synthetic evaluation samples. |
| `scoring/` | Rubrics, weights and pass/review/fail decision thresholds. |
| `quality-gates/` | Product quality gates derived from evaluation and scoring rules. |
| `sdd/` | Canonical Spec-Driven Development package, templates, gates and validator. |
| `registries/` | Prompt, agent and knowledge registries. |
| `docs/` | Standards, architecture, compliance, onboarding, runbooks and roadmap mapping. |
| `config/` | Machine-readable schemas and policies. |
| `validation/` | Coverage maps and validation entry points. |
| `scripts/` | Local validators. |

## Validate

```bash
node scripts/validate-enterprise-evaluation.mjs
node scripts/validate-structure.mjs
node sdd/validation/validate-sdd-package.mjs
```

## ENTERPRISE-10-10 coverage

`docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md` maps roadmap workstreams to real
knowledge assets. Governance archives are not considered implementation.
