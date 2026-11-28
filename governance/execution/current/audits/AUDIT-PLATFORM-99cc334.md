---
targetRepo: jlbellonGmail/ai-native
targetCommit: 99cc334bc24870fd689de8f26527c6d62ffd5173
platform:
  version: "v4.1.0 candidate (release/v4.1.0, CLI_VERSION v4.1.0)"
  commit: 99cc334bc24870fd689de8f26527c6d62ffd5173
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-27T12:00:00Z"
scope: "Independent read-only PLATFORM 1.2 re-audit of the v4.1.0 MINOR release candidate 99cc334 (branch release/v4.1.0 = feature/native-acceptance-v4.1.0 head 24d05c3, draft PR #190 to develop, plus the CLI_VERSION v4.1.0 bump d9d2f60 and governance/versioning/V4.1.0-MINOR.md 99cc334) over the delta 4417d96..99cc334 (19 commits, 51 files, +6454/-352), with every open finding of AUDIT-PLATFORM-4417d96.md (88.50) re-verified live. Human decision for this execution: COMPLETE N-51 (not defer); its parts audited one by one (consumer L3 acceptance, GI PostgreSQL pilot, own acceptance of 001-003, 002 RF-17/18 config digests, trusted path code); the external human configuration (U0 identity separation, develop coverage) audited as a recorded pending human step, not assumed done. Evidence from a frozen clone of 99cc334 outside the repository. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the change; same Windows and GitHub identity as the builder (U0 PENDING, N-40, ROOT-003): isolated, NOT attested. runtime/circuit/review-ledger.test.mjs and runtime/consumer/l3.test.mjs not run locally (CI). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 88.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata de release v4.1.0 MINOR, re-auditoría de 99cc334)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público; rama por defecto main)
Ruta:               D:\proyectos\ai-native-rel410 (solo lectura) + clon congelado de 99cc334 en
                    <scratchpad>/audit410/clone-99cc334 (fuera del repositorio; core.longpaths=true)
Branch:             release/v4.1.0 (= origin/release/v4.1.0 = 99cc334). Sin PR propio (ninguna PR con head
                    release/v4.1.0). PR #190 (feature/native-acceptance-v4.1.0 → develop): OPEN, DRAFT, UNSTABLE;
                    su head se movió DESPUÉS del inicio de esta auditoría a 9e47c2e (solo V4.1.0-E2E-EVIDENCE.md,
                    +21; fuera del objetivo)
Commit:             99cc334bc24870fd689de8f26527c6d62ffd5173 (git rev-parse HEAD del clon y origin/release/v4.1.0)
Delta auditado:     4417d96..99cc334, 19 commits, 51 archivos, +6454/−352:
                    c6f860b (N-57), 4222dfd (registro 88.50), e66cf32 (kill de descendientes), dd95b70 (RF-17/18),
                    f49f5b1 (RF-32 en merge, sin symlinks), 4c9fa88 (veredicto confiable en merge-gate, sin tercer
                    titular de clave), 5a407f4 (L3 consumidor, anclas en el log), 255ca09 (aceptación propia 001-003),
                    974599d/1ed1700/4ecf0fd (piloto GI PostgreSQL), f942cf8 (doc), 6438227 (CI), 72d4f1a/4052659/
                    ff28a82 (tercera revisión aislada R1-R11), 24d05c3 (auditorías históricas), d9d2f60 (CLI_VERSION
                    v4.1.0), 99cc334 (registro V4.1.0-MINOR.md)
Código idéntico:    git diff --stat ff28a82..99cc334 = 3 informes de auditoría + README de audits + V4.1.0-MINOR.md +
                    1 línea de runtime/cli/ai-native.mjs (CLI_VERSION)
Base:               origin/develop = 15548c1 (merge-base); origin/main = d08531e
Baseline:           AUDIT-PLATFORM-4417d96.md (88.50, en governance/execution/current/audits/)
Tag:                ninguno; v4.1.0 libre
Fecha:              2026-11-26 07:40 UTC – 2026-11-27
Worktree:           clon limpio al empezar y al terminar (git status --porcelain vacío)
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2; sin diff en audit/ ni runtime/audit en el delta)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente de contexto aislado, solo lectura, lanzado desde la sesión
                    del Builder. No escribió el cambio. MISMA identidad de Windows y de GitHub que el Builder (U0
                    PENDING; N-40, ROOT-003): auditoría AISLADA, NO ATESTADA. No aprobó ningún Environment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, gh (solo lectura); sin runtime de contenedores
Temporales:         <scratchpad>/audit410: clone-99cc334/ (objetivo), ff-ff28a82/ (clon de ff28a82), mut4/ (copia
                    mutada para V-52), closure-ff28a82/ (artefacto de CI), b41a/, b41b/ (builds), logs4/, probes4/,
                    reports4/
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 88.25/100
Score final: 88.25/100
Quality Gate aplicado: ninguno (G1, G2 y G3 PASS)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 80-89 «Buen nivel, aún no de referencia»)
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88):** **no alcanza 90 (−1.75). Queda dentro de la tolerancia (88.25 ≥ 88).** `release-gate`: ver V-60. 0 BLOCKER, 0 CRITICAL, **1 MAJOR (N-58, nuevo)**, **22 MINOR** (19 heredados, N-51 reclasificado, N-59 y N-60 nuevos). Sin N/A. Cerrado: **N-57**.

**N-51 se completa en código; queda el paso humano.** Lo verifiqué parte por parte:

| Parte de N-51 | Estado en 99cc334 | Evidencia |
|---|---|---|
| 001 `AC-n` | HECHO | `sdd validate --level full` exit 0 ×3 (V-42) |
| 002 RF-17/RF-18 (`configFiles`, `envValues`) | HECHO y verificado | `contract.mjs`, `feature.mjs` `caseFingerprint`, `downgrade.mjs` `CONFIG_INPUT_REMOVED`; tests 97/97 + 1 skip (V-41) |
| Aceptación propia de 001-003 (contrato, planes, casos) | HECHO; ejecutada | 001 PASS en `ff28a82` (V-44). En CI de `ff28a82`, la salida cruda da PASS ×3 en tier `restricted` (V-46). **En el SHA exacto, local: BLOCKED ×3** por una ruta no cubierta, `governance/versioning/V4.1.0-MINOR.md` (V-43) |
| 003 T5, piloto GI PostgreSQL | HECHO y verificado | 3 runs de CI (`4ecf0fd`, `ff28a82`, `24d05c3`): `PILOT: PASS`, 12/12 ×2, imagen fijada por digest (V-47) |
| L3 de aceptación en consumidores | IMPLEMENTADO; test unitario/e2e local en CI | `l3-consumer.yml` + `acceptance-gate.mjs`. Sin ejecución en un consumidor real |
| Camino confiable (002 RF-25/RF-31/RF-35) | IMPLEMENTADO (`merge-gate.yml` `acceptance-analyze`, 2 titulares de clave); **NUNCA EJECUTADO** | Corre solo con `pull_request_target` a `main`. El `merge-gate.yml` de `main` no lo contiene (V-49) |
| Configuración humana (U0, cobertura de `develop`) | **PENDIENTE** (registrado) | `develop` sin protección (V-48); un solo revisor humano con la identidad compartida (U0); RF-25 en `develop` reportado BLOCKED por diseño |

Lo pendiente es el paso humano registrado, más la ejecución real del camino confiable, que solo es posible tras el merge a `main`. Según el método, Q1.4 pasa de PARCIAL a **MENOR** (+0.75). N-51 sigue abierto como **MINOR residual**: no lo doy por hecho.

**N-57 CERRADO** y verificado con una sonda, no por el mensaje del commit (V-50).

* En el tier contenedor quedan REFUSED: `-m timeit|runpy|code`, `pytest -p|--pyargs|-o|-c|--rootdir|--import-mode`, `--junitxml=<ruta libre>`, `python -W` y `python -X`.
* Q7.4 → COMPLETO (+0.50).

**N-58 (MAJOR, nuevo): el veredicto de aceptación en `merge-gate` crea un bloqueo sin salida para la evolución de la plataforma.**

* Mecanismo:
  * `gates.json` `acceptanceGovernance.required: true` mete el veredicto en `ai-native/merge-gate`, que es un check requerido de `main`.
  * `analyze` da BLOCKED siempre que la «superficie del productor» difiera de BASE. Son 23 rutas: `ci.yml` más 22 módulos de `runtime/acceptance`, `runtime/circuit`, `runtime/gates`, `runtime/lib` y `runtime/policy/hitl.mjs`.
  * Basta con que el PR seleccione alguna feature, y los planes propios declaran como entrada todo el árbol de la plataforma.
  * `evaluateAcceptance` no deja que un humano desbloquee un BLOCKED.
* Sonda V-52: un bump simulado de `actions/setup-node` en `ci.yml` da `ACCEPTANCE_BLOCKED` con y sin revisión humana. El texto de la razón dice «a human decides», pero esa vía no existe.
* Frecuencia histórica: 42 de los 190 merges de primer padre en `main` tocaron esa superficie (sin contar `runtime/acceptance`), entre ellos los PR de release de v4.0.2.
* Hoy está latente: el PR de release de v4.1.0 se juzga con el `merge-gate.yml` de `main`, que no tiene aceptación. Se activa desde el primer PR posterior a v4.1.0 que toque esa superficie. La única salida sería modificar el ruleset o la configuración de BASE fuera del camino gobernado.
* Criterio: Q3.4 PARCIAL (−1.50).

**Sensibilidad respecto de 88.50:** −0.25 = Q1.4 +0.75 (N-51) + Q7.4 +0.50 (N-57) + Q3.4 −1.50 (N-58). Para llegar a 90 hay que cerrar N-58 (→ 89.75) y además N-51 (→ 90.50). Cerrar solo N-51 deja 89.00.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado (leído entero):**

* el log y el diffstat de `4417d96..99cc334`;
* los diffs de `contract.mjs`, `evidence.mjs`, `feature.mjs` y `downgrade.mjs`;
* `verdict.mjs` y `ci-closure.mjs` completos;
* `merge-gate.mjs` y `merge-gate.yml` (diff), `gates.json` y `secret-exposure.test.mjs` (diff);
* los jobs de aceptación de `l3-consumer.yml`;
* `acceptance-pilot.yml` y `run-pilot.mjs`;
* `acceptance/validation-contract.json`, `legacy-cutoff.json` y `generate-plans.cjs` (entradas);
* `native-acceptance.md`, `V4.1.0-STATE.md`, `V4.1.0-INDEPENDENT-REVIEW.md` (tercera revisión), `V4.1.0-PILOT-EVIDENCE.md`, `V4.1.0-MINOR.md` y `V4.1.0-E2E-EVIDENCE.md` (re-run);
* 002 RF-17/18, RF-25, RF-30, RF-31, RF-34 y RF-35;
* el método: `QUALITY_SCORE.md` §5, §13-§25 y §30-§31; `AUDIT_RULES.md` §32-§33; `PLATFORM.md`; `audit-report.schema.json`.

**Ejecutado** (§G):

* 16 validadores y `audit check`;
* `sdd validate --level full` ×3, `sdd acceptance status` y `run` ×3 en `99cc334`, y `run`/`status` de 001 en `ff28a82`;
* tests locales: `runtime/acceptance`, `gates`, `policy`, `release`, `cli`, `migrate/ruleset-guard` y `consumer/acceptance-gate`;
* 4 sondas: argv del contenedor, superficie del productor, bloqueo por productor y veredicto sobre el artefacto real de CI;
* 2 builds v4.1.0 y la lista del bundle;
* `release-gate` ×2;
* lectura remota de las CI de `ff28a82`, `24d05c3` y de los runs del piloto (logs), code scanning y plano de control.

**Reutilizado por diff vacío:** `runtime/bootstrap`, `runtime/adapters`, `runtime/circuit` (código), `audit/`, `runtime/audit`, higiene y EOL.

**No ejecutado (por instrucción):** `review-ledger.test.mjs` y `runtime/consumer/l3.test.mjs`. Los cubre la CI de `ff28a82` y `24d05c3` (`validators` 58/58 ×2 SO).

**No verificable:**

* CI del SHA exacto `99cc334`: no hay ningún run, porque la rama de release no tiene PR (ver V-45).
* `acceptance-analyze` y el veredicto confiable en ejecución real: solo corren desde `main`.
* El L3 de aceptación en un consumidor real.
* El tier `container`: no hay contenedores en este host.
* Codex, OpenCode y F-007.

## D. CONTRATO DETECTADO

Igual que en `AUDIT-PLATFORM-4417d96.md` §D, con estos cambios:

| ID | Capacidad/Requisito | Estado en 99cc334 |
|---|---|---|
| C-02 | Runner gobernado, RF-8 | Host VERIFICADO; contenedor: argv de python, pytest y unittest acotados (N-57 cerrado, V-50) |
| C-04 | Cierre desde la CI del commit evaluado (RF-31) | IMPLEMENTADO: anclas `ACCEPTANCE_RAW_DIGEST` en el log del job productor y `CLOSURE_NOT_ISOLATED`. El artefacto real de `ff28a82` se deriva a PASS ×3 (V-46). El productor es el código de la candidata, no el «runner de la revisión confiable» de RF-31: se mitiga con el BLOCKED por productor cambiado, que origina N-58 |
| C-17 | Job L3 del consumidor (002 plan) | IMPLEMENTADO (`l3-consumer.yml`: `acceptance-closure`, `-analyze`, `-human`, `-governance`; aprobación por registro de Environment de un revisor fijado, R3). No ejecutado en un consumidor real |
| C-18 | Frontera de la clave de la App | VERIFICADO: exactamente 2 titulares (`trust-gate.yml`, `merge-gate.yml`); `acceptance-analyze` sin secreto ni Environment (`gates.test.mjs`, V-41); S-55 deja de aplicar |
| C-19 | Veredicto confiable en el merge (`gates.json` `acceptanceGovernance.required`) | IMPLEMENTADO, no ejercido. BLOCKED/FAIL nunca se aclaran; con productor cambiado → bloqueo permanente (**N-58**) |
| C-20 | Piloto GI PostgreSQL (003 T5) | VERIFICADO (V-47) |
| C-21 | RF-17/RF-18 | VERIFICADO (tests; el contrato propio declara `configFiles: ["package.json"]`) |
| C-22 | Versionado v4.1.0 | `CLI_VERSION "v4.1.0"`; build v4.1.0 reproducible; `--version v4.0.2` rechazado por discrepancia (V-53) |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 10.50 | MENOR (N-51 residual, N-31, N-43, N-59) |
| Q2 Reutilización | 12 | 12.00 | COMPLETO |
| Q3 Arquitectura | 12 | 10.50 | PARCIAL en Q3.4 (**N-58**) |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-29, N-27, N-24, F-003, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, N-60, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.00 | MENOR (N-40, F-005) |
| **TOTAL** | **100** | **88.25** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `native-acceptance.md` «Limits», `V4.1.0-MINOR.md` | — | Límites honestos (develop BLOCKED, consumidor advisory sin revisión de `.github/**`) |
| Q1.2 | Capacidades presentes | 3 | COMPLETO | 3.00 | V-41, V-46, V-47, V-50 | — | Cada capacidad `executable` declarada tiene evidencia de resultado; el camino confiable se declara efectivo solo tras configuración humana |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | V-43, V-44, `V4.1.0-STATE.md` | N-31, N-43, **N-59** | Heredados, más N-59: STATE afirma E2E «re-run on the final code» y aceptación propia PASS; en el SHA exacto el E2E registrado es de `59369df` y la aceptación local da BLOCKED. La doc llama «vacuo» al chequeo de rutas no cubiertas y no lo es. El nivel no baja: son defectos menores de registro |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | **MENOR** | **2.25** | V-42..V-49 | **N-51** (residual) | Alcance de código completo: L3, piloto, 001-003, RF-17/18, camino confiable. Pendientes: configuración humana registrada (U0, `develop`, RF-25 «on every protected target branch»), camino confiable nunca ejecutado y aceptación propia BLOCKED en el SHA exacto |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-53 | — | |
| Q2.2 | Sin residuos | 3 | COMPLETO | 3.00 | diff | — | Sin rutas de host ni secretos; el piloto trabaja en una copia desechable sin remoto |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | — | — | Entradas nuevas opcionales `acceptance-environment` y `acceptance-reviewers` |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | V-41 | — | Residual de Windows (huérfano fuera de `taskkill /T`) documentado; test skip legítimo |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | — | — | |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `merge-gate.yml` | — | Analizador sin secretos; los titulares solo leen el JSON del veredicto |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | — | — | La selección por entradas también está duplicada (`changedFeatureSlugs` / `analyze`), igual que S-54 |
| Q3.4 | Evolución | 3 | **PARCIAL** | **1.50** | V-51, V-52 | **N-58** | Todo PR futuro a `main` que toque las 23 rutas del productor queda bloqueado sin vía gobernada (22% histórico de merges) |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | — | N-11 | Heredado |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.1.0-MINOR.md` | — | Pasos de promoción humanos explícitos |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `V4.1.0-PILOT-EVIDENCE.md` | — | Causa de los 2 BLOCKED del piloto (`/dev/stdout`) documentada |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-05..V-20 | — | 16 validadores y `audit check` exit 0; `validate-ci-tests-listed` 117 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | — | N-24, F-003 | Heredados |
| Q5.3 | Pruebas pasando | 4 | MENOR | 3.00 | V-41, V-45, V-54 | N-29, N-27 | CI de `ff28a82` y de `24d05c3`: success ×2 SO. En local: acceptance 97 + 1 skip, gates 218, policy 69, release/cli (V-54). Sin CI del SHA exacto (sin PR); lo que difiere se cubre en local. La inestabilidad del host sigue |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | `contract.test.mjs`, `verdict.test.mjs`, `gates.test.mjs`, `acceptance-gate.test.mjs` | — | Una regresión por R1-R3, R5, R9 y R10, y por N-57 |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | — | F-004 | Heredado |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-04 | — | 19 commits semánticos que nombran sus hallazgos |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-48 | F-005, N-25 | `develop` sigue sin protección; `main` sigue en 0 aprobaciones |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-45, V-47 | N-26, N-44 | Heredados. Nuevo `acceptance-pilot` en verde |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-53, `V4.1.0-MINOR.md` | — | MINOR justificado por la política. La tensión con el «warn mode» queda declarada para el humano |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-53 | — | 6/6 assets idénticos; 259 archivos; 0 tests |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | — | F-006 | Heredado |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-48 | F-007 | Secret scanning 0; titulares de la clave reducidos a 2 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-48 | N-32 | 18 alertas (1 high, 16 medium, 1 low) |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-48, V-55 | F-008, CodeQL #27, **N-60** | Más 5 alertas medium nuevas en `l3-consumer.yml` sobre `refs/pull/190/merge` |
| Q7.4 | Defaults seguros | 2 | **COMPLETO** | **2.00** | V-50 | — | **N-57 cerrado** |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | — | F-009, F-010 | Heredados |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | `V4.1.0-STATE.md` | — | |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | V-48 | N-40 | U0 pendiente: el revisor de `ai-native-human-review` es la identidad compartida |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-48, V-46, V-52 | F-005 (CAUSA RAÍZ COMPARTIDA) | El código nuevo es fail-closed (sin veredicto, otro SHA o sin anclas: BLOCKED) |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | `V4.1.0-INDEPENDENT-REVIEW.md`, `V4.1.0-PILOT-EVIDENCE.md` | — | Cadena hallazgo → commit → test, y run id del piloto. Los desajustes de registro van a N-59 (Q1.3), sin doble penalización |

## G. LEDGER DE VERIFICACIÓN

(A) complementaria del auditor; (R) remota. Logs en `<scratchpad>/audit410/logs4/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA | `git rev-parse HEAD origin/release/v4.1.0` (repo y clon) | `99cc334bc24870fd689de8f26527c6d62ffd5173` ×2; `origin/feature/…` = `24d05c3` | PASS |
| V-02 | Worktree | `git status --porcelain` (clon) | vacío al empezar y al terminar | PASS |
| V-03 | PR (R) | `gh pr view 190`; `gh pr list --head release/v4.1.0` | #190 OPEN, DRAFT, UNSTABLE; head movido a `9e47c2e` durante la auditoría (`compare`: +1 commit, solo E2E-EVIDENCE); la rama de release no tiene PR | PASS (objetivo congelado) |
| V-04 | Alcance (A) | `git log`/`diff --stat 4417d96..99cc334`; `diff --stat ff28a82..99cc334` | 19 commits, 51 archivos, +6454/−352; de `ff28a82` a `99cc334` solo docs, el registro MINOR y la línea de `CLI_VERSION` | PASS |
| V-05..V-20 | Validadores (clon) | `validate-audit-safe-script-mode`, `validate-parity` (74 capacidades, 576 archivos, unmapped 0), `validate-contracts` (26/8), `validate-core`, `validate-compat-matrix`, `validate-integrity`, `m52/validate-evidence`, `validate-ci-tests-listed` (**117**), `validate-entrypoints`, `validate-doc-drift`, `audit/cli.mjs check`, `constitution-extension`, `hitl.mjs --base 15548c1` (001-003: `human_gate required`, CONTRACT_CREATED, CUTOFF_CREATED), `validate-actions-pinned`, `template validate-structure` y `validate-enterprise-template` | exit 0 ×16 | PASS |
| V-41 | Tests acceptance (clon) | `node --test --test-concurrency=1 --test-timeout=300000 runtime/acceptance/*.test.mjs` | **98: 97 pass, 1 skip** (POSIX: nieto huérfano; en Windows es un residual documentado), 0 fail, 16 min | PASS |
| V-42 | `sdd validate --level full` | `node runtime/main.mjs sdd validate <s> --level full` ×3 | exit 0 ×3 (001 ya tiene `AC-n`) | PASS |
| V-43 | Aceptación propia en el SHA exacto | `sdd acceptance run <s> --base 15548c1` ×3 y `status` | 001: G-01..G-11 PASS; 002: A-01..A-31 sin FAIL; 003: I-01..I-16 sin FAIL. **ACCEPTANCE: BLOCKED ×3**, exit 1: `path:governance/versioning/V4.1.0-MINOR.md` «covered by no case input and is not in the non-SUT class». Contra `main` (d08531e) se añaden `SESSION-CONTEXT.md` y `V4.0.{1,2}-POST-RELEASE-VERIFICATION.md` | **BLOCKED** (N-51 residual, N-59) |
| V-44 | Aceptación propia en `ff28a82` (A) | clon `ff-ff28a82`; `run` + `status` de 001 | 11/11 PASS; `ACCEPTANCE: PASS`, exit 0 | PASS |
| V-45 | CI (R) | `gh run list --commit` ×3; `gh api …/jobs` | `ff28a82`: CI 45775994945 success (`validators` ubuntu y windows 58/58, `acceptance-closure` 8/8), y CodeQL, SBOM, Trivy, Supply chain, security-scan, Dependency review, pr-gate y acceptance-pilot: success. `24d05c3`: CI 45778579029 success (58/58 ×2, closure 8/8), resto success. **`99cc334`: 0 runs** | PASS (exacto: NO VERIFICADO) |
| V-46 | Veredicto sobre el artefacto real (A) | `gh run download 45775994945 --name acceptance-closure` + log del job 139759669019; `probes4/probe-verdict.mjs` | Anclas ×3, una por runner. `analyze(15548c1, ff28a82)` = **BLOCKED** (productor ≠ BASE: `ci.yml`, `ci-closure.mjs`, …; hallazgos CONTRACT_CREATED y CUTOFF_CREATED). `deriveClosure` aislado (solo el auditor): **PASS ×3**, tiers `restricted` → en el merge sería como mínimo `CLOSURE_NOT_ISOLATED` (NEEDS_HUMAN) | PASS (por diseño, no cierra) |
| V-47 | Piloto GI (R) | logs de los jobs 139693526640 (`4ecf0fd`), 139759668996 (`ff28a82`) y 139768183837 (`24d05c3`) | Fuente `cd0a82a…` sin remoto; overlay solo en la copia; `postgres:16-alpine@sha256:f2f98726…` por digest; run 1 y run 2: `ACCEPTANCE PASS`, 12/12; «PILOT: PASS (… repeatable true; image pinned true)» ×3 | PASS |
| V-48 | Plano de control (R) | rulesets, `branches/develop/protection`, `rules/branches/develop`, environments y sus policies y secretos, dependabot, secret-scanning, code-scanning de `main` | Ruleset `ai-native-main`: `required_approving_review_count 0`, checks requeridos sin cambios (incluye `ai-native/merge-gate`), bypass vacío. `develop`: «Branch not protected», 0 reglas. `ai-native-trust`: solo `main`, secretos `TRUST_APP_ID/PRIVATE_KEY`. `ai-native-human-review`: revisor `jlbellonGmail` (la identidad compartida), solo `main`. Dependabot 18 (1/16/1). Secret scanning 0. Code scanning de `main`: [27] | PASS (con F-005, N-25, N-32, F-008, N-40) |
| V-49 | `main` sin aceptación (A) | `git show upstream/main:.github/workflows/merge-gate.yml`, `governance/gates/gates.json` | jobs `merge-gate`, `human-review` y `finalize`; ningún `acceptance` | Camino confiable NO VERIFICADO en ejecución |
| V-50 | Sonda argv del contenedor (A) | `probes4/probe-py.mjs` (26 casos) | REFUSED: `-c`, `-m timeit`, `-m runpy`, `-m code`, `pytest -p`, `--pyargs`, `-o`, `-c`, `--rootdir=/`, `--import-mode`, `--junitxml=/tmp/x.xml`, `unittest --locals`, `-W`, `-X`, `node -e`. ACCEPTED: `-m pytest`, `-m unittest [-k\|-p\|-s\|discover]`, `--junitxml={resultFile}`, script del repositorio | PASS (N-57 cerrado) |
| V-51 | Superficie del productor (A) | `probes4/probe-surface.mjs`; `git log --first-parent upstream/main -- <surface>` | 23 rutas (`ci.yml`, 14 de `runtime/acceptance`, 4 de `runtime/circuit`, `gates/control-plane`, `lib/result`, `lib/schema-lite`, `policy/hitl`). 42 de 190 merges de `main` las tocaron (desde el 2026-10-15: 4 de 21, entre ellos #183 y #184 de v4.0.2) | DATO (N-58) |
| V-52 | Bloqueo por productor (A) | copia `mut4`: commit que cambia solo el pin de `setup-node` en `ci.yml`; `probes4/probe-producer-deadlock.mjs` (`analyze` + `evaluateAcceptance`) | `verdict.status = BLOCKED` («… a human decides»); `humanReviewed=false` → `ACCEPTANCE_BLOCKED`; `humanReviewed=true` con aprobación válida → **`ACCEPTANCE_BLOCKED`**. `evaluateMergeGate`: `needsHuman` solo para HUMAN_REVIEW/ACCEPTANCE_HUMAN_REVIEW → fallo duro | **FAIL** (N-58) |
| V-53 | Build (A) | `build.mjs --version v4.1.0 --commit 99cc334… --out b41a`/`b41b`; `tar --force-local -tzf`; `--version v4.0.2` | exit 0 ×2; 6/6 assets idénticos (`cmp`); 259 archivos, 0 `*.test.mjs`, sin `acceptance/cases` ni `pilot-gi`; `platform.json` `version v4.1.0`; con v4.0.2 → rechazo «CLI_VERSION v4.1.0; this release is v4.0.2» | PASS |
| V-54 | Tests afectados por el delta y el bump (clon) | `node --test --test-concurrency=1` de `runtime/gates`, `runtime/policy`, `runtime/release`, `runtime/migrate/ruleset-guard`, `runtime/consumer/acceptance-gate` y `runtime/cli` | gates **218/218**; policy **69/69**; release **40/40**; ruleset-guard **19/19**; acceptance-gate **4/4**; cli **71/71** | PASS |
| V-55 | Code scanning PR (R) | `code-scanning/alerts?state=open&ref=refs/pull/190/merge`; `analyses` | **5 abiertas** (#57 `code-injection` l.348; #58-#61 `untrusted-checkout`, l.201, 209, 261, 360), todas en `l3-consumer.yml`; último análisis `5f8e458`: actions 5, JS 0 | MINOR (N-60) |
| V-60 | Release-gate | `release-gate --profile PLATFORM --candidate 99cc334… --root <clon>` (antes del informe); `… --reports <scratchpad>/audit410/reports4 --root <clon>` (con este informe) | Antes: FAIL, exit 1, «no current valid PLATFORM audit report for 99cc334…» + 36 STALE (ESPERADO). Con este informe: ver §M | ESPERADO |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| **N-58** | RIESGO / CONTRADICTORIO | **MAJOR** | Con `acceptanceGovernance.required`, cualquier PR a `main` que cambie una de las 23 rutas del productor y seleccione una feature queda `ACCEPTANCE_BLOCKED` sin vía humana. `merge-gate` falla sin remedio. El texto de la razón promete «a human decides» | V-51, V-52; `verdict.mjs` `analyze` (bloque `producer`); `merge-gate.mjs` `evaluateAcceptance`/`evaluateMergeGate`; `gates.json:13-19` | Q3.4 | −1.50 |
| **N-51** | INCOMPLETO | **MINOR** (era MAJOR) | Residual del alcance obligatorio: configuración humana pendiente (U0; RF-25 en `develop`, hoy BLOCKED); camino confiable nunca ejecutado; aceptación propia BLOCKED en el SHA exacto (V-43); L3 sin consumidor real | V-43, V-46, V-48, V-49; `V4.1.0-STATE.md` «Human actions» 2-3 | Q1.4 | −0.75 |
| **N-59** | CONTRADICTORIO | MINOR | Desajustes de registro en el SHA exacto: (1) STATE dice «E2E … re-run on the final code», pero `V4.1.0-E2E-EVIDENCE.md` solo registra `59369df` (el re-run de `24d05c3` está en `9e47c2e`, fuera del objetivo); (2) STATE marca la aceptación propia PASS (11/31 casos), pero en `99cc334` da BLOCKED ×3; (3) `native-acceptance.md` llama «vacuo» al chequeo de rutas no cubiertas de 001-003, y `V4.1.0-MINOR.md` lo dispara; (4) STATE: «`CLI_VERSION` is still `v4.0.2` on this branch», en un árbol con v4.1.0 | V-43, V-44, V-03 | Q1.3 (con N-31 y N-43) | (incl. en −0.75) |
| N-31, N-43 | CONTRADICTORIO / INCORRECTO | MINOR | Heredados | — | Q1.3 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README | — | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Estrategia de pruebas | — | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Inestabilidad del host para la suite completa | ROOT-002 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates | — | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-48 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin protección | V-48 | Q6.2 | −0.375 |
| N-26, N-44 | INCOMPLETO / RIESGO | MINOR | Pilot offline; `merge-gate` sin reintento | — | Q6.3 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback | — | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Secretos no verificables por API | V-48 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 18 alertas Dependabot | V-48 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 en `main` | V-48 | Q7.3 | −0.50 (con N-60) |
| **N-60** | RIESGO | MINOR | 5 alertas CodeQL medium abiertas en `l3-consumer.yml` del PR (#57 interpolación de `head.sha` en `run:`; #58-#61 checkout del head en un workflow no privilegiado), sin triage registrado. El riesgo real es bajo: `head.sha` es hexadecimal y los jobs tienen `contents: read`, sin secretos | V-55 | Q7.3 | (incl. en −0.50) |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain | — | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | U0 sin implantar: el revisor de `ai-native-human-review` es la identidad que usan los agentes | V-48 | Q8.2 | −0.50 |

**Total abierto:** 0 BLOCKER, 0 CRITICAL, 1 MAJOR (N-58) y 22 MINOR. **Cerrado:** N-57. **Reclasificado:** N-51, de MAJOR a MINOR. **Nuevos:** N-58, N-59 y N-60.

### N-57 — Texto inline en el tier contenedor (MINOR, CERRADO)

**Corrección** (`c6f860b`): `PY_FLAG_ALLOW` sin `-m`; `-m` solo `pytest`/`unittest` (`PY_MODULES`); allowlists `PYTEST_FLAG_ALLOW` y `UNITTEST_FLAG_ALLOW`; `--junitxml` solo al token `{resultFile}`; `data:`/`https:` también para python. Regresión en `contract.test.mjs`. **Verificación de cierre (la del informe anterior):** V-37 con todos los casos REFUSED → cumplida en V-50 (26 casos). Observación no puntuada: `python3 tests/run.py <args>` admite cualquier argumento tras un script del repositorio; es código del repositorio (SUT), no texto inline, coherente con RF-8.

### N-58 — Bloqueo sin salida del veredicto de aceptación ante cambios del productor (MAJOR, nuevo)

**Descripción.**

* `analyze` (`verdict.mjs`) calcula `producerChanges(base, head)` cuando hay alguna feature seleccionada. Si difiere, la clausura es BLOCKED con la razón «… cannot close acceptance; a human decides».
* `evaluateAcceptance` (`merge-gate.mjs`) convierte BLOCKED en `ACCEPTANCE_BLOCKED`. La doc lo declara: «FAIL and BLOCKED never clear». `evaluateMergeGate` solo deja pasar al humano los códigos `HUMAN_REVIEW_REQUIRED` y `ACCEPTANCE_HUMAN_REVIEW`.
* `gates.json` `acceptanceGovernance.required: true` hace del veredicto parte de `ai-native/merge-gate`, que es un check requerido del ruleset de `main`.
* Los planes propios declaran como entradas `runtime/`, `.github/workflows/`, `contracts/`, etc. (`generate-plans.cjs:22`), así que todo cambio de plataforma selecciona 001-003.

**Consecuencia:** cualquier PR a `main` que toque `ci.yml` o uno de los 22 módulos de la superficie (V-51) no puede fusionarse por el camino gobernado. Eso incluye:

* un bump de una acción en `ci.yml`;
* cualquier corrección de `runtime/acceptance`, de `runtime/circuit/review-ledger.mjs`, de `sdd-workflow.mjs` o de `policy/hitl.mjs`;
* el PR de release que lleve esos cambios.

La salida es alterar el ruleset o la configuración de BASE fuera del camino gobernado. V-52 lo demuestra con una aprobación humana válida: sigue BLOCKED.

**Por qué ocurre.** 002 RF-31 pide que la evidencia de cierre venga de la CI «with the trusted platform revision's runner». `ci.yml` `acceptance-closure` ejecuta el `ci-closure.mjs` de la candidata, y el BLOCKED por productor cambiado compensa esa desviación. En consumidores, `l3-consumer.yml` sí ejecuta el productor de la revisión confiable (commit del lock de BASE).

Hoy está **latente**: el `merge-gate.yml` de `main` no tiene aceptación (V-49), así que el PR de release de v4.1.0 no se ve afectado. Se activa en el primer PR posterior que toque la superficie.

En consumidores existe la misma clase de problema, más acotada: un PR que cambia su workflow caller (por ejemplo, el bump del SHA de `l3-consumer.yml` en un upgrade) y además selecciona una feature queda BLOCKED de forma permanente (`acceptance-gate.test.mjs:103`).

**Causa raíz.** ROOT-012 (nueva): el productor del cierre de la fábrica es código de la candidata, y su desviación respecto de BASE se trata como un fallo duro en lugar de como un hallazgo de gobernanza.

**Corrección mínima suficiente (una de estas dos):**

* (a) Ejecutar el productor del cierre desde la revisión BASE, como RF-31 y como ya hace `l3-consumer.yml`: checkout del código de `main` en otro directorio, que corre los casos de la candidata en su checkout. Entonces `producerChanges` pasa a afectar solo a `ci.yml`.
* (b) Mapear «producer differs» a un hallazgo `PRODUCER_CHANGED` → NEEDS_HUMAN, aprobable en `ai-native-human-review` y ligado al SHA, en lugar de BLOCKED.

En ambos casos: un test en `gates.test.mjs`/`verdict.test.mjs` con un cambio de `ci.yml` que termina en una vía humana, y la razón alineada con el comportamiento.

**Verificación de cierre:** V-52 con `humanReviewed=true` y aprobación válida → `ACCEPTANCE_APPROVED`, o bien PASS/NEEDS_HUMAN por (a).

**Puntos recuperables:** +1.50.

### N-51 — Alcance obligatorio de v4.1.0 (MINOR residual; era MAJOR)

**Completado y verificado en este tramo** (decisión humana: completar):

* L3 de aceptación en consumidores (`5a407f4`, `4052659`);
* piloto GI (`974599d`..`4ecf0fd`; V-47);
* aceptación propia de 001-003 (`255ca09`, `ff28a82`; V-42, V-44, V-46);
* RF-17/18 (`dd95b70`);
* veredicto confiable en `merge-gate.yml` sin tercer titular (`4c9fa88`; `gates.test.mjs` y `secret-exposure.test.mjs` verdes en local y en CI);
* RF-32 en el merge (`f49f5b1`);
* anclas y `CLOSURE_NOT_ISOLATED` (`72d4f1a`).

**Sigue pendiente (no lo presumo):**

1. Configuración humana: U0, es decir, separación de identidad. El revisor del Environment es hoy la identidad compartida (V-48). Falta también la cobertura de `develop`, que exige RF-25 «on every protected target branch»: `develop` no tiene protección ni veredicto, y se reporta BLOCKED, como manda el propio spec.
2. El camino confiable no se ejecutó nunca. Solo puede verificarse tras el merge a `main` (V-49).
3. En el SHA exacto, la aceptación propia local da BLOCKED ×3 por `governance/versioning/V4.1.0-MINOR.md`. `governance/versioning/**` no está en `nonSutPaths` ni en las entradas declaradas. En la CI, la clausura de la propia candidata nunca puede cerrar por diseño (productor cambiado, V-46).
4. El L3 de aceptación no se ha ejecutado en un consumidor real.

**Corrección mínima suficiente:**

* los pasos humanos 2-3 de `V4.1.0-STATE.md`;
* añadir `governance/versioning/**` a `nonSutPaths`: está permitido por RF-34 (raíz `governance/`, no es plano de control), pero ampliar el non-SUT es un DOWNGRADE que exige aprobación humana. La otra opción es declararlo como entrada;
* tras el merge a `main`, un PR de prueba que ejercite `acceptance-analyze` → check publicado.

**Verificación de cierre:**

* `sdd acceptance status` PASS ×3 en el SHA de release;
* un run de `acceptance-analyze` con `ai-native/acceptance-governance` publicado;
* el registro U0 y la decisión sobre `develop`.

**Puntos recuperables:** +0.75.

### N-59 — Desajustes de registro en el SHA de release (MINOR, nuevo)

Ver la tabla. **Corrección:**

* sincronizar `V4.1.0-STATE.md` con lo que el árbol prueba en el SHA de release: E2E de `24d05c3` incluido, `CLI_VERSION`, y aceptación propia por SHA;
* corregir la frase «vacuous» de `native-acceptance.md`.

Comparte criterio con N-31 y N-43 (Q1.3); no resta por separado.

### N-60 — Alertas CodeQL nuevas en `l3-consumer.yml` (MINOR, nuevo)

* **#57**: `${{ github.event.pull_request.head.sha }}` interpolado en un `run:` (`acceptance-human`). Pasarlo por `env:`.
* **#58-#61**: checkouts del head en `acceptance-closure`/`analyze`. Son por diseño: sin credenciales y con `contents: read`. Requieren un triage documentado (dismiss justificado) o una reestructuración.

Comparte criterio con F-008 y CodeQL #27 (Q7.3).

### Heredados

Descripciones en `AUDIT-PLATFORM-cad1053.md` §H.

* Verificados en vivo (V-48): F-005, N-25, N-32 (18), F-008, CodeQL #27, F-007 y N-40.
* Los demás, por diff vacío sobre su área.
* N-29/N-27 sigue vivo: la suite de acceptance tardó 16 min en local, y `review-ledger` sigue fuera del alcance local.

### H.1 Sugerencias (no restan puntos)

* S-1..S-54 heredadas.
  * **S-45** sigue: `SESSION-CONTEXT.md` no registra la candidata.
  * **S-50** se actualiza: las correcciones de la tercera revisión (`72d4f1a`, `4052659`, `ff28a82`) no pasaron por una cuarta revisión aislada. N-58 es justo una interacción entre N5 (2.ª revisión) y la integración en `merge-gate` (`4c9fa88`).
* **S-55 retirada:** ya no hay titular sin checkout; solo quedan 2 titulares.
* **S-56 (nueva).** `merge-gate.yml` `acceptance-analyze` espera hasta 45 min a la CI (`deadline 2700`), mientras `merge-gate` tiene `timeout-minutes: 40` y `WAIT_SECONDS 1800`. La suma de esperas en serie puede superar la paciencia del revisor. Conviene medirlo en el primer run real.
* **S-57 (nueva).** La política MINOR («new gates start in warn mode») frente a la aceptación bloqueante está declarada como tensión para el humano en `V4.1.0-MINOR.md`. Conviene registrar la decisión antes del tag.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2, Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite completa | N-29, N-27 | Q5.3 |
| ROOT-003 | Agentes, auditor y revisor del Environment con la identidad del propietario | N-40; condiciona N-51 (RF-25) | Q8.2 |
| ROOT-006 | API de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-010 | Seguridad del runner por listas | N-57 (cerrado) | — |
| ROOT-011 | Alcance que depende de configuración humana y de un camino solo verificable en `main` | N-51 | Q1.4 |
| **ROOT-012** | El productor del cierre de la fábrica es código de la candidata; su cambio se trata como fallo duro y no como hallazgo humano | **N-58** | Q3.4 |

## J. QUÉ SOBRA

| Elemento | Acción | Motivo |
|---|---|---|
| Bucle por `PATH` de `resolveExecutable` | SIMPLIFICAR (S-48, sigue) | Inalcanzable desde `runRunner` |
| Unión de grafos y selección por entradas duplicadas (`ci-closure.mjs` / `verdict.mjs`) | UNIFICAR (S-54) | Una sola fuente para productor y analizador |

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

N-58, N-51, N-59 y N-60 (§H), más los 19 MINOR heredados (`AUDIT-PLATFORM-cad1053.md` §K/§O).

### MEJORAS OPCIONALES

S-1..S-54, S-56 y S-57. No restan puntos.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto | Cómo verificarlo |
|---|---|---|---|
| CI del SHA exacto `99cc334` | Sin PR ni run (rama de release) | Mitigado: `ff28a82` y `24d05c3` en verde; tests del bump en local (V-54) | Abrir el PR de release a `main` (paso humano 2 de `V4.1.0-MINOR.md`) |
| `acceptance-analyze` y el veredicto publicado | Solo corre desde `main` | Dentro de N-51 | Tras el merge: PR de prueba a `main` |
| L3 de aceptación en un consumidor real | Ningún consumidor configurado | Dentro de N-51 | Consumidor con `acceptance-environment` y `acceptance-reviewers` |
| Tier `container` | Sin contenedores en el host | Ninguno puntuado (los argv se verificaron con la sonda) | Host con Docker/Podman |
| `review-ledger.test.mjs`, `consumer/l3.test.mjs` | Excluidos por instrucción | Ninguno (CI 58/58 ×2 SO en `ff28a82` y `24d05c3`) | — |
| Independencia del auditor | Identidad compartida (U0 PENDING) | Confianza MEDIA; auditoría aislada, NO ATESTADA | U0 |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0)
G2 CRITICAL: PASS (0)
G3 VERIFICACIÓN ESENCIAL: PASS (build reproducible V-53; validadores V-05..V-20; tests locales V-41, V-54;
   CI principal success ×2 SO en los commits de código idéntico ff28a82 y 24d05c3, V-45; nada falló durante
   la auditoría. La aceptación propia BLOCKED (V-43) es un estado de gobernanza del producto, no un fallo de la
   suite principal, el build ni la CI)
```

El método 1.2 (`QUALITY_SCORE.md` §22-§23) solo define G1-G3. Los «G1-G6» de `V4.1.0-STATE.md` son garantías de producto, no Quality Gates de la auditoría. Ningún gate limita la nota, así que final = bruto = 88.25.

### M.1 Resultados de V-54 y V-60

**V-54, tests locales del clon (`--test-concurrency=1`):**

| Suite | Resultado |
|---|---|
| `runtime/gates` | 218/218 |
| `runtime/policy` | 69/69 |
| `runtime/release` | 40/40 |
| `runtime/migrate/ruleset-guard` | 19/19 |
| `runtime/consumer/acceptance-gate` | 4/4 |
| `runtime/cli` (cubre el bump de `CLI_VERSION`) | 71/71 (26 min) |

Todo con 0 fail. Recuento por caso de la aceptación propia en `99cc334`: 001 11 PASS + 1 BLOCKED (ruta); 002 31 PASS + 1 BLOCKED; 003 16 PASS + 1 BLOCKED. Ningún FAIL.

**V-60, release-gate con este informe:** `release-gate --profile PLATFORM --candidate 99cc334… --reports <scratchpad>/audit410/reports4 --root <clon>` → **`PASS_WITH_WARNINGS`**, exit 0 («score 88.25 is below 90 but within the 2-point tolerance»). El front matter se acepta.

* Es uso de release y nunca gate de merge (`isMergeGate: false`). No forma parte de la nota.
* El humano debe pesar que N-58 es un MAJOR abierto: con él, la plataforma se bloquea a sí misma tras v4.1.0.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 88.25

N-58 (Q3.4)                          → +1.50  (→ 89.75)
N-51 (Q1.4)                          → +0.75  (→ 90.50 junto con N-58)

N-31, N-43, N-59 (Q1.3)              → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 (Q5.3)                    → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26, N-44 (Q6.3)                    → +0.75
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27, N-60 (Q7.3)       → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 1.50 + 0.75×9 + 1.00 + 0.50×5 = 1.50 + 6.75 + 1.00 + 2.50 = 11.75
88.25 + 11.75 = 100.00
```

## O. PLAN DE REMEDIACIÓN

1. **MAJOR, N-58** (+1.50). Productor del cierre desde BASE en `ci.yml` (opción a), o «producer differs» → NEEDS_HUMAN (opción b), con su test. Toca `.github/workflows/**`, `runtime/acceptance/**` y `runtime/gates/**`, que son plano de control: requiere revisión humana. Debe entrar **antes** de que v4.1.0 llegue a `main`. Si no, el primer PR que lo corrija se bloqueará a sí mismo: toca la superficie del productor.
2. **MINOR, N-51** (+0.75). `governance/versioning/**` en `nonSutPaths` (o como entrada) con aprobación humana del DOWNGRADE; pasos humanos U0 y `develop`; ejercicio del camino confiable tras el merge.
3. **MINOR, N-59 y N-60.** Sincronizar STATE y doc; triage de las alertas #57-#61 (`env:` para `head.sha`).
4. **MINOR heredados**, en el orden de `AUDIT-PLATFORM-cad1053.md` §O.

Cualquier commit fuera de `.audit/**` deja este informe STALE.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 1 MAJOR y 22 MINOR, y la confianza es MEDIA. Para el umbral PLATFORM 90 con tolerancia 2, `99cc334` **queda en 88.25**: no alcanza 90, pero está dentro de la tolerancia.

Este tramo hace real casi todo N-51:

* piloto GI ejecutado ×3 runs;
* aceptación propia de 001-003 con 58 casos;
* L3 de aceptación para consumidores;
* RF-17/18;
* veredicto confiable sin un tercer titular de clave.

Cierra además N-57. A cambio, la integración del veredicto en `merge-gate` introduce un bloqueo sin salida para la evolución de la propia capa de aceptación y de su CI (N-58). Sigue pendiente el paso humano: U0, la cobertura de `develop` y la primera ejecución real en `main`.

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 88.25 + 11.75 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay)
[x] Los Quality Gates derivan de hallazgos reales (ninguno activo)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 2.25 + 2.25 | 10.50 |
| Q2 | 3 + 3 + 3 + 3 | 12.00 |
| Q3 | 3 + 3 + 3 + 1.50 | 10.50 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 3.00 + 3 + 2.25 | 13.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 1.50 | 14.00 |
| Q7 | 2.25 + 1.50 + 1.50 + 2.00 + 2.25 | 9.50 |
| Q8 | 2 + 1.50 + 1.50 + 2 | 7.00 |
| **Total** | | **88.25** |

**Divergencia con `4417d96` (88.50): −0.25.**

| Subcriterio | Cambio | Puntos | Causa |
|---|---|---:|---|
| Q1.4 | PARCIAL → MENOR | +0.75 | N-51: alcance de código completo y verificado (V-42..V-47); queda el paso humano y la ejecución en `main` |
| Q7.4 | MENOR → COMPLETO | +0.50 | N-57 cerrado (V-50) |
| Q3.4 | COMPLETO → PARCIAL | −1.50 | N-58 nuevo (V-51, V-52) |

### Riesgos residuales

* **R-1 (ALTO).** ROOT-003: mientras U0 siga pendiente, la aprobación de `ai-native-human-review` puede venir de un proceso con la identidad del propietario. Esta auditoría es aislada, no atestada.
* **R-2 (ALTO, condicionado).** N-58: si v4.1.0 llega a `main` sin corregirlo, la primera corrección de la capa de aceptación o de `ci.yml` solo podrá fusionarse alterando el ruleset.
* **R-3.** `develop` sin protección (N-25): #190 puede fusionarse sin el veredicto confiable, porque RF-25 en `develop` queda BLOCKED solo como reporte.
* **R-4.** El veredicto confiable nunca se ejecutó. Su primera ejecución real será en `main`, ya con la clave de la App.
* **R-5.** El código de casos de la candidata corre en el job productor en tier `restricted`. Las anclas y `CLOSURE_NOT_ISOLATED` lo acotan y lo elevan a decisión humana, pero no lo aíslan.

```text
AUDITED_SHA: 99cc334bc24870fd689de8f26527c6d62ffd5173
SCORE: 88.25/100 (bruto = final; sin N/A; ningún gate activo)   PREVIOUS: 88.50 (4417d96)
BLOCKER: 0  CRITICAL: 0  MAJOR: 1 (N-58)  MINOR: 22 (19 heredados + N-51 reclasificado + N-59, N-60)   CERRADOS: N-57
DELTA: 4417d96..99cc334, 19 commits, 51 archivos, +6454/-352
LOCAL: 16 validadores + audit check exit 0; acceptance 97/98 (1 skip); gates 218/218; policy 69/69; sdd validate full ×3 exit 0;
       aceptación propia 001 PASS en ff28a82, BLOCKED ×3 en 99cc334 (ruta no cubierta); sonda argv 26/26 conforme (N-57);
       bloqueo por productor reproducido (N-58)
CI ff28a82 (45775994945) y 24d05c3 (45778579029): success, validators 58/58 ×2 SO, acceptance-closure 8/8; 99cc334: sin runs
PILOTO GI: PASS ×3 runs (4ecf0fd, ff28a82, 24d05c3), 12/12 ×2 cada uno, imagen por digest
CODEQL PR #190: 5 alertas abiertas en l3-consumer.yml (N-60)
BUILD: reproducible v4.1.0 (6/6, 259 archivos, sin código de solo-tests)
UMBRAL PLATFORM 90 (tolerancia 2): NO ALCANZA 90 (−1.75); DENTRO DE LA TOLERANCIA (88.25 ≥ 88)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA (aislada, NO atestada; U0 PENDING)
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
