# W1-T7 Evidence

Mandatory sources reviewed:
- `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`
- `governance/SESSION-CONTEXT.md`
- `governance/versioning/VERSIONING-POLICY.md`
- `governance/standards/TASK-EXECUTION-STANDARD.md`

Local security control evidence:

## W1-T1 CodeQL

Status:
PASS

Evidence:
- Roadmap marks W1-T1 completed on 2026-06-05.
- `ai-foundation/.github/workflows/codeql.yml` exists.
- Workflow uses `github/codeql-action/init@v3` and `github/codeql-action/analyze@v3`.
- Queries include `security-extended` and `security-and-quality`.
- Workflow grants `security-events: write` for SARIF/security results.

## W1-T2 Trivy

Status:
PASS

Evidence:
- Roadmap marks W1-T2 completed on 2026-06-06.
- Archive exists at `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T2/`.
- Archived summary records filesystem and dependency scans with 0 HIGH and 0 CRITICAL findings.
- `ai-foundation/.github/workflows/trivy.yml` exists.
- Workflow includes filesystem scan, dependency scan, HIGH/CRITICAL severity filter, and SARIF upload.

Limitation:
Trivy was not re-executed during W1-T7 because `trivy` is not installed locally.

## W1-T3 SBOM

Status:
PASS

Evidence:
- Roadmap marks W1-T3 completed on 2026-06-07.
- Archive exists at `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T3/`.
- Archived summary records reproducible CycloneDX validation.
- `ai-foundation/.github/workflows/sbom.yml` exists.
- Workflow generates two SBOM runs, normalizes them, validates package consistency, compares normalized hashes, and uploads one CI artifact.

## W1-T4 Dependency Review

Status:
PASS_WITH_ACCEPTED_RISK

Evidence:
- Roadmap marks W1-T4 completed on 2026-06-08.
- Archive exists at `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T4/`.
- `ai-foundation/.github/workflows/dependency-review.yml` exists.
- `ai-foundation/.github/dependency-review-config.yml` exists.
- Workflow uses `actions/dependency-review-action@v4` and references the policy config.
- Policy fails on high severity, runtime/development/unknown scopes, vulnerability checks, license checks, and GPL/AGPL/LGPL deny list.

Accepted risk:
GitHub Dependency Review runtime was not executed remotely during original closure and that risk was accepted.

## W1-T5 Dependabot

Status:
PASS_WITH_ACCEPTED_RISK

Evidence:
- Roadmap marks W1-T5 completed on 2026-06-08.
- Archive exists at `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T5/`.
- `ai-foundation/.github/dependabot.yml` exists.
- Configuration includes weekly npm dependency updates and weekly GitHub Actions updates.
- Configuration includes PR limits, labels, grouping for production/development dependencies, and semantic commit prefixes.
- Roadmap records canonical lockfile as `pnpm-lock.yaml`.

Accepted risk:
Dependabot remote runtime was not executed during original closure and that risk was accepted.

## W1-T6 Supply Chain Security

Status:
PASS_WITH_ACCEPTED_PLATFORM_LIMITATION

Evidence:
- Roadmap marks W1-T6 completed on 2026-06-09.
- Archive exists at `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T6/`.
- Archived summary records remote Artifact Verification PASS and remote artifact checksum verification PASS.
- `ai-foundation/.github/workflows/supply-chain.yml` exists.
- Workflow packages a source artifact, excludes unsafe/generated paths, verifies SHA-256 checksum, uploads artifact, and uses `actions/attest@v4`.
- `ai-foundation/pnpm-workspace.yaml` explicitly allows `sharp` build scripts.

Accepted platform limitation:
GitHub artifact attestation persistence is not available under the current private user-owned repository plan/configuration. HITL accepted the limitation during W1-T6 closure.

Final W1-T7 assessment:
APTA

