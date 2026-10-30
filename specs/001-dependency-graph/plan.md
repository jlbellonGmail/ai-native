# Plan — dependency graph

## Strategy

Implement a JSON schema and explicit semantic validator in `contracts/`, then a
pure dependency graph library in `runtime/acceptance/`. JSON reuses existing
contract conventions and supports deterministic parsing without new packages.
`schema-lite` is insufficient alone for uniqueness/reference constraints, so
semantic validation is mandatory. A manifest remains consumer/project-owned;
the library only reads it.

## Requirements coverage

| Requirement | Change and discarded alternative |
|---|---|
| RF-1, RF-2, NF-1 | Schema plus semantic validation; discarded schema-only validation because current lightweight validator omits required keywords/reference resolution. |
| RF-3, RF-4, RF-6 | Pure graph construction with sorted IDs/edges and DFS cycle diagnostics; discarded insertion-order behavior because it is not reproducible. |
| RF-5, RF-7, RF-8 | Explicit public-change declaration `{ providerId, contractId, previousRef, candidateRef, compatibility }`, validated against the manifest contract registry, selects consumers; discarded source-diff heuristics/LLM classification because impact must be declared and auditable. `unknown` is conservative; only declared internal change has no public impact. |
| NF-2 | Structured bounded diagnostics; discarded raw input/log echoing. |

## Probable files after approval

`contracts/dependency-manifest.schema.json`, contract registry validation,
`runtime/acceptance/{manifest,graph}.mjs` and focused `*.test.mjs`; pilot fixture
manifests only. No generated adapters, consumer projects or CI workflow changes.

## Test strategy and rollback

TDD fixtures cover valid DAG, duplicates, missing module/contract, mismatch,
cycle, ordering, direct/transitive/reverse resolution and internal/public impact.
Change-declaration negatives cover forged owner, unknown contract, same
before/after reference and invalid compatibility; positives cover compatible,
incompatible and conservative unknown classifications.
Run focused Node tests, contracts/core validators and applicable full suite. The
feature is additive and rollback is removal of its unreferenced files.

## Risks

Contracts are control-plane paths and force the existing human plan gate. Contract
references are opaque stable strings rather than guessed SemVer semantics.
