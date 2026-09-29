# Target Repository Security Validation

Roadmap task: `AI-NATIVE-HARDENING-V1.1/H6`

This procedure makes security validation repeatable for a future real project
repository. It extends the W1 security baseline without assuming that local
factory checks prove remote GitHub behavior in a client or project repository.

## Inputs

Required inputs for a target repository review:

* repository URL and default branch;
* owner or accountable reviewer;
* generated project manifest;
* local validation command output;
* dependency manifests and lockfiles when present;
* links to GitHub security workflow runs when remote checks are available.

## Baseline Controls

Use these existing W1 controls as the baseline:

| Control | W1 Source | Target Evidence |
|---|---|---|
| SBOM | `W1-T3` | SBOM command, artifact, checksum and parser result. |
| Dependency Review | `W1-T4` | Pull request check run and decision. |
| Dependabot | `W1-T5` | Configuration plus enablement or observed run evidence. |
| Supply-chain attestation | `W1-T6` | Workflow run, subject artifact and verification result. |
| Security audit | `W1-T7` | Final checklist tying all controls to evidence. |

Reference product map:
`security/enterprise-10-10/security-audit-final.json`.

## Procedure

1. Confirm the target repository was created from an approved AI-Native template
   or records equivalent local governance files.
2. Run local project validation and record the command output.
3. Review dependency manifests and lockfiles.
4. Run or review Dependency Review on a dependency-changing pull request.
5. Confirm Dependabot configuration and remote enablement evidence.
6. Generate or retrieve SBOM evidence and record checksum information.
7. Verify attestation evidence when the platform supports it.
8. Record any GitHub plan, ownership or visibility limitation explicitly.
9. Prepare a final target security evidence package for Inspector review.

## Evidence Status Rules

Use only these statuses:

* `PASS`: a command or remote check ran and passed.
* `FAIL`: a command or remote check ran and failed.
* `NOT_RUN`: the check is expected but was not executed.
* `NOT_APPLICABLE`: the check is outside the target repository scope.
* `CONTEXTUAL_NON_BLOCKING`: a limitation is documented and accepted when HITL
  is required.

Do not mark Dependency Review, Dependabot or attestations as `PASS` from local
file presence alone. Those controls require target repository evidence.

## Security Notes

This procedure does not require credentials and does not modify remotes. It is
safe to run as a documentation and static validation pass. Remote checks are
collected as evidence only after the target repository owner authorizes them.

## Validate This Procedure

Run from `ai-foundation`:

```bash
node scripts/validate-target-repo-security.mjs
```
