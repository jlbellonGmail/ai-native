# Validation

Validation proves the implementation against the artifacts, with real commands. PASS requires command evidence (`PASS`, `FAIL`, `NOT_RUN`, `NOT_APPLICABLE` as defined in `AGENTS.md`).

Order: targeted tests, regression, then the official full suite where the work unit is a Feature or Milestone. Then the requirement walk: every requirement maps to a test and its result; interface requirements need a real check, not an assertion that it works.

`/sdd-analyze` (before implementation) checks spec/plan/tasks consistency. `/sdd-validate` (after) checks the implementation. Both are read-only.

Hard failures: missing spec at normal/full, tasks that cite undefined requirements, invalid task states, adapter drift, duplicated canonical sources, invalid SDD level, invalid handoff. Each has an automatic check in `runtime/circuit/sdd-workflow.mjs` and `runtime/adapters`.
