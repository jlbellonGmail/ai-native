# contracts/ — M2.1

JSON Schema (2020-12) for every data shape the AI-Native v3 platform and its
consumers exchange. Each schema has its own `schemaVersion` (an integer
inside the data, not the `$id`/filename), per
`governance/versioning/VERSIONING-POLICY.md`: a MAJOR of the platform can
bump `schemaVersion` with a breaking change; a MINOR can only add optional
fields; a consumer on `schemaVersion` N or N-1 must still be readable.

## Inventory

| File | Describes | Produced by | Consumed by |
|---|---|---|---|
| `lock.schema.json` | `ai-native.lock.json`, the one file that pins a consumer to an exact platform release, profiles, packs and overrides | the bump bot / `ai-native init` | `bootstrap.ps1`, `pr-gate` |
| `platform.schema.json` | `platform.json`, the release manifest published as an asset of every `ai-native` release | `release.yml` | `bootstrap.ps1` (verify), `doctor` |
| `pack.schema.json` | a domain pack's own manifest (e.g. `gi-platform-core`'s `ai-pack/`) | the pack owner's repo | `bootstrap.ps1`, `migrate-inventory.mjs` (DUPLICATED_CAPABILITY cross-check, future) |
| `profile.schema.json` | a platform profile (`python-lib`, `supabase-service`, `static-site`, `factory`, …) | `profiles/*.json` in this repo | `bootstrap.ps1`, `pr-gate`, `trust-gate` |
| `unit-event.schema.json` | one line of a Work Unit's `events.jsonl` (append-only; `unit.json` is the derived view, never stored) | `runtime/circuit/*` | `ai-native status`, `review run`, gates |
| `sdd-levels.schema.json` + `sdd-levels.json` | the LIGHT/STANDARD/FULL contract: steps, required artifacts, convergence budget | this repo (data) | `runtime/circuit/assess`, `runtime/circuit/contract` |
| `state-machine.schema.json` + `state-machine.json` | the Work Unit state machine: states, transitions, preconditions | this repo (data) | `runtime/circuit/*` |
| `result-status.schema.json` | the PASS/PASS_WITH_WARNINGS/FAIL/ERROR/NOT_RUN/NOT_APPLICABLE envelope every gate returns | every validator/gate | CI, `ai-native status` |
| `audit-report.schema.json` | a `.audit/reports/*.md` report's required front matter | the `audit` skill | `release-gate`, `ai-native status` |
| `eval-result.schema.json` | one evaluation result (L1/L2/L3), extends TEMPLATE v2.0.5's `agentic-eval-result.schema.json` | the evaluation harness (M4.6) | `release-gate`, `compat-matrix` |
| `waiver.schema.json` | `waivers.json`, a time-boxed exception to a control | a human, via PR | `pr-gate` |
| `revocations.schema.json` | `revocations-<n>.json`, the signed list of revoked platform/pack releases | `release.yml` | `bootstrap.ps1`, `pr-gate` |
| `roadmap.md` | the ROADMAP.md contract (states, item id shapes) — prose, not JSON; ROADMAP is markdown, not data | — | `runtime/circuit/identity` |

## Provenance

`unit-event.schema.json`, `platform`-adjacent ideas and the role/model/MCP/
security-policy shapes consolidate and extend TEMPLATE v2.0.5's
`.agentic/schemas/*.json` (imported read-only at `legacy/template-v2/.agentic/schemas/`,
AGT-09 in `parity/v2.0.5/capabilities.json`). Where a v2 schema's shape is
reused close to verbatim, the file says so in its `description`.

## Validation

`contracts/validate-contracts.mjs`: structural, dependency-free validator
(checks `type`/`required`/`enum`/`pattern`/`const` — the subset these
schemas actually use; not a full JSON Schema implementation). Validates
every `*.schema.json` file is well-formed, and every `*.json` data file
(`sdd-levels.json`, `state-machine.json`) against its schema. A future
phase may adopt `ajv` once contracts stabilize and schema complexity grows
past what the structural checker can express (`not`/`oneOf`/`$ref` across
files are not supported yet).
