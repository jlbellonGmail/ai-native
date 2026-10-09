# M7 — Cierre (limpieza de legado y deprecated)

Fecha de redacción: 2026-10-09. Base: `main` `935a34d`. Estado: **`M7_FINAL_PR_READY_FOR_HUMAN_MERGE`**. M7 se considera `COMPLETED` cuando esta PR esté mergeada por un humano, el CI post-merge de `main` esté verde y estén mergeadas las dos PRs GI de la tabla (pendientes al redactar). Detalle de candidatos y lotes anteriores: `M7-INVENTORY.md`, `M7-PLATFORM-GAPS-AND-PR48.md`.

## PRs de M7

| Repo | PR | HEAD revisado | Revisor independiente | CI | Estado al redactar |
|---|---|---|---|---|---|
| ai-native | #70 (inventario, retiro de `scripts/_deprecated`) | `82467a4` | ACCEPT | verde | MERGED (`bb23053`) |
| ai-native | #71 | `7a84106` | ACCEPT | no corrió (base ≠ `main`; mergeada por error en una rama ya mergeada) | contenido NO llegó a `main`; recuperado en #72 |
| ai-native | #72 (lote 2 sobre `main`; árbol idéntico a `7a84106`) | `dde2fc4` | ACCEPT heredado por árbol idéntico | verde | MERGED (`935a34d`); CI post-merge verde (con rerun de dos fallos HTTP 503 externos) |
| gi-common-tenants | #20 (retira `guard-develop-branch` + test; neutraliza `C:\Proyectos` en 2 tests) | `8469792` | ACCEPT | `l3 / l3-consumer`, `repo-tests`, `product-tests` verdes | MERGED (`d26db64`); CI en `develop` verde; ruleset activo; **CLEANED** |
| gi-ot | #7 (retira 17 scripts Template sin consumidor) | `1688e3e` | ACCEPT | 8 checks verdes incl. `l3 / l3-consumer` | OPEN → `READY_FOR_HUMAN_MERGE` |
| gi-clinicadental | #64 (retira 8 scripts Template sin consumidor) | `871d5d6` | ACCEPT | `l3 / l3-consumer`, `test` verdes | OPEN → `READY_FOR_HUMAN_MERGE` |

Límite conocido (heredado de M6): `l3 / l3-consumer` solo corre en `pull_request`, no en el push de merge.

## ai-native: eliminado / conservado

**Eliminado:** `scripts/_deprecated/` (5 archivos); `foundation/scripts/tools/setup-agent-sandbox.sh` (sin llamadores, duplicado roto de `setup-agent.sh`); referencias en `AGENTS.md`/`README.md`; script `w1t1:verify` sustituido por `validate:audit-safe-script-mode`. Recuperable desde Git.

**Workflows:** 14/14 conservados, ninguno eliminado. 13 tienen ejecuciones exitosas; `l3-consumer.yml` es reusable (`workflow_call`) y lo ejercitan los consumidores. No existe `guard-develop-branch.yml` en ai-native. Ruleset `ai-native-main` (activo, sin bypass): `validators (ubuntu|windows-latest)`, `pin-check`, `pr-gate`, `ai-native/trust-gate`, `ai-native/merge-gate`; los seis existen.

**Tests:** los 75 `*.test.mjs` se ejecutan en algún workflow (`validate-ci-tests-listed`). No se auditó la vigencia semántica de cada uno.

## `_deprecated` restante — justificado

| Bloque | Archivos | Consumidores demostrados | Decisión |
|---|---|---|---|
| `foundation/_deprecated/2026-06-11` | 78 | 4 validadores (`validate-{legacy-inventory,historical-archive,duplicate-detection,obsolete-artifacts}.mjs`) leen sus contratos; `foundation/validation/roadmap-coverage.json`; `ci.yml` ejecuta todos los `validate-*.mjs` del área; excludes en `tsconfig`/`eslint` | CONSERVAR (REQUIRED_FOR_CI) |
| `knowledge/_deprecated/2026-06-11` | 18 | idem (4 validadores + `roadmap-coverage.json`) | CONSERVAR |
| `template/_deprecated/2026-06-11` | 24 | idem; incluye `package-lock.json` (alertas 77/78 aceptadas, `ALERTS-TRIAGE-2026-10-04.md`) | CONSERVAR |

Total `_deprecated/`: 125 → 120 archivos. Retirarlos exige retirar 12 validadores, entradas de `roadmap-coverage.json` y `.github/**` (plano de control): candidato a una PR dedicada con revisión humana, **no hecho en M7**.

## `legacy/template-v2` restante — justificado (164 archivos; 165 con `legacy/README.md`)

Consumidores: job `legacy-template-baseline` de `.github/workflows/ci.yml` (pytest, Ubuntu y Windows); `parity/v2.0.5/{files-map,tests-map}.json` y sus generadores `build-*-map.mjs` (UNMAPPED=0); `runtime/gates/gates.test.mjs`; `runtime/lib/result.conformance.test.ps1`; `evaluation/compat/compat-matrix.json`; `evaluation/scenarios/scenarios.json`; `contracts/eval-result.schema.json`, `contracts/roadmap.md`, `core/constitution.md`. Es la base de parity y de la prueba v2→v3: CONSERVAR entero. Reducirlo exige auditar archivo por archivo los mapas de parity.

## GI

| Repo | Cleanup | PR | CI | Reviewer | Merge | Final |
|---|---|---|---|---|---|---|
| gi-common-tenants | retira guard (superseded por ruleset) y test propio; rutas locales neutralizadas | #20 | verde | ACCEPT | MERGED | CLEANED |
| gi-ot | 17 scripts `.ps1` sin consumidor (`scripts/` 27→10) | #7 | verde | ACCEPT | pendiente humano | READY_FOR_HUMAN_MERGE |
| gi-clinicadental | 8 scripts `.ps1` sin consumidor (`scripts/` 21→13) | #64 | verde | ACCEPT | pendiente humano | READY_FOR_HUMAN_MERGE |
| gi-platform-core | sin cambio | — | — | — | — | NOT_APPLICABLE: sin scripts huérfanos; menciones a Template solo documentales |
| gi-common-persons | sin cambio | — | — | — | — | NOT_APPLICABLE (idem) |
| gi-common-crm | sin cambio | — | — | — | — | NOT_APPLICABLE (idem) |
| gi-ocr | sin cambio | — | — | — | — | NOT_APPLICABLE: sus scripts Template tienen llamadores (AGENTS.md, roles); `detect_zones.py`, `run_local.ps1`, `validate_plain_text_extraction_contract.py` sin referencias pero son posible código de producto → UNKNOWN, no se borran |

Criterio de los scripts retirados: sin referencias por nombre ni por stem en workflows, tests, AGENTS.md, README, `.agentic`, `.claude`, `.codex`, `.opencode`, docs ni scripts conservados (solo menciones históricas en `runs/`, que no se tocan); contrato de paridad `parity/v2.0.5/files-map.json` área `scripts/`: `consumerKeeps=false`. Reviewers verificaron cada punto con clon nuevo.

**Riesgos residuales de estas dos PRs (declarados, no ocultos):** (a) quien ejecute esos scripts a mano por costumbre los pierde (recuperables desde Git); (b) en `gi-clinicadental` desaparecen `check-integrity.ps1` y `sync-agentic-adapters.ps1`, así que ya no hay chequeo automático de coherencia de `.agentic` y adaptadores en el repo (el L3 comprueba otra cosa: bootstrap, integridad de STATUS, adopción y tests de producto). Los circuitos residuales con llamadores (`close-feature`, `ready-for-pr`, `wait-pr-ci`, etc. en clinicadental y ocr) siguen ACTIVE.

## Ramas, worktrees y clones

**Eliminado:**
* ai-native: 18 ramas remotas mergeadas (SHA recuperables); ramas locales equivalentes; worktree `_m6/ai-native-closure` (limpio, mergeado).
* GI: 75 ramas remotas con PR MERGED cuyo SHA era idéntico al HEAD de la PR (recuperables vía `refs/pull/N/head`).
* `C:\Proyectos\_m6`: 7 clones y 6 venvs (969 MB → 3 MB), tras comprobar 0 cambios, 0 untracked, 0 stashes y 0 commits no presentes en un remoto.

**Conservado:**
* ai-native: `main`; `develop` (ancestro de `main`, sin PR, no usada hoy por workflows ni rulesets; conservada a propósito como rama de integración/histórica); `dependabot/.../checkout-7.0.1` (PR #48 abierta).
* GI: `develop`, `main`, `gh-pages` donde existe; `gi-ot:feature/10-validacion-postgresql` (PR cerrada sin merge); `gi-clinicadental:respaldo/develop-antes-tooling-headroom` (sin PR, respaldo); las ramas de las PRs #7 y #64.
* `_m6`: ~3 MB de scripts de migración, YAML base y logs de CI sin versionar (`migrate_repo.sh`, `ship.sh`, `prune_*.py`, `*-ci.log`, `*-removed.txt`): archivos únicos, no borrados.
* `_m7`: clones de trabajo de esta fase; se eliminan tras el merge de #7 y #64.
* Checkouts del maintainer (`C:\Proyectos\gi-*`, 27–31 cambios sin commitear en cinco de ellos): no tocados.

## Métricas (`git ls-tree` / `git grep -I` sobre commits fijos)

| Repo | Commit antes → después | Archivos | Líneas de texto | Workflows | Scripts |
|---|---|---|---|---|---|
| ai-native | `9c7db00` → `935a34d` | 1522 → 1518 | 178 834 → 178 294 | 14 → 14 | 252 → 247 (fuera de `legacy/`) |
| gi-common-tenants | `e4d3179` → `d26db64` | 267 → 265 | 20 244 → 19 767 | 4 → 3 | 6 → 6 (scripts de `scripts/`) |
| gi-ot | `3c153dc` → `1688e3e` (PR abierta) | 311 → 294 | 53 730 → 53 599 | 2 → 2 | 27 → 10 |
| gi-clinicadental | `76d86de` → `871d5d6` (PR abierta) | 372 → 364 | 47 288 → 47 244 | 3 → 3 | 21 → 13 |

ai-native: archivos `_deprecated/` 125 → 120; `legacy/` 165 → 165; AGENTS.md 12 → 12. Ramas remotas ai-native: 21 (incluidas las 2 ramas de PR de M7) → 3 (`main`, `develop`, dependabot); GI: 75 menos. La reducción es modesta a propósito: el grueso (`legacy/`, `_deprecated/`) tiene consumidores demostrados. No se midió duplicación.

## Brechas de plataforma de M6 — clasificación final (no se abre v3.0.2)

Fuente: `M6-CLOSURE-2026-10-08.md`. 1 y 7 verificadas en código; el resto, por la documentación de M6.

| # | Brecha | Clasificación final |
|---|---|---|
| 1 | `requirements-dev.txt` retirado aunque el perfil Python lo exige | BUG → FIX_IN_v3.0.2 |
| 2 | Perfiles Python asumen paquete raíz instalable | DESIGN_GAP → FIX_IN_v3.0.2 |
| 3 | `STATUS:AUTO` sin generador | DESIGN_GAP → DEFER |
| 4 | Migrador no poda dependencias modificadas | DESIGN_GAP → DEFER |
| 5 | `persons` usa URLs de release sin hash | ACCEPTED_LIMITATION → DEFER |
| 6 | `pyproject` mínimo puede alterar la inferencia de ruff | DESIGN_GAP → FIX_IN_v3.0.2 (no re-reproducido en M7) |
| 7 | Migrador retira `guard-develop-branch` sin sustituto previo | BUG → FIX_IN_v3.0.2 (mitigado: 7 rulesets activos; en tenants el guard ya se retiró en #20) |

Justificación objetiva para *planificar* v3.0.2: las brechas 1, 2, 6 y 7 afectarían a cualquier migración nueva de un repo Python. No hay consumidor GI pendiente de migrar hoy, así que no hay urgencia.

## PR #48 (Dependabot `actions/checkout` 4.2.2 → 7.0.1) — `KEEP_OPEN`

Abierta; HEAD `718c519`; base obsoleta `521d203`; modifica los 14 workflows (plano de control); `main` sigue en v4.2.2, así que no está superseded. Fallos verificados en los logs:
* `pr-gate` y `security-scan`: `docs-gate/DOCS_NOT_UPDATED` (14 archivos de comportamiento, ninguna nota de governance). Es el mismo hallazgo en ambos.
* `ai-native/merge-gate`: el log de `merge-gate-job` muestra `MERGE_GATE_FAIL: CHECK_FAILED, HUMAN_REVIEW_REQUIRED` — `'pr-gate' concluded 'failure'` **y** `'ai-native/trust-gate' is neutral (control plane changed)`. Es consecuencia de `pr-gate`, pero aun corrigiéndolo seguiría bloqueado por la revisión humana obligatoria.
Acción humana: `@dependabot rebase`, nota de governance (para el docs-gate) y aprobación en `ai-native-human-review`. No se mergea ni modifica en M7.

## Residuales

* Merge humano de gi-ot #7, gi-clinicadental #64 y de esta PR.
* Quitar `_deprecated` de foundation/knowledge/template requiere PR dedicada de plano de control.
* gi-ocr: tres scripts posiblemente de producto sin referencias (UNKNOWN); documentación obsoleta del circuito Template en gi-platform-core, gi-ocr y gi-common-tenants (deuda señalada en M6, no tocada).
* `gi-common-tenants`: `tests/test_status_auto_commit_semantics.py` falla en local Windows (`unable to access 'NUL'`), preexistente.
* Scripts y logs sueltos de `C:\Proyectos\_m6` y los ~40 CSV/scripts de auditoría de Actions en `C:\Proyectos\` (fuera de Git): decisión del maintainer.
* F2, claves antiguas de `ai-native-trust`, F-05 y demás residuales de `SESSION-CONTEXT.md`: sin cambios.

## Siguiente

Mantenimiento normal. v3.0.2 solo si se autoriza explícitamente; las brechas 1, 2, 6 y 7 son su contenido candidato.
