---
targetRepo: jlbellonGmail/ai-native
targetCommit: fdb8a3e619562afcab299e0fa6f9f695983b11fc
platform:
  version: "v4.1.0 candidate"
  commit: fdb8a3e619562afcab299e0fa6f9f695983b11fc
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-25T04:45:00Z"
scope: "Independent read-only PLATFORM 1.2 audit of the v4.1.0 Native Acceptance candidate fdb8a3e (branch feature/native-acceptance-v4.1.0, draft PR #190 to develop) over the delta 15548c1..fdb8a3e (12 commits, 79 files, +5668/-26: runtime/acceptance, circuit/policy/bootstrap wiring, 5 new contracts, acceptance-governance workflow, specs 001-003, governance records). Baseline: AUDIT-PLATFORM-cad1053.md (90.50, v4.0.2 candidate); every inherited finding re-verified live or by an empty diff over its area. Evidence taken from a frozen clone of fdb8a3e outside the repository because another process modified the worktree during the audit, plus the CI of the exact SHA. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the change; it runs under the same Windows and GitHub identity as the builder (V4.1.0-LOCAL-DEVELOPMENT-EXCEPTION, U0 PENDING, N-40, ROOT-003). runtime/circuit/review-ledger.test.mjs not run locally (covered by CI). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 85.75
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.1.0 Native Acceptance, fdb8a3e)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               D:\proyectos\ai-native-v410 (worktree; solo lectura)
                    + clon congelado de fdb8a3e en <scratchpad>/audit410/clone (fuera del repositorio)
Branch:             feature/native-acceptance-v4.1.0 (= origin por ls-remote, fdb8a3e)
                    PR #190 → develop: OPEN, DRAFT, MERGEABLE, mergeStateStatus UNSTABLE
Commit:             fdb8a3e619562afcab299e0fa6f9f695983b11fc (HEAD al empezar y al terminar)
Base:               origin/develop = 15548c1 (merge de #185, línea v4.0.2) = merge-base
Baseline:           .audit/reports/AUDIT-PLATFORM-cad1053.md (90.50, APTO CON CORRECCIONES, v4.0.2)
Release vigente:    v4.0.2 (d08531e); v4.1.0 libre local y en origin; sin release v4.1.0
Tag:                ninguno en el commit
Fecha:              2026-11-25 (UTC ~04:05-04:45)
Worktree:           limpio al empezar (git status vacío) → WORKTREE NO LIMPIO DURANTE LA AUDITORÍA:
                    otro proceso modificó 14 archivos sin commit a partir de 04:20:31 UTC (contract.mjs, runner.mjs,
                    verdict.mjs, downgrade.mjs, feature.mjs, hitl.mjs, review-ledger.mjs, upgrade*.mjs,
                    acceptance-governance.yml y tests). Este auditor no editó nada. Se audita EXCLUSIVAMENTE fdb8a3e:
                    la evidencia ejecutable posterior a 04:20 se tomó del clon congelado; la anterior (validadores,
                    runtime/acceptance) terminó antes de la primera modificación (04:19:59) con worktree limpio.
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente de contexto aislado, lanzado desde la sesión del Builder,
                    con instrucciones de solo lectura. No escribió el cambio. Corre con la MISMA identidad de Windows y de
                    GitHub que el Builder: no hay separación técnica agente/humano (excepción de desarrollo local firmada
                    por el humano, U0 PENDING; N-40, ROOT-003). El humano debe ponderar esa independencia.
                    No aprobó ningún Environment ni deployment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, git core.autocrlf=true, gh (solo lectura); sin runtime de
                    contenedores
Temporales:         <scratchpad>/audit410: logs/, clone/, b1/, b2/, b410/ (build rechazado), x/ (extracción), sondas
                    probe-cutoff.mjs y probe-argv.mjs (importan módulos del clon; no escriben en ningún repositorio)
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 85.75/100
Score final: 85.75/100
Quality Gate aplicado: G3 (verificación esencial rota → máximo 89); no limita porque el bruto es inferior
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 80-89 «Buen nivel, aún no de referencia»)
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88): NO ALCANZA (85.75, −4.25).** 0 BLOCKER, 0 CRITICAL, **3 MAJOR** (nuevos), 23 MINOR (19 heredados + 4 nuevos). Sin N/A.

**Lo que funciona (verificado por mí).**

* El núcleo nuevo está bien construido y probado: `runtime/acceptance/*.test.mjs` 71/71 PASS; `runtime/policy` 69/69; `implement-all` + `independent-review` 48/48; `runtime/bootstrap` 49/49 (matriz de upgrade, cutoff, rollback). En CI del SHA exacto, `runtime/circuit` (285 tests, incluye `review-ledger.test.mjs`) pasa en ubuntu y windows.
* Los 12 validadores oficiales y `audit check` dan exit 0. `validate-contracts`: 26 schemas, 8 datos (antes 21/7). `validate-ci-tests-listed`: 115 archivos de test listados. Acciones fijadas por SHA.
* Build reproducible: dos builds de `fdb8a3e`, 6/6 assets idénticos, 265 archivos (antes 234). `--version v4.1.0` se rechaza fail-closed porque `CLI_VERSION` sigue en `v4.0.2`; `pretag` da NOT READY con 4 FAIL esperados.
* El diseño del veredicto confiable es correcto: `workflow_run` desde la rama por defecto, `analyze` sin secretos que lee la candidata como objetos Git con límite de tamaño, `publish`/`finalize` bajo Environments. La documentación declara con honestidad lo que falta (`native-acceptance.md:58-68`, cuerpo de #190, `V4.1.0-LOCAL-DEVELOPMENT-EXCEPTION.md`).

**Lo que no funciona.**

* **N-49 (MAJOR, activa G3). La suite principal de CI falla en el SHA exacto, en Linux y en Windows.** `runtime/adapters/consumer-launcher.test.mjs` falla 2/10 (F-17). La causa es el delta: `core/commands/sdd-tasks.md:16` nombra rutas privadas de la plataforma (`contracts/acceptance-plan.schema.json`, `contracts/acceptance-validation-contract.schema.json`) que no existen en un consumidor, y `sdd acceptance run` (de `sdd-implement-all.md:28`) sale con 1 desde el consumidor de prueba. Por el fail-fast, los 23 pasos siguientes de `validators` se saltaron: los tests de `runtime/acceptance`, `bootstrap`, `release`, `cli`, `gates`, `docs` y demás **nunca corrieron en CI** para esta candidata. Reproducido en el clon congelado: exit 1, los mismos 2 tests.
* **N-50 (MAJOR). RF-8 no se cumple en el runner.** `checkArgv` (`contract.mjs:51-61`) solo rechaza las grafías exactas `-e`, `--eval`, `-p`, `--print`… Acepta `--eval=0`, `-pe 0`, `--print=1` y `--import data:…` (sonda V-22). Además, `resolveExecutable` (`runner.mjs:18-33`) resuelve nombres sin ruta (`python3`, `pytest`, `docker`) desde `process.env.PATH`, aunque su propio docstring (`runner.mjs:18`) dice lo contrario, y RF-8 exige rechazar «environment-derived executables». La observación B.5 del E2E («trivial validation refused») solo es cierta para la grafía `-e`.
* **N-51 (MAJOR). El alcance obligatorio de v4.1.0 está incompleto.** Está declarado con honestidad, pero falta. No existen el job de CI de cierre desde checkout limpio (002 RF-31, AC-9) ni el job L3 del consumidor (002 T7). El camino del veredicto confiable (RF-25) no está configurado. El piloto GI PostgreSQL (003 T5) no se ejecutó. La spec 001 no tiene `AC-n` (`sdd validate 001-dependency-graph --level full` → exit 1). Las features 002 y 003 de la propia plataforma están BLOCKED: la plataforma no tiene `acceptance/validation-contract.json`. Hasta que exista RF-31, el ledger local es una cadena de hash sin clave, y cualquiera que escriba en el git dir puede reconstruirla (`appendEvidence` es exportado, `evidence.mjs:79-88`). No hay evidencia de cierre que no pueda falsificarse.

**Sensibilidad.** Frente a `cad1053` (90.50): −4.75. Baja Q1.4 (−1.50), Q5.3 (−1.00), Q1.2 (−0.75), Q6.5 (−0.50), Q7.4 (−0.50) y Q8.4 (−0.50). Cerrar solo N-49 deja 86.75 y retira G3. Para llegar a 90 hay que cerrar además N-50 y parte de N-51 o de los heredados.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.** El diffstat completo `15548c1..fdb8a3e` y el log de los 12 commits. Leídos enteros: `acceptance-governance.yml`, `verdict.mjs`, `downgrade.mjs`, `evidence.mjs` y los diffs de `coordinator`, `implement-all`, `independent-review`, `review-ledger`, `sdd-cli`, `hitl.mjs`, `upgrade.mjs`, `gates.json`, `hitl-policy*`, `ci.yml` y `core/commands/*`. Por partes: `runner.mjs` (resolución y tiers), `contract.mjs` (argv), `cli.mjs:30-60`, `feature.mjs:30-50` y `fixture.mjs`. Las specs 002 (RF-8, RF-25, RF-31..35, criterios de aceptación) y 003 (RF-18, criterios de aceptación), las tres `tasks.md`, `native-acceptance.md`, `V4.1.0-E2E-EVIDENCE.md`, su script `v4.1.0-e2e-observe.mjs`, `V4.1.0-LOCAL-DEVELOPMENT-EXCEPTION.md`, `SESSION-CONTEXT.md` (cabecera) y el cuerpo de #190. El método completo: `AUDIT_PROMPT`, `QUALITY_SCORE`, `AUDIT_RULES`, `PLATFORM.md`, el schema del informe y el baseline `cad1053`.

**Ejecutado** (§G). Los 12 validadores, `audit check`, 6 archivos o grupos de tests, 3 builds (2 reproducibles y 1 rechazado), `pretag`, `release-gate`, `sdd validate` y `sdd acceptance status` sobre las specs nuevas, 2 sondas del auditor, el barrido de higiene y EOL del delta, y la lectura remota de la CI, los checks, el plano de control y las alertas.

**No ejecutado localmente.** `runtime/circuit/review-ledger.test.mjs`, por instrucción (≈1 h en este host); lo cubre la CI del SHA (285/285 en `runtime/circuit`, ×2 SO). Tampoco el resto de la suite fuera de las áreas tocadas por el delta.

**No verificable.**

* `acceptance-governance.yml` no puede ejecutarse hasta estar en `main`, porque `workflow_run` usa el archivo de la rama por defecto. Su comportamiento real (publish/finalize, `action_required`) queda NO VERIFICADO.
* El tier `container` y el piloto GI necesitan un runtime de contenedores, que este host no tiene (NO VERIFICADO — LIMITACIÓN DEL ENTORNO).
* Codex y OpenCode; F-007.

**Limitación de integridad.** Otro proceso (inferido: la sesión del Builder) modificó 14 archivos del worktree durante la auditoría. Cualquier commit nuevo deja este informe STALE.

**Accesos remotos (solo lectura).** `gh pr view 190`, `pr list`, `run list`, `run view`, `api` de los jobs y de sus logs, `rulesets`, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, `environments`, `code-scanning` (también `refs/pull/190/merge`), `dependabot` y `secret-scanning`; `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | Grafo de dependencias determinista, declaraciones públicas verificadas por commit + ruta + SHA-256 | OBLIGATORIO | spec 001 | IMPLEMENTADO; tests PASS (V-12). Spec sin `AC-n` (N-51) |
| C-02 | Contrato de validación, plan, runner gobernado y parsers | OBLIGATORIO | 002 RF-1..24 | IMPLEMENTADO; tests PASS. RF-8 incompleto (N-50) |
| C-03 | Ledger encadenado, staleness, cobertura de rutas | OBLIGATORIO | 002 RF-5..7, RF-30 | IMPLEMENTADO (local) |
| C-04 | Cierre solo con el resultado del job de CI del commit evaluado | OBLIGATORIO | 002 RF-31, AC-9 | **NO IMPLEMENTADO** (declarado; N-51) |
| C-05 | DOWNGRADE → `human_gate: required`; veredicto confiable desde `main` | OBLIGATORIO | 002 RF-25, RF-35 | Detector y workflow IMPLEMENTADOS; configuración humana PENDIENTE (declarado); creación del cutoff sin control (N-52) |
| C-06 | Manual, paridad y trazabilidad | OBLIGATORIO | 002 RF-26..29 | IMPLEMENTADO; tests PASS |
| C-07 | Aceptación automática en `/sdd-spec`, `/sdd-tasks`, `/sdd-implement-all`, `/sdd-validate` | OBLIGATORIO | 003 RF-1, RF-19 | IMPLEMENTADO; **proyección rota en consumidor** (N-49) |
| C-08 | Clasificación REQUIRED/NOT_APPLICABLE/LEGACY; `--level full` falla sin criterios | OBLIGATORIO | 003 RF-18 | VERIFICADO (V-14); la spec 001 propia lo incumple (N-51) |
| C-09 | Matriz de upgrade (v4.0.1, v4.0.2, v3.4.2, v3.4.3), rollback e idempotencia | OBLIGATORIO | 003 RF-4, RF-8..13 | VERIFICADO (bootstrap 49/49) |
| C-10 | Piloto de referencia GI PostgreSQL | OBLIGATORIO | 003 T5 | **NO EJECUTADO** (declarado; N-51) |
| C-11 | E2E en consumidor desechable | OBLIGATORIO | 003 T6, RF-21 | DOCUMENTADO; trazabilidad débil (N-54) |
| C-12 | Tests en CI Linux y Windows | OBLIGATORIO | perfil Q5, `ci.yml` | **FAIL en el SHA** (N-49) |
| C-13 | Bundle determinista, sin código de solo-tests | OBLIGATORIO | `bundle.mjs:21-27` | Reproducible; con fixtures de test (N-55) |
| C-14 | Separación humano/agente (U0/G5) | PROPUESTA | excepción v4.1.0 | PENDIENTE, aceptado por el humano (N-40) |
| C-15 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 9.00 | PARCIAL/MENOR (N-51, N-52, N-31, N-43) |
| Q2 Reutilización | 12 | 12.00 | COMPLETO |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 12.50 | PARCIAL/MENOR (N-49, N-29, N-27, N-24, F-003, F-004) |
| Q6 Git/CI/CD/Release | 16 | 13.50 | MENOR (F-005, N-25, N-26, N-44, N-55, F-006) |
| Q7 Seguridad | 12 | 9.00 | MENOR (F-007, N-32, F-008, CodeQL #27, N-50, N-53, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 6.50 | MENOR (N-40, F-005, N-54) |
| **TOTAL** | **100** | **85.75** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Leyenda: **E** evaluado sobre el delta; **V** verificado en vivo o ejecutado; **D** sin diff sobre el área.

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `native-acceptance.md:1-68` | — | E. Propósito, arquitectura y límites explícitos |
| Q1.2 | Capacidades presentes | 3 | MENOR | 2.25 | V-12..V-17, V-23 | N-52 | E+V. Las capacidades declaradas existen y pasan sus tests; la integridad del cutoff de 003 RF-18 no se verifica al crearlo. (RF-8 se puntúa en Q7.4, N-50) |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | `review-ledger.mjs`, `V4.0.1-PATCH.md` | N-31, N-43 | D/E. Heredados sin cambio. Las contradicciones nuevas (`runner.mjs:18` frente a `:27`; nota del E2E) se cuentan en N-50 y N-54 |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | **PARCIAL** | **1.50** | §D C-04, C-05, C-08, C-10; V-14, V-15 | **N-51** | E+V. Varios SHALL de las specs aprobadas como alcance siguen sin implementar o sin ejecutar; declarados, pero incompletos |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-18 | — | V |
| Q2.2 | Sin residuos | 3 | COMPLETO | 3.00 | V-24 | — | E. Delta sin rutas de host, secretos ni TODO reales |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | `native-acceptance.md:49-56` | — | E. Contrato propio del consumidor y propuesta revisable |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | V-24 (EOL `i/lf` ×79) | — | E |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | `runtime/acceptance/*` | — | E. Un módulo por responsabilidad |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `implement-all.mjs:34-35` | — | E. Etapa de aceptación importada, nunca inyectada |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | `verdict.mjs`, `hitl.mjs:131-155` | — | E. Dos lectores BASE/HEAD sobre un único detector puro; la separación la justifica la frontera de confianza (S-46) |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | E |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | README sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `native-acceptance.md:27-35` | — | E. La referencia rota de `sdd-tasks.md` se cuenta en N-49 |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | E2E B.1-B.6 | — | E. Diagnósticos BLOCKED accionables |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-08..V-11 | — | V. 12 validadores y `audit check`, exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas heredadas | N-24, F-003 | D. 71 tests nuevos con casos negativos |
| Q5.3 | Pruebas pasando | 4 | **PARCIAL** | **2.00** | V-19, V-20, V-13 | **N-49**, N-29, N-27 | V. Suite principal FAIL en CI ×2 SO; 23 pasos sin ejecutar en CI; reproducido localmente |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | V-19 | — | V. La regresión F-17 detectó el defecto: la protección funciona |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` | F-004 | D/E |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | E. 12 commits semánticos con trazas a tareas; PR draft = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-27 | F-005, N-25 | V. `develop` (base de #190) sin protección |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-20 | N-26, N-44 | V/D. La CI falló cuando debía; `acceptance-governance` NO VERIFICADO (§C) |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-25, V-26 | — | E. MINOR coherente con el cutoff; el bump se hace en la rama de release; `pretag` fail-closed |
| Q6.5 | Build reproducible | 2 | MENOR | 1.50 | V-18, V-21 | **N-55** | V. Reproducible; publica 8 archivos de solo-tests en contra de la política del bundle |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | V-16 | F-006 | V/D. Matriz y rollback nuevos PASS; F-006 heredado |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-24, V-27 | F-007 | V. Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-27 | N-32 | V. 18 alertas (1 high, 16 medium, 1 low), solo `foundation/` y `template/` |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-27, `acceptance-governance.yml` | F-008, CodeQL #27 | V. El workflow nuevo cumple mínimo privilegio y pines por SHA |
| Q7.4 | Defaults seguros | 2 | **MENOR** | **1.50** | V-22, V-28 | **N-50**, N-53 | V. Filtro de argv evitable y ejecutables tomados del PATH; 3 alertas CodeQL high sin triage |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | — | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | `execution/current/V4.1.0-*` | — | E. Estado de la candidata registrado en `execution/current/` (S-45) |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | excepción v4.1.0, V-27 | N-40 | V. Misma identidad, ahora con aceptación humana explícita |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-27 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V. El código nuevo falla cerrado (§H, N-51) |
| Q8.4 | Trazabilidad | 2 | **MENOR** | **1.50** | `V4.1.0-E2E-EVIDENCE.md:3,264` | **N-54** | E |

## G. LEDGER DE VERIFICACIÓN

Oficial del proyecto salvo (A) complementaria del auditor y (R) remota. Logs en `<scratchpad>/audit410/logs/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA | `git rev-parse HEAD` al inicio y al final; clon `checkout fdb8a3e` | `fdb8a3e619562afcab299e0fa6f9f695983b11fc` | PASS |
| V-02 | Worktree | `git status --porcelain` | vacío al inicio. **14 archivos M desde 04:20:31 UTC**, por otro proceso. Clon congelado: 0 cambios | WORKTREE NO LIMPIO (ajeno) |
| V-03 | PR y refs (R) | `gh pr list/view 190`; `ls-remote` | #190 OPEN, DRAFT → develop, head fdb8a3e, MERGEABLE/UNSTABLE; tag `v4.1.0` inexistente | PASS |
| V-04 | Alcance (A) | `git diff --stat 15548c1 HEAD`; `git log` | 12 commits, 79 archivos, +5668/−26; `fdb8a3e` solo documentación (3 archivos) | PASS |
| V-05 | Método | `node runtime/audit/cli.mjs check` | PASS | PASS |
| V-06 | Contratos | `contracts/validate-contracts.mjs` | 26 schemas, 8 datos, PASS | PASS |
| V-07 | Core | `core/validate-core.mjs` | PASS | PASS |
| V-08 | Validadores | `parity` (576 archivos, unmapped 0, 95/95), `doc-drift`, `validate-integrity`, `validate-entrypoints`, `audit-safe-script-mode`, `compat-matrix` (32), `m52/validate-evidence` | exit 0 ×7 | PASS |
| V-09 | CI-listado | `scripts/validate-ci-tests-listed.mjs` | «all 115 committed *.test.mjs files are run by a workflow» | PASS |
| V-10 | Pines | `scripts/validate-actions-pinned.mjs` | todas las acciones fijadas por SHA | PASS |
| V-11 | Resumen validadores | V-05..V-10 | 12 validadores + `audit check` exit 0 (worktree limpio, antes de 04:20) | PASS |
| V-12 | Tests acceptance | `node --test --test-concurrency=1 runtime/acceptance/*.test.mjs` | 71/71 PASS, 8 min; terminó 04:19:59, antes de la modificación ajena | PASS |
| V-13 | Tests afectados (clon) | `node --test` de `runtime/policy/*` · `implement-all` + `independent-review` · `runtime/bootstrap/*` · `cli/ai-native-lifecycle` · `runtime/release/*` | 69/69 · 48/48 · 49/49 · 47/47 · 40/40 (los tests de release no detectan N-55) | PASS |
| V-14 | `sdd validate` (A) | `node runtime/main.mjs sdd validate <s> --level normal\|full` para 001, 002 y 003 | 001: normal exit 0 (sin WARN: tiene sección en prosa), **full exit 1** («neither AC-n … nor not-applicable»). 002 y 003: full exit 0 | 001 FAIL (N-51) |
| V-15 | Aceptación propia (A) | `sdd acceptance status 002-native-acceptance --base origin/develop` | BLOCKED, REQUIRED, «no validation contract at acceptance/validation-contract.json»; exit 1 | BLOCKED (N-51) |
| V-16 | Upgrade | bootstrap 49/49 (V-13) | matriz, cutoff, rollback e idempotencia | PASS |
| V-17 | Integración circuito | V-13; CI `runtime/circuit` | 48/48 local; 285/285 ×2 SO en CI | PASS |
| V-18 | Build reproducible (A) | `build.mjs --version v4.0.2 --commit fdb8a3e… --out b1`/`b2` | exit 0 ×2; 6/6 assets idénticos (`cmp`); 265 archivos; `platform.json` digest `sha256:e3fd978f…9abd`; 0 `*.test.mjs` | PASS |
| V-19 | F-17 local (clon) | `node --test runtime/adapters/consumer-launcher.test.mjs` | exit 1; 8/10; ✖ «sdd-tasks.md names a path that does not exist in a consumer»; ✖ «sdd acceptance run <NNN-slug> --base <base-ref> -> exit 1 … CLASSIFICATION: MISSING» | **FAIL** (N-49) |
| V-20 | CI remota (R) | `gh run list --commit fdb8a3e…`; `gh api actions/jobs/{138972289064,138972288795}` (pasos y logs) | CI run 45544978469: **failure**. `validators (ubuntu-latest)` y `(windows-latest)`: paso 33 `runtime/adapters tests` FAIL (92 tests, 90 pass, 2 fail, los mismos F-17); pasos 34-55 skipped (incluido 36 `runtime/acceptance`); paso 32 `runtime/circuit` success (285, 0 fail). security-scan, CodeQL (análisis), Supply chain, Dependency review, SBOM, pr-gate y Trivy: success. **Check `CodeQL`: FAILURE** (3 alertas nuevas). Es el único push del branch: los tests de aceptación nunca corrieron en CI | **FAIL** (N-49, N-53) |
| V-21 | Contenido del bundle (A) | extracción de `b1`; `grep` de usos de `fixture.mjs` y `fixtures/upgrade-matrix` | El bundle incluye `runtime/acceptance/fixture.mjs` (solo lo importan 6 `*.test.mjs` y el script E2E) y 7 `runtime/bootstrap/fixtures/upgrade-matrix/*.json` (ningún módulo de runtime los lee). `EXCLUDE_PATTERNS` (`bundle.mjs:27`) solo cubre `*.fixture.mjs` | FAIL (N-55) |
| V-22 | Sonda argv (A) | `probe-argv.mjs` sobre `checkArgv`/`checkExecutable` del clon | `-e 0` rechazado; `--eval=0`, `-pe 0`, `--print=1`, `--import data:…`, `--require`/`-r` → []; `checkExecutable("python3")` y `("pytest")` → null (aceptados; se resuelven desde `process.env.PATH`, `runner.mjs:27`) | FAIL (N-50) |
| V-23 | Sonda cutoff (A) | `probe-cutoff.mjs` sobre `detectDowngrades` | crear el cutoff con un slug inexistente → `[]`; añadir un slug a un cutoff existente → `LEGACY_CUTOFF_ADDITION` | FAIL (N-52) |
| V-24 | Higiene y EOL (A) | `git diff 15548c1 HEAD \| grep` (rutas de host, cuentas, tokens, TODO, claves); `git diff --check`; `ls-files --eol` | Sin coincidencias reales (solo directivas TAP en el parser y el `repo` funcional en los fixtures). `--check` exit 0; 79 archivos `i/lf w/lf` | PASS |
| V-25 | Build v4.1.0 (A) | `build.mjs --version v4.1.0 …` | exit 1: «declares CLI_VERSION v4.0.2; this release is v4.1.0» | PASS (fail-closed) |
| V-26 | `pretag` | `node runtime/release/pretag.mjs --tag v4.1.0 --candidate fdb8a3e… --repo jlbellonGmail/ai-native` | NOT READY, exit 1. FAIL: no ancestro de `origin/main`; 0 CI ci.yml success; `CLI_VERSION` v4.0.2; sin auditoría válida. PASS: tag libre local y remoto, sin release | PASS (fail-closed esperado) |
| V-27 | Plano de control (R) | `gh api` rulesets, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, environments, dependabot, secret-scanning | Un solo ruleset (`ai-native-main`, sin bypass, `required_approving_review_count 0`, 6 checks: validators ×2, pin-check, pr-gate, trust-gate, merge-gate). `ai-native/acceptance-governance` no es requerido (declarado). `develop`: «Branch not protected», 0 reglas. `ai-native-human-review`: reviewer = propietario, `prevent_self_review false`. `ai-native-trust`: solo branch_policy. Dependabot: 18 (1 high, 16 medium, 1 low; `foundation/` y `template/` `pnpm-lock.yaml`). Secret scanning: 0. 0 rulesets de tag | PASS (con F-005, N-25, N-32, F-008, N-40) |
| V-28 | Code scanning (R) | `gh api code-scanning/alerts?ref=refs/pull/190/merge&state=open` | #53 `cli.mjs:44`, #54 `cli.mjs:53`, #55 `feature.mjs:41`: `js/file-system-race` (high). En la rama por defecto sigue abierta #27 (`l3-consumer.yml:116`) | FAIL (N-53; F-008) |
| V-29 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate fdb8a3e… --root <clon>` | FAIL (37 errores): 1 real («no current valid PLATFORM audit report») y 36 STALE | ESPERADO |
| V-30 | Release-gate contra este informe | `… release-gate --profile PLATFORM --candidate fdb8a3e… --reports <scratchpad>/audit410/reports --root <clon>` | **FAIL (1 error), exit 1**: «score 85.75 is below the release threshold 90 (tolerance 2)». El front matter se acepta: ningún error de schema ni de STALE | ESPERADO (coherente con §B) |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| **N-49** | ROTO | **MAJOR** | La suite principal de CI falla en el SHA (F-17 ×2, ubuntu y windows); 23 pasos sin ejecutar | V-19, V-20; `core/commands/sdd-tasks.md:16`, `sdd-implement-all.md:28` | Q5.3 (+ gate G3) | −1.00 |
| **N-50** | INCOMPLETO / RIESGO | **MAJOR** | RF-8 incumplido: inline script por grafías alternativas; ejecutables tomados del PATH; docstring contradictorio | V-22; `contract.mjs:51-61`; `runner.mjs:18-33` | Q7.4 | −0.50 (con N-53) |
| **N-51** | FALTA | **MAJOR** | Alcance obligatorio de v4.1.0 incompleto (RF-31, job L3, RF-25 sin configurar, 003 T5, 001 sin `AC-n`, aceptación propia BLOCKED); ledger local falsificable mientras falte RF-31 | §D; V-14, V-15; `evidence.mjs:79-88`; `native-acceptance.md:58-68` | Q1.4 | −1.50 |
| N-52 | INCOMPLETO | MINOR | La creación del cutoff legacy no se valida: un slug arbitrario queda fuera de la aceptación sin ningún hallazgo | V-23; `downgrade.mjs:94-96` | Q1.2 | −0.75 |
| N-53 | RIESGO | MINOR | 3 alertas CodeQL `js/file-system-race` (high) nuevas sin triage; check CodeQL FAIL en #190 | V-28 | Q7.4 | (incluido en N-50) |
| N-54 | INCOMPLETO / CONTRADICTORIO | MINOR | Evidencia E2E sin SHA de plataforma, nota final contradictoria y B.5 sobredeclarado | `V4.1.0-E2E-EVIDENCE.md:3,105-133,264` | Q8.4 | −0.50 |
| N-55 | INCORRECTO | MINOR | El bundle publica 8 archivos de solo-tests | V-21; `bundle.mjs:21-27` | Q6.5 | −0.50 |
| N-31, N-43 | CONTRADICTORIO / INCORRECTO | MINOR | Heredados (slug de revisiones atestadas; registro de N-38) | sin cambio en la lógica afectada | Q1.3 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | README sin diff | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | — | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host (heredados; la suite completa sigue sin poder correr localmente) | ROOT-002 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | — | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-27 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección: #190 se podría fusionar con la CI en rojo | V-27 | Q6.2 | −0.375 |
| N-26, N-44 | INCOMPLETO / RIESGO | MINOR | Pilot offline intermitente; `merge-gate` sin reintento (heredados) | sin diff en `runtime/pilot`, `evaluation`, `runtime/gates` | Q6.3 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | — | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-27 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 18 alertas Dependabot abiertas (1 high), fuera del bundle | V-27 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-27, V-28 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | — | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | U0/G5 no implantada: el agente y este auditor tienen la identidad del propietario | V-27; excepción v4.1.0 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 3 MAJOR, 23 MINOR.** Heredados abiertos (19): N-31, N-43, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, N-44, F-006, F-007, N-32, F-008 (con CodeQL #27), F-009, F-010 y N-40. Nuevos (7): N-49..N-55. Cerrados: ninguno.

### N-49 — Suite principal de CI en rojo en el SHA (MAJOR)

**Descripción.** El delta añade a `core/commands/sdd-tasks.md:16` referencias a `contracts/acceptance-plan.schema.json` y `contracts/acceptance-validation-contract.schema.json` «of the platform». Las proyecta en `.claude/commands/sdd-tasks.md`, y un agente del consumidor no puede abrir esas rutas. Además, `sdd-implement-all.md:28` (paso 0) ordena `sdd acceptance run`, que sale con 1 desde el consumidor de prueba de F-17 (la spec del fixture no tiene `AC-n` → `CLASSIFICATION: MISSING`). El test de contrato F-17 (`consumer-launcher.test.mjs:94`, `:108`) exige justo esas dos propiedades y falla en ubuntu y en windows. Lo reproduje en el clon congelado.

**Impacto.** Los checks requeridos `validators ×2` están en rojo. Por el fail-fast, la CI no ejecutó los tests de `runtime/acceptance`, `bootstrap`, `release`, `cli`, `gates`, `docs` ni `audit`. La afirmación «Tests … corren en CI en Linux y Windows» (perfil Q5) no se cumple para la funcionalidad nueva. Es el primer y único push del branch. Activa G3.

**Causa raíz.** ROOT-009: antes de publicar no se ejecutó la batería oficial completa de `ci.yml`, solo tests dirigidos.

**Corrección mínima suficiente.** Sustituir en `sdd-tasks.md` las rutas de schema por una referencia disponible en el consumidor, o por «el diagnóstico de `sdd acceptance plan` nombra cada campo», sin ruta. Para el paso 0, o el fixture de F-17 declara `AC-n` con un contrato válido, o el test admite el código BLOCKED documentado de `sdd acceptance run`. Lo que no vale es debilitar F-17. Después, re-ejecutar `ci.yml`.

**Verificación de cierre.** `node --test runtime/adapters/consumer-launcher.test.mjs` exit 0 y run de CI del nuevo SHA con `validators` success ×2 SO y el paso 36 (`runtime/acceptance`) ejecutado.

**Puntos recuperables.** +1.00 (Q5.3 PARCIAL → MENOR) y retirada de G3.

### N-50 — RF-8 no se cumple en el runner (MAJOR)

**Descripción.** 002 RF-8 exige rechazar «shell interpretation, inline script text, command substitution and environment-derived executables».

* `checkArgv` (`contract.mjs:51-61`) compara `INLINE_FLAGS` por igualdad exacta. Por eso acepta `--eval=…`, `-pe`, `--print=…`, `--import data:…` y `--require` (V-22).
* `checkExecutable` acepta como identidades fijas `python`, `python3`, `pytest` y `docker`, y `resolveExecutable` (`runner.mjs:26-31`) los busca en `process.env.PATH`. El comentario de `runner.mjs:18` («Bare names are never taken from the caller's environment variables») dice lo contrario.

**Impacto.** Un contrato de validación puede ejecutar código inline que imprima un flujo TAP con los IDs esperados y obtener PASS sin probar nada. También puede ejecutar un binario elegido por quien controla el PATH. La única barrera técnica sería la puerta humana sobre la creación o modificación del contrato (`CONTRACT_CREATED`/`CONTRACT_MODIFIED`), y con N-40 esa puerta no separa al agente del humano. La observación B.5 del E2E presenta como probado algo que solo vale para `-e`.

**Causa raíz.** ROOT-010: lista de denegación por grafía exacta en lugar de lista de permitidos; la resolución por PATH se dejó para el tier host.

**Corrección mínima suficiente.** Lista de permitidos de flags por intérprete. En host, solo `node` (que resuelve a `process.execPath`) o una ruta del repositorio. Los nombres sin ruta solo dentro de una imagen fijada por digest. Un test por cada grafía de V-22. El docstring debe coincidir con el código. (Las modificaciones sin commit observadas en el worktree apuntan a esto, pero no forman parte de lo auditado.)

**Verificación de cierre.** Repetir `probe-argv.mjs`: todas las grafías inline rechazadas y `python3`/`pytest` rechazados fuera del tier `container`; `runtime/acceptance` PASS en CI.

**Puntos recuperables.** +0.50 con N-53 (Q7.4 → COMPLETO).

### N-51 — Alcance obligatorio de v4.1.0 incompleto (MAJOR)

**Descripción.** Las specs 001, 002 y 003 están aprobadas como alcance de implementación (excepción v4.1.0:13). Siguen abiertos:

* **002 RF-31 / AC-9 / T3.** Falta el job de CI que re-ejecuta la aceptación desde un checkout limpio del commit evaluado y es la única fuente de cierre.
* **002 T7.** Falta el job L3 del consumidor, que debe aplicar el detector de la plataforma del lock de BASE.
* **002 RF-25.** El workflow existe, pero falta la configuración humana: ruleset de `develop`, check requerido, restricciones de Environment y separación de identidad.
* **003 T5.** El piloto GI PostgreSQL no se ejecutó.
* **Spec 001.** No tiene `AC-n`: su propio `sdd validate --level full` sale con 1 (V-14).
* **Aceptación de la propia plataforma.** Las features 002 y 003 están BLOCKED porque la plataforma no tiene contrato de validación (V-15).

Mientras falte RF-31, la única evidencia de aceptación es el ledger del git dir. Su cadena de hash no tiene clave y `appendEvidence` está exportado (`evidence.mjs:79-88`), así que quien pueda escribir el git dir puede producir entradas válidas. `reviewStatus` (`review-ledger.mjs:444-462`) lee ese ledger para permitir `APPROVED`.

**Impacto.** La garantía central de la versión («la aceptación no se puede declarar, solo demostrar») no tiene todavía una fuente de cierre que el agente no pueda escribir. Atenuantes: está declarado en `native-acceptance.md:58-68`, en el cuerpo de #190 y en el plan de 002; `governanceVerdict` devuelve BLOCKED sin el camino confiable (`downgrade.mjs:109-114`); y el merge sigue siendo humano. No es una contradicción oculta, pero sí un incumplimiento de SHALL del alcance.

**Causa raíz.** ROOT-011: dependencia de configuración humana (U0, ruleset) y de un runtime de contenedores que no existe en el host, más trabajo de CI pendiente.

**Corrección mínima suficiente.** Implementar el job RF-31 (checkout limpio del SHA, ejecución del contrato y publicación del resultado ligado a commit y run ID) y el job L3. Añadir `AC-n` a la spec 001 o una declaración `not-applicable` justificada. Darle a la plataforma un `acceptance/validation-contract.json` y llevar 002/003 a PASS, o registrar su exención aprobada por el humano. Ejecutar 003 T5 en un host con contenedores. La configuración de RF-25 la hace el humano.

**Verificación de cierre.** `sdd validate <s> --level full` exit 0 para 001, 002 y 003; `sdd acceptance status` PASS o NOT_APPLICABLE aprobado; run del job RF-31 ligado al SHA; evidencia del piloto T5.

**Puntos recuperables.** +1.50 (Q1.4 → COMPLETO). Si se aceptan formalmente como alcance de una versión posterior, el registro de la versión debe sacarlos del alcance de v4.1.0. Una aprobación no es una implementación: la decisión es del humano.

### N-52 — Creación del cutoff legacy sin validar (MINOR)

`detectDowngrades` solo informa `LEGACY_CUTOFF_ADDITION` cuando el cutoff ya existe en BASE (`downgrade.mjs:94-96`). 003 RF-18 define el cutoff como los slugs que existen al hacer el upgrade. Crear `acceptance/legacy-cutoff.json` con un slug que no existía en BASE (por ejemplo, la feature del mismo PR) lo deja como LEGACY, sin aceptación y sin ningún hallazgo (V-23). Lo mismo ocurre en `hitl.mjs` y en `verdict.mjs`. Atenuante: el PR de upgrade toca `ai-native.lock.json`, que es control plane, y la puerta humana se activa por esa vía.

**Corrección.** Cuando el cutoff se crea, informar `LEGACY_CUTOFF_ADDITION` para cada slug que no tenga `specs/<slug>/spec.md` en BASE, y añadir un test.

**Cierre.** `probe-cutoff.mjs` debe dar un hallazgo para `brand-new-feature`.

**Puntos.** +0.75 (Q1.2).

### N-53 — Alertas CodeQL nuevas sin triage (MINOR)

Tres alertas `js/file-system-race` (high) en `cli.mjs:44`, `cli.mjs:53` y `feature.mjs:41`, del tipo comprobar y luego escribir o leer. El riesgo real es bajo: CLI local, sin frontera de privilegio. Aun así, el check `CodeQL` de #190 está en FAILURE y nadie ha hecho triage.

**Corrección.** Usar `writeFileSync(…, { flag: "wx" })` o leer con `try/catch` en lugar de `existsSync`; o descartarlas con justificación.

**Cierre.** `code-scanning/alerts?ref=refs/pull/<n>/merge` sin alertas abiertas.

**Puntos.** Incluido en Q7.4 con N-50.

### N-54 — Trazabilidad de la evidencia E2E (MINOR)

* `V4.1.0-E2E-EVIDENCE.md:3` no nombra el commit de la plataforma ejercitado («working tree after commit of this record»). Se infiere que es el árbol de código de `dedcfeb`, igual al de `fdb8a3e`, que solo añade documentación (V-04), pero no está escrito.
* La nota `:264` dice que el estado final de B.7/B.8 es STALE por CRLF. Las salidas registradas muestran BLOCKED en la revisión `754d79…`, la misma de B.4: es un residuo de otra ejecución.
* La fila «trivial validation refused» (`:260`) no menciona que solo se probó `-e` (N-50).

**Corrección.** Registrar el SHA de la plataforma y el digest del bundle o shim usado, borrar o corregir la nota y acotar B.5.

**Cierre.** Inspección del registro.

**Puntos.** +0.50 (Q8.4).

### N-55 — Código de solo-tests en el bundle (MINOR)

`bundle.mjs:21-27` excluye los tests y los fixtures de test (`*.fixture.mjs`). `runtime/acceptance/fixture.mjs` no sigue ese patrón de nombre, solo lo importan tests y el script E2E, y se publica. Los 7 `runtime/bootstrap/fixtures/upgrade-matrix/*.json` tampoco los lee ningún módulo de runtime (V-21). El consumidor recibe 8 archivos sin función.

**Corrección.** Renombrar el módulo a `*.fixture.mjs`, o añadir patrones a `EXCLUDE_PATTERNS`, con un test en `release.test.mjs`.

**Cierre.** El bundle reconstruido no contiene esos 8 archivos.

**Puntos.** +0.50 (Q6.5).

### Heredados

Sus descripciones están en `AUDIT-PLATFORM-cad1053.md` §H y en los informes que cita. Siguen vigentes.

* **Verificados en vivo** (V-27, V-28): F-005, N-25, N-32 (ahora 18, +1 medium, fuera del bundle), F-008, CodeQL #27, F-007, N-40.
* **Por diff vacío o sin cambio de la lógica afectada:** N-31 (`review-ledger.mjs` solo recibe líneas de aceptación), N-43, N-44, N-11, N-24, F-003, F-004, F-006, F-009, F-010, N-26, N-27, N-29.

### H.1 Sugerencias (no restan puntos)

* **S-1..S-44:** heredadas (S-41 atendida en `cad1053`). Sigue vigente S-2: fusionar con *merge commit*.
* **S-45.** `SESSION-CONTEXT.md` (cabecera y `MAIN_DEVELOP`) todavía dice que la sincronización de #185 está «pendiente de merge humano» y no menciona la candidata v4.1.0, que vive en `execution/current/`. Conviene registrarla allí, como se hizo con las candidatas anteriores.
* **S-46.** `verdict.mjs:30-54` y `hitl.mjs:136-155` reimplementan la lectura BASE/HEAD alrededor del mismo detector. La separación está justificada por la confianza, pero un JSON de plan inválido en HEAD con BASE sin plan da 0 hallazgos en ambos lados. Un `reasons` explícito («plan.json invalid») haría el veredicto más informativo.
* **S-47.** `acceptance-governance.yml:85` usa `|| true` para continuar con BLOCKED. Si `verdict.mjs` falla antes de escribir, `upload-artifact` solo avisa y `publish` falla al descargar: no se publica ningún check, y el resultado es fail-closed. Un `if-no-files-found: error` haría el fallo explícito.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2 y Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite completa | N-29, N-27; contribuye a N-49 | Q5.3 |
| ROOT-003 | Los agentes (y este auditor) corren con la identidad del propietario | N-40; atenúa las puertas humanas de N-50 y N-51 | Q8.2 |
| ROOT-006 | Llamadas a la API de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-009 | No se ejecutó la batería oficial de `ci.yml` antes del push; los nuevos textos proyectados no se validaron contra F-17 | N-49 | Q5.3, G3 |
| ROOT-010 | Seguridad del runner por lista de denegación de grafías y resolución por PATH | N-50 | Q7.4 |
| ROOT-011 | Alcance de v4.1.0 dependiente de configuración humana (U0, rulesets) e infraestructura ausente (contenedores), más jobs de CI pendientes | N-51 | Q1.4 |

## J. QUÉ SOBRA

| Elemento | Acción | Motivo |
|---|---|---|
| `runtime/acceptance/fixture.mjs` y `runtime/bootstrap/fixtures/upgrade-matrix/*.json` en el bundle | ELIMINAR del bundle (no del repo) | Solo-tests (N-55, V-21) |
| Nota `V4.1.0-E2E-EVIDENCE.md:264` | REVISAR | Contradice el registro (N-54) |

Nada más con evidencia. Los 21 módulos de `runtime/acceptance` tienen función y tests.

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

* **Nuevos:** N-49, N-50 con N-53, N-51, N-52, N-54 y N-55 (correcciones en §H).
* **Heredados:** los 19 MINOR, según `AUDIT-PLATFORM-cad1053.md` §K/§O y `AUDIT-PLATFORM-6f47eb2.md` §O.

### MEJORAS OPCIONALES

S-1..S-47 (S-41 atendida). No restan puntos, no activan gates y no forman parte del camino a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| `acceptance-governance.yml` en ejecución real | `workflow_run` solo corre desde `main` | Ninguno adicional (dentro de N-51 / Q1.4) | Tras el merge a `main`, un PR que borre un caso: check `action_required` y `finalize` tras la aprobación humana |
| Tier `container`; piloto GI | Sin runtime de contenedores en el host | Dentro de N-51 | Host con Docker/Podman |
| Tests de `release`, `cli`, `gates`, `docs`, `audit` en CI | Saltados por N-49 | Dentro de Q5.3 | Re-ejecución de CI tras cerrar N-49 |
| `review-ledger.test.mjs` local | Excluido por instrucción (≈1 h) | Ninguno: CI 285/285 ×2 SO | — |
| Independencia de este auditor | Misma identidad que el Builder | Confianza MEDIA | U0/G5 |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: FAIL (N-49: la suite principal de CI falla en el SHA en Linux y Windows; reproducido localmente)
```

G3 limita la nota final a 89. El bruto (85.75) ya es inferior, así que el final es 85.75. Para retirar el gate hay que cerrar N-49.

Lo que sí pasa: build reproducible (V-18), validadores (V-11), tests de las áreas tocadas (V-12, V-13) y `pretag`/build v4.1.0 fail-closed (V-25, V-26).

**Release-gate contra este informe (V-30).** `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate fdb8a3e619562afcab299e0fa6f9f695983b11fc --reports <scratchpad>/audit410/reports --root <clon>` sale con exit 1:

```text
FAIL (1 error)
ERROR score 85.75 is below the release threshold 90 (tolerance 2)
```

No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 85.75

N-52 (Q1.2)                          → +0.75
N-31, N-43 (Q1.3)                    → +0.75
N-51 (Q1.4)                          → +1.50
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-49 (Q5.3, PARCIAL → MENOR; retira G3) → +1.00
N-29, N-27 (Q5.3, MENOR → COMPLETO)  → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26, N-44 (Q6.3)                    → +0.75
N-55 (Q6.5)                          → +0.50
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27 (Q7.3)             → +0.50
N-50, N-53 (Q7.4)                    → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50
N-54 (Q8.4)                          → +0.50

Suma: 0.75×9 + 1.50 + 1.00×2 + 0.50×8 = 6.75 + 1.50 + 2.00 + 4.00 = 14.25
85.75 + 14.25 = 100.00
```

## O. PLAN DE REMEDIACIÓN

1. **MAJOR — N-49** (`core/commands/sdd-tasks.md`, `sdd-implement-all.md` y, si procede, el fixture de `consumer-launcher.test.mjs`). Quitar las rutas privadas de la proyección y alinear el paso 0 con F-17 sin debilitarlo.
   * Riesgo: bajo.
   * Puntos: +1.00 y retirada de G3.
   * Verificación: CI `validators` success ×2 SO con el paso 36 ejecutado.
2. **MAJOR — N-50** (`runtime/acceptance/contract.mjs`, `runner.mjs`, tests). Lista de permitidos de flags; en host, solo `node` o una ruta del repositorio; docstring correcto.
   * Riesgo: medio (contratos existentes de consumidores con `python3`/`pytest` en host).
   * Puntos: +0.50 con N-53.
   * Verificación: `probe-argv.mjs`.
3. **MAJOR — N-51.** Job RF-31, job L3 consumidor, `AC-n` de 001, contrato y aceptación de la propia plataforma, piloto T5; configuración RF-25 por el humano.
   * Riesgo: medio.
   * Puntos: +1.50.
   * Verificación: §H N-51.
4. **MINOR — N-52** (`downgrade.mjs`, `verdict.mjs`, `hitl.mjs`): +0.75. **N-53** (`cli.mjs`, `feature.mjs`): incluido con N-50. **N-54** (`V4.1.0-E2E-EVIDENCE.md`): +0.50. **N-55** (`fixture.mjs` → `*.fixture.mjs` o `EXCLUDE_PATTERNS`): +0.50.
5. **MINOR heredados:** como en `AUDIT-PLATFORM-cad1053.md` §O.

**Recuperación mínima para el umbral 90:**

* N-49 + N-50 + N-52 + N-54 + N-55 dan +3.25, hasta 89.00: entra en la tolerancia (≥88), pero no alcanza 90.
* Con N-51 (+1.50) se llega a 90.50.

Cualquier corrección fuera de `.audit/**` deja STALE este informe y requiere una nueva auditoría del nuevo SHA.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 3 MAJOR y 23 MINOR puntuables, G3 está activo y la confianza es MEDIA. Para el uso que pide el perfil, un **gate de release con umbral 90 y tolerancia 2**, la candidata v4.1.0 en `fdb8a3e` **no alcanza el umbral (85.75)**.

El motor de Native Acceptance es sólido y está bien probado en local, y sus límites están declarados con honestidad. Pero la candidata rompe la suite principal de CI en los dos sistemas operativos. Su runner no cumple RF-8. Y una parte del alcance obligatorio, la fuente de cierre no falsificable entre ella, sigue pendiente.

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 85.75 + 14.25 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay)
[x] Los Quality Gates derivan de hallazgos reales (G3 ← N-49, V-19, V-20)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 2.25 + 2.25 + 1.50 | 9.00 |
| Q2 | 3 + 3 + 3 + 3 | 12.00 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 2.00 + 3 + 2.25 | 12.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 1.50 + 1.50 | 13.50 |
| Q7 | 2.25 + 1.50 + 1.50 + 1.50 + 2.25 | 9.00 |
| Q8 | 2 + 1.50 + 1.50 + 1.50 | 6.50 |
| **Total** | | **85.75** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `cad1053` (90.50): −4.75.** Es inferior al umbral de revisión de 5 puntos. Se explica entera por el delta:

| Subcriterio | Cambio | Puntos | Hallazgo |
|---|---|---:|---|
| Q1.4 | COMPLETO → PARCIAL | −1.50 | N-51 |
| Q5.3 | MENOR → PARCIAL | −1.00 | N-49 |
| Q1.2 | COMPLETO → MENOR | −0.75 | N-52 |
| Q6.5 | COMPLETO → MENOR | −0.50 | N-55 |
| Q7.4 | COMPLETO → MENOR | −0.50 | N-50, N-53 |
| Q8.4 | COMPLETO → MENOR | −0.50 | N-54 |

Ningún subcriterio sube.

### Riesgos residuales

* **R-1 (ALTO).** Mientras ROOT-003 y RF-31 sigan abiertos, la aceptación local y la aprobación de Environments pueden producirlas procesos con la identidad del propietario (N-40, N-51).
* **R-2.** `develop` no está protegida (N-25): #190 podría fusionarse con la CI en rojo.
* **R-3.** El worktree tiene cambios sin commit de otro proceso. Lo que se fusione no será `fdb8a3e`, y este informe quedará STALE.
* **R-4.** Con N-50 abierto, un contrato aprobado puede ejecutar código inline o binarios del PATH.
* **R-5.** Los tests de `release`, `cli` y `gates` no han corrido en CI para esta funcionalidad (N-49).

```text
AUDITED_SHA: fdb8a3e619562afcab299e0fa6f9f695983b11fc
SCORE: 85.75/100 (bruto = final; sin N/A; G3 activo, cap 89 no limitante)   PREVIOUS: 90.50 (cad1053)
BLOCKER: 0  CRITICAL: 0  MAJOR: 3 (N-49, N-50, N-51)  MINOR: 23 (19 heredados; nuevos N-52..N-55)
DELTA: 12 commits, 79 archivos, +5668/-26 (Native Acceptance, specs 001-003)
LOCAL: 12 validadores + audit check exit 0; acceptance 71/71; policy 69/69; implement-all+independent-review 48/48;
       bootstrap 49/49; consumer-launcher 8/10 (FAIL)
CI fdb8a3e: CI failure (validators ubuntu y windows: adapters 90/92); circuit 285/285 ×2; CodeQL check FAILURE (3 alertas)
BUILD: reproducible (6/6, 265 archivos); v4.1.0 rechazado por CLI_VERSION; pretag NOT READY (fail-closed)
UMBRAL PLATFORM 90 (tolerancia 2): NO ALCANZA (85.75)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
WORKTREE: limpio al inicio; modificado por otro proceso durante la auditoría (14 archivos M; no auditados)
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
