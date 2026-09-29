# ENTERPRISE-10-10 Security Audit Product Manifest

This directory repairs W1-T7 as a product-side audit manifest. W1-T1 through
W1-T6 already introduced real workflows and security configuration in
`ai-foundation`; W1-T7 now has a repo-local manifest that maps the final audit to
those product controls.

## Validate

Run from `ai-foundation`:

```bash
node scripts/validate-enterprise-10-10.mjs
```
