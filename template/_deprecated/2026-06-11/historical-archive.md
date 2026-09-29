# W8-T2 Historical Archive

Roadmap task: W8-T2 Historical Archive

This archive policy defines how deprecated template material retained after the
2026-06-11 structural realignment remains available for audit and recovery. It
does not delete files, move files, promote deprecated state, or change active
template generation, validation, manifests, or package manager behavior.

## Archive Policy

* Keep historical material under `_deprecated/2026-06-11/` as a retained
  in-place archive.
* Treat active templates, manifests, validation files, `pnpm-lock.yaml`, and
  root governance as the current source of truth.
* Use archived files only for audit, recovery comparison, and historical
  traceability.
* Do not import, promote, or reference archived files from active generators,
  scaffolds, manifests, validation, runtime, or package installation paths.
* Do not physically delete or move archived files during W8-T2.

## Retention Model

| Archive class | Applies to | Retention | Active use |
|---|---|---|---|
| `recovery_context` | local editor/worktree state | Retain until a later governance task supersedes or removes it. | Not allowed. |
| `runtime_evidence` | historical runtime data and logs | Retain for audit and recovery comparison. | Not allowed. |
| `source_analysis_history` | historical source analysis content | Retain as product history and recovery context. | Not allowed. |
| `package_history` | duplicate package lock artifact | Retain as historical package-manager evidence. | Not allowed. |

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
