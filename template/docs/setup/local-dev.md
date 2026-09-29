# Local Development

Use the template from the repository root after dependencies are installed.

```bash
pnpm install
pnpm run validate
pnpm test
```

## Expected local surfaces

| Path | Purpose |
|---|---|
| `config/` | AI, prompt and knowledge configuration copied into generated projects. |
| `scaffolds/ai-native-app/` | Starting scaffold for a new application. |
| `templates/enterprise-10-10/` | ENTERPRISE-10-10 reusable repair manifest. |
| `validation/` | Tests, strategy and roadmap coverage checks. |

Local runtime outputs such as `.next/`, `.env.local`, `.ai-runtime-data/` and
`logs/` are intentionally ignored and must not be committed as product assets.
