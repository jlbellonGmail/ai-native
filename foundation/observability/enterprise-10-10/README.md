# ENTERPRISE-10-10 Observability Program

This directory repairs W2-T1 through W2-T8 as product assets in `ai-foundation`.

It contains a machine-readable observability program with 10 linked records. Each
record binds one SLI, SLO, error budget, metric, alert policy, dashboard panel and
OpenTelemetry validation contract to a concrete runtime surface.

## Validate

Run from `ai-foundation`:

```bash
node scripts/validate-enterprise-10-10.mjs
```

The validator fails if the program does not contain 10 complete records or if the
W1 final security audit manifest no longer maps every closed security task to a
product path.
