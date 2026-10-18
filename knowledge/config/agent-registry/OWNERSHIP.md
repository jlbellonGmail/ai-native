# Agent Registry Ownership

This document defines the ENTERPRISE-10-10 W5-T4 ownership model for the
`ai-knowledge` agent registry.

W5-T4 covers governed ownership, accountability and approval-chain rules for
agent registry entries and cataloged capabilities. It does not create IAM,
runtime permissions, service authorization, agent activation or evaluation
linkage.

## Ownership Model

Every governed agent registry ownership record must define:

| Field | Purpose |
|---|---|
| `owner.team` | Team accountable for registry stewardship. |
| `owner.contact` | Contact route for review and accountability. |
| `subjectType` | Whether the record governs an agent skill, registry index or capability. |
| `approvalState` | Current documentary approval state. |
| `roles` | Role assignments for ownership, review, risk and registry consistency. |
| `accountableCapabilities` | Capability ids governed through this ownership record. |

Ownership is recorded in `ownership.policy.json` and must align with:

* `agent-registry.schema.json`
* `registries/agents/registry.storage.json`
* `agent-registry/capabilities.catalog.json`

## Approval Chain

The approval chain is documentary only:

| Step | Rule |
|---|---|
| Owner assignment | Owner team and contact must exist before registry use. |
| Review required | Activation or major changes require human review. |
| Registry steward review | Storage moves and capability ownership changes require registry steward review. |
| Risk acknowledgement | Runtime tool changes require risk acknowledgement before any future activation. |
| Retirement | Owner acknowledgement and registry update are required. |

W5-T4 does not approve agents for runtime execution. It defines the ownership
and approval-chain contract that future tasks can reference.

## Non-Goals

W5-T4 does not:

* create IAM roles;
* grant repository, service or runtime permissions;
* activate agents;
* execute agents;
* create evaluation linkage;
* close W5-T5;
* close W5-T6.

Run `node scripts/validate-agent-registry-ownership.mjs` after changing agent
ownership records, approval rules or accountability mappings.
