# VALIDATION

Current H6 validation is archived in:

```text
governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H6/VALIDATION.md
```

Summary:

```text
git diff --check root/governance: PASS
git diff --check ai-foundation: PASS with CRLF warnings only
git diff --check ai-knowledge: PASS
git diff --check ai-template: PASS with CRLF warnings only
ai-foundation H6 JSON parse: PASS
ai-template H6 JSON parse: PASS
node scripts/validate-target-repo-security.mjs: PASS
node scripts/validate-security-bootstrap.mjs: PASS
node scripts/validate-generated-project.mjs: PASS
node scripts/validate-create-ai-native-app.mjs: PASS
node sdd/validation/validate-sdd-package.mjs: PASS
root checklist static validation: PASS
H7/H8 unopened negative grep: PASS
```
