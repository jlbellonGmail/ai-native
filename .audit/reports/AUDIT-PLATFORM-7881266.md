---
targetRepo: jlbellonGmail/ai-native
targetCommit: 7881266898c6cc810496a3957010f7c93be4e3c5
platform:
  version: "v4.0.2 candidate"
  commit: 7881266898c6cc810496a3957010f7c93be4e3c5
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-22T17:10:00Z"
scope: "Independent read-only PLATFORM 1.2 audit of the frozen v4.0.2 candidate 7881266 (branch release/v4.0.2, PR #183 to main) over the delta 878322a (v4.0.1, published)..7881266: PR #179 (sdd validate acceptance warnings), PR #181 sync, CLI_VERSION v4.0.2 (e284647) and the governance record (7881266). Baseline AUDIT-PLATFORM-388e310.md (89.25; 388e310 differs from 878322a only in .audit/**, verified); every inherited finding re-verified live or justified by an empty diff over its area. Public v4.0.1 release downloaded and SHA256SUMS-verified, compared with two local builds of 7881266 (plus a negative build and a build of e284647). Auditor: isolated-context read-only subagent launched from the builder session; it did not build or review the candidate; it runs under the same Windows and GitHub identity as the builder (N-40, ROOT-003). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 89.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.0.2, 7881266)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               D:\proyectos\ai-native-rel402 (worktree, solo lectura)
Branch:             release/v4.0.2 (= origin por ls-remote); PR #183 a main: OPEN, MERGEABLE, mergeStateStatus CLEAN, 12 commits,
                    headRefOid = 7881266
Commit:             7881266898c6cc810496a3957010f7c93be4e3c5 (= AUDITED_SHA; igual a HEAD al empezar y al terminar)
Base:               origin/main = 878322ae4f3d0fd0446330e83b86761aa9a32d5e = v4.0.1^{} (tag anotado 373700c), release v4.0.1 «Latest»,
                    publicada 2026-11-03T23:57:26Z; Release run 41742877489 success sobre 878322a
Baseline:           AUDIT-PLATFORM-388e310.md (89.25). git diff --stat 878322a 388e310 = solo .audit/reports/AUDIT-PLATFORM-388e310.md
Tag:                ninguno en el commit; v4.0.2 libre local y en origin
Fecha:              2026-11-22 (UTC ~17:10)
Worktree:           limpio al empezar y al terminar (git status --short vacío); el informe vive FUERA del repositorio
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente con contexto aislado, lanzado desde la sesión del Builder, con
                    instrucciones de solo lectura. No construyó ni revisó la candidata. Corre con la misma identidad de Windows
                    y de GitHub que el Builder (N-40, ROOT-003): el humano debe ponderar esa independencia. No aprobó ningún
                    Environment ni deployment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, gh (solo lectura), %TEMP% en C:, worktree en D:
Temporales:         <scratchpad>/audit402: logs, builds b1/b2/bneg/be28, release v4.0.1 (v401) y extracciones (x401, x402), sondas
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 89.25/100
Score final: 89.25/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO CON CORRECCIONES
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88): DENTRO DE LA TOLERANCIA, NO ALCANZA 90 (−0.75).** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 23 MINOR puntuables. Sin N/A.

**El delta v4.0.2 es correcto en lo sustancial (verificado por mí).**

* Contenido de `878322a..7881266`: 9 archivos, +351/−15; exactamente lo declarado (#179, #181, `CLI_VERSION`, registro). Ninguna área de control (`.github`, `runtime/gates`, `governance/gates`, `contracts`, `runtime/release`, `runtime/bootstrap`) cambia (V-05).
* **Exit code sin cambios (E4).** Con el mismo proyecto de prueba, `sdd-cli.mjs validate` del bundle v4.0.1 y del build de 7881266: exit 0 en ambos (la candidata añade 2 `WARN:` y `warnings` en `--json`); con una tarea que cita un RF inexistente, exit 1 en ambos (V-22).
* **Delta de consumidor (E4).** Release v4.0.1 descargada, `SHA256SUMS` OK ×6. `diff -rq` contra mi build: 5 archivos distintos (`sdd-validate.md`, `sdd-cli.mjs`, `sdd-workflow.mjs`, `ai-native.mjs`, `platform.json`), 0 añadidos, 0 eliminados, 234 = 234 archivos; el test nuevo no está en el bundle. `platform.json`: `schemaVersion`, `components`, `capabilities` y `bootstrap` idénticos (V-19, V-20). Las afirmaciones de `V4.0.2-PATCH.md:19-24` son ciertas, incluido el digest `9305d8b1…` de `e284647` (V-21).
* **Clasificación PATCH correcta** según `VERSIONING-POLICY.md` §PATCH («validaciones», «corrección de defectos sin cambio de contrato»): no cambia lock, kernel, bootstrap, schema, skill ni `inputs`; un aviso sin efecto en exit code ni en `VALIDATION` no es un gate (S-36, S-37).
* **CI del SHA exacto verde**: 11 workflows success; 1281 tests (+9 = el archivo nuevo), 0 FAIL en ubuntu y windows; `merge-gate` success (V-26).

**Cerrado desde `388e310`.**

* **N-39 CERRADO.** Cumple el criterio fijado: `compare develop...main` → `ahead_by 0` (main ⊂ develop, por #181 = `8681756`); el `SESSION-CONTEXT.md` de `develop` dice `V4.0.1_RELEASED` (V-29).

**Nuevos (3 MINOR, ninguno cambia nota).**

* **N-45 (Q1.3)** `runtime/circuit/sdd-workflow.mjs:220,244-246`: el manejo de bloques de código alterna con cualquier ```` ``` ```` o `~~~`, sin respetar tipo ni longitud del delimitador. Un `~~~` dentro de un bloque ```` ``` ```` o un bloque de 4 backticks con ```` ``` ```` dentro distorsiona la sección: aviso falso de «no acceptance criteria» o requisito falso de un ejemplo (V-23). Contradice `V4.0.2-ACCEPTANCE-AUDIT.md:81` («Se ignoran líneas dentro de bloques de código»). Impacto bajo: solo `WARN`.
* **N-46 (Q8.1)** `governance/execution/current/README.md:32` sigue diciendo «PENDING: … human merge of the main -> develop sync PR (replaces #180)», pero #181 está fusionada (`8681756`, ancestro de HEAD). Además `:11` dice «platform.json (version/commit/digest only)», mientras `V4.0.2-PATCH.md:22` y la medición incluyen `generatedAt`, `sbom` y `provenance` (V-20, V-30).
* **N-47 (Q5.3)** `runtime/release/release.test.mjs:321` usa `git clone -q --local`. Con `--local` explícito git no cae a copia: si el repositorio y `%TEMP%` están en volúmenes distintos, falla siempre («failed to create link … Improper link»). Reproducido 2/2 (no es el flake N-29) y fuera del test con el mismo comando (V-14). La CI lo pasa. Archivo sin diff: defecto heredado, observado por primera vez.

**Heredados abiertos:** N-40 (BLOCKED, V-28), N-43 (`V4.0.1-PATCH.md` sin diff), N-44 (`merge-gate.mjs` sin diff; esta vez el run pasó), N-32 empeora: 17 alertas Dependabot (1 high, 15 medium, 1 low), antes 10 (V-27).

**Sensibilidad.** Q8.1 no sube pese a cerrar N-39, porque entra N-46 (si se corrigen las dos líneas: +0.50 → 89.75). Para 90 falta +0.75: F-002 (+0.75), o N-46 junto con N-40 (+1.00).

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Diff completo `878322a..7881266`, leído entero: `sdd-workflow.mjs:216-273`, `sdd-cli.mjs:20-83`, `sdd-validate.md`, `ai-native.mjs:23`, el test nuevo completo, `V4.0.2-PATCH.md`, `V4.0.2-ACCEPTANCE-AUDIT.md`, el diff de `SESSION-CONTEXT.md` y `execution/current/README.md`.
* Normativa: `VERSIONING-POLICY.md` completo; método de auditoría completo (`audit/README.md`, `AUDIT_PROMPT.md`, `AUDIT_RULES.md`, `QUALITY_SCORE.md`, `PLATFORM.md`, `method.json`, schema).
* Consumidores de `sdd validate`: ningún módulo parsea su stdout (`coordinator.mjs`, `implement-all.mjs`, `commands.mjs`, `knowledge.mjs`); `core/commands/sdd-validate.md` es la única copia versionada.

**Ejecutado** (ver §G): los 10 validadores, `git diff --check`, `ls-files --eol`, 6 archivos de test uno a uno (95 tests, más el reintento), 2 builds + negativo + build de `e284647`, descarga y verificación de v4.0.1, diff de bundle y de `platform.json`, comparación de exit codes v4.0.1/candidata, sonda de casos límite de `specWarnings`, `pretag` real, `check-agent-isolation`, `check-environment`, `trusted-config`, `release-gate` antes y después, plano de control remoto.

**No ejecutado localmente:** la suite completa (RAM del host); `review-ledger`, `consumer-e2e`, `independent-review` (sin diff en sus módulos; evidencia: CI remota del SHA exacto, V-26). Pilot: no se disparó para 7881266 (filtro de `paths`; ningún archivo del delta lo activa).

**No verificado:** las cifras sobre `gi-common-reference/specs` (`V4.0.2-ACCEPTANCE-AUDIT.md:102`; fuera de alcance, no se tocó); la revisión independiente de #179 descrita en `:83-94` (no atestiguada por runtime, como el propio documento declara); F-007; Codex y OpenCode.

**Accesos remotos (solo lectura):** `gh pr view/checks 183`, `pr view 180/181`, `run list/view` (CI con logs, Release 41742877489), `release view/list/download v4.0.1`, `api` GET de repo, rulesets, `branches/develop/protection`, `rules/branches/develop`, `compare`, environments, code-scanning (también `refs/pull/183/merge`), dependabot, secret-scanning; `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | `sdd validate` avisa de spec sin criterios y de requisito sin tarea; exit code, `validateSpecFolder` y `VALIDATION` sin cambios | OBLIGATORIO (#179) | `V4.0.2-PATCH.md:7`, `sdd-cli.mjs:74-82` | VERIFICADO (V-11, V-22). Bloques de código: N-45 |
| C-02 | `--json` añade `warnings` (aditivo) | OBLIGATORIO | `sdd-cli.mjs:76` | VERIFICADO (V-22) |
| C-03 | El Coordinator informa cada `WARN:` y la revisión decide si es brecha | OBLIGATORIO | `core/commands/sdd-validate.md:9` | DOCUMENTADO; `commands.test` 10/10 (V-15) |
| C-04 | `CLI_VERSION` = tag; el build rechaza otra versión | OBLIGATORIO | `ai-native.mjs:23`, `cli-version.mjs` | VERIFICADO (V-18) |
| C-05 | PATCH según §PATCH; delta de consumidor medido | OBLIGATORIO | `V4.0.2-PATCH.md:13-24`, `VERSIONING-POLICY.md` | VERIFICADO (V-19..V-21) |
| C-06 | Bundle determinista, sin código de solo-tests | OBLIGATORIO (perfil Q6) | `build.mjs`, `bundle.mjs` | VERIFICADO (V-18, V-19) |
| C-07 | Chequeo previo al tag | OBLIGATORIO | `pretag.mjs` | VERIFICADO: NOT READY fail-closed antes del merge (V-25) |
| C-08 | Tests en CI Linux y Windows | OBLIGATORIO | `ci.yml` | VERIFICADO en 7881266 (V-26) |
| C-09 | Gates server-side, HITL único de merge | OBLIGATORIO | ruleset `ai-native-main`, `merge-gate` | IMPLEMENTADO; con F-005, N-25; HITL alcanzable por el agente (N-40) |
| C-10 | Fuente de verdad: `SESSION-CONTEXT.md` y `execution/current/` | OBLIGATORIO | `CLAUDE.md` | Correcta salvo N-46; `develop` sincronizado (N-39 cerrado) |
| C-11 | Separación humano/agente (G5) | PROPUESTA | `AGENT-HUMAN-IDENTITY-SEPARATION.md` | No implantada (N-40) |
| C-12 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO |
| C-13 | Native Acceptance (#168) | FUTURO (v4.1.0) | `V4.0.2-PATCH.md:11` | Excluido, como se declara |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31, N-43, N-45) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, N-47, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 6.50 | MENOR (N-46, N-40, F-005) |
| **TOTAL** | **100** | **89.25** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Leyenda: **E** evaluado sobre el delta; **V** re-verificado en vivo o en el árbol; **D** diff `878322a..7881266` vacío sobre el área (V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V4.0.2-PATCH.md`, `V4.0.2-ACCEPTANCE-AUDIT.md:5-9` | — | E. Alcance, exclusión de #168 y límites declarados |
| Q1.2 | Capacidades presentes | 3 | COMPLETO | 3.00 | V-11, V-22 | — | E. `WARN` y `warnings` funcionan como se promete |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | V-23; `sdd-workflow.mjs:220,244-246`; `V4.0.1-PATCH.md` sin diff | N-31, N-43, **N-45** | E + D. El manejo de bloques no cumple lo declarado (N-45); N-31 y N-43 siguen |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-18 | — | E. Build ×2 idéntico |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | `ls governance/cleanup` = 4; V-06 | F-002 | V. Sin residuos nuevos en el delta |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | — | — | D (`template/`, `core/skills`) |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | V-22 | — | E. Producto sin dependencias de host nuevas; la de N-47 es de un test y se puntúa en Q5.3 |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `sdd-workflow.mjs:227-233` | — | E. `specWarnings` separado de `validateSpecFolder` a propósito |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | `sdd-workflow.mjs:222-223` | — | E. El patrón se deriva de `REQUIREMENT_DEF`, sin duplicar |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | E |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.0.2-PATCH.md:26-31`; `sdd-validate.md:9` | — | E |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | — | — | D |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-07..V-10 | — | E. 10 validadores exit 0; 103 tests listados en CI |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D. El delta añade 9 tests, incluidos de CLI |
| Q5.3 | Pruebas pasando | 4 | MENOR | 3.00 | V-11..V-17, V-26 | N-29, N-27, **N-47** | E + V. Local: 95/96 en el primer pase; el fallo es N-47, determinista, reproducido 2/2. N-29 no se reprodujo (0 «Permission denied»). CI del SHA exacto: 1281 tests, 0 FAIL ×2 SO |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | V-11, V-15 | — | E. Exit code y FAIL protegidos por test de CLI |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | E. Commits semánticos; PR = local = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-27 | F-005, N-25 | V. `required_approving_review_count 0`; `develop`: 404, 0 reglas |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-26 | N-26, N-44 | V + D. CI y `merge-gate` verdes; `merge-gate.mjs` y `runtime/pilot` sin diff, sin causa ni reintento |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-19..V-21, V-24; `VERSIONING-POLICY.md` §PATCH | — | E. PATCH correcto, delta medido y cierto |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-18 | — | E. `sha256:c49b2318…92d3` ×2, 6/6 assets idénticos |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-06, V-27 | F-007 | V. Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-27 | N-32 | V. 17 alertas (antes 10), todas en `template/` y `foundation/`, que no están en el bundle (V-19). Se mantiene MENOR; otra subida o la high sin triage justificarían PARCIAL |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-27 | F-008, CodeQL #27 | V. 0 rulesets de tag; CodeQL abierta: [27]; PR: [] |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-25, V-28 | — | E. `pretag` NOT READY; avisos no relajan ningún FAIL |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | MENOR | 1.50 | V-29, V-30 | **N-46** | E + V. N-39 cerrado; dos líneas de `execution/current/README.md` contradicen el estado y el delta medido |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | V-28 | N-40 | V. BLOCKED; `human-review` con `prevent_self_review: false` |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-27 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-04 | — | E. Defecto D-1/D-2 → #179 → test → CI → registro |

## G. LEDGER DE VERIFICACIÓN

Oficial del proyecto salvo (A) complementaria del auditor y (R) remota. Logs en `<scratchpad>/audit402/logs/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` inicio y fin | `7881266898c6cc810496a3957010f7c93be4e3c5` | PASS |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio, durante y al final | PASS |
| V-03 | PR y refs (R) | `gh pr view 183`; `git ls-remote` | OPEN, MERGEABLE, CLEAN, head = 7881266; `main` = `v4.0.1^{}` = 878322a; `develop` = 8681756; `v4.0.2` inexistente | PASS |
| V-04 | Alcance (A) | `git diff --stat 878322a 7881266`; `git log` | 9 archivos +351/−15; commits e69123d, 9803375, 248fc9b, c192315, e284647, 7881266 y merges #179/#181; 388e310 vs 878322a = solo `.audit/**` | PASS |
| V-05 | Áreas sin diff (A) | `git diff --quiet 878322a 7881266 -- <p>` | 0 para `README.md`, `AGENTS.md`, `scripts`, `.github`, `contracts`, `runtime/{bootstrap,audit,pilot,adapters,lib,gates,release,consumer,main.mjs}`, `governance/{gates,cleanup,roadmaps}`, `V4.0.1-PATCH.md`, `VERSIONING-POLICY.md`, `template`, `foundation`, `evaluation`, `package.json`, `core/skills`, `profiles`, `knowledge`, `mcp`. En `runtime/circuit` solo cambian `sdd-workflow.mjs`, `sdd-cli.mjs` y el test nuevo | PASS |
| V-06 | Higiene (A) | grep de rutas de host, tokens, claves y TODO/FIXME en líneas añadidas | 0 coincidencias reales (1 falso positivo: «todos») | PASS |
| V-07 | EOL (A) | `git diff --check`; `ls-files --eol` | exit 0; fuera de `i/lf` solo archivos vacíos (`i/none`) | PASS |
| V-08 | Método | `node runtime/audit/cli.mjs check` | PASS, exit 0 | PASS |
| V-09 | Validadores | parity, contracts, core, integrity, doc-drift, entrypoints, compat-matrix | exit 0 ×7 (parity 95/95) | PASS |
| V-10 | CI-listado y pines | `validate-ci-tests-listed.mjs`; `validate-actions-pinned.mjs` | «all 103 committed *.test.mjs files are run by a workflow»; «all actions … pinned by full SHA» | PASS |
| V-11 | Test nuevo | `node --test --test-concurrency=1 runtime/circuit/sdd-acceptance-warnings.test.mjs` | 9/9 | PASS |
| V-12 | `sdd-workflow` | idem | 19/19 | PASS |
| V-13 | `pretag` | idem | 10/10 al primer intento; 0 «Permission denied» | PASS |
| V-14 | `release.test` | idem (×2) y `git clone -q --local D:\… <scratch C:>` | 18/19 ×2: «N-16 …» falla en `release.test.mjs:321`, «failed to create link … Improper link» (status 128). El mismo `clone --local` fuera del test falla igual (exit 128) | FAIL (host: volúmenes distintos) → N-47 |
| V-15 | `commands.test` | idem | 10/10 (renderizado de `sdd-validate.md`) | PASS |
| V-16 | `implement-all.test` | idem | 28/28 | PASS |
| V-17 | Resumen local | V-11..V-16 | 95 de 96 en el primer pase; el único fallo es N-47 | — |
| V-18 | Build reproducible y negativo | `build.mjs --version v4.0.2 --commit 7881266… --out b1`/`b2`; `--version v4.0.1` → `bneg` | exit 0 ×2; 6/6 assets idénticos (`cmp`); `sha256:c49b2318e321d473ff08580b0de3faa7f1e44e641c097fd6ef8aa3efff3792d3`; 234 archivos. Negativo: exit 1, «declares CLI_VERSION v4.0.2; this release is v4.0.1» | PASS |
| V-19 | Delta de consumidor (A/R) | `gh release download v4.0.1` en un directorio vacío; `sha256sum -c SHA256SUMS`; `diff -rq x401 x402`; `cmp` bundle vs HEAD | 6/6 OK. 234/234 archivos; 5 distintos, 0 añadidos, 0 eliminados; ningún `*acceptance*` en el bundle; sin `template/` ni `foundation/`; los 4 archivos cambiados = blobs de HEAD | PASS (confirma `V4.0.2-PATCH.md:21`) |
| V-20 | `platform.json` (A) | `pjcmp.mjs` embebido y publicado | Idénticos `schemaVersion`, `components`, `capabilities`, `bootstrap`. Embebido: cambian `version`, `commit`, `generatedAt`. Publicado: además `digest`, `sbom`, `provenance` | PASS (confirma `:22`; contradice `execution/current/README.md:11` → N-46) |
| V-21 | Digest registrado (A) | `build.mjs --commit e284647…` | `sha256:9305d8b14bf3…7921` = `V4.0.2-PATCH.md:24` | PASS |
| V-22 | Exit code v4.0.1 vs candidata (A) | proyecto de prueba (spec sin criterios, RF-2 sin tarea); `node <x401|x402>/runtime/circuit/sdd-cli.mjs validate 001-demo --project …` (texto y `--json`); luego tarea que cita RF-9 | v4.0.1: PASS, exit 0, sin `warnings`. Candidata: PASS + 2 `WARN:`, exit 0, `warnings` con 2 entradas. Caso FAIL: exit 1 en ambos | PASS |
| V-23 | Casos límite de `specWarnings` (A) | `edge.mjs` con el módulo de HEAD | Bien: base, NFD, cierre por encabezado del mismo nivel o superior. Mal: ```` ```` ```` con ```` ``` ```` interior → aviso falso de `RF-7` de un ejemplo; `~~~` dentro de ```` ``` ```` → «no acceptance criteria section» falso. Encabezado setext no reconocido (aceptable: el aviso nombra el formato esperado) | FAIL parcial → N-45 |
| V-24 | Clasificación de versión (A) | lectura de `VERSIONING-POLICY.md` §MAJOR/§MINOR/§PATCH frente a V-19..V-22 | No se cumple ningún supuesto MAJOR; no se agrega skill, perfil, MCP, gate bloqueante ni campo de schema; encaja en «validaciones» y «corrección de defectos sin cambio de contrato» | PASS |
| V-25 | `pretag` real | `node runtime/release/pretag.mjs --tag v4.0.2 --candidate 7881266… --repo jlbellonGmail/ai-native` | NOT READY, exit 1. FAIL: «reachable from origin/main» (falta el merge) y release-gate (falta este informe). PASS: tag libre local y remoto, sin release, `ci.yml` verde, `CLI_VERSION` v4.0.2 | PASS (fail-closed esperado) |
| V-26 | CI remota (R) | `gh run list --commit 7881266…`; `gh pr checks 183`; `gh run view 45044895779 --log` | 11 workflows success (CI, Release dry-run, CodeQL, SBOM, Trivy, security-scan, supply-chain, dependency-review, pr-gate, trust-gate, merge-gate). ubuntu: 1281 tests, 1280 pass, 0 fail, 1 skip; windows: 1281, 1279 pass, 0 fail, 2 skips. `human-review` y `merge-gate-finalize`: skipping. Pilot: no disparado (`paths`) | PASS |
| V-27 | Plano de control (R) | `gh api` rulesets, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, code-scanning, dependabot, secret-scanning | `ai-native-main` activo, sin bypass, `required_approving_review_count 0`, merge/squash/rebase, 6 checks requeridos. `develop`: 404, 0 reglas. Rulesets de tag: 0. CodeQL: [27]; PR 183: []. Dependabot: 17 (1 high, 15 medium, 1 low; #145..#163; `foundation/` y `template/` `pnpm-lock.yaml`). Secret scanning: 0 | PASS (con F-005, N-25, F-008, N-32) |
| V-28 | Aislamiento y estado v4 (A/R) | `plan-approval.mjs check-agent-isolation`, `check-environment`, `trusted-config`; `gh api environments` | isolation **BLOCKED** (`AGENT_HUMAN_GH_ACCOUNT`, `AGENT_GIT_CREDENTIAL`), exit 1. environment PASS. trusted-config PASS (`sourceRevision` 878322a). `ai-native-human-review`: `prevent_self_review false`; `ai-native-plan-approval`: `true` | FAIL (N-40 abierto) |
| V-29 | N-39 (R) | `gh api compare/develop...main` y `main...develop`; `git show origin/develop:governance/SESSION-CONTEXT.md`; `gh pr view 180 181` | `develop...main`: behind, `ahead_by 0`. `main...develop`: 10 commits, solo los archivos de #179 y gobierno. `develop` STATUS `V4.0.1_RELEASED`. #181 MERGED (`8681756`); #180 CLOSED | PASS (N-39 cerrado) |
| V-30 | Gobierno de la candidata (A/R) | lectura de `SESSION-CONTEXT.md:7-16`, `execution/current/README.md:1-38`; `merge-base --is-ancestor 8681756 HEAD`; `gh release view v4.0.1`; `gh run view 41742877489` | `SESSION-CONTEXT.md`: cierto (release 2026-11-03T23:57:26Z y run success verificados). `execution/current/README.md:32`: merge de la PR de sync «pendiente», pero `8681756` es ancestro de HEAD; `:11`: delta de `platform.json` incompleto | PARCIAL → N-46 |
| V-31 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 7881266… --root D:\proyectos\ai-native-rel402` | FAIL (34 errores), exit 1: 1 real («no current valid PLATFORM audit report for 7881266…») y 33 STALE | ESPERADO |
| V-32 | Release-gate contra este informe | `… release-gate --profile PLATFORM --candidate 7881266… --reports <scratchpad>/audit402/reports --root D:\proyectos\ai-native-rel402` | **PASS_WITH_WARNINGS**, exit 0: «score 89.25 is below 90 but within the 2-point tolerance» | ESPERADO (coherente con §B) |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas (heredado) | `review-ledger.mjs` sin diff | Q1.3 | −0.75 (con N-43, N-45) |
| N-43 | INCORRECTO | MINOR | Imprecisiones del registro de N-38 (heredado) | `V4.0.1-PATCH.md` sin diff | Q1.3 | (incluido) |
| **N-45** | INCORRECTO | MINOR | `specWarnings` alterna el estado «dentro de bloque» con cualquier ```` ``` ````/`~~~` sin respetar tipo ni longitud; avisos falsos en specs con bloques anidados o mixtos; contradice `V4.0.2-ACCEPTANCE-AUDIT.md:81` | V-23; `sdd-workflow.mjs:220,244-246` | Q1.3 | (incluido) |
| F-002 | SOBRA | MINOR | Residuos en `governance/cleanup/` (heredado) | 4 archivos | Q2.2 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host (heredados; N-29 no reproducido esta vez) | V-13; V-05 | Q5.3 | −1.00 (con N-47) |
| **N-47** | RIESGO | MINOR | `release.test.mjs:321` usa `git clone --local`, que falla siempre si repo y `%TEMP%` están en volúmenes distintos | V-14 | Q5.3 | (incluido) |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-27 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-27 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | Pilot offline Ubuntu intermitente, sin causa (no disparado aquí) | V-26; `runtime/pilot` sin diff | Q6.3 | −0.75 (con N-44) |
| N-44 | RIESGO | MINOR | `merge-gate` sin reintento ante 5xx (heredado; esta vez success) | `merge-gate.mjs` sin diff | Q6.3 | (incluido) |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-27 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 17 alertas Dependabot abiertas (1 high), antes 10; fuera del bundle | V-27, V-19 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-27 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |
| **N-46** | OBSOLETO | MINOR | `execution/current/README.md:32` da por pendiente el merge de la PR de sync ya fusionada (#181); `:11` reduce el delta de `platform.json` a version/commit/digest | V-29, V-30, V-20 | Q8.1 | −0.50 |
| N-40 | RIESGO | MINOR | G5 no implantada: el proceso del agente tiene la identidad del propietario | V-28 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 23 MINOR.**

* Heredados de `6f47eb2` (17): N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009, F-010 (CodeQL #27 dentro de F-008).
* De `c99ed8f`/`388e310` todavía abiertos (3): N-40, N-43, N-44.
* Nuevos (3): N-45, N-46, N-47.
* Cerrado en este tramo (1): N-39.

**N-45 (MINOR, nuevo).**

* **Descripción.** `FENCE = /^ {0,3}(```|~~~)/` (`:220`) y `fenced = !fenced` (`:245`) tratan cualquier línea que empiece por ```` ``` ```` o `~~~` como apertura o cierre. CommonMark solo cierra con el mismo carácter y longitud ≥ a la apertura. Sonda V-23: con un bloque ```` ```` ```` que contiene ```` ``` ````, un `- RF-7.` de ejemplo cuenta como requisito («RF-7 is not cited by any task»); con `~~~` dentro de ```` ``` ````, el resto del archivo queda «dentro» del bloque y se avisa de que no hay criterios de aceptación aunque los haya.
* **Impacto.** Bajo: solo produce `WARN`, nunca cambia exit code ni `VALIDATION`, y `sdd-validate.md` pide a la revisión juzgar cada aviso. Pero el registro afirma que los bloques se ignoran (`V4.0.2-ACCEPTANCE-AUDIT.md:81`), y el test «fenced code … do not distort» solo cubre el caso simple.
* **Corrección mínima.** Guardar el carácter y la longitud de la apertura y cerrar solo con una línea del mismo carácter, de longitud ≥ y sin info string. Añadir los dos casos de V-23 al test.
* **Verificación.** `edge.mjs` (V-23) devuelve `[]` en ambos casos; test verde.

**N-46 (MINOR, nuevo).**

* **Descripción.** En la fuente de verdad de la candidata, `governance/execution/current/README.md:32` (sección v4.0.1, escrita en `c192315` antes de fusionar #181 y no actualizada en `7881266`) dice «PENDING: … human merge of the main -> develop sync PR (replaces #180)». #181 está MERGED (`8681756`), es ancestro de HEAD y la propia sección v4.0.2 de ese archivo y `SESSION-CONTEXT.md:16` lo dicen. Además, `:11` resume el delta de consumidor como «platform.json (version/commit/digest only)», mientras `V4.0.2-PATCH.md:22` (correcto, V-20) incluye `generatedAt`, `sbom` y `provenance`.
* **Impacto.** Bajo. Un agente que siga la fuente de verdad, como exige `CLAUDE.md`, puede intentar una acción humana ya hecha; dos registros del mismo delta divergen.
* **Corrección mínima.** `:32` → «PENDING: v4.0.1 post-release verification record»; `:11` → remitir a `V4.0.2-PATCH.md` §Delta en lugar de duplicarlo. Se puede hacer en el commit de post-release: no toca el bundle, pero cambia el SHA y obliga a reauditar si se hace antes del tag.
* **Verificación.** Lectura de las dos líneas frente a V-20 y V-29.

**N-47 (MINOR, nuevo; código heredado).**

* **Descripción.** El test «N-16: the release build works for every tag …» clona el árbol con `git clone -q --local repoRoot <tmp>` (`release.test.mjs:321`). Con `--local` explícito, git exige hardlinks y no cae a copia. Con el worktree en `D:` y `%TEMP%` en `C:` falla siempre: «fatal: failed to create link … Improper link», status 128. Reproducido 2/2 en el test y con el mismo comando fuera de él (V-14). La auditoría `388e310` lo pasó porque su worktree estaba en `C:`. La CI lo pasa (mismo volumen).
* **Impacto.** Bajo. Un desarrollador con el repositorio en otro volumen ve un FAIL determinista que no indica ningún defecto del producto. No es N-29: no hay «Permission denied», y repetirlo no lo arregla.
* **Corrección mínima.** Quitar `--local`, o usar `--no-hardlinks` (git cae a copia), o crear el temporal junto al repositorio.
* **Verificación.** `release.test.mjs` 19/19 con el worktree en un volumen distinto de `%TEMP%`.

**N-39 (CERRADO).** Se cumple el criterio fijado en `b43b5d6`/`388e310`: `compare develop...main` tiene `ahead_by 0`, y la fuente de verdad de `develop` describe v4.0.1 publicada (V-29).

**N-40, N-43, N-44 y el resto de heredados.** Sus descripciones están en `AUDIT-PLATFORM-388e310.md` §H y en los informes que cita. Siguen vigentes. Re-verificación:

* **En vivo** (V-26..V-28): F-005, N-25, N-32 (empeora a 17), F-008, CodeQL #27, F-007, N-40.
* **En el árbol:** F-002 (4 archivos en `governance/cleanup`).
* **Por diff vacío** sobre su área (V-05): N-31, N-43, N-44, N-11, N-24, F-003, F-004, F-006, F-009, F-010, N-27, N-26. N-26 tampoco se pudo observar: el pilot no se disparó.
* **N-29:** no reproducido (V-13); se mantiene por ROOT-002 y por la evidencia de `V4.0.2-ACCEPTANCE-AUDIT.md:99` (6 FAIL «Permission denied» del Builder).

### H.1 Sugerencias (no restan puntos)

* **S-1..S-35:** heredadas. Sigue crítica S-2: el merge de #183 debe ser *merge commit* (el ruleset permite squash y rebase, V-27).
* **S-36 (nueva).** `VERSIONING-POLICY.md` no dice de forma explícita que un aviso que no cambia exit code ni resultado es PATCH (validación) y no «gate nuevo» (§MINOR). El razonamiento de `V4.0.2-ACCEPTANCE-AUDIT.md:102` y el comentario de `sdd-workflow.mjs:230-231` lo suponen. Una línea en §PATCH evitaría la ambigüedad en la próxima release.
* **S-37 (nueva).** La «Regla general» pide «evidencia en roadmap» antes de cambiar la versión. v4.0.2 no aparece en `governance/roadmaps/` (diff vacío), igual que v3.4.2 y v3.4.3. La evidencia está en `governance/versioning/`. Convendría que la política nombre ese directorio como evidencia válida para PATCH. No resta: es la práctica aceptada por las auditorías anteriores.
* **S-38 (nueva).** `V4.0.2-PATCH.md:24` cita el digest de `e284647` (cierto, V-21), no el del head congelado (`c49b2318…`, V-18). Ninguno será el publicado, que sale del merge commit. Bastaría con decirlo.
* **S-39 (nueva).** `specWarnings` no reconoce encabezados setext («Acceptance criteria» subrayado con `---`). El aviso nombra el formato esperado, así que no engaña.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2 y Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite; EPERM de git en `%TEMP%` | N-29, N-27 | Q5.3 |
| ROOT-003 | Los agentes corren con la identidad Windows y GitHub del propietario | N-40 (y la ponderación de la independencia de este auditor) | Q8.2 |
| ROOT-006 | Llamadas a la API de GitHub de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-007 (nueva) | Los tests y el registro de estado suponen el entorno de quien los escribió: mismo volumen para `%TEMP%` (N-47), bloques de código simples (N-45), una línea de pendientes no revisada tras el merge (N-46) | N-45, N-46, N-47 | Q1.3, Q5.3, Q8.1 (uno por criterio; sin doble descuento) |

## J. QUÉ SOBRA

* REVISAR: `governance/cleanup/*` (F-002).
* REVISAR: `execution/current/README.md:11`, una copia del delta que ya está en `V4.0.2-PATCH.md` (N-46).

En el delta no hay código muerto, scripts sin uso ni residuos nuevos (V-06, V-19).

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 23 MINOR de §H: las correcciones de N-45, N-46 y N-47 descritas arriba; las de N-40, N-43 y N-44 según `AUDIT-PLATFORM-388e310.md` §H; las de los heredados según `AUDIT-PLATFORM-247b284.md` §I/§J y `AUDIT-PLATFORM-6f47eb2.md` §O.

### MEJORAS OPCIONALES

S-1..S-39. No restan puntos, no activan gates y no forman parte del camino a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| Cifras sobre `gi-common-reference/specs` (`V4.0.2-ACCEPTANCE-AUDIT.md:102`) | Fuera de alcance; prohibido tocar ese repositorio | Ninguno: la compatibilidad de exit code está probada con v4.0.1 (V-22) | Repetir `sdd validate` con los dos bundles sobre una copia |
| Revisión independiente de #179 (`:83-94`) | No atestiguada por runtime (lo declara el documento) | Ninguno: esta auditoría revisa el código del delta | — |
| Suite completa local | RAM del host | Dentro de Q5.3; cubierta por la CI del SHA exacto (V-26) | CI remota |
| N-26 en 7881266 | Pilot no disparado (`paths`) | Dentro de Q6.3 (D) | Run del pilot tras cambios en sus rutas |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

Pasaron el build reproducible (V-18), la suite principal en la CI (`ci.yml`) en Linux y Windows sobre el SHA exacto (V-26), los 10 validadores (V-08..V-10) y `pretag` (tests y ejecución real).

**N-47 no activa G3.** Es un test de la suite que falla en local por un supuesto del entorno (mismo volumen), no por el producto: el mismo `git clone --local` falla fuera del test (V-14), y la suite principal (CI) está verde en los dos SO. Mismo criterio que N-29 en `388e310`. Si fallara en la CI, habría que aplicar G3.

**Release-gate contra este informe (V-32).** Ejecutado: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 7881266898c6cc810496a3957010f7c93be4e3c5 --reports <scratchpad>/audit402/reports --root D:\proyectos\ai-native-rel402` → exit 0:

```text
PASS_WITH_WARNINGS (1 warning)
WARNING score 89.25 is below 90 but within the 2-point tolerance
```

El informe es CURRENT para 7881266 y su front matter valida contra el schema. No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 89.25

N-31, N-43, N-45 (Q1.3)              → +0.75
F-002 (Q2.2)                         → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27, N-47 (Q5.3)              → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26, N-44 (Q6.3)                    → +0.75
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27 (Q7.3)             → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-46 (Q8.1)                          → +0.50
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 0.75×9 + 1.00 + 0.50×6 = 6.75 + 1.00 + 3.00 = 10.75
89.25 + 10.75 = 100.00
```

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. Para llegar a 90 hacen falta +0.75:

1. **Q8.1 (+0.50): N-46.** Corregir `execution/current/README.md:11,32`. Solo gobierno; cambia el SHA (reauditar). Sola: 89.75.
2. **Q2.2 (+0.75): F-002.** Archivar o retirar `governance/cleanup/`. Sola: 90.00.
3. **Q1.3 (+0.75): N-45 junto con N-31 y N-43.** Hay que cerrar los tres.
4. **Q5.3 (+1.00): N-47 junto con N-29 y N-27.** N-47 se corrige con una línea; N-29/N-27 exigen una corrida caracterizada.
5. **Q8.2 (+0.50): N-40.** Separación de identidades.
6. El resto, como en `AUDIT-PLATFORM-6f47eb2.md` §O.

Cualquier corrección fuera de `.audit/**` deja STALE este informe. Publicar con 89.25, dentro de la tolerancia, es decisión del humano (precedentes: v3.4.1 con 89.50 y v4.0.1 con 89.25). No se refleja aquí.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 23 MINOR puntuables y la confianza es MEDIA. Para el uso que pide el perfil, un **gate de release con umbral 90 y tolerancia 2**, la candidata v4.0.2 queda **dentro de la tolerancia (89.25 ≥ 88), pero no alcanza 90**.

El delta v4.0.2 hace lo que declara:

* exit code idéntico al de v4.0.1, en los casos PASS y FAIL;
* delta de consumidor de 5 archivos, sin añadidos ni eliminados;
* `platform.json` compatible;
* build reproducible;
* PATCH correcto según la política;
* CI verde.

Los tres hallazgos nuevos son MINOR y no cambian la nota. El cierre de N-39 se compensa con N-46 en el mismo subcriterio.

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 89.25 + 10.75 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los Quality Gates derivan de hallazgos reales (ninguno activo)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 2.25 + 3 | 11.25 |
| Q2 | 3 + 2.25 + 3 + 3 | 11.25 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 3 + 3 + 2.25 | 13.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 1.5 | 14.00 |
| Q7 | 2.25 + 1.5 + 1.5 + 2 + 2.25 | 9.50 |
| Q8 | 1.5 + 1.5 + 1.5 + 2 | 6.50 |
| **Total** | | **89.25** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `388e310` (89.25, otro auditor): 0.00.** Ningún subcriterio cambia de nivel:

* Q8.1: N-39 se cierra y entra N-46 (1.50 = 1.50).
* Q1.3: entra N-45, ya en MENOR.
* Q5.3: entra N-47, ya en MENOR.
* Q7.2: N-32 sube de 10 a 17 alertas; sigue en MENOR.

### Riesgos residuales

* **R-1 (MEDIO).** Mientras ROOT-003 siga abierto, un agente con la credencial del propietario puede aprobar cualquier Environment (V-28).
* **R-2.** El ruleset admite squash y rebase. Un merge de #183 que no sea merge commit deja STALE el SHA auditado (S-2).
* **R-3.** `pretag` es procedimental: no hay ruleset de tags (F-008). `release.yml` sigue siendo la única barrera técnica.
* **R-4.** Las alertas Dependabot crecen sin triage (N-32). Hoy no llegan al bundle (V-19).
* **R-5.** Los avisos nuevos pueden ser falsos en specs con bloques anidados o mixtos (N-45). Son solo avisos.

```text
AUDITED_SHA: 7881266898c6cc810496a3957010f7c93be4e3c5
SCORE: 89.25/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 89.25 (388e310)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 23 (17 heredados; abiertos N-40, N-43, N-44; nuevos N-45, N-46, N-47; cerrado N-39)
DELTA v4.0.2: exit code sin cambios (V-22); 5 archivos distintos, 0 +/0 −, test fuera del bundle (V-19); platform.json compatible (V-20); PATCH correcto (V-24)
BUILD: reproducible (sha256:c49b2318…92d3 ×2; 234 archivos); e284647 → sha256:9305d8b1… (= registro)
PR #183: CI verde (ubuntu 1280+1 skip, windows 1279+2 skips, 0 FAIL, 1281 tests); merge-gate success; MERGEABLE/CLEAN
UMBRAL PLATFORM 90 (tolerancia 2): DENTRO DE TOLERANCIA (89.25 ≥ 88), NO ALCANZA 90
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
