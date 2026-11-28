---
targetRepo: jlbellonGmail/ai-native
targetCommit: 4417d96d66fa5b6b91f3afb49722b432c309b255
platform:
  version: "v4.1.0 candidate"
  commit: 4417d96d66fa5b6b91f3afb49722b432c309b255
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-25T19:40:00Z"
scope: "Independent read-only PLATFORM 1.2 re-audit of the v4.1.0 Native Acceptance candidate 4417d96 (branch feature/native-acceptance-v4.1.0, draft PR #190 to develop) over the delta e3bc9d0..4417d96 (6 commits, 18 files, +596/-39), with the findings of the previous audit (AUDIT-PLATFORM-e3bc9d0.md, 88.00, not committed) re-verified live: N-56 by local tests, mutation of the widened invariant and the CI of 59369df and of the exact SHA; N-51 by sdd validate/acceptance status, probes and the CI closure job; inherited MINORs live (control plane) or by an empty diff over their area. Evidence from a frozen clone of 4417d96 outside the repository. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the change; it runs under the same Windows and GitHub identity as the builder (V4.1.0-LOCAL-DEVELOPMENT-EXCEPTION, U0 PENDING, N-40, ROOT-003): isolated, not attested. runtime/circuit/review-ledger.test.mjs not run locally (CI). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 88.50
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.1.0 Native Acceptance, re-auditoría de 4417d96)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               D:\proyectos\ai-native-v410 (worktree; solo lectura) + clon congelado de 4417d96 en
                    <scratchpad>/audit410/k (fuera del repositorio; core.longpaths=true)
Branch:             feature/native-acceptance-v4.1.0 (= origin, 4417d96); PR #190 → develop: OPEN, DRAFT,
                    headRefOid 4417d96, mergeStateStatus UNSTABLE (develop sin protección; draft)
Commit:             4417d96d66fa5b6b91f3afb49722b432c309b255 (git rev-parse HEAD, 4417d96 y origin/…: idénticos)
Delta auditado:     e3bc9d0..4417d96: 83f0de6 (RF-2 en cierre y analizador; frontera de la App, N-56), ebe9850 (timeout por
                    test en CI), a70e6bd (groupKillTarget), 7d9e2b7 (segunda revisión aislada N1-N5, N7), 59369df (doc),
                    4417d96 (STATE, E2E, incidente de CI); 18 archivos, +596/−39
Base:               origin/develop = 15548c1 (merge-base)
Baseline:           AUDIT-PLATFORM-e3bc9d0.md (88.00, este auditor, no commiteado); en el árbol, AUDIT-PLATFORM-cad1053.md (90.50)
Tag:                ninguno; v4.1.0 libre
Fecha:              2026-11-25 (UTC ~18:50-19:40)
Worktree:           limpio al empezar (git status vacío); el clon congelado sigue limpio al terminar
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente de contexto aislado, lanzado desde la sesión del Builder, solo
                    lectura. No escribió el cambio. MISMA identidad de Windows y de GitHub que el Builder (excepción de
                    desarrollo local, U0 PENDING; N-40, ROOT-003): auditoría AISLADA, NO ATESTADA. No aprobó ningún
                    Environment ni deployment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, core.autocrlf=true, gh (solo lectura); sin runtime de contenedores
Temporales:         <scratchpad>/audit410: k/ (clon 4417d96), logs3/, probes/, mut/ (copia mutada para V-36), b1x/, b2x/, reports3/
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 88.50/100
Score final: 88.50/100
Quality Gate aplicado: ninguno (G1, G2 y G3 PASS)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 80-89 «Buen nivel, aún no de referencia»)
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88):** **no alcanza 90 (−1.50)**. Queda dentro de la tolerancia (88.50 ≥ 88). `release-gate`: ver V-40. 0 BLOCKER, 0 CRITICAL, **1 MAJOR** (N-51), **20 MINOR** (19 heredados y **N-57 nuevo**). Sin N/A.

**N-56 CERRADO, verificado en vivo y no por el mensaje del commit.** G3 se retira.

* El invariante de `secret-exposure.test.mjs:69-89` admite ahora tres titulares de la clave de la App. Además exige, en cada job que nombra un secreto, `environment: ai-native-trust` y un checkout fijado a la rama por defecto o al SHA base, con `persist-credentials: false`.
* Local: `runtime/gates` 214/214, exit 0 (V-35).
* Mutación sobre una copia (V-36): quitar el Environment de `finalize`, cambiar su `ref` al SHA de la PR, poner `persist-credentials: true` o usar la clave en el job `human`. Las 4 mutaciones hacen fallar el test con su mensaje propio.
* CI del SHA exacto (run 45679253224, V-31): `validators` ubuntu y windows **success**, 58/58 pasos cada uno. `runtime/gates` 214/214 (ubuntu 213 + 1 skip legítimo, G12 `cmdkey.exe.mui` solo en Windows); `runtime/acceptance` 87/87 ×2; `runtime/circuit` 285 (windows 283 + 2 skip).
* Run de `59369df` (45676272070, código idéntico): mismo resultado (V-30).

La ampliación de titulares de la clave es una decisión de control plane que el humano debe aprobar en la PR. Está registrada como tal en `V4.1.0-STATE.md` («Human actions required» 1) y en `SECRETS-BOUNDARY.md:34`. No la doy por aprobada, pero el control existe, es más estricto que antes y está en verde.

**N-51 (MAJOR) sigue abierto, con progreso real.**

* **003 RF-2 está ahora conectado.** `impactSelection` en `ci-closure.mjs` y la unión de grafos BASE + head en `verdict.mjs` `analyze`.
  * Mi sonda (V-38): un cambio declarado de proveedor selecciona la feature consumidora una vez. Sin artefacto da BLOCKED. Con el artefacto, la consumidora se juzga y no se omite. Si se quita su salida cruda, da BLOCKED.
  * Borrar el manifiesto o una arista nunca elimina la obligación de BASE (`impact-selection.test.mjs`).
* Siguen pendientes:
  * el job L3 del consumidor (002 T7): `l3-consumer.yml` no cambia desde la base y no menciona la aceptación;
  * la configuración humana de RF-25, de la que depende RF-31;
  * el piloto GI (003 T5): sin contenedores;
  * 002 RF-17/RF-18: `inputFingerprint` acepta `configDigests`, pero ningún llamador los declara;
  * 001 sin `AC-n` (`sdd validate --level full` exit 1);
  * la aceptación propia de 001, 002 y 003: BLOCKED ×3 (V-33, y el job `acceptance-closure` de las dos CI).
* La decisión de alcance es humana y **no está tomada** (`V4.1.0-STATE.md` «Human actions required» 3). Según el método (Q1.4), los requisitos declarados obligatorios siguen incompletos: PARCIAL.

**N-57 (MINOR, nuevo, latente desde antes de `e3bc9d0`).** En el tier `container`, el runner admite `python3 -m timeit "import os; os.system('echo ok 1')"`, es decir, texto de script inline. 002 RF-8 dice: «inline script text … shall be rejected».

* `PY_FLAG_ALLOW` (`contract.mjs:26`) permite `-m` con cualquier módulo.
* `pytest` no tiene allowlist de flags (`contract.mjs:68`): `-p`, `--pyargs` y `-o` se aceptan.
* La corrección N2 (`contract.mjs:17-19`, «only interpreters whose argv the platform constrains») no se cumple para python ni para pytest.

El impacto es limitado: tier `container` (imagen fijada por digest, `network none`, solo lectura); un contrato nuevo o modificado fuerza revisión humana; en este host el tier da BLOCKED. Resta en Q7.4.

**Sensibilidad.** Respecto de `e3bc9d0` (88.00): +0.50. Se descompone en Q5.3 +1.00 (N-56 cerrado; queda N-29/N-27) y Q7.4 −0.50 (N-57). Para llegar a 90: cerrar N-51 → 90.00. Cerrar además N-57 → 90.50. Cerrar solo N-57 → 89.00.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Leídos enteros: el log y el diffstat de `e3bc9d0..4417d96`, y los diffs completos de:
  * `ci-closure.mjs`, `contract.mjs`, `downgrade.mjs`, `runner.mjs`, `verdict.mjs`, `hitl.mjs`;
  * todos los tests de `runtime/acceptance` del delta, incluido el nuevo `impact-selection.test.mjs`;
  * `secret-exposure.test.mjs`, `ci.yml`, `SECRETS-BOUNDARY.md`;
  * `native-acceptance.md`, `V4.1.0-INDEPENDENT-REVIEW.md`, `V4.1.0-E2E-EVIDENCE.md` y `V4.1.0-STATE.md` (nuevo).
* `acceptance-governance.yml`: jobs `publish` y `finalize`.
* `l3-consumer.yml` (sin diff desde la base).
* El método: `audit/method.json`, `QUALITY_SCORE.md` §13-§23 y `AUDIT_RULES.md` §32-§33, y `audit/profiles/PLATFORM.md`.

**Ejecutado** (§G):

* 14 validadores y `audit check`.
* `sdd validate --level full` ×3 y `sdd acceptance status --base 15548c1` ×3.
* 3 sondas: superficie del productor, impacto y argv de python.
* Mutación del invariante (4 casos).
* 2 builds y extracción.
* Tests locales: `runtime/acceptance` 87/87, `runtime/gates` 214/214, `runtime/policy` 69/69, `implement-all` + `independent-review` + `consumer-launcher` 58/58.
* `release-gate` ×2.
* Lectura remota de la CI de `59369df` y de `4417d96`, code scanning y plano de control.

**Reutilizado por diff vacío** (`git diff --stat e3bc9d0 4417d96`): `runtime/release` (`bundle.mjs` sin diff desde la base), `runtime/cli`, `runtime/bootstrap`, `runtime/adapters` (solo su test lo ejercita; 58/58 local), higiene, EOL y `pretag`.

**No ejecutado:** `review-ledger.test.mjs` (por instrucción; lo cubre la CI: `runtime/circuit` 285 tests, 0 fail, ×2 SO).

**No verificable:**

* `acceptance-governance.yml` en ejecución real: corre por `workflow_run` desde la rama por defecto y aún no está en `main`.
* El tier `container` y el piloto GI: sin contenedores.
* El SHA de la plataforma en el log crudo del E2E: el log solo nombra el commit del consumidor (V-39).
* Codex y OpenCode; F-007.

**Accesos remotos (solo lectura):** `gh pr view 190`; `gh run list --commit` (×2 SHA); `gh run view --log` (45676272070, 45679253224); `gh api` de jobs, code-scanning (alertas y análisis de `refs/pull/190/merge`, alertas de `main`), rulesets, `rules/branches/develop`, `branches/develop/protection`, dependabot y secret-scanning.

## D. CONTRATO DETECTADO

Igual que en `AUDIT-PLATFORM-e3bc9d0.md` §D, con estos cambios de estado:

| ID | Capacidad/Requisito | Estado en 4417d96 |
|---|---|---|
| C-02 | Runner gobernado, RF-8 | Host VERIFICADO (V-22 de la base, sin regresión: `node -e` rechazado, V-37). Contenedor: identidades restringidas (N2), pero los argv de python y pytest NO están acotados (**N-57**) |
| C-04 | Cierre desde la CI del commit evaluado (002 RF-31) | IMPLEMENTADO y ejecutado ×2 SHA. Endurecido (N5): el analizador re-juzga el plan, el tier recorrido y el productor frente a BASE (V-34). Efectivo solo con el camino confiable configurado (PENDIENTE humano) |
| C-05 | Detector de DOWNGRADE | Ampliado: `MANIFEST_REMOVED`, `MODULE_REMOVED`, `PUBLIC_CONTRACT_REMOVED`, `PUBLIC_CONTRACT_PATH_CHANGED`, `DEPENDENCY_REMOVED`, y un cutoff nuevo sobre una feature establecida (N1, N4) |
| C-11 | E2E en consumidor desechable | DOCUMENTADO sobre `59369df` (29 observaciones; el log crudo no fija el SHA de la plataforma, V-39) |
| C-13 | Bundle sin código de solo-tests | VERIFICADO (V-29) |
| C-16 | Selección de impacto conectada a la ejecución (003 RF-2) | **IMPLEMENTADO y CONECTADO** (cierre de CI + analizador; V-38) |
| C-17 | Job L3 del consumidor (002 T7) | NO IMPLEMENTADO (declarado; N-51) |
| C-18 | Frontera de la clave de la App (`secret-exposure`) | VERIFICADO (V-35, V-36): 3 titulares, Environment y checkout de confianza por job |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 9.75 | PARCIAL/MENOR (N-51, N-31, N-43) |
| Q2 Reutilización | 12 | 12.00 | COMPLETO |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-29, N-27, N-24, F-003, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.00 | MENOR (F-007, N-32, F-008, CodeQL #27, **N-57**, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.00 | MENOR (N-40, F-005) |
| **TOTAL** | **100** | **88.50** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `native-acceptance.md` «Limits» | — | Límites actualizados (RF-2 conectado; residual del cierre) |
| Q1.2 | Capacidades presentes | 3 | COMPLETO | 3.00 | V-34, V-38 | — | Cada capacidad declarada `executable` tiene evidencia de resultado |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | — | N-31, N-43 | Heredados. La doc del cierre describe exactamente la superficie del productor (V-34) |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | PARCIAL | 1.50 | V-32, V-33, V-31 (`acceptance-closure`), `l3-consumer.yml` sin diff | **N-51** | RF-2 conectado (progreso). Siguen incompletos 002 T7 (L3), RF-25, 003 T5, RF-17/18, `AC-n` de 001 y la aceptación propia de 001-003. La decisión humana de alcance no está tomada: no sube a MENOR |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-28 | — | |
| Q2.2 | Sin residuos | 3 | COMPLETO | 3.00 | diff | — | Sin rutas de host ni secretos en el delta; el log del E2E queda fuera del repositorio |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | — | — | |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | — | — | `groupKillTarget` corrige una pérdida del runner Linux |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | `ci-closure.mjs`, `verdict.mjs` | — | |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `verdict.mjs` `producerChanges` | — | El productor no decide; el analizador re-juzga |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | — | — | Lógica de impacto duplicada entre `ci-closure.mjs` y `verdict.mjs` (S-54) |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | — | N-11 | Heredado |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.1.0-STATE.md` | — | Lista única de acciones humanas |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `V4.1.0-STATE.md` «CI incident» | — | Causa raíz del `kill(-1)` documentada |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-05..V-11 | — | 14 validadores y `audit check` exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | — | N-24, F-003 | Heredados |
| Q5.3 | Pruebas pasando | 4 | **MENOR** | **3.00** | V-12, V-13, V-30, V-31, V-35 | N-29, N-27 | **N-56 cerrado.** CI del SHA verde ×2 SO; local 87/87, 214/214, 69/69, 58/58. Queda la inestabilidad del host para la suite completa (`V4.1.0-STATE.md`: `review-ledger` superó límites de 25 y 45 min en local) |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | `contract.test.mjs`, `downgrade.test.mjs`, `runner.test.mjs`, `verdict.test.mjs`, `impact-selection.test.mjs`, V-36 | — | Una regresión por cada N1-N5, N7; el invariante de N-56 es sensible a mutación |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | — | F-004 | Heredado |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-04 | — | 6 commits semánticos que nombran sus hallazgos |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-27 | F-005, N-25 | |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-30, V-31 | N-26, N-44 | Heredados. Timeout por test añadido; `acceptance-governance` NO VERIFICADO |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | — | — | Sin diff en `runtime/release`; `CLI_VERSION` v4.0.2 (sin bump: es paso humano) |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-28, V-29 | — | |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | — | F-006 | Heredado |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-27 | F-007 | Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-27 | N-32 | 18 alertas (1 high), fuera del bundle |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-27, V-36 | F-008, CodeQL #27 | Frontera de la App reforzada (Environment + checkout de confianza por job) |
| Q7.4 | Defaults seguros | 2 | **MENOR** | **1.50** | V-37 | **N-57** | Contenedor: `python -m <cualquier módulo>` (p. ej. `timeit "<código>"`) y `pytest` sin allowlist de flags admiten texto inline (RF-8) |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | — | F-009, F-010 | Heredados |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | `execution/current/V4.1.0-STATE.md` | — | El estado de tareas pasa a un registro único (S-45 y S-51 siguen) |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | excepción v4.1.0 | N-40 | |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-27, V-34, V-38 | F-005 (CAUSA RAÍZ COMPARTIDA) | Código nuevo fail-closed (productor cambiado, consumidor sin plan o grafo BASE: BLOCKED) |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | `V4.1.0-INDEPENDENT-REVIEW.md`, `V4.1.0-E2E-EVIDENCE.md` | — | Cadena hallazgo → corrección → test → registro. El log crudo del E2E no fija el SHA de la plataforma (S-53, no puntuado) |

## G. LEDGER DE VERIFICACIÓN

(A) complementaria del auditor; (R) remota. Logs en `<scratchpad>/audit410/logs3/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA | `git rev-parse HEAD 4417d96 origin/feature/native-acceptance-v4.1.0`; clon `checkout` | `4417d96d66fa5b6b91f3afb49722b432c309b255` ×4 | PASS |
| V-02 | Worktree | `git status --porcelain` (worktree y clon) | vacío al empezar; clon 0 al terminar | PASS |
| V-03 | PR (R) | `gh pr view 190` | OPEN, DRAFT, head 4417d96, base develop, UNSTABLE | PASS |
| V-04 | Alcance (A) | `git log --oneline e3bc9d0..4417d96`; `git diff --stat` | 6 commits, 18 archivos, +596/−39; `7d9e2b7..59369df`: solo doc y registro de revisión | PASS |
| V-05..V-11 | Validadores (clon) | `validate-audit-safe-script-mode`, `validate-parity` (95/95, 576 archivos, unmapped 0), `validate-contracts` (26 schemas, 8 datos), `validate-core`, `validate-compat-matrix` (32), `validate-integrity`, `m52/validate-evidence`, `validate-ci-tests-listed` (**116**), `validate-entrypoints`, `validate-doc-drift`, `audit/cli.mjs check`, `constitution-extension`, `hitl.mjs --base 15548c1`, `validate-actions-pinned` | exit 0 ×14 | PASS |
| V-12 | Tests acceptance (clon) | `node --test --test-concurrency=1 --test-timeout=300000 runtime/acceptance/*.test.mjs` | **87/87**, exit 0 (14 min) | PASS |
| V-13 | Tests afectados (clon) | `runtime/policy/*`; `implement-all` + `independent-review` + `consumer-launcher` | 69/69; 58/58 | PASS |
| V-27 | Plano de control (R) | rulesets, `develop`, dependabot, secret-scanning, code scanning `main` | 1 ruleset `ai-native-main` (sin cambios, `required_approving_review_count 0`); `develop`: «Branch not protected», 0 reglas; Dependabot 18 (1 high, 16 medium, 1 low); secret scanning 0; code scanning abierto en `main`: [27] | PASS (con F-005, N-25, N-32, F-008) |
| V-28 | Build reproducible (A) | `build.mjs --version v4.0.2 --commit 4417d96… --out b1x`/`b2x` | exit 0 ×2; 6/6 assets idénticos (`cmp`) | PASS |
| V-29 | Contenido del bundle (A) | `tar -tzf` de `b1x` | 258 archivos; 0 `*.test.mjs`; sin `acceptance.fixture.mjs` ni `impact-selection.test.mjs`; `ci-closure.mjs` y `verdict.mjs` incluidos | PASS |
| V-30 | CI de `59369df` (R) | `gh run view 45676272070`; `gh api actions/jobs/{139424539040,139424538713,139424538946}`; `--log` | **success**: `validators` ubuntu (4m42s) y windows (16m24s), 55/55 pasos cada uno; acceptance 87/87 ×2; gates windows 214/214, ubuntu 213 + 1 skip (G12, `no cmdkey.exe.mui available on this host`); `acceptance-closure` success: «001 MISSING BLOCKED; 002/003 REQUIRED BLOCKED (local view)» | PASS |
| V-31 | CI de `4417d96` (R) | `gh run list --commit 4417d96…`; `gh run view 45679253224 --log`; `gh api` jobs 139435064438/139435064458 | **CI success** (18:50-19:04 UTC): 58/58 pasos ×2 SO; circuit 285/285 (ubuntu), 283 + 2 skip (windows); acceptance 87/87 ×2; gates 214 ×2 (ubuntu 1 skip G12); 0 líneas `✖`. CodeQL, SBOM, pr-gate, Supply chain, security-scan, Trivy y Dependency review: success | PASS (N-56) |
| V-32 | `sdd validate --level full` | `node runtime/main.mjs sdd validate <s> --level full` | 001 **exit 1** (sin `AC-n` ni `not-applicable`); 002 y 003 exit 0 | 001 FAIL (N-51) |
| V-33 | Aceptación propia | `sdd acceptance status <s> --base 15548c1` | 001 BLOCKED/MISSING; 002 y 003 BLOCKED/REQUIRED («no validation contract at acceptance/validation-contract.json»), exit 1 ×3 | BLOCKED (N-51) |
| V-34 | Superficie del productor (A) | `probes/probe-surface.mjs` (`producerSurface`, `producerChanges`) | 23 rutas (`ci.yml` + 22 módulos transitivos); `producerChanges(e3bc9d0,HEAD)` = 6 rutas; `(HEAD,HEAD)` = []. Ninguna importación con comillas simples ni dinámica escapa al regex. Quedan fuera los datos leídos en ejecución (`contracts/*.schema.json`, plantilla del manual, `core/agents.json`); el analizador los re-evalúa con el código de `main` (S-52) | PASS |
| V-35 | N-56 local (clon) | `node --test runtime/gates/*.test.mjs` | **214/214**, exit 0; ✔ «this repository's own workflows conform…» | PASS (N-56) |
| V-36 | Mutación del invariante (A) | copia en `mut/` + `node --test --test-name-pattern="own workflows conform" secret-exposure.test.mjs` | Sin mutar: pass. M1 sin `environment` en `finalize` → fail («must run in the ai-native-trust Environment»). M2 `ref` al SHA de la PR → fail («must pin the default branch or the base SHA»). M3 `persist-credentials: true` → fail. M4 clave en el job `human` → fail | PASS |
| V-37 | Sonda argv de contenedor (A) | `probes/probe-py.mjs` (`checkExecutable` + `checkArgv`, isolation `container`) | Rechazados: `python3 -c`, `node -e`. **Aceptados**: `python3 -m timeit "import os; os.system('echo ok 1')"`, `-m runpy`, `-m code`, `pytest -p some_plugin`, `pytest --pyargs anymod`, `pytest -o python_files=*.txt`. `PY_FLAG_ALLOW` idéntico en `e3bc9d0` | **FAIL** (N-57) |
| V-38 | Sonda de impacto (A) | `probes/probe-impact2.mjs` (consumidor desechable, manifiesto `locales→regions`, cambio declarado) | P1 sin artefacto: BLOCKED. P2 `closureRun` selecciona `["020-regions"]`, consumers `["regions"]`. P3 con artefacto: la consumidora se juzga (BLOCKED por la fixture sin `spec.md`, MISSING), no se omite. P4 sin su salida cruda: BLOCKED | PASS |
| V-39 | E2E `59369df` (A) | lectura de `<scratchpad>/e2e-log-59369df.json`; `git log --format=%cI` | 29 observaciones (= registro). Escrito a las 15:36 −03, después de `59369df` (15:32) y antes de `4417d96` (15:50). La sección 0 solo registra el commit del consumidor (`e5c4177`), no el SHA de la plataforma ni su árbol limpio | PARCIAL (no puntuado; S-53) |
| V-40 | Release-gate | `release-gate --profile PLATFORM --candidate 4417d96… --root <clon>` (antes del informe); `… --reports <scratchpad>/audit410/reports3 --root <clon>` (con este informe) | Antes: FAIL, exit 1, «no current valid PLATFORM audit report for 4417d96…» + 36 STALE históricos (ESPERADO). Con este informe: ver §M | ESPERADO |
| V-41 | Code scanning PR (R) | `code-scanning/alerts?state=open&ref=refs/pull/190/merge`; `analyses?ref=…` | 0 alertas abiertas; últimos análisis `08e0871` (merge de `4417d96`, 18:51 UTC) JS 0 resultados, actions 0 | PASS |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| **N-51** | FALTA | **MAJOR** | Alcance obligatorio de v4.1.0 incompleto: 002 T7 L3; configuración de RF-25, de la que depende RF-31; 003 T5; RF-17/18 sin digests de configuración declarados; 001 sin `AC-n`; aceptación propia de 001-003 BLOCKED. 003 RF-2 ya está conectado | V-32, V-33, V-30/V-31 (`acceptance-closure`); `native-acceptance.md` «Limits»; `V4.1.0-STATE.md` tabla y «Human actions» 2-3; `.github/workflows/l3-consumer.yml` sin diff desde `15548c1` | Q1.4 | −1.50 |
| **N-57** | RIESGO | **MINOR** | En el tier contenedor, `python -m <módulo arbitrario>` y `pytest` sin allowlist de flags permiten ejecutar texto inline, contra 002 RF-8 y contra la intención declarada de N2 | V-37; `runtime/acceptance/contract.mjs:17-19`, `:26`, `:68`; `specs/002-native-acceptance/spec.md:106-110` | Q7.4 | −0.50 |
| N-31, N-43 | CONTRADICTORIO / INCORRECTO | MINOR | Heredados | — | Q1.3 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README | — | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Estrategia de pruebas | — | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host (la suite completa sigue sin correr localmente) | ROOT-002; `V4.1.0-STATE.md` «CI incident» | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates | — | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-27 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin protección | V-27 | Q6.2 | −0.375 |
| N-26, N-44 | INCOMPLETO / RIESGO | MINOR | Pilot offline; `merge-gate` sin reintento | — | Q6.3 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback | — | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Secretos no verificables por API | V-27 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 18 alertas Dependabot | V-27 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 | V-27 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain | — | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | U0 sin implantar (identidad única) | excepción v4.1.0 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 1 MAJOR, 20 MINOR.** Cerrado en este tramo: N-56. Nuevo: N-57, latente desde antes de `e3bc9d0`: `PY_FLAG_ALLOW` no cambia y mi sonda V-22 de la base no probó `-m <módulo>` con texto.

### N-56 — Suite principal de CI en rojo por el invariante de credenciales (MAJOR, CERRADO)

**Corrección** (`83f0de6`, endurecida en `7d9e2b7`). `secret-exposure.test.mjs:69` admite como titulares `acceptance-governance.yml`, `merge-gate.yml` y `trust-gate.yml`. `:73-89` divide cada workflow titular en jobs y exige, en cada job que nombra un secreto, dos cosas: `environment: ai-native-trust`, y un `actions/checkout` fijado a `github.event.repository.default_branch` o `github.event.pull_request.base.sha` con `persist-credentials: false` (re-review N7). `SECRETS-BOUNDARY.md:34` registra el tercer titular como **pendiente de aprobación humana**.

**Verificación de cierre** (la del informe anterior): `node --test runtime/gates/*.test.mjs` exit 0 (V-35), y la CI del nuevo SHA con `validators` success ×2 SO (V-31). Cumplida. Además, la mutación V-36 muestra que el invariante no es tautológico.

**Observación (no puntuada).** `publish` (`acceptance-governance.yml:115-145`) no hace checkout. Solo descarga el artefacto `acceptance-verdict` del job `analyze`, que es de solo lectura y corre el código de `main`, y lo lee con `jq`. El test no cubre ese caso: un job titular sin checkout pero con otra vía de traer código de la candidata. Hoy no existe ninguna. Se registra como S-55.

### N-51 — Alcance obligatorio de v4.1.0 incompleto (MAJOR, sigue abierto)

**Progreso verificado en este tramo.**

* **003 RF-2 está conectado.**
  * `ci-closure.mjs` `impactSelection` une los consumidores de los grafos BASE (`git show merge-base:…`) y head, y selecciona cada feature consumidora una vez.
  * `verdict.mjs` `analyze` repite la unión con los objetos Git y exige el cierre de cada consumidora; si a una consumidora le falta plan, da BLOCKED.
  * Debilitar el manifiesto es un DOWNGRADE (`downgrade.mjs` `manifestDowngrades`).
  * Lo verifican `impact-selection.test.mjs` (5 tests), V-38 y las dos CI.
* **El cierre de RF-31 está endurecido (N5).** `deriveClosure` re-juzga el plan con `validatePlan` sobre los bytes de los objetos Git y exige que el tier registrado sea el del contrato y que cumpla el mínimo de cada caso. `analyze` da BLOCKED si el productor (`ci.yml` + las importaciones transitivas de `ci-closure.mjs`) difiere de BASE. En este PR lo hace, así que el cierre de la propia candidata nunca podría dar PASS (V-34: 18 rutas difieren de `15548c1`). Es correcto según el diseño.

**Sigue incompleto.** Declarado en `native-acceptance.md` «Limits» y en `V4.1.0-STATE.md`:

* job L3 del consumidor (002 T7): no implementado (`l3-consumer.yml` sin diff);
* camino confiable de RF-25: sin configurar (configuración humana);
* 003 T5 (piloto GI): no ejecutado (sin contenedores);
* 002 RF-17/RF-18: `configDigests` soportado en `evidence.mjs:26-37`, sin declaración ni llamador;
* spec 001: sin `AC-n` (V-32);
* aceptación propia de 001-003: BLOCKED (V-33).

**La decisión de alcance es humana y está pendiente** (`V4.1.0-STATE.md` «Human actions required» 3: «Decide the remaining scope…»). El auditor no la presume. Mientras no exista un registro aprobado que saque esos SHALL del alcance de v4.1.0, siguen siendo requisitos obligatorios declarados e incompletos. Q1.4 se mantiene en PARCIAL. No baja a DÉBIL: la mayoría de las tareas está implementada y verificada.

**Corrección mínima suficiente** (sin cambios respecto de la base, salvo RF-2, ya hecho):

* Job L3.
* Digests de configuración de RF-17/18.
* `AC-n` en 001, o `acceptance: not-applicable` justificado y aprobado.
* Contrato y planes propios, y 001-003 a PASS (o exención aprobada).
* 003 T5 en un host con contenedores.
* Configuración humana de RF-25.
* **Alternativa válida:** un registro de versión aprobado por el humano que difiera formalmente lo pendiente fuera de v4.1.0.

**Verificación de cierre:** `sdd validate <s> --level full` exit 0 ×3; `sdd acceptance status` PASS o NOT_APPLICABLE aprobado ×3; run del job L3; evidencia T5; check `ai-native/acceptance-governance` requerido y publicado sobre un SHA. O bien: el registro de alcance aprobado, más la coherencia de doc, STATE y specs con él.

**Puntos recuperables:** +1.50.

### N-57 — Texto inline admitido en el tier contenedor (MINOR, nuevo)

**Descripción.** `checkArgv` (`contract.mjs:65-79`) solo aplica allowlist de flags a `node` y a `python*`. Para `python*`, `PY_FLAG_ALLOW` (`:26`) admite `-m` sin restringir el módulo. Así, `python3 -m timeit "import os; os.system('echo ok 1')"` pasa la validación (V-37) y ejecuta el texto del argv como código. `pytest` (`CONTAINER_BARE_EXECUTABLES`, `:19`) no tiene allowlist: `-p <plugin>`, `--pyargs` y `-o python_files=…` se aceptan.

002 RF-8 (`spec.md:106-110`) exige rechazar «inline script text». El comentario de la corrección N2 (`:17-18`, «only interpreters whose argv the platform constrains») y su registro en `V4.1.0-INDEPENDENT-REVIEW.md` (N2) lo dan por resuelto. Para python y pytest no lo está.

**Impacto: limitado.**

* Solo el tier `container`: imagen fijada por digest, `network none`, solo lectura, sin directorio git.
* Crear o cambiar un contrato fuerza `human_gate`.
* En este host el tier da BLOCKED.

Aun así, permite que un runner aparentemente legítimo fabrique salida TAP sin ejercitar el SUT, que es justo lo que RF-8 y `NOOP_DENYLIST` intentan impedir.

**Causa raíz.** ROOT-010 (seguridad del runner por lista y no por identidad de entrada), residual en el tier contenedor.

**Corrección mínima suficiente.**

* Que `-m` solo admita `pytest` (o una lista cerrada de módulos de test).
* Una allowlist de flags para `pytest` (rechazar `-p`, `--pyargs`, `-o`, `-c` y `--rootdir` fuera del repositorio).
* Una regresión en `contract.test.mjs` con `-m timeit`, `-m runpy`, `-m code` y `pytest -p`.

**Verificación de cierre:** V-37 con todos esos casos REFUSED.

**Puntos recuperables:** +0.50.

### Riesgo residual del diseño RF-31 (no puntuado)

R-2 del informe anterior queda **acotado**, no eliminado. Un PR que cambie `ci.yml` o la cadena de `ci-closure.mjs` ya no puede cerrar la aceptación: da BLOCKED (V-34). Queda lo que la doc declara (`native-acceptance.md:66-76`):

* el código de casos de la candidata corre en el mismo job y, en el tier `restricted`, no está aislado, así que puede manipular el directorio de salida;
* la falla sembrada de RF-32 no es verificable en el merge;
* los archivos de datos que el productor lee en ejecución no entran en la superficie (S-52).

Mientras exista N-40, la revisión humana del control plane no separa al agente del humano.

### Heredados

Sus descripciones están en `AUDIT-PLATFORM-cad1053.md` §H. Verificados en vivo (V-27): F-005, N-25, N-32 (18), F-008, CodeQL #27, F-007 y N-40. Los demás por diff vacío sobre su área. N-29/N-27 sigue vivo según `V4.1.0-STATE.md`: `review-ledger.test.mjs` superó en local los límites de 25 y 45 min.

### H.1 Sugerencias (no restan puntos)

* S-1..S-50 heredadas.
  * **S-45** sigue: `governance/SESSION-CONTEXT.md` no registra la candidata (último commit `e2b9aa5`).
  * **S-50** se actualiza: las correcciones de la segunda revisión (`7d9e2b7`) no pasaron por una tercera revisión aislada (`V4.1.0-INDEPENDENT-REVIEW.md`, última línea). Esta re-auditoría re-verifica N1-N5 y N7 con tests y sondas, pero no la sustituye. N-57 es justo un residual de N2.
* **S-51 (nueva).** `specs/00{1,2,3}/tasks.md` mantienen todas las casillas `- [ ]`, mientras `V4.1.0-STATE.md` marca DONE la mayoría de las tareas. Las specs están congeladas a propósito (idénticas a `e3bdc92`, comprobado), pero conviene que STATE lo diga explícitamente para que ninguna herramienta lea las casillas como estado.
* **S-52 (nueva).** `producerSurface` (`verdict.mjs:56-71`) sigue solo importaciones relativas con comillas dobles. No incluye los datos leídos en ejecución (`contracts/*.schema.json`, `knowledge/sdd/templates/acceptance-manual-template.md`, `contracts/assess-rules.json`, `core/agents.json`). El analizador re-valida contrato y plan con el código y los schemas de `main`, así que hoy no veo un camino a PASS. Incluirlos cerraría la clase entera.
* **S-53 (nueva).** El log crudo del E2E debería registrar `git rev-parse HEAD` y `git status --porcelain` de la plataforma en la sección 0. Hoy solo registra el consumidor (V-39).
* **S-54 (nueva).** `impactSelection` (`ci-closure.mjs`) y el bloque de impacto de `analyze` (`verdict.mjs`) duplican la misma unión de grafos. Una función común reduciría el riesgo de divergencia entre productor y analizador.
* **S-55 (nueva).** Extender `secret-exposure.test.mjs` para que un job titular tampoco ejecute código obtenido con `git fetch`/`git show` de la candidata, no solo con `actions/checkout`.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2, Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite completa | N-29, N-27 | Q5.3 |
| ROOT-003 | Agentes y auditor con la identidad del propietario | N-40; condiciona RF-25/RF-31 (N-51, R-2) | Q8.2 |
| ROOT-006 | API de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-009 | Batería de CI no ejecutada antes del push (recurrente) | N-56 (cerrado; la CI del SHA está verde) | — |
| ROOT-010 | Seguridad del runner por listas | N-50 (cerrado), **N-57** | Q7.4 |
| ROOT-011 | Alcance dependiente de configuración humana e infraestructura ausente, más trabajo pendiente | N-51 | Q1.4 |

## J. QUÉ SOBRA

| Elemento | Acción | Motivo |
|---|---|---|
| Bucle por `PATH` de `resolveExecutable` | SIMPLIFICAR (S-48, sigue) | Inalcanzable desde `runRunner` |
| Unión de grafos duplicada (`ci-closure.mjs` / `verdict.mjs`) | UNIFICAR (S-54) | Una sola fuente para productor y analizador |

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

N-51 y N-57 (§H) y los 19 MINOR heredados (`AUDIT-PLATFORM-cad1053.md` §K/§O).

### MEJORAS OPCIONALES

S-1..S-55. No restan puntos ni bloquean.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto | Cómo verificarlo |
|---|---|---|---|
| `acceptance-governance.yml` (`analyze`/`publish`/`human`/`finalize`) | `workflow_run` solo corre desde `main` | Dentro de N-51 | Tras el merge a `main`: PR con un caso borrado → `action_required`; tras la aprobación → `finalize` |
| Tier `container`; piloto GI | Sin contenedores en el host | Dentro de N-51 y N-57 | Host con Docker/Podman |
| SHA de la plataforma usado en el E2E de `59369df` | El log crudo no lo registra | Ninguno (S-53) | Re-ejecutar con la sección 0 ampliada |
| `review-ledger.test.mjs` local | Excluido por instrucción | Ninguno (CI 285 tests, 0 fail, ×2 SO) | — |
| Independencia del auditor | Identidad compartida (U0 PENDING por decisión humana registrada) | Confianza MEDIA; auditoría aislada, no atestada | U0 |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0)
G2 CRITICAL: PASS (0)
G3 VERIFICACIÓN ESENCIAL: PASS (build reproducible V-28; validadores V-05..V-11; tests locales V-12, V-13, V-35;
   CI principal del SHA exacto success ×2 SO, V-31; bootstrap sin diff)
```

El método 1.2 (`QUALITY_SCORE.md` §22-§23) define únicamente G1-G3. No hay G4-G6 en el método. El «G5» que citan los registros de v4.1.0 (U0/G5) es un gate de gobernanza de la plataforma, no un Quality Gate de la auditoría, y aquí no se aplica. Ningún gate limita la nota, así que final = bruto = 88.50.

**Release-gate contra este informe (V-40):** `PASS_WITH_WARNINGS` (exit 0; «score 88.5 is below 90 but within the 2-point tolerance»). El front matter se acepta. Es uso de release y nunca gate de merge (`isMergeGate: false`). No forma parte de la nota. El humano debe pesar que N-51 es alcance obligatorio sin decidir.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 88.50

N-51 (Q1.4)                          → +1.50  (→ 90.00)
N-57 (Q7.4)                          → +0.50

N-31, N-43 (Q1.3)                    → +0.75
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

Suma: 0.75×8 + 1.50 + 1.00 + 0.50×6 = 6.00 + 1.50 + 1.00 + 3.00 = 11.50
88.50 + 11.50 = 100.00
```

## O. PLAN DE REMEDIACIÓN

1. **MAJOR — N-51** (+1.50 → 90.00). Decisión humana primero: implementar lo pendiente (§H) o aprobar un registro que lo difiera fuera de v4.1.0. Lo segundo es el camino más corto y es válido según el método, siempre que doc, STATE y specs queden coherentes con él.
2. **MINOR — N-57** (+0.50). `contract.mjs`: `-m` limitado a `pytest`; allowlist de flags de `pytest`; regresión en `contract.test.mjs`. Toca `runtime/acceptance/**` (control plane).
3. **MINOR heredados**, en el orden de `AUDIT-PLATFORM-cad1053.md` §O. Primero Q5.3 (N-29/N-27, +1.00) y Q6.3 (N-26/N-44, +0.75).

Antes de cada push, ejecutar todos los pasos de `ci.yml` (ROOT-009). Cualquier commit fuera de `.audit/**` deja este informe STALE.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 1 MAJOR y 20 MINOR, y la confianza es MEDIA. Para el uso del perfil, un gate de release con umbral 90 y tolerancia 2, `4417d96` **queda en 88.50**: no alcanza 90, pero está dentro de la tolerancia.

Este tramo cierra N-56 de verdad: la CI del SHA está verde en los dos SO y el invariante de la clave de la App es más estricto y sensible a mutación. Conecta además 003 RF-2 y endurece el cierre de RF-31 frente a un productor modificado por la candidata. Queda el alcance obligatorio pendiente de una decisión humana (N-51) y un residual de N2 en los argv de python y pytest del tier contenedor (N-57).

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 88.50 + 11.50 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay)
[x] Los Quality Gates derivan de hallazgos reales (ninguno activo; G3 retirado por V-31, V-35)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 2.25 + 1.50 | 9.75 |
| Q2 | 3 + 3 + 3 + 3 | 12.00 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 3.00 + 3 + 2.25 | 13.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 1.50 | 14.00 |
| Q7 | 2.25 + 1.50 + 1.50 + 1.50 + 2.25 | 9.00 |
| Q8 | 2 + 1.50 + 1.50 + 2 | 7.00 |
| **Total** | | **88.50** |

**Divergencia con `e3bc9d0` (88.00): +0.50.**

| Subcriterio | Cambio | Puntos | Causa |
|---|---|---:|---|
| Q5.3 | PARCIAL → MENOR | +1.00 | N-56 cerrado (V-31, V-35, V-36) |
| Q7.4 | COMPLETO → MENOR | −0.50 | N-57 nuevo (V-37) |

Q1.4 sigue en PARCIAL (N-51; RF-2 conectado, sin decisión de alcance). G3 retirado.

**Divergencia con `cad1053` (90.50): −2.00**: Q1.4 (−1.50) y Q7.4 (−0.50).

### Riesgos residuales

* **R-1 (ALTO).** ROOT-003: mientras U0 siga pendiente, las aprobaciones de Environment y la aceptación local pueden producirlas procesos con la identidad del propietario. Esta auditoría es aislada, no atestada.
* **R-2 (MEDIO, acotado).** Código de casos de la candidata en el job productor; datos de ejecución fuera de la superficie del productor (§H, S-52).
* **R-3.** `develop` sin protección (N-25): #190 podría fusionarse sin la revisión del control plane que la ampliación de titulares de la clave exige.
* **R-4.** `acceptance-governance.yml` no se ha ejercitado nunca. Su primera ejecución real será después del merge a `main`, y ya con la clave de la App.
* **R-5.** Las correcciones de la segunda revisión no tienen tercera revisión aislada (S-50); N-57 muestra que N2 quedó incompleto.

```text
AUDITED_SHA: 4417d96d66fa5b6b91f3afb49722b432c309b255
SCORE: 88.50/100 (bruto = final; sin N/A; ningún gate activo)   PREVIOUS: 88.00 (e3bc9d0); 90.50 (cad1053)
BLOCKER: 0  CRITICAL: 0  MAJOR: 1 (N-51)  MINOR: 20 (19 heredados + N-57 nuevo)   CERRADOS: N-56
DELTA: e3bc9d0..4417d96, 6 commits, 18 archivos, +596/-39
LOCAL: 14 validadores + audit check exit 0; acceptance 87/87; gates 214/214; policy 69/69; circuit+launcher 58/58;
       mutación del invariante 4/4 detectadas; sonda argv contenedor FAIL (N-57)
CI 59369df (45676272070) y 4417d96 (45679253224): success, validators 55/55 y 58/58 pasos ×2 SO; acceptance-closure success
CODEQL PR #190: 0 alertas abiertas (último análisis 08e0871: 0)
BUILD: reproducible (6/6, 258 archivos, sin código de solo-tests)
UMBRAL PLATFORM 90 (tolerancia 2): NO ALCANZA 90 (−1.50); DENTRO DE LA TOLERANCIA (88.50 ≥ 88)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
