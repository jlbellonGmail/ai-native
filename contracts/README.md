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
| `lock.schema.json` | `ai-native.lock.json`, the one file that pins a consumer to an exact platform release, profiles, packs and overrides | the bump bot / `ai-native init` | `runtime/bootstrap/cli.mjs`, `pr-gate` |
| `platform.schema.json` | `platform.json`, the release manifest published as an asset of every `ai-native` release | `release.yml` | `runtime/bootstrap/cli.mjs` (verify), `doctor` |
| `pack.schema.json` | a domain pack's own manifest (e.g. `gi-platform-core`'s `ai-pack/`) | the pack owner's repo | `runtime/bootstrap/cli.mjs`, `migrate-inventory.mjs` (DUPLICATED_CAPABILITY cross-check, future) |
| `profile.schema.json` | a platform profile (`python-lib`, `supabase-service`, `static-site`, `factory`, …) | `profiles/*.json` in this repo | `runtime/bootstrap/cli.mjs`, `pr-gate`, `trust-gate` |
| `unit-event.schema.json` | one line of a Work Unit's `events.jsonl` (append-only; `unit.json` is the derived view, never stored) | `runtime/circuit/*` | `ai-native status`, `review run`, gates |
| `sdd-levels.schema.json` + `sdd-levels.json` | the LIGHT/STANDARD/FULL contract: steps, required artifacts, convergence budget | this repo (data) | `runtime/circuit/assess`, `runtime/circuit/contract` |
| `state-machine.schema.json` + `state-machine.json` | the Work Unit state machine: states, transitions, preconditions | this repo (data) | `runtime/circuit/*` |
| `assess-rules.schema.json` + `assess-rules.json` | ASSESS signal weights, breadth rules and score thresholds (M3.2) | this repo (data) | `runtime/circuit/assess` |
| `sdd-workflow.schema.json` + `sdd-workflow.json` | the conceptual SDD model: roles (Coordinator/Planner/Implementer/Reviewer -> runtime role), work units (Task/Feature/Milestone), levels (light/normal/full), modes and the `/feature` + `/sdd-*` command catalog | this repo (data) | `runtime/circuit/sdd-workflow`, `runtime/adapters/commands` |
| `lock.schema.json` `governance.allowNone` | optional per-repository opt-in so a low-risk work unit may declare `human_gate: none`; absent = off; read from the base ref's lock |
| `hitl-policy.schema.json` + `hitl-policy.json` | which human gate (`required` / `final-only` / `none`) a work unit may declare for its risk; `none` is explicit (`human_gate: none` + `autonomy: full`) and never lifts branch protection or release policy (`runtime/policy/hitl.mjs`); the gate is derived from the diff, the base control-plane config and the profile's `governance.allowNone`, never self-declared |
| `constitution-extension.schema.json` + `constitution-extension.json` | the central constitution is the default for every consumer; a project may add a small additions-only extension, overrides are rejected (`runtime/policy/constitution-extension.mjs`) |
| `architecture.schema.json` | optional per-project boundaries: layers and dependency direction, module public contracts, forbidden imports (`runtime/policy/architecture.mjs`) |
| `knowledge-package.schema.json` + `../knowledge/sdd/KNOWLEDGE.json` | version descriptor of a knowledge package shipped in the release (schemaVersion, package version, required workflow contract and minimum platform); a consumer that cannot satisfy it gets an explicit `INCOMPATIBLE_VERSION` | this repo (data) | `runtime/consumer/knowledge` |
| `work-unit-manifest.schema.json` | `work-unit.json`, a Milestone's grouped-items manifest (+ optional task DAG) (M3.2) | `runtime/circuit/start-unit` | `runtime/circuit/identity`, `runtime/circuit/contract` |
| `skills-registry.schema.json` | `.agents/skills/registry.json`, profile/role/level applicability per skill (M3.3) | this repo (data) | `runtime/adapters/skills` |
| `result-status.schema.json` | the PASS/PASS_WITH_WARNINGS/FAIL/ERROR/NOT_RUN/NOT_APPLICABLE envelope every gate returns | every validator/gate | CI, `ai-native status` |
| `audit-report.schema.json` | a `.audit/reports/*.md` report's required front matter | the `audit` skill | `release-gate`, `ai-native status` |
| `eval-result.schema.json` | one evaluation result (L1/L2/L3), extends TEMPLATE v2.0.5's `agentic-eval-result.schema.json` | the evaluation harness (M4.6) | `release-gate`, `compat-matrix` |
| `waiver.schema.json` | `waivers.json`, a time-boxed exception to a control | a human, via PR | `pr-gate` |
| `plan-approval-receipt.schema.json` | `plan-approval-receipt.json`, evidence that the owner approved an exact set of SDD plan documents at an exact PR head SHA through the dedicated Environment `ai-native-plan-approval`; valid only together with its provenance (the real artifact of the trusted run: digest, bytes and content checked against GitHub, a registered workflow revision, and the identity of the configuration recorded in `trustedConfig`, which the consumer re-reads from `main`) | `.github/workflows/plan-approval-receipt.yml` (from `main`) | `runtime/gates/plan-approval-receipt.mjs` (the Coordinator will consume it later) |
| `revocations.schema.json` | `revocations-<n>.json`, the signed list of revoked platform/pack releases | `release.yml` | `runtime/bootstrap/cli.mjs`, `pr-gate` |
| `roadmap.md` | the ROADMAP.md contract (states, item id shapes) — prose, not JSON; ROADMAP is markdown, not data | — | `runtime/circuit/identity` |
| `run-layout.md` | the `runs/<unit>/` directory layout contract (M3.2) — prose, not JSON | — | `runtime/circuit/*` |

## Provenance

`unit-event.schema.json`, `platform`-adjacent ideas and the role/model/MCP/
security-policy shapes consolidate and extend TEMPLATE v2.0.5's
`.agentic/schemas/*.json` (imported read-only at `template@v2.0.5:.agentic/schemas/`,
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
