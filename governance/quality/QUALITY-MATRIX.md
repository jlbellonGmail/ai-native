# Matriz de calidad de M5 (evidencia, no declaración)

Actualizada: 2026-10-05, sobre `main` = `5afe752` (contiene `v3.0.0-rc.2`, publicada sobre `51ef185`; las filas de rc.1 conservan la evidencia de `0ffe68d`). Vocabulario: **PASS** (ejecutado, con evidencia citada) · **PARTIAL** · **PREPARED** (listo, depende de un merge/acción humana) · **NOT_VERIFIED** (no hay evidencia propia; no se puntúa como cumplido) · **PENDING_HUMAN**. Nada se marca PASS por inferencia.

## Plataforma y release

| Área | Estado | Evidencia |
|---|---|---|
| Auditoría PLATFORM | **PASS** para `51ef185` | rc.2: 93.0/100 (gate 90, mínimo efectivo 88) sobre `3477428`, informe `.audit/reports/AUDIT-PLATFORM-3477428.md`, vigente para `51ef185` (solo cambió `.audit/**`); 0 BLOCKER/CRITICAL/MAJOR, 8 MINOR abiertos. Lectura estricta de G3 (suite local inestable con concurrencia por defecto en Windows): techo 89, sigue ≥ 88. rc.1: 92.5 sobre `5a60072` (STALE para rc.2). |
| `release-gate` | **PASS** para `51ef185` | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 51ef185… --root .` → PASS_WITH_WARNINGS (el informe de rc.1 queda STALE; el de rc.2 es válido) y el job del workflow `Release` en success (2026-10-05). Para `0ffe68d`: PASS. |
| Parity | **PASS** | `node parity/validate-parity.mjs`: 95 registrados, 95 implementados; tests-map 35 archivos / 264 funciones (unmapped=0); files-map 576 archivos (unmapped=0). |
| UNMAPPED | **PASS** (=0) | ídem. |
| P1–P45 | **PARTIAL / NOT_VERIFIED por condición** | Cada P se mapea a tests PAR (95/95 implementados y pasando) y la auditoría independiente los cubre en agregado. Con evidencia propia individual: P29 (atestación ajena rechazada con `gh` real), P33 (2 auditorías de fixtures), P39b, P41/C6 (run 37145520404 y canary), P44 y P45 (tests adversariales). **El resto no se re-derivó una a una** esta noche: no se declara PASS individual. |
| L1 | **PASS** | `node runtime/evals/cli.mjs l1` → PASS (10 escenarios deterministas, sin modelo). |
| L2 | **PASS** | corrida real (`evaluation/m52/run-l2.mjs`, `evaluation/m52/evidence/l2-claude-code.json`): Claude Code 2.1.289 / claude-sonnet-5-5, 30 llamadas (10 escenarios × 3), score 1.0, varianza 0, 0 errores, commit de plataforma `4ecc156`, coste medido 2.52 USD. Un solo agente/modelo. |
| L3 | **PASS** | `l3-consumer` reusable en run real cross-repo (`evaluation/compat/c6-evidence.json`, run 37145520404) y en el canary (run 37261668915, PR #4). |
| CodeQL | **PARTIAL** | Análisis de `main` en success sobre `3477428` y `51ef185`; 0 alertas abiertas: 10 `fixed` (la #10, el 2026-10-05T14:36:20Z, tras el re-análisis de `6b7998e`) y 3 descartadas con justificación. |
| Trivy | **PASS** | `Trivy` success en `main` (`5afe752`; antes `0ffe68d`). |
| SBOM | **PASS** | CI `SBOM` success; SBOM del release CycloneDX 1.7 válido, **0 componentes** (la plataforma no tiene dependencias de terceros). |
| Provenance / attestation | **PASS** | `gh attestation verify` de los 4 assets de rc.1 (también offline con el bundle sigstore): sujeto = commit `0ffe68d`, ref `refs/tags/v3.0.0-rc.1`; contra otro repo se rechaza. |
| Revocations | **PASS** | `revocations-1.json` del release idéntico al del repo; lista vacía (`entries: []`); `status --check` online → `revocation: CHECKED`. |
| Supply chain | **PASS** | `Supply chain` success; `pin-check` valida todas las acciones por SHA; `sha_pinning_required = true`. |
| Release `v3.0.0-rc.1` | **PASS** | tag anotado en `0ffe68d`, pre-release inmutable, workflow build/publish/verify success, `sha256sum -c` 4/4. |
| `v3.0.0-rc.2` | **PASS** | tag anotado sobre `51ef185`, pre-release inmutable, workflow `Release` en success; `node scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit 51ef185…` → PASS (22 checks); camino rc.1 → rc.2 → rollback a rc.1 ejecutado (ver `governance/versioning/RC2-READINESS.md`). |
| `v3.0.0` | **NOT PUBLISHED** | canary real PASS cumplido (PR #4 mergeada, ver más abajo). Exige auditoría PLATFORM vigente sobre su SHA, `release-gate` y el workflow `Release`. |
| Release `release.yml` idempotencia (F-09) | **PASS (guard) / PARTIAL (no probado en un tag real)** | el push del tag rc.2 disparó dos runs de `Release`; la segunda dejó un borrador duplicado (id 403952697, mismo tarball, SBOM distinto) que se eliminó a mano tras compararlo; el release publicado (403951323) no cambió y `verify-release` sigue en 22 checks PASS. `release.yml` ahora falla cerrado si ya existe cualquier release del tag (`runtime/release/assert-unreleased.mjs`, 7 tests; probado contra GitHub real: rechaza rc.2, acepta un tag sin usar). Su primer uso real será el tag `v3.0.0`. |
| Concurrencia de tests en Windows (F-05) | **PARTIAL** | Causas: (a) repo git ancestral en el HOME del maintainer, corregido con `GIT_CEILING_DIRECTORIES` en `scripts/test-hermetic.mjs` (regresión incluida); (b) residual sin causa raíz demostrada: con la concurrencia por defecto git falla de forma intermitente con `unable to write file .git/objects/…: Permission denied` en repos temporales (3 de 4 corridas completas locales); no ocurre en CI (Ubuntu y Windows en verde) y se mitiga con concurrencia 2 por defecto en el runner local. La suite completa local no se repitió con el runner hermético por presión de memoria. |

## Plataformas y modos (rc.1 instalado desde el release público)

| Modo | Estado | Evidencia |
|---|---|---|
| Ubuntu | **PASS** | `validators`, `pilot online`, baseline legacy (matriz de CI). |
| Windows | **PASS** | ídem (matriz de CI) y ejecuciones locales de esta sesión. |
| Online | **PASS** | `init` → `sync --require-attestation` (descarga del release público) → `doctor` → `run version` → `status --check`: PASS, `READY`, revocación `CHECKED`. |
| Offline con caché | **PASS** | `status --offline --check` → `READY` con el aviso explícito «revocation NOT checked»; `sync --offline` PASS; `run version` ejecuta desde la caché verificada. |
| Offline sin caché | **PASS (falla cerrado, como debe)** | caché vacía → `DEGRADED_READONLY: release not in cache`; `sync` y `run` se niegan a ejecutar. |
| Rollback | **PASS** | `rollback` solo con la caché (PAR-ROLLBACK-OFFLINE) y `migrate revert` (ver canary). |

## Canary `template-starter@v2.0.4 → v3` (PR #4, mergeada)

| Paso | Estado | Evidencia |
|---|---|---|
| Plan | **PASS** | 166 idénticos a Template, 9 modificados, 0 UNKNOWN, 0 colisiones. |
| Migración | **PASS** | apply reproducible: el árbol de git de una migración nueva desde cero es **idéntico** al de la PR #4. |
| Lock por SHA / caller L3 por SHA | **PASS** | primera pasada rc.1 (`0ffe68d`, digest `sha256:53f8cb56…`); vigente en `main` de `template-starter`: rc.2, `51ef185`, digest `sha256:55b9589f…`; `uses: …/l3-consumer.yml@<40-hex>`. |
| L3 / CI | **PASS** | `l3 / l3-consumer` success sobre rc.2 en la PR (run 37349342123, HEAD `4b31929`) y reproducido a mano sobre `main` (`9d711d0`): attestation, bootstrap READY v3.0.0-rc.2, integridad, ASSESS. Primera pasada rc.1: run 37261668915. El caller L3 solo dispara en `pull_request` (no hay run en `push`). |
| Ruleset | **PASS** | `template-starter-main`: único check requerido `l3 / l3-consumer` (id 15368), sin bypass actors, PR obligatoria, sin push directo; verificado por API. Antes: 3 checks que la migración hacía desaparecer (C-2). |
| Rollback | **PASS con rc.2** / **PARTIAL con rc.1** (rc.2 incluye #55) | con la plataforma de #55: `REVERTED` e idéntico a `main` (árbol `72efd273…`) en checkout LF **y** CRLF (`autocrlf=true`). Con el código de rc.1 el checkout CRLF queda `PARTIAL` (C-1). |
| Reviewer independiente | **PASS** | ACCEPT sobre `4b31929` (HEAD final de la PR, rc.2); antes ACCEPT sobre `b72d099` (rc.1). |
| Merge del canary | **PASS** | mergeada por `jlbellonGmail` el 2026-10-05T18:30:41Z (merge commit `9d711d08eaad07593890cac06155d89223360dd8`); verificación post-merge en `governance/canary/CANARY-TEMPLATE-STARTER-2026-10-05.md`. M5.4 cerrado. |

## Seguridad y gobernanza

| Área | Estado | Evidencia |
|---|---|---|
| Rulesets de `main` | **PASS con límite declarado** | `ai-native-main` activo, sin bypass actors, 6 checks requeridos. **F2: `required_approving_review_count = 0`** (un solo maintainer); sin cambios sin decisión humana nueva. |
| Alerta de code scanning #10 | **PASS** | `fixed` en GitHub (`fixed_at` 2026-10-05T14:36:20Z) tras el re-análisis real de `6b7998e`. |
| Dependabot | **PASS** | 0 alertas abiertas; #23–#26 cerradas como superseded con justificación; **#48 abierta a propósito** (plano de control). |
| Secret scanning y push protection | **PASS** | Estaban desactivados (hallazgo F-04 de la auditoría). Activados el 2026-10-05; verificado por `GET /repos/…` (`secret_scanning: enabled`, `secret_scanning_push_protection: enabled`). Es un ajuste del repositorio, no un ruleset. |
| Revocación de las claves antiguas de `ai-native-trust` | **NOT_VERIFIED / PENDING_HUMAN** | la API no expone las claves de una App. |
| OpenCode MCP | **NOT_AVAILABLE_FROM_TOOL** | sin evidencia reproducible; no se declara soporte. |
