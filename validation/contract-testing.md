# Contract Testing

W6-T1 defines the contract testing model for generated projects based on this
template.

The goal is to make public interface expectations explicit before downstream
testing work starts. This task does not execute runtime services, create
pipelines, define mutation testing, run load tests or close W6-T2.

## Model

Contract tests in generated projects must cover stable boundaries:

* HTTP route request and response shape
* service input and output shape
* repository adapter input and output shape
* external provider request and response shape
* agent-facing command input and output shape

Each contract test must assert both accepted and rejected inputs. Contracts are
stored with the validation surface so generated projects can inherit the
expectation without requiring a runtime service.

## Policy

Contract tests are required before a boundary is treated as stable. A contract
test must reference:

* a boundary id
* a contract owner
* an expected input shape
* an expected output shape
* failure cases
* evidence files

## Validation

Run:

```powershell
node scripts/validate-contract-testing.mjs
```

W6-T1 only validates the contract testing model. W6-T2 and later testing tasks
remain future work.
