# W8-T2 Historical Archive

Roadmap task: W8-T2 Historical Archive

This archive policy defines how deprecated foundation material retained after
the 2026-06-11 structural realignment remains available for audit and recovery.
It does not delete files, move files, activate legacy runtime paths, or change
product behavior.

## Archive Policy

* Keep historical material under `_deprecated/2026-06-11/` as a retained
  in-place archive.
* Treat root governance, active product directories and active validation
  scripts as the current source of truth.
* Use archived files only for audit, recovery comparison, and historical
  traceability.
* Do not import, execute, promote, or reference archived files from active
  runtime, workflow, validation, observability, or CI paths.
* Do not physically delete or move archived files during W8-T2.

## Retention Model

| Archive class | Applies to | Retention | Active use |
|---|---|---|---|
| `recovery_context` | tool context and local rules | Retain until a later governance task supersedes or removes it. | Not allowed. |
| `audit_evidence` | placeholder surfaces and legacy governance bundles | Retain for audit continuity. | Not allowed. |
| `runtime_reference` | legacy runtime, pipeline, role, workflow and error fragments | Retain for reference and comparison only. | Not allowed. |
| `product_history` | product scope notes and historical source analysis | Retain as historical product context. | Not allowed. |

## Archival Contract

The machine-readable archival contract is stored at:

`historical-archive.contract.json`

The contract records archive entries, retention classes, non-deletion
guardrails, active-use restrictions, and roadmap continuity from W8-T2 to
W8-T3.

## Continuity

W8-T3 remains the next eligible task. W8-T2 does not open or close W8-T3, does
not classify duplicates, does not mark obsolete artifacts for deletion, and
does not validate active references.
