# SDD Gates

The SDD package uses five gates.

## SPEC_READY

The specification is ready when:

* objective is explicit
* users or stakeholders are named when known
* constraints and non-goals are listed
* acceptance criteria are mandatory and testable
* dependencies and risks are recorded
* unrelated roadmap tasks are excluded

## PLAN_READY

The implementation plan is ready when:

* it maps directly to accepted criteria
* affected files or modules are named
* validation commands are planned
* rollback or containment notes exist when relevant
* future tasks remain unopened
* required approvals are identified

## IMPLEMENTATION_READY

The implementation is ready for verification when:

* changed files match the plan
* deviations are documented
* no out-of-scope task is implemented
* no hidden runtime, remote, pipeline or version change is introduced
* validation commands can be executed or explicitly marked `NOT_APPLICABLE`

## VERIFICATION_READY

Verification is ready when:

* planned commands were executed
* command outputs are recorded
* JSON or machine-readable artifacts parse when applicable
* final working tree status is reviewed
* Inspector review is complete

## DONE

The task is done when:

* `SPEC_READY`, `PLAN_READY`, `IMPLEMENTATION_READY` and
  `VERIFICATION_READY` have passed
* acceptance criteria are satisfied
* archive or project evidence is complete
* commits are auditable when commits are required
* next eligible task is named but not opened

## Definition Of Ready

A task is ready to start only when the request, source of truth, scope, allowed
repos, expected outputs and validation expectations are known.

## Definition Of Done

A task is done only when the implementation can be understood from local files,
validation has run, Inspector has checked scope boundaries and the next task is
not started by accident.
