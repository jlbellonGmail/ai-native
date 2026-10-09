# M7 — Cierre (limpieza de legado y deprecated)

Fecha: 2026-10-09. Base: `main` `c8c7d05` (PR #75, mergeada por `jlbellonGmail`; sus 6 workflows post-merge —CI, pilot, CodeQL, Trivy, SBOM, Supply chain— en success; parity UNMAPPED=0, doc-drift e integrity PASS). Estado: **`M7_READY_FOR_HUMAN_MERGES`**: queda solo el merge humano de las PRs documentales de GI listadas en Residuales (ninguna toca código, DB ni API) y de esta PR. Detalle de candidatos: `M7-INVENTORY.md`, `M7-PLATFORM-GAPS-AND-PR48.md`.

## Alcance

Repos revisados: ai-native (limpieza profunda con evidencia); gi-platform-core, gi-common-tenants, gi-common-persons, gi-common-crm, gi-ocr, gi-ot, gi-clinicadental (solo herencia tras M6); Template y template-starter no se tocaron (LEGACY/TRANSITION y canary histórico). Fuera de alcance: gi-vertical-dental (EMPTY), gi-utils-fiscal-ar, gi-vertical-law. Los checkouts del maintainer (cinco con 27–31 cambios sin commitear) no se tocaron; todo se hizo desde clones nuevos.

## PRs de M7 (estado verificado en GitHub)

| Repo | PR | HEAD | Revisor independiente | Merge | Post-merge |
|---|---|---|---|---|---|
| ai-native | #70 inventario + retiro de `scripts/_deprecated` | `82467a4` | ACCEPT | `bb23053` | CI/pilot/SBOM/Trivy/Supply chain/CodeQL verdes |
| ai-native | #71 | `7a84106` | ACCEPT | mergeada por error en una rama ya mergeada: su contenido NO llegó a `main` | recuperado en #72 |
| ai-native | #72 lote 2 sobre `main` (árbol idéntico a `7a84106`) | `dde2fc4` | ACCEPT heredado por árbol idéntico | `935a34d` | CI y pilot verdes tras rerun de dos fallos HTTP 503 externos (sin cambio de código) |
| ai-native | #73 cierre documental | `14e7a76` | ACCEPT | `6fc600c` | 6 workflows verdes; parity UNMAPPED=0, doc-drift, integrity, actions-pinned, audit-safe-script-mode y ci-tests-listed (75) PASS en local |
| gi-common-tenants | #20 | `8469792` | ACCEPT | `d26db64` | CI de `develop` verde; ruleset activo |
| gi-ot | #7 | `1688e3e` | ACCEPT | `4b8b25d` | CI de `develop` verde (7 jobs); ruleset activo; 8 checks requeridos presentes |
| gi-clinicadental | #64 | `871d5d6` | ACCEPT | `d9c97a4` | CI de `develop` verde (`test`); ruleset activo |

`merged_by` figura como `jlbellonGmail` en todas, la misma cuenta con la que opera `gh` el agente; la autoría humana se apoya en la declaración del maintainer (igual que en M6). Límite heredado de M6: `l3 / l3-consumer` solo corre en `pull_request`; su PASS consta en el HEAD revisado de cada PR, no en el commit de merge.

## ai-native: eliminado / conservado

**Eliminado:** `scripts/_deprecated/` (5 archivos); `foundation/scripts/tools/setup-agent-sandbox.sh` (sin llamadores; duplicado roto de `setup-agent.sh`); referencias en `AGENTS.md`/`README.md`; el script `w1t1:verify` se sustituyó por `validate:audit-safe-script-mode`. Todo recuperable desde Git.

**Workflows:** 14/14 conservados. 13 tienen ejecuciones exitosas; `l3-consumer.yml` es reusable (`workflow_call`) y lo ejercitan los consumidores. No existe `guard-develop-branch.yml` en ai-native. Ruleset `ai-native-main` (activo, sin bypass): `validators (ubuntu|windows-latest)`, `pin-check`, `pr-gate`, `ai-native/trust-gate`, `ai-native/merge-gate`; los seis existen.

**Tests:** los 75 `*.test.mjs` se ejecutan en algún workflow (`validate-ci-tests-listed`). No se auditó la vigencia semántica de cada uno.

**Scripts residuales:** `foundation/scripts/tools/setup-agent.sh` y `bootstrap.py` solo tienen referencias documentales (README de scripts y `AI_ENTRYPOINT.md`): uso real UNKNOWN → se conservan. `evaluation/m52/linux-*.sh`: REQUIRED_FOR_AUDIT (matriz M5.2). `foundation/scripts/ai-audit.js`: lo referencia `foundation/package.json`.

**`develop` de ai-native:** se conserva a propósito. Es ancestro de `main`, no tiene PR y hoy no la usa ningún workflow ni ruleset; se retiene como rama de integración/histórica.

## `_deprecated` restante — justificado

| Bloque | Archivos | Consumidores demostrados | Decisión |
|---|---|---|---|
| `foundation/_deprecated/2026-06-11` | 78 | `validate-{legacy-inventory,historical-archive,duplicate-detection,obsolete-artifacts}.mjs` leen sus contratos; `foundation/validation/roadmap-coverage.json`; `validate-structure.mjs` lo excluye; `ci.yml` ejecuta todos los `validate-*.mjs` del área; excludes en `tsconfig`/`eslint` | CONSERVAR (REQUIRED_FOR_CI) |
| `knowledge/_deprecated/2026-06-11` | 18 | los mismos 4 validadores, `roadmap-coverage.json` y `validate-structure.mjs` | CONSERVAR |
| `template/_deprecated/2026-06-11` | 24 | los mismos 4 validadores, `validation/roadmap-coverage.json`, `validate-structure.mjs`, `tsconfig`; incluye `package-lock.json` (alertas 77/78 aceptadas en `ALERTS-TRIAGE-2026-10-04.md`) | CONSERVAR |

`_deprecated/` total: 125 → 120 archivos. Retirarlos exige retirar 12 validadores, entradas de `roadmap-coverage.json` y tocar `.github/**` (plano de control): sería una PR dedicada con revisión humana, no hecha en M7 por no ser un cleanup aislado.

## `legacy/template-v2` restante — justificado (164 archivos; 165 con `legacy/README.md`)

Consumidores: job `legacy-template-baseline` de `.github/workflows/ci.yml` (pytest, Ubuntu y Windows); `parity/v2.0.5/{files-map,tests-map}.json` y sus generadores `build-*-map.mjs` (UNMAPPED=0); `runtime/gates/gates.test.mjs`; `runtime/lib/result.conformance.test.ps1`; `evaluation/compat/compat-matrix.json`; `evaluation/scenarios/scenarios.json`; `contracts/eval-result.schema.json`, `contracts/roadmap.md`, `core/constitution.md`. Es la base de parity y de la prueba v2→v3: se conserva entero. Reducirlo exige auditar archivo por archivo los mapas de parity.

## GI

| Repo | Cleanup | PR | CI | L3 | Ruleset | Final |
|---|---|---|---|---|---|---|
| gi-common-tenants | retira `guard-develop-branch` (superseded por ruleset) y su test; neutraliza `C:\Proyectos` en 2 tests | #20 | verde | PASS en el HEAD de la PR | `protect-develop-m6` activo | **CLEANED** |
| gi-ot | 17 scripts `.ps1` sin consumidor (quedan 5 en `scripts/`: 4 que ejercita `tests/test_lifecycle_scripts.py` + `workunit-lib.ps1`) | #7 | verde (7 jobs) | PASS en el HEAD de la PR | activo | **CLEANED** |
| gi-clinicadental | 8 scripts `.ps1` sin consumidor | #64 | verde (`test`) | PASS en el HEAD de la PR | activo | **CLEANED** |
| gi-platform-core | sin cambio | — | — | — | activo | NOT_APPLICABLE: `release-readiness.ps1` y `resolve-agentic-model.ps1` solo con referencias documentales (ROADMAP/docs), uso real UNKNOWN |
| gi-common-persons | sin cambio | — | — | — | activo | NOT_APPLICABLE: sus 6 scripts tienen llamadores (AGENTS.md, docs, entre sí) |
| gi-common-crm | sin cambio | — | — | — | activo | NOT_APPLICABLE: `validate-supply-chain.ps1` lo llama `ci.yml`; `release-readiness`/`update-status` los documenta AGENTS.md |
| gi-ocr | sin cambio | — | — | — | activo | NOT_APPLICABLE: scripts Template con llamadores (AGENTS.md, roles); `detect_zones.py`, `run_local.ps1` y `validate_plain_text_extraction_contract.py` sin referencias pero posible código de producto → UNKNOWN |

Criterio de los scripts retirados: sin referencias por nombre ni por stem en workflows, tests, AGENTS.md, README, `.agentic`, `.claude`, `.codex`, `.opencode`, docs ni scripts conservados (solo menciones históricas en `runs/`, que no se tocan); `parity/v2.0.5/files-map.json`, área `scripts/`: `consumerKeeps=false`. Los revisores lo verificaron con clones nuevos. En los 4 repos sin PR, referencias solo documentales no bastan para borrar (regla: UNKNOWN se conserva); la documentación del circuito Template que las menciona sigue siendo deuda (abajo).

**Riesgos residuales de las dos PRs de scripts:** (a) quien los ejecute a mano por costumbre los pierde (recuperables desde Git); (b) en `gi-clinicadental` desaparecen `check-integrity.ps1` y `sync-agentic-adapters.ps1`, así que ya no hay chequeo automático de coherencia de `.agentic` y adaptadores en el repo (el L3 verifica otras cosas: bootstrap, integridad de STATUS, adopción y tests de producto). `ruff_baseline.json` de `gi-ot` contiene rutas `D:\proyectos\gi-ot\...` como claves del ratchet: no se tocan, cambiarlas alteraría el baseline.

## Ramas, worktrees y clones

**Eliminado:**
* ai-native: 19 ramas remotas mergeadas (las 18 de antes de #72 más `docs/m7-closure`), ramas locales equivalentes y el worktree `_m6/ai-native-closure`. SHA de cada rama guardados fuera del repo durante la sesión.
* GI: 77 ramas remotas cuya PR estaba MERGED y cuyo SHA era idéntico al HEAD de la PR (gi-clinicadental 28, gi-ocr 17, gi-platform-core 12, gi-common-tenants 9, gi-common-persons 8, gi-ot 2, gi-common-crm 1); recuperables vía `refs/pull/N/head`.
* `C:\Proyectos\_m6`: 7 clones y 6 venvs (969 MB → 3 MB), tras comprobar 0 cambios, 0 untracked, 0 stashes y 0 commits ausentes de un remoto; después, los archivos sueltos restantes y el directorio (3 MB → 0, ver abajo).
* `C:\Proyectos\.tmp-template-filtered` (solo caché de pytest) y `C:\Proyectos\Errores-CI-Detalle.txt` (volcado reproducible de logs de CI, salida de `Extraer-Errores-CI.ps1`).
* `C:\Proyectos\_m7`: 7 clones (34 MB) y el directorio, tras comprobar 0 cambios, 0 untracked, 0 stashes y 0 commits no subidos; sus ramas ya estaban mergeadas.
* `C:\Proyectos\_work_starter` y `_work_template`: clones de `template-starter` y `template` (remoto idéntico, 0 cambios, 0 untracked, 0 stashes, 0 commits sin subir). TEMP reproducible.
* `C:\Proyectos\Backup-GitHubActions-20260930-131920` (8 `ci.yml`) y `Backup-ai-native-workflows-20260930-135416` (12 workflows): SUPERSEDED. Los 20 archivos se compararon por hash de blob con el historial de Git de cada repo y existen todos.
* `C:\Proyectos\Upgrade-TemplateConsumer.ps1`: SUPERSEDED. Actualizaba un consumidor desde un checkout de Template v2.x; sin ningún consumidor (ni repos, docs, scripts, perfiles de PowerShell ni tareas programadas), Template es LEGACY/TRANSITION y el migrador `runtime/migrate/migrate.mjs` migró los 7 GI en M6.
* `gi-clinicadental:respaldo/develop-antes-tooling-headroom` (`207a84e`): MERGED. Es ancestro de `develop` (`compare`: ahead 0, behind 50); sus commits siguen en el historial de `develop`.
* ai-native: ramas `docs/m7-final-state` y `docs/m7-completed`, tras sus merges (#74, #75).
* Clones/worktrees temporales eliminados en total: 15 (7 + 7 + 1).

**Conservado:**
* ai-native: `main`, `develop` (ver arriba) y `dependabot/github_actions/actions/checkout-7.0.1` (PR #48 abierta).
* GI: `develop`, `main`, `gh-pages` donde existe; `gi-ot:feature/10-validacion-postgresql` (UNKNOWN, se conserva): 7 commits exclusivos (2026-08-31 a 2026-09-02) y 9 por detrás de `develop`; su PR #2 se cerró sin merge porque el Punto 10 se rehízo bajo Template v2 (PR #4, `de04bac`; `runs/v2.0.0/10-validacion-postgresql`). Probablemente SUPERSEDED, pero no se ha demostrado equivalencia de sus 61 archivos con `develop`, y no se borra trabajo exclusivo sin demostrarla.
* Ya no queda nada de `C:\Proyectos\_m6`: los 18 archivos sueltos se clasificaron y se eliminaron. Logs de CI (`*-ci.log`, 2,5 MB): REPRODUCIBLE_TEMP (los runs viven en GitHub). `rel/platform.json`: manifest del release v3.0.1, reproducible desde el asset publicado. `*-removed.txt` y `base-*.yml`: recuperables de los diffs de las PRs de M6 mergeadas. `migrate_repo.sh`, `ship.sh`, `cleanup.py`, `prune_*.py`, `restore_steps.py`, `migrate-args*.txt`: herramientas de una sola vez de M6 con commit y digest fijados, sustituidas por `runtime/migrate/` (migrador canónico) y `governance/migration/` (evidencia); ningún repo queda por migrar.
* `C:\Proyectos\_archive-actions-audit-2026-09-30\` (321 KB, con README): CSV de la auditoría de Actions del 2026-09-30 (HISTORICAL_EVIDENCE: instantáneas no regenerables) y sus scripts de una sola vez (HISTORICAL_TOOL, cambios ya aplicados en Git, sin consumidores). Revisar el 2027-01-09 y borrar si nadie los ha necesitado.
* `C:\Proyectos\backup-accidental-clinicadental-en-gi-ot.patch`: BACKUP_REQUIRED/UNKNOWN. Cambios de documentación de `gi-clinicadental` hechos por error en `gi-ot` (2026-09-17); una línea distintiva del parche no aparece en el historial de ningún repo, así que es trabajo no integrado. Se conserva hasta que el maintainer lo integre o descarte.
* `C:\Proyectos\gi-common-tenants.git-history-backup`: BACKUP_REQUIRED. Contiene 4 commits (2026-09-18, starter creado desde Template v2.0.1) que no están en el remoto actual. Protege el historial previo a la reescritura; conservar mientras se quiera poder recuperarlo.
* `C:\Proyectos\worktrees\` (15 worktrees de la era Template v2; dos con cambios sin commitear del maintainer) y los checkouts `gi-*`, `template`, `template-starter`: del maintainer, no tocados.

## Métricas (`git ls-tree` / `git grep -I` sobre commits fijos)

| Repo | Commit antes → después | Archivos | Líneas de texto | Workflows | Scripts |
|---|---|---|---|---|---|
| ai-native | `9c7db00` → `6fc600c` | 1522 → 1519 | 178 834 → 178 409 | 14 → 14 | 252 → 247 (`.ps1/.sh/.mjs/.js/.py` fuera de `legacy/`) |
| gi-common-tenants | `e4d3179` → `d26db64` | 267 → 265 | 20 244 → 19 767 | 4 → 3 | 6 → 6 (bajo `scripts/`) |
| gi-ot | `3c153dc` → `4b8b25d`* | 311 → 294 | 53 730 → 53 599 | 2 → 2 | 27 → 10 (todos los archivos de código bajo cualquier `scripts/`; 22 → 5 en el `scripts/` de primer nivel) |
| gi-clinicadental | `76d86de` → `d9c97a4`* | 372 → 364 | 47 288 → 47 244 | 3 → 3 | 21 → 13 |

*Las cifras de gi-ot y gi-clinicadental se midieron sobre los HEAD de sus PRs (`1688e3e`, `871d5d6`); el merge no añade contenido propio.

ai-native (recalculado sobre `c8c7d05`): 1519 archivos, 178 483 líneas de texto, 247 scripts (`.ps1/.sh/.mjs/.js/.py` fuera de `legacy/`), 14 workflows, `_deprecated/` 125 → 120 archivos, `legacy/` 165 → 165, ramas remotas 21 → 3 (`main`, `develop`, dependabot). Las líneas suben 178 409 → 178 483 solo por los documentos de cierre añadidos tras #73. GI: 77 ramas remotas menos, más `gi-clinicadental:respaldo/develop-antes-tooling-headroom`. Disco local: `_m6` 969 MB → 0; `_m7` 34 MB → 0; sin `_work_*` ni backups de Actions; worktrees de ai-native: 1. La reducción es modesta a propósito: el grueso (`legacy/`, `_deprecated/`) tiene consumidores demostrados. No se midió duplicación.

## Brechas de plataforma de M6 — clasificación final (v3.0.2 no iniciada)

Fuente: `governance/migration/M6-CLOSURE-2026-10-08.md`. Las brechas 1 y 7 están verificadas en código (`profiles/python-{lib,service}.json:12`; `runtime/migrate/migrate.mjs:48-49`); el resto, por la documentación de M6.

| # | Brecha | Tipo | Decisión |
|---|---|---|---|
| 1 | `requirements-dev.txt` retirado aunque el perfil Python lo exige | BUG | FIX_IN_v3.0.2 |
| 2 | Perfiles Python asumen paquete raíz instalable | DESIGN_GAP | FIX_IN_v3.0.2 |
| 3 | `STATUS:AUTO` sin generador | DESIGN_GAP | DEFER |
| 4 | Migrador no poda dependencias modificadas | DESIGN_GAP | DEFER |
| 5 | `persons` usa URLs de release sin hash | ACCEPTED_LIMITATION | DEFER |
| 6 | `pyproject` mínimo puede alterar la inferencia de ruff (no re-reproducido en M7) | DESIGN_GAP | FIX_IN_v3.0.2 |
| 7 | Migrador retira `guard-develop-branch` sin sustituto previo (mitigado: 7 rulesets activos) | BUG | FIX_IN_v3.0.2 |

Las brechas 1, 2, 6 y 7 afectarían a cualquier migración nueva de un repo Python; no queda ningún repo GI por migrar, así que no hay urgencia.

## PR #48 (Dependabot `actions/checkout` 4.2.2 → 7.0.1) — `KEEP_OPEN`

Reverificada el 2026-10-09: abierta, HEAD `718c519` (sin cambios desde 2026-10-06), base `521d203`, 30 commits por detrás de `main` (`c8c7d05`); toca los 14 workflows (plano de control); `main` sigue en v4.2.2, así que no está superseded ni hace falta una PR de reemplazo (repetiría los mismos 14 cambios). Fallos, leídos en los logs de la ejecución del 2026-10-06 (no se han repetido desde entonces):
* `pr-gate` y `security-scan`: `docs-gate/DOCS_NOT_UPDATED` (14 archivos de comportamiento, ninguna nota de governance). Es el mismo hallazgo en ambos.
* `ai-native/merge-gate`: el log de `merge-gate-job` dice `MERGE_GATE_FAIL: CHECK_FAILED, HUMAN_REVIEW_REQUIRED` con `'pr-gate' concluded 'failure'` y `'ai-native/trust-gate' is neutral (control plane changed)`. Es consecuencia de `pr-gate`, pero aun corrigiéndolo seguiría bloqueado por la revisión humana obligatoria.
Recomendación exacta (humana): `@dependabot rebase`; añadir una nota de governance para el docs-gate; revisar el cambio de acción (v4 → v7); aprobar en `ai-native-human-review`. No se mergea ni modifica en M7.

## Residuales

* Documentación obsoleta en los GI (PRs solo de Markdown, CI y L3 verdes en el HEAD indicado, pendientes de merge humano): gi-common-tenants #21 (`4b3b674`), gi-common-persons #17 (`e765397`), gi-common-crm #8 (`7f06d0d`) —enlaces rotos a `CONSTITUTION.md` (AGENTS, ROADMAP, `fundamentos-v2`) sustituidos por `core/constitution.md` de v3.0.1 y lista completa de archivos citados que no existen—; gi-ot #8 (`d7c714c`), gi-ocr #39 (`6c069cb`), gi-platform-core #43 (`700efb0`), gi-clinicadental #65 (`99a4703`) —afirmaciones vigentes falsas («Template vigente/activo/operativo») y archivos citados inexistentes—. Los runs/, la procedencia de baseline y los SHAs de adopción son históricos y no se tocan. Barrido de enlaces Markdown relativos: 0 rotos en la documentación operativa de ai-native y en los 7 GI (con estas PRs aplicadas; excluidos `runs/`, `legacy/`, `_deprecated/` y archivos históricos; el único enlace roto conocido, `legacy/template-v2/ROADMAP.md:69` → `runs/v1.1.0/`, está en material congelado).
* Quitar `_deprecated` de foundation/knowledge/template: PR de plano de control aparte, si se desea.
* gi-ocr: tres scripts posiblemente de producto (UNKNOWN). `gi-platform-core`: dos scripts con solo referencias documentales (UNKNOWN).
* `gi-ot:feature/10-validacion-postgresql`: ver «Conservado»; UNKNOWN, decisión del maintainer.
* Raíz de `C:\Proyectos`: el parche accidental, el backup de historial de tenants y `worktrees/` (ver «Conservado»); decisión del maintainer.
* `gi-common-tenants`: `tests/test_status_auto_commit_semantics.py` falla en local Windows (`unable to access 'NUL'`), preexistente.
* F2, claves antiguas de `ai-native-trust`, F-05 y demás residuales de `SESSION-CONTEXT.md`: sin cambios.

## Siguiente

Mantenimiento normal. v3.0.2 solo con autorización explícita; su contenido candidato son las brechas 1, 2, 6 y 7.
