# EVIDENCE

## Governance Evidence

* `governance/SESSION-CONTEXT.md`
* `governance/roadmaps/AI-NATIVE-HARDENING-V1.1-ROADMAP.md`
* `governance/execution/current/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H8/`
* `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-SPEC/`

## Specification Evidence

* `specs/p0-t2-audit-safe-script-mode/spec.md`
* `specs/p0-t2-audit-safe-script-mode/plan.md`
* `specs/p0-t2-audit-safe-script-mode/tasks.md`
* `specs/p0-t2-audit-safe-script-mode/verification.md`
* `specs/p0-t2-audit-safe-script-mode/inspector.md`
* `specs/p0-t2-audit-safe-script-mode/audit-safe-script-mode.contract.json`

## Local Evidence Used

* `governance/SESSION-CONTEXT.md` records P0-T1 formal acceptance and leaves
  P0-T2 as next eligible.
* `ai-template/package.json` contains `prepare`, `setup`, validators and
  generator-related scripts.
* `ai-template/scripts/bootstrap.ts` creates `.ai-runtime-data`.
* `scripts/verify-w1t1.mjs` runs package-level pnpm commands including
  `pnpm install`.
* `ai-template/scripts/validate-testing-profiles.mjs` executes child Node
  validators.
* `ai-template/generators/create-ai-native-app.mjs` supports `--dry-run` and
  otherwise writes generated project files.
* `ai-foundation/package.json` contains direct validation scripts.
* `ai-knowledge` has no `package.json`.

## Product Repository Evidence

`ai-foundation` evidence HEAD:

```text
74611a7
```

`ai-knowledge` evidence HEAD:

```text
8582290
```

`ai-template` evidence HEAD:

```text
01b0971
```

## HITL

```text
P0-T2 specification: SPEC_CLOSED_LOCALLY
Human approval: REQUIRED
Human approval recorded: NO
```

## Push

```text
NOT_PUSHED_BY_POLICY
```
