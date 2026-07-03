# HARDENING-V1.1 H5 - Real Evaluation Runs Plan

## Change Strategy

Implement the minimum local evaluation execution baseline in `ai-knowledge`.
The runner will use existing benchmark, dataset and scoring contracts and write
a deterministic score report under `evaluation/runs/`.

## Repository Scope

* `ai-knowledge`: product implementation, docs, validator and score report.
* root/governance: SDD artifacts and closure evidence after validation.
* `ai-foundation`: evaluated, no changes planned.
* `ai-template`: evaluated, no changes planned.

## Files Allowed To Change

* `ai-knowledge/evaluation/README.md`
* `ai-knowledge/evaluation/runs/**`
* `ai-knowledge/quality-gates/enterprise-10-10-gates.json`
* `ai-knowledge/quality-gates/README.md`
* `ai-knowledge/scripts/run-evaluation.mjs`
* `ai-knowledge/scripts/validate-real-evaluation-runs.mjs`
* `specs/hardening-v1.1-h5-real-evaluation-runs/**`
* `governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md`
* `governance/SESSION-CONTEXT.md`
* `governance/execution/current/**`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H5/**`

## Validators To Run

* ai-knowledge H5 runner and validator.
* Existing ai-knowledge evaluation, structure and SDD validators.
* Root governance/spec diff checks.
* Final git status and diff checks per factory repository.

## Governance Update Strategy

After product validation passes, archive H5 evidence, update roadmap/session,
replace current execution snapshot with H5 state, and leave H6 not opened.

## Commit Strategy

* Commit `ai-knowledge` product changes separately.
* Commit root/governance specs and closure evidence separately.
* Do not push.

## Recovery Considerations

If validation fails, do not commit or close H5. Keep H6 not opened and report the
blocking validation with command evidence.
