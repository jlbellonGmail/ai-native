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
