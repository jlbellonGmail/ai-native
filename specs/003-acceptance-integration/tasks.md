# Tasks

- [ ] **T1. Wire automatic acceptance into the existing SDD commands and dispatcher.** RF-1, RF-18
  - Done when: catalog, projection and dispatcher tests show the acceptance phase in existing commands, the `sdd acceptance` subcommand, no new slash command, and REQUIRED / NOT_APPLICABLE / missing classification with the legacy cutoff.
- [ ] **T2. Enforce acceptance in closure, review and impact selection.** RF-2, RF-3, RF-19, RF-20
  - Done when: tests prove affected consumers run once, the feature-level stage runs after the task loop, FAIL/BLOCKED/STALE/NOT_RUN block DONE, ledger validation PASS and APPROVED, free-text `node -e 0` does not count, an injected stub/callback returning PASS without a ledger entry is BLOCKED, and the packet carries every acceptance element.
- [ ] **T3. Implement the explicit upgrade compatibility matrix.** RF-4, RF-8, RF-9, RF-10
  - Done when: tests prove v4.0.1, v4.0.2, v3.4.2 and v3.4.3 each have a separate real-shape fixture recording tag, lock-schema blob and protocol, while v4.0.0, absent, malformed, future and unadmitted sources reject before any filesystem, index or cache mutation, and v3.4.x paths report the MAJOR crossing.
- [ ] **T4. Implement and test upgrade preservation and recovery for every admitted source.** RF-11, RF-12, RF-13
  - Done when: each of the four admitted fixtures proves owned-file preservation, managed drift reporting, forced-failure rollback and byte-idempotent second execution.
- [ ] **T5. Execute isolated GI PostgreSQL reference pilot.** RF-6, RF-14, RF-15, RF-16, RF-17
  - Done when: repeated real PostgreSQL runs prove Locales/Regions persistence and reads, FK valid/invalid references, `locale_id` resolution and unchanged state after rejection; mocks and in-process ASGI are labelled accurately.
- [ ] **T6. Prove the circuit end-to-end on an isolated consumer.** RF-21
  - Done when: evidence from a disposable consumer shows the ten required observations and refusal of the trivial-validation and silent-downgrade attempts, with no acceptance-specific prompt.
- [ ] **T8. Preserve every schema lock field in `ai-native rollback`.** RF-22
  - Done when: a regression test that fails against the unfixed `canonical()` passes, showing that rollback after an upgrade keeps `productDir`, `governance` and every other non-platform field and yields a schema-valid lock; an invalid lock is refused without changing the lock or the cache state; `init` output is byte-identical; and own-acceptance cases for AC-7 PASS.
- [ ] **T7. Document and verify release candidate handoff.** RF-5, RF-7
  - Done when: docs, regression, review-ledger status and draft PR accurately distinguish technical readiness from pending HITL.
