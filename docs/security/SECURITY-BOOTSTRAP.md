# Security Bootstrap

Roadmap task: `AI-NATIVE-HARDENING-V1.1/H6`

Use this guide when a generated AI-Native project becomes a real target
repository. Local template files prepare the project, but remote GitHub controls
must be validated in the target repository before they are marked `PASS`.

## Required Review

Before declaring a target repository security-ready, collect:

* local project validation output;
* repository owner and reviewer;
* dependency manifest and lockfile evidence;
* Dependency Review pull request result;
* Dependabot enablement or observed run evidence;
* SBOM artifact, checksum and parser result;
* attestation verification result or documented platform limitation.

## Local Project Command

Run from the generated project:

```bash
npm run validate
```

This proves the local project structure. It does not prove remote Dependency
Review, Dependabot or hosted attestation behavior.

## Remote Evidence Rules

Allowed statuses are `PASS`, `FAIL`, `NOT_RUN`, `NOT_APPLICABLE` and
`CONTEXTUAL_NON_BLOCKING`.

Do not mark a remote control as `PASS` unless the target repository produced a
real run, setting record or verification result. If the platform cannot provide
the evidence, record the limitation and require HITL acceptance when closure
depends on it.

## References

* `governance/security/TARGET-REPO-SECURITY-CHECKLIST.md`
* `ai-foundation/security/target-repo-validation.md`
* `ai-foundation/security/enterprise-10-10/security-audit-final.json`
