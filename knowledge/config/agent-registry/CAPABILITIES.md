# Agent Registry Capabilities Catalog

This document describes the ENTERPRISE-10-10 W5-T3 capabilities catalog for
`ai-knowledge`.

W5-T3 defines governed capability records, a capability schema and dependency
relationships across existing agent registry material. It does not implement
capabilities, modify real agents, grant runtime tools, define ownership approval
chains or bind evaluation runtime.

## Contract Files

| File | Purpose |
|---|---|
| `../agent-registry.capability.schema.json` | Machine-readable schema for one capability record. |
| `capabilities.catalog.json` | Machine-readable W5-T3 catalog and dependency model. |
| `../../scripts/validate-agent-registry-capabilities.mjs` | Local validation contract for catalog integrity. |

## Capability Rules

Each capability record must define:

| Field | Rule |
|---|---|
| `id` | Stable kebab-case capability identifier. |
| `sourceAgentEntries` | References W5-T2 storage entry ids only. |
| `lifecycleState` | Must be `cataloged`, `candidate` or `retired`. |
| `dependencyModel.requires` | Must reference known catalog capability ids and remain acyclic. |
| `dependencyModel.supports` | Must reference known catalog capability ids. |
| `dependencyModel.incompatibleWith` | Must reference known catalog capability ids. |
| `executionPolicy` | Must keep implementation, runtime activation and tool grants disabled for W5-T3. |
| `governance` | Must bind the record to roadmap task `W5-T3`. |

## Dependency Model

The catalog uses three relationship types:

| Relationship | Meaning |
|---|---|
| `requires` | Capability should not be selected before the referenced capability context exists. |
| `supports` | Capability can provide useful context to the referenced capability. |
| `incompatibleWith` | Capability should not be combined with the referenced capability in the same governed selection. |

Only `requires` is ordered. The `requires` graph must remain acyclic so a future
selector can resolve capability prerequisites deterministically.

## Non-Goals

W5-T3 does not:

* implement or execute any capability;
* modify stored agent skill files;
* activate agents;
* grant tool permissions;
* close W5-T4 ownership;
* close W5-T5 evaluation linkage;
* close W5-T6 audit.

Run `node scripts/validate-agent-registry-capabilities.mjs` after changing the
catalog, schema or roadmap coverage.
