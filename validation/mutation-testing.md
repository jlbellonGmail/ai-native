# Mutation Testing

W6-T2 defines the mutation testing framework for generated projects based on
this template.

The goal is to make mutation readiness explicit without running mutation tools,
changing product code, generating mutants or closing W6-T3.

## Framework

Generated projects should classify mutation targets by risk and test value:

* pure domain services
* boundary validators
* authorization and policy functions
* serialization and mapping logic
* error handling branches

Mutation testing readiness starts with small deterministic units. Generated
projects should avoid mutation testing against network calls, non-deterministic
timers, runtime infrastructure and external provider side effects until later
testing tasks define execution policy.

## Rules

Mutation testing rules for generated projects:

* only mutate deterministic code paths
* require an existing test target before a mutation target is declared
* exclude generated files, framework wrappers and runtime integration glue
* define an owner for each mutation target group
* define a minimum mutation score before activation in a real project
* document waived targets with a reason and review owner

## Validation

Run:

```powershell
node scripts/validate-mutation-testing.mjs
```

W6-T2 only validates mutation testing readiness and governance. It does not run
mutations, modify product code or close W6-T3.
