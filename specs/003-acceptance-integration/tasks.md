# Tasks

- [ ] **T1. Integrate acceptance command and supported adapters.** RF-1
  - Done when: contract, projection and dispatcher tests prove the public command resolves only registered behavior.
- [ ] **T2. Integrate compatibility impact and quality results.** RF-2, RF-3
  - Done when: tests prove affected consumers run once and mandatory FAIL/BLOCKED cannot yield approval.
- [ ] **T3. Implement explicit v3 upgrade compatibility matrix.** RF-4, RF-8, RF-9, RF-10
  - Done when: tests prove v3.4.2 and v3.4.3 have separate real-shape fixtures, while absent, malformed, future and unadmitted v3 sources reject before any filesystem, index or cache mutation.
- [ ] **T4. Implement and test admitted-v3 upgrade preservation and recovery.** RF-11, RF-12, RF-13
  - Done when: each admitted fixture proves owned-file preservation, managed drift reporting, forced-failure rollback and byte-idempotent second execution.
- [ ] **T5. Execute isolated GI reference pilot.** RF-6
  - Done when: recorded real results or explicit BLOCKED evidence cover Locales, Regions, cross dependency, compatible/incompatible/restored provider and stale evidence.
- [ ] **T6. Document and verify release candidate handoff.** RF-5, RF-7
  - Done when: docs, regression, review-ledger status and draft PR accurately distinguish technical readiness from pending HITL.
