# Runbooks & Playbooks

Program: ENTERPRISE-10-10
Task: W7-T6
Status: IMPLEMENTED

## Scope

W7-T6 documents operational runbooks, governance playbooks and incident
procedures for ENTERPRISE-10-10. The task is governance-only and records how
operators should respond to common local execution states without running
runtime operations, changing product repositories, modifying workflows, changing
pipelines, altering remote configuration or updating VERSION files.

Documented operating areas:

* local execution continuity
* roadmap task closure
* product-impact validation
* Engram continuity handling
* push-blocked handling
* incident triage and escalation

## Operational Runbooks

### Local Continuity Runbook

Use this runbook before any selected roadmap task is implemented:

1. Read `governance/SESSION-CONTEXT.md`.
2. Read the selected task directly from
   `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`.
3. Inspect the latest archive under
   `governance/execution/archive/ENTERPRISE-10-10-V1/`.
4. Verify root governance git status.
5. Verify each independent product repository git status.
6. Confirm that the selected task is the next eligible task.
7. Stop with `STOP HUMAN REQUIRED` if uncommitted changes or unexpected task
   closures are found.

### Product Impact Runbook

Use this runbook only when the roadmap names a product repository:

1. Confirm the impacted product repository from the roadmap.
2. Read existing validators and coverage files in that repository.
3. Implement real product artifacts for the selected task only.
4. Run the repository validators that already exist and are relevant.
5. Run `git diff --check` before committing product changes.
6. Create a product commit only in the impacted product repository.
7. Record the product commit in governance evidence.

For W7-T6, this runbook is documented but not executed because the roadmap
states `sin operacion runtime` and product impact is `N/A`.

### Governance Closure Runbook

Use this runbook after implementation and validation:

1. Update the roadmap state for the selected task only.
2. Update `governance/SESSION-CONTEXT.md`.
3. Update `governance/execution/current/`.
4. Create the selected task archive under
   `governance/execution/archive/ENTERPRISE-10-10-V1/`.
5. Record validation commands, product commit, governance commit and push
   status.
6. Leave the next eligible task unopened.
7. Confirm future tasks and later workstreams remain untouched.

### Engram Continuity Runbook

Use Engram only as auxiliary continuity memory:

1. Use project `ai-native`.
2. Query Engram before editing when a task resume requests it.
3. Compare Engram output against git, roadmap, session context and archive.
4. Treat git/governance as the source of truth.
5. Record Engram search or save failures as `CONTEXTUAL_NON_BLOCKING` when the
   local governance state is valid.
6. Do not reconstruct task scope from Engram alone.

### Push-Blocked Runbook

Use this runbook when a push is blocked by external policy, credentials or an
unverified remote destination:

1. Attempt push once for each affected repository.
2. Do not force push.
3. Do not change remotes without human authorization.
4. Do not retry in a loop.
5. Record `CONTEXTUAL_NON_BLOCKING` in governance evidence.
6. Preserve local commits as valid source of truth.
7. Save a push-attempt checkpoint in Engram when possible.

## Governance Playbooks

### Next Task Selection Playbook

The next task is selected only from the roadmap. Operators must not infer task
scope from workstream names, prior chat history or Engram memory. A task is
eligible only when all prior tasks in the same sequence are closed and no future
task has already been closed unexpectedly.

### Documentation-Only Playbook

When the roadmap defines a task as documentation-only or governance-only:

* add meaningful governance documentation.
* add or update the machine-readable contract requested by the task.
* validate JSON artifacts when present.
* do not create product changes just to force a product commit.
* record product commit as `N/A`.
* preserve explicit non-goals.

### Product Task Playbook

When the roadmap requires product impact:

* modify only the impacted product repository.
* prefer existing repository patterns and validators.
* update product coverage or traceability files when relevant.
* avoid VERSION changes unless explicitly authorized.
* commit product changes before governance closure.

### Evidence Playbook

Evidence must be reproducible and must name:

* selected task.
* exact task title.
* product impact.
* product commit or `N/A`.
* governance artifacts.
* validation commands and results.
* push status.
* next eligible task.
* future-task guardrails.

## Incident Procedures

### Unexpected Dirty Workspace

Condition:

* any root or product repository has uncommitted changes before task edits.

Procedure:

1. Stop before editing.
2. Report `STOP HUMAN REQUIRED`.
3. Do not stage, revert or overwrite unrelated changes.

### Commit Mismatch

Condition:

* local commit differs from the checkpoint required for the resume.

Procedure:

1. Stop before editing.
2. Report the expected and actual commits.
3. Do not repair history without human authorization.

### Future Task Already Closed

Condition:

* a future task such as W7-T7 appears closed before the selected task finishes.

Procedure:

1. Stop before editing or closing governance.
2. Report `STOP HUMAN REQUIRED`.
3. Do not rewrite roadmap history.

### Validation Failure

Condition:

* a relevant existing validator fails.

Procedure:

1. Fix recoverable issues within the selected task scope.
2. Re-run the failing validation.
3. Stop with `STOP HUMAN REQUIRED` if the failure is ambiguous, external or
   outside the selected task scope.

### Engram Failure

Condition:

* Engram search or save fails due policy, risk review or unavailable memory.

Procedure:

1. Record `CONTEXTUAL_NON_BLOCKING`.
2. Continue if git/governance sources are valid.
3. Do not revert local commits.

### Push Failure

Condition:

* push is blocked by policy, credentials or remote verification.

Procedure:

1. Record `CONTEXTUAL_NON_BLOCKING`.
2. Do not retry repeatedly.
3. Do not change remotes.
4. Keep local commits as the source of truth.

## Contract

The machine-readable runbooks and playbooks contract is stored at:

`governance/documentation/runbooks-playbooks.contract.json`

The contract records runbooks, playbooks, incident procedures, explicit
non-goals and roadmap continuity for W7-T6.

## Non-Goals

* No product repo changes.
* No runtime operation.
* No incident simulation.
* No workflow changes.
* No pipeline changes.
* No remote configuration changes.
* No VERSION changes.
* No W7-T7 opening or closure.
