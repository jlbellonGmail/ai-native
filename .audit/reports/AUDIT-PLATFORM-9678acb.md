---
targetRepo: jlbellonGmail/ai-native
targetCommit: 9678acb546261f5479ac3d1374e9ffb26cec6230
platform:
  version: "v3.4.0 candidate"
  commit: 9678acb546261f5479ac3d1374e9ffb26cec6230
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-10-26T19:45:10Z"
scope: "Independent read-only PLATFORM 1.2 re-audit of the exact frozen v3.4.0 MINOR candidate 9678acb (v3.3.1..9678acb; delta 81b8d20..9678acb = N-30 fix ef103e9 + docs 9678acb + the 81b8d20 report) and of the live GitHub control plane. Supersedes AUDIT-PLATFORM-81b8d20.md for release purposes (that report stays as history, STALE for this candidate). Auditor did not take part in the implementation. No fix, push, PR, merge, tag or release."
score: 90.25
isMergeGate: false
---

# AI-NATIVE — Re-auditoría PLATFORM 1.2 independiente (candidata v3.4.0, 9678acb)

## A. Identificación y veredicto

```text
Repositorio:   jlbellonGmail/ai-native (C:\Proyectos\ai-native)
Rama:          release/v3.4.0 (local; sin push: release/v3.4.0 y v3.4.0 no existen en origin)
Commit:        9678acb546261f5479ac3d1374e9ffb26cec6230 (= AUDITED_SHA congelado)
Candidata anterior: 81b8d2061ba852e06914564611620d2cf1c750a2 (89.75; informe AUDIT-PLATFORM-81b8d20.md, histórico, STALE)
Base:          develop a00e1683318e6696a320182de507e5d2274a7345 (= origin/develop)
Tag:           ninguno (v3.4.0 no existe)
Fecha:         2026-10-26
Estándar:      QUALITY_SCORE 1.1 + AUDIT_RULES 1.1 + perfil PLATFORM 1.2 (auditMethod 1.2)
Auditor:       Claude Code (claude-opus-5-5), independiente del Builder del fix
Entorno:       Windows 11, Git Bash, node v26.12.1, pwsh 7.6.4, gh autenticado (solo lectura)
Worktree:      limpio al empezar y al terminar la verificación (git status --short vacío)
```

**Veredicto: APTO. Score 90.25/100, en el umbral PLATFORM de 90 o por encima, sin usar la tolerancia.** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR. Sin N/A y sin Quality Gate. Confianza MEDIA (§E). N-30 (M-1) queda **CERRADO**, verificado por el test del Builder, por una sonda propia de 27 casos y por una mutación propia (§C). El margen es de 0.25: cualquier MINOR nuevo puntuable dejaría la candidata por debajo de 90.

**Independencia.** Reevalué los 30 subcriterios Q1–Q8. No arrastré el score anterior. Un hallazgo heredado solo cuenta si lo re-verifiqué en vivo o si el diff `81b8d20..9678acb` sobre su área sale vacío. Los resultados declarados por el encargo (6/6 KILLED, 444 tests, BUILD_SHA256) no estaban registrados en el repositorio, así que no los acepté como dados y los re-ejecuté (§C, §D).

## B. Git, ancestry y diff real

| Comprobación | Resultado |
|---|---|
| `HEAD` = AUDITED_SHA, rama `release/v3.4.0`, worktree limpio | PASS |
| Ancestros de HEAD: `v3.3.1`, `origin/develop` (`a00e168`), `origin/main` (`fefd4b3`), `81b8d20` | PASS ×4 |
| `81b8d20..HEAD` | `4544142` informe de 81b8d20 · `ef103e9` fix(review) · `9678acb` docs(review) |
| `git diff --stat 81b8d20 HEAD` sin `.audit/` | 5 archivos: `runtime/adapters/claude-review.mjs` (+16/−8), `runtime/circuit/review-ledger.test.mjs` (+65/−3), `specs/sdd-independent-review/spec.md`, `knowledge/sdd/methodology/review.md`, `governance/versioning/V3.4.0-RELEASE.md` |
| `git diff --stat v3.3.1 HEAD` | 51 archivos, +4207/−131 |
| `git diff --check 81b8d20 HEAD` | sin salida, exit 0 |
| `package.json`, `pnpm-lock.yaml`, `template/{package.json,pnpm-lock.yaml}`, `VERSION` desde v3.3.1 | sin cambios (`VERSION` = `3.0.0-dev`); `CLI_VERSION` = `v3.4.0` |
| Escaneo del delta (secretos y rutas de workstation) | 1 coincidencia: la tabla del propio informe de 81b8d20 que nombra los patrones. FALSO POSITIVO |
| Área de N-31 y HITL (`review-ledger.mjs`, `independent-review.mjs`, `implement-all.mjs`, `coordinator.mjs`, `runtime/policy`, `review-evidence.mjs`) | `git diff 81b8d20 HEAD` vacío |

## C. N-30 / M-1: verificación del cierre

**Cambio (`ef103e9`).** `verifyClaudeReceipt` recibe `model` (`claude-review.mjs:195`) y, ya identificada la delegación de esta ejecución, añade tres comprobaciones (`:247-249`):

1. Sin modelo proyectado: `the reviewer has no projected model…`, y nada queda atestado.
2. `Object.hasOwn(input, "model") && input.model !== model`: si el campo existe y no es exactamente el proyectado, la delegación no aprueba.
3. `Object.hasOwn(input, "isolation")`: cualquier presencia del campo impide aprobar, incluido `null`.

El attester (`:295`) toma `model = reviewerModel()`, que lee `core/agents.json` `roles.reviewer.claude.model` (`:284-289`), la misma fuente con la que `runtime/adapters/claude.mjs:47` proyecta `model:` en el agente del consumidor. Hay una sola fuente canónica y el verificador no lleva ningún literal. El punto de llamada (`review-ledger.mjs:293`) no pasa `model`, así que siempre rige el default del attester. Un error en estas comprobaciones no anula `observed`, y el veredicto adverso sigue contando (`:259`).

**Evidencia (E4):**

* El test del Builder `N-30 (M-1)` (`review-ledger.test.mjs:313`) pasa dentro de la suite `runtime/circuit`: 256 tests, 254 pass, 0 fail, 2 skip (POSIX).
* La sonda propia `probe-n30.mjs` llama al attester distribuido sobre transcripts sintéticos con el layout del store. Da 27/27 resultados esperados.
* La mutación propia sobre un export del SHA auditado (`git archive`, blob `2cbaa71a…` idéntico) da 7/8 KILLED. Línea base: el test N-30 pasa, sin `Permission denied`.

| # | Requisito del encargo | Evidencia | Estado |
|---|---|---|---|
| 1 | Modelo correcto produce evidencia | sonda 01 (sin `model`) y 02 (`model: "sonnet"`) dan `APPROVED`; test, casos 1–2 | VERIFICADO |
| 2 | `haiku` no aprueba | sonda 03, test: `NOT_PROVEN`/`REVIEW_PENDING`/`required`, ledger vacío | VERIFICADO |
| 3 | `opus` no aprueba | sonda 04, test | VERIFICADO |
| 4 | Id completo distinto no aprueba | sonda 05 (`claude-sonnet-4-5`), test. Extra del auditor: `SONNET`, `" sonnet"` y `["sonnet"]` tampoco (sondas 08–10) | VERIFICADO |
| 5 | `model` vacío o `null` no aprueba | sondas 06–07, test | VERIFICADO |
| 6 | Sin modelo proyectado no se atesta | sonda 26 (`model: null` en el attester) y 27 (`verifyClaudeReceipt` con su default `null`): `evidence: null` | VERIFICADO |
| 7 | `isolation` explícito impide aprobar | sondas 11, 13 (`false`), 14 (`""`) y 15 (modelo proyectado + `worktree`) | VERIFICADO |
| 8 | `isolation: null` no escapa | sonda 12, test | VERIFICADO |
| 9 | `subagent_type` validado estructuralmente | `:223` filtro `subagent_type === "reviewer"`; `:227` agent_id de la línea `agentId:` del propio `tool_result`. Sondas 18 (`general-purpose`) y 22 (sin línea `agentId`): sin evidencia. Test M9 | VERIFICADO |
| 10 | Prompt canónico, nonce, revisión, veredicto y agent_id obligatorios | `:243-244`, `:255-258`, `:227`. Sondas 19–22. Tests M1 (prompt moldeado), M7/M8, H1, F | VERIFICADO |
| 11 | Un follow-up invalida la aprobación | `:240`. Sonda 23. Tests A ×3 | VERIFICADO |
| 12 | El adverso domina | `runVerdict`, `chooseRun`, `attestedRunsOf`. Sonda 24 (adverso con `haiku`: `observed` = `CHANGES_REQUESTED`). Test N-30, último bloque: `finalReviewStatus` = `CHANGES_REQUESTED`. Tests M11, B | VERIFICADO |
| 13 | Fail-closed | Todo mismatch da `evidence: null`, que lleva a `NOT_PROVEN`/`REVIEW_PENDING`/`HUMAN_GATE required` (aserción explícita en el test N-30). Una respuesta ilegible da `NEEDS_HUMAN_DECISION` (H1) | VERIFICADO |

**Mutaciones (paso 4).** Las 6 declaradas, reconstruidas y re-ejecutadas contra el test `N-30` (todas mueren por aserción del producto, ninguna por `Permission denied`):

| Mutante | Resultado |
|---|---|
| M1 eliminar la comparación de `model` | KILLED |
| M2 eliminar el chequeo de `isolation` | KILLED |
| M3 aceptar la ausencia de modelo proyectado | KILLED |
| M4 el attester no pasa `model` | KILLED |
| M5 comparación por substring (`id.includes(projected)`) | KILLED |
| M6 `isolation` rechazado solo si es truthy | KILLED |
| M7 (auditor) substring inverso (`projected.includes(value)`) | KILLED |
| M8 (auditor) comparación insensible a mayúsculas | **SURVIVED** |

Las 6 mutaciones declaradas quedan verificadas: 6/6 KILLED. M8 sobrevive porque ningún caso del test usa otra capitalización. El código real es estricto (sonda 08). Además, aceptar `"Sonnet"` seguiría designando el mismo modelo. Es un mutante de impacto bajo, casi equivalente, y no puntúa (S-5).

**Residuales del fix (no puntúan, dentro del contrato y del modelo de amenaza declarados):**

* **S-4:** el control es un denylist dirigido. Un campo de entrada desconocido de la delegación (sonda 25: `cwd`) sigue aprobando. NO VERIFICADO si la herramienta `Agent` actual expone otro campo capaz de cambiar quién revisa o qué árbol lee. El cambio mínimo sería un allowlist `{description, subagent_type, prompt, model}`.
* **S-6 (INFERIDO):** se verifica el modelo que la delegación *pide*, no el que *ejecutó*. Un agente proyectado editado en el `.claude/` del consumidor, o un override del modelo de subagentes por configuración o entorno del runtime, no se ven en el input de la delegación. `claude-review.mjs:24-26` y `review.md` declaran fuera de alcance a quien puede escribir `.claude/` o el store. Un endurecimiento posible es contrastar el `message.model` de los turnos del subagente.

**Conclusión N-30: CERRADO.** Se cumple el criterio de verificación de 81b8d20 («test con `model` y con `isolation` → no aprueba»). La documentación que describe el control (`spec.md`, `review.md`, `V3.4.0-RELEASE.md` §3 y la nota de delegación proyectada) coincide con el código: `validate-doc-drift` PASS y `validate-entrypoints` PASS.

## D. Verificación ejecutable

### D.1 Réplica local de `ci.yml` (job `validators`)

El runner del auditor (`ci-replica.mjs`) extrae los 51 pasos `run:` de `ci.yml` y los ejecuta literales y en orden; los otros 2 pasos del job son `uses:` (checkout y setup-node). Única diferencia con CI: `hitl.mjs --base v3.3.1` en lugar de `origin/${base_ref}`.

```text
Primera pasada: 49/51 pasos exit 0. node:test 1083 tests, 1075 pass, 6 fail, 2 skipped.
  Fallaron: paso 30 runtime/adapters (5 tests) y paso 43 runtime/migrate (1 test),
  todos con `git add`/`git commit` → `unable to write file .git/objects/…: Permission denied` (N-29).
Re-ejecución literal de los 2 pasos: adapters 84/84 ×2, migrate 122/122; 0 `Permission denied`.
→ 51/51 pasos con resultado PASS en este host. circuit 254/254 (+2 skip FIFO/permisos POSIX),
  hitl --base v3.3.1: «risk high, human_gate required»; constitution, doc-drift, integrity,
  entrypoints, audit check, evals L1: PASS; pilot y migrate-v2 con red: PASS.
```

### D.2 Suite del gate de `release.yml`

Los 6 validadores (`parity`, `contracts`, `core`, `integrity`, `doc-drift`, `actions-pinned`) dan PASS. `AI_NATIVE_REQUIRE_NETWORK=1 node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs` da 1073 tests, 1060 pass, **11 fail**, 2 skipped, exit 1. Los 11 fallos (5 archivos: `consumer-launcher`, `review-ledger` (N-30, M11 y otro), `l3`, `trust-gate`, `migrate-v2`) tienen la **misma primera aserción**: `git add`/`git commit` → `Permission denied` en el repo temporal que monta el harness. Por ejemplo, N-30 falla en `consumer()` (`review-ledger.test.mjs:341` → `:45` → `:20`) antes de ejecutar código de producto. Aislados: `l3` 24/24, `trust-gate` 9/9, `migrate-v2` 26/26, `consumer-launcher` 5/10 y `review-ledger` 40/43 (+2 skip), y sus fallos aislados también son `Permission denied`. **Ningún fallo de ninguna corrida tiene una aserción de producto, y cada test fallido pasó en al menos otra corrida** (D.1 y §C).

**G3 no se aplica.** Por la misma regla que en 81b8d20: la suite principal (`ci.yml`) pasa completa en este host con la re-ejecución de 2 pasos. La causa es del host y no del candidato (§19 AUDIT_RULES), y no hay evidencia nueva de regresión funcional. **N-29 se mantiene, con más frecuencia**: 11 fallos en lugar de 3 en la suite de release, y ahora también afecta a la primera pasada de `ci.yml`. Se puntúa en Q5.3.

### D.3 Build y reproducibilidad

| Comprobación | Resultado |
|---|---|
| `build.mjs --version v3.4.0 --commit 9678acb…` ×2 | exit 0 ambas; `cmp` y `diff -r` idénticos; tarball `sha256:00bd0a11e4048a9f07cd90cdb85f80a71c360b2ec214363306fb1a48b1842f82` (= BUILD_SHA256 declarado); 230 entradas |
| Contenido del bundle | `runtime/adapters/claude-review.mjs` = blob `2cbaa71a…` del SHA auditado (≠ `4b5fd18e…` de 81b8d20): el fix está en el artefacto. `core/agents.json` → reviewer `sonnet`. 0 rutas `template/` |
| Negativo: `--version v3.3.1` | exit 1 «declares CLI_VERSION v3.4.0; this release is v3.3.1» (fail-closed) |
| `platform.json` frente a la release publicada v3.3.1 (`gh release download`) | `schemaVersion`, `components`, `capabilities` y `bootstrap` idénticos. Solo difieren `generatedAt` y los nombres versionados de `sbom` y `provenance`. `revocations-1.json` y `cli-revocations-1.json` byte-idénticos |

### D.4 Configuración remota (gh, solo lectura)

| Elemento | Estado verificado |
|---|---|
| CI del SHA exacto | **NO VERIFICADO**: `9678acb` no está en origin (`git branch -r --contains` vacío) |
| Ruleset `ai-native-main` | activo; requeridos `validators (ubuntu-latest)`, `validators (windows-latest)`, `pin-check`, `pr-gate`, `ai-native/trust-gate`, `ai-native/merge-gate`; `required_approving_review_count 0`; merge, squash y rebase |
| `develop` / rulesets de tag | 0 reglas / 0 rulesets |
| Release v3.3.1 | publicada, `immutable: true` |
| Alertas | CodeQL abiertas: 1 (#27 `actions/untrusted-checkout/medium`, `l3-consumer.yml:116`). Dependabot abiertas: 6 (#145–#150, sin cambios, §G N-32). Secret scanning: 0 |
| Pilot | `fefd4b3` y `4974fa6` success (push a main); `8d5e313` failure (PR, 2026-10-18), sin corridas nuevas |
| Docker / Linux local | daemon de Docker no disponible; WSL Ubuntu sin node: `pilot offline` y tests POSIX NO VERIFICADOS aquí |

### D.5 release-gate y audit check

Antes de este informe: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 9678acb… --root .` → **FAIL**, exit 1: «no current valid PLATFORM audit report», más 25 informes STALE (ahora incluye `81b8d20`). Es lo esperado. `audit check` → PASS.

## E. SemVer, delta de consumidor y confianza

**SemVer: MINOR (v3.4.0), sin cambios respecto a 81b8d20.** El fix es más estricto: rechaza delegaciones que antes aprobaban. No cambia ningún contrato, schema, `bootstrap`, `protocol` ni `minCliVersion` (D.3). Una delegación conforme a la nota proyectada (sin `model` ni `isolation`) sigue aprobando.

**Delta de consumidor frente a 81b8d20:** la nota proyectada en los comandos Claude añade «Pass no `model` and no `isolation`…». Los consumidores fijados a v3.3.1 no cambian sin un `upgrade` explícito.

**Confianza: MEDIA.** No se verificó: la CI remota del SHA exacto (no está en origin), un E2E con Claude Code real ejecutando el Reviewer, FIFO y permisos POSIX (Windows), el `pilot offline` en Docker, ni una corrida limpia de la suite de release en este host (N-29).

## F. Puntuación (reevaluada criterio por criterio)

| Criterio | Puntos | Nivel | Causa |
|---|---:|---|---|
| Q1.1 | 3/3 | COMPLETO | `V3.4.0-RELEASE.md`, spec, `review.md` |
| Q1.2 | 3/3 | COMPLETO | capacidades declaradas presentes; el control model/isolation declarado existe (§C) |
| Q1.3 | 2.25/3 | MENOR | N-31 (contradice `review.md:51` y `:73`). La documentación nueva de N-30 es coherente con el código |
| Q1.4 | 3/3 | COMPLETO | — |
| Q2.1 | 3/3 | COMPLETO | build reproducible |
| Q2.2 | 2.25/3 | MENOR | F-002 (re-verificado: 4 archivos de `governance/` con rutas de workstation; el delta no añade ninguna) |
| Q2.3, Q2.4 | 6/6 | COMPLETO | — |
| Q3.1–Q3.4 | 12/12 | COMPLETO | el modelo permitido sale de `core/agents.json`, la misma fuente que la proyección; mecánica Claude solo en el adapter; core runtime-neutral |
| Q4.1 | 3/3 | COMPLETO | S-1 |
| Q4.2 | 2.25/3 | MENOR | N-11 (`README.md` sin cambios) |
| Q4.3–Q4.5 | 6/6 | COMPLETO | — |
| Q5.1 | 3/3 | COMPLETO | — |
| Q5.2 | 2.25/3 | MENOR | N-24, F-003 (heredados) |
| Q5.3 | 3/4 | MENOR | N-29 (más frecuente, mismo origen), N-27; CI remota del SHA exacto NO VERIFICADA |
| Q5.4 | 3/3 | COMPLETO | test por amenaza, más el test N-30 nuevo; 6/6 mutantes declarados KILLED re-verificados; M8 casi equivalente (S-5) |
| Q5.5 | 2.25/3 | MENOR | F-004 (heredado) |
| Q6.1 | 3/3 | COMPLETO | fix y docs en commits separados y atómicos; informe anterior preservado |
| Q6.2 | 2.25/3 | MENOR | F-005, N-25 (en vivo) |
| Q6.3 | 2.25/3 | MENOR | N-26 |
| Q6.4 | 3/3 | COMPLETO | MINOR justificado; `CLI_VERSION` = tag |
| Q6.5 | 2/2 | COMPLETO | D.3 |
| Q6.6 | 1.5/2 | MENOR | F-006 (heredado; `runtime/bootstrap` sin cambios) |
| Q7.1 | 2.25/3 | MENOR | F-007 (NO VERIFICABLE por API) |
| Q7.2 | 1.5/2 | MENOR | N-32 (en vivo, sin cambios) |
| Q7.3 | 1.5/2 | MENOR | F-008, CodeQL #27 |
| Q7.4 | 2/2 | COMPLETO | el fix restringe; sin permiso nuevo; Codex y OpenCode sin attester |
| Q7.5 | 2.25/3 | MENOR | F-009, F-010 (heredados) |
| Q8.1 | 2/2 | COMPLETO | una fuente para el modelo del Reviewer; la gobernanza no contradice el árbol (S-7) |
| Q8.2 | **2/2** | **COMPLETO** | **N-30 cerrado (§C)**. El rol proyectado (modelo y árbol de trabajo) ya se impone en la atestación; residuales S-4 y S-6 dentro del modelo de amenaza |
| Q8.3 | 1.5/2 | MENOR | F-005 |
| Q8.4 | 2/2 | COMPLETO | N-30 → `ef103e9` → test `N-30 (M-1)` → `V3.4.0-RELEASE.md` → este informe |

**Validación matemática:** Q1 3+3+2.25+3 = 11.25 · Q2 3+2.25+3+3 = 11.25 · Q3 12.00 · Q4 3+2.25+2+2+2 = 11.25 · Q5 3+2.25+3+3+2.25 = 13.50 · Q6 3+2.25+2.25+3+2+1.5 = 14.00 · Q7 2.25+1.5+1.5+2+2.25 = 9.50 · Q8 2+2+1.5+2 = 7.50 → **90.25**. Puntos aplicables: 100 (sin N/A). Gates: ninguno. **Score final 90.25 ≥ 90**: el umbral se alcanza sin tolerancia.

**Divergencia con 81b8d20 (89.75), +0.50:** Q8.2 +0.50 (N-30 cerrado). Los demás 29 subcriterios coinciden. Q5.3 se mantiene pese a la mayor frecuencia de N-29, porque la causa raíz es la misma y no hay fallo de producto (§D.2).

**Comprobación de consistencia (§90):** toda pérdida tiene causa identificada · todo hallazgo puntuable está asociado a un criterio materialmente relacionado · ninguna SUGGESTION resta puntos · el camino a 100 cubre 9.75 = 100 − 90.25 · sin N/A · sin gates.

## G. Hallazgos

| ID | Criterio | Sev. | Tipo | Estado | Descripción · corrección · verificación |
|---|---|---|---|---|---|
| **N-30** | Q8.2 | — | — | **CERRADO** | `ef103e9`: `verifyClaudeReceipt` exige la ausencia de `model` o el modelo proyectado exacto (`core/agents.json`) y la ausencia de `isolation`. Sin modelo proyectado no atesta. Verificado por el test del Builder, la sonda del auditor (27/27) y la mutación (6/6 declaradas KILLED). Residuales no puntuables: S-4, S-5, S-6. |
| **N-31** | Q1.3 (Q8.3) | MINOR | CONTRADICTORIO | ABIERTO, sin cambios | Ver §G.1. |
| **N-32** | Q7.2 | MINOR | RIESGO | ABIERTO, sin cambios | Ver §G.2. |
| N-29 | Q5.3 | MINOR | RIESGO | ABIERTO, más frecuente | `Permission denied` al escribir `.git/objects` en los repos temporales del harness (Windows). En esta auditoría: 6 fallos en la primera pasada de `ci.yml` (2 pasos, que pasan al re-ejecutarlos) y 11 en la suite de release (5 archivos). Todos con la misma primera aserción de `git`, y cada test pasó en otra corrida. Ambiental, no es regresión funcional. Corrección: reintento o aislamiento de las escrituras git del harness. Verificación: 3 corridas completas limpias en Windows. |
| N-24, N-25, N-26, N-27 | Q5.2, Q6.2, Q6.3, Q5.3 | MINOR | — | ABIERTO | Heredados. N-25 y N-26 re-verificados en vivo (D.4). N-27 no falló en esta auditoría. |
| F-002, F-005, F-007, F-008, F-010 | Q2.2, Q6.2/Q8.3, Q7.1, Q7.3, Q7.5 | MINOR | — | ABIERTO | Re-verificados en vivo o en el árbol (F-007 sigue NO VERIFICABLE). |
| F-003, F-004, F-006, F-009, N-11 | Q5.2, Q5.5, Q6.6, Q7.5, Q4.2 | MINOR | — | ABIERTO (INFERIDO) | El delta `81b8d20..9678acb` no toca `README.md`, `runtime/{bootstrap,release,gates,pilot}`, `scripts`, `.github` ni `evaluation/`. |

**Total: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR (1 cerrado: N-30; 0 nuevos puntuables).**

### G.1 N-31: reevaluación (sin corregir)

* **Mecanismo, re-verificado por inspección (E3; el código es idéntico al de 81b8d20, así que la sonda E4 de entonces sigue vigente y no se repitió).** La revisión identifica el cambio (merge-base + contenido) y no la spec. En cambio, `reviewStatus(project, slug)` lee `specs/<slug>/reviews.jsonl`, y `attestedRunsOf` solo mira `reviewStateDir(project, slug)` (`review-ledger.mjs:325-339`). Un adverso atestado bajo `specs/A` no retira una aprobación de la misma revisión obtenida con `sdd review begin/record` bajo otra spec existente `specs/B` cuyas tareas estén todas hechas.
* **Severidad: sigue siendo MINOR.** El comportamiento contradice `review.md:51` («An adverse review … of the current revision withdraws any approval of it») y `:73` («a new run of the same revision cannot wash out an adverse one»). Afecta al score: −0.75 en Q1.3, sin cambios.
* **¿Bypass de merge o HITL? No.** `runtime/policy/hitl.mjs`, `runtime/gates/**` y `.github/workflows/**` no leen ledger, recibos ni el outcome del review (grep: 0 referencias). El merge a `main` exige una PR humana con los 6 checks requeridos (D.4), y el agente nunca mergea (`HITL-MERGE-POLICY.md`). `deriveReviewOutcome` solo reporta el gate de la política con APPROVED, y `checkOutcomeCoherence` obliga a `required` en cualquier otro caso (`independent-review.mjs:157,171-172`).
* **Efecto real acotado.** En el escenario N-31, el circuito *local* de `specs/B` puede reportar el gate que deriva la política en vez de `required`. Para riesgo alto o control plane ese gate ya es `required` (`hitl --base v3.3.1`: «risk high, human_gate required» para esta misma feature), así que no cambia nada. Solo baja a `final-only` en cambios de riesgo bajo o medio, y a `none` únicamente con el opt-in `allowNone` en el lock de la rama base más una declaración explícita. Requiere elusión deliberada con comandos propios, y deja la línea APPROVED de `specs/B/reviews.jsonl` en el diff de la PR.
* **¿Deuda aceptable para v3.4.0? Sí.** No abre camino a un merge automático y el HITL de merge sigue siendo humano. Pero no figura en la deuda conocida de `V3.4.0-RELEASE.md` (0 menciones; S-8). Corrección: en `status` y `record`, considerar las corridas atestadas de la revisión en todos los slugs del state root. Verificación: la sonda A/B debe dar B ≠ APPROVED.

### G.2 N-32: reevaluación de la clasificación

* **Estado en vivo:** 6 alertas abiertas (#145–#150), todas en `template/pnpm-lock.yaml`, scope `development`: vite ×5 (1 high, 4 medium/low; parche 8.1.6) y `@vitest/mocker` ×1 (parche 4.1.12). La PR Dependabot #147 (vite 8.3.5) sigue abierta y está excluida de la candidata.
* **¿Bundle publicado? No.** Verificado en el build de 9678acb: 0 rutas `template/`, y `INCLUDE_PREFIXES` no incluye `template/`.
* **¿Runtime? No.** `package.json` raíz sin dependencias, `pnpm-lock.yaml` raíz con `importers: .: {}`, y `ci.yml` declara y cumple «no package install step».
* **¿Supply chain de la release? No.** `release.yml` no instala paquetes, y el SBOM se genera del contenido del bundle.
* **Clasificación: sigue siendo MINOR en Q7.2.** Para PLATFORM no afecta al artefacto ni al runtime. Pero el repositorio mantiene una vulnerabilidad *high* con parche disponible y PR abierta: es higiene de dependencias del área `template/` (toolchain de desarrollo), y Q7.2 la cubre. No sube a MAJOR (no hay exposición del artefacto) y no baja a SUGGESTION (resta puntos). Corrección: mergear o descartar con justificación en una PR separada. Verificación: `gh api …/dependabot/alerts?state=open` → 0.

### G.3 N-29: ambiental

Ver la fila N-29 y §D.2. No hay evidencia nueva de regresión funcional. La frecuencia aumentó en este host, pero la causa raíz es la misma (escritura de objetos git en directorios temporales de Windows).

### G.4 Hallazgos nuevos

Ninguno puntuable. Sugerencias nuevas, que no puntúan y quedan fuera del camino a 100: S-4 a S-9 (abajo).

**Deuda conocida de `V3.4.0-RELEASE.md`, evaluada:** M-1 ya no figura en la lista (cerrado por `ef103e9`; confirmado en §C). El resto se mantiene como en 81b8d20, sin evidencia nueva de impacto mayor: mutantes LOW y LOWs registrados, `docs-gate`, hook no disparado, comando de validación trivial, `--base` estrecho, evidencia no criptográfica y Unix socket `ENXIO`. Son 7 SUGGESTION.

**Sugerencias (no puntúan):**

* S-1: el README (`CLI: v3.3.0 | PLATFORM: v3.2.0`, `README.md:65`) sigue desfasado.
* S-2: la promoción develop → main debe hacerse con merge commit, o este informe queda STALE.
* S-3: la deuda conocida de la tabla anterior.
* S-4: un allowlist de los campos de entrada de la delegación (§C).
* S-5: añadir un caso de capitalización distinta al test N-30 (mata M8).
* S-6: contrastar el modelo *ejecutado* (`message.model`) además del pedido (INFERIDO, §C).
* S-7: `governance/execution/current/README.md` sigue con «PLATFORM AUDIT: NOT STARTED» y un CONTENT sin `ef103e9`. `SESSION-CONTEXT.md` (2026-10-23) no recoge la auditoría de 81b8d20 ni el fix. `verification.md` no registra el test ni la mutación de N-30. Los textos son literalmente ciertos para el SHA final (que no estaba auditado) y `V3.4.0-RELEASE.md` (su DETAIL) sí traza `ef103e9`, así que no se registra contradicción puntuable. Actualizarlos en el cierre.
* S-8: registrar N-31 como deuda conocida en `V3.4.0-RELEASE.md`.
* S-9: el título del test `M10:an` perdió un espacio en `ef103e9` (`review-ledger.test.mjs:374`).

## H. Camino a 100

Q1.3 +0.75 (N-31). Q2.2 +0.75 (F-002). Q4.2 +0.75 (N-11). Q5.2 +0.75 (N-24, F-003). Q5.3 +1.00 (N-29, N-27 y CI remota del SHA exacto). Q5.5 +0.75 (F-004). Q6.2 +0.75 (F-005, N-25). Q6.3 +0.75 (N-26). Q6.6 +0.50 (F-006). Q7.1 +0.75 (F-007). Q7.2 +0.50 (N-32). Q7.3 +0.50 (F-008, CodeQL #27). Q7.5 +0.75 (F-009, F-010). Q8.3 +0.50 (F-005).

Suma: 0.75×9 (Q1.3, Q2.2, Q4.2, Q5.2, Q5.5, Q6.2, Q6.3, Q7.1, Q7.5) + 1.00 (Q5.3) + 0.50×4 (Q6.6, Q7.2, Q7.3, Q8.3) = 6.75 + 1.00 + 2.00 = **9.75**. 90.25 + 9.75 = 100.00. Camino completo. F-005 afecta a dos criterios distintos (Q6.2 control de integración, Q8.3 fail-safe del HITL): causa raíz compartida, descuento proporcional en cada uno.

## I. Conclusión

```text
AUDITED_SHA: 9678acb546261f5479ac3d1374e9ffb26cec6230
SCORE: 90.25/100 (bruto = final; sin N/A; sin gates)  PREVIOUS: 89.75 (81b8d20)  DELTA: +0.50
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 17 (cerrado: N-30; nuevos puntuables: 0)
SUGGESTION: 15 (S-1, S-2, 7 deudas conocidas, S-4 a S-9)
N-30: CERRADO (test + sonda 27/27 + mutación 6/6 declaradas KILLED; M8 del auditor sobrevive, casi equivalente)
N-31: ABIERTO, MINOR (Q1.3); sin bypass de merge ni de HITL; deuda aceptable, no registrada (S-8)
N-32: ABIERTO, MINOR (Q7.2); fuera del bundle, del runtime y del supply chain de la release
N-29: AMBIENTAL, más frecuente; sin fallo de producto
SEMVER: MINOR (v3.4.0)
BUILD: reproducible (2 builds byte-idénticos, sha256:00bd0a11…; fix presente en el bundle)
RELEASE_GATE (antes de este informe): FAIL (sin informe vigente; 25 STALE), lo esperado
UMBRAL PLATFORM 90: ALCANZADO sin tolerancia (margen 0.25)
VERDICT: APTO
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```

Evidencia: los comandos están registrados arriba. Las salidas completas y los scripts del auditor (`ci-replica.mjs`, `probe-n30.mjs`, `mutate.mjs`) quedaron en el scratchpad de la sesión, fuera del árbol auditado, y no se persistieron en `.audit/evidence/` porque el encargo era producir solo el informe.
