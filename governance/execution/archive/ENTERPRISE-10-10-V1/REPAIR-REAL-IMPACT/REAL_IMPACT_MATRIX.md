# REAL IMPACT MATRIX

Audit date: 2026-06-11

Scope: closed tasks W1-T1 through W3-T7.

Baseline commands:

```text
git diff --name-status 022d16b..HEAD -- ai-foundation ai-knowledge ai-template
git log --oneline -- ai-foundation ai-knowledge ai-template
git log --name-status --oneline -- governance/execution/archive/ENTERPRISE-10-10-V1/
```

Result: the root repository has no tracked product diff for the three target repos because they are independent nested Git repositories and ignored by root `.gitignore`. Product impact was therefore audited inside the target repositories and by filesystem diff after repair.

| Task | Declared objective | Expected repo impact | Actual repo impact | Governance files | Status | Repair action |
|---|---|---|---|---|---|---|
| W1-T1 | CodeQL | ai-foundation | PRODUCTIVE_CHANGE in ai-foundation commit `6181216`: CodeQL, lint/security workflows, TS baseline, runtime/security files | W1-T1 archive missing in ENTERPRISE-10-10-V1 | PRODUCTIVE_CHANGE | No repair required |
| W1-T2 | Trivy | ai-foundation | PRODUCTIVE_CHANGE in ai-foundation commit `01aabd3`: `.github/workflows/trivy.yml` | W1-T2 archive present, governance commit `e2f421b` | PRODUCTIVE_CHANGE | No repair required |
| W1-T3 | SBOM | ai-foundation | PRODUCTIVE_CHANGE in ai-foundation commit `01aabd3`: `.github/workflows/sbom.yml` | W1-T3 archive present, governance commit `d1120a1` | PRODUCTIVE_CHANGE | No repair required |
| W1-T4 | Dependency Review | ai-foundation | PRODUCTIVE_CHANGE in ai-foundation commit `82e5428`: dependency review workflow/config | W1-T4 archive present, governance commit `3783278` | PRODUCTIVE_CHANGE | No repair required |
| W1-T5 | Dependabot | ai-foundation | PRODUCTIVE_CHANGE in ai-foundation commit `5ac2de9`: `.github/dependabot.yml` | W1-T5 archive present, governance commit `3783278` | PRODUCTIVE_CHANGE | No repair required |
| W1-T6 | Supply Chain Security | ai-foundation | PRODUCTIVE_CHANGE in ai-foundation commits `ca582a5`, `76241b2`, `532fc16`: attestation workflow and docs | W1-T6 archive present, governance commit `2ad4610` | PRODUCTIVE_CHANGE | No repair required |
| W1-T7 | Security Audit Final | ai-foundation | Governance closure stated no product changes | W1-T7 archive present, governance commit `f807b63` | NEEDS_REPAIR | Added `ai-foundation/security/enterprise-10-10/security-audit-final.json`, README, and validator coverage |
| W2-T1 | SLI Definition | ai-foundation | Governance-only closure stated no product changes | W2-T1 archive present, governance commit `117a612` | NEEDS_REPAIR | Added SLI records in `ai-foundation/observability/enterprise-10-10/observability-program.json` |
| W2-T2 | SLO Definition | ai-foundation | Governance-only closure stated no product changes | W2-T2 archive present, governance commit `32f60e2` | NEEDS_REPAIR | Added SLO records in observability program |
| W2-T3 | Error Budgets | ai-foundation | Governance-only closure stated no product changes | W2-T3 archive present, governance commit `6155cd0` | NEEDS_REPAIR | Added error budget records in observability program |
| W2-T4 | Metrics Catalog | ai-foundation | Governance-only closure stated no collectors/queries/product changes | W2-T4 archive present, governance commit `109869b` | NEEDS_REPAIR | Added metric catalog records in observability program |
| W2-T5 | Alerting | ai-foundation | Governance-only closure stated no runtime rules/product changes | W2-T5 archive present, governance commit `cb8f060` | NEEDS_REPAIR | Added alert policy records in observability program |
| W2-T6 | Dashboards | ai-foundation | Governance-only closure stated no dashboards runtime/product changes | W2-T6 archive present, governance commit `ec2eb75` | NEEDS_REPAIR | Added dashboard panel records in observability program |
| W2-T7 | OpenTelemetry Validation | ai-foundation | Governance-only closure stated no OTel installation/instrumentation/runtime config | W2-T7 archive present, governance commit `66c86c5` | NEEDS_REPAIR | Added OTel validation bindings in observability program |
| W2-T8 | Observability Audit Final | ai-foundation | Governance-only closure stated no observability runtime/product changes | W2-T8 archive present, governance commit `bf67204` | NEEDS_REPAIR | Added repo-local README and validator for the W2 program |
| W3-T1 | Prompt Evaluation Framework | ai-knowledge | Governance-only closure stated no product changes | W3-T1 archive present, governance commit `8994c43` | NEEDS_REPAIR | Added prompt evaluation schema/dimensions in `ai-knowledge/evaluations/enterprise-10-10/evaluation-program.json` |
| W3-T2 | Agent Evaluation Framework | ai-knowledge | Governance-only closure stated no runtime/product changes | W3-T2 archive present, governance commit `022d16b` | NEEDS_REPAIR | Added agent evaluation inputs/outputs/states in evaluation program |
| W3-T3 | Benchmark Framework | ai-knowledge | Governance-only closure stated no benchmark runs/datasets/scores | W3-T3 archive present, governance commit `581dfaa` | NEEDS_REPAIR | Added benchmark suites linked to dataset registry |
| W3-T4 | Score Framework | ai-knowledge | Governance-only closure stated no scores/pipelines | W3-T4 archive present, governance commit `898c0d9` | NEEDS_REPAIR | Added weighted scoring model and thresholds |
| W3-T5 | Datasets | ai-knowledge | Governance-only closure stated no datasets created/loaded | W3-T5 archive present, governance commit `8d4c34c` | NEEDS_REPAIR | Added dataset registry with synthetic dataset paths |
| W3-T6 | Evaluation Reports | ai-knowledge | Governance-only closure stated no runtime reports/pipelines | W3-T6 archive present, governance commit `9799055` | NEEDS_REPAIR | Added report schema required sections |
| W3-T7 | Evaluation Audit Final | ai-knowledge, ai-template | Governance-only closure stated no product changes | W3-T7 archive present, governance commit `cd0391a` | NEEDS_REPAIR | Added W3 audit checks plus reusable repair template manifest in ai-template |

Final classification after this repair:

* PRODUCTIVE_CHANGE: W1-T1 through W1-T6.
* NEEDS_REPAIR repaired in this execution: W1-T7, W2-T1 through W2-T8, W3-T1 through W3-T7.
* GOVERNANCE_ONLY historical closures remain documented as historical state, not as current product state.
* INVALID_CLOSURE applies to closures that claimed complete enterprise impact without target repo diff; they are superseded by this repair archive.
