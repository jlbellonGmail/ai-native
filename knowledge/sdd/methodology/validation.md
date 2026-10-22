# Validation

Validation proves the implementation against the artifacts, with real commands. PASS requires command evidence (`PASS`, `FAIL`, `NOT_RUN`, `NOT_APPLICABLE` as defined in `AGENTS.md`).

Order: targeted tests, regression, then the official full suite where the work unit is a Feature or Milestone. Then the requirement walk: every requirement maps to a test and its result; interface requirements need a real check, not an assertion that it works.

`/sdd-analyze` (before implementation) checks spec/plan/tasks consistency. `/sdd-validate` (after) checks the implementation and obtains its review. Both are read-only for code (`/sdd-validate` writes only the review record).

Validation PASS is not an approval and not a review. `/sdd-validate` reports the technical validation, the review and whether that review was independent as separate results (`review.md`); run in the session that wrote the change, or without an isolated Reviewer, its review is a self-review and the final status stays `REVIEW_PENDING`.

Hard failures: missing spec at normal/full, tasks that cite undefined requirements, invalid task states, adapter drift, duplicated canonical sources, invalid SDD level, invalid handoff. Each has an automatic check in `runtime/circuit/sdd-workflow.mjs` and `runtime/adapters`.
