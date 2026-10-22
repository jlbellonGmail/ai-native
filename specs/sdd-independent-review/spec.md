# SDD Independent Review - Runtime-Attested Review Spec

Related Governance Task: none in the active roadmap. Requested explicitly by the human (2026-10-20) after the
Independent Review findings F1-F7 of the branch `feature/sdd-independent-review`. This folder is the formal SDD
record that finding F7 asked for.
Related Roadmap: governance/roadmaps/AI-NATIVE-V3-ROADMAP.md (no task id; post-v3.3.1 platform change)
Status: IMPLEMENTED_UNCOMMITTED / third fix round done (A, B, C-G) / READY_FOR_INDEPENDENT_REVIEW
Control plane: yes (`contracts/**`): neutral trust-gate and human review apply (`governance/gates/gates.json`).
Created: 2026-10-20

## Problem

`/sdd-implement-all 001-locales` in a consumer ended with `VERDICT: APPROVED` written by the same agent that
implemented the change: the review was a self-review presented as independent (`evaluation/compat/findings.md`,
C6b). A first fix separated validation, self-review and independent review, but the Independent Review of that fix
found that the authoring session could still produce `INDEPENDENT_REVIEW: PASS` / `FINAL_REVIEW_STATUS: APPROVED`
with flags (`--kind independent --agent reviewer --execution delegated-fresh-context --validation PASS`) or with a
hand-written line in `specs/<slug>/reviews.jsonl` (F1), that a later adverse review did not withdraw an approval
(F2), that Claude mechanics leaked into the core (F3), that `sdd-validate` was declared read-only while it writes
(F4), that execution classes were not allowlisted per runtime (F5), that the Claude projection did not say that the
slash command is the request to delegate (F6), and that a control-plane change had no SDD record (F7).

## Root Cause

Independence was a declaration, not evidence. The platform trusted what the caller said about runtime, agent,
execution and validation, and treated the ledger as authority. A defined `reviewer` role was conflated with the
runtime being able to run it isolated.

## Objective

An independent review counts only when it is runtime-attested: the runtime that ran the Reviewer leaves a record,
its adapter verifies it against the runtime's own store, and the runtime-neutral core judges it. Everything else
fails closed.

## Capability Model

* `core/agents.json` `runtimes.<tool>`: `independentReview` (verified|unverified|unsupported), `evidence`,
  `executions` (`delegated-fresh-context`, `separate-process`: verified|unverified|unavailable). Validated by
  `core/validate-core.mjs`. Claude: verified, `delegated-fresh-context` only. Codex, OpenCode: unverified, none.
* Session capability (`resolveReviewCapability`): reviewer defined + runtime support read from `runtimes` (never
  from the caller) + agent delegation and context isolation observed by the session. Unknown is unavailable.
* Attesters (`runtime/adapters/review-evidence.mjs`): a runtime without one can never be independent.

## Runtime Evidence

`ReviewEvidence { runtime, agent, execution, isolation, reviewId, reviewedRevision, verdict, attestation }`,
produced only by an adapter. Claude: the projected `SubagentStop` hook (`matcher: reviewer`) hands the documented
hook input (`session_id`, `transcript_path`, `agent_id`, `agent_type`, `agent_transcript_path`,
`last_assistant_message`) to `sdd review receipt claude`; the hook input only says where to look.
`verifyClaudeReceipt` checks the transcript store (delegation to `subagent_type: reviewer` that is exactly the
prompt `sdd review begin` issued, fresh context, packet read, read-only tools) and takes verdict, nonce and revision
from the reviewer's final answer as the transcript recorded it.

## Requirements

* RF-1 Fail-closed trust invariant: `INDEPENDENT_REVIEW: PASS` only with valid runtime evidence + reviewer agent +
  verified runtime + allowed execution + isolation + correlated review (nonce) + correlated revision + valid
  validation + not stale. Missing anything: `FINAL_REVIEW_STATUS != APPROVED`, `HUMAN_GATE: required`.
* RF-2 The ledger is a log: `status` re-attests every line; a hand-written line never approves.
* RF-3 Caller flags for agent, execution, isolation, validation and invocation are refused.
* RF-4 Validation is what `sdd review validate` ran on the revision; an approval covers only the runs shown to the
  Reviewer in its packet.
* RF-5 Stale review: any change in scope changes the revision; an older approval is `STALE`.
* RF-6 Re-review (F2): an adverse review of the current revision (self or independent, recorded or only captured,
  verifiable or not) withdraws an approval until fix -> validation -> new independent review, in the ledger and in
  the in-process loop. Runs are never overwritten; a real run with no readable verdict is NEEDS_HUMAN_DECISION.
* RF-14 Immutable review run (third independent review, A): the transcript policy of a run is the delegation prompt,
  then only the reviewer's own tool calls and their results, then exactly one final answer. A message sent to the
  reviewer after its delegation (SendMessage, resume, a second prompt) or a second final answer makes the run unable
  to approve (`INDEPENDENT_REVIEW` never PASS from it); any adverse answer the run gave is the run's verdict and
  counts as adverse. "Last message wins" is never the rule.
* RF-15 Receipt selection (B): receipts are candidates keyed by content, never one slot per run; each is verified on
  its own against the runtime's store. An invalid receipt can never keep a verifiable one out; `record` takes the
  most adverse verifiable run of the review, and any verifiable adverse run of the revision dominates approvals.
* RF-16 Status vocabulary (E): `INDEPENDENT_REVIEW: NOT_PROVEN` when receipts of the current revision exist but
  prove no recorded review; `NOT_RUN` only when there is no receipt and no independent record. Decisions unchanged.
* RF-13 The delegation prompt is the platform's (`sdd review begin` DELEGATION_PROMPT); the author cannot shape it.
* RF-7 Runtime agnosticism (F3): no Claude mechanics in `core/`, `contracts/`, `runtime/circuit`, `knowledge/`.
* RF-8 Least privilege (F4): `sdd-validate` is `role: coordinator`, `readOnly: false`, `writes: review-state`.
* RF-9 Execution allowlist (F5) per runtime; Codex/OpenCode none.
* RF-10 Claude projection (F6): `/sdd-implement-all <NNN-slug>` is the user's request to delegate the review.
* RF-11 HITL: only an attested independent approval reports the policy gate; never lower than the policy.
* RF-12 Fallback: without capability `IMPLEMENTATION: PASS`, `VALIDATION: PASS`, `SELF_REVIEW: PASS`,
  `INDEPENDENT_REVIEW: UNAVAILABLE`, `FINAL_REVIEW_STATUS: REVIEW_PENDING`, `HUMAN_GATE: required`.

## Non-Goals

* Cryptographic proof against a local user with full filesystem or runtime access (threat model: `security.md`).
* Supporting Codex or OpenCode independent review (no verified evidence).
* Merging the hook into an existing consumer `.claude/settings.json` (adoption keeps collisions for the human).
* Commit, push, PR, merge, tag or release; changes to consumers or `gi-common-reference`.

## Acceptance Criteria

* Every mutation of `verification.md` breaks at least one test.
* E2E with a real Claude Code reviewer and E2E fallback in disposable consumers.
* Full AI-NATIVE battery green, flakes classified.

## Risks

See `security.md` (threat model) and `verification.md` (residual risks).
