# runs/<unit>/ layout contract

STA-02 (M3.2, `PAR-RUNS`): the directory layout is local to each
consumer (`LOCAL_BY_DESIGN`, same as `ROADMAP.md`'s content,
`contracts/roadmap.md`), but the file names and their shapes are central
and shared, enforced by `runtime/circuit/*` rather than redeclared by
each consumer.

## Path

`runs/<slug>` for a Feature or Maintenance unit, `runs/milestone-<slug>`
for a Milestone, each optionally prefixed by `<version>/` when the
platform versions runs per release
(`runtime/circuit/identity.mjs#getWorkUnitInfo`).

## Files

| File | Required when | Schema / contract |
|---|---|---|
| `events.jsonl` | always, from the first event onward | `contracts/unit-event.schema.json` (append-only, hash-chained; `runtime/circuit/events.mjs`) |
| `work-unit.json` | Milestone only | `contracts/work-unit-manifest.schema.json` |
| `SUMMARY.md` | always (every SDD depth requires it) | `contracts/sdd-levels.json` + the 7-section/6-field contract, `runtime/circuit/contract.mjs#checkSummaryContract` |
| `spec.md` | STANDARD, FULL | `levels.<depth>.requiredArtifacts` in `contracts/sdd-levels.json` |
| `plan.md`, `tasks.md`, `decision.md` | FULL | `levels.<depth>.requiredArtifacts` in `contracts/sdd-levels.json` |

There is no separate `sdd.json`, `assess.jsonl`, `convergence.json` or
`model-routing.jsonl` in v3 (TEMPLATE v2.0.5 had one file per machine
concern): `events.jsonl`'s `assess`/`converge`/`routing` event types
replace them (`contracts/unit-event.schema.json`), and `unit.json` --
the current derived state -- is never written to disk at all
(`runtime/circuit/state-machine.mjs#deriveState` recomputes it from
`events.jsonl` on demand, same reasoning as `runtime/status`'s derived
STATUS view, M3.1).

## What this contract does not cover yet

Legacy-mode runs (no `events.jsonl`, pre-dating the adaptive SDD
contract) keep their TEMPLATE v2.0.5 file set
(`decision.md`/`spec.md`/`plan.md`/`tasks.md`/`audit-N.md`/
`test-report-N.md`/`code-review-N.md`/`SUMMARY.md`) for historical
reads only (`runtime/circuit/contract.mjs#LEGACY_EVIDENCE_CONTRACT`,
`#parseLegacyVerdictArtifact`); nothing new is ever written in that
shape.
