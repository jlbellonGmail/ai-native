# HARDENING-V1.1 H6 - Security Notes

Security review required: Yes.

## Decision

H6 is a security governance and validation task. It introduces no credentials,
remote mutations or runtime permissions. Its main security requirement is to
prevent false local `PASS` claims for target repository controls that require
remote evidence.

## Security By Design

* Trust boundary: factory-local evidence is distinct from target GitHub
  repository evidence.
* Sensitive data: no secrets or tokens are required.
* Auth/authz: no permissions are granted or changed.
* Dependency impact: no dependencies are added.
* Generated project impact: generated projects receive bootstrap guidance and
  manifest metadata.

## DevSecOps

H6 documents Dependency Review, Dependabot, SBOM and attestation evidence
requirements. It does not execute remote CI or GitHub configuration changes.

## Risk Register

Risk: remote controls cannot be proven locally.

Severity: Medium.

Mitigation: require target repository evidence and use `CONTEXTUAL_NON_BLOCKING`
only with documented limitation and HITL acceptance when closure depends on it.

## Final Security Status

Status: PASS

Reason: H6 strengthens validation discipline and explicitly rejects local-only
remote security PASS claims.
