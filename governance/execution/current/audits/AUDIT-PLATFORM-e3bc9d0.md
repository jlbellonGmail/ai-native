---
targetRepo: jlbellonGmail/ai-native
targetCommit: e3bc9d0e02d83bdd5702a8f17285a055ed6ee195
platform:
  version: "v4.1.0 candidate"
  commit: e3bc9d0e02d83bdd5702a8f17285a055ed6ee195
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-25T12:45:00Z"
scope: "Independent read-only PLATFORM 1.2 re-audit of the v4.1.0 Native Acceptance candidate e3bc9d0 (branch feature/native-acceptance-v4.1.0, draft PR #190 to develop) over the delta fdb8a3e..e3bc9d0 (2 commits, 39 files, +585/-108), with findings N-49..N-55 of the previous audit (AUDIT-PLATFORM-fdb8a3e.md, 85.75, not committed) re-verified live by probe, build, local tests and the CI and code scanning of the exact SHA; inherited findings from AUDIT-PLATFORM-cad1053.md re-verified live or by an empty diff over their area. Evidence from a frozen clone of e3bc9d0 outside the repository. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the change; it runs under the same Windows and GitHub identity as the builder (V4.1.0-LOCAL-DEVELOPMENT-EXCEPTION, U0 PENDING, N-40, ROOT-003). runtime/circuit/review-ledger.test.mjs not run locally (CI). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 88.00
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.1.0 Native Acceptance, re-auditoría de e3bc9d0)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               D:\proyectos\ai-native-v410 (worktree; solo lectura) + clon congelado de e3bc9d0 en
                    <scratchpad>/audit410/clone (fuera del repositorio)
Branch:             feature/native-acceptance-v4.1.0 (= origin, e3bc9d0); PR #190 → develop: OPEN, DRAFT,
                    headRefOid e3bc9d0, mergeStateStatus UNSTABLE mientras corría la CI
Commit:             e3bc9d0e02d83bdd5702a8f17285a055ed6ee195 (git rev-parse; HEAD del worktree = origin)
Delta auditado:     fdb8a3e..e3bc9d0: 66a3e0c (fix de hallazgos de revisión y auditoría; RF-31) y e3bc9d0 (lectura de un solo
                    descriptor en verdict.mjs, fixture del Coordinator, E2E regenerado sobre 66a3e0c); 39 archivos, +585/−108
Base:               origin/develop = 15548c1 (merge-base)
Baseline:           AUDIT-PLATFORM-fdb8a3e.md (85.75, este auditor, no commiteado); en el árbol, AUDIT-PLATFORM-cad1053.md (90.50)
Tag:                ninguno; v4.1.0 libre
Fecha:              2026-11-25 (UTC ~12:10-12:45)
Worktree:           limpio al empezar (git status vacío); el clon congelado sigue limpio al terminar
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente de contexto aislado, lanzado desde la sesión del Builder, solo
                    lectura. No escribió el cambio. MISMA identidad de Windows y de GitHub que el Builder (excepción de
                    desarrollo local, U0 PENDING; N-40, ROOT-003). No aprobó ningún Environment ni deployment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, core.autocrlf=true, gh (solo lectura); sin runtime de contenedores
Temporales:         <scratchpad>/audit410: logs2/, clone/ (e3bc9d0), c1/, c2/, x2/, probe-argv2.mjs, probe-cutoff.mjs
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 88.00/100
Score final: 88.00/100
Quality Gate aplicado: G3 (verificación esencial rota → máximo 89); no limita porque el bruto es inferior
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 80-89 «Buen nivel, aún no de referencia»)
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88):** **no alcanza 90 (−2.00)**. Queda en el borde exacto de la tolerancia (88.00); `release-gate`: ver V-30. 0 BLOCKER, 0 CRITICAL, **2 MAJOR** (N-51, **N-56 nuevo**), 19 MINOR heredados. Sin N/A.

**N-56 (MAJOR, nuevo, activa G3). La suite principal de CI vuelve a fallar en el SHA, ahora por otra causa.** En `validators (windows-latest)`, `runtime/gates/secret-exposure.test.mjs:61` falla: el invariante «exactly the two gate workflows hold the App credentials» (`:69`) encuentra un tercer workflow, `acceptance-governance.yml`, que usa `TRUST_APP_ID` y `TRUST_APP_PRIVATE_KEY` (`acceptance-governance.yml:107-110` y en `finalize`). Lo reproduje en el clon congelado: 18/19, exit 1. El defecto venía de `dedcfeb` y ya estaba en `fdb8a3e`, pero su CI se cortó antes, en el paso 33 (N-49). Ni el test ni su implementación cambian desde la base. Al cierre de esta auditoría (12:31 UTC), `validators (ubuntu-latest)` seguía en el paso 36. El test es determinista (lista de archivos), así que lo esperable es el mismo fallo en el paso 46, pero no lo observé.

**De los 7 hallazgos de `fdb8a3e`, se cierran 6, verificados en vivo y no por los mensajes de commit:**

* **N-49 CERRADO.** `sdd-tasks.md:16` ya no nombra rutas privadas. F-17 acepta el BLOCKED estructurado de `sdd acceptance` sin debilitarse: exige exit 1, `ACCEPTANCE: BLOCKED\nCLASSIFICATION: MISSING` y que no haya traza (`consumer-launcher.test.mjs:133-140`). Local: 10/10. En la CI del SHA: ver V-20.
* **N-50 CERRADO.** Sonda V-22, 20 grafías: se rechazan todos los flags de inline, preload, loader, permisos, inspector, env-file y reporter por ruta, y los módulos `data:`. Solo pasan `--test`, `--test-reporter=tap` y `--test-name-pattern`. En host, `python3`, `pytest` y `docker` se rechazan antes de resolver y `bash` es shell. Los nombres sin ruta solo valen dentro de una imagen fijada por digest (`contract.mjs`). `python3 -c` rechazado y `-m pytest` admitido.
* **N-52 CERRADO.** Crear el cutoff da `CUTOFF_CREATED` y `LEGACY_CUTOFF_ADDITION` para cada slug ausente en BASE (V-23), tanto en `verdict.mjs` como en `hitl.mjs`.
* **N-53 CERRADO.** Code scanning de `refs/pull/190/merge`: las alertas #53, #54, #55 y #56 están en estado `fixed`. Último análisis JS (`5279a8f`, el merge de `e3bc9d0`): 0 resultados (V-28).
* **N-54 CERRADO.** La evidencia E2E nombra el commit de la plataforma (`66a3e0c…`) y dice que el árbol estaba limpio. Part A está marcada como ejecutada sobre `fdb8a3e`. La nota contradictoria se eliminó y B.5 está acotado. Entre `66a3e0c` y `e3bc9d0` solo cambia `verdict.mjs` (lectura de un solo descriptor) y un test, nada que el E2E ejerza de otra forma.
* **N-55 CERRADO.** `fixture.mjs` → `acceptance.fixture.mjs` (excluido por `EXCLUDE_PATTERNS`). Las fixtures de la matriz pasan a `evaluation/fixtures/`, que ningún módulo de runtime lee. Dos builds: 6/6 assets idénticos, 258 archivos, sin fixtures de test (V-18, V-21).

**Sigue abierto: N-51 (MAJOR), el alcance obligatorio de v4.1.0 incompleto.**

* El job de cierre de RF-31 ya existe (`ci.yml` `acceptance-closure`, más `verdict.mjs` `deriveClosure`). Corrió en la CI del SHA y subió su artefacto (V-20).
* Pero solo es efectivo cuando el camino confiable de RF-25 esté configurado, y eso es configuración humana pendiente.
* Siguen pendientes: el job L3 del consumidor (002 T7), el piloto GI (003 T5) y los `AC-n` de la spec 001 (`sdd validate --level full` → exit 1, V-14). La aceptación propia de 001, 002 y 003 da BLOCKED (el `acceptance-closure` de CI lo confirma).
* La documentación revela además que 003 RF-2 (selección de impacto) no está conectado a ninguna ejecución y que 002 RF-17/RF-18 no declaran digests de configuración (`native-acceptance.md`, «Limits»).

Todo está declarado con honestidad, pero sigue incompleto.

**Sensibilidad.** Respecto de `fdb8a3e` (85.75), +2.25: Q1.2 +0.75 y Q6.5, Q7.4 y Q8.4 +0.50 cada uno. Q5.3 no se mueve de PARCIAL: N-49 está cerrado, pero N-56 mantiene la suite en rojo. Respecto de `cad1053` (90.50), −2.50: Q1.4 −1.50 (N-51) y Q5.3 −1.00 (N-56). Cerrar N-56 lleva a 89.00 y retira G3; cerrar además N-51 lleva a 90.50.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Leídos enteros: el diffstat y el log de `fdb8a3e..e3bc9d0` y los diffs de `contract.mjs`, `runner.mjs`, `downgrade.mjs`, `verdict.mjs`, `hitl.mjs`, `ci-closure.mjs`, `ci.yml`, `acceptance-governance.yml`, `sdd-tasks.md`, `consumer-launcher.test.mjs`, `spec-acceptance.mjs`, `upgrade*.mjs`, `review-ledger.mjs`, `AGENTS.md`, `upgrade-matrix.json`, `native-acceptance.md` y `V4.1.0-E2E-EVIDENCE.md`.
* `V4.1.0-INDEPENDENT-REVIEW.md` completo.
* La lista de tests de `verdict.test.mjs`.

**Ejecutado** (§G): 12 validadores y `audit check`; `sdd validate --level full` ×3; 2 sondas; 2 builds y extracción; tests locales de `consumer-launcher`, `runtime/acceptance`, `implement-all` + `independent-review` y `runtime/policy`; `release-gate`; lectura remota de la CI, code scanning y plano de control.

**Reutilizado de `fdb8a3e` por diff vacío** (`git diff --stat fdb8a3e e3bc9d0` no toca esas áreas):

* tests de `runtime/release` 40/40 (`bundle.mjs` sin diff);
* `runtime/cli` sin cambio de código (solo su test);
* higiene, EOL y `pretag`.

**No ejecutado:** `review-ledger.test.mjs` (por instrucción; lo cubre la CI).

**No verificable:** `acceptance-governance.yml` en ejecución real (corre por `workflow_run` desde la rama por defecto, y aún no está en `main`); el tier `container` y el piloto GI (sin contenedores); Codex y OpenCode; F-007.

**Accesos remotos (solo lectura):** `gh pr view 190`; `gh run list --commit`; `gh run view`; `gh api` de jobs y logs, code-scanning (alertas y análisis de `refs/pull/190/merge`), rulesets, `rules/branches/develop`, `branches/develop/protection`, dependabot y secret-scanning.

## D. CONTRATO DETECTADO

Igual que en `AUDIT-PLATFORM-fdb8a3e.md` §D, con estos cambios de estado:

| ID | Capacidad/Requisito | Estado en e3bc9d0 |
|---|---|---|
| C-02 | Runner gobernado, RF-8 | VERIFICADO (V-22): lista de permitidos e identidades fijas en host |
| C-04 | Cierre desde la CI del commit evaluado (002 RF-31) | IMPLEMENTADO y ejecutado (job `acceptance-closure` success, artefacto subido). Efectivo solo con el camino confiable configurado (PENDIENTE humano) |
| C-05 | Detector de DOWNGRADE y creación del cutoff | VERIFICADO (V-23). Además: `PLAN_REMOVED`, `AC_REMOVED` sobre spec borrada, `PLAN_INVALID`, `GOVERNANCE_DATA_INVALID` |
| C-07 | Proyección de la aceptación en el consumidor | VERIFICADO (F-17 10/10 local; CI V-20) |
| C-11 | E2E en consumidor desechable | DOCUMENTADO y ligado a `66a3e0c` |
| C-13 | Bundle sin código de solo-tests | VERIFICADO (V-21) |
| C-16 | Selección de impacto conectada a la ejecución (003 RF-2) | IMPLEMENTADO como función, NO conectado (declarado; N-51) |
| C-17 | Job L3 del consumidor (002 T7) | NO IMPLEMENTADO (declarado; N-51) |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 9.75 | PARCIAL/MENOR (N-51, N-31, N-43) |
| Q2 Reutilización | 12 | 12.00 | COMPLETO |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 12.50 | PARCIAL/MENOR (N-56, N-29, N-27, N-24, F-003, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.00 | MENOR (N-40, F-005) |
| **TOTAL** | **100** | **88.00** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `native-acceptance.md` | — | Límites ampliados y exactos |
| Q1.2 | Capacidades presentes | 3 | **COMPLETO** | **3.00** | V-22, V-23, V-12 | — | N-52 cerrado; RF-8 cerrado |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | — | N-31, N-43 | Heredados. El docstring de `runner.mjs` coincide ahora con el comportamiento efectivo (S-48) |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | PARCIAL | 1.50 | V-14, V-20, `native-acceptance.md` «Limits» | **N-51** | RF-31 implementado, pero siguen incompletos 002 T7 (L3), la configuración de RF-25, 003 T5, 003 RF-2 (sin conectar), RF-17/18 (digests de configuración), los `AC-n` de 001 y la aceptación propia de 001-003. No son defectos menores: no sube a MENOR |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-18 | — | |
| Q2.2 | Sin residuos | 3 | COMPLETO | 3.00 | diff | — | Sin rutas de host ni secretos en el delta |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | — | — | |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | — | — | |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | `ci-closure.mjs` | — | |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `ci-closure.mjs:1-4` | — | Productor sin decisión; decide el analizador confiable |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | — | — | |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | — | N-11 | Heredado |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `sdd-tasks.md:16` | — | Sin rutas privadas |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | `AGENTS.md` | — | Lista de control plane alineada con `gates.json` |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | — | — | |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-05..V-11 | — | 12 validadores y `audit check` exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | — | N-24, F-003 | Heredados |
| Q5.3 | Pruebas pasando | 4 | **PARCIAL** | **2.00** | V-19, V-20, V-31 | **N-56**, N-29, N-27 | N-49 cerrado (paso 33 success ×2 SO; local 10/10). Pero la suite principal falla en el SHA (`secret-exposure.test.mjs:61`, windows; reproducido localmente) |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | `contract.test.mjs`, `downgrade.test.mjs`, `verdict.test.mjs:51` | — | Una regresión por cada bypass cerrado |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | — | F-004 | Heredado |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-04 | — | 2 commits semánticos que nombran sus hallazgos |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-27 | F-005, N-25 | |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-20 | N-26, N-44 | Heredados; `acceptance-governance` NO VERIFICADO |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | — | — | Igual que en `fdb8a3e` (V-25, V-26 sin diff en `runtime/release`) |
| Q6.5 | Build reproducible | 2 | **COMPLETO** | **2.00** | V-18, V-21 | — | N-55 cerrado |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `upgrade.mjs` | F-006 | Mejora de rollback (directorio vacío) y de los parches dentro de v4.1; F-006 heredado |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-27 | F-007 | Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-27 | N-32 | 18 alertas (1 high), fuera del bundle |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-27, V-28 | F-008, CodeQL #27 | `acceptance-governance` con mínimo privilegio y aprobador comprobado contra `humanMergers` |
| Q7.4 | Defaults seguros | 2 | **COMPLETO** | **2.00** | V-22, V-28 | — | N-50 y N-53 cerrados; `loopback` rechazado (nunca red del host) |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | — | F-009, F-010 | Heredados |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | `execution/current/V4.1.0-*` | — | S-45 sigue |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | excepción v4.1.0 | N-40 | |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-27 | F-005 (CAUSA RAÍZ COMPARTIDA) | Código nuevo fail-closed (BLOCKED sin artefacto de cierre) |
| Q8.4 | Trazabilidad | 2 | **COMPLETO** | **2.00** | `V4.1.0-E2E-EVIDENCE.md:3`, `V4.1.0-INDEPENDENT-REVIEW.md` | — | N-54 cerrado. Cadena hallazgo → corrección → test → registro |

## G. LEDGER DE VERIFICACIÓN

(A) complementaria del auditor; (R) remota. Logs en `<scratchpad>/audit410/logs2/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA | `git rev-parse origin/feature/native-acceptance-v4.1.0 HEAD`; clon `checkout` | `e3bc9d0e02d83bdd5702a8f17285a055ed6ee195` ×2 | PASS |
| V-02 | Worktree | `git status --porcelain` (worktree y clon) | vacío al empezar; clon 0 al terminar | PASS |
| V-03 | PR (R) | `gh pr view 190` | OPEN, DRAFT, head e3bc9d0, UNSTABLE durante la CI | PASS |
| V-04 | Alcance (A) | `git log`/`diff --stat fdb8a3e e3bc9d0`; `diff --stat 66a3e0c e3bc9d0` | 2 commits, 39 archivos, +585/−108; `66a3e0c..e3bc9d0`: `verdict.mjs`, `implement-all.test.mjs`, E2E | PASS |
| V-05..V-11 | Validadores | `validate-contracts` (26 schemas, 8 datos), `validate-core`, `audit check`, `validate-ci-tests-listed` (115), `validate-actions-pinned`, `validate-parity` (95/95), `doc-drift`, `validate-integrity`, `validate-entrypoints`, `audit-safe-script-mode`, `compat-matrix`, `m52/validate-evidence` | exit 0 ×12 | PASS |
| V-12 | Tests acceptance (clon) | `node --test --test-concurrency=1 runtime/acceptance/*.test.mjs` | **77/77**, exit 0 (12 min) | PASS |
| V-13 | Tests afectados (clon) | `implement-all` + `independent-review`; `runtime/policy/*` | 48/48; 69/69 | PASS |
| V-14 | `sdd validate --level full` | `node runtime/main.mjs sdd validate <s> --level full` | 001 **exit 1** (MISSING); 002 y 003 exit 0 | 001 FAIL (N-51) |
| V-18 | Build reproducible (A) | `build.mjs --version v4.0.2 --commit e3bc9d0… --out c1`/`c2` | exit 0 ×2; 6/6 assets idénticos (`cmp`) | PASS |
| V-19 | F-17 local (clon) | `node --test runtime/adapters/consumer-launcher.test.mjs` | **10/10**, exit 0 | PASS (N-49) |
| V-20 | CI remota (R) | `gh run list --commit e3bc9d0…`; `gh api actions/jobs/{139195401646,139195401226,139195401644}` | CI run 45611319284 (`pull_request`), observado a las 12:31 UTC: **`validators (windows-latest)` FAILURE**. Paso 33 `runtime/adapters` success (N-49 cerrado); 36 `runtime/acceptance` 71/71; **46 `runtime/gates` FAIL**: 214 tests, 213 pass, 1 fail, `secret-exposure.test.mjs:61`, actual `[acceptance-governance.yml, merge-gate.yml, trust-gate.yml]` frente a lo esperado `[merge-gate.yml, trust-gate.yml]`. `validators (ubuntu-latest)`: in_progress, pasos 1-35 success (33 incluido), paso 36 en curso tras ~20 min; no esperé más (límite de ~15 min). **`acceptance-closure` success**: «001 MISSING BLOCKED; 002/003 REQUIRED BLOCKED (local view)», artefacto de 372 bytes subido. CodeQL, SBOM, pr-gate, Supply chain, security-scan, Trivy y Dependency review: success. El run de `66a3e0c` terminó `cancelled` | **FAIL** (N-56); N-49 PASS |
| V-21 | Contenido del bundle (A) | extracción de `c1` | 258 archivos; 0 `*.test.mjs`; sin `acceptance.fixture.mjs` ni fixtures de la matriz; se incluye `ci-closure.mjs` | PASS (N-55) |
| V-22 | Sonda argv (A) | `probe-argv2.mjs` (20 argv de node, 8 ejecutables de host, 3 de contenedor, python) | Se rechazan `-e`, `--eval=0`, `-pe`, `--print=1`, `-p`, `--import data:`, `--import=`, `--require`, `-r`, `--loader`, `--experimental-loader=`, `--env-file=`, `--inspect`, `--allow-fs-read=*`, `data:…`, `--test-reporter=./x`, `--test-reporter-destination`. Se aceptan `--test`, `--test-reporter=tap` y `--test-name-pattern`. Host: `node` y `./tools/run.mjs` aceptados; `python3`, `pytest` y `docker` rechazados («not an allowed host identity»); `bash` es shell; `/usr/bin/python3` y `../x` escapan del repositorio. Contenedor: `python3` y `pytest` aceptados; `sh` es shell. `python3 -c` rechazado; `-m pytest` admitido | PASS (N-50) |
| V-23 | Sonda cutoff (A) | `probe-cutoff.mjs` | Crear el cutoff con un slug nuevo → `CUTOFF_CREATED` + `LEGACY_CUTOFF_ADDITION brand-new-feature`; añadir un slug → `LEGACY_CUTOFF_ADDITION`; borrarlo → [] | PASS (N-52) |
| V-27 | Plano de control (R) | rulesets, `develop`, environments, dependabot, secret-scanning | 1 ruleset (`ai-native-main`, sin cambios); `develop`: «Branch not protected», 0 reglas; Dependabot 18 (1 high, 16 medium, 1 low); secret scanning 0; code scanning abierto en la rama por defecto: [27] | PASS (con F-005, N-25, N-32, F-008) |
| V-28 | Code scanning PR (R) | `code-scanning/alerts?ref=refs/pull/190/merge`; `code-scanning/analyses?ref=…` | #53-#56 `fixed`; último análisis `5279a8f` JS 0 resultados, actions 0 | PASS (N-53) |
| V-29 | Release-gate antes del informe | `release-gate --profile PLATFORM --candidate e3bc9d0… --root <clon>` | FAIL: 1 real («no current valid PLATFORM audit report for e3bc9d0…») + STALE históricos | ESPERADO |
| V-30 | Release-gate contra este informe | `… --reports <scratchpad>/audit410/reports2 --root <clon>` | **PASS_WITH_WARNINGS**, exit 0: «score 88 is below 90 but within the 2-point tolerance». El front matter se acepta | ESPERADO (coherente con §B) |
| V-31 | N-56 local (clon) | `node --test --test-concurrency=1 runtime/gates/secret-exposure.test.mjs`; `git diff --quiet 15548c1 e3bc9d0 -- runtime/gates/secret-exposure*.mjs`; `git log --diff-filter=A -- .github/workflows/acceptance-governance.yml` | exit 1; 18/19; ✖ «this repository's own workflows conform…». Test e implementación sin cambios desde la base; el workflow entra en `dedcfeb` | **FAIL** (N-56) |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| **N-56** | ROTO | **MAJOR** | Suite principal de CI en rojo en el SHA: el invariante de credenciales de App (`secret-exposure.test.mjs:61-69`) rechaza el tercer workflow con secretos, `acceptance-governance.yml` | V-20, V-31; `acceptance-governance.yml:105-110`, `:144-151` | Q5.3 (+ gate G3) | −1.00 |
| **N-51** | FALTA | **MAJOR** | Alcance obligatorio de v4.1.0 incompleto (002 T7 L3; configuración de RF-25, de la que depende RF-31; 003 T5; 003 RF-2 sin conectar; RF-17/18 sin digests de configuración; 001 sin `AC-n`; aceptación propia de 001-003 BLOCKED) | V-14, V-20; `native-acceptance.md` «Limits of this candidate»; `specs/001-dependency-graph/spec.md:86-93`; `specs/002-native-acceptance/tasks.md:16`; `specs/003-acceptance-integration/tasks.md:31-32` | Q1.4 | −1.50 |
| N-31, N-43 | CONTRADICTORIO / INCORRECTO | MINOR | Heredados | — | Q1.3 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README | — | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Estrategia de pruebas | — | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host (la suite completa sigue sin correr localmente) | ROOT-002 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates | — | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-27 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin protección | V-27 | Q6.2 | −0.375 |
| N-26, N-44 | INCOMPLETO / RIESGO | MINOR | Pilot offline; `merge-gate` sin reintento | — | Q6.3 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback | — | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Secretos no verificables por API | V-27 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 18 alertas Dependabot | V-27 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 | V-27 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain | — | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | U0/G5 sin implantar (identidad única) | excepción v4.1.0 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 2 MAJOR, 19 MINOR.** Cerrados en este tramo (6): N-49, N-50, N-52, N-53, N-54 y N-55. Nuevo: N-56 (latente desde `dedcfeb`; enmascarado en `fdb8a3e` por N-49).

### N-56 — Suite principal de CI en rojo por el invariante de credenciales (MAJOR, nuevo)

**Descripción.** `runtime/gates/secret-exposure.test.mjs:61-69` comprueba dos cosas sobre los workflows del repositorio. Primero, que cada uno solo expone secretos detrás de eventos seguros, y eso `acceptance-governance.yml` lo cumple (`workflow_run`). Segundo, que exactamente `merge-gate.yml` y `trust-gate.yml` tienen las credenciales de la App de confianza. `acceptance-governance.yml` (`publish` y `finalize`) usa `secrets.TRUST_APP_ID` y `secrets.TRUST_APP_PRIVATE_KEY`, así que el invariante falla. Ni el test ni su implementación se tocaron (V-31). La ampliación de quién tiene la clave de la App no se registró en el control que existe para eso.

**Impacto.** El check requerido `validators (windows-latest)` está en rojo en el SHA, y lo esperable es lo mismo en ubuntu. Los pasos 47-55 no corrieron en windows. Este defecto estaba en `fdb8a3e` sin detectar, porque aquella CI se cortó en el paso 33 (R-5 de ese informe). La puntuación de `fdb8a3e` no cambia: Q5.3 ya estaba en PARCIAL.

**Causa raíz.** ROOT-009, recurrente: no se ejecutó la batería oficial de `ci.yml` antes del push. Las correcciones se validaron con tests dirigidos.

**Corrección mínima suficiente.** La decisión es humana, porque toca el control plane y la frontera de la clave de la App. Una opción es que la clave siga solo en los dos gates: `acceptance-governance` publicaría a través de ellos, o bien con otra App de permisos `checks: write`. La otra es ampliar el invariante a `acceptance-governance.yml`, con la justificación escrita (Environment `ai-native-trust` restringido a `main`, lectura solo del JSON del veredicto) y un test que fije que solo los jobs `publish` y `finalize` la usan. En cualquiera de los dos casos, re-ejecutar `ci.yml` completo.

**Verificación de cierre.** `node --test runtime/gates/*.test.mjs` exit 0 y run de CI del nuevo SHA con `validators` success ×2 SO.

**Puntos recuperables.** +1.00 (Q5.3 PARCIAL → MENOR) y retirada de G3.

### N-51 — Alcance obligatorio de v4.1.0 incompleto (MAJOR, sigue abierto)

**Progreso verificado.** RF-31 tiene ahora productor y analizador:

* El productor es `ci.yml` `acceptance-closure` + `ci-closure.mjs`: checkout limpio del SHA de la PR, sin credenciales, y salida cruda como artefacto con `if-no-files-found: error`.
* El analizador es `verdict.mjs` `deriveClosure`. Vuelve a parsear los bytes crudos contra el plan y el contrato leídos como objetos Git. Exige que el run productor sea `.github/workflows/ci.yml`, de tipo `pull_request` y del mismo head SHA, leído de la API. Lee con un solo descriptor y límite de tamaño. Sin artefacto da BLOCKED.
* Lo cubre `verdict.test.mjs:51` (FAIL, manipulación y run ajeno nunca pasan).
* El job corrió en la CI del SHA y subió el artefacto (V-20).
* `finalize` comprueba que el aprobador esté en `governance.humanMergers` de la revisión confiable.

**Sigue incompleto** (declarado en `native-acceptance.md` «Limits» y en `V4.1.0-INDEPENDENT-REVIEW.md`):

* Job L3 del consumidor (002 T7): no implementado.
* Camino confiable de RF-25: sin configurar (es configuración humana). Hasta entonces RF-31 no es efectivo y el único registro local sigue siendo un ledger sin clave.
* 003 T5 (piloto GI): no ejecutado.
* 003 RF-2: `analyzeImpact` existe pero no está conectado a ninguna ejecución.
* 002 RF-17/RF-18: no hay digests de configuración declarados.
* Spec 001: sin `AC-n` (V-14).
* Aceptación propia de 001-003: BLOCKED, sin plan ni contrato propios (el job de CI lo confirma: «001 MISSING BLOCKED; 002/003 REQUIRED BLOCKED»).

Son varios SHALL de un alcance aprobado (excepción v4.1.0:13). No son defectos menores, así que Q1.4 se mantiene en PARCIAL.

**Corrección mínima suficiente.**

* Implementar el job L3.
* Conectar RF-2.
* Declarar los digests de configuración de RF-17/18.
* Añadir `AC-n` a 001, o `acceptance: not-applicable` justificado y aprobado.
* Darle a la plataforma un contrato y planes, y llevar 001-003 a PASS (o exención aprobada).
* Ejecutar 003 T5 en un host con contenedores.
* Que el humano configure RF-25 (ruleset de `develop`, check requerido y Environments).
* Alternativa válida: un registro de versión aprobado por el humano que saque formalmente del alcance de v4.1.0 lo que se difiera. Es decisión humana; el auditor no la presume.

**Verificación de cierre:** `sdd validate <s> --level full` exit 0 ×3; `sdd acceptance status` PASS o NOT_APPLICABLE aprobado ×3; run del job L3; evidencia T5; check `ai-native/acceptance-governance` requerido y publicado sobre un SHA.

**Puntos recuperables:** +1.50.

### Riesgo residual del diseño RF-31 (no puntuado)

El artefacto de cierre lo produce código de la candidata: en un `pull_request`, `ci.yml` y `ci-closure.mjs` son los de la rama. Un PR que modifique cualquiera de los dos podría subir salida cruda fabricada con su digest coherente. La defensa es que `.github/**` y `runtime/acceptance/**` son control plane (`gates.json`, `AGENTS.md`) y fuerzan la revisión humana. Mientras exista N-40, esa revisión no separa al agente del humano. Es coherente con la spec («the separate CI job»), así que no lo descuento. Se registra como R-2.

### Heredados

Sus descripciones están en `AUDIT-PLATFORM-cad1053.md` §H. Verificados en vivo (V-27): F-005, N-25, N-32 (18), F-008, CodeQL #27, F-007 y N-40. Los demás por diff vacío sobre su área.

### H.1 Sugerencias (no restan puntos)

* S-1..S-47 heredadas (S-47 atendida: `if-no-files-found: error` en el productor; el `|| true` del analizador sigue cubierto porque `publish` falla sin veredicto).
* **S-45** sigue: `SESSION-CONTEXT.md` no registra la candidata.
* **S-48 (nueva).** `resolveExecutable` (`runner.mjs`) conserva el bucle por `process.env.PATH` para nombres sin ruta. En `runRunner` es inalcanzable: `checkExecutable` rechaza antes los nombres de host, y el tier contenedor no resuelve en host. Eliminarlo haría que el docstring fuera cierto también para quien llame directamente a la función.
* **S-49 (nueva).** `validationOf` con aceptación pendiente deja `VALIDATION: PASS` a partir de un `--command "node -e 0"` (E2E B.5). Es correcto según la spec (la aceptación sigue BLOCKED y no hay aprobación), pero conviene que el informe diga que esa validación no incluye aceptación.
* **S-50 (nueva).** El cambio de `fdb8a3e` a `e3bc9d0` no pasó por una segunda revisión aislada (`V4.1.0-INDEPENDENT-REVIEW.md:33`). Esta re-auditoría no la sustituye.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2, Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite completa | N-29, N-27 | Q5.3 |
| ROOT-003 | Agentes y auditor con la identidad del propietario | N-40; condiciona RF-25/RF-31 (N-51, R-2) | Q8.2 |
| ROOT-006 | API de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-009 | Batería de CI no ejecutada antes del push (recurrente) | N-49 (cerrado), N-56 | Q5.3, G3 |
| ROOT-010 | Seguridad del runner por lista de denegación y PATH | N-50 (cerrado) | — |
| ROOT-011 | Alcance dependiente de configuración humana e infraestructura ausente, más trabajo pendiente | N-51 | Q1.4 |

## J. QUÉ SOBRA

| Elemento | Acción | Motivo |
|---|---|---|
| Bucle por `PATH` de `resolveExecutable` | SIMPLIFICAR (S-48) | Inalcanzable desde `runRunner` |

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

N-56 y N-51 (§H) y los 19 MINOR heredados (`AUDIT-PLATFORM-cad1053.md` §K/§O).

### MEJORAS OPCIONALES

S-1..S-50. No restan puntos ni bloquean.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto | Cómo verificarlo |
|---|---|---|---|
| `acceptance-governance.yml` (`analyze`/`publish`/`human`/`finalize`, incluida la descarga del artefacto de cierre) | `workflow_run` solo corre desde `main` | Dentro de N-51 | Tras el merge a `main`: PR con un caso borrado → `action_required`; tras la aprobación → `finalize` |
| Tier `container`; piloto GI | Sin contenedores en el host | Dentro de N-51 | Host con Docker/Podman |
| `review-ledger.test.mjs` local | Excluido por instrucción | Ninguno (CI) | — |
| Independencia del auditor | Identidad compartida | Confianza MEDIA | U0/G5 |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0)
G2 CRITICAL: PASS (0)
G3 VERIFICACIÓN ESENCIAL: FAIL (N-56: la suite principal de CI falla en el SHA en windows, y está reproducido localmente)
```

G3 limita la nota a 89. El bruto (88.00) ya es inferior, así que el final es 88.00. Para retirar el gate hay que cerrar N-56. Lo que sí pasa: build reproducible (V-18), validadores (V-05..V-11), tests de las áreas tocadas (V-12, V-13, V-19) y code scanning (V-28).

**Release-gate contra este informe (V-30):** `PASS_WITH_WARNINGS` (exit 0; «score 88 is below 90 but within the 2-point tolerance»). Con G3 activo y la suite roja, el humano no debería usar ese PASS de tolerancia para etiquetar sin cerrar antes N-56. No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 88.00

N-56 (Q5.3, PARCIAL → MENOR; retira G3) → +1.00

N-31, N-43 (Q1.3)                    → +0.75
N-51 (Q1.4)                          → +1.50
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 (Q5.3)                    → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26, N-44 (Q6.3)                    → +0.75
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27 (Q7.3)             → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 0.75×8 + 1.50 + 1.00×2 + 0.50×5 = 6.00 + 1.50 + 2.00 + 2.50 = 12.00
88.00 + 12.00 = 100.00
```

## O. PLAN DE REMEDIACIÓN

1. **MAJOR — N-56** (+1.00 y retirada de G3 → 89.00). `runtime/gates/secret-exposure.test.mjs:69` o `acceptance-governance.yml`, según la decisión humana de §H. Antes del push, ejecutar todos los pasos de `ci.yml`.
2. **MAJOR — N-51** (+1.50 → 90.50).
   * Job L3 del consumidor (`.github/workflows/l3-consumer.yml` o equivalente).
   * Conectar RF-2 (`analyzeImpact`) a la ejecución de la aceptación.
   * Digests de configuración de RF-17/18.
   * `AC-n` o declaración `not-applicable` para `specs/001-dependency-graph/spec.md`.
   * Contrato y planes propios de la plataforma.
   * Piloto T5 en un host con contenedores.
   * Configuración humana de RF-25.
   * Alternativa: retirada formal del alcance de v4.1.0 aprobada por el humano.
   * Verificación: §H.
3. **MINOR heredados**, en el orden de `AUDIT-PLATFORM-cad1053.md` §O. Primero Q5.3 (N-29/N-27, +1.00) y Q6.3 (N-26/N-44, +0.75).

Cualquier commit fuera de `.audit/**` deja este informe STALE.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 2 MAJOR y 19 MINOR, G3 está activo y la confianza es MEDIA. Para el uso del perfil, un gate de release con umbral 90 y tolerancia 2, `e3bc9d0` **queda en 88.00**: no alcanza 90 y está en el borde exacto de la tolerancia.

Las correcciones de `fdb8a3e` son reales y están verificadas en vivo: 6 de 7 hallazgos cerrados, con una regresión cada uno. Quedan dos pérdidas nuevas respecto de v4.0.2. La primera es la suite de CI en rojo por el invariante de credenciales de la App (N-56): un defecto latente que la nueva CI hizo visible. La segunda es el alcance obligatorio todavía incompleto de v4.1.0 (N-51), declarado con honestidad, y en parte dependiente de configuración humana.

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 88.00 + 12.00 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay)
[x] Los Quality Gates derivan de hallazgos reales (G3 ← N-56, V-20, V-31)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 2.25 + 1.50 | 9.75 |
| Q2 | 3 + 3 + 3 + 3 | 12.00 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 2.00 + 3 + 2.25 | 12.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 1.50 | 14.00 |
| Q7 | 2.25 + 1.50 + 1.50 + 2 + 2.25 | 9.50 |
| Q8 | 2 + 1.50 + 1.50 + 2 | 7.00 |
| **Total** | | **88.00** |

**Divergencia con `fdb8a3e` (85.75): +2.25.**

| Subcriterio | Cambio | Puntos | Hallazgo cerrado |
|---|---|---:|---|
| Q1.2 | MENOR → COMPLETO | +0.75 | N-52 |
| Q6.5 | MENOR → COMPLETO | +0.50 | N-55 |
| Q7.4 | MENOR → COMPLETO | +0.50 | N-50, N-53 |
| Q8.4 | MENOR → COMPLETO | +0.50 | N-54 |

Q1.4 sigue en PARCIAL (N-51). Q5.3 sigue en PARCIAL: N-49 está cerrado, pero lo sustituye N-56.

**Divergencia con `cad1053` (90.50): −2.50**: Q1.4 (−1.50) y Q5.3 (−1.00).

### Riesgos residuales

* **R-1 (ALTO).** ROOT-003: mientras U0 siga pendiente, las aprobaciones de Environment y la aceptación local pueden producirlas procesos con la identidad del propietario.
* **R-2 (MEDIO).** El productor del cierre de RF-31 es código de la candidata. Su integridad depende de la revisión humana del control plane (ver §H).
* **R-3.** `develop` sin protección (N-25): #190 podría fusionarse con checks en rojo.
* **R-4.** `acceptance-governance.yml` no se ha ejercitado nunca. Su primera ejecución real será después del merge a `main`.

```text
AUDITED_SHA: e3bc9d0e02d83bdd5702a8f17285a055ed6ee195
SCORE: 88.00/100 (bruto = final; sin N/A; G3 activo, cap 89 no limitante)   PREVIOUS: 85.75 (fdb8a3e); 90.50 (cad1053)
BLOCKER: 0  CRITICAL: 0  MAJOR: 2 (N-51, N-56 nuevo)  MINOR: 19 (heredados)   CERRADOS: N-49, N-50, N-52, N-53, N-54, N-55
DELTA: fdb8a3e..e3bc9d0, 2 commits, 39 archivos, +585/-108
LOCAL: 12 validadores + audit check exit 0; consumer-launcher 10/10; acceptance 77/77; implement-all + independent-review 48/48; policy 69/69; secret-exposure 18/19 (FAIL, N-56)
CI e3bc9d0: validators windows FAILURE (gates 213/214: secret-exposure.test.mjs:61); ubuntu in_progress (pasos 1-35 success) a las 12:31 UTC; acceptance-closure success
CODEQL PR #190: 0 alertas abiertas (#53-#56 fixed)
BUILD: reproducible (6/6, 258 archivos, sin fixtures de test)
UMBRAL PLATFORM 90 (tolerancia 2): NO ALCANZA 90; EN EL BORDE DE LA TOLERANCIA (88.00 = 88)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
