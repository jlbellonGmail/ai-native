# REPAIR PLAN

Objective: apply real product changes for closed ENTERPRISE-10-10 tasks that were previously closed with governance-only evidence.

## Product repair mapping

| Repair area | Tasks | Repo | Deliverable |
|---|---|---|---|
| Security final audit | W1-T7 | ai-foundation | Product-side security audit manifest plus validation |
| Observability program | W2-T1 to W2-T8 | ai-foundation | 10 linked SLI/SLO/error budget/metric/alert/dashboard/OpenTelemetry records plus README and validator |
| Evaluation program | W3-T1 to W3-T7 | ai-knowledge | Prompt and agent evaluation schemas, benchmark suites, scoring model, dataset registry, report template and audit checks plus README and validator |
| Reusable repair scaffold | W1-T7, W2, W3 | ai-template | Template manifest for applying these repairs in future repos plus README and validator |

## Non-destructive cleanup rule

No files are deleted in this repair because the detected temporary files, empty directories and legacy artifacts are pre-existing and may be structural placeholders or user-owned output. They are recorded in validation instead of removed.

## Commit strategy note

The root repository ignores `ai-foundation/`, `ai-knowledge/` and `ai-template/` because they are independent nested Git repositories. The requested single root commit cannot capture product files unless that repository model changes. This repair still creates real filesystem and nested-repo diffs in the target repos.
