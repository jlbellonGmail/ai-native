# W8-T1 Legacy Inventory

Roadmap task: W8-T1 Legacy Inventory

This inventory describes deprecated template material retained after the
2026-06-11 structural realignment. It does not delete files, promote deprecated
state, or change active template generation and validation behavior.

## Classification Model

| Classification | Meaning | Disposition |
|---|---|---|
| `local_worktree_state` | Local editor/worktree state retained for recovery only. | Retain in `_deprecated`; do not use in generated templates. |
| `runtime_state` | Historical runtime data and logs retained as evidence. | Retain for reference; do not load in active runtime. |
| `legacy_source_analysis` | Historical source analysis knowledge and Supabase fragments. | Retain for future archive review; W8-T2 remains open. |
| `duplicate_package_lock` | Package manager artifact superseded by `pnpm-lock.yaml`. | Retain as obsolete evidence; do not use for installs. |

## Ownership Map

| Inventory path | Owner | Classification |
|---|---|---|
| `cursor-worktree-state/` | template-stewards | `local_worktree_state` |
| `runtime-data/` | template-stewards | `runtime_state` |
| `runtime-logs/` | template-stewards | `runtime_state` |
| `source-legacy-analysis/` | template-stewards | `legacy_source_analysis` |
| `package-lock.json` | template-stewards | `duplicate_package_lock` |

## Rules

* Do not use files from `_deprecated/2026-06-11/` in generators, scaffolds,
  manifests, validation, or package installation.
* Do not delete legacy files during W8-T1.
* `source-legacy-analysis/` is identified by this inventory only; W8-T2 remains
  the future task for historical archive policy and retention model.
* W8-T2 remains the next eligible task and is not opened by this inventory.
