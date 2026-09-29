# Prompt Registry Ownership

This document defines the W4-T4 ownership model for prompt registry entries in
`ai-knowledge`.

W4-T4 covers ownership, approval rules and accountability. It does not create
IAM roles, runtime permissions, service authorization, evaluation linkage or
deployment approval.

## Ownership Model

Every governed prompt must have:

| Field | Purpose |
|---|---|
| `owner.team` | Team accountable for prompt stewardship. |
| `owner.contact` | Contact route for review and accountability. |
| `approvalState` | Governance state for prompt approval. |
| `accountability` | Named responsibilities for maintenance, risk and registry stewardship. |

Ownership is recorded in `ownership.policy.json` and must align with the
`owner` block required by `prompt-registry.schema.json`.

## Approval Rules

| Rule | Requirement |
|---|---|
| Draft use | Requires assigned owner and contact. |
| Active use | Requires human review before activation. |
| Major change | Requires owner review and registry steward review. |
| Retirement | Requires owner acknowledgement and registry update. |

W4-T4 does not approve any prompt for runtime execution. It defines the
approval states and accountability contract used by future changes.

## Validation

Run the W4-T4 validator after changing prompt ownership:

```powershell
node scripts/validate-prompt-registry-ownership.mjs
```

The validator confirms that ownership records align with the prompt schema,
the versioning contract and stored prompt entries, while W4-T5+ remain open.

