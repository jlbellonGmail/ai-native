---
targetRepo: jlbellonGmail/ai-native
targetCommit: 521d203a8ed10c17101391f702d452f7045657ef
platform:
  version: v3.0.0-dev
  commit: 521d203a8ed10c17101391f702d452f7045657ef
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-06T03:50:00Z
scope: full repository at the exact commit
score: 92.25
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 521d203

## A. Identificacion

- Repositorio: jlbellonGmail/ai-native; ruta C:\Proyectos\ai-native; branch main; tag auditado: ninguno (VERSION=3.0.0-dev; ultimo release publicado v3.0.0-rc.2 sobre 51ef185, que NO contiene el codigo cambiado desde 3477428).
- Commit: `git rev-parse HEAD` = 521d203a8ed10c17101391f702d452f7045657ef (coincide). `git status --short` = 0 lineas antes y despues de todas las ejecuciones. Sin worktree, sin ramas, sin commits, sin escrituras en el repo (el informe se escribe fuera del repo).
- Perfil: PLATFORM 1.2 (unico). QUALITY_SCORE 1.1, AUDIT_RULES 1.1, AUDIT_PROMPT 1.1; metodo 1.2. Node v26.7.0, Windows 11 Pro. Umbrales y pesos sin cambios; sin waivers.
- Fecha: 2026-10-06. Solo lectura (GET a la API de GitHub; los assets de `verify-release` se descargan a un directorio temporal que el propio script gestiona).
- Evidencia previa: `.audit/reports/AUDIT-PLATFORM-3477428.md` (y 15715ea, 5a60072) se usaron SOLO para formato y para comprobar el cierre de sus hallazgos; no se reutiliza ninguna puntuacion ni evidencia: todos los comandos y consultas se repitieron sobre este commit.
- Nivel de confianza: MEDIA (revocacion de claves antiguas de `ai-native-trust` no verificable; guard F-09 de `release.yml` no ejercido en un tag real; causa raiz residual de la fragilidad de git bajo concurrencia en Windows no demostrada; la cadena TypeScript de foundation/template no ejecutada).

## B. Veredicto ejecutivo

```
Score bruto: 92.25/100
Score final: 92.25/100
Quality Gate aplicado: ninguno (G1 PASS, G2 PASS, G3 PASS: ver M)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94 "Muy buen nivel"; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 9 MINOR)
Consistencia metodologica: PASS
>= 88 (minimo efectivo del gate de release, tolerancia 2): SI
>= 90 (umbral nominal): SI
```

Resumen: no hay BLOCKER, CRITICAL ni MAJOR. En el SHA exacto: 14 check-runs y 7 workflows en success (CI, CodeQL, Trivy, SBOM, Supply chain, pilot, Dependabot dinamico; matriz ubuntu+windows, mas los jobs nuevos `pilot offline` en ambos SO). Parity 95/95 con unmapped=0, doc-drift, pin-check, ci-tests-listed (75/75), `runtime/audit/cli.mjs check`, contratos, core, integridad, entrypoints y L1 pasan. Validadores de area 44/44. Suite completa por el runner hermetico oficial (`scripts/test-hermetic.mjs`, concurrencia 2): 680/680. `verify-release.mjs v3.0.0-rc.2`: 21 checks PASS (consumidor real, attestation, revocaciones CHECKED). Code scanning: 0 alertas abiertas; Dependabot: 0 abiertas; secret scanning y push protection `enabled`; ruleset activo unico sin bypass. Siguen abiertos los limites conocidos: F2 (approvals=0, strict=false), claves antiguas NO VERIFICADO, y los residuos/duplicados de hallazgos previos. El codigo nuevo (adaptador OpenCode de consumidor, guard de release, runner hermetico, evidencia m52) es correcto y esta cubierto por tests; su unica limitacion es que el guard de `release.yml` no se ha ejercido en un tag real.

## C. Alcance y limitaciones

Inspeccionado: arbol (1512 ficheros rastreados; 165 en legacy/; 29 en `_deprecated`), los 14 workflows (release.yml, pilot.yml y ci.yml completos), `git diff 3477428..HEAD` (38 ficheros), `runtime/adapters/{consumer,opencode,sync}.mjs` y tests, `runtime/release/assert-unreleased.mjs`, `scripts/test-hermetic.mjs`, `evaluation/m52/**` (matriz, evidencia, validador), gobernanza (SESSION-CONTEXT, QUALITY-MATRIX, M5-2-MATRIX, RC2-READINESS, roadmap), ruleset, Environments, alertas, releases.

Ejecutado: ver G. NO VERIFICADO: revocacion de claves antiguas de la App `ai-native-trust` (sin API); ejecucion real de `release.yml` publish con el guard nuevo (no se crea tag); OpenCode MCP y config de Codex (`NOT_AVAILABLE_FROM_TOOL`, declarado por el repo, no puntuado como cumplido); CLIs reales de Claude/Codex/OpenCode (requieren credenciales; se revisa su evidencia versionada, no se re-ejecuta); cadena `tsc/eslint/vitest` de foundation/ y template/ (requiere instalar dependencias en el repo: prohibido); suite local con la concurrencia por defecto de `node --test` (no se repitio: el repo declara el defecto y la presion de memoria de la maquina lo desaconseja).

## D. Contrato detectado

| ID | Capacidad | Clasificacion | Evidencia | Estado |
|---|---|---|---|---|
| C1 | platform.json coherente con lock schema | OBLIGATORIO | verify-release rc.2: digest == sha256 tarball, version/commit == tag | VERIFICADO |
| C2 | Paridad v2->v3 | OBLIGATORIO | parity: capabilities 74, tests-map 35/264, files-map 576, par-tests 95/95, unmapped=0 | VERIFICADO |
| C3 | Bundle determinista, SBOM, attestation, revocaciones | OBLIGATORIO | verify-release rc.2: 21 checks incl. attestation offline y repo ajeno rechazado, SBOM, revocaciones | VERIFICADO (rc.2) |
| C4 | Default deny MCP/politicas | OBLIGATORIO | core/security-policy.json + tests de runtime/mcp y policy | VERIFICADO |
| C5 | HITL unico de merge, gates server-side | OBLIGATORIO | ruleset: 6 checks requeridos, approvals=0 (F2) | PARCIAL (limite documentado, F-02) |
| C6 | Evidencia hash-chained | OBLIGATORIO | tests circuit/mcp-gateway en la suite 680/680 | VERIFICADO |
| C7 | Adaptadores de consumidor para 3 herramientas sin copia de capacidades | OBLIGATORIO | fixture.test.mjs (refs de opencode.json resuelven en el consumidor) | VERIFICADO |
| C8 | Offline real sin red (Ubuntu/Docker, Windows net-guard) | OBLIGATORIO (M5.2) | `pilot offline` ubuntu y windows en success; evidencia offline-*.json | VERIFICADO (Windows con aislamiento en proceso, declarado mas debil) |
| C9 | L2 real con agente | OBLIGATORIO (M5.2) | `l2-claude-code.json`: 30 llamadas, score 1.0; validador de evidencia PASS | VERIFICADO por validador; ejecucion del agente no repetida |
| C10 | OpenCode MCP via gateway; consumo de `.codex/config.toml` | OPCIONAL (declarado `NOT_AVAILABLE_FROM_TOOL`) | m52-matrix.json | NO VERIFICADO (no se puntua como cumplido ni se penaliza) |
| C11 | Release publicable una sola vez por tag | OBLIGATORIO (tras incidente rc.2) | assert-unreleased.mjs + 7 tests; probado contra la API real | IMPLEMENTADO/EJECUTADO fuera del workflow; no ejercido en un tag real |

## E. Matriz de puntuacion

| Area | Maximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR |
| Q2 Reutilizacion | 12 | 11.25 | MENOR |
| Q3 Arquitectura | 12 | 10.50 | MENOR |
| Q4 Documentacion/DX | 12 | 11.50 | MENOR |
| Q5 Calidad/Tests | 16 | 15.00 | MENOR |
| Q6 Git/CI/CD/Release | 16 | 14.50 | MENOR |
| Q7 Seguridad | 12 | 10.75 | MENOR |
| Q8 Gobernanza | 8 | 7.50 | MENOR |
| **TOTAL** | **100** | **92.25** | |

Aritmetica: 11.25 + 11.25 + 10.50 + 11.50 + 15.00 + 14.50 + 10.75 + 7.50 = 92.25. Sin N/A (aplicables = 100). Bruto = final.

## F. Detalle por subcriterio (COMPLETO 100%, MENOR 75%)

| ID | Max | Nivel | Obt. | Evidencia / hallazgo |
|---|--:|---|--:|---|
| Q1.1 | 3 | COMPLETO | 3 | README, AGENTS.md, SESSION-CONTEXT: proposito y alcance claros |
| Q1.2 | 3 | COMPLETO | 3 | G-05..G-11, G-17: capacidades presentes y ejecutadas; las `NOT_AVAILABLE_FROM_TOOL` estan declaradas como no cumplidas, no prometidas |
| Q1.3 | 3 | MENOR | 2.25 | F-01: SESSION-CONTEXT/M5-2-MATRIX/historial de auditorias contradicen la realidad |
| Q1.4 | 3 | COMPLETO | 3 | sin requisitos obligatorios rotos (F2 es un limite declarado, puntuado en Q6.2/Q8.3) |
| Q2.1 | 3 | COMPLETO | 3 | pilot online y offline en ubuntu y windows en success; verify-release con consumidor real PASS |
| Q2.2 | 3 | MENOR | 2.25 | F-06: legacy/ (165), `_deprecated` (29), rutas locales `C:\Users\jlbel` en 18 ficheros (governance/execution/archive, ADR-003) |
| Q2.3 | 3 | COMPLETO | 3 | lock + CONTRIBUTING + MIGRATION-V2-TO-V3 |
| Q2.4 | 3 | COMPLETO | 3 | CI Linux y Windows; scripts m52 y runner hermetico sin rutas absolutas |
| Q3.1 | 3 | MENOR | 2.25 | F-06 (causa compartida con Q2.2) |
| Q3.2 | 3 | COMPLETO | 3 | adapters/sync/consumer separados; `opencodeRolesDir` entra como opcion explicita sin acoplar el modo fabrica |
| Q3.3 | 3 | MENOR | 2.25 | F-07: 4 validadores x 3 areas duplicados (12 ficheros) |
| Q3.4 | 3 | COMPLETO | 3 | SESSION-CONTEXT conciso; 75 ficheros de test, todos listados en CI (validate-ci-tests-listed) |
| Q4.1 | 3 | COMPLETO | 3 | README funcional (97 lineas) con verificacion de release |
| Q4.2 | 3 | COMPLETO | 3 | comandos oficiales ejecutados con exito |
| Q4.3 | 2 | COMPLETO | 2 | validar/probar/liberar/verificar release/migrar documentados |
| Q4.4 | 2 | COMPLETO | 2 | CONTRIBUTING, SECURITY, CODEOWNERS |
| Q4.5 | 2 | MENOR | 1.5 | F-08: troubleshooting general sigue en una linea (README.md:79) |
| Q5.1 | 3 | COMPLETO | 3 | validadores, pin-check, doc-drift, integrity, ci-tests-listed, validate-evidence en CI |
| Q5.2 | 3 | COMPLETO | 3 | contrato/paridad/regresion/pilot/migracion/m52 |
| Q5.3 | 4 | MENOR | 3 | F-05: 680/680 por el runner oficial con concurrencia 2 y CI verde; residual de fragilidad local sin causa raiz demostrada; cadena TS fuera de CI y no ejecutada |
| Q5.4 | 3 | COMPLETO | 3 | 95 PAR-tests; regresiones nuevas: refs de opencode.json, guard de release (7 tests), ceiling git del runner hermetico |
| Q5.5 | 3 | COMPLETO | 3 | 6 checks requeridos con integration_id; el job `validators` ejecuta los tests y validadores nuevos |
| Q6.1 | 3 | COMPLETO | 3 | PRs #59/#60/#61 mergeadas, commits convencionales, historial lineal de hitos |
| Q6.2 | 3 | MENOR | 2.25 | F-02: approvals=0, strict=false |
| Q6.3 | 3 | COMPLETO | 3 | 14 check-runs y 7 workflows success en el SHA; sin `continue-on-error` que silencie nada relevante (solo el audit gate en PR/alpha, justificado) |
| Q6.4 | 3 | MENOR | 2.25 | F-09: guard anti-doble-publicacion no ejercido en un tag real; rc.1/rc.2 inmutables y verificados |
| Q6.5 | 2 | COMPLETO | 2 | build dos veces y `cmp`, SHA256SUMS, digest, tests de bundle |
| Q6.6 | 2 | COMPLETO | 2 | revert CRLF-safe, guarda de ruleset, bump, rollback ejecutado rc.1->rc.2->rc.1 (evidencia documentada) |
| Q7.1 | 3 | MENOR | 2.25 | secret scanning + push protection enabled, 0 alertas, 0 secretos de repo; F-03: revocacion de la clave antigua NO VERIFICADO |
| Q7.2 | 2 | COMPLETO | 2 | Dependabot 0 abiertas (alertas previas `fixed`), code scanning 0 abiertas, Trivy en success tras bf82172; unica PR abierta #48 (deliberada) |
| Q7.3 | 2 | MENOR | 1.5 | F-04: sin ruleset de tags; job `publish` con escritura y sin Environment |
| Q7.4 | 2 | COMPLETO | 2 | default deny; guard de release falla cerrado ante gh no disponible o tag/repo inesperado |
| Q7.5 | 3 | COMPLETO | 3 | SBOM CycloneDX, attestation, verificacion offline y rechazo de repo ajeno, revocaciones identicas |
| Q8.1 | 2 | COMPLETO | 2 | AGENTS.md/governance como fuente; matriz m52 como fuente unica con validador |
| Q8.2 | 2 | COMPLETO | 2 | roles y limites; CODEOWNERS; Environment `ai-native-human-review` con reviewer requerido |
| Q8.3 | 2 | MENOR | 1.5 | F-02: merge humano = norma + deteccion, no imposicion servidor |
| Q8.4 | 2 | COMPLETO | 2 | eventos hash-chained; informes ligados a SHA exacto; matriz m52 con run IDs |

## G. Ledger de verificacion

| ID | Verificacion | Comando/Metodo | Resultado | Estado |
|---|---|---|---|---|
| G-01 | Identidad y worktree | `git rev-parse HEAD`; `git status --short` | SHA exacto; 0 lineas antes y despues | PASS |
| G-02 | Paridad | `node parity/validate-parity.mjs` | PASS: capabilities 74, tests-map 35/264, files-map 576, par-tests 95/95, unmapped=0 | PASS |
| G-03 | Doc drift / pin / audit framework | `node runtime/docs/validate-doc-drift.mjs`; `node scripts/validate-actions-pinned.mjs`; `node runtime/audit/cli.mjs check` | PASS, PASS, PASS (rc=0) | PASS |
| G-04 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | PASS: 75/75 ficheros de test ejecutados por un workflow | PASS |
| G-05 | Suite completa (UNA vez, secuencial) | `node scripts/test-hermetic.mjs --log ...` (runner hermetico oficial del repo, concurrencia 2) | 680 tests, 680 pass, 0 fail, 0 cancelled, 0 skipped, EXIT=0, 258 s | PASS |
| G-06 | Tests focalizados de las areas cambiadas | `node --test --test-concurrency=2 runtime/release runtime/adapters runtime/pilot scripts/test-hermetic.test.mjs evaluation/m52` | 149 tests, 149 pass, 0 fail | PASS |
| G-07 | Validadores de evidencia M5.2 | `node evaluation/m52/validate-evidence.mjs` | PASS: matrix and evidence are consistent | PASS |
| G-08 | Validadores de area | `scripts/validate-*.mjs` desde foundation/, knowledge/, template/ | 7/7, 18/18, 19/19 | PASS |
| G-09 | Contratos, core, integridad, entrypoints, L1 | `contracts/validate-contracts.mjs`; `core/validate-core.mjs`; `runtime/status/validate-integrity.mjs`; `runtime/adapters/validate-entrypoints.mjs`; `runtime/evals/cli.mjs l1` | todos rc=0 / PASS | PASS |
| G-10 | Release publicado | `node scripts/verify-release.mjs v3.0.0-rc.2` | PASS (21 checks): tag, release inmutable, SHA256SUMS, digest, attestation + offline + repo ajeno rechazado, SBOM, revocaciones, bootstrap init/sync --require-attestation/doctor/run/status READY CHECKED | PASS |
| G-11 | Guard de release contra GitHub real | `node runtime/release/assert-unreleased.mjs --tag v3.0.0-rc.2 ...` / `--tag v3.0.0-rc.9 ...` | rc.2: REFUSED rc=1 ("already published"); rc.9: OK rc=0 | PASS (script); workflow NO VERIFICADO |
| G-12 | CI del SHA | `gh api commits/<sha>/check-runs` y `actions/runs?head_sha=` | 14 check-runs success (analyze x2, pin-check, pilot online x2, pilot offline x2, trivy-fs, validators x2, legacy baseline x2, sbom, Dependabot); workflows CI, CodeQL, Trivy, SBOM, Supply chain, pilot success | PASS |
| G-13 | Code scanning | `gh api code-scanning/alerts` | 13 alertas: abiertas = 0; #1-#8, #10, #11 `fixed`; #9, #12, #18 `dismissed` con motivo | PASS |
| G-14 | Dependabot / PRs | `gh api dependabot/alerts`; `gh pr list` | 0 abiertas (resto `fixed`/`dismissed`/`auto_dismissed`); PR abierta #48 (actions/checkout 4.2.2 -> 7.0.1) | PASS |
| G-15 | Secret scanning | `gh api repos/...` | secret_scanning enabled, push_protection enabled; alertas = 0; non_provider_patterns y validity_checks disabled | PASS |
| G-16 | Rulesets | `gh api rulesets` y `rulesets/24405506`; `branches/main/protection` | unico ruleset `ai-native-main` (branch, active, bypass_actors=[], ~DEFAULT_BRANCH): deletion, non_fast_forward, pull_request (required_approving_review_count=0, dismiss_stale=true), required checks (validators ubuntu/windows, pin-check, pr-gate con integration 15368; ai-native/trust-gate y merge-gate con 5170488), strict=false; proteccion clasica 404; sin ruleset de tags | VERIFICADO |
| G-17 | Permisos, Environments, secretos | `gh api actions/permissions`, `environments`, `actions/secrets` | sha_pinning_required=true, allowed_actions=all; Environments ai-native-human-review (reviewer jlbellonGmail, prevent_self_review=false) y ai-native-trust; secretos de repo = 0 | VERIFICADO |
| G-18 | Releases/tags | `gh release list`; `git tag` | v3.0.0-alpha.1, rc.1, rc.2 (pre-release); `publish` en release.yml sin `environment:` (estatico) | VERIFICADO |
| G-19 | Workflows: permisos y fallos silenciados | `grep -L "^permissions:"`; `grep continue-on-error \|\| true` | todos tienen `permissions:` top-level; solo release.yml:108 (audit gate, justificado) y un `|| true` de `grep` en un pipeline de seleccion | PASS |
| G-20 | Secretos en el arbol | `git grep` de patrones de tokens/claves privadas; ficheros .env/.pem/.key | sin coincidencias fuera de audit/ y legacy/ | PASS |
| G-21 | Residuos | `git ls-files` (legacy, _deprecated); `git grep` rutas locales; ficheros validate-* duplicados | legacy 165, _deprecated 29, rutas `C:\Users\jlbel` en 8+ ficheros de governance, 12 validadores triplicados | HALLAZGO |
| G-22 | Release-gate del propio informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 521d203... --reports <dir temporal>` | PASS rc=0, score 92.25, errors=[], warnings=[], report AUDIT-PLATFORM-521d203.md valido | PASS |

## H. Hallazgos

Estado de los hallazgos de la auditoria 3477428 (verificado ahora): F-01 anterior (docs de gobernanza desfasadas tras rc.2) CERRADO en lo que describia, pero reaparece una desincronizacion distinta tras #60/#61 (F-01 actual); F-02, F-03, F-04, F-06, F-07, F-08 siguen ABIERTOS; F-05 anterior RECLASIFICADO (mitigado por runner hermetico, residual sin causa raiz). Nuevo: F-09.

| ID | Tipo | Sev. | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|--:|
| F-01 | CONTRADICTORIO | MINOR | Gobernanza desfasada tras el merge de #61: SESSION-CONTEXT:21 dice M5.2 "Cerrada con la PR #61 (pendiente de merge humano)" y el roadmap "cierra al mergear la PR #61" cuando HEAD ya es su merge (521d203); M5-2-MATRIX:15 (fila OFFLINE Windows) dice "El job 'pilot offline (windows-latest)' lo repite en CI: pendiente" aunque la misma fila cita el job 112045838431 en success; la tabla de auditorias de SESSION-CONTEXT omite el informe 15715ea (92.25) que existe en `.audit/reports/`; QUALITY-MATRIX se declara "sobre main = 5afe752" | SESSION-CONTEXT.md, M5-2-MATRIX.md, AI-NATIVE-V3-ROADMAP.md, G-12 | Q1.3 | -0.75 |
| F-02 | RIESGO | MINOR | approvals=0, strict=false: el merge humano no lo impone el servidor (un solo maintainer, limite F2 conocido y documentado) | G-16 | Q6.2, Q8.3 | -1.25 |
| F-03 | NO VERIFICADO | MINOR | Revocacion de las claves antiguas de `ai-native-trust` no verificable (la API no expone claves de una App); impide COMPLETO en Q7.1 (QUALITY_SCORE 16) | SESSION-CONTEXT, SECRETS-BOUNDARY | Q7.1 | -0.75 |
| F-04 | INCOMPLETO | MINOR | Sin ruleset de tags (1 solo ruleset, de rama) y `publish` (contents/id-token/attestations write) sin Environment. Mitigado por ancestro de main, CI verde, audit gate y ahora el guard de doble publicacion | G-16, G-18 | Q7.3 | -0.5 |
| F-05 | RIESGO / NO VERIFICADO | MINOR | (a) Fragilidad local en Windows: `git` falla de forma intermitente con `Permission denied` en `.git/objects` de repos temporales con la concurrencia por defecto (documentado por el repo, 3 de 4 corridas locales). El repo corrigio una causa demostrada (repo git ancestral en HOME, `GIT_CEILING_DIRECTORIES`) y mitiga con concurrencia 2 por defecto en `scripts/test-hermetic.mjs`; el residual NO tiene causa raiz demostrada (el propio repo lo marca PARTIAL) y no se repitio aqui con la concurrencia por defecto. (b) La cadena `tsc/eslint/vitest` de foundation/ y template/ no corre en CI (sin coincidencias en workflows; 93 ficheros .ts, 1 de test) ni pudo ejecutarse aqui | G-05, G-06; ci.yml; foundation/package.json | Q5.3 | -1.0 |
| F-06 | SOBRA | MINOR | legacy/ (165 ficheros), `_deprecated` (29 ficheros en scripts/ y template/) y rutas locales de usuario (`C:\Users\jlbel`, `D:\proyectos`) en 18 ficheros (governance/execution/archive, ADR-003) | G-21 | Q2.2, Q3.1 | -1.5 |
| F-07 | DUPLICADO | MINOR | validate-duplicate-detection / historical-archive / legacy-inventory / obsolete-artifacts existen 3 veces (foundation, knowledge, template) | G-21 | Q3.3 | -0.75 |
| F-08 | FALTA | MINOR | Troubleshooting general de una linea (README.md:79) | README | Q4.5 | -0.5 |
| F-09 | NO VERIFICADO | MINOR | El guard `assert-unreleased` (incidente real de rc.2: el push del tag arranco dos runs y la segunda dejo un borrador duplicado) esta cableado en `release.yml` `publish`, pero ese job solo corre con tag: las PRs ejecutan `build` como ensayo, asi que el cableado (checkout + script, `gh` y `node` del runner, `GH_TOKEN`) no se ha ejercido en un workflow real. El script si se probo contra GitHub real (G-11) y con 7 tests | G-11; release.yml:157-176; M5-2/QUALITY-MATRIX ("primer uso real: v3.0.0") | Q6.4 | -0.75 |

Total puntos perdidos: 0.75 + 1.25 + 0.75 + 0.5 + 1.0 + 1.5 + 0.75 + 0.5 + 0.75 = 7.75 -> 92.25.

### Detalle por hallazgo

**F-01.** Impacto: un lector que siga SESSION-CONTEXT creeria que #61 esta pendiente y que M5.2 no cierra aun; Q1.3 exige coherencia doc/configuracion. Causa raiz R-2. Correccion minima: actualizar las tres frases (SESSION-CONTEXT fila M5.2, roadmap M5.2, M5-2-MATRIX fila Windows) y anadir 15715ea a la tabla de auditorias. Verificacion: `grep -n "pendiente de merge" governance` vacio; `validate-doc-drift` verde; cada afirmacion de estado coincide con `gh api`. Recupera +0.75.

**F-02.** Impacto: un unico actor puede aprobar y mergear; el control server-side de HITL no es impuesto. Causa raiz R-1 (un maintainer). Correccion: segunda identidad humana con `required_approving_review_count>=1` y `strict_required_status_checks_policy=true` (o decision explicita registrada que cambie el contrato, sin waiver). Verificacion: `gh api rulesets/24405506` muestra approvals>=1, strict=true. Recupera +1.25 (Q6.2 +0.75, Q8.3 +0.5).

**F-03.** Impacto: una clave privada antigua podria seguir vigente. Causa raiz R-1. Correccion: el maintainer revoca las claves en la configuracion de la App y lo registra en SECRETS-BOUNDARY con captura/fecha verificable (o la App se reemplaza y la antigua se elimina). Verificacion: evidencia humana versionada de que la App no lista claves antiguas. Recupera +0.75.

**F-04.** Impacto: cualquiera con escritura puede empujar un tag `v*`; el workflow filtra por ancestro de main y CI verde pero `publish` tiene permisos de escritura sin aprobacion. Correccion: ruleset de tags `v*` (creacion restringida, sin bypass) y `environment:` en `publish`. Verificacion: `gh api rulesets` lista un ruleset target=tag; release.yml `publish` con `environment`. Recupera +0.5.

**F-05.** Impacto: bajo; falsos fallos locales en Windows y deuda TS fuera de CI. Causa raiz R-3. Correccion minima: o bien demostrar la causa del `Permission denied` (bucle con trazas de `git`/exclusion de antivirus del temp) o bien reintento acotado ante EPERM en los helpers de tests; y anadir un job CI de `tsc --noEmit`/tests TS de foundation/template o declarar formalmente esas areas fuera del alcance de calidad. Verificacion: 3 corridas completas con concurrencia por defecto en Windows sin fallo; job CI en verde. Recupera +1.0.

**F-06.** Impacto: ruido, rutas de usuario filtradas a un repo distribuible, estructura menos clara. Causa raiz R-4. Correccion: mover legacy/ y `_deprecated` a un tag/rama de archivo o declararlos explicitamente en un manifiesto con test, y anonimizar las rutas locales archivadas. Verificacion: `git ls-files` sin ellos (o manifiesto verde) y `git grep` de rutas locales vacio. Recupera +1.5 (Q2.2 +0.75, Q3.1 +0.75).

**F-07.** Impacto: divergencia entre copias. Causa raiz R-4. Correccion: un unico validador parametrizado por area, invocado desde cada area. Verificacion: CI de validators verde con un solo fichero fuente. Recupera +0.75.

**F-08.** Impacto: un usuario nuevo sin guia para fallos previsibles (RESTART_REQUIRED, DEGRADED_READONLY, REVOKED, ruleset). Correccion: seccion de troubleshooting con los estados de `status` y la accion de cada uno. Verificacion: inspeccion del README; cada estado listado coincide con `runtime/bootstrap`. Recupera +0.5.

**F-09.** Impacto: si el cableado fallara (p. ej. `node` ausente, permiso de `gh api` sobre releases con el `GITHUB_TOKEN` de `contents: write`), el guard fallaria cerrado y bloquearia una release legitima, o no protegeria contra la doble publicacion; no se sabria hasta el tag. Causa raiz R-5 (job de solo-tag sin ensayo). Correccion minima: ejercer el job `publish` (o al menos el paso del guard) en un `workflow_dispatch`/PR de ensayo con tag ficticio sin publicar, o aportar el run real del siguiente tag como evidencia versionada. Verificacion: run en success con el paso "Refuse to publish twice for the same tag" visible, y un segundo run para el mismo tag que lo rechace. Recupera +0.75.

### H-bis. Revision del codigo cambiado desde 3477428

- `runtime/adapters/opencode.mjs` / `sync.mjs` / `consumer.mjs`: `buildOpenCodeConfig(agents, mcp, { rolesDir })` apunta `{file:./<rolesDir>/<role>.md}` solo en modo consumidor (`opencodeRolesDir: ".opencode/roles"`); en modo fabrica el comportamiento no cambia (`rolesDir=null`). `buildToolFiles` escribe los prompts de rol en el consumidor solo si se pide opencode y hay `rolesDir`. Corrige un defecto real (HTTP 500 por referencia colgante a `core/roles`). Cubierto por dos tests: el unitario de `opencode.test.mjs` y `fixture.test.mjs`, que ahora comprueba que cada `{file:}` del `opencode.json` generado existe en el consumidor. Correcto. Limite declarado por el repo (no defecto): el rc.2 publicado SIGUE generando el config defectuoso; el arreglo llega con la proxima release.
- `.github/workflows/release.yml`: nuevo checkout (`persist-credentials: false`) y guard antes de adjuntar o crear nada; `permissions` del job inalterados (sin ampliacion); acciones fijadas por SHA (validate-actions-pinned PASS). La concurrencia por ref con `cancel-in-progress: false` serializa los runs del mismo tag, de modo que el segundo run ve el release del primero y se niega. Ver F-09 (cableado no ejercido).
- `runtime/release/assert-unreleased.mjs`: valida tag y repo con regex antes de invocar `gh` (sin shell; `spawnSync` con argv), falla cerrado si `gh` falla (`refusing to publish blind`), cubre borradores y publicados, y nunca borra ni edita. Probado contra GitHub real (G-11).
- `.github/workflows/pilot.yml`: pin a rc.2 con commit y digest reales; `status --check` online exige READY y revocation CHECKED; job `offline` con Docker `--network none` en Ubuntu y net-guard en proceso en Windows (declarado mas debil en la evidencia y en la matriz; no se sobreestima). Ambos en success en el SHA.
- `.github/workflows/ci.yml`: paso nuevo con los tests y validadores de m52 y del runner hermetico; el job fallaria con cualquier error (sin `continue-on-error`).
- `scripts/test-hermetic.mjs`: `GIT_CEILING_DIRECTORIES` con la raiz de temp, `GIT_CONFIG_NOSYSTEM`, concurrencia 2 por defecto, resumen con plataforma y concurrencia. Aisla una causa real (HOME como repo git). No resuelve ni oculta el residual de F-05: lo declara.
- `evaluation/m52/**`: matriz JSON como fuente unica con validador y tests; toda fila obligatoria con evidencia o estado explicito; sin credenciales en el arbol (G-20). Observaciones (SUGGESTION, sin puntos): la pata Linux de las CLIs reales corrio en un solo host WSL2 y OpenCode con override de modelo (declarado); L2 es de un solo agente/modelo (declarado).

## I. Causas raiz

| ID | Causa raiz | Hallazgos | Impacto |
|---|---|---|---|
| R-1 | Un unico maintainer | F-02, F-03 | Q6.2, Q7.1, Q8.3 (una penalizacion por criterio) |
| R-2 | Documentacion de estado escrita a mano y no cerrada tras cada merge | F-01 | Q1.3 |
| R-3 | Tests con repos git temporales en Windows sin causa raiz de bloqueo demostrada; areas heredadas fuera de la CI raiz | F-05 | Q5.3 |
| R-4 | Monorepo con historico congelado y validadores copiados | F-06, F-07 | Q2.2, Q3.1, Q3.3 |
| R-5 | Job de publicacion solo ejecutable con un tag real, sin ensayo | F-09 (y parcialmente F-04) | Q6.4 |

## J. Que sobra

CONSOLIDAR los 12 validadores triplicados (F-07); REVISAR legacy/, `_deprecated` y rutas locales archivadas (F-06). Todo lo demas inspeccionado tiene uso verificable (referencias y tests).

## K. Que falta

### OBLIGATORIO PARA 100/100

Cerrar F-01 a F-09 (7.75 puntos).

### MEJORAS OPCIONALES (0 puntos, fuera del camino)

Registrar `--skip-ruleset-check` en el journal de migrate; mocks de red para los tests de verify-release; resolver la PR #48 con nota de gobernanza; segunda ejecucion de las CLIs reales en un runner Linux de CI (hoy un host WSL2); un segundo agente/modelo en L2.

## L. NO VERIFICADO

| Item | Motivo | Impacto | Como verificar |
|---|---|---|---|
| Revocacion de claves de `ai-native-trust` | Accion humana, sin API | Q7.1 no COMPLETO (F-03) | El maintainer confirma en GitHub Apps y lo registra |
| Ejecucion real del guard en `release.yml` publish | No se crea tag | Q6.4 (F-09) | Run de ensayo o del siguiente tag |
| OpenCode MCP y consumo de `.codex/config.toml` | `NOT_AVAILABLE_FROM_TOOL` (declarado por el repo) | Ninguno (opcionales, sin puntuar como cumplidos) | Corrida reproducible que observe el gateway/el config desde la herramienta |
| Causa raiz del `Permission denied` intermitente de git | No reproducido aqui con concurrencia por defecto (no se ejecuto por riesgo de memoria) | Q5.3 (F-05) | Bucle con trazas de git y exclusion del temp en el antivirus |
| Cadena `tsc/eslint/vitest` de foundation/template | Requiere `pnpm install` dentro del repo (prohibido) | Q5.3 (F-05b) | Job de CI o ejecucion en un clon aparte |
| Re-ejecucion de CLIs reales y L2 | Requieren credenciales/coste; se valido la evidencia versionada y su validador | Ninguno directo (no se otorgan puntos por ejecucion propia) | Re-ejecutar `evaluation/m52/real-cli.mjs` y `run-l2.mjs` |
| Reproducibilidad bit a bit de rc.2 | No se reconstruyo | Puntuado por `cmp` de dos builds en CI y digest verificado | Rebuild en 51ef185 |

## M. Quality Gates

G1 BLOCKER: PASS (0). G2 CRITICAL: PASS (0). G3 verificacion esencial: PASS: bootstrap/validacion principal/CI principal pasan, y la suite principal pasa 680/680 por el runner oficial del repo. Constancia de transparencia: la suite con la concurrencia por defecto de `node --test` no se repitio en esta auditoria; los fallos intermitentes conocidos (F-05a) no se observaron porque no se provocaron. No se activa ningun gate. Si un consumidor del informe aplicara una lectura estricta de G3 a esa fragilidad conocida, el techo seria 89, que sigue siendo >= 88.

## N. Camino matematico a 100

Score actual 92.25. F-01 +0.75 (Q1.3); F-02 +1.25 (Q6.2 +0.75, Q8.3 +0.50); F-03 +0.75 (Q7.1); F-04 +0.50 (Q7.3); F-05 +1.00 (Q5.3); F-06 +1.50 (Q2.2 +0.75, Q3.1 +0.75); F-07 +0.75 (Q3.3); F-08 +0.50 (Q4.5); F-09 +0.75 (Q6.4). Suma 7.75; 92.25 + 7.75 = 100. Aplicables = 100, sin normalizacion.

## O. Plan de remediacion (solo MINOR; no hay BLOCKER/CRITICAL/MAJOR)

1. F-01 (agente): sincronizar SESSION-CONTEXT, roadmap, M5-2-MATRIX y la tabla de auditorias. +0.75.
2. F-09 (agente/humano): ensayo del paso del guard en un workflow de prueba o evidencia del siguiente tag. +0.75.
3. F-05 (agente): causa raiz o reintento acotado del `Permission denied`; job CI de TS o declaracion de alcance. +1.0.
4. F-06/F-07/F-08 (agente): archivar/anonimizar, consolidar validadores, ampliar troubleshooting. +2.75.
5. F-02/F-03/F-04 (humano): segunda identidad y `strict`, confirmar revocacion de claves, ruleset de tags y Environment de publish. +2.5.

## P. Segunda pasada de 100

N/A (score < 100).

## Q. Certificacion final

Es hoy una PLATAFORMA PROFESIONAL DE REFERENCIA (100/100)? NO. Nivel "muy buen nivel": 92.25/100, 0 BLOCKER/CRITICAL/MAJOR, 9 MINOR abiertos, un punto NO VERIFICADO (revocacion de claves), un cableado de release no ejercido (F-09) y un riesgo residual de fiabilidad de tests locales en Windows. Cumple el umbral nominal de release (>= 90) y el minimo efectivo (>= 88). Este informe certifica solo el commit 521d203 (o un descendiente cuya diferencia neta sea unicamente `.audit/**` y `STATUS.md`).
