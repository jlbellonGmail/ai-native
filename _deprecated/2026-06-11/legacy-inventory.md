# W8-T1 Legacy Inventory

Roadmap task: W8-T1 Legacy Inventory

This inventory describes deprecated knowledge material retained after the
2026-06-11 structural realignment. It does not delete files, promote deprecated
tool context, or change active evaluation, prompt registry, or agent registry
assets.

## Classification Model

| Classification | Meaning | Disposition |
|---|---|---|
| `tool_context` | Local AI/tool guidance retained for recovery only. | Retain in `_deprecated`; do not use as active registry or evaluation source. |

## Ownership Map

| Inventory path | Owner | Classification |
|---|---|---|
| `ai-context/` | knowledge-stewards | `tool_context` |

## Rules

* Do not use `_deprecated/2026-06-11/ai-context/` as source of truth for
  benchmarks, datasets, scoring, prompt registry, agent registry, or quality
  gates.
* Do not delete legacy files during W8-T1.
* Treat ambiguous legacy material as retained until a later roadmap task defines
  archive, duplicate, obsolete-artifact, or reference-validation handling.
* W8-T2 remains the next eligible task and is not opened by this inventory.
