# SDD Independent Review - Security Notes

Security review required: Yes (control plane: `contracts/**`; trust decision: what counts as an approval).

## Guarantee

Runtime-attested independent review: AI-NATIVE's own commands, used by the authoring session, cannot produce
`INDEPENDENT_REVIEW: PASS` or `FINAL_REVIEW_STATUS: APPROVED` for a review that the runtime did not run and record,
nor turn a recorded adverse answer into an approval: the verdict is the one the runtime's transcript holds, the
delegation is exactly the prompt the platform issued, and a run is one prompt and one answer (a run continued after
it answered cannot approve, and its adverse answer stays its verdict). Limits: a reviewer run the runtime hook never
captured is invisible (its adverse verdict cannot count); a narrower `--base` narrows what the review and the local
`HUMAN_GATE` cover (shown as `BASE:`). Canonical description and threat table:
`knowledge/sdd/methodology/review.md` ("Runtime-attested independent review").

## Trust Boundaries

| Source | Trusted for | Never trusted for |
|---|---|---|
| Authoring session (CLI flags, ledger lines) | its own self-review, adverse findings | runtime, agent, execution, isolation, validation, an approval |
| Platform (`sdd review validate`, `begin`) | validation runs, nonce, revision, packet | - |
| Runtime hook input (`sdd review receipt`) | where the runtime's records of a run are | the verdict, nonce or revision; being the only receipt of a run |
| Runtime store (Claude Code transcripts) | that a reviewer run happened, its prompt, tools and answer | - |
| Adapter (`claude-review.mjs`) | turning the store into ReviewEvidence | deciding independence (the core does) |
| Core (`independent-review.mjs`) | the decision, against `core/agents.json` | - |

## Threat Model

In scope (blocked, each with a test): independent declared without a reviewer; false runtime; fabricated execution;
fabricated validation PASS; hand-written ledger JSON; missing runtime evidence; evidence of another review; of another
revision; wrong agent type; execution not allowed; approval followed by an adverse review; re-review bypass;
removal of the human gate; dictated verdict; reviewer that wrote; reviewer that never read the packet; fork instead
of a fresh context; asking again to erase an adverse run; a hook input whose answer differs from the transcript
(second independent review H1); a delegation prompt other than the issued one (M1); an adverse answer without the
nonce; another agent started with the reviewer's prompt whose hook claims `agent_type: reviewer`; transcripts
outside the store or off the documented layout; the same run under two ids; `--flag=value`; an empty change
(`--base HEAD`). Third independent review: continuing the same Reviewer (SendMessage/resume) after an adverse
answer to obtain an approval (A); a second final answer; an invalid receipt stored first for the run, before the
runtime's own (B); a delegation result that only mentions the agent_id in its text (C); a multi-line validation
command that writes packet structure (D).

Out of scope (documented, not detected): a deliberate write outside AI-NATIVE commands into the runtime transcript
store, the platform review state in the git dir, the project's `.claude/` configuration or the platform cache; a
local user with full control of the filesystem or runtime; a `--base` narrower than the branch the work merges into
(inherited: the review, its approval and the local gate cover only that change; the forge's PR, factory CI and
branch protection judge the real one). This is not a cryptographic guarantee. Branch
protection, CI and the human merge do not depend on the local host and stay in force.

## Security By Design

* Fail-closed everywhere: unknown capability, unknown runtime, missing field, unreadable receipt, compressed
  transcript: not independent. A `SubagentHandback` report is the reviewer's answer only after the harness's exact
  handback instruction; any other message to the run, a second answer or a tool outside the read-only set still is not.
  A call outside that set is excused only when the runtime's exact refusal proves it never ran (N-35); an error alone
  never is.
* The receipt hook never blocks the runtime (always exit 0) and trusts nothing it stores.
* No new permission is granted: `sdd-validate` keeps the restricted projection (Claude pre-approves only
  `Read, Grep, Glob`; OpenCode `plan` agent); its write goes through `sdd review` commands and normal prompts.
* Dependency impact: none.

## DevSecOps

No CI workflow change. The tests run in the existing `runtime/circuit/*.test.mjs` and `runtime/adapters/*.test.mjs`
groups of `ci.yml`.

## Final Security Status

Builder-side: PASS with the residual risks of `verification.md`. Independent security review: pending (human).
