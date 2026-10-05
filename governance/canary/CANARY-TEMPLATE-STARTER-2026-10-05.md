# Evidencia del canary: `template-starter@v2.0.4 → AI-Native v3` (M5.4)

Estado: **PR lista sobre `v3.0.0-rc.2`, merge humano pendiente** (ver «Actualización a rc.2»; las secciones siguientes describen la primera pasada sobre rc.1). Este documento es evidencia, no una declaración de cierre: el canary solo está cerrado cuando la PR se mergea y el consumidor queda funcionando sobre el release.

## Qué es el canary

`jlbellonGmail/template-starter` como consumidor *brownfield*: base = `main` (tag `v2.0.4` + su PR #1 de CI, `5d26ec9`). No se actualizó a Template v2.0.5/v2.0.6 antes de migrar y **no se añadió ninguna capacidad** a `template-starter`. Se migra a `jlbellonGmail/ai-native` `v3.0.0-rc.1` (commit `0ffe68ddbfb9e8a096ee4fdaf57cd5cdd2fa5d6c`, digest `sha256:53f8cb56b348077ec7f92ef184c83c7f99b47d094287f868426b04171350b10f`).

| Dato | Valor |
|---|---|
| PR | `jlbellonGmail/template-starter#4`, rama `canary/ai-native-v3.0.0-rc.1` |
| HEAD | `b72d099e061b2eda70b8c4fe4eb7dacd761dc937` |
| Generado por | `runtime/migrate/migrate.mjs apply` (journal `.ai-native/migration-journal.json`) |
| Estado | `CLEAN` / `MERGEABLE`, `l3 / l3-consumer` success (run 37261668915) |

## Cadena de evidencia

1. **Plan** (solo lectura): 166 archivos idénticos a Template, 9 modificados, 0 `UNKNOWN`, 0 colisiones; retira 105 archivos propiedad de la plataforma (95 se borran; 10 los reemplaza un equivalente v3: 8 cambian de contenido y 2 quedan iguales) y crea 7.
2. **Migración**: lock por SHA (`ai-native.lock.json`, canal `rc`) y caller `.github/workflows/ai-native.yml` con `uses: …/l3-consumer.yml@0ffe68d…` (SHA completo, `contents: read`, sin secretos, solo `pull_request` sobre `main`). No toca `runs/`, `.audit/`, `ROADMAP.md`, `STATUS.md` ni `docs/producto/`.
3. **Reproducibilidad**: una migración nueva desde un clon limpio, con la plataforma integrada (#55 + #56), produce un árbol de git **idéntico** al de la PR #4 (`02ce7fe7df4042f2484eb588371830747cf4fb16`).
4. **L3 real** (run 37261668915): raíz de confianza desde el lock de la cabeza, `bootstrap sync --require-attestation` PASS, `doctor` PASS, lock PASS, bootstrap `READY v3.0.0-rc.1`, integridad PASS, ASSESS de 110 rutas → `FULL` (score 207, riesgo `HIGH`).
5. **Revisión independiente** sobre `b72d099`: ACCEPT, sin bloqueantes. Comprobó los 105 hashes retirados contra la base, el lock contra el release real, el caller y el ruleset.

## Hallazgos del canary (reales, no se ocultan)

| Id | Hallazgo | Estado |
|---|---|---|
| C-1 | `migrate revert` trataba la conversión LF→CRLF (`core.autocrlf=true`, normal en Windows) como edición del usuario: el rollback quedaba `PARTIAL` y conservaba 16 archivos migrados. | **Corregido en la PR #55** (con test que falla sin el fix). Con la plataforma de #55 el rollback da `REVERTED` e **idéntico a `main`** (árbol `72efd27349a516a7935e8b8e1a66ab1f80e5f52b`) en checkout LF **y** CRLF. Con el código de rc.1 el checkout CRLF sigue `PARTIAL`. |
| C-2 | La migración retira el `ci.yml` de `template-starter`, y el ruleset exigía `circuit-tests`, `product-tests` y `local-reconciler-tests`: esos checks dejaban de existir y la PR no se podía mergear, sin aviso previo. | **Guarda en la PR #56** (`RULESET_REQUIRED_CHECK_WILL_DISAPPEAR` en `plan`/`apply`, probada contra el starter real y su ruleset real). **Ruleset migrado por decisión humana** (ver abajo). |
| C-3 (menor) | Quedan en `template-starter` referencias a rutas retiradas: `post-hitl-merge-gate.yml` llama a `scripts/complete-approved-pr.ps1` (borrado) y solo corre con base `develop`, rama que no existe; `README.md`, `AGENTS.md` y `docs/` mencionan `scripts/`, `tests/`, `pytest`, `ci.yml`. | **Abierto**, seguimiento propio de `template-starter` (la migración se limita a lo que posee la plataforma). No rompe nada hoy. |

### Migración del ruleset de `template-starter` (decisión C-2 del maintainer)

Ruleset `template-starter-main` (id 24421920), aplicado el 2026-10-05:

- **Antes**: checks requeridos `circuit-tests`, `product-tests`, `local-reconciler-tests` (integración 15368).
- **Después**: exactamente uno, `l3 / l3-consumer` (integración 15368 = GitHub Actions), producido por el caller L3 fijado por SHA.
- Sin cambios: enforcement `active`, **sin bypass actors**, PR obligatoria, `deletion` y `non_fast_forward`, solo `refs/heads/main`. Verificado por `GET /rulesets/24421920` y `GET /rules/branches/main`; la protección clásica no existe (404).
- No se conservó `ci.yml` con `--keep` (depende de `tests/` y `scripts/`, que la migración retira) ni se añadió ningún job para satisfacer nombres legacy.
- Marcha atrás: el cuerpo anterior del ruleset está guardado y puede reponerse con un `PUT` a ese mismo id.

## Rollback demostrado

| Checkout | Plataforma | Resultado |
|---|---|---|
| LF (`autocrlf=false`) | #55 + #56 | `PASS`, árbol idéntico a `main` |
| CRLF (`autocrlf=true`) | #55 + #56 | `PASS`, árbol idéntico a `main` |
| CRLF (`autocrlf=true`) | rc.1 (sin el fix) | `PASS_WITH_WARNINGS`, 16 archivos conservados (defecto C-1) |

## Qué falta para cerrar M5.4

1. ~~Mergear #55 y #56 y publicar `rc.2`~~: hecho (rc.2 publicada sobre `51ef185`; ver `governance/versioning/RC2-READINESS.md`).
2. Recomendado: `migrate bump` del canary a rc.2 (PR de dos archivos) y volver a pasar L3.
3. Merge humano de la PR #4.
4. Comprobar que `main` de `template-starter` queda sano y que el ruleset exige un check que de verdad se reporta.

Nada de lo anterior se da por hecho.

## Actualización a rc.2 (2026-10-05)

| Dato | Valor |
|---|---|
| PR | `jlbellonGmail/template-starter#4`, HEAD `4b319291fb55e01cfaa50be578244f03e48a9cf9` (2 commits sobre `5d26ec9`) |
| Plataforma consumida | `v3.0.0-rc.2`, commit `51ef1859fbb39af5f0c82547597faa54aa945457`, digest `sha256:55b9589f7f78f7f0acd15ccffb2b297fe199889206a8f04123cfc45e266f6e0f`, canal `rc` |
| Estado | `CLEAN` / `MERGEABLE`; `l3 / l3-consumer` success (run 37349342123) |
| Ruleset `template-starter-main` | activo, **sin bypass actors**, único check requerido `l3 / l3-consumer` (sin huérfanos) |

* **Generación:** `migrate plan` y `apply` con el migrador del tag `v3.0.0-rc.2` desde un clon limpio de `main` (`--tool claude --tool codex`, como la PR original; sin guarda de ruleset disparada). El árbol resultante difiere del de rc.1 solo en journal, lock y caller L3. Un `bump` en caliente se descartó a propósito: dejaba el journal con los hashes del rc.1 y el `revert` conservaba 2 archivos como «editados».
* **L3 real (run 37349342123):** `sync --require-attestation` PASS, `doctor` PASS, lock `v3.0.0-rc.2 51ef185`, bootstrap `READY v3.0.0-rc.2`, integridad PASS, ASSESS de 110 rutas → `FULL` (score 207, riesgo `HIGH`).
* **Rollback con el migrador de rc.2:** `revert` en checkout LF y CRLF (`autocrlf=true`) → árbol `72efd27349a516a7935e8b8e1a66ab1f80e5f52b`, **idéntico** a `main`; repetido por el revisor independiente.
* **Revisión independiente nueva sobre `4b31929`: ACCEPT**, sin bloqueantes (pins, 105 hashes retirados contra la base, 2.º commit = 3 archivos, CI, ruleset, rollback). Notas no bloqueantes: raíz de confianza = lock de la cabeza por ser la primera adopción (el gate la acota), aviso de STATUS.md ya existente, 0 aprobaciones requeridas (F2).
* **Pendiente:** merge humano de la PR #4.
