# Tasks

- [ ] **T1. Define acceptance registry and result contracts.** RF-1, RF-2, RF-3, RF-4
  - Done when: validators and fixtures reject missing ownership, invalid statuses and mandatory empty suites.
- [ ] **T2. Derive and enforce consumer-owned Cross Acceptance obligations.** RF-1, RF-2, RF-3, RF-4, RF-12, RF-13
  - Done when: every graph dependency requires a consumer-owned validation; missing, skipped or unavailable required tests produce BLOCKED and cannot PASS.
- [ ] **T3. Implement evidence provenance, configuration fingerprint and staleness checks.** RF-5, RF-6, RF-7, RF-11, RF-17, RF-18
  - Done when: sourceRevision stays outside fingerprint; relevant config/env changes invalidate; unrelated changes retain evidence; secret material is never stored or hashed; critical unverifiable config is BLOCKED.
- [ ] **T4. Enforce command security and verified isolation profile.** RF-8, RF-9, RF-10, RF-14, RF-15, RF-16
  - Done when: tests distinguish restricted spawn from isolation, verify filesystem/network/process/privilege controls, and prove missing enforcement blocks before command start.
- [ ] **T5. Verify native acceptance feature.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18
  - Done when: targeted tests and mandatory repository validators pass with evidence retained safely.
