# Estado vigente de AI-NATIVE

> Este archivo contiene **solo el estado vigente**. La historia acumulada hasta 2026-10-04 (con secciones superseded) se conserva verbatim en
> `governance/history/SESSION-CONTEXT-HISTORY-2026-10-04.md`. Fuente de verdad del estado: este archivo, `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md` y Git/GitHub.
> Política del merge humano: `governance/security/HITL-MERGE-POLICY.md`. Frontera de secretos: `governance/security/SECRETS-BOUNDARY.md`.

Actualizado: 2026-10-09 (post-M6; M7 `COMPLETED`).

## Arquitectura (vigente)

`ai-native` es **un único repositorio** (ADR-001, desde la PR #2): áreas de fábrica `governance/`, `foundation/`, `knowledge/`, `template/`; plataforma v3 en `core/ contracts/ runtime/ mcp/ profiles/ audit/ parity/ evaluation/`; `legacy/` es material congelado, no instrucciones. Versión de la plataforma = tag/release (`VERSION` de la raíz: `3.0.0-dev`, ver `governance/versioning/VERSIONING-POLICY.md`). Última release publicada: `v3.0.2` (2026-10-10; tag sobre `ca43c7b`; verificación en `governance/versioning/V3.0.2-POST-RELEASE-VERIFICATION.md`). `v3.0.1` (tag sobre `da84fb1`; `governance/versioning/V3.0.1-POST-RELEASE-VERIFICATION.md`) queda como release anterior. `v3.0.0` y las prereleases `alpha.1`, `rc.1`, `rc.2` se conservan como historia publicada.

## Roadmap v3: dónde estamos

| Hito | Estado |
|---|---|
| M0–M4 | Cerrados (ver roadmap). |
| M5.1 `v3.0.0-rc.1` | **Publicada (2026-10-05)** sobre `0ffe68d`: release inmutable, SHA256SUMS, SBOM CycloneDX (0 componentes: sin dependencias de terceros), attestation sigstore de los 4 assets, revocations idénticas al repo, `init`/`sync --require-attestation`/`doctor`/`status --check` verificados desde el release público. Auditoría PLATFORM 92.5/100 sobre `5a60072` (`.audit/reports/AUDIT-PLATFORM-5a60072.md`), vigente para `0ffe68d` (solo cambió `.audit/**`). |
| M5.1b `v3.0.0-rc.2` | **Publicada (2026-10-05)** sobre `51ef185` (merge de #58): tag anotado, release inmutable, `scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit 51ef185…` PASS (22 checks), camino rc.1 → rc.2 → rollback ejecutado. Auditoría PLATFORM 93.0/100 sobre `3477428` (`.audit/reports/AUDIT-PLATFORM-3477428.md`), vigente para `51ef185` (solo cambió `.audit/**`). Detalle: `governance/versioning/RC2-READINESS.md`. |
| M5.4 canary `template-starter@v2.0.4 → v3` | **Cerrado (PASS), 2026-10-05.** PR #4 mergeada por el humano (`9d711d0`) sobre `v3.0.0-rc.2`: lock por SHA, L3 real PASS, reviewer ACCEPT, rollback LF/CRLF idéntico a la base, ruleset con único check `l3 / l3-consumer` y sin bypass actors. Evidencia: `governance/canary/CANARY-TEMPLATE-STARTER-2026-10-05.md`. |
| M5.2 fixture + matriz muestreada | **Cerrada con la PR #61 (mergeada por el humano, `521d203`):** veredicto `COMPLETED` (`node evaluation/m52/validate-evidence.mjs --verdict`); online y offline en Ubuntu y Windows con run real, offline con la red realmente inexistente, CLIs reales en Windows y Linux (WSL2), L2 real y defecto real del adapter OpenCode corregido. Matriz: `governance/quality/M5-2-MATRIX.md`. Límites en la propia matriz (OpenCode en Linux con override de modelo; Codex config y OpenCode MCP `NOT_AVAILABLE_FROM_TOOL`). |
| M5.5 `v3.0.0` | **Publicada (2026-10-06)** sobre `afd375d564e1c750043ad47e1e4a7b1917073700`: tag anotado, release inmutable, `verify-release` PASS (22 checks). Auditoría PLATFORM **92.25/100** sobre `521d203` (`.audit/reports/AUDIT-PLATFORM-521d203.md`; 0 BLOCKER/CRITICAL/MAJOR, 9 MINOR), vigente por diferir solo en `.audit/**`. Verificación posterior (upgrade, rollback, offline): `governance/versioning/V3.0.0-POST-RELEASE-VERIFICATION.md`. |
| M6 (repos GI) | **Cerrado (2026-10-08):** 7 repos GI migrados a `v3.0.1`, PRs mergeadas, CI post-merge verde y rulesets activos. Evidencia y límites: `governance/migration/M6-CLOSURE-2026-10-08.md`. |

Hecho y verificado para rc.1: parity 95/95 con `UNMAPPED=0`; P33, P29, P41/C6, C5 (Claude Code y Codex CONFIRMED; OpenCode `NOT_AVAILABLE_FROM_TOOL`), C3, L3 reusable, migrador v2→v3 y métricas DoD (10/11, 1 `PROXY_ONLY`).

## Auditoría PLATFORM (historial; rc.1 y rc.2 superadas)

| Commit auditado | Score | Notas |
|---|---|---|
| `47bd24f` | 77 | primera pasada |
| `main` tras #47 | 74 | re-auditoría; hallazgo crítico real corregido (#49) |
| `main` previo a #51 | 79 | tercera pasada |
| `ccd981f` | **86** | sin BLOCKER ni CRITICAL; MAJOR en Q7/Q8 |
| `5a60072` | **92.5** | rc.1 (PASS) |
| `3477428` | **93.0** | rc.2 (PASS): 0 BLOCKER/CRITICAL/MAJOR, 8 MINOR abiertos |
| `15715ea` | **92.25** | informe PLATFORM del 2026-10-05 (0 BLOCKER/CRITICAL/MAJOR, 9 MINOR); superado por el de `521d203` |
| `521d203` | **92.25** | `v3.0.0` (PASS): 0 BLOCKER/CRITICAL/MAJOR, 9 MINOR |

No se baja el umbral, no hay waivers. La remediación de F1–F8 (#53) y las posteriores (#55, #56, #57) se auditaron con informes nuevos ligados a su SHA: `5a60072` (92.5, rc.1) y `3477428` (93.0, rc.2). `v3.0.0` estable se publicó sobre `afd375d`, con auditoría nueva sobre `521d203` (la diferencia es solo `.audit/**`); `release-gate --candidate afd375d…` dio PASS_WITH_WARNINGS (avisos: los informes anteriores quedan STALE).

## Hallazgos del canary (2026-10-05)

* **C-1, defecto de plataforma (corregido en la PR `fix/migrate-revert-crlf`):** `migrate revert` comparaba hashes crudos y trataba como «editado por el usuario» todo archivo creado cuando el checkout convierte LF→CRLF (`core.autocrlf=true`, el caso normal en Windows), dejando el PR sin revertir (PARTIAL). Con un checkout LF el rollback ya era limpio y byte-idéntico a `main`. Test de regresión: falla sin el fix, pasa con él.
* **C-2, bloqueo externo (decisión humana, no tocado):** `migrate apply` retiró `.github/workflows/ci.yml` de `template-starter` (idéntico a Template, propiedad de la plataforma) y el ruleset `template-starter-main` exige los checks `circuit-tests`, `product-tests` y `local-reconciler-tests`, que salían de ese archivo. En la PR solo existe `l3 / l3-consumer`, así que queda `BLOCKED` y nadie puede mergearla sin cambiar el ruleset de `template-starter`. No se modifica ese ruleset ni se añaden jobs a `template-starter` (sin capacidades nuevas). Opciones para el maintainer: sustituir los contextos requeridos por `l3 / l3-consumer`, o conservar `ci.yml` con `--keep`. Gap de plataforma asociado: `plan` debería avisar cuando un workflow retirado produce un check requerido por el ruleset del consumidor.
* Pendientes conocidos abiertos: F2 (`required_approving_review_count = 0`, `strict=false`) y la revocación de claves antiguas de `ai-native-trust` (NO VERIFICADO). La alerta #10 de code scanning quedó `fixed` (2026-10-05T14:36:20Z).

## Seguridad y gobernanza (vigente)

* **Secretos (D5, cerrado):** `TRUST_APP_*` solo en el Environment `ai-native-trust` (restringido a `main`); sin secretos de repositorio; `WORKER_*` eliminados de GitHub (la App sigue instalada, sin credenciales expuestas). Tres validaciones reales PASS. Detalle y causa del 401 en `SECRETS-BOUNDARY.md`.
* **Pendiente humano:** revocar las claves privadas antiguas de `ai-native-trust`. No verificable por API; **no se da por hecho**.
* **Merge humano (D6):** el agente no mergea ni aprueba Environments con credenciales del owner. Limitación conocida (F2): no hay segunda identidad humana impuesta por el servidor mientras exista un solo maintainer (`required_approving_review_count = 0`); documentado en `HITL-MERGE-POLICY.md`, no ocultado.
* **Plano de control (D7):** un PR que toque `.github/**`, `governance/gates/`, etc. deja `trust-gate = neutral`; `merge-gate` lo bloquea hasta la aprobación humana en `ai-native-human-review`. `neutral` nunca es PASS.
* **SHA pinning (F8):** `sha_pinning_required = true` a nivel de repositorio desde 2026-10-04 (todas las acciones ya estaban fijadas por SHA; `pin-check` lo valida en CI). Verificado con el CI de la PR de remediación.
* **LICENSE (D8):** propietaria, All Rights Reserved (PR #51).
* **Alertas:** triage completo en `governance/security/ALERTS-TRIAGE-2026-10-04.md`.

## Dependabot

* #48 (`actions/checkout` 4.2.2 → 7.0.1): toca el plano de control; fail-closed esperado (`docs-gate`, `trust-gate = neutral`, `merge-gate`). **CLOSED / SUPERSEDED por #78** (cerrada sin mergear el 2026-10-10; el bump de checkout a 7.0.1 llegó a `main` con #78, que incluye la nota de gobernanza que el gate exigía). El fail-closed descrito era el estado mientras estuvo abierta.
* #23–#26 (dependencias de `legacy/` y `foundation/`): sus parches están aplicados en la PR de remediación; se cierran tras su merge.

## Decisiones y hechos que no se reescriben

* Commits `wip:` ya mergeados (`d4522af`, `77be44d`, `58358e8`, `bf435fe`, `189f2af`, `6e30b3a`, `6d02325`, `7d25e6d`, `81f06a1`, `5e79672`): la historia publicada no se reescribe; desde entonces los commits son descriptivos.
* PRs #30, #31 y anteriores se mergearon bajo una dispensa de merge que ya no existe (D6).
* Template `v2.0.6` publicada y rulesets activos en `template` y `template-starter`; `template-starter` sigue en la baseline v2.0.4 para el canary. El checkout local del maintainer en `<workspace>/template` tiene `ci.yml` modificado sin commitear; no se tocó.

## Transición Template → AI-Native (cerrada con `v3.0.0`)

* **AI-Native `v3.0.2`** = plataforma central vigente (publicada 2026-10-10). Cada consumidor GI sigue fijado a la versión de su propio `ai-native.lock.json` hasta que se mergee su PR de bump. Los consumidores la usan por referencia: versión, SHA/lock, caché, attestation y rollback; no por copia masiva del Template.
* **Template v2.x** = `LEGACY / TRANSITION`: sin capacidades funcionales nuevas; solo historia, baseline y migración/compatibilidad imprescindible. El árbol `legacy/template-v2` fue retirado en v3.0.2 (manifest en `parity/v2.0.5/legacy-import-manifest.json`).
* **template-starter** = canary histórico y consumidor migrado (evidencia brownfield v2 → v3), no plataforma central.
* M7 (limpieza/depuración): `COMPLETED` (2026-10-09); detalle en `governance/cleanup/M7-CLOSURE.md`. Las PRs de limpieza (ai-native #70/#72/#73/#74/#75, gi-common-tenants #20, gi-ot #7, gi-clinicadental #64) están mergeadas con CI verde y los tres GI quedan `CLEANED`. M7 no abrió v3.0.2: se autorizó y publicó después (ver `governance/versioning/V3.0.2-PATCH.md`) ni otro milestone; PR #48 quedó `CLOSED / SUPERSEDED` por #78 (2026-10-10; estaba `KEEP_OPEN` al cerrar M7).

## Residuales abiertos tras `v3.0.0` (no convertidos en PASS)

F2 (`required_approving_review_count = 0`, `strict = false`); claves antiguas de `ai-native-trust` `NO_VERIFICADO`; OpenCode MCP y Codex config `NOT_AVAILABLE_FROM_TOOL`; F-05 `PARTIAL` (sin causa raíz demostrada); sin ruleset de tags (F-04 del informe); P1–P45 sin matriz individual final; PR #48 (Dependabot, plano de control) `CLOSED / SUPERSEDED` por #78 (era `KEEP_OPEN_FOR_HITL` al cerrar M7).
