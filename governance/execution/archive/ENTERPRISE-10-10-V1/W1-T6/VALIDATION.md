# W1-T6 Validation

## Validation Scope

Validation covered W1-T6 supply chain configuration, artifact safety controls, governance boundaries, local execution, remote workflow execution, and the accepted platform limitation.

## Commands Executed

1. Read required governance sources.
2. Confirmed W1-T6 is the next eligible task.
3. Confirmed W1-T2 through W1-T5 were completed for `ai-foundation`.
4. Inspected existing `ai-foundation` security workflows.
5. Validated `ai-foundation` Git status with explicit `safe.directory`.
6. Added W1-T6 workflow and documentation.
7. Performed static workflow validation.
8. Ran `pnpm typecheck`.
9. Ran `pnpm build`.
10. Validated `pnpm install --frozen-lockfile`.
11. Validated remote GitHub Actions execution from HITL-confirmed results.
12. Performed governance boundary validation.

## Results

- Active task: W1-T6 only.
- Affected product repository: `ai-foundation`.
- Workflow added: `.github/workflows/supply-chain.yml`.
- Documentation added: `docs/security/supply-chain.md`.
- `pnpm-workspace.yaml` added as tracked configuration for `allowBuilds`.
- Provenance action: `actions/attest@v4`.
- Artifact verification: SHA-256 checksum before upload and before attestation.
- Sensitive path exclusions configured: `.git`, `.supply-chain`, `.env`, `.env.*`, `node_modules`, `.next`, `logs`, `coverage`, `dist`, `build`, `tmp`, `*.log`, `*.tsbuildinfo`.
- Pull request fork risk handled by running attestation only on `push`, `workflow_dispatch`, or same-repository pull requests.
- Static workflow control check passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed.
- `pnpm install --frozen-lockfile`: passed.
- Remote workflow execution: passed.
- Artifact Verification: passed.
- Artifact checksum verification: passed.
- Supply-chain pipeline: functional.
- Provenance configuration: valid.
- Artifact attestation persistence: blocked by GitHub platform limitation for user-owned private repositories.
- Version files not changed.
- Commit, push, versioning, and Engram not executed.

## Residual Risk

- GitHub-hosted attestation persistence is unavailable for this private user-owned repository under the current plan/configuration.
- The repository was not converted to public by HITL decision.
- Artifact attestation persistence remains a platform limitation until repository visibility, ownership, or GitHub plan/settings change.
- `pnpm` required elevated local execution because sandboxed execution could not read the local pnpm user config.

## Status

Validation completed for local and remote workflow integrity.

W1-T6 is closed with accepted platform limitation.
