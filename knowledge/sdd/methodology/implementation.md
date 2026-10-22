# Implementation and TDD

## One task (`/sdd-implement`)

```text
select task -> minimum context -> test first -> implement -> tests -> acceptance -> evidence -> update state -> STOP
```

Context is the task, the plan and the cited requirements. The next task is never started automatically.

## TDD, where it makes technical sense

```text
requirement -> test -> expected failure (for the right reason) -> implementation -> PASS -> regression
```

Do not force TDD on documentation, configuration or generated output; say so and use the smallest sufficient check. A test that cannot fail proves nothing.

## All tasks (`/sdd-implement-all`)

Sequential, no human between tasks, no loss of quality control:

```text
capability preflight -> T1: implement -> tests -> acceptance -> evidence -> T2 ... -> last task
  -> technical validation -> review (isolated when available) -> fix -> validation -> new review ... -> human final gate
```

On failure: `detect -> diagnose -> fix -> retest`, bounded by the level's convergence budget (`contracts/sdd-levels.json`). No convergence means **BLOCK the work unit** with the full evidence; later tasks are not marked done. The executable reference is `runtime/circuit/implement-all.mjs`.

The Coordinator runs the whole loop; the human is not a router between `/sdd-validate` and the Reviewer. Reviewer findings re-enter through the Coordinator: `Reviewer finding -> Coordinator -> Implementer -> validation -> new Reviewer on the new revision`, until 0 CRITICAL and 0 HIGH, at most the level budget in rounds; no progress or the budget spent stops with a non-convergence for the human. A finding that needs a domain decision is escalated with its evidence, never guessed.

The Implementer may run inline in the Coordinator's session or as the `builder` subagent: either way that session is the author. What must be separate is the Reviewer. Without an isolated Reviewer the run ends `REVIEW_PENDING` after a self-review, never `APPROVED` (`review.md`).
