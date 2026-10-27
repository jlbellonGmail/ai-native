# Integración de #146 — runtime-attested independent SDD review

Fecha: 2026-10-22. Cierre de gobernanza de la PR #146 (`feature/sdd-independent-review` → `main`) y reconciliación `main` → `develop` por la rama `sync/main-into-develop-after-sdd-review`, creada desde el SHA fijo `fefd4b3` (no desde `main` mutable). Sin cambio de versión: `CLI_VERSION` sigue en `v3.3.1`, `VERSION` en `3.0.0-dev`; sin tag ni release. Spec, plan, seguridad, verificación e Inspector de la feature: `specs/sdd-independent-review/`; metodología: `knowledge/sdd/methodology/review.md`.

## Commits integrados

| Commit | Contenido |
|---|---|
| `323dd4c` | feat: add runtime-attested independent SDD review (feature inicial) |
| `db6e99f` | fix(review-ledger): tests portables en CI y sin carreras check-then-use (CodeQL `js/file-system-race`, rutas 8.3 de Windows, backticks en `/bin/sh`) |
| `8553349` | fix(review-ledger): preserva la semántica POSIX de revisión (ENOTDIR/ELOOP → borrado, FIFO sin bloqueo, no-fichero vía `fstat`) |
| `fefd4b3` | merge commit de GitHub de #146 (padres `4974fa6`, `8553349`) |

## Independent review

```text
FEATURE PRINCIPAL (323dd4c):          Independent Review APPROVED
FIX CI/CODEQL (db6e99f):              Focused Review: regresión POSIX detectada, CHANGES REQUESTED
FIX FINAL (8553349):                  Focused Independent Review APPROVED
FINAL REVIEWED CONTENT SHA:           8553349e450a1fea09384d4e321e93003b2ca5bf
GITHUB MERGE SHA:                     fefd4b3002d5c1d325e1e803fdba532070b1fcf0
MERGE COMMIT REVIEWED AS ITS OWN SHA: NO
MERGE TREE == REVIEWED CONTENT TREE:  YES (ambos 41fd58c69b08a0e6adda7e877a7f5932f534cd3c; git diff fefd4b3 8553349 vacío)
```

Fuente de los veredictos: las rondas de review de la feature están en `specs/sdd-independent-review/verification.md` y `tasks.md`; los dos Focused Reviews de `db6e99f` y `8553349` son posteriores a ese registro y constan por declaración del humano al encargar este cierre (el cuerpo de `8553349` describe la regresión de `db6e99f` que corrige). El merge commit no tuvo un review independiente propio. Lo demostrado es que su árbol es byte-idéntico al del contenido aprobado en `8553349`: el primer padre `4974fa6` (merge de #140) ya estaba contenido en la base de la feature (`19af54a`), así que el merge no aporta contenido nuevo.

## CI

Checks de #146 sobre la cabeza final `8553349`, todos en verde antes del merge (`gh pr checks 146`): `pr-gate`, `validators (ubuntu-latest)`, `validators (windows-latest)`, `analyze (javascript-typescript)`, `analyze (actions)`, `CodeQL`, `dependency-review`, `trivy-fs`, `security-scan`, `pin-check`, `sbom`, `build`, `human-review`, `merge-gate-job`, `ai-native/merge-gate`; `ai-native/trust-gate` NEUTRAL (plano de control, esperado). Durante la PR:

- CodeQL `js/file-system-race` corregido en `db6e99f`.
- Fallos Windows (rutas 8.3) y POSIX (backticks en `/bin/sh`) corregidos en `db6e99f`; la regresión POSIX que introdujo, corregida en `8553349`.
- Los `Permission denied` al escribir objetos en `.git/objects` de repos temporales de test se clasificaron `CONTEXTUAL_NON_BLOCKING`: flake conocido del host, preexistente, que pasa al repetir aislado (`specs/sdd-independent-review/verification.md`).
- `dependency-review` y `trivy-fs` en rojo observados en ese periodo pertenecen a la PR Dependabot #147 (vite 8.0.16 → 8.3.5 en `/template`), no a #146; en #146 pasan. #147 no se toca ni se incorpora.

## HITL

`node runtime/policy/hitl.mjs`: `specs/sdd-independent-review/spec.md` risk `high`, `human_gate: required`. Merge realizado por humano (`jlbellonGmail`, 2026-10-22T16:59:42Z, merge commit); sin auto-merge (`autoMergeRequest: null`).

## Reconciliación `main` → `develop`

`develop` (`19af54a`) es ancestro de `main` (`fefd4b3`). Entran en `develop` exactamente `4974fa6`, `323dd4c`, `db6e99f`, `8553349`, `fefd4b3` y este commit de gobernanza. Ninguna PR posterior (#147 ni #142–#145), ningún cambio de dependencias.

## Hallazgo de proceso (deuda del gate, sin scope abierto)

#146 pasó `docs-gate` porque su diff contra `main` (`4974fa6`) incluía los ficheros de gobernanza de #141 (`governance/SESSION-CONTEXT.md`, `governance/execution/current/README.md`, `governance/versioning/V3.3.1-*.md`), que no eran de la feature: la base de la feature (`19af54a`, en `develop`) ya los contenía y `main` todavía no. La reconciliación pura `fefd4b3` → `develop` falla `pr-gate` con `docs-gate/DOCS_NOT_UPDATED` (28 ficheros de comportamiento), aunque el comportamiento nuevo sí está documentado en `specs/sdd-independent-review/` y `knowledge/sdd/methodology/review.md`: `docGate.docPaths` (`governance/**`, `README.md`, `docs/**`) no cuenta `specs/**` ni `knowledge/**`. Mejora propuesta para tratamiento separado: decidir si `specs/**` y `knowledge/**` cuentan como documentación en `governance/gates/gates.json`. El gate no se modifica aquí (plano de control).
