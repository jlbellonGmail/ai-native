# ENTERPRISE-10-10 Evaluation Program

This directory repairs W3-T1 through W3-T7 as product assets in `ai-knowledge`.

The JSON program defines prompt and agent evaluation contracts, benchmark suites,
scoring weights, dataset registry entries, report requirements and final audit
checks. It is intentionally small but executable: downstream systems can load it
as a registry instead of depending on governance archive text.

## Validate

Run from `ai-knowledge`:

```bash
node scripts/validate-enterprise-evaluation.mjs
```
