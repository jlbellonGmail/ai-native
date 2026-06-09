# W1-T6 Evidence

## Evidence Summary

W1-T6 implemented supply chain security controls for `ai-foundation` and was validated locally and remotely.

## Provenance

Evidence source:

- `ai-foundation/.github/workflows/supply-chain.yml`

The workflow uses GitHub artifact attestations through `actions/attest@v4` and grants the attestation job:

- `contents: read`
- `id-token: write`
- `attestations: write`
- `artifact-metadata: write`

Remote result:

- Provenance configuration validated.
- Remote artifact attestation persistence failed due to GitHub platform limitation:
  `Feature not available for user-owned private repositories. To enable this feature, please make this repository public.`

## Artifact Verification

Evidence source:

- `ai-foundation/.github/workflows/supply-chain.yml`
- `ai-foundation/docs/security/supply-chain.md`

The workflow creates `ai-foundation-source-${{ github.sha }}.tar.gz`, writes a SHA-256 checksum, and verifies the checksum before attestation.

Local validation:

- Static workflow control check: passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `pnpm install --frozen-lockfile`: passed.

Remote validation:

- Workflow executed correctly.
- Artifact Verification: passed.
- Artifact checksum verification: passed.
- Supply-chain pipeline: functional.

## SLSA Readiness

Evidence source:

- `ai-foundation/docs/security/supply-chain.md`

The documented verification path is:

```bash
gh attestation verify ai-foundation-source-<sha>.tar.gz -R <owner>/<repo>
```

Offline verification is also documented through `gh attestation download`, `gh attestation trusted-root`, and `gh attestation verify --bundle --custom-trusted-root`.

## Governance Evidence

- W1-T6 remained the only active task.
- HITL approved W1-T6 closure.
- Governance closure performed with accepted platform limitation.
- Evidence archived to `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T6/`.
- No version, commit, push, release, or Engram action was executed.
