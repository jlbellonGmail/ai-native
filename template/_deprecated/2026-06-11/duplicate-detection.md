# W8-T3 Duplicate Detection

Roadmap task: W8-T3 Duplicate Detection

This report defines duplicate detection rules for deprecated template material
retained after the 2026-06-11 structural realignment. It documents overlap with
active template surfaces without deleting files, moving files, or changing
generators, manifests, validation, runtime, or package manager behavior.

## Duplication Rules

| Rule | Meaning | Action |
|---|---|---|
| `package_manager_duplicate` | Archived package manager artifact is superseded by the active lockfile. | Keep archived copy as historical evidence only. |
| `runtime_evidence_overlap` | Archived runtime data/logs overlap historical runtime evidence but are not active runtime. | Keep archived copy in place. |
| `source_analysis_overlap` | Archived source analysis overlaps historical analysis, not active templates. | Keep archived copy in place. |
| `local_state_only` | Archived local editor/worktree state has no product source-of-truth counterpart. | Keep archived copy in place. |

## Classification Report

| Archive path | Duplicate class | Active/reference surface | Disposition |
|---|---|---|---|
| `cursor-worktree-state/` | `local_state_only` | none | Retain as local recovery history. |
| `runtime-data/` | `runtime_evidence_overlap` | active template runtime is outside `_deprecated` | Retain as runtime evidence only. |
| `runtime-logs/` | `runtime_evidence_overlap` | active template runtime is outside `_deprecated` | Retain as runtime log evidence only. |
| `source-legacy-analysis/` | `source_analysis_overlap` | active templates and manifests | Retain as historical source analysis. |
| `package-lock.json` | `package_manager_duplicate` | `pnpm-lock.yaml` | Retain as package-manager history only. |

## Non-Actions

* No duplicate is deleted.
* No duplicate is moved.
* No archived file is promoted to active source of truth.
* `pnpm-lock.yaml` remains the active package-manager lockfile.
* W8-T4 remains the next eligible task and is not opened by this report.
