# W8-T1 Legacy Inventory

Roadmap task: W8-T1 Legacy Inventory

This inventory describes deprecated foundation material retained after the
2026-06-11 structural realignment. It does not delete files, activate legacy
runtime paths, or change product behavior.

## Classification Model

| Classification | Meaning | Disposition |
|---|---|---|
| `tool_context` | Local AI/tool guidance retained for recovery only. | Retain in `_deprecated`; do not use as active source of truth. |
| `local_rules` | Local workspace rules outside the clean product surface. | Retain for traceability; do not enforce in runtime or CI. |
| `placeholder_surface` | Empty or placeholder observability folders. | Retain as historical evidence; active observability lives outside `_deprecated`. |
| `legacy_runtime` | Old runtime, workflow, role, and error-handling implementation fragments. | Retain for reference; do not import from active code. |
| `legacy_governance` | Pre-realignment governance, prompts, roles, and workflow material. | Retain for audit continuity; root governance remains source of truth. |
| `legacy_product_scope` | Historical product scope notes. | Retain as reference; active roadmap/governance files supersede it. |
| `legacy_source_analysis` | Historical source analysis app surface. | Retain for recovery; do not serve as active application code. |

## Ownership Map

| Inventory path | Owner | Classification |
|---|---|---|
| `ai-context/` | foundation-stewards | `tool_context` |
| `antigravity-local-rules/` | foundation-stewards | `local_rules` |
| `empty-telemetry-placeholders/` | observability-stewards | `placeholder_surface` |
| `legacy-ai-error-system/` | foundation-stewards | `legacy_runtime` |
| `legacy-ai-pipelines/` | foundation-stewards | `legacy_runtime` |
| `legacy-ai-roles/` | foundation-stewards | `legacy_runtime` |
| `legacy-ai-runtime/` | foundation-stewards | `legacy_runtime` |
| `legacy-ai-workflows/` | foundation-stewards | `legacy_runtime` |
| `legacy-governance-bundle/` | governance-stewards | `legacy_governance` |
| `legacy-product-scope/` | product-stewards | `legacy_product_scope` |
| `source-legacy-analysis/` | foundation-stewards | `legacy_source_analysis` |

## Rules

* Do not import or execute files from `_deprecated/2026-06-11/` in active
  runtime, validation, or CI paths.
* Do not delete legacy files during W8-T1.
* Treat ambiguous legacy material as retained until a later roadmap task defines
  archive, duplicate, obsolete-artifact, or reference-validation handling.
* W8-T2 remains the next eligible task and is not opened by this inventory.
