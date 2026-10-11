Target: specs/$ARGUMENTS

You are the Planner. Load the `sdd` skill (methodology: tasks). Do not touch code.

From `spec.md` and `plan.md` write `tasks.md`. Format, one block per task:

```text
- [ ] **T1. <title>.** RF-1, RF-2
  - Done when: <verifiable check>.
```

States: `[ ]` pending, `[x]` done, `[!]` blocked. Tasks are small (one focused session), ordered by dependency, independent where reasonable, each covering at least one requirement. If there are more than 10, propose splitting the spec.
