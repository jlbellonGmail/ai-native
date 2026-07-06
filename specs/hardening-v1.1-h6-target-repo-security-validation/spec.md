# HARDENING-V1.1 H6 - Target Repository Security Validation Spec

Related Governance Task: AI-NATIVE-HARDENING-V1.1/H6
Related Roadmap: governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md

## Objective

Define repeatable security validation for a future real AI-Native project
repository.

## Engineering Purpose

Close the gap between local factory security posture and target repository
security evidence, especially for GitHub controls that depend on repository
ownership, visibility, plan, settings or real pull request/runtime events.

## Affected Repositories

* root/governance for checklist, SDD and closure evidence.
* `ai-foundation` for reusable target repository validation procedure and
  static validator.
* `ai-template` for project bootstrap security documentation and generated
  project validation.

## Expected Files Or Areas

* `governance/security/TARGET-REPO-SECURITY-CHECKLIST.md`
* `ai-foundation/security/target-repo-validation.md`
* `ai-foundation/security/target-repo-validation.contract.json`
* `ai-foundation/scripts/validate-target-repo-security.mjs`
* `ai-template/docs/security/SECURITY-BOOTSTRAP.md`
* `ai-template/scaffolds/ai-native-app/files/docs/security/SECURITY-BOOTSTRAP.md`
* `ai-template/templates/project/docs/security/SECURITY-BOOTSTRAP.md`
* `specs/hardening-v1.1-h6-target-repo-security-validation/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H6/`

## Non-Goals

* Do not open H7 or H8.
* Do not modify remotes, credentials, GitHub settings or remote workflows.
* Do not mark Dependency Review, Dependabot or attestations as local `PASS`.
* Do not create a real client repository.
* Do not modify `VERSION` files.
* Do not reopen H1 through H5.

## Acceptance Criteria

* AC-001: Target repository security checklist exists and defines auditable
  evidence requirements.
* AC-002: `ai-foundation` provides a reusable target repository validation
  procedure and static validator.
* AC-003: Dependency Review, Dependabot, SBOM and attestation evidence rules are
  explicit.
* AC-004: `ai-template` generated project assets include security bootstrap
  guidance.
* AC-005: Local validation rejects remote PASS assumptions from local file
  presence alone.
* AC-006: H1 through H5 remain closed and H7/H8 remain not opened.

## Expected Validations

* `node scripts/validate-target-repo-security.mjs`
* `node scripts/validate-enterprise-10-10.mjs`
* `node scripts/validate-security-bootstrap.mjs`
* `node scripts/validate-generated-project.mjs`
* `node scripts/validate-create-ai-native-app.mjs`
* `node sdd/validation/validate-sdd-package.mjs`
* `git diff --check`

## Risks

* Remote GitHub behavior cannot be proven from local files.
* Target repositories may have platform limitations for private user-owned
  repositories, Dependabot visibility or attestation persistence.
* Generated project documentation must remain self-contained.
