# W8-T3 Duplicate Detection

Roadmap task: W8-T3 Duplicate Detection

This report defines duplicate detection rules for deprecated foundation material
retained after the 2026-06-11 structural realignment. It documents overlap
between archived material and active product/governance surfaces without
deleting files, moving files, or changing runtime behavior.

## Duplication Rules

| Rule | Meaning | Action |
|---|---|---|
| `active_surface_overlap` | Archived material describes a capability that has an active product surface. | Keep archived copy for comparison only; active surface remains source of truth. |
| `governance_overlap` | Archived governance material overlaps root governance. | Keep archived copy for audit continuity; root governance remains source of truth. |
| `historical_only` | Archived material has no active counterpart but remains useful history. | Keep archived copy in place. |
| `placeholder_overlap` | Archived placeholders overlap an active or external ownership surface. | Keep archived copy as evidence only. |

## Classification Report

| Archive path | Duplicate class | Active/reference surface | Disposition |
|---|---|---|---|
| `ai-context/` | `historical_only` | none | Retain as recovery context. |
| `antigravity-local-rules/` | `historical_only` | none | Retain as local-rule history. |
| `empty-telemetry-placeholders/` | `placeholder_overlap` | `observability/` | Retain as placeholder evidence only. |
| `legacy-ai-error-system/` | `active_surface_overlap` | `runtime/` | Retain as legacy runtime reference only. |
| `legacy-ai-pipelines/` | `active_surface_overlap` | `.github/workflows/` and active validation scripts | Retain as legacy pipeline reference only. |
| `legacy-ai-roles/` | `active_surface_overlap` | active product/runtime role surfaces | Retain as legacy role reference only. |
| `legacy-ai-runtime/` | `active_surface_overlap` | `runtime/` | Retain as legacy runtime reference only. |
| `legacy-ai-workflows/` | `active_surface_overlap` | `.github/workflows/` | Retain as legacy workflow reference only. |
| `legacy-governance-bundle/` | `governance_overlap` | root `governance/` | Retain for audit continuity only. |
| `legacy-product-scope/` | `governance_overlap` | roadmap and current governance docs | Retain as historical scope reference only. |
| `source-legacy-analysis/` | `historical_only` | none | Retain as historical product analysis. |

## Non-Actions

* No duplicate is deleted.
* No duplicate is moved.
* No archived file is promoted to active source of truth.
* W8-T4 remains the next eligible task and is not opened by this report.
