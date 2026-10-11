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
T1: implement -> tests -> acceptance -> evidence -> T2 ... -> last task
  -> official full suite -> independent Reviewer -> validation -> CI -> human final gate
```

On failure: `detect -> diagnose -> fix -> retest`, bounded by the level's convergence budget (`contracts/sdd-levels.json`). No convergence means **BLOCK the work unit** with the full evidence; later tasks are not marked done. The executable reference is `runtime/circuit/implement-all.mjs`.

Reviewer findings re-enter through the Coordinator: `Reviewer finding -> Coordinator -> Implementer -> Reviewer`, until 0 CRITICAL and 0 HIGH.
