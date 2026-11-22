---
targetRepo: jlbellonGmail/ai-native
targetCommit: 052e7e97f8e8bb110a5bd6b25bade9af9c8abc71
platform:
  version: "v4.0.2 candidate"
  commit: 052e7e97f8e8bb110a5bd6b25bade9af9c8abc71
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-22T19:10:00Z"
scope: "Independent read-only PLATFORM 1.2 audit of the frozen v4.0.2 pre-tag remediation head 052e7e9 (branch release/v4.0.2-remediation, PR #184 to main) over the delta 7881266..052e7e9 outside .audit/** (b980c86 N-45, a63b7a5 N-47, 34b07c3 and 052e7e9 N-46/F-002 governance). Base origin/main 5b3e9cf (merge of #183, untagged); 5b3e9cf differs from 7881266 only in .audit/** (verified). Baseline AUDIT-PLATFORM-7881266.md (89.25); every inherited finding re-verified live or justified by an empty diff over its area. Public v4.0.1 release downloaded and SHA256SUMS-verified, compared with two local builds of 052e7e9 and one of 7881266. Auditor: isolated-context read-only subagent launched from the builder session; it did not write the remediation; it runs under the same Windows and GitHub identity as the builder (N-40, ROOT-003). No fix, commit, push, PR comment, merge, tag, release, workflow dispatch or Environment approval."
score: 89.75
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (remediación previa al tag de v4.0.2, 052e7e9)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               D:\proyectos\ai-native-rem402 (worktree, solo lectura)
Branch:             release/v4.0.2-remediation (= origin por ls-remote); PR #184 a main: OPEN, MERGEABLE, mergeStateStatus CLEAN
                    (BLOCKED mientras corría la CI), 4 commits, headRefOid = 052e7e9
Commit:             052e7e97f8e8bb110a5bd6b25bade9af9c8abc71 (= AUDITED_SHA; igual a HEAD al empezar y al terminar)
Base:               origin/main = 5b3e9cf6faeda2a135241bbecc3f92f4a80d29f8 (merge de #183, contenido v4.0.2, SIN tag).
                    git diff --stat 7881266 5b3e9cf fuera de .audit/** = vacío
Baseline:           AUDIT-PLATFORM-7881266.md (89.25, PASS_WITH_WARNINGS)
Release vigente:    v4.0.1 (878322a), sin cambios
Tag:                ninguno en el commit; v4.0.2 libre local y en origin; sin release v4.0.2
Fecha:              2026-11-22 (UTC ~19:10)
Worktree:           limpio al empezar y al terminar (git status --short vacío); el informe vive FUERA del repositorio
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente con contexto aislado, lanzado desde la sesión del Builder, con
                    instrucciones de solo lectura. No escribió la remediación. Corre con la misma identidad de Windows y de
                    GitHub que el Builder (N-40, ROOT-003): el humano debe ponderar esa independencia. No aprobó ningún
                    Environment ni deployment.
Entorno:            Windows 11 Pro, Git Bash, node v26.12.1, gh (solo lectura), %TEMP% en C:, worktree en D: (el caso de N-47)
Temporales:         <scratchpad>/audit402c: logs, builds b1/b2 (052e7e9) y b788 (7881266), release v4.0.1 (v401),
                    extracciones x401/x402/x788, proyecto de prueba, sondas edge.mjs/edge2.mjs/pjcmp.mjs, copia RED
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 89.75/100
Score final: 89.75/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO CON CORRECCIONES
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM 90 (tolerancia 2, mínimo 88): DENTRO DE LA TOLERANCIA, NO ALCANZA 90 (−0.25).** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR puntuables. Sin N/A.

**La remediación es correcta en código y tests (verificado por mí).**

* Contenido de `7881266..052e7e9` fuera de `.audit/**`: 13 archivos, +84/−49, exactamente los 4 commits declarados. Ninguna área de control (`.github`, `contracts`, `runtime/gates`, `governance/gates`, `runtime/bootstrap`, `runtime/audit`, `build.mjs`, `bundle.mjs`, `pretag.mjs`, `audit/`) cambia (V-05).
* **N-45 CERRADO.** Mis sondas (V-12) dan avisos falsos con el módulo de `7881266` en 6 casos (bloque ```` ```` ```` con ```` ``` ```` dentro, `~~~` dentro de ```` ``` ````, ```` ```js ```` dentro de ```` ``` ````, ```` ``` ```` dentro de `~~~`, código inline ```` ```x``` ````, info string con backtick) y `[]` con el de `052e7e9`. El test nuevo falla contra el módulo viejo (RED, 9/10) y pasa contra el nuevo (V-11).
* **N-47 CERRADO.** `release.test.mjs` 19/19 con el worktree en `D:` y `%TEMP%` en `C:`; el test N-16 pasa (V-14). Fuera del test, `git clone --local` sigue fallando entre volúmenes («Improper link», 128) y `--no-hardlinks` funciona (V-15).
* **N-46 CERRADO.** `execution/current/README.md:11,33` dicen ahora lo cierto, y `SESSION-CONTEXT.md` describe #183 en `main` y #184 (V-29).
* **Exit code sin cambios (E4).** El mismo proyecto de prueba con `sdd-cli.mjs validate` de v4.0.1, de `7881266` y de `052e7e9`: exit 0 en los tres casos PASS y exit 1 en los tres casos FAIL. La candidata ya no da el `WARN` falso de `RF-7`, que `7881266` sí daba (V-22).
* **Delta de consumidor (E4).** v4.0.1 descargada, `SHA256SUMS` OK ×6. Contra mi build: los mismos 5 archivos distintos que en `7881266`, 0 añadidos, 0 eliminados, 234 = 234. Frente a `7881266` solo cambian `sdd-workflow.mjs` y `platform.json` (V-19, V-20). El build es reproducible: `sha256:d303ae12…5a78` ×2, 6/6 assets idénticos (V-18).
* **CI del SHA exacto verde:** 12 workflows success. Hay 1282 tests (+1, el de N-45), 0 FAIL en ubuntu y windows. Esta vez el pilot sí corrió: 4/4 jobs success (V-26).

**F-002 NO SE CIERRA (Q2.2 sigue en MENOR).** La redacción es real y amplia: `governance/cleanup/*`, `SETUP-DOCUMENTATION`, `CENTRALIZATION-CONSUMER-AUDIT` y `AGENT-HUMAN-IDENTITY-SEPARATION` (la cuenta de Windows pasa a `<humano>`). Pero **`governance/standards/ENGRAM-OPERATING-STANDARD.md:28` conserva `D:\tools-ai\engram_db\engram.db`**, y `V4.0.2-PATCH.md:33` dice que en ese archivo «las rutas absolutas pasan a `<workspace>`». El commit `052e7e9` redactó `:43` y dejó `:28`, que no figura entre las excepciones. La línea está en gobierno vigente, en la lista de F-002 de `M7-INVENTORY.md:31`, y no es un ejemplo. → **N-48 (nuevo, MINOR)**, que se puntúa con F-002 en Q2.2.

**Las excepciones deliberadas son razonables** (detalle en §H, F-002). Los ejemplos de qué evitar, ADR-003 y el roadmap M0.2 no son residuos: la ruta es el tema del texto. `governance/history/**` y `execution/archive/**` son evidencia, fuera del alcance con que se midió F-002 desde `247b284` (los `4 archivos` de `governance/cleanup`, y el grep de `M7-INVENTORY` excluye archive/history). Aun así, la definición original de `e4dee28` hablaba de «historia de gobernanza». Para cerrar F-002 sin ambigüedad, esa exclusión debería quedar escrita como política.

**Sensibilidad.** Respecto de `7881266`, solo sube Q8.1, de MENOR a COMPLETO (+0.50): 89.25 → 89.75. Para llegar a 90 basta con cerrar F-002 + N-48: una línea de `ENGRAM-OPERATING-STANDARD.md:28` y la fila de `M7-INVENTORY.md:31`, lo que da +0.75 → 90.50. N-45 y N-47 no mueven la nota: Q1.3 sigue en MENOR por N-31/N-43, y Q5.3 por N-29/N-27.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Diff completo `7881266..052e7e9` fuera de `.audit/**`, leído entero, y cada commit por separado (`git show --stat`).
* `sdd-workflow.mjs:219-257` (regex `FENCE_OPEN`/`FENCE_CLOSE` y bucle), el test nuevo, `release.test.mjs:318-322`, `V4.0.2-PATCH.md` completo, `execution/current/README.md:1-35`, el diff de `SESSION-CONTEXT.md` y los 8 archivos de F-002.
* Definición de F-002 en `AUDIT-PLATFORM-e4dee28.md:188,217-221`, `65fc562:136`, `9678acb:172`, `247b284:180`, `d6c5d4a:144`, `6f47eb2:159`, `388e310` y `7881266:140`.
* Método completo: `audit/README.md`, `PLATFORM.md`, `method.json` y el schema. De `QUALITY_SCORE.md`, §6 Q2.2, §13-16, §28-33 y §34. De `AUDIT_RULES.md`, §25 (residuos) y §67 (evidencia histórica). El resto lo apliqué según la estructura del baseline.

**Ejecutado** (ver §G): 12 validadores, `git diff --check`, `ls-files --eol`, 5 archivos de test uno a uno (68 tests), test nuevo contra el módulo viejo (RED), 2 builds de `052e7e9`, build de `7881266`, descarga y verificación de v4.0.1, diff de bundle y de `platform.json`, exit codes de v4.0.1, `7881266` y `052e7e9`, 2 sondas de casos límite (18 casos), clon entre volúmenes, `pretag` real, `check-agent-isolation`, `check-environment`, `trusted-config`, `release-gate` antes y después, plano de control remoto y grep de rutas de host en todo el árbol.

**No ejecutado localmente:** la suite completa (RAM del host). Evidencia: la CI remota del SHA exacto (V-26).

**No verificado:** F-007; Codex y OpenCode; la revisión independiente de #179 (sin cambios, como en el baseline).

**Error propio corregido:** primero lancé `runtime/circuit/commands.test.mjs`, que no existe (exit 1, «Could not find»). El archivo real es `runtime/adapters/commands.test.mjs`: 10/10 (V-16).

**Accesos remotos (solo lectura):** `gh pr view/checks 184`, `run list/view` (CI con log), `release download v4.0.1`, `api` GET de rulesets, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, environments, code-scanning (también `refs/pull/184/merge`), dependabot y secret-scanning; `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | `sdd validate` avisa de spec sin criterios y de requisito sin tarea; exit code, `validateSpecFolder` y `VALIDATION` sin cambios | OBLIGATORIO (#179) | `V4.0.2-PATCH.md:7` | VERIFICADO (V-11, V-22). Bloques de código según CommonMark: N-45 cerrado (V-12) |
| C-02 | `--json` añade `warnings` (aditivo) | OBLIGATORIO | `sdd-cli.mjs` | VERIFICADO (V-22) |
| C-03 | El Coordinator informa cada `WARN:` | OBLIGATORIO | `core/commands/sdd-validate.md:9` | `commands.test` 10/10 (V-16) |
| C-04 | `CLI_VERSION` = tag | OBLIGATORIO | `ai-native.mjs:23` | VERIFICADO (`pretag`, V-25) |
| C-05 | PATCH; delta de consumidor medido | OBLIGATORIO | `V4.0.2-PATCH.md:13-24` | VERIFICADO (V-19, V-20) |
| C-06 | Bundle determinista, sin código de solo-tests | OBLIGATORIO | `build.mjs`, `bundle.mjs` | VERIFICADO (V-18, V-19) |
| C-07 | Chequeo previo al tag | OBLIGATORIO | `pretag.mjs` | NOT READY fail-closed antes del merge (V-25) |
| C-08 | Tests en CI Linux y Windows | OBLIGATORIO | `ci.yml` | VERIFICADO en 052e7e9 (V-26) |
| C-09 | Gates server-side, HITL único de merge | OBLIGATORIO | ruleset `ai-native-main`, `merge-gate` | IMPLEMENTADO; con F-005, N-25; HITL alcanzable por el agente (N-40) |
| C-10 | Fuente de verdad: `SESSION-CONTEXT.md` y `execution/current/` | OBLIGATORIO | `CLAUDE.md` | Correcta (N-46 cerrado, V-29) |
| C-11 | Separación humano/agente (G5) | PROPUESTA | `AGENT-HUMAN-IDENTITY-SEPARATION.md` | No implantada (N-40) |
| C-12 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO |
| C-13 | Remediación: «rutas absolutas pasan a `<workspace>`» en los archivos listados | DECLARADO | `V4.0.2-PATCH.md:33-36` | INCORRECTO en `ENGRAM-OPERATING-STANDARD.md:28` (N-48) |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31, N-43) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002, N-48) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.00 | MENOR (N-40, F-005) |
| **TOTAL** | **100** | **89.75** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Leyenda: **E** evaluado sobre el delta; **V** re-verificado en vivo o en el árbol; **D** diff `7881266..052e7e9` vacío sobre el área (V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V4.0.2-PATCH.md:26-36` | — | E. La remediación declara su alcance y lo que no hace |
| Q1.2 | Capacidades presentes | 3 | COMPLETO | 3.00 | V-11, V-22 | — | E |
| Q1.3 | Coherencia | 3 | MENOR | 2.25 | V-12; `review-ledger.mjs` y `V4.0.1-PATCH.md` sin diff | N-31, N-43 | E + D. **N-45 cerrado**: los bloques de código cumplen lo que dice `V4.0.2-ACCEPTANCE-AUDIT.md:81`. N-31 y N-43 siguen |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-18 | — | E |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | V-06, V-30 | F-002, **N-48** | E + V. F-002 se reduce mucho, pero queda `ENGRAM-OPERATING-STANDARD.md:28` en gobierno vigente, y el registro afirma lo contrario |
| Q2.3 | Personalización | 3 | COMPLETO | 3.00 | — | — | D |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | V-14 | — | E. El test N-16 ya no depende de estar en el mismo volumen |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `sdd-workflow.mjs:219-257` | — | E |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | `sdd-workflow.mjs:222-223,247-256` | — | E. Dos regex y un estado, sin parser nuevo |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | E |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.0.2-PATCH.md:40-45` | — | E |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | — | — | D |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-07..V-10 | — | E. 12 validadores exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D |
| Q5.3 | Pruebas pasando | 4 | MENOR | 3.00 | V-11..V-17, V-26 | N-29, N-27 | E + V. **N-47 cerrado**: 68/68 en local con repo y `%TEMP%` en volúmenes distintos; 0 «Permission denied» (N-29 no se reprodujo, sigue por ROOT-002). CI: 1282 tests, 0 FAIL ×2 SO |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | V-11 | — | E. Test RED→GREEN de N-45 verificado por mí |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | E. 4 commits semánticos, uno por hallazgo o grupo; PR = local = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-27 | F-005, N-25 | V |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-26 | N-26, N-44 | V + D. Esta vez el pilot corrió y pasó (4/4), pero un pase no caracteriza la intermitencia. `merge-gate.mjs` sin diff |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-19, V-20 | — | E. Sigue siendo PATCH: la corrección solo cambia avisos |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-18 | — | E |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-06, V-27 | F-007 | V. Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-27 | N-32 | V. Sigue en 17 (1 high, 15 medium, 1 low), solo `foundation/` y `template/`; fuera del bundle |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-27 | F-008, CodeQL #27 | V |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-25 | — | E |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | V-29 | — | E + V. **N-46 cerrado**; `SESSION-CONTEXT.md` y `execution/current/README.md` coinciden con git y GitHub |
| Q8.2 | Responsabilidades | 2 | MENOR | 1.50 | V-28 | N-40 | V. BLOCKED |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-27 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-04 | — | E. Hallazgo → commit → test → registro |

## G. LEDGER DE VERIFICACIÓN

Oficial del proyecto salvo (A) complementaria del auditor y (R) remota. Logs en `<scratchpad>/audit402c/logs/`.

| ID | Verificación | Comando/Método | Resultado | Estado |
|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` inicio y fin | `052e7e97f8e8bb110a5bd6b25bade9af9c8abc71` | PASS |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio, durante y al final | PASS |
| V-03 | PR y refs (R) | `gh pr view 184`; `git ls-remote` | OPEN, MERGEABLE, CLEAN, head = 052e7e9; `main` = 5b3e9cf; `develop` = 8681756; `v4.0.2` inexistente | PASS |
| V-04 | Alcance (A) | `git log 7881266..HEAD`; `git diff --stat 7881266 HEAD -- . ':!.audit/**'`; `git show --stat` por commit | b980c86 (2 archivos, N-45), a63b7a5 (1, N-47), 34b07c3 (6), 052e7e9 (8); en total 13 archivos +84/−49. `7881266..5b3e9cf` fuera de `.audit/**`: vacío | PASS |
| V-05 | Áreas sin diff (A) | `git diff --quiet 7881266 HEAD -- <p>` | 0 para `README.md`, `AGENTS.md`, `scripts`, `.github`, `contracts`, `audit`, `runtime/{bootstrap,audit,pilot,adapters,lib,gates,consumer,cli,main.mjs}`, `sdd-cli.mjs`, `review-ledger.mjs`, `governance/{gates,roadmaps,history,execution/archive,adr}`, `V4.0.1-PATCH.md`, `VERSIONING-POLICY.md`, `template`, `foundation`, `evaluation`, `core`, `profiles`, `knowledge`, `mcp`, `package.json`. `runtime/release`: solo `release.test.mjs` | PASS |
| V-06 | Higiene (A) | grep de rutas, tokens, claves y TODO en las líneas añadidas | 0 reales (falsos positivos: «todos», «Secretos») | PASS |
| V-07 | EOL (A) | `git diff --check 7881266 HEAD`; `ls-files --eol` | exit 0; fuera de `i/lf` solo `i/none` | PASS |
| V-08 | Método | `node runtime/audit/cli.mjs check` | PASS | PASS |
| V-09 | Validadores | parity (95/95), contracts, core, compat-matrix, integrity, doc-drift, entrypoints, `validate-audit-safe-script-mode`, `m52/validate-evidence` | exit 0 ×9 | PASS |
| V-10 | CI-listado y pines | `validate-ci-tests-listed.mjs`; `validate-actions-pinned.mjs` | «all 103 committed *.test.mjs files are run by a workflow»; «all actions … pinned by full SHA» | PASS |
| V-11 | Test de N-45, RED y GREEN (A) | `node --test --test-concurrency=1 runtime/circuit/sdd-acceptance-warnings.test.mjs`; el mismo test de HEAD copiado junto al `sdd-workflow.mjs` de `7881266` (copia del bundle `x788`) | HEAD: 10/10. Módulo viejo: 9/10; falla justo «N-45: a fence closes only with the same character…» | PASS |
| V-12 | Casos límite (A) | `edge.mjs` y `edge2.mjs` (18 casos) con `x788` y `x402` | `7881266`: avisos falsos en 6 casos (anidado ```` ```` ````/```` ``` ````, `~~~` en ```` ``` ````, ```` ```js ```` en ```` ``` ````, ```` ``` ```` en `~~~`, inline ```` ```x``` ````, info con backtick) y en las variantes anidada y CRLF. `052e7e9`: `[]` en todos. Bien también: cierre más largo, cierre indentado ≤3, cierre con texto que no cierra (bloque sin cerrar), 4 espacios. Limitación igual en los dos: un bloque dentro de un ítem de lista con 4 espacios no se reconoce (S-40) | PASS |
| V-13 | `sdd-workflow.test` | `node --test …` | 19/19 | PASS |
| V-14 | `release.test` (N-47) | `node --test --test-concurrency=1 runtime/release/release.test.mjs` (repo en D:, `%TEMP%` en C:) | 19/19; «N-16 …» ✔ (153.6 s) | PASS |
| V-15 | Causa de N-47 (A) | `git clone -q --local` y `--no-hardlinks` de D: a `<scratchpad>` en C: | `--local`: exit 128, «failed to create link … Improper link». `--no-hardlinks`: exit 0, HEAD = 052e7e9. No queda otro `--local` en `*.mjs` | PASS |
| V-16 | `pretag.test`, `commands.test` | `runtime/release/pretag.test.mjs`; `runtime/adapters/commands.test.mjs` | 10/10, 0 «Permission denied»; 10/10 | PASS |
| V-17 | Resumen local | V-11, V-13, V-14, V-16 | 68/68 | PASS |
| V-18 | Build reproducible (A) | `build.mjs --version v4.0.2 --commit 052e7e9… --out b1`/`b2`; `--commit 7881266… --out b788` | exit 0 ×3. b1 = b2 en 6/6 assets (`cmp`); `sha256:d303ae12b09cf5968507eeb5dc2dc08000a1f2e6f2e31ff846b85b6e94805a78`; 234 archivos. `7881266` → `sha256:c49b2318…92d3` (= baseline V-18) | PASS |
| V-19 | Delta de consumidor (A/R) | `gh release download v4.0.1` en un directorio vacío; `sha256sum -c SHA256SUMS`; `diff -rq x401 x402`, `diff -rq x788 x402`; `cmp` con blobs de HEAD | 6/6 OK. Frente a v4.0.1: `sdd-validate.md`, `sdd-cli.mjs`, `sdd-workflow.mjs`, `ai-native.mjs`, `platform.json`; 0 añadidos, 0 eliminados; ningún `*acceptance*` en el bundle. Frente a `7881266`: solo `sdd-workflow.mjs` y `platform.json`. Los 4 archivos = blobs de HEAD | PASS (confirma `V4.0.2-PATCH.md:21` y `execution/current/README.md:11`) |
| V-20 | `platform.json` (A) | `pjcmp.mjs`, embebido y publicado | Idénticos `schemaVersion`, `components`, `capabilities` y `bootstrap`. Embebido: cambian `version`, `commit` y `generatedAt`. Publicado: además `digest`, `sbom` y `provenance` | PASS (= `V4.0.2-PATCH.md:22`) |
| V-21 | Clasificación PATCH | `VERSIONING-POLICY.md` sin diff, frente a V-19..V-22 | La remediación solo cambia avisos y un test; no hay gate, schema, skill ni contrato nuevo | PASS |
| V-22 | Exit code v4.0.1 / 7881266 / 052e7e9 (A) | proyecto de prueba: spec sin criterios, RF-2 sin tarea y un bloque ```` ```` ```` con ```` ``` ```` y `RF-7` dentro; `sdd-cli.mjs validate 001-demo --project …` en texto y `--json`; luego una tarea que cita RF-9 | v4.0.1: PASS, exit 0, sin `warnings`. `7881266`: exit 0 con 3 `WARN` (el de `RF-7` es falso). `052e7e9`: exit 0 con 2 `WARN`, y `warnings` = 2. Caso FAIL: exit 1 ×3 | PASS |
| V-23 | (no usado) | — | — | — |
| V-24 | (no usado) | — | — | — |
| V-25 | `pretag` real | `node runtime/release/pretag.mjs --tag v4.0.2 --candidate 052e7e9… --repo jlbellonGmail/ai-native` | NOT READY, exit 1. FAIL: «not an ancestor of origin/main» y release-gate (falta este informe; 34 STALE). PASS: tag libre local y remoto, sin release, `ci.yml` verde, `CLI_VERSION` v4.0.2 | PASS (fail-closed esperado) |
| V-26 | CI remota (R) | `gh run list --commit 052e7e9…`; `gh pr checks 184`; `gh run view 45055820754 --log` | 12 workflows success: CI, Release, CodeQL, SBOM, Trivy, security-scan, Supply chain, Dependency review, pr-gate, pilot, trust-gate y merge-gate. ubuntu: 1282 tests, 1281 pass, 0 fail, 1 skip. windows: 1282, 1280 pass, 0 fail, 2 skips. Pilot offline/online ×2 SO: pass. `human-review`, `merge-gate-finalize`, `publish` y `verify`: skipping | PASS |
| V-27 | Plano de control (R) | `gh api` rulesets, `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, code-scanning, dependabot, secret-scanning | `ai-native-main` activo, sin bypass, `required_approving_review_count 0`, merge/squash/rebase, 6 checks requeridos. `develop`: 404 y 0 reglas. Un solo ruleset, ninguno de tag. CodeQL: [27]; `refs/pull/184/merge`: []. Dependabot: 17 (1 high, 15 medium, 1 low), solo en `foundation/` y `template/` `pnpm-lock.yaml`. Secret scanning: 0 | PASS (con F-005, N-25, F-008, N-32) |
| V-28 | Aislamiento (A/R) | `plan-approval.mjs check-agent-isolation`, `check-environment`, `trusted-config`; `gh api environments` | isolation **BLOCKED** (`AGENT_HUMAN_GH_ACCOUNT`, `AGENT_GIT_CREDENTIAL`). environment PASS. trusted-config PASS (`sourceRevision` 5b3e9cf). `ai-native-human-review`: `prevent_self_review false` | FAIL (N-40 abierto) |
| V-29 | N-46 y fuente de verdad (A/R) | lectura de `execution/current/README.md:1-35` y `SESSION-CONTEXT.md:7-18`, frente a V-03, V-19 y V-20 | `:11` remite a `V4.0.2-PATCH.md` (cierto, V-19/V-20). `:33`: #181 fusionada como `8681756` (cierto). `:9,13,14` y `SESSION-CONTEXT`: #183 en `main` como `5b3e9cf`, sin tag, #184 pendiente (cierto) | PASS (N-46 cerrado) |
| V-30 | F-002 (A) | `git grep -I -E '<unidad>:\\(Users\|Proyectos\|tools-ai)\|…'` y `git grep -i '<cuenta>\|Proyectos\|tools-ai\|engram_db\|AppData'` en HEAD, fuera de `.audit/**` | Gobierno vigente: **`ENGRAM-OPERATING-STANDARD.md:28` `D:\tools-ai\engram_db\engram.db`** (no está en la lista de excepciones). El resto son las excepciones declaradas: `audit/profiles/TEMPLATE.md:411` (`C:\Users\...`), `V3.3.0-RELEASE.md:84` y `runtime/cli/ai-native.mjs:508` (perfil de ejemplo con nombre no ASCII, bug N-18), `ADR-003:21`, `AI-NATIVE-V3-ROADMAP.md:17`, `governance/history/…:1750` y 17 archivos de `governance/execution/archive/ENTERPRISE-10-10-V1/**` (rutas del workspace; en 4 de ellos, rutas de `%TEMP%` con la cuenta de Windows). Fuera de gobierno: `evaluation/m52/evidence/real-cli-linux.json:36-94` (`/home/<cuenta>/…`, evidencia de M5.2). `AGENT-HUMAN-IDENTITY-SEPARATION.md`: sin cuenta de Windows | PARCIAL → F-002, N-48 |
| V-31 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 052e7e9… --root D:\proyectos\ai-native-rem402` | FAIL (35 errores), exit 1: 1 real («no current valid PLATFORM audit report for 052e7e9…») y 34 STALE | ESPERADO |
| V-32 | Release-gate contra este informe | `… release-gate --profile PLATFORM --candidate 052e7e9… --reports <scratchpad>/audit402c/reports --root D:\proyectos\ai-native-rem402` | **PASS_WITH_WARNINGS**, exit 0: «score 89.75 is below 90 but within the 2-point tolerance» | ESPERADO (coherente con §B) |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas (heredado) | `review-ledger.mjs` sin diff | Q1.3 | −0.75 (con N-43) |
| N-43 | INCORRECTO | MINOR | Imprecisiones del registro de N-38 (heredado) | `V4.0.1-PATCH.md` sin diff | Q1.3 | (incluido) |
| F-002 | SOBRA | MINOR | Rutas de la estación de trabajo en gobierno vigente (heredado; muy reducido) | V-30 | Q2.2 | −0.75 (con N-48) |
| **N-48** | INCORRECTO | MINOR | `V4.0.2-PATCH.md:33` dice que en `ENGRAM-OPERATING-STANDARD.md` las rutas absolutas pasan a `<workspace>`, pero `:28` conserva `D:\tools-ai\engram_db\engram.db`; `M7-INVENTORY.md:31` sigue listando como pendientes archivos ya parcialmente saneados | V-30; `ENGRAM-OPERATING-STANDARD.md:28`; `V4.0.2-PATCH.md:33` | Q2.2 | (incluido) |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host (heredados; N-29 no reproducido) | V-16; ROOT-002 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-27 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-27 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | Pilot offline Ubuntu intermitente, sin causa (esta vez pasó) | V-26; `runtime/pilot` sin diff | Q6.3 | −0.75 (con N-44) |
| N-44 | RIESGO | MINOR | `merge-gate` sin reintento ante 5xx (heredado; esta vez success) | `merge-gate.mjs` sin diff | Q6.3 | (incluido) |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-27 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 17 alertas Dependabot abiertas (1 high), fuera del bundle | V-27, V-19 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-27 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |
| N-40 | RIESGO | MINOR | G5 no implantada: el proceso del agente tiene la identidad del propietario | V-28 | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR.**

* Heredados de `6f47eb2` (17): N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009, F-010 (CodeQL #27 dentro de F-008).
* De `c99ed8f`/`388e310` todavía abiertos (3): N-40, N-43, N-44.
* Nuevo (1): N-48.
* Cerrados en este tramo (3): N-45, N-46, N-47.

**N-45 (CERRADO).** `FENCE_OPEN = /^ {0,3}(`{3,}(?=[^`]*$)|~{3,})/` y `FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/` (`sdd-workflow.mjs:222-223`). El bucle (`:247-256`) guarda la secuencia de apertura y solo cierra con el mismo carácter, de longitud igual o mayor y sin info string: es la regla de CommonMark. Se cumple el criterio fijado en `7881266`: los dos casos de V-23 dan `[]` y el test pasa. Además, el test es RED con el módulo viejo (V-11) y mis 18 casos dan `[]` donde corresponde (V-12).

**N-46 (CERRADO).** Se cumple el criterio fijado: `:33` ya no pide un merge hecho, y `:11` remite al delta medido (V-29).

**N-47 (CERRADO).** Se cumple el criterio fijado: `release.test.mjs` 19/19 con el worktree en un volumen distinto de `%TEMP%` (V-14). La causa se confirma fuera del test (V-15).

**F-002 (ABIERTO, muy reducido) y valoración de las excepciones.**

* **Definición.** `e4dee28` (`:188,217-221`): «Registros históricos contienen rutas específicas de workstation», con `governance/cleanup/M7-CLOSURE.md:80-97` como evidencia. `65fc562:136` habla de 8 archivos de `governance/`. De `9678acb` en adelante: 4 archivos, y desde `d6c5d4a`/`6f47eb2`, «Residuos de cierre en `governance/cleanup/`». La medición de referencia de la propia plataforma (`M7-INVENTORY.md:31`) hace el grep «fuera de `legacy`, archive, history, `.audit`» y nombra `TEMPLATE.md`, ADR-002, ADR-003, el roadmap y `ENGRAM-OPERATING-STANDARD.md`.
* **Hecho.** `governance/cleanup/*.md` está limpio: 0 rutas, `M7-CLOSURE.md:80-97` incluido. También están saneados `SETUP-DOCUMENTATION.md`, `CENTRALIZATION-CONSUMER-AUDIT.md` y `AGENT-HUMAN-IDENTITY-SEPARATION.md` (sin cuenta de Windows; `<humano>`/`<workspace>` definidos en `:18`; los comandos no cambian de forma).
* **Pendiente.** `ENGRAM-OPERATING-STANDARD.md:28` (N-48). Es gobierno vigente, está en la lista de `M7-INVENTORY.md:31` y no es un ejemplo. Por eso F-002 no se cierra.
* **Excepciones.** Juzgadas con Q2.2 («elementos **accidentales**») y con AUDIT_RULES §25 (comprobar la finalidad antes de pedir que se borre algo):
  * `TEMPLATE.md:411`, `V3.3.0-RELEASE.md:84` y `ai-native.mjs:508`: **razonables**. Son ejemplos genéricos de qué evitar o de qué rompía; no son rutas de esta estación (`C:\Users\...` y un perfil de ejemplo con nombre no ASCII).
  * `ADR-003:21` y `roadmap:17` (M0.2): **razonables**. La ruta es el objeto de la decisión o de la reparación registrada; quitarla vacía el registro.
  * `governance/history/**` y `governance/execution/archive/**`: **aceptables como evidencia**. Están fuera del alcance con que se midió F-002 desde `247b284`, y el grep de referencia de la plataforma los excluye. Pero 4 de ellos contienen la cuenta de Windows en rutas de `%TEMP%`, y la definición original de F-002 hablaba de «historia de gobernanza». Para que el cierre sea inequívoco, la exclusión de archive/history como evidencia inmutable debe quedar escrita (en `M7-INVENTORY.md` o en una política), no solo en `V4.0.2-PATCH.md:36`. Por sí solas no impedirían cerrar F-002.
* **Fuera de gobierno.** `evaluation/m52/evidence/real-cli-linux.json` contiene `/home/<cuenta>/…`. Es evidencia de M5.2, sin diff y validada por `validate-evidence.mjs`. Nunca formó parte de F-002; lo anoto como S-41, sin puntos.

**N-48 (MINOR, nuevo).**

* **Descripción.** `V4.0.2-PATCH.md:33` afirma que en `ENGRAM-OPERATING-STANDARD.md` «las rutas absolutas pasan a `<workspace>`». El commit `052e7e9` cambió `:43` (`<workspace>\ai-native`) pero dejó `:28` (`D:\tools-ai\engram_db\engram.db`), dentro de la misma sección «Estado Verificado». La lista de excepciones (`:34-36`) no lo menciona. Además, `M7-INVENTORY.md:31` (que el mismo commit editó) sigue diciendo que esos 5 archivos tienen rutas y que hay que «sanitizar en lote 3», sin reflejar lo hecho.
* **Impacto.** Bajo: es documentación y no llega al runtime. Ahora bien, ese registro es el que pide cerrar F-002, y su afirmación es falsa en un punto verificable.
* **Corrección mínima.** `:28` → `<tools>\engram_db\engram.db` (o equivalente), y actualizar la fila `M7-INVENTORY.md:31` con lo que queda y por qué. Solo gobierno; cambia el SHA (reauditar).
* **Verificación.** El grep de V-30 devuelve solo las excepciones declaradas.
* **Puntos.** Se suma a F-002 en Q2.2 (−0.75 en conjunto; regla contra doble penalización).

**Resto de heredados.** Sus descripciones están en `AUDIT-PLATFORM-7881266.md` §H, `388e310` §H y los informes que citan. Siguen vigentes. Re-verificación:

* **En vivo** (V-26..V-28): F-005, N-25, N-32 (sin cambio, 17), F-008, CodeQL #27, F-007, N-40.
* **En el árbol:** F-002 (V-30).
* **Por diff vacío** sobre su área (V-05): N-31, N-43, N-44, N-11, N-24, F-003, F-004, F-006, F-009, F-010, N-27, N-26 (el pilot pasó esta vez, V-26).
* **N-29:** no reproducido (V-16); se mantiene por ROOT-002.

### H.1 Sugerencias (no restan puntos)

* **S-1..S-39:** heredadas. Sigue crítica S-2: el merge de #184 debe ser *merge commit* (el ruleset admite squash y rebase, V-27). S-38 atendida en `V4.0.2-PATCH.md:24`.
* **S-40 (nueva).** `specWarnings` no reconoce bloques de código dentro de ítems de lista indentados 4 o más espacios, ni dentro de blockquotes (V-12, casos 15-16). Pasa igual en `7881266`, así que no es regresión. `V4.0.2-PATCH.md:30` dice «siguen CommonMark», cuando lo que se implementa es la regla de apertura y cierre. Matizarlo evitaría la sobreafirmación.
* **S-41 (nueva).** `evaluation/m52/evidence/real-cli-linux.json` contiene la ruta del perfil Linux del propietario. Si se adopta la política de excepciones de F-002, convendría que la nombre como evidencia.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones | F-005 | Q6.2 y Q8.3 (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite; EPERM de git en `%TEMP%` | N-29, N-27 | Q5.3 |
| ROOT-003 | Los agentes corren con la identidad Windows y GitHub del propietario | N-40 (y la ponderación de la independencia de este auditor) | Q8.2 |
| ROOT-006 | Llamadas a la API de GitHub de un solo intento en los gates | N-44 | Q6.3 |
| ROOT-007 | Supuestos del entorno de quien escribe | N-45, N-46, N-47 cerrados | — |
| ROOT-008 (nueva) | La redacción de F-002 se hizo archivo a archivo sin un grep de cierre que la comprobara | N-48 | Q2.2 |

## J. QUÉ SOBRA

* REVISAR: `governance/standards/ENGRAM-OPERATING-STANDARD.md:28` (F-002, N-48).
* REVISAR: la fila `governance/cleanup/M7-INVENTORY.md:31`, que ya no describe el estado real (N-48).

El delta no añade código muerto, scripts sin uso ni residuos (V-06, V-19).

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 21 MINOR de §H: N-48 y F-002 como se describe arriba; N-40, N-43 y N-44 según `AUDIT-PLATFORM-388e310.md` §H; los heredados según `AUDIT-PLATFORM-247b284.md` §I/§J y `AUDIT-PLATFORM-6f47eb2.md` §O.

### MEJORAS OPCIONALES

S-1..S-41. No restan puntos, no activan gates y no forman parte del camino a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| Suite completa local | RAM del host | Dentro de Q5.3; la cubre la CI del SHA exacto (V-26) | CI remota |
| N-26 caracterizado | Un solo pase del pilot | Dentro de Q6.3 | Serie de runs del pilot |
| F-007; Codex y OpenCode | Heredados | F-007 en Q7.1 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

Pasaron el build reproducible (V-18), la suite principal en la CI (`ci.yml`) en Linux y Windows sobre el SHA exacto (V-26), los 12 validadores (V-08..V-10), 68/68 tests en local (V-17) y `pretag` (tests y ejecución real).

**Release-gate contra este informe (V-32).** Ejecutado: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 052e7e97f8e8bb110a5bd6b25bade9af9c8abc71 --reports <scratchpad>/audit402c/reports --root D:\proyectos\ai-native-rem402` → exit 0:

```text
PASS_WITH_WARNINGS (1 warning)
WARNING score 89.75 is below 90 but within the 2-point tolerance
```

No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 89.75

N-31, N-43 (Q1.3)                    → +0.75
F-002, N-48 (Q2.2)                   → +0.75
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

Suma: 0.75×9 + 1.00 + 0.50×5 = 6.75 + 1.00 + 2.50 = 10.25
89.75 + 10.25 = 100.00
```

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. Para llegar a 90 hacen falta +0.25, y el único paso de un subcriterio que lo da es:

1. **Q2.2 (+0.75): F-002 + N-48.** Redactar `ENGRAM-OPERATING-STANDARD.md:28`, actualizar `M7-INVENTORY.md:31` y, mejor, dejar escrita la exclusión de archive/history como evidencia. Comprobarlo con el grep de V-30. Solo gobierno; cambia el SHA (reauditar). Resultado: **90.50**.
2. **Q1.3 (+0.75): N-31 y N-43.**
3. **Q5.3 (+1.00): N-29 y N-27** (corrida caracterizada).
4. **Q8.2 (+0.50): N-40.**
5. El resto, como en `AUDIT-PLATFORM-6f47eb2.md` §O.

Cualquier corrección fuera de `.audit/**` deja STALE este informe. Publicar con 89.75, dentro de la tolerancia, es decisión del humano. No se refleja aquí.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA?

```text
NO
```

El 100/100 está prohibido: hay 21 MINOR puntuables y la confianza es MEDIA. Para el uso que pide el perfil, un **gate de release con umbral 90 y tolerancia 2**, el head de remediación de v4.0.2 queda **dentro de la tolerancia (89.75 ≥ 88), pero no alcanza 90**.

La remediación cierra de verdad N-45, N-46 y N-47:

* fences según la regla de CommonMark, con un test RED→GREEN;
* el test N-16 pasa con repositorio y `%TEMP%` en volúmenes distintos;
* la fuente de verdad es coherente.

Además, mantiene el exit code de v4.0.1, el mismo delta de consumidor (5 archivos), el build reproducible y la CI verde. F-002 queda a una línea de cerrarse (N-48).

### Comprobación de consistencia

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos, activa gates ni bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino a 100
[x] 89.75 + 10.25 = 100.00 (puntos aplicables = 100, sin N/A)
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
| Q8 | 2 + 1.5 + 1.5 + 2 | 7.00 |
| **Total** | | **89.75** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `7881266` (89.25): +0.50.** Solo un subcriterio cambia de nivel:

* **Q8.1: MENOR → COMPLETO (+0.50).** N-46 era su único hallazgo, y está cerrado.
* Q1.3: N-45 se cierra, pero N-31 y N-43 lo mantienen en MENOR.
* Q2.2: F-002 se reduce, entra N-48 y sigue en MENOR.
* Q5.3: N-47 se cierra, pero N-29 y N-27 lo mantienen en MENOR.
* Q2.4: sigue COMPLETO, ahora sin la nota sobre N-47.
* Q6.3: el pilot pasa una vez; N-26 y N-44 siguen.

### Riesgos residuales

* **R-1 (MEDIO).** Mientras ROOT-003 siga abierto, un agente con la credencial del propietario puede aprobar cualquier Environment (V-28).
* **R-2.** El ruleset admite squash y rebase. Un merge de #184 que no sea merge commit deja STALE el SHA auditado (S-2).
* **R-3.** `pretag` es procedimental: no hay ruleset de tags (F-008).
* **R-4.** Las alertas Dependabot siguen en 17 sin triage (N-32); hoy no llegan al bundle (V-19).
* **R-5.** Si se corrige N-48 después de este informe, hará falta otra auditoría del nuevo SHA antes del tag.

```text
AUDITED_SHA: 052e7e97f8e8bb110a5bd6b25bade9af9c8abc71
SCORE: 89.75/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 89.25 (7881266)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 21 (17 heredados; abiertos N-40, N-43, N-44; nuevo N-48; cerrados N-45, N-46, N-47)
DELTA REMEDIACIÓN: 13 archivos fuera de .audit; exit code igual a v4.0.1 (V-22); 5 archivos de consumidor vs v4.0.1, 2 vs 7881266 (V-19)
BUILD: reproducible (sha256:d303ae12…5a78 ×2; 234 archivos)
PR #184: CI verde (ubuntu 1281+1 skip, windows 1280+2 skips, 0 FAIL, 1282 tests); merge-gate y pilot success; MERGEABLE/CLEAN
UMBRAL PLATFORM 90 (tolerancia 2): DENTRO DE TOLERANCIA (89.75 ≥ 88), NO ALCANZA 90 (falta F-002/N-48: +0.75 → 90.50)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
