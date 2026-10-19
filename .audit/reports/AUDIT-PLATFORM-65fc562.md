---
targetRepo: jlbellonGmail/ai-native
targetCommit: 65fc5628d6e567d5771a83be5ef962c771c8e5d7
platform:
  version: "v3.3.1 candidate"
  commit: 65fc5628d6e567d5771a83be5ef962c771c8e5d7
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-10-18T22:45:42Z"
scope: "Independent read-only PLATFORM 1.2 audit of the exact v3.3.1 PATCH candidate (v3.3.0..65fc562, develop 3c9fe11..65fc562) and of the live GitHub control plane. Auditor did not take part in the implementation. No fix, push, merge, tag or release."
score: 90.75
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v3.3.1)

## A. Identificación y veredicto

```text
Repositorio:   jlbellonGmail/ai-native (C:\Proyectos\ai-native)
Rama:          release/v3.3.1 (= origin/release/v3.3.1; PR #139 abierta hacia develop)
Commit:        65fc5628d6e567d5771a83be5ef962c771c8e5d7 (= candidato esperado)
Tag:           ninguno (v3.3.1 no existe local ni remoto; release v3.3.1: 404)
Fecha:         2026-10-18
Estándar:      QUALITY_SCORE 1.1 + AUDIT_RULES 1.1 + perfil PLATFORM 1.2 (auditMethod 1.2)
Auditor:       Claude Code (claude-opus-5-5), independiente del Builder
Entorno:       Windows 11, Git Bash, node v26.12.0, pwsh, gh autenticado (solo lectura)
Worktree:      limpio al empezar y al terminar la verificación (git status --short vacío)
```

**Veredicto: APTO.** 0 BLOCKER, 0 CRITICAL, 0 MAJOR. Score bruto 90.75/100, sin N/A y sin Quality Gate aplicado. Confianza MEDIA (ver §E).

**Independencia, con un límite.** No usé conclusiones previas como evidencia. Vi el score del informe `f3af342` (91.50) en su front matter antes de puntuar y leí su lista de hallazgos después de fijar mi evaluación inicial (§68). Los hallazgos heredados solo se cuentan si se re-verificaron en vivo o si se comprobó con `git diff d98a89e..HEAD` que su área no cambió (§G).

## B. Git, ancestry y diff real

| Comprobación | Resultado |
|---|---|
| `HEAD` = candidato | `65fc5628…` PASS |
| `v3.3.0` (tag anotado `c62bccc` → `ae6d50b`) ancestro de HEAD | PASS |
| `develop` `3c9fe11` (= `origin/develop`) ancestro de HEAD | PASS |
| `origin/main` `715c5dc` ancestro de HEAD y `v3.3.0` ancestro de main | PASS / PASS |
| `v3.3.0..HEAD`, primer padre | #136 (sync main→develop), #137 (Capability Routing), #138 (CI develop), `8b5dafd` CLI_VERSION, `f3af342` docs v3.3.1, `65fc562` informe de auditoría |
| `develop..HEAD` | 6 archivos: `.audit/reports/AUDIT-PLATFORM-f3af342.md`, `SESSION-CONTEXT.md`, `execution/current/README.md`, `V3.3.1-PATCH.md`, `runtime/cli/ai-native{.mjs,-lifecycle.test.mjs}` |
| `main..HEAD` | 19 archivos, todos explicados por #137, #138 y la preparación de release |
| `git diff --check v3.3.0 HEAD` | sin salida, exit 0 |
| Sin cambios desde v3.3.0 en | `AGENTS.md`, `CLAUDE.md`, `contracts/**`, `core/commands/**`, `core/kernel.md`, `governance/gates/**`, `runtime/{gates,circuit,policy,bootstrap,adapters,release}/**`, `pilot.yml`, `release.yml` |

Código de producto efectivamente modificado: un literal (`CLI_VERSION`), texto de la skill `sdd` y de 3 roles, `pull_request.branches` de 8 workflows y aserciones de tests. Sin código runtime nuevo.

## C. Capability Routing

| Requisito | Evidencia | Estado |
|---|---|---|
| Fuente canónica única | `git grep "Capability routing"`: la política está solo en `.agents/skills/sdd/SKILL.md:39-53`; `core/roles/{planner,builder,reviewer}.md` añaden 5 líneas que remiten a esa sección | VERIFICADO |
| Integración con `/feature`, SDD manual y `/sdd-implement-all` | `core/commands/feature.md:3`, `sdd-implement-all.md:3` y los 9 `/sdd-*` dicen «Load the `sdd` skill»; los subagentes (`builder`, `reviewer`, `planner`) llevan la referencia en su rol | VERIFICADO (E3) |
| Silencio por defecto | «If they are, continue: no message, no artifact, no record, no extra step»; «Check again only on a new need, never per task» | VERIFICADO (texto) |
| Sin comandos, estados, gates, HITL ni framework nuevos | `core/commands/**`, `contracts/**` (incluida `state-machine.json`), `governance/gates/**` y `runtime/**` (salvo el literal del CLI) sin cambios; «this check adds no gate» | VERIFICADO |
| Sin proveedores hardcodeados | la sección nombra tipos de brecha (knowledge, external information, external system, verification); el test `knowledge.test.mjs:144` niega `context7, supabase, github, figma, playwright, devtools, claude, codex, opencode, mcp…` sobre la skill proyectada | VERIFICADO (E4) |
| Llega al consumidor | `consumerFiles()` v3.3.0 frente al candidato: 8 de 47 proyecciones cambian (`.claude/agents/*`, `.opencode/roles/*`, `.claude/skills/sdd/SKILL.md`, `.opencode/skills/sdd/SKILL.md`) | VERIFICADO (E4) |
| Comportamiento con agentes reales (casos A–E) | no hay evaluación conductual; el cumplimiento depende del modelo | NO VERIFICADO (N-24) |

## D. Verificación ejecutable

### D.1 Réplica local de `ci.yml` (job `validators`)

Ejecuté los 49 pasos de `ci.yml`, en el mismo orden y con los mismos comandos, más `pr-gate` contra tres bases y `validate-actions-pinned`. Diferencias con CI: `hitl.mjs --base v3.3.0` en lugar de `origin/${base_ref}`; red no forzada en el paso pilot.

```text
53/53 pasos exit 0. 987 tests node:test, 0 fail, 0 skipped.
Incluye: parity UNMAPPED=0, contracts, core, doc-drift, integrity, entrypoints,
runtime/cli 64/64, runtime/consumer 36/36, gates 62/62, release 30/30,
pilot 55/55, audit 16/16 + `audit check` PASS, evals L1 PASS,
pr-gate --base 3c9fe11 / v3.3.0 / origin/main: PASS, pin-check PASS.
```

### D.2 Suite del gate de `release.yml`

`AI_NATIVE_REQUIRE_NETWORK=1 GH_TOKEN=… node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs`

| Corrida | Resultado | Falla |
|---|---|---|
| 1 | 1001/1003, exit 1 | `runtime/adapters/consumer-launcher.test.mjs` F-19 (2 tests): `git add -A` → `unable to write file .git/objects/…: Permission denied` en el repo temporal |
| 2 | 1002/1003, exit 1 | `runtime/policy/architecture.test.mjs` «scanning is near-linear» (4309 ms frente al umbral de reloj) |
| Aislado | `consumer-launcher.test.mjs` 10/10 ×3; `architecture.test.mjs` 24/24 ×3 | — |

En cada corrida falla un test distinto, y ninguno se reproduce aislado. Ambos archivos y los módulos que prueban no cambiaron desde v3.3.0. Clasificación: inestabilidad no determinista del host Windows bajo la carga paralela de 1003 tests (bloqueo de archivos y reloj), no una regresión del candidato. **G3 no se aplica:** la suite principal requerida (`ci.yml`) pasa completa en local (D.1) y en remoto sobre el SHA exacto (D.4). La suite de release corre en `ubuntu-latest` y se ejercita en el `build` del tag. Se puntúa en Q5.3 (N-27, N-29).

### D.3 Build y reproducibilidad

| Comprobación | Resultado |
|---|---|
| `build.mjs --version v3.3.1 --commit 65fc562` ×2 | exit 0 ambas; `cmp` idéntico; digest `sha256:f0709d6b53f78c01f00c14b153c00a6873233591fd9b0555f00251e45edc47ae`; 226 archivos; SHA256SUMS idéntico |
| Negativo: `--version v3.3.0` sobre el candidato | exit 1 «declares CLI_VERSION v3.3.1; this release is v3.3.0» (fail-closed) |
| Negativo: `--version v3.3.1` sobre `develop` `3c9fe11` | exit 1 «declares CLI_VERSION v3.3.0» (el bump es necesario) |
| Rebuild de `v3.3.0` sobre `ae6d50b` frente a la release publicada (`gh release download`) | digest `0c21bbae…` = publicado; `platform.json` y `ai-native-cli.mjs` byte-idénticos; SHA256SUMS coincide |

### D.4 Configuración remota (gh, solo lectura)

| Elemento | Estado verificado |
|---|---|
| CI del SHA exacto (PR #139 → develop) | CI, pr-gate, security-scan, SBOM, Trivy, Dependency review, Supply chain y CodeQL: success. Checks: validators (ubuntu-latest) y (windows-latest), pin-check, pr-gate, analyze ×2, trivy-fs, sbom, dependency-review: SUCCESS |
| Ruleset `ai-native-main` | activo; ~DEFAULT_BRANCH; 0 bypass; deletion, non_fast_forward y pull_request (`required_approving_review_count 0`); 6 checks requeridos (`validators` ×2, `pin-check`, `pr-gate`, `ai-native/trust-gate`, `ai-native/merge-gate`), estricto |
| `develop` | `rules/branches/develop` = `[]` (sin ruleset) |
| Rulesets de tag | 0 |
| Métodos de merge | merge, squash y rebase permitidos |
| Release v3.3.0 | publicada, `immutable: true`, 8 assets |
| Alertas | CodeQL abiertas: 1 (#27 `actions/untrusted-checkout/medium`, `l3-consumer.yml:116`, archivo sin cambios); Dependabot 0; secret scanning 0 |

### D.5 release-gate y audit check

`node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 65fc562… --root .` → **PASS_WITH_WARNINGS**, exit 0 (antes de añadir este informe). Único informe CURRENT: `AUDIT-PLATFORM-f3af342.md` (91.50; `f3af342..65fc562` toca solo `.audit/**`); 22 informes históricos STALE. `node runtime/audit/cli.mjs check` → PASS.

## E. SemVer, delta de consumidor e inmutabilidad

**SemVer: PATCH (v3.3.1), aceptado.** Contra `VERSIONING-POLICY.md`: no cambia el lock ni el kernel de `AGENTS.md`, el `bootstrap` sigue en `{"protocol":1,"minCliVersion":"v3.2.0","requiredCapabilities":["adopt"]}` (verificado en el `platform.json` construido) y no cambia ningún schema → no MAJOR. No añade skills, perfiles, MCP, gates ni campos de schema → no MINOR. Es texto compatible en una skill existente, más CI y la declaración de versión → PATCH. Límite: la política no clasifica de forma explícita un cambio de guía conductual dentro de una skill existente. Lectura defendible, ya declarada en `V3.3.1-PATCH.md`.

**Delta del bundle v3.3.0 → candidato (medido con `readShippedFiles`):** 5 archivos modificados de 225 enviados (226 con `platform.json`): `.agents/skills/sdd/SKILL.md`, `core/roles/{builder,planner,reviewer}.md`, `runtime/cli/ai-native.mjs`. `.github/**` no se empaqueta. En `platform.json` solo cambian `version`, `commit`, `digest`, `generatedAt` y los nombres de assets SBOM/provenance. `revocations-1.json` y `cli-revocations-1.json` son byte-idénticos a v3.3.0, así que v3.3.0 no queda revocada. El asset CLI difiere de v3.3.0 en una sola línea (`CLI_VERSION`). Coincide con lo declarado en `V3.3.1-PATCH.md`.

**Consumidores fijados a v3.3.0: sin cambio (VERIFICADO).** La release v3.3.0 es inmutable y re-construible byte a byte. No se revoca nada y `minCliVersion` no sube. Un lock con versión y digest de v3.3.0 sigue resolviendo exactamente los mismos bytes. El cambio llega solo con `ai-native upgrade` o `self-update` explícitos. NO VERIFICADO aquí: el estado real de los 9 consumidores (gobernanza: «no re-verificado» desde 2026-10-12).

**Confianza: MEDIA.** El repositorio, el build, los gates, la CI remota del SHA exacto y la configuración remota se verificaron. No se ejecutaron: la evaluación conductual de Capability Routing, `publish`/`verify` de `release.yml` (necesitan tag, prohibido), el `pilot` offline en Docker, y una corrida completa limpia de la suite de release en este host.

## F. Puntuación

| Criterio | Puntos | Nivel | Causa |
|---|---:|---|---|
| Q1.1 | 3/3 | COMPLETO | `V3.3.1-PATCH.md`, README |
| Q1.2 | 3/3 | COMPLETO | todo lo prometido está presente (§C) |
| Q1.3 | 2.25/3 | MENOR | N-28 |
| Q1.4 | 3/3 | COMPLETO | el bump es necesario y suficiente para el build (D.3) |
| Q2.1 | 3/3 | COMPLETO | build reproducible; lifecycle 64/64 |
| Q2.2 | 2.25/3 | MENOR | F-002 (8 archivos de `governance/` con rutas de workstation, re-verificado) |
| Q2.3 | 3/3 | COMPLETO | — |
| Q2.4 | 3/3 | COMPLETO | CI Ubuntu y Windows en verde sobre el SHA |
| Q3.1–Q3.4 | 12/12 | COMPLETO | una fuente canónica; los roles solo remiten (duplicación necesaria para subagentes de contexto limpio) |
| Q4.1 | 3/3 | COMPLETO | S-1 |
| Q4.2 | 2.25/3 | MENOR | N-11 (heredado, área sin cambios) |
| Q4.3–Q4.5 | 6/6 | COMPLETO | — |
| Q5.1 | 3/3 | COMPLETO | 8 workflows también en PR hacia develop |
| Q5.2 | 2.25/3 | MENOR | N-24; F-003 (heredado, área sin cambios) |
| Q5.3 | 3/4 | MENOR | N-27, N-29 (D.2) |
| Q5.4 | 3/3 | COMPLETO | E2E nuevo; aserciones derivadas de `CLI_VERSION` |
| Q5.5 | 2.25/3 | MENOR | F-004 (heredado, área sin cambios) |
| Q6.1 | 3/3 | COMPLETO | develop → main; commits atómicos |
| Q6.2 | 2.25/3 | MENOR | F-005, N-25 (re-verificados en vivo) |
| Q6.3 | 2.25/3 | MENOR | N-26 (causa raíz compartida con N-28 en la cobertura del pilot) |
| Q6.4 | 3/3 | COMPLETO | PATCH justificado; `CLI_VERSION` = tag |
| Q6.5 | 2/2 | COMPLETO | D.3 |
| Q6.6 | 1.5/2 | MENOR | F-006 (heredado, `runtime/bootstrap` sin cambios) |
| Q7.1 | 2.25/3 | MENOR | F-007 (NO VERIFICABLE por API) |
| Q7.2 | 2/2 | COMPLETO | pin-check PASS; 0 alertas Dependabot |
| Q7.3 | 1.5/2 | MENOR | F-008 (0 rulesets de tag, en vivo); CodeQL #27 |
| Q7.4 | 2/2 | COMPLETO | la política prohíbe activar capacidades con credenciales o permisos |
| Q7.5 | 2.25/3 | MENOR | F-009 (heredado), F-010 (`path: sbom-src`, re-verificado) |
| Q8.1 | 2/2 | COMPLETO | SESSION-CONTEXT, execution/current y V3.3.1-PATCH coherentes con el árbol (salvo N-28, puntuado en Q1.3) |
| Q8.2 | 2/2 | COMPLETO | — |
| Q8.3 | 1.5/2 | MENOR | F-005 |
| Q8.4 | 2/2 | COMPLETO | — |

**Validación matemática:** Q1 3+3+2.25+3 = 11.25 · Q2 3+2.25+3+3 = 11.25 · Q3 12.00 · Q4 3+2.25+2+2+2 = 11.25 · Q5 3+2.25+3+3+2.25 = 13.50 · Q6 3+2.25+2.25+3+2+1.5 = 14.00 · Q7 2.25+2+1.5+2+2.25 = 10.00 · Q8 2+2+1.5+2 = 7.50 → **90.75**. Puntos aplicables: 100 (sin N/A). Gates: ninguno. Score final 90.75, que supera el umbral PLATFORM de 90 sin usar la tolerancia.

**Divergencia con `f3af342` (91.50), −0.75:** Q1.3 −0.75 por N-28 (nuevo). Q5.3 queda igual (3/4) pero por otra causa: se recupera la falta de CI remota del SHA exacto, ahora verificada, y se pierde por la suite de release inestable en ambas corridas (N-27 y el nuevo N-29). El resto coincide.

## G. Hallazgos

| ID | Criterio | Sev. | Tipo | Estado | Descripción · corrección · verificación |
|---|---|---|---|---|---|
| **N-28** | Q1.3 (Q6.3) | MINOR | CONTRADICTORIO | NUEVO | `SESSION-CONTEXT.md` y `V3.3.1-PATCH.md` afirman que `pilot` «se ejercita en la PR develop → main». Pero `pilot.yml` filtra `pull_request` por `paths` (`runtime/{bootstrap,pilot,release}/**`, `evaluation/m52/**`, `pilot.yml`) y `git diff --name-only origin/main HEAD` no toca ninguno: el pilot **no** correrá en esa PR, solo en el `push` a main tras el merge. Corrección: lanzar `pilot` por `workflow_dispatch` sobre la rama antes del merge, o corregir la afirmación. Verificación: un run de `pilot` asociado al SHA promovido antes del tag. |
| **N-29** | Q5.3 | MINOR | RIESGO | NUEVO | `consumer-launcher.test.mjs` (F-19) falla en la suite completa en Windows con `git add` → `Permission denied` sobre `.git/objects` del repo temporal; pasa aislado 10/10 ×3. Preexistente (archivo sin cambios desde v3.3.0). Corrección: reintentar o aislar las escrituras git del harness bajo carga. Verificación: 3 corridas completas limpias en Windows. |
| N-24 | Q5.2 | MINOR | NO VERIFICADO | ABIERTO | Capability Routing sin evaluación conductual con agentes reales; el silencio, la ausencia de bucles y la no re-evaluación por tarea dependen del prompt. Declarado en `V3.3.1-PATCH.md`. |
| N-25 | Q6.2 | MINOR | FALTA | ABIERTO | `develop` sin ruleset (`[]`, en vivo): los checks de sus PR son informativos. El control efectivo está en main. |
| N-26 | Q6.3 | MINOR | ROTO (intermitente) | ABIERTO | `pilot offline` con Docker exit 125 en `ubuntu-latest`, recurrente; causa no investigada. |
| N-27 | Q5.3 | MINOR | RIESGO | ABIERTO | Umbral de reloj de `architecture.test.mjs` falla bajo carga (4309 ms en la corrida 2) y pasa aislado 24/24 ×3. También corre en el `build` de `release.yml`: puede tumbar el build del tag (fail-closed, se resuelve reintentando). |
| F-002 | Q2.2 | MINOR | SOBRA | ABIERTO | Rutas de workstation en 8 archivos de `governance/` (re-verificado); no afectan al bundle. |
| F-003, F-004, F-006, F-009, N-11 | Q5.2, Q5.5, Q6.6, Q7.5, Q4.2 | MINOR | — | ABIERTO (INFERIDO) | Heredados de `d98a89e`. `git diff d98a89e HEAD` vacío en `README.md`, `runtime/{bootstrap,release,gates}`, `evaluation/compat`, `scripts`, `l3-consumer.yml` y `release.yml`; no re-ejecutados. |
| F-005 | Q6.2, Q8.3 | MINOR | FALTA | ABIERTO | `required_approving_review_count 0` (en vivo); un solo maintainer, sin segunda identidad impuesta. |
| F-007 | Q7.1 | MINOR | NO VERIFICADO | ABIERTO | Revocación de claves antiguas de `ai-native-trust` no verificable por API. |
| F-008 | Q7.3 | MINOR | FALTA | ABIERTO | 0 rulesets de tag (en vivo); CodeQL #27 abierta en `l3-consumer.yml:116`. |
| F-010 | Q7.5 | MINOR | INCOMPLETO | ABIERTO | SBOM generado con `path: sbom-src` (metadata genérica). |

**Total: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 16 MINOR (2 nuevos: N-28, N-29).**

**Sugerencias (no puntúan):** S-1: el README (`CLI: v3.3.0 | PLATFORM: v3.2.0`) y el nombre de un paso de `ci.yml` («v3.3.0») son ilustrativos y están desfasados. S-2: el ruleset de main permite squash y rebase. La promoción debe hacerse con merge commit; si no, este informe y el de `f3af342` quedan STALE y el `release-gate` falla cerrado. S-3: aclarar en `VERSIONING-POLICY.md` cómo se clasifica una guía conductual nueva dentro de una skill existente.

## H. Camino a 100

Q1.3 +0.75 (N-28: run del pilot o afirmación corregida). Q2.2 +0.75 (F-002). Q4.2 +0.75 (N-11). Q5.2 +0.75 (N-24 evaluación A–E y F-003). Q5.3 +1.00 (N-27 y N-29: 3 corridas completas limpias). Q5.5 +0.75 (F-004). Q6.2 +0.75 (F-005, N-25). Q6.3 +0.75 (N-26). Q6.6 +0.50 (F-006). Q7.1 +0.75 (F-007). Q7.3 +0.50 (F-008, CodeQL #27). Q7.5 +0.75 (F-009, F-010). Q8.3 +0.50 (F-005, compartido con Q6.2).

Suma: 0.75×10 + 1.00 + 0.50×3 = 9.25. 90.75 + 9.25 = 100.00. Camino completo.

## I. Conclusión

```text
AUDITED_SHA: 65fc5628d6e567d5771a83be5ef962c771c8e5d7
SCORE: 90.75/100 (bruto = final; sin N/A; sin gates)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 16 (nuevos: N-28, N-29)
SEMVER: PATCH (v3.3.1)
BUILD: reproducible (2 builds byte-idénticos; v3.3.0 re-construida = publicada)
CONSUMER_DELTA: bundle 5/225; proyección 8/47 tras upgrade explícito; consumidores v3.3.0 sin cambio
RELEASE_GATE: PASS_WITH_WARNINGS sobre el candidato (antes de este informe)
VERDICT: APTO
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```

Evidencia: los comandos están registrados arriba. Las salidas completas quedaron en el scratchpad de la sesión del auditor (no persistidas en `.audit/evidence/` por instrucción de generar solo el informe).
