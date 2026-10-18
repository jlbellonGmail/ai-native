# SDD Workflow

This project uses the canonical AI-Native SDD package from H1.

Required flow:

```text
Specify -> Plan -> Implement -> Verify
```

Spanish operational label:

```text
Especificar -> Planificar -> Implementar -> Verificar
```

Gate order:

```text
SPEC_READY -> PLAN_READY -> IMPLEMENTATION_READY -> VERIFICATION_READY -> DONE
```

Rules:

* Do not implement before `SPEC_READY` and `PLAN_READY`.
* Record implementation evidence before verification.
* Treat failed verification as a stop condition.
* Keep SDD artifacts under `docs/sdd/`.
