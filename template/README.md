# ai-template

`ai-template` is the reusable project scaffold for AI-native applications. It
contains generation contracts, template manifests, reference application code,
validation rules and examples that downstream projects can copy or automate.

## Main areas

| Area | Purpose |
|---|---|
| `scaffolds/` | Copyable project skeletons and file contracts. |
| `templates/` | Reusable template assets and ENTERPRISE-10-10 repair templates. |
| `manifests/` | Machine-readable structure and generation manifests. |
| `generators/` | Local generator entry points and generation documentation. |
| `examples/` | Reference application code moved out of root. |
| `validation/` | Tests, validators and roadmap coverage checks. |
| `config/` | Template configuration, AI context and knowledge config. |
| `docs/` | Setup, architecture, overview and roadmap mapping. |
| `_deprecated/` | Recoverable legacy or ambiguous content no longer in active template surface. |

## Validate

```bash
node scripts/validate-enterprise-template.mjs
node scripts/validate-structure.mjs
```

## Use

Start with `scaffolds/ai-native-app/README.md`, then inspect
`manifests/enterprise-10-10-structure.json` to see which files a generated
project is expected to contain.
