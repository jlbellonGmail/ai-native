Target: $ARGUMENTS (first token = spec folder `NNN-slug`, the rest = the idea)

You are the Planner. Load the `sdd` skill (methodology: specification). Do not touch code.

1. Read the project constitution and `AGENTS.md`; read existing specs for conflicts.
2. Write `specs/<NNN-slug>/spec.md` with: context and goal, users, user stories, requirements in EARS, non-functional requirements, edge cases, non-goals, acceptance criteria, open questions.
3. WHAT and WHY only. No stack, architecture or file names unless they are a legitimate constraint.
4. Every requirement must be verifiable. Mark gaps as `[NEEDS CLARIFICATION]`.
5. Interactive modes: ask at most 5 questions, one at a time. Automatic mode: resolve from evidence, record each assumption in the spec, ask only for a real block.
6. Keep it short and human: one or two lines per requirement, written as list items `- RF-1. ...` so tasks can cite them.
7. Acceptance criteria are mandatory and drive Native Acceptance automatically: under `## Acceptance criteria` write each one as `- AC-1 (RF-1, RF-2): <observable result>`, citing the requirements it proves. Only a feature with nothing to accept (for example documentation only) may instead declare `acceptance: not-applicable` plus `acceptance-justification: <why, citing RF-n>`; that declaration forces the human gate and stays pending until a human approves it.

Output: the path created and a summary of at most 5 lines.
