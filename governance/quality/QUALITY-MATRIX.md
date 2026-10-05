# Matriz de calidad de M5 (evidencia, no declaración)

Actualizada: 2026-10-05, sobre `main` = `0ffe68d` (`v3.0.0-rc.1`) más las PRs abiertas que se indican. Vocabulario: **PASS** (ejecutado, con evidencia citada) · **PARTIAL** · **PREPARED** (listo, depende de un merge/acción humana) · **NOT_VERIFIED** (no hay evidencia propia; no se puntúa como cumplido) · **PENDING_HUMAN**. Nada se marca PASS por inferencia.

## Plataforma y release

| Área | Estado | Evidencia |
|---|---|---|
| Auditoría PLATFORM | **PASS** para `0ffe68d` | 92.5/100 (gate 90, mínimo efectivo 88) sobre `5a60072`, informe `.audit/reports/AUDIT-PLATFORM-5a60072.md`, vigente para `0ffe68d` (solo cambió `.audit/**`). **Una `rc.2` exige auditoría nueva sobre su SHA**: PREPARED, no ejecutada. |
| `release-gate` | **PASS** para `0ffe68d` | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 0ffe68d… --root .` → PASS (2026-10-05). |
| Parity | **PASS** | `node parity/validate-parity.mjs`: 95 registrados, 95 implementados; tests-map 35 archivos / 264 funciones (unmapped=0); files-map 576 archivos (unmapped=0). |
| UNMAPPED | **PASS** (=0) | ídem. |
| P1–P45 | **PARTIAL / NOT_VERIFIED por condición** | Cada P se mapea a tests PAR (95/95 implementados y pasando) y la auditoría independiente los cubre en agregado. Con evidencia propia individual: P29 (atestación ajena rechazada con `gh` real), P33 (2 auditorías de fixtures), P39b, P41/C6 (run 37145520404 y canary), P44 y P45 (tests adversariales). **El resto no se re-derivó una a una** esta noche: no se declara PASS individual. |
| L1 | **PASS** | `node runtime/evals/cli.mjs l1` → PASS (10 escenarios deterministas, sin modelo). |
| L2 | **NOT_VERIFIED** | El harness (`runL2`, N≥3, varianza, `metricStatus`) está probado con un agente inyectado; **no hay corrida con un agente real** (no tiene CLI). No se declara. |
| L3 | **PASS** | `l3-consumer` reusable en run real cross-repo (`evaluation/compat/c6-evidence.json`, run 37145520404) y en el canary (run 37261668915, PR #4). |
| CodeQL | **PARTIAL** | Análisis de `main` en success; 1 alerta abierta (#10), corregida en la PR de higiene pendiente de merge; se cierra cuando GitHub reanalice. 9 `fixed`, 3 descartadas con justificación. |
| Trivy | **PASS** | `Trivy` y `trivy-fs` success en `main` (`0ffe68d`). |
| SBOM | **PASS** | CI `SBOM` success; SBOM del release CycloneDX 1.7 válido, **0 componentes** (la plataforma no tiene dependencias de terceros). |
| Provenance / attestation | **PASS** | `gh attestation verify` de los 4 assets de rc.1 (también offline con el bundle sigstore): sujeto = commit `0ffe68d`, ref `refs/tags/v3.0.0-rc.1`; contra otro repo se rechaza. |
| Revocations | **PASS** | `revocations-1.json` del release idéntico al del repo; lista vacía (`entries: []`); `status --check` online → `revocation: CHECKED`. |
| Supply chain | **PASS** | `Supply chain` success; `pin-check` valida todas las acciones por SHA; `sha_pinning_required = true`. |
| Release `v3.0.0-rc.1` | **PASS** | tag anotado en `0ffe68d`, pre-release inmutable, workflow build/publish/verify success, `sha256sum -c` 4/4. |
| `v3.0.0-rc.2` | **PREPARED** | ver `governance/versioning/RC2-READINESS.md`. No publicada: faltan merges y auditoría. |
| `v3.0.0` | **NOT STARTED** | exige canary real PASS. |

## Plataformas y modos (rc.1 instalado desde el release público)

| Modo | Estado | Evidencia |
|---|---|---|
| Ubuntu | **PASS** | `validators`, `pilot online`, baseline legacy (matriz de CI). |
| Windows | **PASS** | ídem (matriz de CI) y ejecuciones locales de esta sesión. |
| Online | **PASS** | `init` → `sync --require-attestation` (descarga del release público) → `doctor` → `run version` → `status --check`: PASS, `READY`, revocación `CHECKED`. |
| Offline con caché | **PASS** | `status --offline --check` → `READY` con el aviso explícito «revocation NOT checked»; `sync --offline` PASS; `run version` ejecuta desde la caché verificada. |
| Offline sin caché | **PASS (falla cerrado, como debe)** | caché vacía → `DEGRADED_READONLY: release not in cache`; `sync` y `run` se niegan a ejecutar. |
| Rollback | **PASS** | `rollback` solo con la caché (PAR-ROLLBACK-OFFLINE) y `migrate revert` (ver canary). |

## Canary `template-starter@v2.0.4 → v3` (PR #4)

| Paso | Estado | Evidencia |
|---|---|---|
| Plan | **PASS** | 166 idénticos a Template, 9 modificados, 0 UNKNOWN, 0 colisiones. |
| Migración | **PASS** | apply reproducible: el árbol de git de una migración nueva desde cero es **idéntico** al de la PR #4. |
| Lock por SHA / caller L3 por SHA | **PASS** | `0ffe68d`, digest `sha256:53f8cb56…`; `uses: …/l3-consumer.yml@<40-hex>`. |
| L3 / CI | **PASS** | `l3 / l3-consumer` success (run 37261668915): attestation, bootstrap READY, integridad, ASSESS. |
| Ruleset | **PASS** | `template-starter-main`: único check requerido `l3 / l3-consumer` (id 15368), sin bypass actors, PR obligatoria, sin push directo; verificado por API. Antes: 3 checks que la migración hacía desaparecer (C-2). |
| Rollback | **PASS con #55** / **PARTIAL con rc.1** | con la plataforma de #55: `REVERTED` e idéntico a `main` (árbol `72efd273…`) en checkout LF **y** CRLF (`autocrlf=true`). Con el código de rc.1 el checkout CRLF queda `PARTIAL` (C-1). |
| Reviewer independiente | **PASS** | ACCEPT sobre `b72d099`. |
| Merge del canary | **PENDING_HUMAN** | PR limpia y mergeable; el merge es humano. |

## Seguridad y gobernanza

| Área | Estado | Evidencia |
|---|---|---|
| Rulesets de `main` | **PASS con límite declarado** | `ai-native-main` activo, sin bypass actors, 6 checks requeridos. **F2: `required_approving_review_count = 0`** (un solo maintainer); sin cambios sin decisión humana nueva. |
| Alerta de code scanning #10 | **PARTIAL** | abierta en GitHub hasta el re-análisis; corregida en la PR de higiene. |
| Dependabot | **PASS** | 0 alertas abiertas; #23–#26 cerradas como superseded con justificación; **#48 abierta a propósito** (plano de control). |
| Secret scanning y push protection | **PASS** | Estaban desactivados (hallazgo F-04 de la auditoría). Activados el 2026-10-05; verificado por `GET /repos/…` (`secret_scanning: enabled`, `secret_scanning_push_protection: enabled`). Es un ajuste del repositorio, no un ruleset. |
| Revocación de las claves antiguas de `ai-native-trust` | **NOT_VERIFIED / PENDING_HUMAN** | la API no expone las claves de una App. |
| OpenCode MCP | **NOT_AVAILABLE_FROM_TOOL** | sin evidencia reproducible; no se declara soporte. |
