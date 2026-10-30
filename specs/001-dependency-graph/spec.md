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

## Non-functional requirements

NF-1. Validation is fail-closed and dependency-free.
NF-2. Diagnostics contain no secret values and are safe for evidence reports.

## Non-goals

No consumer repository is modified. No dependency is guessed for Currency.
No acceptance command, CI gate or migration behavior is added by this feature.

## Acceptance criteria

Valid Locales -> Regions -> Countries sample manifests resolve reproducibly;
unknown references, duplicates, cycles and contract mismatch fixtures fail; the
same logical input yields the same graph/impact/topological output.
