# Dependency graph

Status: draft
human_gate: required
autonomy: full

## Goal

Provide one versioned, declarative source of truth for public modules, contracts
and their dependencies so AI-NATIVE can resolve provider/consumer impact without
LLM inference.

## Definitions

* **module**: a canonically identified provider or consumer.
* **contract**: a public, versioned/referenced interface owned by a module.
* **dependency**: a consumer-owned reference to a provider module and contract.
* **public contract change declaration**: an explicit, validated record identifying
  one owned contract, its prior and candidate immutable references, and its
  compatibility classification (`compatible`, `incompatible` or `unknown`).

## Requirements

RF-1. THE SYSTEM SHALL validate a versioned JSON dependency manifest with stable
module IDs, contract IDs/references and explicit dependencies.

RF-2. IF a manifest has duplicate IDs, unknown modules/contracts, invalid
references or ambiguous declarations, THEN THE SYSTEM SHALL reject it with a
deterministic diagnostic.

RF-3. IF dependency edges contain a cycle, THEN THE SYSTEM SHALL reject the
manifest and identify the cycle.

RF-4. THE SYSTEM SHALL resolve direct/transitive providers and consumers,
reverse edges, affected contracts and a stable topological module order.

RF-5. WHEN a provider contract is identified as changed, THE SYSTEM SHALL
produce a deterministic, de-duplicated impact set of known consumers and their
required cross checks; an internal-only change shall not imply a public-contract
impact.

RF-6. THE SYSTEM SHALL serialize equivalent input in a reproducible order and
shall never infer or write dependencies.

RF-7. THE SYSTEM SHALL accept a public contract change only when its provider,
contract ID, previous reference, candidate reference and compatibility
classification are declared; it shall reject an unknown owner, unchanged
reference, unrecognized classification or a declaration that names a contract
outside the provider's public contract registry.

RF-8. WHEN a public contract change declaration is valid, THE SYSTEM SHALL
identify its exact affected contract and select impact from that declaration;
`unknown` compatibility shall require the same consumer checks as
`incompatible`, while an explicitly internal change shall select none.

## Non-functional requirements

NF-1. Validation is fail-closed and dependency-free.
NF-2. Diagnostics contain no secret values and are safe for evidence reports.

## Non-goals

No consumer repository is modified. No dependency is guessed for Currency.
No acceptance command, CI gate or migration behavior is added by this feature.

## Acceptance criteria

Valid Locales -> Regions -> Countries sample manifests and public change
declarations resolve reproducibly; unknown references, duplicates, cycles,
contract mismatches and invalid/deceptive change declarations fail; the same
logical input yields the same graph/impact/topological output.
