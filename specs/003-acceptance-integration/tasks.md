# Tasks

- [ ] **T1. Wire automatic acceptance into the existing SDD commands and dispatcher.** RF-1, RF-18
  - Done when: catalog, projection and dispatcher tests show the acceptance phase in existing commands, the `sdd acceptance` subcommand, no new slash command, and REQUIRED / NOT_APPLICABLE / missing classification with the legacy cutoff.
- [ ] **T2. Enforce acceptance in closure, review and impact selection.** RF-2, RF-3, RF-19, RF-20
  - Done when: tests prove affected consumers run once, the feature-level stage runs after the task loop, FAIL/BLOCKED/STALE/NOT_RUN block DONE, ledger validation PASS and APPROVED, free-text `node -e 0` does not count, and the packet carries every acceptance element.
- [ ] **T3. Implement explicit v3 upgrade compatibility matrix.** RF-4, RF-8, RF-9, RF-10
  - Done when: tests prove v3.4.2 and v3.4.3 have separate real-shape fixtures, while absent, malformed, future and unadmitted v3 sources reject before any filesystem, index or cache mutation.
- [ ] **T4. Implement and test admitted-v3 upgrade preservation and recovery.** RF-11, RF-12, RF-13
  - Done when: each admitted fixture proves owned-file preservation, managed drift reporting, forced-failure rollback and byte-idempotent second execution.
- [ ] **T5. Execute isolated GI PostgreSQL reference pilot.** RF-6, RF-14, RF-15, RF-16, RF-17
  - Done when: repeated real PostgreSQL runs prove Locales/Regions persistence and reads, FK valid/invalid references, `locale_id` resolution and unchanged state after rejection; mocks and in-process ASGI are labelled accurately.
- [ ] **T6. Prove the circuit end-to-end on an isolated consumer.** RF-21
  - Done when: evidence from a disposable consumer shows the ten required observations and refusal of the trivial-validation and silent-downgrade attempts, with no acceptance-specific prompt.
- [ ] **T7. Document and verify release candidate handoff.** RF-5, RF-7
  - Done when: docs, regression, review-ledger status and draft PR accurately distinguish technical readiness from pending HITL.
