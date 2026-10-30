# Tasks

- [ ] **T1. Define strict dependency-manifest contract.** RF-1, RF-2, NF-1
  - Done when: contract validation and negative fixtures prove canonical IDs and declared references are enforced.
- [ ] **T2. Implement deterministic graph resolution.** RF-3, RF-4, RF-6
  - Done when: focused tests prove stable ordering, direct/transitive and reverse traversal, duplicate rejection and cycle diagnostics.
- [ ] **T3. Classify internal/public changes and verify immutable contract references.** RF-5, RF-7, RF-8, RF-9, RF-10, RF-11, NF-2
  - Done when: deterministic tests reject changed public bytes without a declaration and mutable/unverifiable refs; only proof of no public inventory changes yields internal classification; no LLM path exists.
- [ ] **T4. Verify graph feature.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, NF-1, NF-2
  - Done when: focused tests and repository contract validators pass with recorded commands.
