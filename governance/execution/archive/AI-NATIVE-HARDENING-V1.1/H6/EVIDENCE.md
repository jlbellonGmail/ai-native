# EVIDENCE

## Governance Evidence

* `governance/security/TARGET-REPO-SECURITY-CHECKLIST.md`
* `governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md`
* `governance/execution/current/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H6/`
* `specs/hardening-v1.1-h6-target-repo-security-validation/`

## Product Evidence

`ai-foundation` product commit:

```text
74611a7 feat(security): add target repository security validation
```

Key files:

* `security/target-repo-validation.md`
* `security/target-repo-validation.contract.json`
* `scripts/validate-target-repo-security.mjs`

`ai-template` product commit:

```text
cf3bf9c feat(template): add target repository security bootstrap validation
```

Key files:

* `docs/security/SECURITY-BOOTSTRAP.md`
* `scaffolds/ai-native-app/files/docs/security/SECURITY-BOOTSTRAP.md`
* `templates/project/docs/security/SECURITY-BOOTSTRAP.md`
* `scripts/validate-security-bootstrap.mjs`
* `scaffolds/ai-native-app/files/ai-native.project.json`
* `scripts/validate-generated-project.mjs`

## Inspector Evidence

* H6 scope only: PASS.
* No `VERSION` changes: PASS.
* No remote mutation or push: PASS.
* No H7/H8 opening: PASS.
* Remote control PASS assumptions rejected: PASS.

## HITL

```text
H6: CLOSED_LOCALLY
Human approval: REQUIRED
HITL approved: NO
H7 opened: NO
H8 opened: NO
```

## Push

```text
NOT_PUSHED_BY_POLICY
```
