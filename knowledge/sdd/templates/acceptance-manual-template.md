# Acceptance manual — {{slug}}

> Rendered from `specs/{{slug}}/acceptance/plan.json` and `acceptance/validation-contract.json`.
> Do not edit by hand: `ai-native sdd acceptance manual {{slug}}` regenerates it and the parity check
> rejects any divergence. The agent run is the gate input; a human run is optional and is recorded as `manual`.

## Glossary and naming

- **Case**: one acceptance check, identified by its case ID (the same ID the runner reports).
- **AC-n**: an acceptance criterion of the spec; each case cites the criteria it proves.
- **PASS / FAIL**: PASS means the observed behavior matches the expected result. FAIL means it does not.
  A rejection-expecting case PASSES when the system rejects the invalid input.
- **BLOCKED / STALE / NOT_RUN**: the result cannot be trusted (missing, skipped, other revision); they always block.
- **sourceRevision**: the identity of the change the run evaluated (record it in the run log).

## Prerequisites

{{prerequisites}}

## Environment setup

1. Open a terminal at the repository root (a second terminal is needed only when a case starts a service).
2. Use a clean working tree at the revision you are evaluating; record it:
   - PowerShell: `git rev-parse HEAD; $acceptanceGitExit = $LASTEXITCODE; "exit=$acceptanceGitExit"`
   - POSIX sh: `git rev-parse HEAD; acceptance_git_exit=$?; echo "exit=$acceptance_git_exit"`

## Datasets

{{datasets}}

## Cases

{{cases}}

## Restore the environment

{{restore}}

## Run log (manual runs only)

| Operator | Date | sourceRevision | Case | Result |
|---|---|---|---|---|
