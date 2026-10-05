# Estado vigente de AI-NATIVE

> Este archivo contiene **solo el estado vigente**. La historia acumulada hasta 2026-10-04 (con secciones superseded) se conserva verbatim en
> `governance/history/SESSION-CONTEXT-HISTORY-2026-10-04.md`. Fuente de verdad del estado: este archivo, `governance/roadmaps/AI-NATIVE-V3-ROADMAP.md` y Git/GitHub.
> Política del merge humano: `governance/security/HITL-MERGE-POLICY.md`. Frontera de secretos: `governance/security/SECRETS-BOUNDARY.md`.

Actualizado: 2026-10-04.

## Arquitectura (vigente)

`ai-native` es **un único repositorio** (ADR-001, desde la PR #2): áreas de fábrica `governance/`, `foundation/`, `knowledge/`, `template/`; plataforma v3 en `core/ contracts/ runtime/ mcp/ profiles/ audit/ parity/ evaluation/`; `legacy/` es material congelado, no instrucciones. Versión de la plataforma = tag/release (`VERSION` de la raíz: `3.0.0-dev`, ver `governance/versioning/VERSIONING-POLICY.md`). Última release publicada: `v3.0.0-alpha.1`.

## Roadmap v3: dónde estamos

| Hito | Estado |
|---|---|
| M0–M4 | Cerrados (ver roadmap). |
| M5.1 `v3.0.0-rc.1` | **Publicada (2026-10-05)** sobre `0ffe68d`: release inmutable, SHA256SUMS, SBOM CycloneDX (0 componentes: sin dependencias de terceros), attestation sigstore de los 4 assets, revocations idénticas al repo, `init`/`sync --require-attestation`/`doctor`/`status --check` verificados desde el release público. Auditoría PLATFORM 92.5/100 sobre `5a60072` (`.audit/reports/AUDIT-PLATFORM-5a60072.md`), vigente para `0ffe68d` (solo cambió `.audit/**`). |
| M5.4 canary `template-starter@v2.0.4 → v3` | **En curso, NO cerrado.** PR #4 en `template-starter` (`b72d099`): lock por SHA y L3 real PASS, pero bloqueada por el ruleset (ver «Hallazgos del canary»). |
| M5.5 `v3.0.0` | **No publicada**: exige canary PASS. |
| M6 (repos GI) | **No abierto**; requiere autorización explícita. |

Hecho y verificado para rc.1: parity 95/95 con `UNMAPPED=0`; P33, P29, P41/C6, C5 (Claude Code y Codex CONFIRMED; OpenCode `NOT_AVAILABLE_FROM_TOOL`), C3, L3 reusable, migrador v2→v3 y métricas DoD (10/11, 1 `PROXY_ONLY`).

## Auditoría PLATFORM (el bloqueo de rc.1)

| Commit auditado | Score | Notas |
|---|---|---|
| `47bd24f` | 77 | primera pasada |
| `main` tras #47 | 74 | re-auditoría; hallazgo crítico real corregido (#49) |
| `main` previo a #51 | 79 | tercera pasada |
| `ccd981f` | **86** | sin BLOCKER ni CRITICAL; MAJOR en Q7/Q8 |

No se baja el umbral, no hay waivers. La PR de remediación `fix/platform-remediation-86` ataca los hallazgos F1–F8 de la auditoría de `ccd981f`; tras su merge humano hay que **ejecutar una auditoría nueva sobre el SHA resultante** y guardar su informe en `.audit/reports/` ligado a ese commit. Solo con score ≥ gate se continúa con `release-gate` → `rc.1` → canary → `v3.0.0`.

## Hallazgos del canary (2026-10-05)

* **C-1, defecto de plataforma (corregido en la PR `fix/migrate-revert-crlf`):** `migrate revert` comparaba hashes crudos y trataba como «editado por el usuario» todo archivo creado cuando el checkout convierte LF→CRLF (`core.autocrlf=true`, el caso normal en Windows), dejando el PR sin revertir (PARTIAL). Con un checkout LF el rollback ya era limpio y byte-idéntico a `main`. Test de regresión: falla sin el fix, pasa con él.
* **C-2, bloqueo externo (decisión humana, no tocado):** `migrate apply` retiró `.github/workflows/ci.yml` de `template-starter` (idéntico a Template, propiedad de la plataforma) y el ruleset `template-starter-main` exige los checks `circuit-tests`, `product-tests` y `local-reconciler-tests`, que salían de ese archivo. En la PR solo existe `l3 / l3-consumer`, así que queda `BLOCKED` y nadie puede mergearla sin cambiar el ruleset de `template-starter`. No se modifica ese ruleset ni se añaden jobs a `template-starter` (sin capacidades nuevas). Opciones para el maintainer: sustituir los contextos requeridos por `l3 / l3-consumer`, o conservar `ci.yml` con `--keep`. Gap de plataforma asociado: `plan` debería avisar cuando un workflow retirado produce un check requerido por el ruleset del consumidor.
* Los pendientes conocidos siguen abiertos: alerta #10 de code scanning, F2 (0 aprobaciones) y la revocación de claves antiguas de `ai-native-trust` (NO VERIFICADO).

## Seguridad y gobernanza (vigente)

* **Secretos (D5, cerrado):** `TRUST_APP_*` solo en el Environment `ai-native-trust` (restringido a `main`); sin secretos de repositorio; `WORKER_*` eliminados de GitHub (la App sigue instalada, sin credenciales expuestas). Tres validaciones reales PASS. Detalle y causa del 401 en `SECRETS-BOUNDARY.md`.
* **Pendiente humano:** revocar las claves privadas antiguas de `ai-native-trust`. No verificable por API; **no se da por hecho**.
* **Merge humano (D6):** el agente no mergea ni aprueba Environments con credenciales del owner. Limitación conocida (F2): no hay segunda identidad humana impuesta por el servidor mientras exista un solo maintainer (`required_approving_review_count = 0`); documentado en `HITL-MERGE-POLICY.md`, no ocultado.
* **Plano de control (D7):** un PR que toque `.github/**`, `governance/gates/`, etc. deja `trust-gate = neutral`; `merge-gate` lo bloquea hasta la aprobación humana en `ai-native-human-review`. `neutral` nunca es PASS.
* **SHA pinning (F8):** `sha_pinning_required = true` a nivel de repositorio desde 2026-10-04 (todas las acciones ya estaban fijadas por SHA; `pin-check` lo valida en CI). Verificado con el CI de la PR de remediación.
* **LICENSE (D8):** propietaria, All Rights Reserved (PR #51).
* **Alertas:** triage completo en `governance/security/ALERTS-TRIAGE-2026-10-04.md`.

## Dependabot

* #48 (`actions/checkout` 4.2.2 → 7.0.1): toca el plano de control; fail-closed esperado (`docs-gate`, `trust-gate = neutral`, `merge-gate`). **Sin mergear**; requiere revisión humana y una nota de gobernanza.
* #23–#26 (dependencias de `legacy/` y `foundation/`): sus parches están aplicados en la PR de remediación; se cierran tras su merge.

## Decisiones y hechos que no se reescriben

* Commits `wip:` ya mergeados (`d4522af`, `77be44d`, `58358e8`, `bf435fe`, `189f2af`, `6e30b3a`, `6d02325`, `7d25e6d`, `81f06a1`, `5e79672`): la historia publicada no se reescribe; desde entonces los commits son descriptivos.
* PRs #30, #31 y anteriores se mergearon bajo una dispensa de merge que ya no existe (D6).
* Template `v2.0.6` publicada y rulesets activos en `template` y `template-starter`; `template-starter` sigue en la baseline v2.0.4 para el canary. El checkout local del maintainer en `<workspace>/template` tiene `ci.yml` modificado sin commitear; no se tocó.
