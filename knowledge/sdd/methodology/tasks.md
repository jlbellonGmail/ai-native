# Tasks (`tasks.md`)

Execution, decomposed. Format:

```text
- [ ] **T1. <title>.** RF-1, RF-2
  - Done when: <verifiable check>.
```

States: `[ ]` pending · `[x]` done · `[!]` blocked. Parsed by `parseTasks`; validated by `validateSpecFolder` (duplicate ids, missing "Done when", references to requirements that do not exist).

A good task is small (one focused session), ordered by dependency, independent where reasonable, testable, and covers at least one requirement. More than 10 tasks suggests splitting the spec. Order is dependency order; the order in the file is the execution order of `/sdd-implement-all`.

A blocked task is never silently skipped: later tasks stay pending.
