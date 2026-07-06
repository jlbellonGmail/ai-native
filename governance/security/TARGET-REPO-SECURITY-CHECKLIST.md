# Target Repository Security Checklist

Roadmap task: `AI-NATIVE-HARDENING-V1.1/H6`

Use this checklist after a real AI-Native project repository is created from the
factory template. It defines the minimum evidence required before a target
repository can claim security validation.

## Required Local Evidence

The target repository must provide:

* project `AGENTS.md` and local execution skills;
* local SDD evidence for the feature being validated;
* generated project manifest with security validation metadata;
* local validation command output;
* dependency manifest and lockfile evidence when dependencies exist;
* security bootstrap notes reviewed by the project owner.

## Required GitHub Evidence

The target GitHub repository must provide evidence for:

* CodeQL or equivalent static analysis;
* dependency review on a pull request that changes dependencies;
* Dependabot configuration and at least one observed run or enablement record;
* SBOM generation or a documented SBOM command;
* artifact attestation or a documented platform limitation;
* repository security settings reviewed by the owner.

## Dependency Review Procedure

1. Open a pull request that changes a dependency manifest or lockfile.
2. Confirm the Dependency Review workflow runs in the target repository.
3. Record the workflow URL, commit SHA, decision and any reviewed advisories.
4. If Dependency Review cannot run because of repository visibility, plan or
   provider limitations, record the limitation as `CONTEXTUAL_NON_BLOCKING` only
   when HITL accepts it.

## Dependabot Procedure

1. Confirm the target repository contains a dependency update configuration.
2. Confirm dependency ecosystem, directories and schedule match the project.
3. Record the GitHub settings or bot activity that proves Dependabot is enabled.
4. Do not mark Dependabot `PASS` from local file presence alone.

## SBOM And Attestation Procedure

1. Generate or retrieve an SBOM for the target repository.
2. Record the command, artifact name, checksum and storage location.
3. For attestations, record the workflow run, subject artifact, predicate type
   and verification command.
4. If hosted attestation persistence is unavailable, record the platform
   limitation and the fallback verification path.

## Status Rules

Allowed security evidence statuses:

* `PASS`: command or remote check ran and passed.
* `FAIL`: command or remote check ran and failed.
* `NOT_RUN`: expected check was identified but not executed.
* `NOT_APPLICABLE`: the check does not apply to this target repository.
* `CONTEXTUAL_NON_BLOCKING`: a limitation exists and is documented with HITL
  acceptance when required.

Local configuration files alone are never sufficient evidence for remote GitHub
controls.

## W1 Reference Controls

Use the existing `ENTERPRISE-10-10` W1 security artifacts as the baseline:

* `ai-foundation/security/enterprise-10-10/security-audit-final.json`
* `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T3/`
* `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T4/`
* `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T5/`
* `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T6/`
* `governance/execution/archive/ENTERPRISE-10-10-V1/W1-T7/`
