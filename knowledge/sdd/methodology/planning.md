# Planning (`plan.md`)

`plan` answers HOW, from an approved spec. It is the only place for implementation detail.

Contents: architecture and strategy · modules and probable files · data · APIs · migrations · test strategy · risks · rollout and rollback when they apply.

Rules:

* Every part of the plan names the requirement it covers; every requirement is covered (`/sdd-analyze` checks this both ways).
* Each decision records the discarded alternative.
* Prefer the simplest option compatible with the existing architecture; reuse before adding.
* Reusable behavior goes to foundation/knowledge, not into a per-consumer copy.
* A plan that needs a change of requirements goes back to the spec (`change-management.md`), never around it.
