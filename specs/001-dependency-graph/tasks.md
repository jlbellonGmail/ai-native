# Tasks

- [ ] **T1. Define strict dependency-manifest contract.** RF-1, RF-2, NF-1
  - Done when: contract validation and negative fixtures prove canonical IDs and declared references are enforced.
- [ ] **T2. Implement deterministic graph resolution.** RF-3, RF-4, RF-6
  - Done when: focused tests prove stable ordering, direct/transitive and reverse traversal, duplicate rejection and cycle diagnostics.
- [ ] **T3. Implement declared public contract change validation and impact selection.** RF-5, RF-7, RF-8, NF-2
  - Done when: tests prove only owner-validated change declarations select de-duplicated consumers, unknown compatibility is conservative and declared internal changes select none.
- [ ] **T4. Verify graph feature.** RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, NF-1, NF-2
  - Done when: focused tests and repository contract validators pass with recorded commands.
