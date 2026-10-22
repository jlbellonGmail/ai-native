# SDD Independent Review - Inspector

## Result

INSPECTOR_PASS: PASS (Builder-side Inspector of the authoring session; NOT an independent review)

## Findings

* Scope: only the files listed in `plan.md`. No consumer and no `gi-common-reference` changed. Nothing committed,
  pushed, merged, tagged or released.
* The interrupted session's work was kept and completed, not rewritten: the core judge, the ledger, the Claude
  adapter, the trust-flag refusal and the projection slot were present. Fixed: the import of the removed
  `checkIsolationEvidence` (implement-all, coordinator, tests), which broke the circuit suite; capability `support`,
  which was still taken from the caller; command bodies that still told the agent to pass refused flags;
  `parseReviewerAnswer` stripping `_`, so `REVIEW_NONCE` was never recognized (no real receipt could ever have been
  stored); one receipt per nonce, which a second run overwrote; validation not bound to what the Reviewer saw; the
  `sdd-validate` contract; a stale doc pointer; and the missing SDD record.
* Control plane touched (`contracts/sdd-workflow.json`, schema): the neutral trust-gate and human review apply.
* Validations: real commands with recorded results (`verification.md`). The failures of the first full pass are
  classified, rerun green, and not hidden.
* CRLF line endings were introduced by the Builder's tooling and normalized back to LF before verification
  (`git diff --check` clean).
* Commits: none (instruction). Suggested split in `plan.md`.
* Governance: no task state, roadmap or SESSION-CONTEXT change; no human approval recorded.

## Fix Round: Second Independent Review

INSPECTOR_PASS: PASS (Builder-side; NOT an independent review).

* Scope: H1, M1, L1-L6 and the F7 doc overclaims only; every changed path is in the `plan.md` allowlist. No new
  file; no consumer, governance state, roadmap or SESSION-CONTEXT change. Nothing committed, pushed or released.
* Found during this audit and fixed: the adapter trusted the hook's `agent_type`, so another agent started with the
  reviewer's prompt could pass as the reviewer (predates this round, same class as H1). The delegation's own
  `tool_result` must now name this agent_id (test M9 "impostor", mutation B1 KILLED; the real E2E transcript still
  verifies).
* Behavior change to flag for the human: reviews begun before this round cannot approve; `/sdd-implement-all` must
  pass DELEGATION_PROMPT verbatim (command bodies and the Claude note say so). Not yet exercised by a real Claude run.
* Validations: partial (see `verification.md`, fix round): seven CI groups NOT_RUN after the host's low-memory stop.

## Fix Round: Third Independent Review

INSPECTOR_PASS: PASS (Builder-side; NOT an independent review).

* Scope: A, B and C-G only; changed paths are in the `plan.md` allowlist (adapter, ledger, core `evidenceOf`, two
  command bodies, `review.md`, this record). No consumer, no `gi-common-reference`, no governance state, no roadmap,
  no SESSION-CONTEXT. Nothing committed, pushed or released.
* Root cause A: the adapter took the LAST assistant text of the agent transcript; a resumed agent appends to the
  same transcript, so a follow-up could replace the verdict. Now the policy is explicit and enforced (`readReviewerRun`).
* Root cause B: receipts were keyed by run id (`sha256(runtime, runId)`) with `wx`; the first receipt took the slot.
  Now keyed by content; every candidate is verified on its own.
* Found during this audit and fixed: (1) the core read the evidence fields of a review without evidence from the
  review itself, so `status` listed 7 "evidence lacks" reasons for a placeholder (seen in the real E2E A);
  (2) a verifiable but unrecorded run was labeled NOT_RUN (seen in E2E C before `record`), now NOT_PROVEN with the
  reason, and an unrecorded verifiable adverse run is reported as the independent result; (3) mutant C2 survived the
  first battery: the "mentions" fixture now has a bare `agentId: <this id>` line in the report.
* Behavior change to flag: L3 "one receipt per run" is superseded; replays and aliases are stored as separate
  candidates (they verify to the same transcript, so they cannot change the outcome). A Reviewer continued after an
  APPROVED answer loses that approval.
* The previous `inspector.md` claim "Not yet exercised by a real Claude run" (fix round 2) is outdated: the final
  validation round and this round ran the DELEGATION_PROMPT with real Claude Code 2.1.306 (`verification.md`).

## Residual Risk

See `verification.md` "Residual Risks".

## Closure Recommendation

READY_FOR_INDEPENDENT_REVIEW. An independent reviewer must judge it, outside this authoring session; then the human
decides on commit, PR and version.
