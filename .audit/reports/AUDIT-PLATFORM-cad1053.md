---
targetRepo: jlbellonGmail/ai-native
targetCommit: cad1053c309784d19ee4ffd6897d86cfb01be20f
platform:
  version: "v4.0.2 candidate"
  commit: cad1053c309784d19ee4ffd6897d86cfb01be20f
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-22T19:45:00Z"
scope: "Independent read-only PLATFORM 1.2 audit of the frozen v4.0.2 pre-tag remediation head cad1053 (branch release/v4.0.2-remediation, PR #184 to main) over the delta 052e7e9..cad1053 (5 governance documents, +9/-6, no code), with the whole remediation delta 5b3e9cf..cad1053 re-checked by diff. Baseline: independent audit of 052e7e9 (89.75, not committed); every inherited finding re-verified live or justified by an empty diff over its area. Two local builds of cad1053 compared with each other, with the 052e7e9 build and with the SHA256SUMS-verified public v4.0.1 release. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the remediation; it runs under the same Windows and GitHub identity as the builder (N-40, ROOT-003). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 90.50
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (cabeza final de remediación previa al tag de v4.0.2, cad1053)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               D:\proyectos\ai-native-rem402 (worktree, solo lectura)
Branch:             release/v4.0.2-remediation (= origin por ls-remote); PR #184 a main: OPEN, MERGEABLE,
                    mergeStateStatus BLOCKED mientras corría la CI y UNSTABLE al terminar (pilot, no requerido; V-26),
                    5 commits, headRefOid = cad1053
Commit:             cad1053c309784d19ee4ffd6897d86cfb01be20f (= AUDITED_SHA; igual a HEAD al empezar y al terminar)
Base:               origin/main = 5b3e9cf6faeda2a135241bbecc3f92f4a80d29f8 (merge de #183, SIN tag)
Baseline:           auditoría independiente de 052e7e9 (89.75, APTO CON CORRECCIONES; no commiteada)
                    y, en el árbol, AUDIT-PLATFORM-7881266.md (89.25)
Release vigente:    v4.0.1 (878322a), sin cambios
Tag:                ninguno en el commit; v4.0.2 libre local y en origin; sin release v4.0.2
Fecha:              2026-11-22 (UTC ~19:45)
Worktree:           limpio al empezar y al terminar (git status --porcelain vacío); el informe vive FUERA del repositorio
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente con contexto aislado, lanzado desde la sesión del Builder, con
                    instrucciones de solo lectura. No escribió la remediación. Corre con la misma identidad de Windows y de
                    GitHub que el Builder (N-40, ROOT-003): el humano debe ponderar esa independencia. No aprobó ningún
                    Environment ni deployment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, gh (solo lectura), %TEMP% en C:, worktree en D:
Temporales:         <scratchpad>/audit402d: logs, builds b1/b2 (cad1053), extracción xcad. Se reutilizan, sin
                    modificarlas, las extracciones de <scratchpad>/audit402c (x402 = build de 052e7e9, x401 = v4.0.1 pública)
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 90.50/100
Score final: 90.50/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94 «Muy buen nivel»)
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2): ALCANZA 90 (+0.50).** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 19 MINOR puntuables. Sin N/A.

**El delta es solo documental y hace lo que dice (verificado por mí).**

* `052e7e9..cad1053`: 1 commit, 5 archivos de `governance/`, +9/−6. Ningún archivo fuera de `governance/` cambia; ningún `*.mjs`, `*.json` ni `*.yml` (V-04, V-05). EOL `i/lf` en los 5 y `git diff --check` exit 0 (V-07).
* **N-48 CERRADO.** `ENGRAM-OPERATING-STANDARD.md:28` pasa de la ruta absoluta de la estación a `<tools>\engram_db\engram.db`, con `<tools>` definido en la misma línea. `M7-INVENTORY.md:31` registra ahora el estado («ENGRAM sanitizado; `TEMPLATE.md` es un ejemplo de qué evitar; ADR-003 y roadmap M0.2 se conservan como registro»). `V4.0.2-PATCH.md:33` ya no afirma nada falso (V-30).
* **F-002 CERRADO.** Mi barrido completo del árbol fuera de `.audit/**` (V-30) solo encuentra, en gobierno vigente, las excepciones que `V4.0.2-PATCH.md:34-36` registra. La exclusión de `governance/history/**` y `governance/execution/archive/**` como evidencia queda escrita (`V4.0.2-PATCH.md:35`, enlazada desde la fila de `M7-INVENTORY.md:31`) y coincide con cómo se midió F-002 desde `247b284`. La evidencia de M5.2 queda nombrada (S-41 atendida). Detalle en §H.
* **Los placeholders están definidos.** `<workspace-D>` en `M7-CLOSURE.md:73`; `<humano>`/`<workspace>` en `AGENT-HUMAN-IDENTITY-SEPARATION.md:11`, antes del diagrama, como dice el registro. El test que lee ese archivo (`plan-approval-receipt.test.mjs:1405`, «DETECCIÓN NO ES AISLAMIENTO») pasa (V-16).
* **Bundle idéntico en contenido a 052e7e9.** Dos builds de `cad1053`: 6/6 assets idénticos, `sha256:d1545141…e49e`, 234 archivos. Frente al build de `052e7e9` solo cambia `platform.json` embebido (`commit` y `generatedAt`). Frente a v4.0.1, los mismos 5 archivos que en el baseline (V-18, V-19).
* **CI del SHA exacto (V-26).** 11 de 12 workflows en success; 1282 tests, 0 FAIL en ubuntu y windows; los 6 checks requeridos pasan. **El pilot offline de Ubuntu falló** (Docker, exit 125 en 7 de 10 casos). Es N-26, ya abierto y puntuado en Q6.3; `evaluation/` y `runtime/pilot` no tienen diff y el mismo job pasó en `052e7e9`. No es un check requerido.

**Sensibilidad.** Respecto de `052e7e9`, solo sube Q2.2, de MENOR a COMPLETO (+0.75): 89.75 → 90.50. Ningún subcriterio baja. Volver a MENOR en cualquier subcriterio de 3 puntos dejaría la nota en 89.75.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Diff completo `052e7e9..cad1053`, leído entero, y `git show --stat` del commit. Diff por estadística de `5b3e9cf..cad1053` (5 commits, 13 archivos, +88/−50) y log de sus commits.
* Los 5 archivos modificados en las líneas tocadas y su contexto: `ENGRAM-OPERATING-STANDARD.md:20-40`, `M7-INVENTORY.md:31`, `M7-CLOSURE.md:73`, `AGENT-HUMAN-IDENTITY-SEPARATION.md:8-40`, `V4.0.2-PATCH.md:26-40`.
* El informe baseline de `052e7e9` completo (definición e historia de F-002, §H), la estructura de `AUDIT-PLATFORM-7881266.md`.
* Método: `audit/README.md`, `audit/method.json`, `PLATFORM.md`, el schema; de `QUALITY_SCORE.md`, Q2.2 (§6) y §31-32 (bandas y estados). `audit/` sin diff desde el baseline (V-05), así que el resto se aplica como en él.

**Ejecutado** (ver §G): 11 validadores más `audit check`, `git diff --check`, `ls-files --eol`, el archivo de test que lee un documento modificado, 2 builds de `cad1053` y su diff contra `052e7e9` y v4.0.1, `pretag` real, `check-agent-isolation`, `check-environment`, `trusted-config`, `release-gate` antes y después, plano de control remoto, barrido de rutas de host y nombres de cuenta en todo el árbol.

**Reutilizado del baseline por diff vacío (V-05):** los tests de N-45/N-47 (V-11..V-15 del baseline), las sondas de casos límite, los exit codes v4.0.1/7881266/052e7e9 y la descarga de v4.0.1. Ninguno de sus archivos cambia en `052e7e9..cad1053`.

**No ejecutado localmente:** la suite completa (RAM del host). Evidencia: la CI remota del SHA exacto (V-26).

**No verificado:** F-007; Codex y OpenCode; la revisión independiente de #179 (sin cambios, como en el baseline).

**Accesos remotos (solo lectura):** `gh pr view 184`, `run list/view` (con log del pilot), `api` GET de rulesets, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, environments, code-scanning (también `refs/pull/184/merge`), dependabot y secret-scanning; `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | `sdd validate` avisa de spec sin criterios y de requisito sin tarea; exit code, `validateSpecFolder` y `VALIDATION` sin cambios | OBLIGATORIO (#179) | `V4.0.2-PATCH.md:7` | VERIFICADO en el baseline; sin diff (V-05) |
| C-02 | `--json` añade `warnings` (aditivo) | OBLIGATORIO | `sdd-cli.mjs` | Sin diff (V-05) |
| C-03 | El Coordinator informa cada `WARN:` | OBLIGATORIO | `core/commands/sdd-validate.md:9` | Sin diff (V-05) |
| C-04 | `CLI_VERSION` = tag | OBLIGATORIO | `ai-native.mjs:23` | VERIFICADO (`pretag`, V-25) |
| C-05 | PATCH; delta de consumidor medido | OBLIGATORIO | `V4.0.2-PATCH.md:13-24` | VERIFICADO (V-19, V-20) |
| C-06 | Bundle determinista, sin código de solo-tests | OBLIGATORIO | `build.mjs`, `bundle.mjs` | VERIFICADO (V-18, V-19) |
| C-07 | Chequeo previo al tag | OBLIGATORIO | `pretag.mjs` | NOT READY fail-closed antes del merge (V-25) |
| C-08 | Tests en CI Linux y Windows | OBLIGATORIO | `ci.yml` | Ver V-26 |
| C-09 | Gates server-side, HITL único de merge | OBLIGATORIO | ruleset `ai-native-main`, `merge-gate` | IMPLEMENTADO; con F-005, N-25; HITL alcanzable por el agente (N-40) |
| C-10 | Fuente de verdad: `SESSION-CONTEXT.md` y `execution/current/` | OBLIGATORIO | `CLAUDE.md` | Sin diff desde el baseline, que la verificó (V-29) |
| C-11 | Separación humano/agente (G5) | PROPUESTA | `AGENT-HUMAN-IDENTITY-SEPARATION.md` | No implantada (N-40) |
| C-12 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO |
| C-13 | Remediación F-002: rutas de la estación fuera del gobierno vigente, con excepciones registradas | DECLARADO | `V4.0.2-PATCH.md:33-36` | VERIFICADO (V-30): N-48 cerrado |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31, N-43) |
| Q2 Reutilización | 12 | 12.00 | COMPLETO |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.00 | MENOR (N-40, F-005) |
| **TOTAL** | **100** | **90.50** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Leyenda: **E** evaluado sobre el delta; **V** re-verificado en vivo o en el árbol; **D** diff `052e7e9..cad1053` vacío sobre el área (V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V4.0.2-PATCH.md:26-38` | — | E. El registro describe la corrección de N-48 y qué se conserva |
| Q1.2 | Capacidades presentes | 3 | COMPLETO | 3.00 | — | — | D |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | `review-ledger.mjs` y `V4.0.1-PATCH.md` sin diff | N-31, N-43 | D |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-18 | — | E |
| Q2.2 | Sin residuos | 3 | **COMPLETO** | **3.00** | V-06, V-30 | — | E + V. **F-002 y N-48 cerrados**: en gobierno vigente solo quedan las excepciones registradas, que no son accidentales (§H) |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | — | — | D |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | — | — | D |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | — | — | D |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | — | — | D |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.0.2-PATCH.md:40-45` | — | E |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | — | — | D |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-08..V-10 | — | E. 11 validadores y `audit check` exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D |
| Q5.3 | Pruebas pasando | 4 | MENOR | 3.00 | V-16, V-26 | N-29, N-27 | V + D. Local: el archivo afectado por el delta pasa; suite completa en la CI del SHA exacto |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | — | — | D. El test RED→GREEN de N-45 no cambia |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | E. 1 commit semántico que nombra N-48; PR = local = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-27 | F-005, N-25 | V |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-26 | N-26, N-44 | V + D. **El pilot offline de Ubuntu vuelve a fallar** en este SHA (Docker exit 125) tras pasar en `052e7e9`: confirma la intermitencia de N-26, ya puntuada aquí. Sin cambio de nivel |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-19, V-20 | — | E. Sigue siendo PATCH |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-18 | — | E |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-06, V-27 | F-007 | V. Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-27 | N-32 | V. Sigue en 17 (1 high, 15 medium, 1 low), solo `foundation/` y `template/` |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-27 | F-008, CodeQL #27 | V |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-25 | — | E |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | V-29 | — | D. `SESSION-CONTEXT.md` y `execution/current/` sin diff |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | V-28 | N-40 | V. BLOCKED |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-27 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-04 | — | E. Hallazgo → commit → registro |

## G. LEDGER DE VERIFICACIÓN

Oficial del proyecto salvo (A) complementaria del auditor y (R) remota. Logs en `<scratchpad>/audit402d/logs/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` inicio y fin | `cad1053c309784d19ee4ffd6897d86cfb01be20f` | PASS |
| V-02 | Worktree limpio | `git status --porcelain` | vacío al inicio, durante y al final | PASS |
| V-03 | PR y refs (R) | `gh pr view 184`; `git ls-remote` | OPEN, MERGEABLE, BLOCKED con la CI en curso; 5 commits; head = cad1053. `main` = 5b3e9cf; `develop` = 8681756; `release/v4.0.2-remediation` = cad1053; `v4.0.2` inexistente | PASS |
| V-04 | Alcance (A) | `git log --oneline 5b3e9cf..cad1053`; `git diff --stat 052e7e9 cad1053`; `git diff --stat 5b3e9cf cad1053` | `052e7e9..cad1053`: 1 commit (cad1053), 5 archivos de `governance/`, +9/−6. `5b3e9cf..cad1053`: b980c86, a63b7a5, 34b07c3, 052e7e9, cad1053; 13 archivos, +88/−50 | PASS |
| V-05 | Áreas sin diff (A) | `git diff --quiet 052e7e9 cad1053 -- ':!governance'`; `git diff --name-only … -- '*.mjs' '*.js' '*.json' '*.yml'` | exit 0 fuera de `governance/`; 0 archivos de código, datos ni workflows. Dentro de `governance/`, solo los 5 documentos | PASS |
| V-06 | Higiene (A) | lectura de las 9 líneas añadidas | Sin rutas reales, tokens ni TODO; solo placeholders definidos | PASS |
| V-07 | EOL (A) | `git diff --check 052e7e9 cad1053`; `ls-files --eol` de los 5 | exit 0; `i/lf w/lf` ×5 | PASS |
| V-08 | Método | `node runtime/audit/cli.mjs check` | PASS | PASS |
| V-09 | Validadores | `validate-doc-drift`, `validate-integrity`, `validate-core`, `validate-contracts` (21 schemas, 7 data), `validate-parity` (95/95, unmapped 0), `validate-entrypoints`, `validate-audit-safe-script-mode`, `m52/validate-evidence` | exit 0 ×8 | PASS |
| V-10 | CI-listado y pines | `validate-ci-tests-listed.mjs`; `validate-actions-pinned.mjs` | «all 103 committed *.test.mjs files are run by a workflow»; «all actions … pinned by full SHA» | PASS |
| V-11..V-15 | Tests de N-45/N-47, sondas, clon entre volúmenes | Baseline (V-05: `runtime/`, `evaluation/` sin diff) | Heredados: 10/10, RED 9/10 con el módulo viejo, 19/19, 18 casos límite | PASS (por diff vacío) |
| V-16 | Test que lee un documento modificado (A) | `git grep` de los 5 nombres en `*.mjs/*.json/*.yml/*.ps1/*.py`; `node --test --test-concurrency=1 runtime/gates/plan-approval-receipt.test.mjs` | Solo `plan-approval-receipt.test.mjs:1405` lee `AGENT-HUMAN-IDENTITY-SEPARATION.md` (busca «DETECCIÓN NO ES AISLAMIENTO», presente 1 vez). Exit 0. `onboarding-documentation.contract.json:50` nombra `ENGRAM-OPERATING-STANDARD.md` (existe; doc-drift PASS) | PASS |
| V-17 | Resumen local | V-08..V-10, V-16 | 11 validadores + `audit check` + 1 archivo de test, todos exit 0 | PASS |
| V-18 | Build reproducible (A) | `build.mjs --version v4.0.2 --commit cad1053… --out b1`/`b2` | exit 0 ×2. b1 = b2 en 6/6 assets (`cmp`); `sha256:d15451413c4fe6079ce017e2a7606c65d3960270615d7d5d54d819ee01eae49e`; 234 archivos. `ai-native-cli.mjs`, `revocations-1.json` y `cli-revocations-1.json` con el mismo hash que el build de `052e7e9` | PASS |
| V-19 | Delta de consumidor (A) | `diff -rq x402 xcad`; `diff -rq x401 xcad` | Frente a `052e7e9`: solo `platform.json`. Frente a v4.0.1 (descargada y verificada en el baseline): `sdd-validate.md`, `sdd-cli.mjs`, `sdd-workflow.mjs`, `ai-native.mjs`, `platform.json`; 0 añadidos, 0 eliminados | PASS (= `V4.0.2-PATCH.md:21`) |
| V-20 | `platform.json` embebido (A) | `diff x402/platform.json xcad/platform.json` | Solo `commit` y `generatedAt` | PASS |
| V-21 | Clasificación PATCH | `VERSIONING-POLICY.md` sin diff, frente a V-05, V-19 | El delta no toca código ni contrato | PASS |
| V-22..V-24 | Exit codes y casos FAIL | Baseline (V-05) | Heredado | PASS (por diff vacío) |
| V-25 | `pretag` real | `node runtime/release/pretag.mjs --tag v4.0.2 --candidate cad1053… --repo jlbellonGmail/ai-native` | NOT READY, exit 1. FAIL: «not an ancestor of origin/main»; «0 successful ci.yml run(s)» (la CI aún corría). PASS: tag libre local y remoto, sin release, `CLI_VERSION` v4.0.2 | PASS (fail-closed esperado) |
| V-26 | CI remota (R) | `gh run list --commit cad1053…`; `gh pr checks 184`; `gh run view 45059715814 --log` (suma de contadores por SO); `gh run view 45059715877 --log-failed` | 12 workflows completados: 11 success (CI, Release, CodeQL, SBOM, Trivy, security-scan, Supply chain, Dependency review, pr-gate, trust-gate, merge-gate) y **pilot failure**. Los 6 checks requeridos pasan: validators ×2, pin-check, pr-gate, trust-gate, merge-gate. ubuntu: 1282 tests, 1281 pass, 0 fail, 1 skip. windows: 1282, 1280 pass, 0 fail, 2 skips. Pilot: offline windows, online ×2 pass; **offline ubuntu FAIL** (`offline-real.mjs --mode docker`: 3/10 ok, 7 casos `exit=125`). `human-review`, `merge-gate-finalize`, `publish` y `verify`: skipping. PR: MERGEABLE, `mergeStateStatus` UNSTABLE (por el pilot, no requerido) | PASS en la suite y los checks requeridos; FAIL del pilot (N-26) |
| V-27 | Plano de control (R) | `gh api` rulesets, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, code-scanning, dependabot, secret-scanning | `ai-native-main` activo, sin bypass, `required_approving_review_count 0`, merge/squash/rebase, 6 checks requeridos (validators ×2, pin-check, pr-gate, trust-gate, merge-gate). `develop`: «Branch not protected» y 0 reglas. Un solo ruleset. CodeQL: [27]; `refs/pull/184/merge`: []. Dependabot: 17 (1 high, 15 medium, 1 low), solo `foundation/` y `template/` `pnpm-lock.yaml`. Secret scanning: 0 | PASS (con F-005, N-25, F-008, N-32) |
| V-28 | Aislamiento (A/R) | `plan-approval.mjs check-agent-isolation`, `check-environment`, `trusted-config`; `gh api environments` | isolation **BLOCKED** (exit 1). environment PASS. trusted-config PASS. `ai-native-human-review`: `prevent_self_review false` | FAIL (N-40 abierto) |
| V-29 | Fuente de verdad | `SESSION-CONTEXT.md`, `execution/current/` sin diff (V-05) | Igual que en el baseline (coherente) | PASS (por diff vacío) |
| V-30 | F-002 / N-48 (A) | `git grep -n -I -i -E '[A-Za-z]:[\\/](Users\|proyectos\|tools-ai)\|tools-ai\|engram_db\|AppData\|<cuenta>\|/home/[a-z]\|/Users/[A-Za-z]' -- . ':!.audit/**'` y `git grep -E '[C-Z]:[\\/][A-Za-z_]'` fuera de `.audit`, archive, history y `legacy` | `ENGRAM-OPERATING-STANDARD.md:28` → `<tools>\…` (N-48 cerrado). Gobierno vigente: solo `TEMPLATE.md:411-412`, `V3.3.0-RELEASE.md:84`, `ai-native.mjs:508`, `ADR-003:21`, `AI-NATIVE-V3-ROADMAP.md:17` y los placeholders de `AGENT-HUMAN-IDENTITY-SEPARATION.md:11,25,39` (`C:\Users\<humano>`). Registros: `governance/history/…:1750` y 17 archivos de `governance/execution/archive/ENTERPRISE-10-10-V1/**`. Evidencia: `evaluation/m52/evidence/real-cli-linux.json:36-94`. Genéricos (sin cuenta ni raíz de la estación): `C:\tmp\ai-native-h*-smoke*` en `AI-NATIVE-HARDENING-V1.1-ROADMAP.md:265,340,422` y en 4 archivos de `specs/hardening-v1.1-h4/h6`; fixtures de tests (`C:/x`, `/home/u`). El login de GitHub del propietario aparece como identificador funcional (CODEOWNERS, `gates.json`, `OFFICIAL_REPO`, URLs) | PASS → F-002 y N-48 cerrados |
| V-31 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate cad1053… --root D:\proyectos\ai-native-rem402` | FAIL (35 errores), exit 1: 1 real («no current valid PLATFORM audit report for cad1053…») y 34 STALE | ESPERADO |
| V-32 | Release-gate contra este informe | `… release-gate --profile PLATFORM --candidate cad1053… --reports <scratchpad>/audit402d/reports --root D:\proyectos\ai-native-rem402` | **PASS**, exit 0 (score 90.50 ≥ 90, sin warnings; ejecutado dos veces) | ESPERADO (coherente con §B) |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas (heredado) | `review-ledger.mjs` sin diff | Q1.3 | −0.75 (con N-43) |
| N-43 | INCORRECTO | MINOR | Imprecisiones del registro de N-38 (heredado) | `V4.0.1-PATCH.md` sin diff | Q1.3 | (incluido) |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host (heredados) | ROOT-002 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-27 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-27 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | Pilot offline Ubuntu intermitente, sin causa (**falló en este SHA**: Docker exit 125) | V-26; `runtime/pilot`, `evaluation/` sin diff | Q6.3 | −0.75 (con N-44) |
| N-44 | RIESGO | MINOR | `merge-gate` sin reintento ante 5xx (heredado) | `merge-gate.mjs` sin diff | Q6.3 | (incluido) |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-27 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 17 alertas Dependabot abiertas (1 high), fuera del bundle | V-27, V-19 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-27 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | G5 no implantada: el proceso del agente tiene la identidad del propietario | V-28 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 19 MINOR.**

* Heredados de `6f47eb2` todavía abiertos (16): N-31, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009, F-010 (CodeQL #27 dentro de F-008).
* De `c99ed8f`/`388e310` todavía abiertos (3): N-40, N-43, N-44.
* Nuevos: ninguno.
* Cerrados en este tramo (2): F-002, N-48.

**N-48 (CERRADO).** Se cumple la corrección mínima fijada en el baseline: `ENGRAM-OPERATING-STANDARD.md:28` usa `<tools>` (definido en la línea) y la fila `M7-INVENTORY.md:31` registra lo hecho y lo que se conserva. `V4.0.2-PATCH.md:33` describe ahora exactamente lo que hay en el árbol (V-30).

**F-002 (CERRADO).** Juicio de cada ocurrencia restante de V-30 frente a la política de `V4.0.2-PATCH.md:34-36` y a la medición histórica de F-002 (desde `247b284`: gobierno vigente, con el grep de `M7-INVENTORY.md` que excluye `legacy`, archive, history y `.audit`):

* **Gobierno vigente sin rutas de la estación.** `governance/cleanup/*`, `SETUP-DOCUMENTATION`, `CENTRALIZATION-CONSUMER-AUDIT`, `ENGRAM-OPERATING-STANDARD` y `AGENT-HUMAN-IDENTITY-SEPARATION` solo contienen placeholders definidos (`<workspace>`, `<workspace-D>`, `<tools>`, `<humano>`). Ninguna cuenta de Windows queda en gobierno vigente.
* **Ejemplos** (`TEMPLATE.md:411-412`, `V3.3.0-RELEASE.md:84`, `ai-native.mjs:508`): registrados; no son accidentales. Son genéricos (`C:\Users\...`, `/home/nombre...`) o el ejemplo del bug N-18 (un perfil con nombre no ASCII).
* **Registros con la ruta como objeto** (`ADR-003:21`, roadmap M0.2 `:17`): registrados; la ruta es lo que se decidió o reparó.
* **`governance/history/**` y `governance/execution/archive/**`**: registrados como evidencia en `V4.0.2-PATCH.md:35`, con la misma exclusión que el grep de referencia; la fila `M7-INVENTORY.md:31` remite a ese archivo. Es lo que el baseline pedía dejar escrito. No está en un documento de política independiente (S-42), lo que no impide el cierre: el baseline ya dijo que «por sí solas no impedirían cerrar F-002».
* **Evidencia real** (`evaluation/m52/evidence/real-cli-linux.json`): ahora registrada (`V4.0.2-PATCH.md:36`); S-41 atendida.
* **`C:\tmp\ai-native-h*-smoke*`** en el roadmap Hardening V1.1 (cerrado) y en 4 archivos de `specs/hardening-v1.1-*`: rutas temporales genéricas, sin cuenta ni raíz de la estación. No son workstation-specific y ningún informe anterior las midió dentro de F-002. No las cuento; las anoto (S-43).
* **Login de GitHub del propietario** en CODEOWNERS, `gates.json`, `plan-approval.json`, `OFFICIAL_REPO`, URLs y tests: identificador funcional del repositorio público, no residuo. Nunca fue parte de F-002.

Conclusión: no queda ningún elemento accidental en el alcance con que se definió F-002. Q2.2 pasa a COMPLETO.

**N-26 (ABIERTO; recurrencia).** `pilot offline, network really unavailable (ubuntu-latest)` falla en el run 45059715877: `offline-real.mjs --mode docker` da `exit=125` en `net-proof` y en 6 casos más (3/10 ok). El mismo job pasó en `052e7e9` (run 45055820689) y `evaluation/`, `runtime/pilot` y `.github/` no tienen diff. Los dos runs usan `ubuntu-26.04`, con *image release* distinta (`20261116.88` en `052e7e9`, `20261116.202` en `cad1053`). Exit 125 es un fallo de `docker run`, no del CLI. Apunta a infraestructura, pero no lo he demostrado. Confirma que N-26 sigue sin causa; no es un check requerido. Ya está puntuado en Q6.3: no resto otra vez.

**Resto de heredados.** Sus descripciones están en el baseline de `052e7e9` §H, `AUDIT-PLATFORM-7881266.md` §H, `388e310` §H y los informes que citan. Siguen vigentes. Re-verificación:

* **En vivo** (V-26..V-28): F-005, N-25, N-32 (sin cambio, 17), F-008, CodeQL #27, F-007, N-40, N-26.
* **Por diff vacío** sobre su área (V-05): N-31, N-43, N-44, N-11, N-24, F-003, F-004, F-006, F-009, F-010, N-27, N-29.

### H.1 Sugerencias (no restan puntos)

* **S-1..S-40:** heredadas. Sigue crítica S-2: el merge de #184 debe ser *merge commit* (el ruleset admite squash y rebase, V-27). S-41 atendida.
* **S-42 (nueva).** La exclusión de archive/history como evidencia inmutable está escrita en el registro de la versión (`V4.0.2-PATCH.md:35`). Conviene llevarla a un estándar duradero (p. ej. `governance/standards/`) para que no dependa del registro de una versión. Los artefactos archivados de `W1-T2/artifacts/trivy-*.json` contienen además metadatos de autoría de git (nombre y correo). Ya son públicos en el historial, pero esa política debería nombrarlos.
* **S-43 (nueva).** Las rutas `C:\tmp\ai-native-h*-smoke*` del roadmap Hardening V1.1 y de `specs/hardening-v1.1-*` son genéricas. Si se quiere un grep de cierre de F-002 sin ruido, la política podría incluirlas como evidencia de ejecución.
* **S-44 (nueva).** La fila `M7-INVENTORY.md:31` cita 5 archivos y su estado nombra 4. ADR-002 ya no contiene rutas (V-30), pero la fila no lo dice.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2 y Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite; EPERM de git en `%TEMP%` | N-29, N-27 | Q5.3 |
| ROOT-003 | Los agentes corren con la identidad Windows y GitHub del propietario | N-40 (y la ponderación de la independencia de este auditor) | Q8.2 |
| ROOT-006 | Llamadas a la API de GitHub de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-007 | Supuestos del entorno de quien escribe | N-45, N-46, N-47 cerrados | — |
| ROOT-008 | La redacción de F-002 se hizo archivo a archivo sin un grep de cierre | N-48 cerrado; F-002 cerrado | — |

## J. QUÉ SOBRA

Nada puntuable. El delta no añade código muerto, scripts sin uso ni residuos (V-05, V-06, V-19).

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 19 MINOR de §H: N-40, N-43 y N-44 según `AUDIT-PLATFORM-388e310.md` §H; los heredados según `AUDIT-PLATFORM-247b284.md` §I/§J y `AUDIT-PLATFORM-6f47eb2.md` §O.

### MEJORAS OPCIONALES

S-1..S-44 (S-41 atendida). No restan puntos, no activan gates y no forman parte del camino a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| Suite completa local | RAM del host | Dentro de Q5.3; la cubre la CI del SHA exacto (V-26) | CI remota |
| Causa del fallo del pilot (N-26) | Log sin la salida de `docker run` | Dentro de Q6.3 | Re-ejecución con stderr de Docker |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

Pasaron el build reproducible (V-18), la suite principal en la CI (`ci.yml`) en Linux y Windows sobre el SHA exacto (1282 tests, 0 FAIL ×2 SO, V-26), los 11 validadores y `audit check` (V-08..V-10) y `pretag` en modo fail-closed (V-25). El fallo del pilot offline de Ubuntu no es verificación esencial del delta: es un check no requerido, sin diff en su área, con un fallo intermitente ya registrado (N-26). Lo puntúa Q6.3, no G3.

**Release-gate contra este informe (V-32).** Ejecutado: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate cad1053c309784d19ee4ffd6897d86cfb01be20f --reports <scratchpad>/audit402d/reports --root D:\proyectos\ai-native-rem402` → exit 0:

```text
PASS
```

No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 90.50

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

Suma: 0.75×8 + 1.00 + 0.50×5 = 6.00 + 1.00 + 2.50 = 9.50
90.50 + 9.50 = 100.00
```

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. El candidato alcanza el umbral 90 sin más cambios. Orden recomendado después del tag:

1. **Q5.3 (+1.00): N-29 y N-27** (corrida caracterizada).
2. **Q6.3 (+0.75): N-26** (causa del exit 125 del pilot offline, con el stderr de Docker) **y N-44**.
3. **Q1.3 (+0.75): N-31 y N-43.**
4. **Q8.2 (+0.50): N-40.**
5. El resto, como en `AUDIT-PLATFORM-6f47eb2.md` §O.

Cualquier corrección fuera de `.audit/**` deja STALE este informe. Para el tag: merge de #184 como *merge commit* (S-2), y luego `pretag` → READY sobre `main`.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 19 MINOR puntuables y la confianza es MEDIA. Para el uso que pide el perfil, un **gate de release con umbral 90 y tolerancia 2**, la cabeza final de remediación de v4.0.2 **alcanza 90 (90.50)**.

El delta final es documental y exacto: cierra N-48 y, con él, F-002. En gobierno vigente solo quedan excepciones registradas y justificadas, y la exclusión de history/archive está escrita. El bundle es idéntico en contenido al de `052e7e9` (solo cambia el `platform.json` embebido) y reproducible.

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 90.50 + 9.50 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los Quality Gates derivan de hallazgos reales (ninguno activo)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 2.25 + 3 | 11.25 |
| Q2 | 3 + 3 + 3 + 3 | 12.00 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 3 + 3 + 2.25 | 13.50 |
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 1.5 | 14.00 |
| Q7 | 2.25 + 1.5 + 1.5 + 2 + 2.25 | 9.50 |
| Q8 | 2 + 1.5 + 1.5 + 2 | 7.00 |
| **Total** | | **90.50** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `052e7e9` (89.75): +0.75.** Solo un subcriterio cambia de nivel:

* **Q2.2: MENOR → COMPLETO (+0.75).** F-002 y N-48 eran sus únicos hallazgos, y los dos están cerrados (V-30).
* Q6.3: el pilot offline de Ubuntu falla en este SHA tras pasar en `052e7e9`. Es N-26, ya puntuado: sigue en MENOR, sin doble penalización.
* Q8.1, Q1.3 y Q5.3: sin diff en sus áreas; mismo nivel.

### Riesgos residuales

* **R-1 (MEDIO).** Mientras ROOT-003 siga abierto, un agente con la credencial del propietario puede aprobar cualquier Environment (V-28).
* **R-2.** El ruleset admite squash y rebase. Un merge de #184 que no sea merge commit deja STALE el SHA auditado (S-2).
* **R-3.** `pretag` es procedimental: no hay ruleset de tags (F-008).
* **R-4.** Las alertas Dependabot siguen en 17 sin triage (N-32); hoy no llegan al bundle (V-19).
* **R-5.** El pilot offline de Ubuntu no es fiable (N-26): un fallo suyo puede ocultar una regresión real del modo offline.

```text
AUDITED_SHA: cad1053c309784d19ee4ffd6897d86cfb01be20f
SCORE: 90.50/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 89.75 (052e7e9)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 19 (16 heredados de 6f47eb2; abiertos N-40, N-43, N-44; cerrados F-002, N-48; sin nuevos)
DELTA REMEDIACIÓN FINAL: 5 documentos de governance, +9/-6, sin código; bundle = 052e7e9 salvo platform.json embebido (V-19)
BUILD: reproducible (sha256:d1545141…e49e ×2; 234 archivos)
PR #184: CI verde en la suite (ubuntu 1281+1 skip, windows 1280+2 skips, 0 FAIL, 1282 tests); 6/6 checks requeridos pass; pilot offline ubuntu FAIL (N-26); MERGEABLE/UNSTABLE
UMBRAL PLATFORM 90 (tolerancia 2): ALCANZA 90 (90.50)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
