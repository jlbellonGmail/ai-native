---
targetRepo: jlbellonGmail/ai-native
targetCommit: f3af342f440fbaa8dfc007bed38c01cb176f9696
platform:
  version: "v3.3.1 candidate"
  commit: f3af342f440fbaa8dfc007bed38c01cb176f9696
auditMethod: "1.2"
profile: PLATFORM
date: "2026-10-18T21:17:19Z"
scope: "Read-only PLATFORM 1.2 audit of the exact v3.3.1 PATCH candidate (v3.3.0..f3af342) and of the live GitHub control plane. Not independent of the Builder session; release-gate, tag and publication excluded."
score: 91.50
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 (candidata v3.3.1)

## A. Identificación y veredicto

```text
Repositorio: jlbellonGmail/ai-native
Rama auditada: release/v3.3.1 (local, sin push)
Commit exacto: f3af342f440fbaa8dfc007bed38c01cb176f9696
Base: develop 3c9fe11 (merge de #138); release anterior v3.3.0 = ae6d50b
Tag/release v3.3.1 al auditar: no existen (GET 404)
Perfil: PLATFORM 1.2 (único perfil aplicado)
QUALITY_SCORE: 1.1 | AUDIT_RULES: 1.1 | Método: auditMethod 1.2
Auditor: la misma sesión que preparó la candidata; NO independiente del Builder
Confianza: MEDIA
Resultado: APTO — supera el umbral de 90, sujeto a CI remota del SHA y a la decisión humana
Score: 91.50/100
BLOCKER: 0 | CRITICAL: 0 | MAJOR: 0 | MINOR: 14
N/A: 0
```

**Límite de independencia, declarado y no puntuado como cumplido.** El método exige independencia de juicio (AUDIT_RULES §3); el gobierno del repositorio ha exigido históricamente, además, un auditor distinto de quien construyó la candidata antes de un tag (`V3.3.0-RELEASE.md`). Esta auditoría la ejecutó la sesión que preparó los commits `8b5dafd` y `f3af342` (y que implementó #137 y #138). No se usó un subagente porque el encargo no lo pidió. El `release-gate` no comprueba la identidad del auditor: aceptará este informe por forma, commit y score. Que baste para el tag es decisión humana.

## B. Alcance, método y límites

Diferencia auditada `v3.3.0..f3af342` (19 archivos): Capability Routing (`.agents/skills/sdd/SKILL.md`, `core/roles/{planner,builder,reviewer}.md`, test E2E en `runtime/consumer/knowledge.test.mjs`); triggers `pull_request` de 8 workflows; `CLI_VERSION = "v3.3.1"` y cinco aserciones del lifecycle; gobernanza (`V3.3.1-PATCH.md`, `SESSION-CONTEXT.md`, `execution/current/README.md`) y la gobernanza post-release de v3.3.0 ya presente en `main` (`715c5dc`). El resto de la plataforma se evalúa por continuidad: desde `d98a89e` (último SHA auditado) no cambió ningún archivo fuera de esos 19 y de `.audit/**`, comprobado con `git diff --name-only d98a89e f3af342`.

No verificable antes del push (prohibido sin HITL): CI remota del SHA exacto, PR, checks requeridos sobre él. Se usan como evidencia parcial las ejecuciones del árbol padre (`b953fd0`, head de #138, todas success) y se marca NO VERIFICADO lo demás. No se evaluó con agentes reales el comportamiento de Capability Routing (casos A–E): es guía de prompt, no código determinista. El fallo Docker exit 125 del `pilot` offline en `ubuntu-latest` no se investigó (fuera de alcance por instrucción); se registra como hallazgo.

## C. Estado remoto del control plane (GET live, 2026-10-18)

| Control | Evidencia | Resultado |
|---|---|---|
| `ai-native-main` (24405506) | `enforcement=active`, `~DEFAULT_BRANCH`, `strict=true`, `bypass_actors=0` | PASS |
| Contextos requeridos | `validators (ubuntu-latest\|windows-latest)`, `pin-check`, `pr-gate` @15368; `ai-native/trust-gate`, `ai-native/merge-gate` @5170488 | PASS, nombres sin cambios |
| `ai-native-trust` | `can_admins_bypass=false`; deployment branch policy `branch:main` | PASS |
| `ai-native-human-review` | `can_admins_bypass=false`; 1 reviewer requerido; `branch:main` | PASS |
| Rulesets | solo `ai-native-main` (branch); 0 rulesets de tag; `develop` sin ruleset | ver F-008, N-25 |
| `v3.3.1` | ref y release inexistentes; latest = `v3.3.0` | PASS pre-release |
| Alertas | code scanning: solo #27 (`actions/untrusted-checkout`, `l3-consumer.yml:116`, preexistente, archivo no tocado); dependabot 0; secret scanning 0 | contextual |
| CI árbol padre `b953fd0` | CI 39163764659, pr-gate, CodeQL, Trivy, SBOM, Supply chain, Dependency review, security-scan: success | evidencia parcial |

## D. Validaciones ejecutadas (checkout limpio de `f3af342`)

| Comando | Resultado |
|---|---|
| `node parity/validate-parity.mjs` | PASS; 95/95 PAR-tests |
| `node contracts/validate-contracts.mjs` | PASS; 7 datos |
| `node core/validate-core.mjs` | PASS; 8 perfiles |
| `node runtime/status/validate-integrity.mjs` | PASS |
| `node runtime/docs/validate-doc-drift.mjs` | PASS |
| `node scripts/validate-actions-pinned.mjs` | PASS |
| `node scripts/validate-ci-tests-listed.mjs` | PASS; 97/97 |
| `node runtime/adapters/validate-entrypoints.mjs` | PASS |
| `node runtime/audit/cli.mjs check` | PASS |
| `node evaluation/m52/validate-evidence.mjs` | PASS |
| `node scripts/validate-audit-safe-script-mode.mjs` | PASS |
| `pwsh -NoProfile -File ./runtime/lib/result.conformance.test.ps1` | PASS; 19 checks |
| `node runtime/gates/pr-gate.mjs --base origin/main` y `--base origin/develop` | PASS |
| `node runtime/policy/hitl.mjs --base origin/main` | PASS; `risk high, human_gate required` (control plane `.github/**`: regla vigente, no HITL nuevo) |
| `git diff --check v3.3.0 f3af342` | PASS |
| Suite de release de `release.yml` (`node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs`) | ejecución 1: 1002/1003; el único fallo es N-27 (umbral de reloj), que pasa 3/3 aislado. Ejecución 2: ver §D.1 |
| `node runtime/release/build.mjs --version v3.3.1 --commit f3af342… ` ×2 | dos bundles byte-idénticos; 226 archivos; 1,211,590 bytes; tarball sha256 `761f3f39be95f41ef3535efc8ed67cb4ebe9cbb7d94eb1298bfec8a2fdfe60f5` |
| `build.mjs --version v3.3.0 --commit ae6d50b…` | digest `sha256:0c21bbae…f1d` = digest publicado de v3.3.0 |
| `build.mjs --version v3.3.1 --commit 3c9fe11` (antes de `8b5dafd`) | FAIL `declares CLI_VERSION v3.3.0; this release is v3.3.1`: el bump es necesario |

### D.1 Segunda ejecución de la suite

Misma orden, mismo SHA, working tree limpio (`git status --short` vacío al empezar): **1003/1003 PASS, exit 0**. Gate G3 (suite principal rota) no aplicado: la única falla de la ejecución 1 es una aserción de reloj sobre código no modificado, no se reproduce aislada (3/3) ni en la suite completa repetida, y se puntúa como N-27 en Q5.3.

### D.2 Delta de consumidor (medido)

* Bundle `v3.3.0` → candidata: mismos 226 archivos; cambian 5 (`.agents/skills/sdd/SKILL.md`, `core/roles/{builder,planner,reviewer}.md`, `runtime/cli/ai-native.mjs`) más `platform.json` (solo `version`, `commit`, `digest`, `generatedAt`, nombres de assets). `bootstrap` sin cambios: protocolo 1, `minCliVersion v3.2.0`, `[adopt]`. `revocations-1.json` y `cli-revocations-1.json` idénticos.
* Asset `ai-native-cli.mjs`: una sola línea distinta (el literal `CLI_VERSION`).
* `.github/**` no está en `INCLUDE_PREFIXES` (`isShipped` = false para los workflows).
* Simulación: consumidor creado con `applyConsumer` desde el bundle extraído de v3.3.0 (claude, codex, opencode) y `planUpgrade` hacia la candidata: `update` = 8 (`.claude/agents/{3}`, `.claude/skills/sdd/SKILL.md`, `.opencode/roles/{3}`, `.opencode/skills/sdd/SKILL.md`); `add`, `remove`, `keepLocal`, `collisions` = 0; 39 sin cambios. Replanificar contra v3.3.0: 0 cambios.

### D.3 Capability Routing

Una sola definición (`git grep "## Capability routing"` = 1, en el skill); los tres roles solo la referencian; ningún módulo runtime no-test la usa; sin nombres de proveedor (verificado por grep y por el test E2E). Sin cambios en `AGENTS.md`, `contracts/**` (incluida `state-machine.json`), `core/commands/**`, `runtime/{circuit,gates,policy}/**` ni `governance/gates/**`: no hay comando, estado, gate ni HITL nuevos. El texto exige silencio cuando alcanzan las capacidades, re-evaluación solo ante necesidad nueva y "nunca por tarea", y carga solo cuando aporta valor. Coste: skill de 2779 a 4219 bytes, roles +260 bytes cada uno. Que un modelo lo cumpla en ejecución: NO VERIFICADO (N-24).

## E. Score por áreas y subcriterios

| Área | Resultado |
|---|---:|
| Q1 Contrato | 12.00 / 12 |
| Q2 Reutilización y limpieza | 11.25 / 12 |
| Q3 Arquitectura | 12.00 / 12 |
| Q4 Documentación y DX | 11.25 / 12 |
| Q5 Calidad y regresión | 13.50 / 16 |
| Q6 Git, CI/CD y releases | 14.00 / 16 |
| Q7 Seguridad y supply chain | 10.00 / 12 |
| Q8 Gobernanza | 7.50 / 8 |
| **TOTAL** | **91.50 / 100** |

Sin N/A. Ningún Quality Gate global aplicado (ver §D.1 para G3).

| Criterio | Puntos | Nivel | Evidencia / hallazgo |
|---|---:|---|---|
| Q1.1 Propósito y alcance | 3/3 | COMPLETO | `V3.3.1-PATCH.md` delimita el contenido; README |
| Q1.2 Capacidades prometidas | 3/3 | COMPLETO | lo prometido (guía en el router, proyectada a consumidores, sin proveedores) tiene E4; el comportamiento del modelo no se declara capacidad ejecutable (N-24 en Q5.2) |
| Q1.3 Contratos, docs e implementación | 3/3 | COMPLETO | `bootstrap` sin cambios; doc-drift PASS; delta documentado = delta medido |
| Q1.4 Requisitos obligatorios | 3/3 | COMPLETO | el build de v3.3.1 pasa solo con el bump (reproducido sin él) |
| Q2.1 Inicialización reproducible | 3/3 | COMPLETO | lifecycle 64/64; simulación apply/upgrade |
| Q2.2 Residuos | 2.25/3 | MENOR | F-002 |
| Q2.3 Configuración | 3/3 | COMPLETO | lock y perfiles sin cambios |
| Q2.4 Portabilidad | 3/3 | COMPLETO | CI Ubuntu/Windows del árbol padre; host Windows local |
| Q3.1 Estructura | 3/3 | COMPLETO | cambio dentro de las áreas existentes |
| Q3.2 Responsabilidades | 3/3 | COMPLETO | política en el router SDD; roles solo referencian |
| Q3.3 Simplicidad/duplicación | 3/3 | COMPLETO | una fuente canónica; 0 código runtime nuevo |
| Q3.4 Mantenibilidad | 3/3 | COMPLETO | las aserciones del lifecycle derivan de `CLI_VERSION`: el siguiente bump no rompe tests |
| Q4.1 README | 3/3 | COMPLETO | — (S-1 es sugerencia) |
| Q4.2 Instalación y bootstrap | 2.25/3 | MENOR | N-11 (guard parcial, 12/18 mutaciones) |
| Q4.3 Operaciones | 2/2 | COMPLETO | — |
| Q4.4 Convenciones | 2/2 | COMPLETO | — |
| Q4.5 Ejemplos/troubleshooting | 2/2 | COMPLETO | — |
| Q5.1 Controles automáticos | 3/3 | COMPLETO | ahora también en PR hacia `develop` (8 workflows, verificado en #138) |
| Q5.2 Estrategia de pruebas | 2.25/3 | MENOR | F-003; N-24 |
| Q5.3 Tests ejecutables/pasando | 3/4 | MENOR | sin CI remota del SHA exacto (NO VERIFICADO, requiere push); N-27 |
| Q5.4 Regresiones críticas | 3/3 | COMPLETO | test E2E nuevo con RED/GREEN registrado en #137; lifecycle |
| Q5.5 Activación de gates | 2.25/3 | MENOR | F-004 |
| Q6.1 Estrategia Git | 3/3 | COMPLETO | `develop` → `main`; commits atómicos; producto y gobernanza separados |
| Q6.2 Protección de integración | 2.25/3 | MENOR | F-005; N-25 |
| Q6.3 CI fiable | 2.25/3 | MENOR | N-26 |
| Q6.4 Versionado y release | 3/3 | COMPLETO | PATCH justificado contra `VERSIONING-POLICY.md`; `CLI_VERSION` = tag |
| Q6.5 Artefacto reproducible | 2/2 | COMPLETO | dos builds byte-idénticos; v3.3.0 reconstruido = digest publicado |
| Q6.6 Compatibilidad/rollback | 1.5/2 | MENOR | F-006 |
| Q7.1 Secretos | 2.25/3 | MENOR | F-007 |
| Q7.2 Dependencias | 2/2 | COMPLETO | pin-check PASS; 0 alertas dependabot |
| Q7.3 Seguridad CI/CD | 1.5/2 | MENOR | F-008 (0 rulesets de tag, verificado live) |
| Q7.4 Defaults seguros | 2/2 | COMPLETO | la política prohíbe activar capacidades con credenciales/permisos; permisos de workflows sin cambios |
| Q7.5 Supply chain | 2.25/3 | MENOR | F-009, F-010 |
| Q8.1 Fuente de verdad | 2/2 | COMPLETO | SESSION-CONTEXT, execution/current y V3.3.1-PATCH coherentes con el árbol |
| Q8.2 Roles/límites | 2/2 | COMPLETO | sin push/merge/tag por el agente |
| Q8.3 Gobernanza fail-safe | 1.5/2 | MENOR | F-005 |
| Q8.4 Trazabilidad | 2/2 | COMPLETO | SHA exacto, comandos y digest registrados |

**Validación matemática.** Q1 3+3+3+3 = 12.00; Q2 3+2.25+3+3 = 11.25; Q3 3+3+3+3 = 12.00; Q4 3+2.25+2+2+2 = 11.25; Q5 3+2.25+3+3+2.25 = 13.50; Q6 3+2.25+2.25+3+2+1.5 = 14.00; Q7 2.25+2+1.5+2+2.25 = 10.00; Q8 2+2+1.5+2 = 7.50. Total 91.50.

**Divergencia con `d98a89e` (93.00), §69–70.** El árbol solo cambió en lo auditado arriba; la diferencia de −1.50 es de puntuación, no de producto. Q4.2 −0.50: el mismo N-11 se puntúa con el nivel base MENOR (75 %), no con 2.75. Q5.3 −1.00: sin CI remota del SHA exacto. Q6.3 −0.75: N-26, una recurrencia nueva. Q7.5 +0.75: F-009/F-010 son defectos menores de una implementación completa (MENOR), no PARCIAL. Q5.3 se recupera con la CI de la PR.

## F. Hallazgos actuales

| ID | Área | Severidad | Estado | Descripción |
|---|---|---|---|---|
| F-002 | Q2.2 | MINOR | OPEN | Rutas de workstation en registros históricos de gobernanza; no afectan runtime ni bundle. |
| F-003 | Q5.2 | MINOR | OPEN | La evidencia C6 fija un blob anterior de `l3-consumer.yml`. |
| F-004 | Q5.5 | MINOR | OPEN | Los filtros de workflows no garantizan el test de instalación del README con cambios solo de README/test. |
| F-005 | Q6.2, Q8.3 | MINOR | OPEN | D6 sin enforcement server-side de segunda identidad humana con un solo maintainer. |
| F-006 | Q6.6 | MINOR | OPEN | Rollback no conserva `productDir` y `governance` del lock. |
| F-007 | Q7.1 | MINOR | OPEN | Revocación histórica de claves de la App no verificable por API. |
| F-008 | Q7.3 | MINOR | OPEN | Sin ruleset de tags (0, verificado live); política de CI derivada del checkout de PR. |
| F-009 | Q7.5 | MINOR | OPEN | El motor directo acepta un registro de attestation aportado por el caller. |
| F-010 | Q7.5 | MINOR | OPEN | El SBOM usa metadata genérica `sbom-src`. |
| N-11 | Q4.2 | MINOR | OPEN | Guard de instalación del README parcial (12/18 mutaciones). |
| **N-24** | Q5.2 | MINOR | NUEVO | Capability Routing no tiene evaluación de comportamiento (casos A–E con un agente real): solo se prueba que llega a la skill y a los roles proyectados y que no nombra proveedores. Silencio, ausencia de bucles y de re-evaluación por tarea dependen del cumplimiento del prompt. Coherente con el diseño (sin framework nuevo) y declarado en `V3.3.1-PATCH.md`. |
| **N-25** | Q6.2 | MINOR | NUEVO | `develop` (rama de integración) no tiene ruleset: desde #138 sus PR ejecutan 8 workflows pero un merge con checks rojos no se impide. El objetivo de control se cumple en `main` (PR `develop` → `main` con los seis contextos requeridos, trust-gate y merge-gate), por eso el impacto es bajo. |
| **N-26** | Q6.3 | MINOR | NUEVO | `pilot offline` en `ubuntu-latest` falla de forma recurrente con Docker exit 125 (intento 1 de #171 y dos ejecuciones seguidas en la PR de #138). Mitigado sacándolo de las PR hacia `develop`; sigue en PR y push a `main`; causa no investigada. |
| **N-27** | Q5.3 | MINOR | NUEVO | `runtime/policy/architecture.test.mjs` («scanning is near-linear») afirma umbrales de reloj (`< 1500 ms`, `< 3000 ms`) que fallan bajo la carga de la suite completa en paralelo en el host Windows (4854 ms) y pasan aislados (3/3). Preexistente (archivo y módulo sin cambios desde v3.3.0); probablemente uno de los «2 fallos del host» que `d98a89e` no identificó. |

Sugerencias (no puntúan): **S-1** el ejemplo `ai-native --version` del README muestra `CLI: v3.3.0 | PLATFORM: v3.2.0` y el nombre del paso de `ci.yml` dice «v3.3.0»; son ilustrativos y no fallan ningún validador. **S-2** el repositorio permite squash y rebase: una promoción con cualquiera de ellos deja este informe STALE (el `targetCommit` deja de ser ancestro) y el `release-gate` falla cerrado; usar merge commit evita repetir la auditoría.

## G. Disposición de hallazgos de `AUDIT-PLATFORM-d98a89e`

| ID | Disposición | Evidencia |
|---|---|---|
| F-002 … F-010, N-11 | OPEN, sin cambios | Ningún archivo de sus áreas cambió desde `d98a89e`; F-008 re-verificado live. Contados una vez en §F. |
| Alerta CodeQL #27 | Contextual, no puntuable | Sigue abierta en `l3-consumer.yml:116`, archivo no tocado. |
| «2 fallos del host Windows» | Parcialmente identificado | Uno se reproduce y queda descrito como N-27. |

## H. Superficie solicitada

| Superficie | Estado | Evidencia |
|---|---|---|
| Working tree, rama, ancestry | PASS | limpio; `v3.3.0` y `origin/main` son ancestros; `release/v3.3.1` = `develop` + 2 commits |
| Cambios inesperados | Ninguno | 19 archivos, todos explicados (§B) |
| Capability Routing único, provider-agnostic, liviano | PASS / comportamiento NO VERIFICADO | §D.3; N-24 |
| AGENTS.md, contracts, state machine, gates | Sin cambios | `git diff v3.3.0` vacío en esas rutas |
| Workflows `develop`/`main` | PASS | 8 con `[main, develop]`; `pilot`, `merge-gate`, `trust-gate`, `post-merge`, `release`: solo `main`; ruleset de `main` intacto |
| Consumidores fijados a v3.3.0 | Sin cambio | resolución por versión+digest del lock; replanificación 0 cambios |
| Upgrade explícito | 8 proyecciones + CLI vía `self-update` | §D.2 |
| `.github/**` en el bundle | No | `isShipped` false |
| SemVer | PATCH | §I |
| Reproducibilidad | PASS | §D |

## I. Conclusión

```text
AUDITED_SHA: f3af342f440fbaa8dfc007bed38c01cb176f9696
SCORE: 91.50/100
BLOCKER: 0
CRITICAL: 0
MAJOR: 0
MINOR: 14 (10 heredados abiertos, 4 nuevos: N-24, N-25, N-26, N-27), no bloqueantes
SEMVER: PATCH (v3.3.1): sin cambio de lock, kernel AGENTS.md, contrato de bootstrap, schemas ni skills retiradas/añadidas
VERDICT: APTO — supera el umbral PLATFORM (90)
RELEASE_GATE: NOT_RUN por este informe
CONFIANZA: MEDIA (sin CI remota del SHA exacto; auditor no independiente del Builder; comportamiento de Capability Routing no evaluado con agentes)
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED
```

Certifica solo `f3af342…` y sus descendientes cuya diferencia neta sea `.audit/**` o `STATUS.md`. No se corrigió ningún hallazgo.
