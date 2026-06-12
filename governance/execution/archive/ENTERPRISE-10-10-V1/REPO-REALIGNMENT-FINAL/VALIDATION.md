# Validation

## Product Validators

| Repo | Command | Result |
|---|---|---|
| ai-foundation | `node scripts/validate-structure.mjs` | PASS |
| ai-foundation | `node scripts/validate-enterprise-10-10.mjs` | PASS |
| ai-knowledge | `node scripts/validate-prompt-registry-schema.mjs` | PASS |
| ai-knowledge | `node scripts/validate-structure.mjs` | PASS |
| ai-knowledge | `node scripts/validate-enterprise-evaluation.mjs` | PASS |
| ai-template | `node scripts/validate-structure.mjs` | PASS |
| ai-template | `node scripts/validate-enterprise-template.mjs` | PASS |

## Package Scripts

| Repo | Script | Result |
|---|---|---|
| ai-foundation | `pnpm run typecheck` | PASS |
| ai-foundation | `pnpm run lint` | PASS with warnings only |
| ai-foundation | `pnpm run test` | PASS |
| ai-foundation | `pnpm run build` | PASS |
| ai-template | `npm run typecheck` | PASS |
| ai-template | `npm run lint` | PASS |
| ai-template | `npm run test` | PASS |
| ai-template | `npm run build` | PASS |

Notes:

* `ai-knowledge` has no `package.json`; only local Node validators apply.
* CRLF warnings on Windows are non-blocking.
