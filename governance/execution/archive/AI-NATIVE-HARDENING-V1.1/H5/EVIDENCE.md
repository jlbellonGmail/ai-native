# EVIDENCE

## Product commit

`ai-knowledge`: `cba745a`

## Evaluation run evidence

Run command:

```bash
node scripts/run-evaluation.mjs --benchmark bench-prompt-grounding
```

Output summary:

```text
evaluation run PASS bench-prompt-grounding score=1.00 output=evaluation/runs/enterprise-10-10/bench-prompt-grounding-controlled/score-report.json
```

Machine-readable report:

```text
ai-knowledge/evaluation/runs/enterprise-10-10/bench-prompt-grounding-controlled/score-report.json
```

Report facts:

* `schemaVersion`: `evaluation-run-report.v1`
* `roadmapTask`: `AI-NATIVE-HARDENING-V1.1/H5`
* `runType`: `controlled-fixture`
* `benchmarkId`: `bench-prompt-grounding`
* `dataset`: `datasets/synthetic/grounded-qa.jsonl`
* `scoringModel`: `weighted-rubric-v1`
* `totalScore`: `1`
* `decision`: `PASS`

## Evidence policy

The report cites:

* dataset
* benchmark
* rubric
* quality gates
* runner command
* validator command

Forbidden as sole evidence:

* governance archive
* summary markdown
* unchecked JSON

## Scope safety evidence

* No H1, H2, H3 or H4 files were reopened for implementation.
* No H6 implementation files were created.
* No external service, secret, remote CI, push or PR was used.
* No dependency additions were made.
* No VERSION files were modified.
* `ai-template/templates/project/` impact was evaluated as NOT_APPLICABLE.

## HITL approval

Human approval was granted on 2026-07-03 for formal H5 closure.

Confirmed approval scope:

* root/governance local closure: `20b8cd9`
* `ai-knowledge`: `cba745a`
* `ai-foundation`: no H5 changes
* `ai-template`: no H5 changes
* H6 remains not opened.
