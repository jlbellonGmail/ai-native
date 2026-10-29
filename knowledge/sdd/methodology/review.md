# Review

The Reviewer is independent and read-only. It starts from artifacts and the diff, not from the implementer's conversation, and judges: goal, spec, plan, tasks, acceptance, tests, contracts, portability, compatibility, documentation.

Verdict first line: `VERDICT: APPROVED` or `VERDICT: CHANGES_REQUESTED`. Findings carry `file:line`, severity and the violated task/requirement/principle.

| Severity | Meaning | Gate |
|---|---|---|
| CRITICAL | data loss, security hole, broken contract | must fix |
| HIGH | requirement not met, regression | must fix |
| MEDIUM | real weakness, not blocking | fix when reasonable |
| LOW | polish | document as residual |

Convergence loop: `review -> finding -> Implementer fix -> test -> re-review`, to 0 CRITICAL and 0 HIGH, bounded by the level budget; repeated identical findings (no progress) stop the loop (`decideConvergence`). The Reviewer never edits code. The Builder-then-Inspector pairing of `AGENTS.md` is this same Implementer/Reviewer split.

## Validation, self-review and independent review are different results

| Result | What it is | Can it approve? |
|---|---|---|
| validation | commands: tests, lint, typecheck, architecture, `sdd validate` | no: PASS is evidence |
| self-review | the author's own review, even with fresh eyes on the artifacts | no |
| independent review | the `reviewer` run in a context isolated from the author | yes, for the revision it judged |

Independence is a runtime capability, not a file: a `reviewer` role being defined (or projected as an agent file) does not mean the runtime can run it isolated. It is available only when the platform has verified it for the runtime (`core/agents.json`, `runtimes`; evidence in `evaluation/compat`) and the session can actually delegate with a fresh context. Otherwise it is **unavailable**: the work continues to validation and a self-review, the result is `REVIEW_PENDING`, and the human gate stays `required`. Fail-closed: any doubt is unavailable.

The Reviewer receives only the artifacts, the review packet (`sdd review begin`: diff and paths from git), the real validation results and the applicable rules; never the author's reasoning, notes or conclusions, nor a request to confirm the work.

A review belongs to one revision of the change (`reviewedRevision`: merge-base plus the content of every changed path). Any later change makes it **stale**, and a new review of the current revision is required. A re-review judges the whole current change (regressions, incomplete fixes, side effects), not only whether the requested fix was applied.

The report keeps the results apart (`sdd review status`): `IMPLEMENTATION`, `VALIDATION`, `SELF_REVIEW`, `INDEPENDENT_REVIEW`, `FINAL_REVIEW_STATUS`, `HUMAN_GATE`. `FINAL_REVIEW_STATUS: APPROVED` requires an independent review PASS of the current revision and validation PASS; the deriver and `checkOutcomeCoherence` (`runtime/circuit/independent-review.mjs`) reject anything else. Even then the human gate follows the HITL policy: merge is always a human decision.

## Runtime-attested independent review (trust chain and threat model)

An independent review counts only when it is **runtime-attested**: the runtime that ran the Reviewer left a record of that run, the runtime adapter verifies it against the runtime's own store, and the core judges the resulting evidence. Nothing the authoring session declares (`--kind independent`, a runtime name, an agent, an execution class, a validation result, a ledger line) can stand in for it.

```text
sdd review validate   the platform runs each validation command and records exit code + output digest on the revision
sdd review begin      single-use nonce, revision, packet (diff, paths, validation runs) in the common git dir,
                      and the delegation prompt (packet + nonce); an empty change is refused
reviewer run          the Coordinator delegates with exactly that prompt; the runtime starts the reviewer isolated
runtime hook          the runtime hands its own record of the finished run to `sdd review receipt <runtime>` (every receipt kept)
adapter verify        runtime/adapters/<runtime>-review.mjs checks the record against the runtime's store -> ReviewEvidence
core judge            runtime/circuit/independent-review.mjs: runtime verified, execution allowlisted, reviewer agent,
                      isolation, this review (nonce), this revision, verdict = the reviewer's
sdd review record     appends the evidence-backed line; refuses anything it cannot attest
sdd review status     re-attests every line and every run; APPROVED only if the whole chain holds now
```

`INDEPENDENT_REVIEW: PASS` requires all of: runtime evidence that verifies; the `reviewer` agent; a runtime the platform verified (`core/agents.json` `runtimes.<tool>.independentReview: verified`, with evidence in `evaluation/compat`); an execution class verified for that runtime (Claude: `delegated-fresh-context` only; Codex and OpenCode: none); isolation that withholds the author's context; the review's nonce; the current revision; validation runs on that revision that passed and that the Reviewer was shown in its packet; no adverse review of the same revision. Any missing fact fails closed: `FINAL_REVIEW_STATUS` is not `APPROVED` and `HUMAN_GATE` stays `required`.

Re-review and stale reviews: any change to a path in scope changes the revision; an approval of an older revision is `STALE`. An adverse review (self or independent, recorded or only captured by the runtime) of the current revision withdraws any approval of it until the change moves: fix, validate, and a new independent review.

A review run is immutable once the Reviewer answered. Transcript policy (enforced by the runtime adapter on the runtime's own record of the run): the delegation prompt, then only the Reviewer's own read-only tool calls and their results, then exactly one final answer. A message sent to the Reviewer after its delegation (a follow-up, a clarification, a resume of the same agent) or a second answer makes the run unable to approve, whatever it answered; any adverse answer the run gave is its verdict and counts against the revision. Asking again, in the same run or in a new review of the same revision, cannot replace an adverse verdict the platform observed. Receipts are candidates, never slots: each is verified on its own, so a receipt stored first (by hand, or before the run finished) cannot keep the runtime's own out, and a verifiable adverse run dominates. With no recorded independent review, receipts of the revision that prove nothing are reported as `INDEPENDENT_REVIEW: NOT_PROVEN`; `NOT_RUN` means no receipt at all.

Runtime agnosticism: the core knows execution classes and evidence fields, never tools, hooks or agent types. Each runtime's mechanics live in its adapter (`runtime/adapters/review-evidence.mjs` lists the attesters). A runtime without an attester, or not verified in `core/agents.json`, projects the fallback note and can never produce an independent review.

Fallback: no capability is not a failure. The work continues to validation and a self-review (`--kind self`), reported as `INDEPENDENT_REVIEW: UNAVAILABLE`, `FINAL_REVIEW_STATUS: REVIEW_PENDING`, `HUMAN_GATE: required`.

HITL: an attested independent approval lets the human gate be the one the HITL policy derives (`runtime/policy/hitl.mjs`); it never lowers it below the policy, and merge and release stay human decisions.

### Threat model

| Threat | Mitigation |
|---|---|
| The authoring session records `--kind independent` without a reviewer run | refused: no runtime receipt |
| It declares runtime, agent, execution, isolation or validation by flags | the flags are refused; those facts come only from evidence and from runs the platform executed |
| It hand-writes or copies a line into `specs/<slug>/reviews.jsonl` | `status` re-attests every line against the issued nonce, the stored receipt (digest) and the runtime store; an unattested line is reported and never approves |
| It feeds a crafted hook input to `sdd review receipt` | the hook input only says where to look: the adapter checks the runtime's transcripts (the delegation to the `reviewer` agent type carrying this nonce whose own result names this run, the subagent starting from that prompt in a fresh context, reading the packet, only read-only tools: a call to another tool counts unless the runtime's exact refusal proves it never ran) and takes the verdict, nonce and revision from the answer the runtime recorded, never from the hook's copy. The run is the one the delegation's own result names in the runtime's `agentId: <id>` line, never a mention of the id in the report |
| It shapes the delegation prompt (a summary, a request to confirm, a verdict) | the delegation must be exactly the prompt `sdd review begin` issued (packet path and nonce); any other prompt cannot approve |
| It picks who reviews or what the Reviewer sees (another model, an isolated worktree) | the delegation runs the projected reviewer: no model other than its own (`core/agents.json`) and no isolation; a delegation that overrides either cannot approve, and its adverse answer still counts |
| The Reviewer's adverse answer cannot be verified (no nonce, no revision, malformed) | the run is filed under the nonce its delegation carried; a real reviewer run of the revision that cannot approve still counts: its adverse verdict, or `NEEDS_HUMAN_DECISION` when no verdict is readable |
| It reuses the evidence of another review or revision | nonce and revision are bound in the evidence and checked by the core |
| It asks the Reviewer again until it approves | a new run of the same revision cannot wash out an adverse one: every receipt is kept and an adverse run withdraws the approval |
| It continues the same Reviewer after an adverse answer (a follow-up message, a resume) and gets an approval | the transcript policy: a run sent anything after its delegation, or with more than one answer, cannot approve; its adverse answer stays its verdict |
| It stores an invalid receipt for the run before the runtime does | receipts are keyed by content, never by run: the runtime's own receipt is stored next to it and verified on its own |
| It changes the code after the approval, or runs validation after the review | the revision changes (`STALE`); validation runs the Reviewer did not see do not count |
| It runs a trivial validation command, or one whose text or output addresses the Reviewer | the runs are in the packet, which asks the Reviewer to judge whether they are the official checks and fences both the command and its output as data; the Reviewer rejects a validation that does not cover the project's official checks |
| It reviews against `--base HEAD` after committing | an empty change cannot begin a review; `status` prints the base and its changed paths |
| It chooses a narrower base (e.g. a commit of its own branch) | not detected locally: the review, its approval and the `HUMAN_GATE` that `status` derives (the HITL rule on the same base) all cover only the change against that base, printed as `BASE:` and kept in the ledger (`baseRef`, `baseSha`). A local `status` therefore does not show that the whole change was reviewed: the human checks that `BASE` is the branch the work merges into, and the forge's PR diff, factory CI (`hitl --base origin/<base>`) and branch protection judge the real change |

Not covered, by design: this is not a cryptographic proof. An actor with write access to the runtime's transcript store (for Claude Code `~/.claude/projects` or `$CLAUDE_CONFIG_DIR`), to the platform's review state (`<git common dir>/ai-native/review`), to the project's `.claude/` configuration or to the platform cache can forge evidence; so can a local user with full control of the filesystem or the runtime. The guarantee is that AI-NATIVE's own commands, used by the authoring session, cannot produce a false independent review, and that a forgery needs a deliberate write outside those commands. It covers runs the runtime hook captured: a run with no receipt (hook missing, colliding with the project's own `.claude/settings.json`, or timed out) is invisible, so its adverse verdict cannot count (it is reported as `NOT_RUN`), and the base ref is the caller's choice (see the narrower-base row). Branch protection, CI and the human merge remain the controls that do not depend on the local host.
