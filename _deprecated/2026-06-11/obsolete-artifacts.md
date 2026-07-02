# W8-T4 Obsolete Artifacts

Roadmap task: W8-T4 Obsolete Artifacts

This policy defines obsolete artifact handling for deprecated template material
retained after duplicate detection. It does not delete files, move files,
remove runtime assets, or change active template generation, manifests,
validation, runtime, or package manager behavior.

## Obsolete Policy

* Treat obsolete archived material as retained evidence, not active template
  source of truth.
* Keep obsolete artifacts under `_deprecated/2026-06-11/` until a later roadmap
  task explicitly authorizes a physical lifecycle change.
* Prefer active templates, manifests, validation files and `pnpm-lock.yaml`
  whenever archived material overlaps current product surfaces.
* Do not import, execute, promote, delete, or move obsolete artifacts during
  W8-T4.

## Deprecation Model

| Deprecation class | Meaning | Lifecycle action |
|---|---|---|
| `obsolete_package_artifact` | Archived package manager artifact superseded by active `pnpm-lock.yaml`. | Retain as package-manager history. |
| `retained_runtime_evidence` | Historical runtime data or logs retained as evidence only. | Retain as inactive runtime evidence. |
| `retained_source_analysis` | Historical source analysis retained as product history. | Retain as historical analysis. |
| `retained_local_state` | Local editor/worktree state retained for recovery only. | Retain as local recovery history. |

## Lifecycle Rules

| Artifact | Deprecation class | Lifecycle state | Action |
|---|---|---|---|
| `cursor-worktree-state/` | `retained_local_state` | `deprecated_retained` | Retain local recovery history. |
| `runtime-data/` | `retained_runtime_evidence` | `deprecated_retained` | Retain inactive runtime evidence. |
| `runtime-logs/` | `retained_runtime_evidence` | `deprecated_retained` | Retain inactive runtime log evidence. |
| `source-legacy-analysis/` | `retained_source_analysis` | `deprecated_retained` | Retain historical source analysis. |
| `package-lock.json` | `obsolete_package_artifact` | `deprecated_retained` | Retain package-manager history; `pnpm-lock.yaml` remains active. |

## Non-Actions

* No obsolete artifact is deleted.
* No obsolete artifact is moved.
* No runtime deletion or runtime activation is allowed.
* `pnpm-lock.yaml` remains the active package-manager lockfile.
* W8-T5 remains the next eligible task and is not opened by this policy.
