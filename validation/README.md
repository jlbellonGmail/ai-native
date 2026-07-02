# Validation

Validation assets for generated projects and this template repository.

Run:

```bash
node scripts/validate-enterprise-template.mjs
node scripts/validate-structure.mjs
node scripts/validate-contract-testing.mjs
node scripts/validate-mutation-testing.mjs
node scripts/validate-load-testing.mjs
node scripts/validate-performance-testing.mjs
node scripts/validate-chaos-testing.mjs
node scripts/validate-coverage-validation.mjs
node scripts/validate-testing-audit-final.mjs
node scripts/validate-legacy-inventory.mjs
```

`tests/` contains the reference test suite moved from the old root `tests/`
folder.

W6-T1 contract testing policy is defined in `contract-testing.md` and
`contract-testing.contract.json`.

W6-T2 mutation testing policy is defined in `mutation-testing.md` and
`mutation-testing.contract.json`.

W6-T3 load testing governance is defined in `load-testing.md` and
`load-testing.contract.json`.

W6-T4 performance testing policy is defined in `performance-testing.md` and
`performance-testing.contract.json`.

W6-T5 chaos testing governance is defined in `chaos-testing.md` and
`chaos-testing.contract.json`.

W6-T6 coverage validation governance is defined in `coverage-validation.md` and
`coverage-validation.contract.json`.

W6-T7 testing audit final is defined in `testing-audit-final.md` and
`testing-audit-final.contract.json`.

W8-T1 legacy inventory is defined in `_deprecated/2026-06-11/legacy-inventory.md`
and `_deprecated/2026-06-11/legacy-inventory.contract.json`.
