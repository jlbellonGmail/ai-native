---
targetRepo: jlbellonGmail/ai-native
targetCommit: f6d026fa05f2cc4ad55d5395c48a95241d3e183e
platform:
  version: "v4.1.0 candidate (release/v4.1.0-r3, CLI_VERSION v4.1.0)"
  commit: f6d026fa05f2cc4ad55d5395c48a95241d3e183e
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-28T06:15:00Z"
scope: "Independent read-only PLATFORM 1.2 re-audit of the v4.1.0 MINOR release candidate f6d026f (branch release/v4.1.0-r3; feature head f043675 = PR #190 draft to develop) over the delta 71dff99..f6d026f (11 commits, 15 files, +918/-11; diff read in full): the F-006 fix under spec 003 RF-22/AC-7/T8 (runtime/bootstrap/install.mjs canonical() key list, four RF-22 tests in bootstrap.test.mjs, own-acceptance cases I-17/I-18, generator and 003 plan.json, the three spec 003 files), the governance records (STATE, F006 plan delta, sixth independent review, E2E reuse note, archived AUDIT-PLATFORM-71dff99.md and README row), V4.1.0-MINOR.md (r3, F-006, RESTART_REQUIRED) and the removal of the inherited .audit/reports/AUDIT-PLATFORM-71dff99.md. Scope authority verified live (PR #191 review 6095462910, COMMENTED, jlbellonGmail, commit_id e7ee28b; spec blobs at f6d026f equal e7ee28b's). F-006 judged on evidence: RF-22 tests in a frozen clone of f6d026f and, as regression, with install.mjs of 3c01335; every lock writer read; bootstrap and migrate suites file by file. Every other open finding of AUDIT-PLATFORM-71dff99.md (89.75) re-verified: N-51 by the own acceptance run independently x3 vs develop and x3 vs main in the clone; N-32, N-60, CodeQL #27, F-005, N-25, N-40 and the Environments live; the rest by an empty diff over their area (reuse stated in the ledger). Validators, audit check, sdd validate x3, two fresh builds and release-gate on the clone. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the change; same Windows and GitHub identity as the builder (U0 PENDING, N-40, ROOT-003): isolated, NOT attested. No fix, commit, push, PR comment or review, merge, tag, release, workflow dispatch, alert dismissal, setting change or Environment approval."
score: 90.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata de release v4.1.0 MINOR, re-auditoría de f6d026f)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público; rama por defecto main)
Ruta:               D:\proyectos\ai-native-rel410r3 (solo lectura) + clon congelado de f6d026f en
                    <scratchpad>/audit410r3/clone (fuera del repositorio; core.longpaths=true)
Branch:             release/v4.1.0-r3 (= origin/release/v4.1.0-r3 = f6d026f, git ls-remote), sin PR propio.
                    PR #190 (feature/native-acceptance-v4.1.0 → develop): OPEN, DRAFT, head f043675 (= refs/pull/190/head)
                    PR #191 (propuesta F-006, base feature): OPEN, DRAFT, head e7ee28b, sin merge
Commit:             f6d026fa05f2cc4ad55d5395c48a95241d3e183e (git rev-parse HEAD del worktree y del clon; ambos limpios)
Delta auditado:     71dff99..f6d026f, 11 commits, 15 archivos, +918/−11 (leído entero):
                    6d1a1c3 (F-006: canonical() + tests RF-22 + I-17/I-18 + specs 003), 3036727 (STATE nombra r3),
                    7758e3c (sexta revisión R6-1..R6-7), 4497e99 (confirmación de la sexta revisión), f043675 (informe
                    71dff99 archivado; registro del BLOCKED de f78a068), e88de8f (informe 71dff99 en .audit, heredado de r2),
                    26379fd/7bdc29e/677c2e4 (merges en r3), f78a068 (V4.1.0-MINOR.md r3), f6d026f (retira el informe
                    heredado de .audit/reports; MINOR anota RESTART_REQUIRED)
Código cambiado:    runtime/bootstrap/install.mjs (1 línea de la lista de claves + 1 de comentario), bootstrap.test.mjs
                    (+85), acceptance/cases/003-*.cases.mjs (+16), generate-plans.cjs (+3), 003 plan.json (+68)
Fuera de alcance:   0 archivos en .github/, contracts/, audit/, runtime/audit, runtime/acceptance, runtime/gates
Código idéntico:    git diff f043675 f6d026f = V4.1.0-MINOR.md + la línea CLI_VERSION
Ascendencia:        origin/main d08531e, origin/develop 15548c1, 71dff99, 3c01335 y f043675 son ancestros de f6d026f
Baseline:           AUDIT-PLATFORM-71dff99.md (89.75; archivado en el árbol objetivo, byte a byte idéntico al emitido)
Autoridad F-006:    PR #191, review 6095462910 (COMMENTED, jlbellonGmail, commit_id e7ee28b, 2026-11-28T03:33:21Z)
Tag:                ninguno; v4.1.0 libre
Fecha:              2026-11-28 (UTC ~04:50-06:15)
Worktree:           clon limpio al empezar y al terminar
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2; sin diff en audit/, contracts/ ni runtime/audit)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente de contexto aislado, solo lectura. No escribió el cambio.
                    MISMA identidad de Windows y de GitHub que el Builder (U0 PENDING; N-40, ROOT-003): auditoría
                    AISLADA, NO ATESTADA. No aprobó ningún Environment, no comentó ni revisó PRs, no descartó alertas.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, gh 2.97.0 (solo lectura); sin runtime de contenedores
Temporales:         <scratchpad>/audit410r3: clone/ (congelado), reg/ (copia desechable para la regresión y el
                    release-gate), builds/b1, builds/b2, logs/, scripts/, reports/
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 90.25/100
Score final: 90.25/100
Quality Gate aplicado: ninguno (G1, G2 y G3 PASS)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94 «Muy buen nivel»; 21 MINOR abiertos)
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88):** **alcanza 90 (+0.25)**. `release-gate`: ver V-80. Hay 0 BLOCKER, 0 CRITICAL y 0 MAJOR. Quedan **21 MINOR**: 18 heredados, N-51 y N-60 residuales y **N-62 (nuevo, sin efecto en la nota)**. Sin N/A. **Cerrado: F-006.**

**F-006 CERRADO, verificado (Q6.6 MENOR → COMPLETO, +0.50).** No lo cierro porque el Builder lo diga, sino por:

* **Código.** `canonical()` (`install.mjs:45-56`) emite ahora las 8 claves de primer nivel de `contracts/lock.schema.json` en su orden (`schemaVersion`, `platform`, `profiles`, `productDir`, `governance`, `mcpProfiles`, `packs`, `overrides`) y las 5 de `platform`. El esquema tiene `additionalProperties: false` en los dos niveles, así que no queda ningún campo admitido que pueda perderse. `rollback()` sigue validando el lock con `readLock` (`:236-237`) **antes** de tomar el lock de estado, y solo después escribe `canonical(next)` (`:263-264`).
* **Tests en el clon (V-81).** Los 4 tests RF-22 pasan: rollback tras upgrade conserva `productDir`, `governance` y todo campo no-`platform`, y el lock resultante valida; un lock fuera del esquema (`notInSchema`, `productDir: "../escape"`) se rechaza con los bytes del lock y el estado de caché intactos; `canonical()` de un lock sin los dos campos es byte a byte igual a la serialización anterior; y el test derivado del esquema obliga a que un campo nuevo del esquema no se pierda en silencio.
* **Regresión (V-82).** Con el `install.mjs` de `3c01335` en una copia desechable fallan 3 de 4 (preservación, orden de claves, claves del esquema). El de rechazo pasa también en el código viejo: esa ruta ya era correcta, como dice STATE.
* **Suites (V-83).** `runtime/bootstrap/*.test.mjs` y `runtime/migrate/*.test.mjs`, archivo por archivo y en secuencia: **175/175**, 0 fallos (174 en `6d1a1c3` + el test RF-22 añadido en `7758e3c`).
* **Otros escritores del lock (V-87).** `init()` y `migrate.mjs:133` construyen locks sin `productDir`/`governance` y pasan por `canonical()`: su salida no cambia (test 3). `planBump` (`bump.mjs:42`) serializa el lock entero con `JSON.stringify`, no usa `canonical()`. `detach` reescribe los bytes originales. El único hash de los bytes del lock es el del journal de `migrate apply` (`migrate.mjs:207`), que `migrate revert` usa para decidir si borra el lock o lo conserva por editado (`:268`). Lo calcula sobre la salida de `canonical()` de un lock sin `productDir`/`governance`, que no cambia (test 3). La propiedad por hash del upgrade excluye el lock (`NON_PROJECTION`, `journals.mjs:15`).
* **Riesgo nuevo valorado: `RESTART_REQUIRED`.** El blob de `install.mjs` era `240ed10` desde v3.4.2 hasta `71dff99` (comprobado en los 5 tags y en `d08531e`); ahora es `73072c6`. Por eso el primer `ai-native sync` a v4.1.0 sobre una caché que tenía activa una versión anterior avisa `RESTART_REQUIRED` (`install.mjs:196`): `PASS_WITH_WARNINGS`, salida no estricta, y `core/kernel.md` paso 4 pide reiniciar la sesión. En el L3 de CI la caché es nueva por ejecución (`$RUNNER_TEMP`), así que `previous` es nulo y no se dispara. `ai-native upgrade` descarta los avisos de `sync` (`upgrade.mjs:127-128`), pero el motor de upgrade ya corre desde el bundle destino (`upgrade.mjs:1-2`). Es el comportamiento diseñado ante un cambio del bootstrap, ya documentado en `V4.1.0-MINOR.md` y STATE (R6-1). No lo puntúo; dejo dos sugerencias (S-63, S-64).

**Alcance del cambio F-006: dentro de lo autorizado.** La review `6095462910` (COMMENTED, `jlbellonGmail`, `commit_id` `e7ee28b`) autoriza «únicamente esa enmienda y su implementación». Los blobs de `spec.md`, `plan.md` y `tasks.md` en `f6d026f` son los de `e7ee28b` (`10dc7ef`, `7c834e5`, `6fbc346`). El código toca solo lo que la sección 4 de la propuesta describe; no toca otros escritores del lock, ni la transacción de upgrade, ni `planBump`, ni gates o umbrales. `hitl.mjs --base 71dff99` da para `003` `risk high, human_gate required`: el gate humano existe y es esa decisión registrada (NO atestada por U0).

**N-51 sigue en MINOR (residual).** La aceptación propia da PASS ×3 frente a `develop` y PASS ×3 frente a `main` en mi clon de f6d026f (V-64, V-65), con I-17 e I-18 PASS. Sigue pendiente lo humano: U0; `develop` (RF-25); `prevent_self_review` (hoy `false`); la aceptación del bootstrap y de las desviaciones RF-30/RF-31; el canary desde `main`; el L3 en un consumidor real. Q1.4 se mantiene MENOR.

**N-62 (nuevo, MINOR, sin efecto en la nota).** La cabecera de `V4.1.0-STATE.md` (líneas 14-15, de `3036727`) dice que el informe `71dff99` «stays under `.audit/reports/` on r2/r3». En `f6d026f` ya no está en r3: lo retira el propio `f6d026f`, y la sección «F-006 validation» y la fila del README lo dicen. Es una contradicción interna del registro de estado. Va a Q1.3, que ya es MENOR por N-31 y N-43 (mismo criterio que N-61 en `47c52a1`).

**Registro del BLOCKED de `f78a068`: veraz.** El log del Builder (`<scratchpad>/r3/acc-r3.log`) da `ACCEPTANCE: BLOCKED` ×6, siempre y solo por `path:.audit/reports/AUDIT-PLATFORM-71dff99.md`, I-17/I-18 PASS en los dos 003, `dirty-after=0`. La causa es la que STATE describe (`feature.mjs:229-230`: la ruta no es entrada de ningún caso ni está en `nonSutPaths`). El arreglo no debilita el control: no cambia `validation-contract.json` ni el código de aceptación (0 archivos en `runtime/acceptance`, `acceptance/validation-contract.json`).

**Sensibilidad respecto de 90.25:** +0.25 sobre el umbral. Cualquier pérdida de 0.50 o más (por ejemplo, un MINOR nuevo en un subcriterio hoy COMPLETO) lo bajaría de 90, aún dentro de la tolerancia.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado (leído entero):**

* el log y el diff completo de `71dff99..f6d026f` (15 archivos), incluidos `V4.1.0-F006-PLAN-DELTA.md`, la sexta revisión y la nota de reutilización E2E;
* `runtime/bootstrap/install.mjs` entero y los escritores/lectores del lock (`bump.mjs`, `migrate.mjs`, `upgrade.mjs`, `detach.mjs`, `journals.mjs`, `tracking.mjs`);
* el cálculo de rutas no cubiertas (`feature.mjs`, `evidence.mjs`, `contract.mjs`) y del veredicto (`verdict.mjs`), para juzgar el BLOCKED de `f78a068`.

**Ejecutado en el clon de f6d026f** (§G):

* tests RF-22 (objetivo y regresión con el `install.mjs` de `3c01335`, en copia desechable);
* suites de `runtime/bootstrap` y `runtime/migrate`, archivo por archivo;
* el generador de planes (reproduce los planes del árbol);
* 16 validadores y `audit check`; `hitl.mjs` frente a `15548c1` y frente a `71dff99`; `sdd validate --level full` ×3;
* `sdd acceptance run` ×6, con base `15548c1` y con base `d08531e`, en secuencia;
* 2 builds nuevos;
* `release-gate` ×3 (sin informe; con este informe en `.audit/reports/` de la copia desechable, sin commit; con `--reports` apuntando solo a este informe) y `pretag --tag v4.1.0` en la copia desechable (lecturas git, `ls-remote` y `gh`; no crea nada);
* lectura remota: PR #190 (checks, runs por commit, cuerpo), PR #191 (reviews), code scanning, Dependabot, secret scanning, rulesets y Environments.

**Reutilizado por diff vacío** (`git diff --name-only 71dff99 f6d026f` fuera de `governance/**`, `specs/003-*` y los 5 archivos de F-006 = 0): workflows, contratos, `runtime/acceptance`, `runtime/gates`, `runtime/consumer`. Valen por ello V-61 (dirigidos 30/30, gates 218/218), V-71 (regresión R5-8) y V-73 (citas) de `AUDIT-PLATFORM-47c52a1.md`; no los re-ejecuté.

**No verificable:**

* la CI del SHA exacto `f6d026f`: sin PR, 0 runs (V-67);
* el veredicto confiable en ejecución real: corre desde `main`;
* el L3 de aceptación en un consumidor real; un `sync` real de v4.0.2 a v4.1.0 en un consumidor (el `RESTART_REQUIRED` lo deduzco del código y del cambio de blob);
* el tier `container`;
* Codex, OpenCode y F-007;
* que el texto de la review `6095462910` lo escribiera el humano y no un agente con su credencial (U0).

## D. CONTRATO DETECTADO

Igual que en `AUDIT-PLATFORM-47c52a1.md` §D (C-24..C-27 incluidos), más:

| ID | Contrato | Estado |
|---|---|---|
| C-28 | 003 RF-22 / AC-7 / T8: `ai-native rollback` cambia solo `platform.version`, `platform.commit` y `platform.digest` y conserva todo otro campo admitido por `contracts/lock.schema.json`; un lock inválido se rechaza sin tocar el lock ni el estado de caché | Implementado y probado (V-81, V-82, V-64/V-65 con I-17/I-18). T8 sigue `[ ]` en `tasks.md`, como T1-T7: el estado vive en STATE |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 10.50 | MENOR (N-51 residual, N-31, N-43, N-62) |
| Q2 Reutilización | 12 | 12.00 | COMPLETO |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-29, N-27, N-24, F-003, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.50 | MENOR (F-005, N-25, N-26, N-44) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, N-60 residual, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.00 | MENOR (N-40, F-005) |
| **TOTAL** | **100** | **90.25** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | V-84, V-85 | — | La ampliación de 003 tiene decisión humana registrada y blobs idénticos a los aprobados |
| Q1.2 | Capacidades presentes | 3 | COMPLETO | 3.00 | V-64, V-65, V-81 | — | |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | V-88 | N-31, N-43, N-62 | N-31 y N-43 sin diff; N-62 nuevo en la cabecera de STATE |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | MENOR | 2.25 | V-64, V-65, V-69 | N-51 (residual) | Aceptación propia frente a `develop` y a `main`; el paso humano sigue pendiente |
| Q2.1-Q2.4 | Reutilización | 12 | COMPLETO | 12.00 | V-70 | — | |
| Q3.1-Q3.4 | Arquitectura | 12 | COMPLETO | 12.00 | V-87 | — | El arreglo reutiliza `canonical()`, sin serializador nuevo |
| Q4.1-Q4.5 | Documentación | 12 | — | 11.25 | — | N-11 | Sin cambios (Q4.2 MENOR) |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-05..V-21 | — | 16 validadores, `audit check` y `sdd validate` ×3: exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | — | N-24, F-003 | |
| Q5.3 | Pruebas pasando | 4 | MENOR | 3.00 | V-67, V-81, V-83 | N-29, N-27 | CI de `f043675` success (13 checks). Local 175/175 en secuencia. Una corrida combinada agotó mi propio límite de 1200 s sin fallos (V-83). Sin CI del SHA exacto |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | V-82; V-71 de 47c52a1 | — | Los tests RF-22 discriminan contra el código viejo |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | — | F-004 | |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | r3 nace de `e88de8f` por merges; r2 sigue en `e88de8f`; sin reset ni force push |
| Q6.2 | Protección | 3 | MENOR | 2.25 | V-69 | F-005, N-25 | Sin cambios en vivo |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-67 | N-26, N-44 | |
| Q6.4 | Versionado | 3 | COMPLETO | 3.00 | V-04 | — | `V4.1.0-MINOR.md` nombra r3, F-006 y `RESTART_REQUIRED`; `CLI_VERSION v4.1.0` |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-70 | — | |
| Q6.6 | Compatibilidad | 2 | **COMPLETO** | **2.00** | V-81, V-82, V-83, V-87 | — | **F-006 cerrado**. Rollback conserva todo campo del esquema; locks sin esos campos, byte a byte iguales; `RESTART_REQUIRED` documentado y propio de un cambio de bootstrap |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-69 | F-007 | Secret scanning: 0 abiertas |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-74 | N-32 | 18 alertas: 11 en `template/` y 7 en `foundation/` |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-66, V-69 | F-008, CodeQL #27, N-60 (residual) | |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-81 | — | El rechazo del lock inválido sigue antes de cualquier escritura |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | — | F-009, F-010 | |
| Q8.1 | Fuente única | 2 | COMPLETO | 2.00 | — | — | |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | V-69 | N-40 | |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-69 | F-005 (CAUSA RAÍZ COMPARTIDA) | |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-84, V-85, V-88, V-89 | — | Decisión humana verificable por API; informe archivado idéntico; registro del BLOCKED de `f78a068` veraz |

## G. LEDGER DE VERIFICACIÓN

(A) complementaria del auditor; (R) remota; (D) reutilizada por diff vacío. Logs en `<scratchpad>/audit410r3/logs/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA | `git -C ai-native-rel410r3 rev-parse HEAD`; clon; `git ls-remote https://github.com/jlbellonGmail/ai-native.git` | `f6d026fa05f2cc4ad55d5395c48a95241d3e183e` (worktree, clon y `release/v4.1.0-r3`); `release/v4.1.0-r2` = `e88de8f`; `refs/pull/190/head` = `f043675`; `refs/pull/191/head` = `e7ee28b` | PASS |
| V-02 | Worktree | `git status --porcelain` (worktree; clon antes y después) | vacío | PASS |
| V-03 | Ascendencia (A) | `git merge-base --is-ancestor` | `d08531e`, `15548c1`, `71dff99`, `3c01335` y `f043675` son ancestros de `f6d026f`; `e7ee28b` no (la propuesta no se fusionó; sus blobs se aplicaron, V-85) | PASS |
| V-04 | Alcance (A) | `git log --graph`/`diff 71dff99..f6d026f`; `diff --name-only` por área; `git diff f043675 f6d026f` | 11 commits, 15 archivos; 0 archivos en `.github/`, `contracts/`, `audit/`, `runtime/audit`, `runtime/acceptance`, `runtime/gates`, `runtime/consumer`; `f043675..f6d026f` = `V4.1.0-MINOR.md` (+70) y `CLI_VERSION` (`v4.0.2` → `v4.1.0`) | PASS |
| V-05..V-20 | Validadores (clon f6d026f) | los 16 de `AUDIT-PLATFORM-47c52a1.md` V-05..V-20 (`hitl.mjs --base 15548c1` incluido) | exit 0 ×16. Parity 576 archivos, unmapped 0; contracts PASS; ci-tests-listed **117**; actions pinned por SHA; hitl 001-003 `human_gate required` | PASS |
| V-21 | `sdd validate --level full` ×3 | `node runtime/circuit/sdd-cli.mjs validate <slug> --level full` | PASS ×3, exit 0 | PASS |
| V-61 | Tests de aceptación/gates (D) | `AUDIT-PLATFORM-47c52a1.md` V-61 | 0 archivos cambiados en `runtime/acceptance`, `runtime/gates`, `runtime/consumer` | PASS (reutilizado) |
| V-64 | Aceptación propia frente a `develop` | Auditor (clon f6d026f): `sdd acceptance run <s> --base 15548c1` ×3, en secuencia | `ACCEPTANCE: PASS` ×3, exit 0. Revisión `sha256:1c91b85c…` (la misma del log del Builder en `f6d026f`); 001 G-01..G-11 (11), 002 A-01..A-31 (31) y 003 (18, con **I-17 e I-18**), todos PASS (~10 min) | PASS |
| V-65 | Aceptación propia frente a `main` | Auditor (clon f6d026f): `sdd acceptance run <s> --base d08531e` ×3, en secuencia | `ACCEPTANCE: PASS` ×3, exit 0. Revisión `sha256:ea151549…` (la misma del Builder); sin `uncovered` ni BLOCKED; I-17/I-18 PASS. 120 líneas de caso PASS en las 6 ejecuciones; clon limpio después (`dirty-after=0`). El ledger se escribe en el git dir del clon | PASS |
| V-66 | Code scanning PR (R) | `code-scanning/alerts?state=open&ref=refs/pull/190/merge`; `analyses` | 4 abiertas: #58, #59, #60, #61 (`actions/untrusted-checkout/medium`). Último análisis `edac6c5` (04:31Z): actions 4, JS 0 | MINOR residual (N-60) |
| V-67 | CI (R) | `gh pr checks 190`; `gh run list --commit` (f043675, 6d1a1c3, 7758e3c, 677c2e4, f6d026f) | `f043675` (head de #190): **13/13 checks pass** (CI 46107872220: `validators` ubuntu 3m36s y windows 19m56s, `acceptance-closure`; CodeQL, Trivy, SBOM, supply chain, pr-gate, dependency review, security-scan, `gi-pilot (PostgreSQL)`). `6d1a1c3` y `7758e3c`: CI **cancelled** (concurrencia, reemplazados), el resto success. `677c2e4` y `f6d026f`: 0 runs. `f6d026f` se relaciona con `f043675` por V-04 | PASS (exacto: NO VERIFICADO) |
| V-68 | HITL del delta (A) | `node runtime/policy/hitl.mjs --base 71dff99` | `PASS specs/003-acceptance-integration/spec.md: risk high, human_gate required`, exit 0. El gate humano es la decisión de V-84 | PASS |
| V-69 | Plano de control (R) | `rulesets`, `rulesets/24405506`, `rules/branches/develop`, `environments`, `secret-scanning`, `code-scanning ref=main` | `ai-native-main` activo, 0 bypass, `required_approving_review_count 0`, los mismos 6 checks requeridos, strict. 1 ruleset en total (0 de tag). `develop`: 0 reglas. `ai-native-human-review`: `can_admins_bypass false`, `prevent_self_review false`, revisor `jlbellonGmail`. Secret scanning 0. `main`: [#27] | PASS (con F-005, N-25, F-008, N-40) |
| V-70 | Build nuevo (A) | `build.mjs --version v4.1.0 --commit f6d026f… --out builds/b1`/`b2`; `sha256sum`; `tar --force-local -tzf` | exit 0 ×2; 6/6 assets idénticos entre sí (tar.gz `42cedebc…`, platform.json `cc0ccb28…` con version v4.1.0 y commit f6d026f…, `bootstrap` `{protocol 1, minCliVersion v3.2.0}` igual que en 71dff99; `ai-native-cli.mjs` `07b42957…` igual que en 71dff99); 259 archivos, misma lista que el build de 71dff99; `runtime/bootstrap/install.mjs` del bundle = blob `73072c6` (con el arreglo); 0 `*.test.mjs`; 0 `acceptance/cases`/`pilot-gi` | PASS |
| V-74 | Dependabot (R) | `dependabot/alerts?state=open` por `manifest_path` y severidad | 18: `template/pnpm-lock.yaml=11`, `foundation/pnpm-lock.yaml=7`; 1 high, 16 medium, 1 low; coincide con STATE | MINOR (N-32) |
| V-80 | Release-gate | `release-gate --profile PLATFORM --candidate f6d026f… --root <clone>` (antes); en `reg/` con este informe en `.audit/reports/` sin commit | Antes (clon): `FAIL (37 errors)`, exit 1, «no current valid PLATFORM audit report for f6d026f…» + 36 STALE (ESPERADO: el informe va en un commit encima). Con este informe en `reg/.audit/reports/` (copia desechable, sin commit): `PASS_WITH_WARNINGS (36 warnings)`, exit 0; los 36 avisos son los informes históricos STALE, ninguno de puntuación. Con `--reports <scratchpad>/audit410r3/reports --root <clone>`: `PASS`, exit 0. `pretag --tag v4.1.0` (en `reg/`, `origin/main` traído de GitHub = `d08531e`): `NOT READY`, exit 1, por no ser ancestro de `main`, 0 runs de `ci.yml` del SHA, sin informe en el árbol del candidato y `origin` local (ESPERADO antes del merge) | ESPERADO |
| V-81 | Tests RF-22 (A) | clon: `node --test --test-reporter=tap --test-name-pattern=RF-22 runtime/bootstrap/bootstrap.test.mjs` | 4/4 ok, exit 0 | PASS |
| V-82 | Regresión F-006 (A) | `reg/` = f6d026f con `install.mjs` de `3c01335`; mismo comando; archivo restaurado después | 1/4 pass, **3 fail** (tests 1, 3 y 4: campos perdidos, orden y claves del esquema); el de rechazo pasa (ruta ya correcta). `reg/` restaurado y limpio | PASS (la regresión discrimina) |
| V-83 | Suites bootstrap/migrate (A) | clon: `node --test --test-reporter=tap <archivo>` por cada uno de los 11 `runtime/{bootstrap,migrate}/*.test.mjs`, en secuencia | **175/175**, exit 0 ×11 (adopt 20, bootstrap 28, profile-infer 5, command-refs 8, journal-contract 22, migrate-v2 26, migrate 10, protection-contract 10, ruleset-guard 19, tracking 18, upgrade-delta 9; ~20 min). Una primera corrida combinada con `--test-concurrency=1` agotó mi `timeout 1200` con 148 ok y 0 not ok: límite mío, no fallo. Clon limpio | PASS |
| V-84 | Autoridad de alcance (R) | `gh api repos/jlbellonGmail/ai-native/pulls/191/reviews`; `gh pr view 191` | 1 review: `6095462910`, `COMMENTED`, `jlbellonGmail`, `commit_id e7ee28b79e201afa7ba958d8930e5e7bb3de3e14`, 2026-11-28T03:33:21Z, «APRUEBO ampliar el alcance de 003 con RF-22 / AC-7 / T8 (F-006) … únicamente esa enmienda y su implementación; no aprueba merges, release ni cambios de configuración». #191 OPEN, DRAFT, sin merge | PASS (registro de decisión, NO atestado) |
| V-85 | Blobs de la enmienda (A) | `git rev-parse e7ee28b:<f>` y `f6d026f:<f>` para `spec.md`, `plan.md`, `tasks.md` de 003 | idénticos: `10dc7ef…`, `7c834e5…`, `6fbc346…` (los de la sección 3 de la propuesta) | PASS |
| V-86 | Generador de planes (A) | `reg/`: `node acceptance/cases/generate-plans.cjs .`; `git status` | exit 0; árbol sin cambios (reproduce los planes); 003 con AC-7 → RF-22, I-17 (`pass`) e I-18 (`reject`), ambos `mandatory`, runner `spec-003` | PASS |
| V-87 | Escritores del lock (A) | lectura de `install.mjs`, `bump.mjs`, `migrate.mjs`, `upgrade.mjs`, `detach.mjs`, `journals.mjs`; `git rev-parse <tag>:runtime/bootstrap/install.mjs` | `canonical()` lo usan `rollback`, `init` y `migrate` (estos dos sin los campos nuevos); `planBump` serializa el lock entero; `detach` restaura bytes; el único hash de bytes del lock (journal de `migrate apply`, `migrate.mjs:207/268`) se calcula sobre una salida de `canonical()` que no cambia. Blob `240ed10` en v3.4.2..v4.0.2, `d08531e` y `71dff99`; `73072c6` en `f6d026f` → `RESTART_REQUIRED` en el primer `sync` (`install.mjs:196`) | PASS |
| V-88 | Informe heredado (A) | `git show e88de8f:.audit/reports/AUDIT-PLATFORM-71dff99.md`, `f6d026f:governance/…/audits/AUDIT-PLATFORM-71dff99.md`, copia emitida; `sha256sum`; `git show f6d026f:.audit/reports/…` | los tres `2dc6313f…` (blob `7ac8481`); en `f6d026f` la ruta `.audit/reports/AUDIT-PLATFORM-71dff99.md` no existe; `release/v4.1.0-r2` sigue en `e88de8f`. La cabecera de STATE (l. 14-15) dice lo contrario (N-62) | PASS (con N-62) |
| V-89 | Registro de `f78a068` (A) | lectura de `<scratchpad>/r3/acc-r3.log` y de `feature.mjs:229-230`, `contract.mjs:67-68`, `acceptance/validation-contract.json` | BLOCKED ×6 con la única razón `path:.audit/reports/AUDIT-PLATFORM-71dff99.md`; I-17/I-18 PASS ×2; `dirty-after=0`. `.audit/` no está en `nonSutPaths` ni en las raíces admisibles. Coincide con STATE «F-006 validation». El log del Builder en `f6d026f` (`acc-r3-f6d026f.log`) da PASS ×6 con las mismas revisiones que las mías (V-64, V-65) | PASS |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| **N-51** | INCOMPLETO | MINOR (residual) | Pasos humanos pendientes: U0; `develop` (RF-25), hoy BLOCKED; `prevent_self_review`; aceptación del bootstrap y de las desviaciones RF-30/RF-31. Además, el camino confiable nunca se ejecutó (canary) y el L3 no tiene consumidor real | V-64, V-65, V-69; STATE «Human decisions» 1-4 | Q1.4 | −0.75 |
| N-31, N-43, **N-62** | CONTRADICTORIO / INCORRECTO | MINOR | N-31 y N-43 heredados (sin diff). N-62 nuevo: cabecera de STATE contradice el árbol | V-04, V-88 | Q1.3 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README | — | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO / NO VERIFICADO | MINOR | Estrategia de pruebas | — | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Inestabilidad de tests propios en el host Windows (clase B según STATE) | ROOT-002 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates | — | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-69 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin protección | V-69 | Q6.2 | −0.375 |
| N-26, N-44 | INCOMPLETO / RIESGO | MINOR | Pilot offline intermitente; `merge-gate` sin reintento | — | Q6.3 | −0.75 |
| F-007 | NO VERIFICADO | MINOR | Secretos y revocaciones no verificables por API | V-69 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 18 alertas Dependabot (`template/` 11, `foundation/` 7) | V-74 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 en `main` | V-69 | Q7.3 | −0.50 (con N-60) |
| **N-60** | RIESGO | MINOR (residual) | #58-#61 abiertas; la justificación por alerta está en `SECRETS-BOUNDARY.md`; el descarte es humano | V-66 | Q7.3 | (incl. en −0.50) |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain | — | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | U0 sin implantar | V-69 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR** (18 heredados + N-51 y N-60 residuales + N-62 nuevo). Cerrado: **F-006**.

### F-006 — `canonical()` del rollback v3 omitía campos opcionales del lock (MINOR, CERRADO)

**Corrección** (`6d1a1c3`, endurecida en `7758e3c`). Lista de claves de `canonical()` en el orden del esquema, con `productDir` y `governance`; 4 tests RF-22; casos I-17/I-18 de AC-7.

**Verificación de cierre** (la que fijaba el informe anterior y la de T8): el test de regresión falla contra el `canonical()` sin arreglar y pasa con él (V-81, V-82); rollback tras upgrade conserva todo campo no-`platform` y deja un lock válido; un lock inválido se rechaza sin tocar el lock ni la caché; la salida de `init` es byte a byte igual; los casos AC-7 de la aceptación propia dan PASS (V-64, V-65). No queda otro hallazgo en Q6.6.

**Riesgo nuevo valorado y no puntuado:** `RESTART_REQUIRED` en el primer `sync` a v4.1.0 (V-87). Es la señal prevista por el kernel ante un cambio del bootstrap, está documentada en `V4.1.0-MINOR.md` y en STATE, no se dispara en la CI L3 (caché nueva) y no cambia el código de salida no estricto.

**Efecto en la nota:** Q6.6 MENOR → COMPLETO, **+0.50**.

### N-62 — La cabecera de STATE dice que el informe `71dff99` sigue en `.audit/reports/` de r3 (MINOR, NUEVO)

**Tipo:** CONTRADICTORIO. **Evidencia:** `V4.1.0-STATE.md` líneas 14-15 (escritas en `3036727`): «Archived reports: `877fb9c` and `47c52a1` under `audits/`; `71dff99` stays under `.audit/reports/` on r2/r3». En `f6d026f` la ruta no existe (V-88), el informe está en `audits/` y la sección «F-006 validation» del mismo archivo dice «r3 removes its `.audit/reports/` copy in a new commit».

**Impacto:** quien lea solo la cabecera (la vista de estado) obtiene una ubicación falsa del informe que certificó r2. No afecta a ningún control: `release-gate` y `pretag` leen el árbol.

**Corrección mínima:** en la feature, cambiar la frase a «Archived reports: `877fb9c`, `47c52a1` and `71dff99` under `audits/`; `71dff99` also stays under `.audit/reports/` on r2 (`e88de8f`)». Cualquier cambio fuera de `.audit/**` y `STATUS.md` deja STALE este informe, así que conviene hacerlo en la próxima iteración que de todos modos re-audite.

**Criterio:** Q1.3 (coherencia), como N-61. **Efecto en la nota:** ninguno (Q1.3 ya es MENOR por N-31 y N-43; recuperarlo exige cerrar los tres).

### N-51 — Alcance obligatorio de v4.1.0 (MINOR residual)

Sin cambios de fondo respecto de `AUDIT-PLATFORM-71dff99.md` §H: la aceptación propia vuelve a dar PASS ×3 frente a `develop` y frente a `main` en f6d026f (V-64, V-65), ahora con AC-7 (I-17, I-18), y lo pendiente es humano. Corrección mínima, verificación de cierre y puntos recuperables (+0.75) iguales.

### Evaluación de la clasificación del Builder (tras `f6d026f`)

* **Correcto:**
  * F-006 marcado «Closure is the next audit's call, not assumed here»: no se adelantó el cierre;
  * el +0.50 presentado como estimación en la propuesta y en el cuerpo de #190;
  * T8 como «code DONE» con la aceptación AC-7 pendiente del head final (R6-2);
  * la explicación del BLOCKED de `f78a068` y su arreglo sin ensanchar la clase no-SUT (V-89);
  * las vías restantes hacia más nota: N-51 (humano), N-31 + N-43 (sin decidir).
* **Incorrecto:** la cabecera de STATE sobre la ubicación del informe `71dff99` (N-62).
* **Sin efecto en la nota:** las 3 fallas de la corrida concurrente del Builder sin mensajes guardados («plausible, not proven», como dice STATE); mis suites en secuencia dan 175/175 (V-83).

### H.1 Sugerencias (no restan puntos)

* S-1..S-62 heredadas (S-55 retirada).
* **S-63 (nueva).** Que `ai-native upgrade` propague los avisos de `sync` (`upgrade.mjs:127-128`), o que el informe de upgrade diga explícitamente que el bootstrap cambió, para que el agente consumidor aplique el paso 4 del kernel también por esa vía.
* **S-64 (nueva).** En la nota de consumidor de `V4.1.0-MINOR.md`, aclarar que el arreglo vale cuando el motor que ejecuta `rollback` es v4.1.0 o posterior: un rollback ejecutado por el motor de una versión anterior (por ejemplo, un segundo rollback tras volver a v4.0.2) sigue perdiendo `productDir`/`governance`.
* **S-65 (nueva).** `core/kernel.md` paso 4 describe `RESTART_REQUIRED` como cambio de «skills, agentes o MCP», pero `sync` solo lo calcula por el hash de `install.mjs`. Alinear el texto con el código.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2, Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Tests propios inestables en el host Windows | N-29, N-27 | Q5.3 |
| ROOT-003 | Agentes, auditor y revisor del Environment con la identidad del propietario | N-40; condiciona N-51 y el valor probatorio de V-84 | Q8.2 |
| ROOT-006 | API de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-011 | Alcance que depende de configuración humana y de un camino solo verificable en `main` | N-51 | Q1.4 |

## J. QUÉ SOBRA

Sin cambios respecto de `AUDIT-PLATFORM-877fb9c.md` §J (S-48, S-54).

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

N-51 y N-60 (residuales), N-62, más los 18 MINOR heredados.

### MEJORAS OPCIONALES

S-1..S-65. No restan puntos.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto | Cómo verificarlo |
|---|---|---|---|
| CI del SHA exacto `f6d026f` | Sin PR ni run | Mitigado: el código es idéntico al de `f043675` salvo `CLI_VERSION` (V-04, V-67) | PR de release a `main` |
| Veredicto confiable en ejecución | Solo desde `main` | Dentro de N-51 | Canary tras el merge |
| L3 de aceptación en un consumidor real | Ningún consumidor configurado | Dentro de N-51 | Consumidor con las dos entradas nuevas |
| `sync`/`rollback` reales de un consumidor v4.0.2 → v4.1.0 | Sin consumidor ni release publicada | Cubierto por los tests de motor (V-81) y el análisis de V-87 | Ensayo en un consumidor desechable tras publicar |
| Tier `container` | Sin contenedores | Ninguno puntuado | Host con Docker/Podman |
| Autoría humana de la review `6095462910` | U0 PENDING | Registro de decisión, no atestación | U0 |
| Independencia del auditor | U0 PENDING | Confianza MEDIA; aislada, NO atestada | U0 |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0)
G2 CRITICAL: PASS (0)
G3 VERIFICACIÓN ESENCIAL: PASS (build nuevo reproducible V-70; validadores V-05..V-21; aceptación propia V-64/V-65;
   tests RF-22 y regresión V-81/V-82; suites bootstrap/migrate V-83; CI del código idéntico V-67; nada falló durante
   la auditoría salvo el límite de tiempo propio documentado en V-83)
```

El método 1.2 solo define G1-G3. Final = bruto = 90.25.

**Release-gate (V-80):** sin informe, `FAIL` (esperado). Con este informe colocado en `.audit/reports/` de una copia desechable: `PASS_WITH_WARNINGS`, exit 0, y los únicos avisos son los 36 informes históricos STALE; con el directorio del informe solo, `PASS`. 90.25 ≥ 90, así que ya no aplica la tolerancia. `pretag` da `NOT READY` por motivos propios del momento (no está en `main`, sin CI del SHA, informe aún no comiteado). El front matter se acepta. Es uso de release y nunca gate de merge (`isMergeGate: false`); no forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 90.25

N-51 (Q1.4)                          → +0.75
N-31, N-43, N-62 (Q1.3)              → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 (Q5.3)                    → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26, N-44 (Q6.3)                    → +0.75
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27, N-60 (Q7.3)       → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 0.75×9 + 1.00 + 0.50×4 = 6.75 + 1.00 + 2.00 = 9.75
90.25 + 9.75 = 100.00
```

## O. PLAN DE REMEDIACIÓN

1. **MINOR, N-51** (+0.75). Decisiones humanas 1-4 de STATE; canary tras el merge a `main`; L3 real.
2. **MINOR, N-62** (0.00 por sí solo). Corregir la cabecera de STATE en la próxima iteración que se re-audite.
3. **MINOR, N-31 + N-43 + N-62** (+0.75, clase B; N-31/N-43 requieren ampliar el alcance).
4. **MINOR, N-60.** Descarte humano de #58-#61. Q7.3 recupera solo si además cierran F-008 y #27.
5. **MINOR heredados**, en el orden de `AUDIT-PLATFORM-cad1053.md` §O.

Cualquier commit fuera de `.audit/**` y `STATUS.md` deja este informe STALE.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 21 MINOR y la confianza es MEDIA. Para el umbral PLATFORM 90 con tolerancia 2, `f6d026f` queda en **90.25**: alcanza 90 por 0.25.

El delta cierra F-006 de verdad: el arreglo está dentro del alcance aprobado por el humano, la regresión discrimina, ningún otro escritor del lock cambia de comportamiento y el riesgo nuevo (`RESTART_REQUIRED`) es el previsto y está documentado. Añade un MINOR de coherencia (N-62) que no mueve la nota. Lo demás sigue igual: el paso humano de N-51 y los 18 heredados.

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 90.25 + 9.75 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay)
[x] Los Quality Gates derivan de hallazgos reales (ninguno activo)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 2.25 + 2.25 | 10.50 |
| Q2 | 3 + 3 + 3 + 3 | 12.00 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 3.00 + 3 + 2.25 | 13.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 2.00 | 14.50 |
| Q7 | 2.25 + 1.50 + 1.50 + 2.00 + 2.25 | 9.50 |
| Q8 | 2 + 1.50 + 1.50 + 2 | 7.00 |
| **Total** | 10.50 + 12 + 12 + 11.25 + 13.50 + 14.50 + 9.50 + 7 | **90.25** |

**Divergencia con `71dff99` (89.75): +0.50.**

| Subcriterio | Cambio | Puntos | Causa |
|---|---|---:|---|
| Q6.6 | MENOR → COMPLETO | +0.50 | Cierra F-006 (único hallazgo del subcriterio) |
| Q1.3 | MENOR → MENOR | 0.00 | Entra N-62; siguen N-31 y N-43 |

### Riesgos residuales

Los R-1..R-5 de `AUDIT-PLATFORM-47c52a1.md`, más uno:

* identidad compartida en la aprobación del Environment y en la decisión de alcance de #191 (U0, `prevent_self_review false`);
* PR de release sin veredicto vinculante (bootstrap);
* `develop` sin protección;
* sin salida dentro de las protecciones ante un bloqueo total tras el merge;
* aceptación propia válida para el SHA auditado, no para el head con el informe (la vista local daría BLOCKED por la ruta `.audit/reports/AUDIT-PLATFORM-f6d026f.md`, como en `f78a068`; el veredicto confiable no re-aplica esa comprobación, S-58);
* R-6 (nuevo): el primer `sync` de cada consumidor a v4.1.0 pedirá un reinicio de sesión (`RESTART_REQUIRED`), y por la vía `upgrade` no se ve el aviso (S-63).

```text
AUDITED_SHA: f6d026fa05f2cc4ad55d5395c48a95241d3e183e
SCORE: 90.25/100 (bruto = final; sin N/A; ningún gate activo)   PREVIOUS: 89.75 (71dff99); 89.75 (47c52a1)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 21 (18 heredados + N-51, N-60 residuales + N-62 nuevo)   CERRADOS: F-006
DELTA: 71dff99..f6d026f, 11 commits, 15 archivos (F-006: install.mjs 1 línea + tests + casos AC-7 + specs 003; governance)
LOCAL: 16 validadores + audit check + sdd validate ×3 exit 0; RF-22 4/4 (regresión: 3 fallan con el código viejo);
       bootstrap+migrate 175/175 en secuencia
ACEPTACIÓN PROPIA: PASS ×3 frente a develop y PASS ×3 frente a main (auditor, clon de f6d026f; I-17/I-18 PASS)
CI: f043675 13/13 checks pass (validators ×2 SO, acceptance-closure, pilot GI, CodeQL); f6d026f sin runs
    (= f043675 + V4.1.0-MINOR.md + CLI_VERSION)
CODEQL PR #190: 4 abiertas (#58-#61, justificadas por alerta, sin descartar)
BUILD: reproducible v4.1.0 (6/6, 259 archivos, sin código de solo-tests; install.mjs con el arreglo; build nuevo de f6d026f)
UMBRAL PLATFORM 90 (tolerancia 2): ALCANZA 90 (+0.25)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA (aislada, NO atestada; U0 PENDING)
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
