# Consolidación final — depuración de legado y v3.0.2

Estado: **PLATFORM_CLEAN_READY_FOR_HUMAN_MERGES** (no `PLATFORM_CLEAN_AND_STABLE`: ver «Pendiente»). Base: `main` `f8612b0` (post-M7). PRs: **#78** (`chore/actions-checkout-7.0.1`) y **#79** (`fix/v3.0.2-migrator-profile-gaps`, apilada sobre #78). Este documento solo afirma lo verificado con comandos; las cifras salen de objetos Git (`ls-tree`, `git grep -c`, `diff`), no del árbol de trabajo, y están medidas sobre el **commit de código `bb0398a`**: el commit que añade este texto cambia solo documentación, de modo que recalcular sobre el HEAD de la PR da más líneas de texto y de inserciones (las de estos documentos) y el mismo resto.

## Qué se eliminó (#79)

| Elemento | Antes | Después | Reemplazo (trazabilidad) |
|---|---|---|---|
| `legacy/template-v2` (+ `legacy/README.md`) | 165 archivos | 0 | `parity/v2.0.5/legacy-import-manifest.json` (ruta + sha256 de cada archivo; `aggregateAlgorithm` documentado); contenido en `git show f8612b0:legacy/<ruta>` y tag `v2.0.5` del Template |
| `foundation/knowledge/template/_deprecated` | 120 (78+18+24) | 0 | `governance/history/DEPRECATED-2026-06-11-MANIFEST.json`; contenido en `git show 857b09c:<ruta>` |
| Job CI `legacy-template-baseline` (pytest Ubuntu+Windows) | 1 | 0 | Paridad probada por `parity/validate-parity.mjs` (95/95 par-tests, `UNMAPPED=0`) y los PAR-tests v3 |
| Validadores históricos W8-T1..T4 ×3 áreas | 12 | 0 | Verificaban solo el contenido de `_deprecated/`; entradas W8-T1..T4 retiradas de `roadmap-coverage.json` |
| Filtros `legacy/` muertos en `doc-drift` y `test-hermetic` y sus tests | 4 sitios | 0 | Código muerto: ya no existe el directorio |

Consumidores de `legacy/` reemplazados: test P43 (B31) → 4 workflows v2.0.5 reales como fixtures en `evaluation/fixtures/supply-chain/`; mapas de paridad, contratos, constitución y docs → referencias `template@v2.0.5:<ruta>` (tag). La copia importada de `requirements-dev.txt` **no** era byte-idéntica al tag v2.0.5 (sha `1d0f…` vs `eaf4…` del Hash DB): las fixtures del migrador salen del tag real.

## Qué quedó y por qué

* `parity/` (capabilities, tests-map, files-map, Hash DB, `migrate-inventory`): evidencia de paridad y base del inventario del migrador; no depende de ningún árbol heredado.
* Historia (`governance/history`, `governance/execution/archive`, `.audit`, M7-*) conserva referencias antiguas a propósito (histórico congelado).
* `template` / `template-starter`: sin dependencia operativa desde AI-Native en CI/paridad/validadores (ver «Template»).

## v3.0.2

`CANDIDATE`, **no publicada**. Detalle, contrato de protección y sintaxis soportada: `governance/versioning/V3.0.2-PATCH.md`. Brechas 1, 2, 6 y 7 corregidas con regresiones.

Verificación local sobre el código de #79 (`bb0398a`; el commit siguiente solo añade documentación):

* **Suite hermética oficial** (`node scripts/test-hermetic.mjs`, concurrencia por defecto, una corrida por vez): **el gate «3 corridas completas consecutivas verdes» NO se alcanzó sobre el código final `bb0398a`** (2 corridas: 1 verde 719/719 y 1 roja) **ni sobre `1e2df8b`** (7 corridas, 4 verdes, mejor racha 2). Sobre `cc8ee64` (código anterior a las últimas revisiones) sí hubo **3 consecutivas 718/718** (299 s, 263 s, 280 s) en 6 corridas. Se dejó de reintentar tras cuatro series. **Los 9 tests fallidos de las 6 corridas rojas con log conservado (15 corridas en total) tienen la misma firma de git** (`unable to write file .git/objects/…: Permission denied`), ninguno otra; todos pasan aislados 3/3. Causa de entorno demostrada con los logs, vínculo con antivirus de terceros solo correlacional y **no corregible desde el repositorio**: detalle y mitigación (decisión del usuario) en `V3.0.2-PATCH.md`, «Estabilidad». El CI remoto es la referencia reproducible.
* Validadores, todos con salida 0 sobre `bb0398a`: `validate-parity` (`UNMAPPED=0`), `validate-contracts`, `validate-core`, `validate-compat-matrix`, `validate-doc-drift`, `validate-integrity`, `validate-entrypoints`, `validate-actions-pinned`, `validate-ci-tests-listed` (78 ficheros de test); `git diff --check origin/main HEAD`: 0.

## GI

Los 7 repos GI siguen en `v3.0.1` (pin sin cambios); **no se migraron a v3.0.2** porque aún no existe (FASE 11). La retirada de workarounds M6 (paquete vacío, `requirements-dev.txt` restaurado, `pyproject` mínimo, `STATUS:AUTO`) queda condicionada a v3.0.2 publicada y a una revisión por repo; no se tocó ningún GI ni checkout humano.

## Template

Clasificación propuesta (sin acciones en GitHub): `template` = **HISTORICAL_REFERENCE** (fuente del tag `v2.0.5` que el manifest cita); `template-starter` = **HISTORICAL_REFERENCE / canary** (evidencia brownfield v2→v3). Los tests `migrate-v2` clonan `template-starter@v2.0.4` por SHA, por lo que **no es ARCHIVE_READY mientras ese test dependa de él**. Decisión de archivado: humana.

## PR #48 y PR #78 (actions/checkout 4.2.2 → 7.0.1)

Dependabot quedó 39 commits detrás de `main` (checks en rojo por base obsoleta y por `docs-gate`). Los checkouts `pull_request_target` toman `base.sha` con `persist-credentials: false` (compatibles con v7). Reemplazo controlado: **#78** (19 pins en 14 workflows + nota `governance/security/ACTIONS-CHECKOUT-7.0.1.md`). Decisión: #48 `SUPERSEDED_BY #78`; cerrar #48 al mergear #78 (merge humano, control plane).

#78 incluye además el cambio de la imagen del job `pilot offline (ubuntu)`: Docker Hub devolvía `toomanyrequests` (límite anónimo) y el job fallaba con exit 125; ahora usa el espejo oficial `public.ecr.aws/docker/library/node:24-bookworm@sha256:3d27e5c1…` (mismo digest de índice que Docker Hub), con la coherencia tag/digest comprobada **sin red** (`offline-image.index.json` + `sha256` + anotaciones Node 24/bookworm, probado por mutación) y un actualizador explícito que no escribe nada en disco.

## Alertas de code scanning

* `js/http-to-file-access` (código nuevo de #78): **real y corregida** en origen.
* `actions/untrusted-checkout/medium` #27 (`l3-consumer.yml:116`): **`KNOWN_MERGE_REF_CODEQL_FINDING`**, explicada y sin descartar (sin waiver): mismo hallazgo que la #18 ya descartada en `main`, con otra huella por el cambio de pin; en los experimentos aparece solo en análisis de PR con ≥ 305 ficheros cambiados (umbral **medido, no documentado por GitHub**; el resumen del check solo dice que pueden detectarse alertas no introducidas por la PR «porque los cambios son demasiado grandes»). Evidencia y experimentos: `governance/security/CODEQL-ALERT-27-2026-10-10.md`.

## Local (fuera del repo)

Archivo en `C:\Proyectos\_archive\2026-10-09\` con `README.md` manifest: parche accidental clinicadental→gi-ot, `gi-common-tenants.git-history-backup`, auditoría de Actions 2026-09-30 y 3 directorios huérfanos con evidencia suelta. Eliminados 11 directorios vacíos de `worktrees/`. Worktrees humanos (2, gi-common-tenants) y checkouts sucios (7): solo inventario, no tocados. Ramas y worktrees temporales de experimentos de esta sesión: eliminados.

## Ramas

* `gi-ot:feature/10-validacion-postgresql`: **7 commits exclusivos** → se conserva.
* `origin/develop` (ai-native): sin commits exclusivos; no se borró (decisión humana sobre ramas remotas).
* `dependabot/.../checkout-7.0.1`: retirada al cerrarse #48 como superseded por #78 (2026-10-10); la rama ya no existe.

## Métricas (objetos Git; `main` = `f8612b0`, #78 = `7e4c6a3`, #79 = `bb0398a`)

| Métrica | `main` | #78 | #79 (apilada sobre #78) |
|---|---|---|---|
| Archivos versionados | 1519 | 1524 | 1245 |
| Líneas de texto (`git grep -I -c ''`) | 178 441 | 178 564 | 137 918 |
| `scripts/` | 10 | 10 | 10 |
| Workflows | 14 | 14 | 14 |
| Validadores `validate-*.mjs` | 66 | 66 | 54 |
| Ficheros `*.test.mjs` | 75 | 76 | 78 |
| `contracts/` | 27 | 27 | 27 (`lock.schema.json`, `profile.schema.json` ampliados) |
| Perfiles | 6 | 6 | 8 (`python-app`, `python-scripts`) |
| `legacy/` | 165 | 165 | **0** |
| `_deprecated` | 120 | 120 | **0** |

| Diff | Ficheros | Inserciones | Borrados |
|---|---|---|---|
| `main`..#78 | 20 | 144 | 21 |
| #78..#79 (cambios **propios** de #79) | 361 | 2 663 | 43 316 |
| `main`..#79 (total apilado) | 379 | 2 806 | 43 336 |

Métricas de GI y de contexto (FASES 20 y 23) **no medidas** en esta ejecución.

## Pendiente (no hecho; razón)

| Fase | Estado | Razón |
|---|---|---|
| 10 release v3.0.2 | `READY_FOR_HUMAN_MERGE` | Control plane (`contracts/**`, `.github/**`, `AGENTS.md`): merge humano; tag/release/verify tras el merge |
| 11, 12 migrar GI y retirar workarounds | `BLOCKED_BY v3.0.2` | Requieren la release publicada |
| 13 docs «Template» fuera de este repo | parcial | Solo se saneó este repo |
| 14 archivado de repos GitHub | decisión humana | No se archiva/borra automáticamente |
| 19 referencias rotas global | parcial | Validadores PASS aquí; no se escanearon links de los GI |
| 20 contexto, 21 seguridad tras el cleanup, 22 auditoría PLATFORM, 23 auditorías de consumidor | no ejecutadas | Dependen del `main` resultante |

## Riesgos residuales

* **Entorno de pruebas local:** la suite local falla de forma esporádica con `unable to write file .git/objects/…: Permission denied` (6 de 15 corridas con log, 9 tests; ver `V3.0.2-PATCH.md`, «Estabilidad»); pasan aislados y no hay otra firma de error.
* El contrato de protección no exige aprobaciones humanas (el contrato de AI-Native las fija en 0 por el modelo de un solo maintainer, F2).
* `python-app`/`python-scripts` exigen `requirements*.txt` en el consumidor; sin ellos el gate L3 falla cerrado.
* El gate local de 3 corridas verdes no se cumple sobre el código final por un error de entorno (ver «v3.0.2»); la decisión de aceptar el CI remoto como referencia es humana.
* Alerta #27 de code scanning pendiente de decisión humana (descartar como la #18 o endurecer el workflow).
