# Load Testing Governance

W6-T3 defines load-testing governance for generated projects. It provides a
scenario catalog and execution contract that teams can adopt before real load
generation exists.

This document does not create load infrastructure, provision environments,
execute traffic, or define performance acceptance for W6-T4. It only defines
the minimum governance model required to make future load tests repeatable,
owned and reviewable.

## Scenario Catalog

Load scenarios must describe a stable entry point, expected traffic shape,
required dependencies and evidence that the scenario can be reviewed before
execution. A scenario is eligible only when it has:

* an owner responsible for test intent and review;
* a source entry point from the generated project;
* a traffic profile with bounded arrival rate and duration;
* explicit dependency assumptions;
* an execution status that confirms no W6-T3 load was generated;
* evidence paths that exist in the template repository.

The initial catalog starts with the deterministic password validator service
because it is already covered by W6-T1 contract testing and W6-T2 mutation
testing readiness.

## Execution Contract

Before a generated project runs load tests, the project must declare:

* target environment and isolation rules;
* traffic profile and stop conditions;
* dependency policy for external providers;
* data safety controls;
* observability signals needed to interpret a run;
* review owner and waiver policy.

W6-T3 records the governance contract only. Any real execution, runtime
environment, traffic generator, performance budget, score, report or release
gate belongs to later work and generated-project implementation.

## Non-goals

W6-T3 does not:

* generate load;
* create runtime environments;
* execute synthetic traffic;
* set W6-T4 performance budgets;
* create chaos scenarios;
* close W6-T4, W6-T5, W6-T6 or W6-T7.

The machine-readable contract lives in `load-testing.contract.json`; validation
is implemented by `scripts/validate-load-testing.mjs`.
