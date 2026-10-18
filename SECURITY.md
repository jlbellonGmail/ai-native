# Security policy

`ai-native` is a proprietary, All Rights Reserved platform (see `LICENSE`). The code is public so it can be read and audited; that grants no right to use it.

## Reporting a vulnerability

Do **not** open a public issue or PR for a vulnerability.

Report it privately to the repository owner (`@jlbellonGmail`): use GitHub's *Security → Report a vulnerability* if it is enabled for the repository, otherwise contact the owner through their GitHub profile. Include the affected commit or release, a reproduction, and the impact you observed.

## Supported versions

Only the latest published release of the v3 line receives fixes. Pre-releases (`-alpha`, `-rc`) are not supported. A release that is later found to be unsafe is listed in the attested revocations (`governance/versioning/revocations-*.json`) and `ai-native status` reports it as `REVOKED`.

## What is in scope

- The gates and their trust boundary (`runtime/gates/`, `.github/workflows/`, `governance/gates/`, `governance/rulesets/`).
- The bootstrap, cache and release chain (digest, SBOM, sigstore attestation, revocations).
- The MCP gateway and policy engine (default deny).
- Secrets handling for the GitHub Apps (`governance/security/SECRETS-BOUNDARY.md`).

## How the repository defends itself

- Merges to `main` need a PR plus the required checks; the verdict checks are emitted by a separate GitHub App, not by the PR's own workflows.
- A change to the control plane is never auto-approved: `trust-gate` concludes `neutral` and `merge-gate` blocks it until a human approves in the `ai-native-human-review` Environment.
- App credentials live only in Environments restricted to `main`, never in repository secrets.
- Workflow actions are pinned by full commit SHA, checked in CI and enforced by the repository setting `sha_pinning_required` (enabled 2026-10-04; a workflow that uses an unpinned action fails to run).

Known limits are stated honestly in `governance/security/HITL-MERGE-POLICY.md` and `governance/security/SECRETS-BOUNDARY.md`.
