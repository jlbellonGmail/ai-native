# Deprecation Index

| Path | Reason | Replacement |
|---|---|---|
| `cursor-worktree-state/` | Local editor state. | none |
| `source-legacy-analysis/` | Historical source analysis, not active template product. | `examples/reference-app/`, `docs/` |
| `package-lock.json` | Duplicate package manager lock; `pnpm-lock.yaml` is active. | `pnpm-lock.yaml` |
| `runtime-logs/` | Local runtime output, not template source. | generated at runtime |
| `runtime-data/` | Local runtime state, not template source. | generated at runtime |
