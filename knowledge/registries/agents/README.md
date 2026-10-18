# Agent Registry Storage

This folder contains repository-backed agent registry material for
ENTERPRISE-10-10 W5-T2.

W5-T2 defines the storage model, lifecycle contract and retention rules for
existing agent registry files. It does not create runtime persistence, service
APIs, capability catalog semantics, ownership chains, evaluation linkage or
agent execution.

## Storage Layout

| Path | Purpose |
|---|---|
| `registry.storage.json` | Machine-readable W5-T2 storage contract. |
| `skills-index.md` | Human-readable baseline index of available agent skills. |
| `<agent-family>/skill.md` | Folder-backed agent skill material. |
| `<agent-family>.md` | Single-file agent skill material. |

## Lifecycle

Stored agent material uses this lifecycle:

| State | Meaning |
|---|---|
| `stored` | File exists in repository storage and is checksum validated. |
| `candidate` | File is eligible for later governance review. |
| `active` | Reserved for future approval workflows outside W5-T2. |
| `retired` | Reserved for future retention or removal workflows. |

W5-T2 records storage metadata only. It does not activate agents.

## Retention

Agent registry files are retained in Git history and must remain addressable by
stable path while referenced by `registry.storage.json`. Removal or relocation
requires updating the storage contract and its SHA-256 checksum before future
tasks can depend on the changed material.

Use `scripts/validate-agent-registry-storage.mjs` to validate paths, lifecycle
states, retention rules and file integrity.
