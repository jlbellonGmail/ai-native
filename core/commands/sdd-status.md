Target: specs/$ARGUMENTS (omit to list every folder under `specs/`)

You are the Coordinator. Read-only: modify nothing. Derive state from the artifacts and Git, never from memory or chat.

Answer with exactly five lines: STATE, PROGRESS, LAST COMPLETED, NEXT (the exact command to run) and BLOCKERS. Never write a status file.
The deterministic derivation is `deriveSddStatus` + `formatSddStatus` in `runtime/circuit/sdd-workflow.mjs`.
