# Validation

Validation contracts for the knowledge repository.

Run:

```bash
node scripts/validate-enterprise-evaluation.mjs
node scripts/validate-structure.mjs
node sdd/validation/validate-sdd-package.mjs
```

`roadmap-coverage.json` maps roadmap tasks to real files in this repository.

The SDD package validator checks `sdd/` templates, gates and the
machine-readable SDD contract used by HARDENING-V1.1 H1.
