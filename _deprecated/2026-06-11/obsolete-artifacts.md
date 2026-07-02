# W8-T4 Obsolete Artifacts

Roadmap task: W8-T4 Obsolete Artifacts

This policy defines obsolete artifact handling for deprecated knowledge
tool-context material retained after duplicate detection. It does not delete
files, move files, remove runtime assets, or change active knowledge behavior.

## Obsolete Policy

* Treat obsolete archived context as retained evidence, not active knowledge
  source of truth.
* Keep obsolete artifacts under `_deprecated/2026-06-11/` until a later roadmap
  task explicitly authorizes a physical lifecycle change.
* Prefer active evaluation, registry, scoring, benchmark, dataset and config
  surfaces whenever archived material overlaps current knowledge assets.
* Do not import, promote, delete, or move obsolete artifacts during W8-T4.

## Deprecation Model

| Deprecation class | Meaning | Lifecycle action |
|---|---|---|
| `superseded_context` | Deprecated tool context overlaps active knowledge governance surfaces. | Retain for recovery comparison only. |

## Lifecycle Rules

| Artifact | Deprecation class | Lifecycle state | Action |
|---|---|---|---|
| `ai-context/` | `superseded_context` | `deprecated_retained` | Retain recovery context. |

## Non-Actions

* No obsolete artifact is deleted.
* No obsolete artifact is moved.
* No archived file is promoted to active source of truth.
* W8-T5 remains the next eligible task and is not opened by this policy.
