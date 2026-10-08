# M7 — Brechas de plataforma de M6 y veredicto de la PR #48

Fuente de las brechas: `governance/migration/M6-CLOSURE-2026-10-08.md` y `M6-PROGRESS-2026-10-08.md`. Las brechas 1 y 7 se verificaron además en código (`profiles/python-{lib,service}.json:12` exige `requirements-dev.txt`; `runtime/migrate/migrate.mjs:48-49` retira `requirements-dev.txt` y `guard-develop-branch.yml`). Las demás se clasifican por la evidencia documental de M6 (no re-reproducidas en M7). **No se abre v3.0.2**: «FIX_IN_v3.0.2» significa solo «candidata cuando se autorice esa release».

| # | Brecha | Clasificación | Justificación |
|---|---|---|---|
| 1 | Migrador retira `requirements-dev.txt` que el `productSetupCommand` de los perfiles Python exige | BUG → FIX_IN_v3.0.2 | Contradicción interna comprobada en código. Mitigado en GI: `gi-common-crm` lo repuso como archivo propio. |
| 2 | Perfiles Python asumen paquete raíz instalable (`pip install .`) | DESIGN_GAP → FIX_IN_v3.0.2 | Capacidad nueva de perfil (setup configurable); no es limpieza. |
| 3 | `STATUS:AUTO` exigido sin generador | DESIGN_GAP → DEFER | Falta una herramienta (capacidad nueva). Workaround: el consumidor escribe el bloque. |
| 4 | Migrador no poda dependencias modificadas del circuito retirado | DESIGN_GAP → DEFER | Mejora del migrador; el residuo lo cubre la limpieza GI de M7 caso por caso. |
| 5 | `gi-common-persons` usa URLs de release sin hash | ACCEPTED_LIMITATION → DEFER | Riesgo de cadena de suministro declarado en M6. Arreglo en el consumidor (`--require-hashes`), no en la plataforma; fuera del alcance de limpieza. |
| 6 | `pyproject.toml` mínimo altera la inferencia de ruff (`requires-python`) | BUG → FIX_IN_v3.0.2 | El migrador generó un `pyproject` que cambió el comportamiento del linter (43 UP017 en `gi-ot`). Corregido en el consumidor (`30cd22a`). |
| 7 | Migrador retira `guard-develop-branch.yml` sin sustituto previo | BUG → FIX_IN_v3.0.2 | Mitigado: los 7 rulesets `protect-develop-m6` están activos. Falta un aviso/condición previa en `plan` (análogo a `ruleset-guard.mjs`). |

# PR #48 (Dependabot `actions/checkout` 4.2.2 → 7.0.1) — READ-ONLY

Evidencia (2026-10-08): abierta; base `521d203` (obsoleta: `main` está en `9c7db00`); modifica las 14 definiciones de `.github/workflows/*` (plano de control); `main` sigue en `actions/checkout` v4.2.2 (20 usos), así que **no está superseded**. `pr-gate` falla con `docs-gate/DOCS_NOT_UPDATED` (14 archivos de comportamiento sin nota de governance) y `security-scan` también falla (causa **no diagnosticada**; el log solo muestra `"status":"FAIL"`). `human-review`/`merge-gate-finalize` omitidos (esperado: plano de control).

**Veredicto: `KEEP_OPEN`.** No se cierra (sigue siendo la única actualización pendiente) ni se reemplaza (una PR nueva repetiría los 14 cambios sin ventaja). Requiere, por un humano: `@dependabot rebase`, una nota de governance que satisfaga `docs-gate`, diagnóstico del fallo de `security-scan` y aprobación en `ai-native-human-review`. No se mergea ni modifica en M7.
