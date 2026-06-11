# ENTERPRISE-10-10 Roadmap To Files

`ai-template` owns reusable scaffolds, manifests, generation examples and
template validation.

| Task | Objective | Real files | Validation | Status | Reason |
|---|---|---|---|---|---|
| W2-T8 | Observability reusable pattern | `templates/enterprise-10-10/template-manifest.json` | `validate-enterprise-template.mjs` | IMPLEMENTED_BY_REPAIR | Template points to observability repair files. |
| W3-T7 | Evaluation reusable pattern | `templates/enterprise-10-10/template-manifest.json` | `validate-enterprise-template.mjs` | IMPLEMENTED_BY_REPAIR | Template points to evaluation repair files. |
| W6-T1 | Contract Testing | `validation/tests/`, `validation/roadmap-coverage.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Tests are in validation surface. |
| W6-T2 | Mutation Testing | `validation/strategy.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Mutation policy is defined for generated projects. |
| W6-T3 | Load Testing | `validation/strategy.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Load scenarios are defined as scaffold expectations. |
| W6-T4 | Performance Testing | `validation/strategy.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Performance measurement contract exists. |
| W6-T5 | Chaos Testing | `validation/strategy.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Resilience scenario contract exists. |
| W6-T6 | Coverage Validation | `vitest.config.ts`, `validation/strategy.md` | `validate-structure.mjs` | IMPLEMENTED_BY_EXISTING_FILES | Coverage thresholds exist. |
| W6-T7 | Testing Audit Final | `scripts/validate-structure.mjs` | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Template test surface is validated. |
| W7-T1 | README Review | `README.md`, folder READMEs | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Repo is navigable from README. |
| W7-T3 | Architecture Documentation | `docs/architecture/` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Architecture docs exist. |
| W7-T4 | Setup Documentation | `docs/setup/local-dev.md` | File presence | IMPLEMENTED_BY_EXISTING_FILES | Local setup docs exist. |
| W8-T1 | Legacy Inventory | `_deprecated/2026-06-11/README.md` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Legacy source analysis is isolated. |
| W8-T2 | Historical Archive | `_deprecated/2026-06-11/source-legacy-analysis/` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Historical analysis moved to archive surface. |
| W8-T3 | Duplicate Detection | `scripts/validate-structure.mjs` | Local validation PASS required | IMPLEMENTED_BY_REPAIR | Root duplicate package-lock is deprecated. |
| W8-T4 | Obsolete Artifacts | `_deprecated/2026-06-11/` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Obsolete/local artifacts have recovery location. |
| W8-T5 | Reference Validation | `manifests/enterprise-10-10-structure.json` | `validate-structure.mjs` | IMPLEMENTED_BY_REPAIR | Manifest references are checked. |
