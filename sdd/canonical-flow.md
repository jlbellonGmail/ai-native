# Canonical SDD Flow

Spec-Driven Development turns each feature or change into an auditable chain:

```text
Specify -> Plan -> Implement -> Verify
```

The flow is mandatory for project work that changes product behavior, project
architecture, data handling, security posture, evaluation behavior, automation,
or user-facing workflows.

## Phase 1: Specify

Purpose: define the problem before solution work starts.

Required inputs:

* project context
* user or stakeholder request
* constraints and non-goals
* known risks or dependencies

Required outputs:

* feature specification
* acceptance criteria
* out-of-scope list
* evidence references

Exit gate:

`SPEC_READY`

Stop conditions:

* objective is ambiguous
* acceptance criteria are missing
* scope includes unrelated roadmap tasks
* required stakeholder decision is absent

## Phase 2: Plan

Purpose: convert the accepted specification into a minimal implementation path.

Required inputs:

* approved specification
* acceptance criteria
* relevant architecture and standards
* affected files or modules

Required outputs:

* implementation plan
* validation plan
* rollback or containment notes
* explicit non-goals

Exit gate:

`PLAN_READY`

Stop conditions:

* plan modifies files outside approved scope
* validation is missing or fake
* future tasks are opened by implication
* architectural boundary is unclear

## Phase 3: Implement

Purpose: execute only the accepted plan.

Required inputs:

* specification that passed `SPEC_READY`
* plan that passed `PLAN_READY`
* current repository status

Required outputs:

* implementation record
* changed file list
* deviation log
* validation commands to run

Exit gate:

`IMPLEMENTATION_READY`

Stop conditions:

* implementation needs a scope change
* generated output modifies unrelated files
* hidden runtime, remote, pipeline or version changes appear
* acceptance criteria can no longer be met

## Phase 4: Verify

Purpose: prove the implementation satisfies the specification and plan.

Required inputs:

* implementation record
* validation plan
* local command output
* final repository status

Required outputs:

* verification report
* command/result matrix
* inspector notes
* closure recommendation

Exit gates:

`VERIFICATION_READY` and `DONE`

Stop conditions:

* required validation was skipped
* command output is unavailable
* working tree contains unexpected changes
* inspector finds future-task leakage

## Transition Rule

No phase may be skipped. A phase can move forward only when its gate is passed
with local evidence. If evidence is unavailable, record `NOT_VERIFIED` instead
of claiming completion.
