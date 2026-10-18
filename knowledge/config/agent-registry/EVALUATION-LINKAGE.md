# Agent Registry Evaluation Linkage

This document closes ENTERPRISE-10-10 W5-T5 for `ai-knowledge`.

W5-T5 links governed agent registry entries to the Evaluation Framework without
running agents, creating evaluation jobs, approving activation or producing
score reports.

## Contract

The canonical machine-readable contract is:

`config/agent-registry/evaluation-linkage.json`

It binds agent registry records to:

* `config/agent-registry.schema.json`
* `registries/agents/registry.storage.json`
* `config/agent-registry/capabilities.catalog.json`
* `config/agent-registry/ownership.policy.json`
* `config/evaluation-policy.json`
* `evaluation/enterprise-10-10/evaluation-program.json`
* `benchmarks/catalog.json`
* `datasets/registry.json`
* `scoring/rubric.json`

## Governance Rules

Every W5-T5 binding must define:

* the agent id and agent version under evaluation linkage
* the source storage entry from the W5-T2 storage contract
* the capability id from the W5-T3 capability catalog
* the owner team from the W5-T4 ownership policy
* the evaluation suite declared by the agent schema
* benchmark, dataset, scoring model and minimum score references
* traceability paths proving the linkage

The binding is required before any future activation, but W5-T5 does not approve
activation.

## Non-Goals

W5-T5 does not:

* execute an agent
* create an evaluation run
* create a pipeline
* produce scores or reports
* grant runtime tool permissions
* close W5-T6 Agent Registry Audit

## Validation

Run:

```powershell
node scripts/validate-agent-registry-evaluation-linkage.mjs
```
