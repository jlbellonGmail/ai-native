# ai-foundation

`ai-foundation` is the product foundation for the AI-native ecosystem. It owns the
runtime primitives, base roles, security controls, observability contracts, CI
security workflows and validation tools used by downstream templates and
knowledge registries.

## Main areas

| Area | Purpose |
|---|---|
| `runtime/` | Core runtime, session, decision and evolution primitives. |
| `roles/` | Base operating roles and agent-facing instructions. |
| `security/` | Auth, rate limiting, supply-chain controls and final security audit manifest. |
| `observability/` | Error handling, logging, retry behavior, tracing and SLI/SLO/error-budget bindings. |
| `config/` | Prompt and runtime configuration inputs consumed by the foundation. |
| `validation/` | Local checks that verify structure and roadmap coverage. |
| `scripts/` | Auditing, validation and setup automation. |
| `docs/` | Architecture, operational and ENTERPRISE-10-10 roadmap mapping. |
| `examples/` | Minimal usage examples for foundation contracts. |
| `_deprecated/` | Recoverable legacy or ambiguous content moved out of the active product surface. |

## Validate

```bash
node scripts/validate-structure.mjs
node scripts/validate-enterprise-10-10.mjs
```

## ENTERPRISE-10-10 coverage

The product mapping is maintained in
`docs/ENTERPRISE-10-10/ROADMAP_TO_FILES.md`. Governance archives are traceability
only; this repository is the implementation surface for Security and
Observability workstreams.
