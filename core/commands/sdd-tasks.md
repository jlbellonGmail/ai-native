Target: specs/$ARGUMENTS

You are the Planner. Load the `sdd` skill (methodology: tasks). Do not touch code.

From `spec.md` and `plan.md` write `tasks.md`. Format, one block per task:

```text
- [ ] **T1. <title>.** RF-1, RF-2
  - Done when: <verifiable check>.
```

One line per task; ids are unique and sequential (`T1`, `T2`, `T3`...), never `T1.1` or a repeated id; sub-steps go in the "Done when" text, not in new tasks. The file contains only these task blocks plus at most a one-line title.

States: `[ ]` pending, `[x]` done, `[!]` blocked. Each task carries its own test and the code that makes it pass (TDD inside the task); never a task that only writes tests or only runs them. Size to the work: a single pure function is 1 to 3 tasks, never one per rule. Tasks are small (one focused session), ordered by dependency, independent where reasonable, each covering at least one requirement. If there are more than 10, propose splitting the spec.

Native Acceptance is part of every feature with `AC-n` criteria: the last task is always the acceptance task, for example `- [ ] **Tn. Generate and pass the acceptance plan.** <every RF cited by an AC>` with `Done when: node .ai-native/ai-native.mjs sdd acceptance plan <NNN-slug> prints PLAN: VALID and the manual renders with PARITY: PASS`. In that task the Builder writes `specs/<NNN-slug>/acceptance/plan.json` (every AC mapped to at least one mandatory case, a rejection-expecting case per AC, the seven-category applicability matrix with a justification citing RF/AC for each NOT_APPLICABLE, synthetic datasets with their SHA-256), the case tests run by a runner of `acceptance/validation-contract.json`, and `sdd acceptance manual <NNN-slug>`. `sdd acceptance plan <NNN-slug>` writes the plan skeleton (criteria copied from the spec) when it is absent and, when the project has no `acceptance/validation-contract.json`, a proposal `acceptance/validation-contract.proposal.json`; their schemas are the platform's `contracts/acceptance-plan.schema.json` and `contracts/acceptance-validation-contract.schema.json`, and every validation error names the field. A missing validation contract is proposed for human review, never invented as passing.

Then validate and fix, at most 3 rounds: `node .ai-native/ai-native.mjs sdd validate <NNN-slug>`. It prints each structural error with its line (duplicate id, missing "Done when", unknown requirement); fix tasks.md and run it again until it prints PASS. Do not hand the problem to the user.
