# Consolidación final — depuración de legado y v3.0.2

Estado: **PLATFORM_CLEAN_READY_FOR_HUMAN_MERGES** (no `PLATFORM_CLEAN_AND_STABLE`: ver «Pendiente»). Base: `main` `f8612b0` (post-M7). Rama de trabajo: `fix/v3.0.2-migrator-profile-gaps`. Este documento solo afirma lo verificado con comandos en esa rama.

## Qué se eliminó

| Elemento | Antes | Después | Reemplazo (trazabilidad) |
|---|---|---|---|
| `legacy/template-v2` (+ `legacy/README.md`) | 165 archivos | 0 | `parity/v2.0.5/legacy-import-manifest.json` (ruta + sha256 de cada archivo, agregado `18eb6dae…`); contenido en `git show f8612b0:legacy/<ruta>` y tag `v2.0.5` del Template |
| `foundation/knowledge/template/_deprecated` | 120 (78+18+24) | 0 | `governance/history/DEPRECATED-2026-06-11-MANIFEST.json` (agregado `54fa5eee…`); contenido en `git show 857b09c:<ruta>` |
| Job CI `legacy-template-baseline` (pytest Ubuntu+Windows) | 1 | 0 | Paridad probada por `parity/validate-parity.mjs` (95/95 par-tests, `UNMAPPED=0`) y los PAR-tests v3 |
| Validadores históricos W8-T1..T4 (`validate-{legacy-inventory,historical-archive,duplicate-detection,obsolete-artifacts}`) ×3 áreas | 12 | 0 | Verificaban solo el contenido de `_deprecated/`; entradas W8-T1..T4 retiradas de `roadmap-coverage.json` |

Consumidores de `legacy/` reemplazados: test P43 (B31) → 4 workflows v2.0.5 reales como fixtures en `evaluation/fixtures/supply-chain/` (mismos números de línea 42/25); mapas de paridad, contratos, constitución y docs → referencias `template@v2.0.5:<ruta>` (tag). Se constató además que la copia importada de `requirements-dev.txt` **no** era byte-idéntica al tag v2.0.5 (sha `1d0f…` vs `eaf4…` del Hash DB): el árbol congelado no servía ni como fixture fiel; las fixtures del migrador salen del tag real.

## Qué quedó y por qué

* `parity/` (capabilities, tests-map, files-map, Hash DB, `migrate-inventory`): evidencia de paridad y base del inventario del migrador; no depende de ningún árbol heredado.
* Residuos de texto «legacy» sin ejecución: filtros `legacy/` en `runtime/docs/doc-drift.mjs` y `scripts/test-hermetic.mjs` y sus tests (exclusiones genéricas inocuas; retirables en un cambio posterior sin riesgo).
* Historia (`governance/history`, `governance/execution/archive`, `.audit`, M7-*) conserva referencias antiguas a propósito (histórico congelado).
* `template` / `template-starter`: sin dependencia operativa desde AI-Native en CI/paridad/validadores (ver «Template»).

## v3.0.2

`CANDIDATE`, **no publicada**. Detalle y regresiones: `governance/versioning/V3.0.2-PATCH.md`. Brechas 1, 2, 6 y 7 corregidas en la rama con regresiones; suite hermética completa `701/701` PASS en dos corridas consecutivas con `node scripts/test-hermetic.mjs --concurrency 1` sobre el código de la rama (recuento a la fecha de redacción; el valor vigente es el de la última corrida en el CI de la PR), y `validate-parity`, `validate-contracts`, `validate-core`, `validate-compat-matrix`, `validate-doc-drift`, `validate-integrity`, `validate-entrypoints`, `validate-actions-pinned`, `validate-ci-tests-listed` PASS.

## GI

Los 7 repos GI siguen en `v3.0.1` (pin sin cambios); **no se migraron a v3.0.2** porque aún no existe (FASE 11). La retirada de workarounds M6 (paquete vacío, `requirements-dev.txt` restaurado, `pyproject` mínimo, `STATUS:AUTO`) queda condicionada a v3.0.2 publicada y a una revisión por repo; no se tocó ningún GI ni checkout humano.

## Template

Clasificación propuesta (sin acciones en GitHub): `template` = **HISTORICAL_REFERENCE** (fuente del tag `v2.0.5` que el manifest cita); `template-starter` = **HISTORICAL_REFERENCE / canary** (evidencia brownfield v2→v3). Los tests `migrate-v2` clonan `template-starter@v2.0.4` por SHA, por lo que **no es ARCHIVE_READY mientras ese test dependa de él** (archivar no impide clonar, pero un borrado sí lo rompería). Decisión de archivado: humana.

## PR #48 (actions/checkout 4.2.2 → 7.0.1)

Auditada. Dependabot quedó 39 commits detrás de `main` (checks `pr-gate`, `security-scan`, `merge-gate` en rojo por base obsoleta). Los checkouts `pull_request_target` toman `base.sha` con `persist-credentials: false` (compatibles con v7); Node 24 / runner ≥ 2.327.1 cubierto por runners alojados. Reemplazo controlado: **PR #78** (`chore/actions-checkout-7.0.1`, 19 pins en 14 workflows, `validate-actions-pinned` PASS, tests de gates 80/80). Decisión: #48 `SUPERSEDED_BY #78`; cerrar #48 al mergear #78 (merge humano, control plane).

## Local (fuera del repo)

Archivo en `C:\Proyectos\_archive\2026-10-09\` con `README.md` manifest: parche accidental clinicadental→gi-ot (ARCHIVE: aplicable, contenido único), `gi-common-tenants.git-history-backup` (ARCHIVE: historia previa a la reescritura; `main` bfd363f, `gh-pages` 3ea796f y tag `v2.0.1` ausentes en GitHub), auditoría de Actions 2026-09-30 y 3 directorios huérfanos con evidencia suelta. Eliminados 11 directorios vacíos de `worktrees/` (`rmdir`). Worktrees humanos (2, gi-common-tenants) y checkouts sucios (7): solo inventario, no tocados.

## Ramas

* `gi-ot:feature/10-validacion-postgresql`: **7 commits exclusivos** (última 2026-09-02), su PR #2 está cerrada sin merge → se conserva (no se borra).
* `origin/develop` (ai-native): sin commits exclusivos (`main` lo contiene, 729 adelante). No se borró: borrar ramas remotas es decisión humana.
* `dependabot/.../checkout-7.0.1`: la retirará el cierre de #48.

## Métricas (`git ls-tree` sobre `f8612b0` vs rama)

| Métrica | Antes | Después |
|---|---|---|
| Archivos versionados | 1519 | 1239 (incluye la rama de #78) |
| `_deprecated` | 120 | 0 |
| `legacy/` | 165 | 0 |
| Validadores `validate-*.mjs` | 66 | 54 |
| Workflows | 14 | 14 |
| Contratos (`contracts/`) | 27 | 27 (`lock.schema.json` ampliado) |
| Perfiles | 6 | 8 (`python-app`, `python-scripts`) |
| Tests `*.test.mjs` | 75 | 76 (+ `offline-image.test.mjs`; regresiones 1/2/6/7 añadidas a ficheros existentes) |
| Diff total (`origin/main`..rama de #79, que incluye #78) | | −43 305 / +2 215 líneas, 369 archivos |

Métricas de GI y de contexto (FASES 20 y 23) **no medidas** en esta ejecución.

## Pendiente (no hecho; razón)

| Fase | Estado | Razón |
|---|---|---|
| 10 release v3.0.2 | `READY_FOR_HUMAN_MERGE` | Control plane (`contracts/**`, `.github/**`, `AGENTS.md`): merge humano; tag/release/verify tras el merge |
| 11, 12 migrar GI y retirar workarounds | `BLOCKED_BY v3.0.2` | Requieren la release publicada |
| 13 docs «Template» fuera de este repo | parcial | Solo se saneó este repo |
| 14 archivado de repos GitHub | decisión humana | No se archiva/borra automáticamente |
| 19 referencias rotas global | parcial | Validadores (`doc-drift`, entrypoints, pins) PASS aquí; no se escanearon links de los GI |
| 20 contexto, 21 seguridad (CodeQL/Trivy/alertas), 22 auditoría PLATFORM, 23 auditorías de consumidor | no ejecutadas | Dependen del CI de las PRs y del `main` resultante |

## Riesgos residuales

* La verificación de protección de `develop` (brecha 7) es heurística (`pull_request` / required checks); un ruleset atípico se trata como «no protegido» (conserva el guard: fail-safe).
* `python-app`/`python-scripts` exigen `requirements*.txt` en el consumidor; sin ellos el gate L3 falla cerrado.
* Bajo carga (concurrencia por defecto) aparecieron 1–5 fallos por corrida en tests que crean repos `git` temporales, **distintos en cada corrida**, que pasan aislados y en corridas con `--concurrency 1`; coherente con la contención de Windows documentada en `scripts/test-hermetic.mjs`, causa exacta no investigada. Las 3 últimas corridas completas con `--concurrency 1` dieron 701/701 (2 de 3; la otra falló 1 test que pasó aislado).
