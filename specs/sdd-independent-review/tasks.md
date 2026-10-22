# SDD Independent Review - Tasks

## Specify

* [x] Reconstruct the interrupted session's state from the worktree (diff, new files, failing imports).
* [x] Problem, root cause, capability model, runtime evidence, requirements RF-1..RF-12 (`spec.md`).

## Plan

* [x] Allowed files, validators, governance and commit strategy (`plan.md`).

## Implement

* [x] F1 core: capability support read from `core/agents.json`; `checkReviewEvidence` in implement-all and coordinator.
* [x] F1 ledger: receipts per run (never overwritten), packet with validation runs, re-attestation in `status`.
* [x] F1 adapter: hook input fields as documented; packet read, no dictated verdict; underscore parsing bug fixed.
* [x] F2: attested adverse runs and ledger lines of the current revision withdraw an approval.
* [x] F3: Claude mechanics only in `runtime/adapters/claude-review.mjs`; command bodies use a slot.
* [x] F4: `sdd-validate` coordinator, `readOnly: false`, `writes: review-state`; schema and validator rules.
* [x] F5: execution allowlist per runtime, tested on the real `core/agents.json`.
* [x] F6: Claude projection states that the slash command is the request to delegate.
* [x] F7: this record; threat model in `security.md` and `knowledge/sdd/methodology/review.md`.

## Verify

* [x] Mutation run and full battery (`verification.md`).
* [x] E2E Claude with a real reviewer and E2E fallback (`verification.md`).

## Inspect

* [x] Builder-side Inspector audit (`inspector.md`). Not an independent review.

## Fix round: second independent review (CHANGES_REQUIRED)

* [x] H1: verdict, nonce and revision taken from the reviewer's final answer in its transcript, never from the hook
  input; the receipt is filed under the nonce of the run's delegation, so an answer without the nonce is kept; a real
  reviewer run that cannot approve counts as adverse (its verdict, or NEEDS_HUMAN_DECISION when unreadable).
* [x] M1: `sdd review begin` issues the DELEGATION_PROMPT; the adapter accepts only a delegation that is exactly it.
* [x] L1: `implementAll` derives DONE through `deriveReviewOutcome` with every review of the loop (F2 in process).
* [x] L2: tests for the surviving mutants R1 (H1 tests), R6, R7, R12, R18, R19.
* [x] L3: one receipt per run (`agent-<id>` and `<id>` are the same run).
* [x] L4: `--flag=value` refused.
* [x] L5: an empty change cannot begin a review; `status` prints BASE.
* [x] L6: validation output fenced as data; the packet asks the Reviewer to judge the commands.
* [x] F7 docs: threat model and `security.md` reworded to what is enforced, with the remaining limits.

## Fix round: third independent review (CHANGES_REQUIRED)

* [x] A (HIGH): transcript policy in the Claude adapter (`readReviewerRun`): a follow-up message or a second answer
  invalidates the run for approval; the run's verdict is its most adverse answer (RF-14).
* [x] B (MEDIUM): receipts keyed by content; every receipt verified on its own; `record` takes the most adverse
  verifiable run (RF-15). Supersedes L3 "one receipt per run": an alias or replay is a separate candidate that
  verifies to the same transcript, so it cannot change the outcome.
* [x] C: the run is the harness's own `agentId: <id>` line of the delegation result, never a substring.
* [x] D: the validation command text is fenced as data like its output.
* [x] E: NOT_PROVEN when a receipt of the revision exists but proves nothing (RF-16).
* [x] F: tests for the canonical verdict position (mutant X1).
* [x] G: `--base` documented as inherited debt (narrower base covers less; local status does not prove the whole
  change was reviewed); BASE printed in `status` and kept in the ledger.

## Close

* [ ] Independent review of this change (human-requested, external to the authoring session).
* [ ] Human decision on commit, PR and version.
