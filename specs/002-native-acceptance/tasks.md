# Tasks

- [ ] **T1. Define the validation-contract runner entries and result contracts.** RF-1, RF-2, RF-3, RF-4
  - Done when: validators and fixtures reject missing ownership, invalid statuses and mandatory empty suites.
- [ ] **T2. Derive and enforce consumer-owned Cross Acceptance obligations.** RF-1, RF-2, RF-3, RF-4, RF-12, RF-13
  - Done when: every graph dependency requires a consumer-owned validation; missing, skipped or unavailable required tests produce BLOCKED and cannot PASS.
- [ ] **T3. Implement the evidence ledger, CI closure evidence, provenance, configuration fingerprint and staleness checks.** RF-5, RF-6, RF-7, RF-11, RF-17, RF-18, RF-30, RF-31
  - Done when: local evidence exists only in the runner-written git-dir ledger; merge closure accepts only the CI re-run bound to the evaluated commit and run ID; forged/edited/replayed entries are BLOCKED; closure requires evidence at the evaluated revision; reuse is limited to unaffected cross obligations; relevant config/env changes invalidate; secret material is never stored or hashed; critical unverifiable config is BLOCKED.
- [ ] **T4. Enforce command security and isolation tiers.** RF-8, RF-9, RF-10, RF-14, RF-15, RF-16, RF-33
  - Done when: tests show `restricted` labelled not isolated, `node-permission` and `container` report only enforced controls, an unavailable tier or a run below a case's minimum tier blocks before command start without fallback, and the git common directory is unreachable at the higher tiers.
- [ ] **T5. Define and validate the acceptance plan, applicability matrix and datasets.** RF-19, RF-20, RF-21, RF-22, RF-29, RF-32
  - Done when: fixtures prove AC-to-case completeness, N/A justifications citing RF/AC, no cases for N/A categories, a failing-capable case per AC, dataset digest/seed reproducibility, and the result contract maps fail-closed with STALE blocking.
- [ ] **T6. Enforce the validation contract with observed-case coverage.** RF-23, RF-24
  - Done when: `node -e 0`, zero observed cases, skipped/missing/unknown case IDs are BLOCKED, a real failing case is FAIL and a complete run is PASS, for TAP 13, JUnit and Node test reporter output.
- [ ] **T7. Detect acceptance downgrades against the trusted BASE.** RF-25
  - Done when: contract creation/change, N/A on a REQUIRED feature and every DOWNGRADE kind (including a legacy-cutoff addition) are detected by the BASE-platform check wired into `ci.yml` and the consumer L3 job, force `human_gate: required` through `hitl-policy.json`, and appear in the review packet input.
- [ ] **T8. Render the manual and enforce runner/manual parity and traceability.** RF-26, RF-27, RF-28
  - Done when: the manual has every required field per case, divergence is BLOCKED, manual runs are labelled, and the traceability report links every requirement to a gate decision with sourceRevision and fingerprint.
- [ ] **T9. Verify native acceptance feature.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33
  - Done when: targeted tests and mandatory repository validators pass with evidence retained safely.
