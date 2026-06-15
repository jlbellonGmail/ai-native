# Configuration

Machine-readable policies and schema definitions for knowledge products.

Files in this folder are consumed by validators or by downstream repositories
that need a stable contract for prompts, agents, datasets or evaluation.

## Prompt Schema

`prompt-registry.schema.json` is the ENTERPRISE-10-10 W4-T1 product artifact.
It defines one prompt registry entry, including required owner, version,
evaluation, risk-control and governance fields.

Use `scripts/validate-prompt-registry-schema.mjs` to validate the schema and the
minimal example in `examples/prompt-registry-entry.valid.json`.

## Agent Schema

`agent-registry.schema.json` is the ENTERPRISE-10-10 W5-T1 product artifact. It
defines one agent registry entry, including required owner, declared
capabilities, declared tools, evaluation suite, runtime controls and governance
fields.

Use `scripts/validate-agent-registry-schema.mjs` to validate the schema and the
minimal example in `examples/agent-registry-entry.valid.json`.
