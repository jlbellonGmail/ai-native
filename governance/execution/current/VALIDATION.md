# VALIDATION

H2 validation summary:

```text
node generators/create-ai-native-app.mjs --help: PASS
node scripts/validate-create-ai-native-app.mjs: PASS
node scripts/validate-structure.mjs: PASS
node scripts/validate-enterprise-template.mjs: PASS
git diff --check: PASS with CRLF warnings only
smoke generation: PASS
generated project validation: PASS
generated project local validator: PASS
invalid name rejection: PASS expected failure
existing destination rejection: PASS expected failure
```

See archive:

```text
governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H2/VALIDATION.md
```
