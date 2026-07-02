# W8-T2 Historical Archive

Roadmap task: W8-T2 Historical Archive

This archive policy defines how deprecated knowledge tool-context material
retained after the 2026-06-11 structural realignment remains available for
audit and recovery. It does not delete files, move files, promote deprecated
tool context, or change active evaluation, registry, dataset, benchmark, or
scoring behavior.

## Archive Policy

* Keep historical material under `_deprecated/2026-06-11/` as a retained
  in-place archive.
* Treat active knowledge directories, registries, evaluation assets and root
  governance as the current source of truth.
* Use archived files only for audit, recovery comparison, and historical
  traceability.
* Do not import, promote, or reference archived files from active prompt
  registry, agent registry, benchmark, dataset, scoring, evaluation, or quality
  gate paths.
* Do not physically delete or move archived files during W8-T2.

## Retention Model

| Archive class | Applies to | Retention | Active use |
|---|---|---|---|
| `recovery_context` | deprecated AI/tool context | Retain until a later governance task supersedes or removes it. | Not allowed. |

## Archival Contract

The machine-readable archival contract is stored at:

`historical-archive.contract.json`

The contract records archive entries, retention class, non-deletion guardrails,
active-use restrictions, and roadmap continuity from W8-T2 to W8-T3.

## Continuity

W8-T3 remains the next eligible task. W8-T2 does not open or close W8-T3, does
not classify duplicates, does not mark obsolete artifacts for deletion, and
does not validate active references.
