# W8-T3 Duplicate Detection

Roadmap task: W8-T3 Duplicate Detection

This report defines duplicate detection rules for deprecated knowledge
tool-context material retained after the 2026-06-11 structural realignment. It
documents overlap with active knowledge governance surfaces without deleting
files, moving files, or changing evaluation, registry, dataset, benchmark, or
scoring behavior.

## Duplication Rules

| Rule | Meaning | Action |
|---|---|---|
| `contextual_overlap` | Archived tool context may describe practices now represented by active knowledge assets. | Keep archived copy for recovery comparison only. |
| `historical_only` | Archived material has no active source-of-truth counterpart. | Keep archived copy in place. |

## Classification Report

| Archive path | Duplicate class | Active/reference surface | Disposition |
|---|---|---|---|
| `ai-context/` | `contextual_overlap` | `evaluation/`, `registries/`, `config/` | Retain as recovery context only. |

## Non-Actions

* No duplicate is deleted.
* No duplicate is moved.
* No archived file is promoted to active source of truth.
* W8-T4 remains the next eligible task and is not opened by this report.
