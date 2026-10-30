# Tasks

- [ ] **T1. Integrate acceptance command and supported adapters.** RF-1
  - Done when: contract, projection and dispatcher tests prove the public command resolves only registered behavior.
- [ ] **T2. Integrate compatibility impact and quality results.** RF-2, RF-3
  - Done when: tests prove affected consumers run once and mandatory FAIL/BLOCKED cannot yield approval.
- [ ] **T3. Implement and test controlled v3.4.3 consumer upgrade.** RF-4, RF-8, RF-9, RF-10, RF-11
  - Done when: actual-shape v3.4.3 fixtures prove admission before writes, owned-file preservation, managed drift reporting, forced-failure rollback and second-run idempotence.
- [ ] **T4. Execute isolated GI reference pilot.** RF-6
  - Done when: recorded real results or explicit BLOCKED evidence cover Locales, Regions, cross dependency, compatible/incompatible/restored provider and stale evidence.
- [ ] **T5. Document and verify release candidate handoff.** RF-5, RF-7
  - Done when: docs, regression, review-ledger status and a draft PR accurately distinguish technical readiness from pending HITL.
