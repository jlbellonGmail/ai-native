---
targetRepo: jlbellonGmail/ai-native
targetCommit: c99ed8f4090136967d48d834f5be0a0897c440a6
platform:
  version: "v4.0.1 candidate"
  commit: c99ed8f4090136967d48d834f5be0a0897c440a6
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-03T05:08:52Z"
scope: "Independent read-only PLATFORM 1.2 audit of the frozen v4.0.1 candidate c99ed8f (branch release/v4.0.1, PR #175 to main) over the whole delta 6f47eb2..c99ed8f: v3.4.3 tag 7bfa2f0 (.audit only), the Plan Approval Receipt bootstrap of #169, #171 and #174 (ced0969, tag v4.0.0 whose release failed) and the pre-tag check, CLI_VERSION v4.0.1 and docs of ced0969..c99ed8f; live GitHub control plane read-only. Baseline and format AUDIT-PLATFORM-6f47eb2.md (90.25); every inherited finding re-verified live or justified by an empty diff 6f47eb2..c99ed8f over its area. Auditor is an isolated-context subagent launched from the builder session with read-only instructions; it did not build or review the candidate. No fix, commit, push, PR, merge, tag or release."
score: 87.75
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.0.1, c99ed8f)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native
Ruta:               C:\Proyectos\worktrees\ai-native\release-audit-v4 (worktree)
Branch:             release/v4.0.1 (= origin; PR #175 abierta contra main, MERGEABLE)
Commit:             c99ed8f4090136967d48d834f5be0a0897c440a6 (= AUDITED_SHA congelado; igual a HEAD al empezar y al terminar)
Base:               origin/main = ced0969 (merge de #174) = cabeza viva de main por API; ancestro directo de 093139d
Tag:                ninguno en el commit. Tag v4.0.0 (objeto cf3059e) sobre ced0969, sin release. Release vigente: v3.4.3 (Latest)
Fecha:              2026-11-03 (UTC 05:08)
Worktree:           limpio al empezar y al terminar (git status --short vacío); este informe vive FUERA del repositorio
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente con contexto aislado, lanzado desde la sesión del Builder,
                    con instrucciones de solo lectura. No participó en la implementación ni en sus revisiones. El
                    humano debe ponderar esa independencia: el lanzamiento y el encargo los hizo la sesión del Builder,
                    y el proceso del auditor corre con la misma identidad de Windows y de GitHub que el Builder (N-40).
Entorno:            Windows 11 Pro 10.0.26200, Git Bash, node v26.12.1, git 2.56.0.windows.1, gh 2.101.0 (solo lectura)
Temporales:         TMP/TEMP = <scratchpad>/at (fuera del árbol); logs y builds del auditor allí
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 87.75/100
Score final: 87.75/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO CON CORRECCIONES
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM de 90 (tolerancia 2, mínimo 88): NO ALCANZADO (−0.25 respecto de 88; −2.25 respecto de 90).** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 23 MINOR puntuables: los 17 heredados de `6f47eb2`, todos re-verificados, y 6 nuevos del delta v4 (N-36..N-41). Sin N/A y sin gates.

**Lo que hace la PR #175 es correcto.** `runtime/release/pretag.mjs` reproduce, antes de crear el tag, las comprobaciones de `release.yml` que fallaron en v4.0.0. Importa las reglas en vez de copiarlas, lee informes y CLI del árbol del candidato y falla cerrado. Lo verifiqué así:

* 10/10 tests en local, y en CI en Linux y Windows.
* Ejecución real de solo lectura: `v4.0.1@c99ed8f` → `NOT READY` por dos motivos esperables (aún no está en `main` y aún no hay informe). `v4.0.0@ced0969` → `NOT READY` por tag consumido, `CLI_VERSION v3.4.3` y falta de auditoría, exactamente lo que dice `V4.0.1-PATCH.md` (V-21, V-22).
* El build es reproducible (×2 idéntico) y rechaza `v4.0.0` (V-23).
* La CI del SHA exacto está verde: ubuntu 1270 PASS / 1 skip y windows 1269 PASS / 2 skips, sobre 1271 tests y 0 FAIL (V-28).

**Lo que baja la nota está en el contenido v4 heredado (#169, #171, #174), que ninguna auditoría había cubierto.**

* **N-36.** La configuración confiable de `main` ya no autoriza el código que `main` ejecuta.
  * #174 cambió `runtime/gates/plan-approval-receipt.mjs`, uno de los `trustedFiles`: el blob pasó de `0c247d7` a `1bc6208`.
  * No se registró una revisión nueva en `governance/gates/plan-approval.json:28`.
  * Mi sonda con el evaluador real da `WORKFLOW_REVISION_UNKNOWN` en `HEAD` y en `ced0969`, y `[]` en `08a8581` (V-30). Todo dispatch desde `main` acaba BLOCKED (fail-closed).
  * Causa: el JSON se commiteó con CRLF (`i/mixed`) contra `.gitattributes`, y se corrigió el código en vez del fichero.
* **N-37.** `PLAN-APPROVAL-RECEIPT.md` sigue describiendo los pines sin fijar, el Environment inexistente (404), un test que exige el fichero sin pines y el estado «corrección local, sin commit». Nada de eso es cierto en `main`.
* **N-38.** El salto MAJOR v3.4.3 → v4 contradice `VERSIONING-POLICY.md`:
  * el delta es aditivo y `bootstrap` es idéntico (V-24);
  * no hay evidencia en el roadmap, impacto identificado ni delta de consumidor documentados.
* **N-39.** `SESSION-CONTEXT.md` y `execution/current/README.md` (fuentes de verdad declaradas) siguen en «candidata v3.4.3 pendiente». No recogen la release v3.4.3, v4, el incidente v4.0.0 ni esta candidata.
* **N-40.** La separación humano/agente (G5) no está implantada, y aun así la App y el Environment ya se crearon y se fijaron en `main`. Desde este mismo proceso de agente, `check-agent-isolation` da `BLOCKED`: `gh` está autenticado como `jlbellonGmail` con `repo, workflow`, y hay credenciales de Git en el almacén (V-31).
* **N-41.** El bundle publica un fixture de pruebas.

**Bloqueos v4 conocidos, ponderados por el método.**

* «TOCTOU NO RESUELTO» y el Coordinator consumer inexistente están declarados como trabajo futuro (`(futuro)` en el flujo). Ningún componente consume hoy un receipt, así que no restan puntos (§23 AUDIT_RULES); quedan como riesgo residual R-2.
* «G5 BLOCKED» resta como N-40, por la contradicción verificada entre la propuesta («la App no debe crearse…») y el estado real.
* «Detección no es aislamiento» está bien declarado. La sonda es fail-closed y la ejecuté: no resta por sí misma.

**Sensibilidad (transparencia para el humano).** El paso de Q1.3 de MENOR a PARCIAL decide el resultado:

* Q1.3 acumula tres contradicciones: N-31 heredado, N-36 y N-37.
* Con MENOR, el score sería 88.50, dentro de la tolerancia.
* Elijo PARCIAL porque N-36 deja inoperable, sin que nada lo registre, el único subsistema nuevo de la MAJOR. Además N-37 contradice la documentación de ese mismo subsistema.
* La práctica de informes anteriores también sumó hallazgos hasta PARCIAL (Q7.3 F-04 + F-23; Q6.6 F-22 + N-08).

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* El diff completo `6f47eb2..c99ed8f`: 20 archivos, +5188/−1 (V-04), en tres tramos.
  * `6f47eb2..7bfa2f0`: solo `.audit/**`.
  * `7bfa2f0..ced0969`: 13 archivos de v4.
  * `ced0969..c99ed8f`: 6 archivos, la PR.
* `pretag.mjs` y `pretag.test.mjs` completos, contra `release.yml:60-114`, `cli-version.mjs`, `assert-unreleased.mjs`, `framework.mjs:80-110`, `report.mjs:83-100` y `audit/cli.mjs`.
* De v4:
  * `plan-approval.json`, `plan-approval-receipt.yml`;
  * `plan-approval-receipt.mjs`: 150-300, 399-420 y 600;
  * `plan-approval.mjs`: 245-262 y 370-460;
  * `plan-approval-artifact.mjs`: 100-162;
  * el test de configuración, en las líneas 850-900;
  * los tres documentos de `governance/security/` completos y los cuerpos de las PR #171 y #174.
* `VERSIONING-POLICY.md`, `V4.0.1-PATCH.md`, `audit/README.md`, `SESSION-CONTEXT.md`, `execution/current/README.md` y `gates.json`.
* El plano de control de GitHub (V-32).

**Ejecutado por el auditor en c99ed8f.** Ver §G:

* los 10 validadores y `git diff --check`;
* 3 archivos de test (161 tests);
* `pretag` real ×2;
* dos builds y un negativo;
* el diff del bundle contra v3.4.3 publicado;
* la sonda N-36;
* `trusted-config`, `check-environment` y `check-agent-isolation` (solo GET o detección local);
* `release-gate` antes de este informe y contra este informe;
* la lectura de los logs de CI, Release (dry-run), pilot, merge-gate y del run real de `plan-approval-receipt`.

**No ejecutado localmente (NOT_RUN).**

* La suite completa: solo corrí archivos sueltos, por la RAM del host.
* `review-ledger`, adapters, bootstrap y CLI: tienen el área sin diff, y su evidencia es la CI remota del SHA exacto (V-28).

**No verificado.**

* Un dispatch o una aprobación reales del flujo de plan approval (no lanzo escrituras). La conclusión de N-36 es E4 sobre el evaluador real con los blobs reales, no E2E.
* La ubicación de la clave privada de la App.
* F-007, Docker y el pilot Ubuntu.
* Codex y OpenCode.

**Accesos remotos.** `gh` autenticado (como el propietario; ver N-40), usado solo con GET: PR #175 y #169/#171/#174, runs y logs, rulesets, protección de `develop`, activity, environments, `users/…[bot]`, releases, CodeQL, Dependabot, secret scanning y `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | Chequeo previo al tag con las reglas de `release.yml` (origin = `--repo`, tag libre local/remoto, sin release, ancestro de `origin/main` fijo, `ci.yml` verde, `CLI_VERSION` = tag, `release-gate` PLATFORM del árbol del candidato); sin overrides; no evaluable = FAIL | OBLIGATORIO (PR #175) | `pretag.mjs:56-116`, `VERSIONING-POLICY.md:76`, `audit/README.md:23` | VERIFICADO (E4: tests 10/10 ×3 entornos; ejecución real V-21/V-22) |
| C-02 | `CLI_VERSION` = tag `v4.0.1`; el build rechaza otra versión | OBLIGATORIO | `ai-native.mjs:23`, `cli-version.mjs` | VERIFICADO (V-23, V-25) |
| C-03 | Un tag publicado no se mueve ni se reutiliza; corrección con la versión siguiente | OBLIGATORIO | `VERSIONING-POLICY.md:76` | VERIFICADO (`v4.0.0` intacto local = origin, sin release; V-26) |
| C-04 | SemVer: MAJOR solo por cambio incompatible, con impacto identificado y evidencia en roadmap | OBLIGATORIO | `VERSIONING-POLICY.md:23-64` | **INCUMPLIDO** (N-38) |
| C-05 | Bundle determinista; delta de consumidor aditivo | OBLIGATORIO (perfil Q6) | `build.mjs` | VERIFICADO (V-23, V-24) |
| C-06 | Plan Approval Receipt: verificador fail-closed (ZIP estricto, configuración confiable de `main`, revisión registrada del workflow, binding inmutable) | DECLARADO como *bootstrap* sin seguridad operativa extremo a extremo | `PLAN-APPROVAL-RECEIPT.md:5-7` | IMPLEMENTADO + 151 tests (V-19, V-20); emisión en `main` **BLOCKED** por N-36 (V-30, V-33) |
| C-07 | La configuración confiable autoriza exactamente los blobs que ejecuta el run | OBLIGATORIO para que C-06 funcione | `plan-approval.json:22-34`, `PLAN-APPROVAL-RECEIPT.md:130,140` | **INCUMPLIDO** (N-36) |
| C-08 | Coordinator consumer y TOCTOU extremo a extremo | FUTURO (declarado «NO RESUELTO», «(futuro)») | `PLAN-APPROVAL-COORDINATOR-CONTRACT.md:3-5` | No implementado (coherente con lo declarado; R-2) |
| C-09 | Separación humano/agente antes de crear la App (G5) | PROPUESTA declarada, con orden («la App no debe crearse…») | `AGENT-HUMAN-IDENTITY-SEPARATION.md:3,58` | **No implantada; App/Environment ya creados y fijados** (N-40) |
| C-10 | Doc drift verde; todo test corre en CI; acciones fijadas por SHA | OBLIGATORIO (perfil Q4, Q5, Q7) | validadores | VERIFICADO (V-12, V-14, V-15) |
| C-11 | Tests de contrato, paridad y regresión en CI Linux y Windows | OBLIGATORIO (perfil Q5) | `ci.yml` | VERIFICADO en `c99ed8f` (V-28) |
| C-12 | Gates server-side y HITL único de merge | OBLIGATORIO (perfil Q8) | ruleset `ai-native-main`, `merge-gate` | VERIFICADO en `main` con F-005; `develop` sin protección (N-25); HITL alcanzable por el agente (N-40) |
| C-13 | Fuente de verdad del estado: `SESSION-CONTEXT.md`, `execution/current/` | OBLIGATORIO | `CLAUDE.md`, `SESSION-CONTEXT.md:3` | **Desactualizada** (N-39) |
| C-14 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO (`isMergeGate: false`; `pretag` no es check requerido) |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 10.50 | PARCIAL en Q1.3 (N-31, N-36, N-37) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002, N-41) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, F-004) |
| Q6 Git/CI/CD/Release | 16 | 13.25 | MENOR (F-005, N-25, N-26, N-38, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 6.50 | MENOR (N-39, N-40, F-005) |
| **TOTAL** | **100** | **87.75** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Las columnas de re-verificación indican: **E** = evaluado de nuevo sobre el delta; **V** = hallazgo re-verificado en vivo o en el árbol; **D** = diff `6f47eb2..c99ed8f` vacío sobre el área (`git diff --quiet` → 0, V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación (re-verificación) |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V4.0.1-PATCH.md`, `PLAN-APPROVAL-RECEIPT.md:5-7` | — | E. Incidente, causa, corrección, lo que `pretag` no ejecuta y los límites de v4 (TOCTOU, G5, consumidor) están declarados |
| Q1.2 | Capacidades prometidas presentes | 3 | COMPLETO | 3.00 | V-19..V-22 | — | E. `pretag` hace lo que promete; el verificador v4 existe con sus pruebas y se declara bootstrap (no se promete operativo) |
| Q1.3 | Coherencia doc/config/código | 3 | **PARCIAL** | 1.50 | V-30, V-33, `review-ledger.mjs` sin diff | N-31, **N-36**, **N-37** | V + E. N-36: la configuración confiable no autoriza el código de `main`, y la PR #174 afirma «no se cambian … workflow». N-37: el documento de seguridad contradice la configuración y el test. N-31 heredado (D). Tres contradicciones, una de ellas inutiliza el subsistema nuevo: inconsistente |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E. Consumidor/TOCTOU declarados como futuro; pendientes de la PR (auditoría, merge, `pretag`, tag) son pasos de promoción |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-23 | — | E. Build ×2 idéntico |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | `ls governance/cleanup` (4), V-24 | F-002, **N-41** | V + E. El bundle incluye `runtime/gates/plan-approval-zip.fixture.mjs`, solo de pruebas (`bundle.mjs:24` excluye solo `*.test.mjs`). Sin rutas ni secretos en el delta (V-07) |
| Q2.3 | Personalización clara | 3 | COMPLETO | 3.00 | — | — | D (`template/`, `core/` sin diff) |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | `pretag.test.mjs:22-53` | — | E. `pretag` evita rutas largas y `push` en `%TEMP%` (flake conocido); sin dependencias de host |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E. `pretag` en `runtime/release/`; v4 en `runtime/gates/`, `contracts/`, `governance/gates|security/` |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `pretag.mjs:15-17` | — | E. `pretag` importa `cli-version`, `assert-unreleased`, `evaluateReleaseGate`: no duplica reglas |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | código | — | E. `pretag` 125 líneas lineales. El verificador v4 (≈1300 líneas) es complejidad esencial de un perfil ZIP cerrado y de la procedencia; sin código muerto observado |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | `PLAN-APPROVAL-RECEIPT.md:139-140` | — | E. Rotar revisiones está diseñado y documentado (que no se hiciera es N-36, no un defecto de diseño) |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación/bootstrap | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `audit/README.md:23`, `VERSIONING-POLICY.md:76` | — | E. El orden de release y `pretag` están documentados, con lo que no ejecuta |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `audit/README.md:23` | — | E. Explica los STALE esperables frente al error real |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-08..V-17 | — | E. 10 validadores en exit 0. `git diff --check` (complementario, no oficial) falla solo por N-36/ROOT-004 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D. La estrategia del delta es buena: `pretag` con git real y `gh` stub, ZIP generado en memoria, mutaciones declaradas |
| Q5.3 | Pruebas ejecutables y pasando | 4 | MENOR | 3.00 | V-18..V-20, V-28 | N-29, N-27 | E + V. Local 161/161; CI del SHA exacto 1271 tests, 0 FAIL en ambos SO. N-29/N-27 heredados sin caracterizar (D) |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | `pretag.test.mjs:95-107` | — | E. El incidente v4.0.0 tiene su regresión; impacto cruzado de N-36 (falta un test config ↔ blobs de HEAD) contado solo en Q1.3 |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff fuera del workflow nuevo | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-04, V-27 | — | E. 6 commits atómicos coherentes con su mensaje; PR = local = origin. La divergencia `main`/`develop` se cuenta en Q8.1 (N-39) |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-32 | F-005, N-25 | V. `required_approving_review_count 0`; `develop` 404 y `rules` = 0 |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-29 | N-26 | V. El pilot offline Ubuntu vuelve a fallar con Docker exit 125 en `c99ed8f` (también en `7bfa2f0` y `07d93c1`); no es requerido |
| Q6.4 | Versionado y releases | 3 | **MENOR** | 2.25 | V-24, V-26 | **N-38** | E. PATCH v4.0.1 bien razonado sobre v4.0.0 consumido, pero la línea MAJOR v4 no cumple la política (delta aditivo, `bootstrap` igual) y falta el delta de consumidor desde v3.4.3 |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-23 | — | E. `sha256:7108b0a0…6dd06c11` ×2; 236 archivos |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D. Delta aditivo; `bootstrap` sin cambios |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-07, V-32 | F-007 | V. Secret scanning 0; F-007 no verificable |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-32 | N-32 | V. **10** alertas Dependabot (1 high, 8 medium, 1 low; antes 7), nuevas #152-154 del 2026-11-01, una en `foundation/` y una de scope `runtime` (`qs`, `template/`) |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-32 | F-008, CodeQL #27 | V. 0 rulesets de tag (el incidente v4.0.0 es su consecuencia: un tag sobre un commit no apto). Las 6 alertas CodeQL nuevas de v4 (#47-52) están descartadas como falso positivo, con motivo correcto (SHA-1 de git blob, offsets ZIP) |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-21, V-30, código | — | E. `pretag` y el verificador v4 fallan cerrado; el workflow nuevo solo con `read` |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D. Workflow nuevo fijado por SHA (V-15) |
| Q8.1 | Fuente única de verdad | 2 | **MENOR** | 1.50 | V-34 | **N-39** | E. `SESSION-CONTEXT.md:7,10` y `execution/current/README.md` describen un estado de hace dos releases; `main` y `develop` divergen (3/4 commits) |
| Q8.2 | Responsabilidades y límites | 2 | **MENOR** | 1.50 | V-31, V-33 | **N-40** | V. El límite agente/humano está definido pero no implantado; la propia sonda da BLOCKED desde el proceso del agente |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-32 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V. `pretag` y el verificador v4 no aparentan éxito ante fallo (V-21, V-30) |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-26, V-27 | — | E. Run 41563775024 (FAIL en release-gate) → `V4.0.1-PATCH.md` → `093139d` → revisión → `199ec6a` → `c99ed8f` → CI → este informe |

## G. LEDGER DE VERIFICACIÓN

Todas las filas son VERIFICACIÓN OFICIAL DEL PROYECTO, salvo las marcadas (A) (VERIFICACIÓN COMPLEMENTARIA DEL AUDITOR) o (R) (evidencia remota, leída y verificada). Los logs están en `<scratchpad>/at/`, fuera del árbol.

| ID | Verificación | Comando/Método | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` (inicio y fin) | `c99ed8f4090136967d48d834f5be0a0897c440a6` siempre | PASS | — |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio y al final | PASS | — |
| V-03 | Base y PR (A) | `gh pr view 175`; `gh api branches/main` | `headRefOid` = HEAD; commits de la PR = los 6 locales; base `main` = `ced0969` = `origin/main` local; `MERGEABLE` | PASS | — |
| V-04 | Alcance | `git diff --stat 6f47eb2..HEAD` por tramos; `git show --stat` por commit | 20 archivos +5188/−1. `6f47eb2..7bfa2f0`: 1 (`.audit/`). `7bfa2f0..ced0969`: 13 (v4). `ced0969..HEAD`: 6. `.github`, `runtime/audit`, `contracts`, `runtime/gates` y `governance/gates` intactos en la PR (`git diff --quiet` = 0), como declara `V4.0.1-PATCH.md` | PASS | — |
| V-05 | Áreas heredadas sin diff (A) | `git diff --quiet 6f47eb2 HEAD -- <p>` | 0 para `README.md`, `AGENTS.md`, `core`, `scripts`, `ci.yml`, `release.yml`, `merge-gate.yml`, `runtime/{bootstrap,audit,pilot,adapters,circuit}`, `template`, `evaluation/fixtures`, `package.json`, `governance/cleanup`, `build.mjs`, `cli-version.mjs`, `assert-unreleased.mjs` | PASS | — |
| V-06 | Higiene del delta de la PR (A) | `git diff --check ced0969 HEAD`; grep de rutas de host, tokens, claves, TODO y emails en las líneas añadidas | exit 0; 0 coincidencias | PASS | — |
| V-07 | Higiene del delta completo (A) | `git diff --check 6f47eb2 HEAD`; `git ls-files --eol` | **exit 2**: 77 líneas de `governance/gates/plan-approval.json` con CR; es el **único** archivo de texto `i/mixed` del repo, contra `.gitattributes:11` (`* text=auto eol=lf`). Ver N-36 / ROOT-004 | FAIL (hallazgo) | — |
| V-08 | Método de auditoría | `node runtime/audit/cli.mjs check` | `PASS`, exit 0 | PASS | — |
| V-09 | Paridad | `node parity/validate-parity.mjs` | exit 0; 576 archivos, unmapped=0; 95/95 | PASS | — |
| V-10 | Contratos | `node contracts/validate-contracts.mjs` | exit 0; 21 schemas, 7 datos | PASS | — |
| V-11 | Core / integridad | `core/validate-core.mjs`; `runtime/status/validate-integrity.mjs` | exit 0 ×2 | PASS | — |
| V-12 | Doc drift | `node runtime/docs/validate-doc-drift.mjs` | exit 0 (no cubre `governance/security/`: N-37 pasa inadvertido) | PASS | — |
| V-13 | Entry points | `node runtime/adapters/validate-entrypoints.mjs` | exit 0 | PASS | — |
| V-14 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | «all 102 committed *.test.mjs files are run by a workflow» | PASS | — |
| V-15 | Acciones fijadas | `node scripts/validate-actions-pinned.mjs` | «all actions … pinned by full SHA» (incluye `plan-approval-receipt.yml`) | PASS | — |
| V-16 | Matriz de compatibilidad | `node evaluation/compat/validate-compat-matrix.mjs` | exit 0; 32 checks | PASS | — |
| V-17 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate c99ed8f… --root .` | **FAIL (31 errors)**, exit 1: 1 real («no current valid…») + 30 STALE. Esperado | ESPERADO | `rg-before.txt` |
| V-18 | Test `pretag` | `TMP=TEMP=<at> node --test --test-concurrency=1 runtime/release/pretag.test.mjs` | **10/10 PASS**, sin flake de git | PASS | `t-pretag.test.mjs.log` |
| V-19 | Test lector ZIP | idem `runtime/gates/plan-approval-artifact.test.mjs` | **34/34 PASS** | PASS | idem |
| V-20 | Test verificador v4 | idem `runtime/gates/plan-approval-receipt.test.mjs` | **117/117 PASS** (G12 corre aquí: existe `cmdkey.exe.mui`) | PASS | idem |
| V-21 | `pretag` real, candidata (A) | `node runtime/release/pretag.mjs --tag v4.0.1 --candidate c99ed8f… --repo jlbellonGmail/ai-native` | **NOT READY**, exit 1. FAIL solo en «reachable from origin/main» (aún no mergeada) y «release-gate» (aún sin informe, +30 STALE). PASS: origin = `--repo`, tag libre local y remoto, sin release, `ci.yml` verde (1 run), `CLI_VERSION` = v4.0.1 | PASS (fail-closed esperado) | — |
| V-22 | `pretag` retroactivo a v4.0.0 (A) | idem con `--tag v4.0.0 --candidate ced0969…` | **NOT READY**: tag ya existe (local y origin, `cf3059e`), `CLI_VERSION v3.4.3`, sin informe vigente; ancestro de main y CI verde PASS. **Coincide con `V4.0.1-PATCH.md`** | PASS | — |
| V-23 | Build reproducible y negativo | `node runtime/release/build.mjs --version v4.0.1 --commit c99ed8f… --out <at>/b{1,2}`; `--version v4.0.0` | exit 0 ×2; `cmp` idéntico; `sha256:7108b0a0045274e765676c58014aee9e3481ce8f5101dbe1af5be8e16dd06c11` ×2; 236 archivos; `platform.json` `version v4.0.1`, `bootstrap` = `{protocol 1, minCliVersion v3.2.0, requiredCapabilities [adopt]}`. Negativo: exit 1 «declares CLI_VERSION v4.0.1; this release is v4.0.0» | PASS | `b1.log`, `bneg.log` |
| V-24 | Delta de consumidor (A) | `gh release download v3.4.3` (sha256 `12c15adc…ea7b` = `SHA256SUMS`); `diff -rq` | Solo en v4.0.1: `contracts/plan-approval-receipt.schema.json`, `runtime/gates/plan-approval{,-receipt,-artifact}.mjs`, **`runtime/gates/plan-approval-zip.fixture.mjs`** (N-41), `runtime/release/pretag.mjs`. Difieren: `audit/README.md`, `contracts/README.md`, `platform.json`, `ai-native.mjs`. Nada se elimina ni cambia de forma incompatible; `bootstrap` idéntico | PASS (con N-38, N-41) | — |
| V-25 | Declaración de versión (A) | `declaredCliVersion` / `assertCliDeclaresTag`; `cat VERSION` | `v4.0.1`; acepta v4.0.1, rechaza v4.0.0; `VERSION` = `3.0.0-dev` | PASS | — |
| V-26 | Incidente v4.0.0 (R) | `gh run view 41563775024`; `git cat-file tag v4.0.0`; `gh api releases` | run `push` del tag sobre `ced0969`: `build` FAIL en «Audit release-gate (PLATFORM profile)», `publish`/`verify` skipped; tag anotado `cf3059e` → `ced0969`; 0 releases `v4*`; v3.4.3 Latest | PASS | — |
| V-27 | Integración de v4 (R) | `gh pr view 169/171/174`; activity; `gh run list --workflow merge-gate.yml` + `approvals` | #169, #171 y #174 → `main`, mergeadas por `jlbellonGmail` (`07d93c1`, `08a8581`, `ced0969`). `main`/`develop` solo `pr_merge`. merge-gate de #171 (`6949a17`) y #174 (`e77909b`): `human-review` success con aprobación de `jlbellonGmail` en `ai-native-human-review`. #175: `human-review` skipped (no toca plano de control), `MERGE_GATE_PASS` | PASS | — |
| V-28 | CI remota de `c99ed8f` (R) | `gh pr view 175 --json statusCheckRollup`; logs de `validators` (jobs 125724197509, 125724197280) | 6 checks requeridos: SUCCESS. ubuntu: 1271 tests, 1270 PASS, 0 FAIL, 1 skip (G12, sin `cmdkey`). windows: 1271, 1269 PASS, 0 FAIL, 2 skips (POSIX). `pretag` 10/10 en ambos. CodeQL, dependency-review, sbom, pin-check, trivy-fs, pr-gate, security-scan, trust-gate, merge-gate: SUCCESS. Release dry-run (`AI_NATIVE_REQUIRE_NETWORK=1`): 1261 tests, 1260 PASS, 0 FAIL, 1 skip; build ×2 OK; release-gate FAIL esperado (`continue-on-error` en PR, SHA de merge `596fc59`) | PASS | `ci-*.log`, `release-build.log` |
| V-29 | Pilot (R) | `gh run view 41577460144`; `gh run list --workflow pilot.yml` | `pilot offline … (ubuntu-latest)` FAIL: Docker exit 125 en `net-proof` y `with-cache/sync`. El mismo patrón aparece en `7bfa2f0` (v3.4.3), `07d93c1` y `635a60c`; pasa en `6daf0f1`, `ced0969` y `08a8581`. Los otros 3 jobs pasan. No es check requerido | N-26 (heredado) | — |
| V-30 | Sonda N-36 (A) | `probe/n36.mjs`: `evaluateWorkflowRevision` de HEAD con la configuración real y los blobs reales de `trustedFiles` en cada ref | `HEAD`: `WORKFLOW_REVISION_UNKNOWN`; `ced0969`: `WORKFLOW_REVISION_UNKNOWN`; `08a8581`: `[]`. Los blobs de `07d93c1` son aceptados. El blob registrado de `plan-approval-receipt.mjs` es `0c247d7`; el de `main` es `1bc6208` desde `db42c36` (#174) | PASS (confirma N-36) | — |
| V-31 | Aislamiento del agente (A) | `node runtime/gates/plan-approval.mjs check-agent-isolation` (desde este proceso de agente); `gh auth status --json hosts` (sin token) | **BLOCKED**: `AGENT_HUMAN_GH_ACCOUNT` (`gh` como `jlbellonGmail`, scopes `gist, read:org, repo, workflow`) y `AGENT_GIT_CREDENTIAL` (3 destinos `github` en el almacén) | PASS (confirma N-40) | — |
| V-32 | Plano de control (R) | `gh api` rulesets, `branches/develop/protection`, `rules/branches/develop`, code-scanning, dependabot, secret-scanning, `releases` | Ruleset `ai-native-main` (24405506) activo, sin bypass: deletion, non_fast_forward, pull_request (`required_approving_review_count 0`; merge/squash/rebase permitidos), 6 checks requeridos (strict). `develop`: 404 y 0 reglas. CodeQL abiertas: 1 (#27). #47-52 (v4) descartadas FP. Dependabot: 10 (1 high, 8 medium, 1 low). Secret scanning: 0. Rulesets de tag: 0 | PASS (con F-005, N-25, F-008, N-32) | — |
| V-33 | Estado vivo v4 (R) | `gh run list --workflow plan-approval-receipt.yml`; `gh run view 41369500299 --log-failed`; `plan-approval.mjs trusted-config` / `check-environment`; `gh api environments/ai-native-plan-approval`, `users/ai-native-plan-approval%5Bbot%5D` | Un único run real (dispatch del 2026-11-02 sobre `08a8581`): BLOCKED `CONFIG_NOT_FROM_REVISION` (el CRLF que #174 trató). Ninguno desde #174. `trusted-config`: PASS (blob `9eae0fe…`, sourceRevision `ced0969`). `check-environment`: PASS. El Environment existe (id 25906730072, sin bypass, `prevent_self_review`, reviewer único 215926636, solo `main`) y el bot existe (id 350901564, `Bot`) | PASS (con N-36, N-37, N-40) | — |
| V-34 | Fuente de verdad (A) | lectura de `SESSION-CONTEXT.md`, `execution/current/README.md`; `git rev-list --count` `origin/main` ↔ `origin/develop` (= API) | `SESSION-CONTEXT.md:7,10`: «candidata v3.4.3 … v3.4.2 sigue siendo la release vigente». `execution/current/README.md:1-20`: «v3.4.3 TAG / RELEASE: NOT CREATED». Sin mención de v3.4.3 publicada, v4, v4.0.0 ni v4.0.1. `main` tiene 3 commits que `develop` no tiene, y `develop` 4 que `main` no tiene | FAIL (hallazgo N-39) | — |
| V-35 | release-gate contra este informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate c99ed8f… --root . --reports <dir con este informe>` | **FAIL**, exit 1: «score 87.75 is below the release threshold 90 (tolerance 2)». El informe es válido y CURRENT; el gate lo rechaza por la nota | ESPERADO (coherente con §B) | `rg-after.txt` |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-36 | INCORRECTO / CONTRADICTORIO | MINOR | La configuración confiable de `main` no autoriza el código que ejecuta: el workflow de plan approval queda BLOCKED | `plan-approval.json:28`; `plan-approval-receipt.mjs:176-186,274`; V-07, V-30, V-33 | Q1.3 | −0.75 (con N-37) |
| N-37 | OBSOLETO / CONTRADICTORIO | MINOR | `PLAN-APPROVAL-RECEIPT.md` describe pines sin fijar, Environment 404 y estado local sin commit | `PLAN-APPROVAL-RECEIPT.md:5,42-50,186,345` frente a `plan-approval.json:22-44,39,44` y `plan-approval-receipt.test.mjs:850-890` | Q1.3 | (incluido arriba) |
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas (heredado) | `review-ledger.mjs` sin diff (V-05) | Q1.3 | −0.75 |
| F-002 | SOBRA | MINOR | Residuos de cierre en `governance/cleanup/` (heredado) | `ls governance/cleanup` | Q2.2 | −0.75 (con N-41) |
| N-41 | SOBRA | MINOR | El bundle publica un fixture de pruebas | V-24; `bundle.mjs:24`; `PLAN-APPROVAL-RECEIPT.md:128` | Q2.2 | (incluido arriba) |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host Windows sin caracterizar (heredados) | V-05; no reproducidos en V-18 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-32 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-32 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | CI: pilot offline Ubuntu inestable (Docker exit 125), diferido | V-29 | Q6.3 | −0.75 |
| N-38 | INCORRECTO | MINOR | MAJOR v4 sin cambio incompatible ni justificación según la política; falta el delta de consumidor desde v3.4.3 | `VERSIONING-POLICY.md:23-36,57-65`; `V4.0.1-PATCH.md:30`; V-24 | Q6.4 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-32 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 10 alertas Dependabot (1 high) en `template/` y `foundation/` | V-32 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-32, V-26 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |
| N-39 | OBSOLETO | MINOR | Fuente de verdad del estado desactualizada; `main` y `develop` divergen | V-34 | Q8.1 | −0.50 |
| N-40 | RIESGO | MINOR | G5 no implantada mientras App/Environment ya están creados y fijados; la credencial del propietario es alcanzable por los agentes | V-31, V-33; `AGENT-HUMAN-IDENTITY-SEPARATION.md:3,58` | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 23 MINOR.**

* **Heredados (17):** N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009 y F-010.
* **Nuevos (6):** N-36, N-37, N-38, N-39, N-40 y N-41.
* **Cerrados:** ninguno.

**N-36 (MINOR, nuevo).**

* **Descripción.** `workflow.trustedRevisions` registra una sola revisión, `r1-07d93c13d7a8`, con `runtime/gates/plan-approval-receipt.mjs` = `0c247d7` (`plan-approval.json:28`).
  * #174 (`db42c36`) cambió ese archivo (`sameConfigBytes`) a `1bc6208` sin registrar una revisión nueva. Su descripción dice «no se cambian pins, App, permisos, Environment ni workflow».
  * `evaluateRequest` (`plan-approval-receipt.mjs:274`) y `verifyReceiptProvenance` (`:484`) exigen que los blobs del run coincidan con una revisión registrada.
  * Mi sonda (V-30) da `WORKFLOW_REVISION_UNKNOWN` con los blobs reales de `ced0969` y de `c99ed8f`. Ninguna emisión ni verificación puede pasar en `main` hasta registrar `r2`.
  * Es fail-closed, no inseguro. Pero el subsistema v4, que es el contenido nuevo de la MAJOR, está inoperable sin que ningún documento ni test lo registre.
  * El test de configuración (`plan-approval-receipt.test.mjs:871-886`) fija la revisión antigua y no la contrasta con los blobs de `HEAD`. Por eso la deriva pasó la CI.
* **Causa raíz (ROOT-004).** #171 commiteó `plan-approval.json` con CRLF (77 CR, `i/mixed`), contra `.gitattributes:11`. El único run real lo bloqueó (`CONFIG_NOT_FROM_REVISION`, V-33). Se corrigió el comparador, que es un fichero confiable, en vez de renormalizar el JSON.
* **Impacto.**
  * El flujo declarado no puede emitir ni verificar.
  * `git diff --check` falla sobre el delta (V-07).
  * Cualquier `git add --renormalize` futuro cambiará la identidad de la configuración.
* **Corrección mínima suficiente.**
  1. PR de configuración (plano de control, revisión humana) que añada `r2-<M>` con los blobs de `main`, obtenidos con `git rev-parse M:<path>`, y retire `r1` si procede.
  2. Decidir si se renormaliza `plan-approval.json` a LF en esa misma PR: cambia la identidad, sin receipts emitidos hoy.
  3. Añadir un test que compare cada blob registrado con `git rev-parse HEAD:<path>`, o que falle si ninguna revisión cubre `HEAD`.
* **Verificación de cierre.** V-30 da `[]` en el nuevo `HEAD`, `git ls-files --eol` no muestra `i/mixed` y `git diff --check` sale con 0.
* **Puntos recuperables.** +0.75 en Q1.3, junto con N-37.

**N-37 (MINOR, nuevo).**

* **Descripción.** `PLAN-APPROVAL-RECEIPT.md` afirma varias cosas que en `main` ya no son ciertas:
  * los tres pines están sin fijar: «Valor hoy» `null`/`[]`, `:42-48`;
  * «un test fija que el fichero del repositorio sigue sin ellos» (`:50`);
  * `GET environments/ai-native-plan-approval` → 404 (`:186`);
  * su estado es «bootstrap local … pendiente de tercera revisión» (`:5`) y «corrección local, sin commit» (`:345`).
* En `main` (`plan-approval.json:39,44` y `trustedRevisions`) los tres pines están fijados. El test exige los valores fijados (`:850-890`), y el Environment y el bot existen (V-33). `validate-doc-drift` no cubre `governance/security/` (V-12).
* **Corrección.** Actualizar el estado, la tabla de pines, la línea del Environment y el texto del test, y dejar constancia del pendiente de N-36.
* **Verificación.** Leer el documento contra `plan-approval.json` y V-33.
* **Puntos.** Incluidos en el +0.75 de Q1.3.

**N-38 (MINOR, nuevo).**

* **Descripción.** `VERSIONING-POLICY.md:23-28` limita MAJOR a cuatro casos:
  * romper el lock;
  * cambiar el kernel;
  * cambiar el bootstrap;
  * eliminar o cambiar un schema, una skill o las entradas de un workflow reutilizable.
* Agregar gates y schemas es MINOR (`:30-34`). Antes de cambiar una versión debe haber evidencia en el roadmap e impacto identificado (`:57-65`).
* El delta `v3.4.3 → v4.0.1` es aditivo: `bootstrap` idéntico y nada eliminado (V-24). `AGENTS.md`, `core/` y los contratos existentes no cambian (V-05).
* No hay ningún `V4.0.0-*.md` ni entrada de roadmap v4. `V4.0.1-PATCH.md:30` declara que «la decisión MAJOR … esta candidata no la revisa», y solo documenta `ced0969..c99ed8f`. Los consumidores de v3.4.3 no tienen su delta: 5 módulos nuevos, un schema, `pretag` y READMEs.
* El PATCH v4.0.1 sobre un v4.0.0 consumido sí está bien razonado.
* **Corrección.** Un documento de release v4 que justifique la MAJOR contra la política, o que registre la excepción humana, y que incluya el delta de consumidor desde v3.4.3. Alternativa: reconsiderar la numeración antes de publicar.
* **Verificación.** Inspección del documento y coherencia con `VERSIONING-POLICY.md`.
* **Puntos.** +0.75 en Q6.4.

**N-39 (MINOR, nuevo).**

* **Descripción.** Las fuentes de verdad del estado (`CLAUDE.md`; `SESSION-CONTEXT.md:3`) describen en la candidata un estado de hace dos releases:
  * `SESSION-CONTEXT.md:7,10`: «candidata v3.4.3 … v3.4.2 vigente»;
  * `execution/current/README.md`: «v3.4.3 TAG / RELEASE: NOT CREATED».
* `main` y `develop` divergen. `develop` conserva los registros post-release de v3.4.3 y `main` lleva v4 sin pasar por `develop` (V-34).
* `V4.0.1-PATCH.md:37` lo reconoce y lo aplaza. Es deuda declarada, pero la release saldría con una fuente de verdad que contradice el estado real.
* **Corrección.** Sincronizar `main` ↔ `develop` y actualizar los dos ficheros con v3.4.3 publicada, v4, el incidente v4.0.0 y v4.0.1. Hay que hacerlo antes de esta auditoría (reauditar) o justo después del release, como post-release.
* **Verificación.** Lectura de los dos ficheros y `git rev-list --count` en ambos sentidos = 0, o divergencia solo en `.audit/**`.
* **Puntos.** +0.50 en Q8.1.

**N-40 (MINOR, nuevo).**

* **Descripción.**
  * `AGENT-HUMAN-IDENTITY-SEPARATION.md` es una «PROPUESTA. No implantada» (`:3`). Dice que, hasta implantarla, «G5 permanece BLOCKED y la App no debe crearse con la clave en un lugar legible por el perfil humano-agente compartido» (`:58`).
  * La App existe (bot 350901564) y el Environment también (25906730072), los dos fijados en `main` por #171 (V-33).
  * Desde este mismo proceso de agente, `check-agent-isolation` da BLOCKED (V-31): `gh` está autenticado como el propietario con `repo, workflow`, y hay credenciales `github` en el almacén.
  * Con esa credencial, un agente puede aprobar como el propietario el Environment `ai-native-plan-approval` y también `ai-native-human-review` (HITL del `merge-gate`). Las dos aprobaciones de V-27 constan como `jlbellonGmail` y no distinguen humano de agente.
  * No verifiqué dónde está la clave privada de la App.
* **Por qué MINOR y no más.** Está declarado («Detección no es aislamiento», «no presentar … como garantía») y ningún componente consume hoy un receipt. La exposición del HITL de merge es preexistente, con la gobernanza `SingleMaintainer` (`gates.json`). Lo nuevo es la contradicción entre la orden de la propuesta y el estado real.
* **Corrección.** Implantar los pasos 1-5 de la propuesta, o registrar una decisión humana explícita que acepte el riesgo y retire la orden.
* **Verificación.** `check-agent-isolation` → `PASS` desde el perfil del agente.
* **Puntos.** +0.50 en Q8.2.

**N-41 (MINOR, nuevo).**

* **Descripción.** `runtime/gates/plan-approval-zip.fixture.mjs` es solo de pruebas («no lo ejecuta ningún run», `PLAN-APPROVAL-RECEIPT.md:128`). Aun así se publica en el bundle (V-24), porque `bundle.mjs:24` solo excluye `*.test.(mjs|ps1)`.
* **Corrección.** Excluirlo del bundle, o renombrarlo a un patrón excluido, y ajustar sus imports.
* **Verificación.** `diff -rq` del bundle sin ese fichero.
* **Puntos.** Incluidos en el +0.75 de Q2.2, junto con F-002.

**Resto de hallazgos (heredados).** Su descripción, corrección y verificación están en `AUDIT-PLATFORM-247b284.md` §I/§J, `AUDIT-PLATFORM-d6c5d4a.md` §H y `AUDIT-PLATFORM-6f47eb2.md` §H, y siguen vigentes. Los re-verifiqué así:

* **En vivo:** F-005, N-25, N-32 (que pasa de 7 a 10 alertas), F-008, CodeQL #27, F-007 y N-26 (el pilot, V-29).
* **En el árbol:** F-002.
* **Por diff vacío** `6f47eb2..c99ed8f` sobre su área (V-05): N-31, N-11, N-24, F-003, F-004, F-006, F-009, F-010 y N-29/N-27.

### H.1 Sugerencias (no restan puntos)

* **S-1..S-27:** heredadas, sin cambio. S-2 sigue vigente y es crítica para esta candidata. El ruleset permite squash y rebase (V-32), así que el merge de #175 debe ser *merge commit* o este informe queda STALE (lo pide `V4.0.1-PATCH.md:35`).
* **S-28 (nueva).** `pretag.mjs:69-71` compara `--repo` con el `remote.origin.url` crudo, mientras que `ls-remote` (`:76`) usa la URL reescrita por `url.*.insteadOf`. El propio test se apoya en esa reescritura (`pretag.test.mjs:50`). Un `insteadOf` local hacia otro repositorio pasaría el control de origen. Usar `git ls-remote --get-url origin` cerraría ese caso (`release.yml` sigue siendo la autoridad).
* **S-29 (nueva).** `reportsAt` (`pretag.mjs:37`) convierte un `ls-tree` fallido en «sin informes». Es fail-closed, pero el mensaje sería «no current valid report» en vez del error de git.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos relacionados | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones (0) | F-005 | Q6.2 y Q8.3, con descuento proporcional (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite; causa del flake no demostrada | N-29 | Q5.3 (un solo descuento) |
| ROOT-003 | Los agentes corren con la identidad Windows y GitHub del propietario | N-40 (y la ponderación de la independencia del auditor, §A) | Q8.2 (un solo descuento) |
| ROOT-004 | `plan-approval.json` commiteado con CRLF contra `.gitattributes`; se corrigió un fichero confiable en vez del dato y no se registró la revisión nueva | N-36 (y V-07) | Q1.3 (un solo descuento; impacto cruzado en Q5.1/Q5.4 no descontado) |

## J. QUÉ SOBRA

* REVISAR: `governance/cleanup/*` (F-002, heredado).
* SIMPLIFICAR: excluir `runtime/gates/plan-approval-zip.fixture.mjs` del bundle (N-41).

No encontré código muerto ni scripts sin uso en el delta. `pretag.mjs` no duplica reglas: las importa.

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 23 MINOR abiertos de §H: las correcciones de N-36..N-41 detalladas arriba y las de los heredados según `AUDIT-PLATFORM-247b284.md` §I/§J. Para Q5.3, además, una corrida limpia y caracterizada que cierre N-29/N-27.

### MEJORAS OPCIONALES

S-1..S-29. No restan puntos, no activan Quality Gates, no bloquean 100/100 y no forman parte del camino obligatorio a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| Suite completa local | RAM del host; solo archivos sueltos | Dentro de Q5.3 (N-29); cubierto por la CI remota del SHA exacto (V-28) | CI remota |
| Dispatch y aprobación reales de plan approval | Son escrituras (fuera del encargo) | Ninguno adicional: N-36 queda demostrado con el evaluador real (E4) | Tras N-36, un dispatch real con la App |
| Ubicación de la clave privada de la App | No accesible por API | Dentro de N-40 | Revisión del propietario |
| Lectura del Environment con el `GITHUB_TOKEN` del workflow | No hubo run que llegara a ese paso | Ninguno (declarado `ENV_UNREADABLE` ⇒ BLOCKED) | El run de cierre de N-36 |
| F-007 | No verificable por API | Q7.1 | Revisión manual |
| Docker y el pilot Ubuntu / Codex / OpenCode | Heredados | N-26; el resto ninguno | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

G3: las capacidades esenciales están en verde:

* bootstrap y build reproducibles;
* la suite principal en CI, en Linux y Windows, sobre el SHA exacto;
* los 10 validadores;
* la capacidad de la PR (`pretag`), en tests y en ejecución real.

El fallo del pilot offline Ubuntu (N-26) no es un check requerido y es intermitente y preexistente. El bloqueo del flujo v4 (N-36) es fail-closed de un subsistema declarado *bootstrap*, no de una capacidad esencial.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 87.75

N-36, N-37 (Q1.3)                    → +0.75
N-31 (Q1.3)                          → +0.75
F-002, N-41 (Q2.2)                   → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 (Q5.3)                    → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26 (Q6.3)                          → +0.75
N-38 (Q6.4)                          → +0.75
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27 (Q7.3)             → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-39 (Q8.1)                          → +0.50
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 0.75×11 + 1.00 + 0.50×6 = 8.25 + 1.00 + 3.00 = 12.25
87.75 + 12.25 = 100.00
```

No hay gate activo que eliminar.

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. Para volver al umbral, por orden de valor y de coste, se necesitan +0.25 para la tolerancia (88) y +2.25 para 90:

1. **Q1.3 (+0.75): N-36 + N-37.**
   * Archivos: `governance/gates/plan-approval.json`, `runtime/gates/plan-approval-receipt.test.mjs` y `governance/security/PLAN-APPROVAL-RECEIPT.md`.
   * Cambio: registrar `r2` con los blobs de `main`, decidir la renormalización a LF, añadir el test config ↔ blobs de `HEAD` y actualizar el documento.
   * Riesgo: cambia la identidad de la configuración; no hay receipts emitidos.
   * Verificación: V-30 `[]`, `git diff --check` = 0, lectura del documento.
   * Solo esto lleva a **88.50**, dentro de la tolerancia.
2. **Q6.4 (+0.75): N-38.** Un documento de release v4 con la justificación de la MAJOR, o la excepción humana, y el delta de consumidor desde v3.4.3. Verificación: inspección.
3. **Q8.1 (+0.50): N-39.** Actualizar `SESSION-CONTEXT.md` y `execution/current/README.md` y sincronizar `main` ↔ `develop`. Verificación: V-34.
4. **Q2.2 (+0.75): N-41 + F-002.** Excluir el fixture del bundle y resolver `governance/cleanup/`. Verificación: V-24 y `ls`.
   * Los puntos 1-4 suman **90.50**.
5. **Q8.2 (+0.50): N-40.** Separación de identidades o decisión humana registrada. Verificación: `check-agent-isolation` PASS.
6. **El resto**, como en `AUDIT-PLATFORM-6f47eb2.md` §O.

Cualquier corrección fuera de `.audit/**` produce un SHA nuevo, y este informe queda STALE: hace falta reauditar el nuevo head congelado. Si el humano decide publicar sin corregir, `release-gate` rechazará este informe (V-35). Esa decisión, y el precedente de v3.4.1 aceptado bajo la tolerancia, corresponden al humano y no se reflejan aquí.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA (equivalente PLATFORM del «TEMPLATE PROFESIONAL DE REFERENCIA»)?

```text
NO
```

El 100/100 está prohibido: hay 23 MINOR puntuables y la confianza es MEDIA. Para el uso que pide el perfil, **gate de release con umbral 90 (tolerancia 2)**, la candidata v4.0.1 **no alcanza el umbral**: 87.75 < 88. No hay BLOCKER, CRITICAL ni MAJOR.

La PR #175 es correcta y está bien probada. Lo que falta está en el contenido v4 que esta release publicaría por primera vez:

* un subsistema inoperable sin registro (N-36);
* su documentación desactualizada (N-37);
* una MAJOR sin justificar (N-38);
* el estado de gobernanza desactualizado (N-39);
* la separación humano/agente pendiente, con la App ya creada (N-40).

### Comprobación de consistencia (§33 AUDIT_PROMPT / §90 AUDIT_RULES)

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos
[x] Ninguna SUGGESTION activa gates
[x] Ninguna SUGGESTION bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino obligatorio a 100
[x] 87.75 + 12.25 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay N/A)
[x] Los Quality Gates derivan de hallazgos reales (ninguno activo)
```

**Validación matemática.**

| Área | Suma | Total |
|---|---|---:|
| Q1 | 3 + 3 + 1.5 + 3 | 10.50 |
| Q2 | 3 + 2.25 + 3 + 3 | 11.25 |
| Q3 | 3 + 3 + 3 + 3 | 12.00 |
| Q4 | 3 + 2.25 + 2 + 2 + 2 | 11.25 |
| Q5 | 3 + 2.25 + 3 + 3 + 2.25 | 13.50 |
| Q6 | 3 + 2.25 + 2.25 + 2.25 + 2 + 1.5 | 13.25 |
| Q7 | 2.25 + 1.5 + 1.5 + 2 + 2.25 | 9.50 |
| Q8 | 1.5 + 1.5 + 1.5 + 2 | 6.50 |
| **Total** | | **87.75** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `6f47eb2` (90.25): −2.50.** El cambio se reparte en cuatro subcriterios:

| Subcriterio | Antes → ahora | Δ | Causa |
|---|---|---:|---|
| Q1.3 | 2.25 → 1.50 | −0.75 | N-36, N-37 |
| Q6.4 | 3.00 → 2.25 | −0.75 | N-38 |
| Q8.1 | 2.00 → 1.50 | −0.50 | N-39 |
| Q8.2 | 2.00 → 1.50 | −0.50 | N-40 |

Los otros 26 subcriterios no cambian. N-41 cae en Q2.2, que ya estaba en MENOR. Todas las causas nuevas están en el delta v4 (`7bfa2f0..ced0969`), que ningún informe anterior cubría. La PR `ced0969..c99ed8f` no introduce ningún hallazgo puntuable.

### Riesgos residuales

* **R-1 (MEDIO).** Mientras ROOT-003 siga abierto, toda aprobación de Environment (plan approval y `merge-gate`) es técnicamente alcanzable por un agente con la credencial del propietario. Las aprobaciones registradas no distinguen humano de agente.
* **R-2.** TOCTOU extremo a extremo NO RESUELTO y Coordinator consumer inexistente (declarado). No hay que usar receipts para habilitar trabajo hasta que existan el consumidor, su prueba extremo a extremo y la separación de identidades.
* **R-3.** `pretag` es procedimental: nada impide crear un tag sin ejecutarlo (F-008: sin ruleset de tags). `release.yml` sigue siendo la única barrera técnica, y funcionó en v4.0.0.
* **R-4.** El ruleset admite squash y rebase. Un merge de #175 que no sea merge commit deja STALE el SHA auditado (S-2).
* **R-5.** La validación local completa no es sostenible en este host; la confirmación es la CI remota.

```text
AUDITED_SHA: c99ed8f4090136967d48d834f5be0a0897c440a6
SCORE: 87.75/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 90.25 (6f47eb2)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 23 (17 heredados re-verificados; nuevos: N-36, N-37, N-38, N-39, N-40, N-41; cerrados: 0)
PR #175: correcta (pretag 10/10 local + CI ×2; real: v4.0.1 NOT READY esperado, v4.0.0 NOT READY por 3 motivos)
V4 BOOTSTRAP: workflow BLOCKED en main (WORKFLOW_REVISION_UNKNOWN, N-36); docs desactualizadas (N-37); G5 BLOCKED y App ya creada (N-40); TOCTOU NO RESUELTO (declarado, R-2)
SEMVER: PATCH v4.0.1 sobre v4.0.0 consumido, coherente; MAJOR v4 sin justificar según la política (N-38); CLI_VERSION v4.0.1; VERSION 3.0.0-dev
BUILD: reproducible (sha256:7108b0a0…6dd06c11 ×2); delta vs v3.4.3 publicado: aditivo (5 módulos + schema + pretag + READMEs; bootstrap igual)
CI REMOTA: c99ed8f verde en los 6 checks requeridos (ubuntu 1270+1 skip, windows 1269+2 skips, 0 FAIL); pilot offline Ubuntu FAIL (Docker 125, no requerido, N-26)
UMBRAL PLATFORM 90 (tolerancia 2): NO ALCANZADO (87.75 < 88)
VERDICT: APTO CON CORRECCIONES (estado global §32)
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
