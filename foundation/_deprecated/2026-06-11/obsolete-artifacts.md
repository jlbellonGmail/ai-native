# W8-T4 Obsolete Artifacts

Roadmap task: W8-T4 Obsolete Artifacts

This policy defines obsolete artifact handling for deprecated foundation
material retained after duplicate detection. It does not delete files, move
files, remove runtime assets, or change active product behavior.

## Obsolete Policy

* Treat obsolete archived material as retained evidence, not active product
  source of truth.
* Keep obsolete artifacts under `_deprecated/2026-06-11/` until a later
  roadmap task explicitly authorizes a physical lifecycle change.
* Prefer active product directories and root governance whenever archived
  material overlaps current surfaces.
* Do not import, execute, promote, delete, or move obsolete artifacts during
  W8-T4.

## Deprecation Model

| Deprecation class | Meaning | Lifecycle action |
|---|---|---|
| `retained_history` | Historical material without an active counterpart. | Retain for audit and recovery context. |
| `obsolete_placeholder` | Placeholder material superseded by owned active surfaces. | Retain as placeholder evidence only. |
| `superseded_active_surface` | Legacy runtime, workflow, pipeline, or role material superseded by active product surfaces. | Retain as inactive reference only. |
| `superseded_governance` | Legacy governance or product scope material superseded by root governance. | Retain for audit continuity only. |

## Lifecycle Rules

| Artifact | Deprecation class | Lifecycle state | Action |
|---|---|---|---|
| `ai-context/` | `retained_history` | `deprecated_retained` | Retain recovery context. |
| `antigravity-local-rules/` | `retained_history` | `deprecated_retained` | Retain local-rule history. |
| `empty-telemetry-placeholders/` | `obsolete_placeholder` | `deprecated_retained` | Retain placeholder evidence. |
| `legacy-ai-error-system/` | `superseded_active_surface` | `deprecated_retained` | Retain inactive runtime reference. |
| `legacy-ai-pipelines/` | `superseded_active_surface` | `deprecated_retained` | Retain inactive pipeline reference. |
| `legacy-ai-roles/` | `superseded_active_surface` | `deprecated_retained` | Retain inactive role reference. |
| `legacy-ai-runtime/` | `superseded_active_surface` | `deprecated_retained` | Retain inactive runtime reference. |
| `legacy-ai-workflows/` | `superseded_active_surface` | `deprecated_retained` | Retain inactive workflow reference. |
| `legacy-governance-bundle/` | `superseded_governance` | `deprecated_retained` | Retain governance audit continuity. |
| `legacy-product-scope/` | `superseded_governance` | `deprecated_retained` | Retain historical scope reference. |
| `source-legacy-analysis/` | `retained_history` | `deprecated_retained` | Retain historical analysis. |

## Non-Actions

* No obsolete artifact is deleted.
* No obsolete artifact is moved.
* No runtime deletion or runtime activation is allowed.
* W8-T5 remains the next eligible task and is not opened by this policy.
