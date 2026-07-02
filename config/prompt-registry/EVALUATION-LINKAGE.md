# Prompt Registry Evaluation Linkage

W4-T5 defines how prompt registry entries link to ENTERPRISE-10-10 evaluation
assets.

This task closes the linkage contract, evaluation binding and traceability model
for prompt evaluation readiness. It does not execute evaluations, create
pipelines, produce score reports or approve prompts for activation.

## Contract Files

| File | Purpose |
|---|---|
| `evaluation-linkage.json` | Machine-readable W4-T5 linkage contract. |
| `../evaluation-policy.json` | Evaluation evidence and threshold policy used by the linkage. |
| `../../evaluation/enterprise-10-10/evaluation-program.json` | Evaluation program with prompt registry linkage metadata. |
| `../../scripts/validate-prompt-registry-evaluation-linkage.mjs` | Local validation for W4-T5 linkage integrity. |

## Binding Rules

Every prompt evaluation linkage must bind:

| Field | Rule |
|---|---|
| `promptId` | Must exist in the prompt registry schema example, storage, versioning and ownership contracts. |
| `promptVersion` | Must exist in the versioning contract. |
| `storageSlot` | Must match the major version storage slot for the prompt version. |
| `evaluationSuite` | Must match the prompt registry entry evaluation suite. |
| `benchmarkId` | Must reference a prompt benchmark. |
| `datasetId` | Must reference the benchmark dataset. |
| `scoringModel` | Must reference the configured rubric. |
| `minimumScore` | Must match the prompt benchmark and entry evaluation suite threshold. |
| `ownerTeam` | Must match the prompt ownership record. |

## Non-Goals

W4-T5 does not create runtime evaluation pipelines, evaluation run results,
prompt activation approval or W4-T6 audit closure.

Changes to prompt evaluation linkage require review of this document,
`evaluation-linkage.json`, `evaluation-program.json`, `evaluation-policy.json`
and `scripts/validate-prompt-registry-evaluation-linkage.mjs`.
