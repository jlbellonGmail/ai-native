---
targetRepo: jlbellonGmail/ai-native
targetCommit: b43b5d6bd1210f16261ac4d5c9465d72e92f4982
platform:
  version: "v4.0.1 candidate"
  commit: b43b5d6bd1210f16261ac4d5c9465d72e92f4982
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-03T08:31:37Z"
scope: "Independent read-only PLATFORM 1.2 audit of the frozen v4.0.1 candidate b43b5d6 (branch release/v4.0.1, PR #175 to main) over the whole delta 6f47eb2..b43b5d6: v3.4.3 .audit record, the Plan Approval Receipt bootstrap of #169, #171 and #174 (ced0969, tag v4.0.0 whose release failed), the pre-tag check and the corrections c99ed8f..b43b5d6 (N-36, N-37, N-39, N-41, S-28, S-29); live GitHub control plane read-only. Baselines AUDIT-PLATFORM-6f47eb2.md (90.25) and AUDIT-PLATFORM-c99ed8f.md (87.75); every inherited finding re-verified live or justified by an empty diff over its area. Auditor is an isolated-context subagent launched from the builder session with read-only instructions; it did not build or review the candidate. No fix, commit, push, PR, merge, tag or release."
score: 88.5
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.0.1, b43b5d6)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native
Ruta:               C:\Proyectos\worktrees\ai-native\release-audit-v4 (worktree)
Branch:             release/v4.0.1 (= origin por ls-remote; PR #175 abierta contra main, MERGEABLE, 14 commits)
Commit:             b43b5d6bd1210f16261ac4d5c9465d72e92f4982 (= AUDITED_SHA congelado; igual a HEAD al empezar y al terminar)
Base:               origin/main = ced0969 (merge de #174) = cabeza viva de main por ls-remote
Tag:                ninguno en el commit. Tag v4.0.0 sobre ced0969, sin release. Release vigente: v3.4.3 (Latest)
Fecha:              2026-11-03 (UTC 08:31)
Worktree:           limpio al empezar y al terminar (git status --short vacío); este informe vive FUERA del repositorio
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente con contexto aislado, lanzado desde la sesión del Builder,
                    con instrucciones de solo lectura. No participó en la implementación, en sus revisiones ni en la
                    auditoría c99ed8f. El humano debe ponderar esa independencia: el encargo lo hizo la sesión del
                    Builder y el proceso del auditor corre con la misma identidad de Windows y de GitHub que el Builder
                    (N-40). Desde este proceso, la API devuelve current_user_can_approve = true para el Environment
                    ai-native-human-review que espera la aprobación de esta PR (V-27). El auditor no aprobó nada.
Entorno:            Windows 11 Pro 10.0.26200, Git Bash, node v26.12.1, gh (solo lectura), %TEMP% por defecto
Temporales:         <scratchpad>/probe2 (fuera del árbol): sonda N-36, logs de tests, builds, bundle v3.4.3, log de CI
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 88.50/100
Score final: 88.50/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO CON CORRECCIONES
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM de 90 (tolerancia 2, mínimo 88): DENTRO DE LA TOLERANCIA, NO ALCANZA 90 (+0.50 sobre 88; −1.50 respecto de 90).** `release-gate` da PASS_WITH_WARNINGS, no PASS (V-35). 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR puntuables: 17 heredados de `6f47eb2` (todos re-verificados), N-38, N-39 (residual) y N-40 todavía abiertos, y 1 nuevo (N-42). Sin N/A y sin gates.

**Lo que verifiqué como cerrado desde `c99ed8f`.**

* **N-36 CERRADO (E4 + CI).** Mi sonda llama a `findWorkflowRevision` y `evaluateWorkflowRevision` reales de `HEAD`, con la configuración de `HEAD` y los blobs reales (`git rev-parse <ref>:<path>`). Resultado: `HEAD`, `ced0969`, `c99ed8f` y `origin/main` → `r2-ced0969cf38b`, `[]`; `08a8581` y `07d93c1` → `r1`, `[]`. Con la configuración de `c99ed8f` o de `origin/main`, los mismos blobs dan `WORKFLOW_REVISION_UNKNOWN` (V-30). Ningún `trustedFile` cambió en `ced0969..b43b5d6`: `git diff --quiet` = 0, `git log` vacío y los seis blobs son iguales (V-31). `plan-approval.json` está en LF: `git ls-files --eol` no muestra ningún archivo `i/mixed` o `i/crlf`, y `git diff --check 6f47eb2 HEAD` = 0. El contenido parseado es idéntico antes y después de renormalizar (V-07). El test de drift corre y pasa en local y en CI, en Linux y en Windows (V-20, V-28). Solo la «autorización humana expresa» es NO VERIFICADA: es una afirmación del Builder. La barrera técnica real es `human-review`, que está en WAITING para esta PR (V-27).
* **N-37 CERRADO.** `PLAN-APPROVAL-RECEIPT.md:5,42-50,134-136,188` coincide ahora con `plan-approval.json` y con GitHub. Lo comprobé en vivo: Environment 25906730072, sin bypass, `prevent_self_review`, reviewer único y solo `main`; bot 350901564 `Bot`; el único run real es 41369500299, BLOCKED (V-33). No quedan las frases obsoletas (grep, V-12).
* **N-41 CERRADO.** `bundle.mjs:24` excluye `*.fixture.mjs`. Dos builds dan el mismo resultado, 235 archivos (antes 236), sin el fixture. Ningún módulo publicado lo importa (V-23, V-24). Lo único que importa el fixture son tests.
* **S-28 y S-29 CERRADAS (sugerencias).** `pretag.mjs:72` usa `git ls-remote --get-url origin`, y `reportsAt` (`:37-39`) distingue «sin directorio» de «git falló». Hay tests para ambos casos y la ejecución real es correcta (V-18, V-21).

**Lo que sigue abierto o cerrado solo en parte.**

* **N-38 abierto (sin cambios).** `VERSIONING-POLICY.md` no tiene diff en `c99ed8f..HEAD`. No existe ningún documento v4.0.0. `V4.0.1-PATCH.md:39` lo registra como decisión humana pendiente.
* **N-40 abierto, re-verificado.** `check-agent-isolation` da BLOCKED desde este proceso. Además, `pending_deployments` del run 41597605799 devuelve `current_user_can_approve: true` para este proceso de agente (V-27, V-32).
* **N-39 PARCIAL.** `SESSION-CONTEXT.md` y `execution/current/README.md` ya reflejan v3.4.3 publicada, el tag v4.0.0 consumido y la candidata v4.0.1. El cherry-pick `7bfa211` tiene el mismo patch-id que `238a0a4` de `develop`. Quedan dos defectos:
  1. `SESSION-CONTEXT.md:15` afirma «develop no tiene #169/#171/#174», pero `develop` contiene #169 y #171 (por #170 y #173); solo le falta #174 (V-34).
  2. `main` y `develop` siguen divergiendo, ahora como sincronización post-release declarada.

**Nuevo.** **N-42 (MINOR, Q2.2).** El arreglo de N-41 solo cubre el sufijo. `runtime/audit/fixtures.mjs` es otro módulo exclusivo de tests: solo lo importa `fixtures.test.mjs`, y su `FIXTURES_ROOT` apunta a `evaluation/`, que no se publica. Ese módulo sigue en el bundle, y el test nuevo fija que se publique (`release.test.mjs:114`). Q2.2 ya estaba en MENOR por F-002, así que no cambia la nota.

**Sensibilidad.** El único cambio de nota respecto de `c99ed8f` es Q1.3, que sube de PARCIAL a MENOR (+0.75) al cerrarse N-36 y N-37. Lo que impide llegar a 90 es heredado o está pendiente de decisión humana:

* N-38: +0.75;
* N-39: +0.50;
* N-40: +0.50;
* N-42 junto con F-002: +0.75.

Q8.1 queda en MENOR y no en COMPLETO porque no se cumple el criterio de cierre que fijó `c99ed8f` para N-39 (divergencia 0 o solo en `.audit/**`). Además, la propia corrección introduce una afirmación falsa en la fuente de verdad. Si se aceptara la sincronización post-release como cierre y se ignorara esa frase, el score sería 89.00. Seguiría sin llegar a 90.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Diff completo `6f47eb2..b43b5d6`: 27 archivos, +5959/−20.
* Tramo `c99ed8f..b43b5d6`: 8 commits y 13 archivos. Uno solo es de `.audit/**`: el informe `c99ed8f`.
* Commit a commit:
  * `17e6446`: renormalización;
  * `438cfc1`: r2 y tests;
  * `361b550`: N-41;
  * `b7d0f1a`: N-37;
  * `7bfa211`: cherry-pick de `238a0a4`;
  * `b831648`: N-39;
  * `b43b5d6`: S-28 y S-29.
* El resto del delta v4 (`7bfa2f0..ced0969`) y `ced0969..c99ed8f`: lo audité `c99ed8f`. Lo re-verifiqué por diff, no por relectura completa. En `ced0969..HEAD` no cambió ningún `trustedFile`.
* Archivos leídos:
  * `plan-approval-receipt.mjs:140-220`;
  * `pretag.mjs` completo;
  * `bundle.mjs:17-27`;
  * los tests cambiados;
  * `PLAN-APPROVAL-RECEIPT.md` (diff y grep);
  * `SESSION-CONTEXT.md:1-30`;
  * `execution/current/README.md:1-60`;
  * `V4.0.1-PATCH.md:20-60`;
  * `HITL-MERGE-POLICY.md`;
  * el informe `c99ed8f` completo.

**Ejecutado por el auditor en b43b5d6.** Ver §G:

* los 10 validadores oficiales;
* `git diff --check` y `ls-files --eol`;
* 3 archivos de test, uno a uno: 147 tests;
* la sonda N-36;
* 2 builds y un negativo;
* el diff del bundle contra v3.4.3 publicado;
* `pretag` real;
* `check-agent-isolation`, `trusted-config` y `check-environment` (detección local y GET);
* `release-gate` antes y después del informe;
* la lectura del log de la CI remota del SHA exacto.

**No ejecutado localmente.**

* La suite completa, por la RAM del host.
* `plan-approval-artifact.test.mjs`. El área no tiene diff en `ced0969..HEAD` y pasa en la CI del SHA exacto (V-28).
* `review-ledger`, adapters, bootstrap y CLI. Sus áreas no tienen diff (V-05); la evidencia es la CI remota.

**No verificado.**

* La autorización humana de r2. Solo hay afirmaciones del Builder (`438cfc1`, `V4.0.1-PATCH.md:28`).
* Un dispatch real de plan approval tras el merge. No lanzo escrituras.
* La ubicación de la clave privada de la App.
* F-007.
* Codex y OpenCode.

**Accesos remotos.** `gh` autenticado como el propietario y usado solo en lectura:

* `pr view 175`;
* `run list` y `run view`, con logs;
* `api` GET de rulesets, `branches/develop/protection`, `rules/branches/develop`, `compare`, environments, `pending_deployments`, `users/…[bot]`, code-scanning, dependabot y secret-scanning;
* `release download v3.4.3`, a un directorio temporal;
* `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | Chequeo previo al tag con las reglas de `release.yml`. Sin overrides; lo que no se puede evaluar es FAIL. El origin es la URL que git contacta | OBLIGATORIO (PR #175) | `pretag.mjs:56-120`, `VERSIONING-POLICY.md:76` | VERIFICADO (E4: 10/10 local y CI ×2; ejecución real V-21) |
| C-02 | `CLI_VERSION` = tag `v4.0.1`; el build rechaza otra versión | OBLIGATORIO | `ai-native.mjs`, `cli-version.mjs` | VERIFICADO (V-23) |
| C-03 | Un tag publicado no se mueve ni se reutiliza | OBLIGATORIO | `VERSIONING-POLICY.md:76` | VERIFICADO (`v4.0.0` sin release; `pretag` lo bloquearía) |
| C-04 | SemVer: MAJOR solo por cambio incompatible, con impacto y evidencia en el roadmap | OBLIGATORIO | `VERSIONING-POLICY.md:23-64` | **INCUMPLIDO** (N-38) |
| C-05 | Bundle determinista; delta de consumidor aditivo; sin código de solo-tests | OBLIGATORIO (perfil Q6) | `build.mjs`, `bundle.mjs` | VERIFICADO (V-23, V-24); residuo N-42 |
| C-06 | Verificador Plan Approval Receipt fail-closed | DECLARADO como *bootstrap* | `PLAN-APPROVAL-RECEIPT.md:5-7` | IMPLEMENTADO + 118 tests (V-20) |
| C-07 | La configuración confiable autoriza exactamente los blobs que ejecuta `main` | OBLIGATORIO para C-06 | `plan-approval.json:22-45` | **VERIFICADO en la candidata** (V-30); efectivo en `main` solo tras el merge |
| C-08 | Coordinator consumer y TOCTOU extremo a extremo | FUTURO (declarado «NO RESUELTO») | `PLAN-APPROVAL-COORDINATOR-CONTRACT.md` | No implementado, como se declara (R-2) |
| C-09 | Separación humano/agente (G5) antes de operar la App | PROPUESTA con orden | `AGENT-HUMAN-IDENTITY-SEPARATION.md:3,58` | **No implantada** (N-40) |
| C-10 | Doc drift verde; todo test corre en CI; acciones fijadas por SHA | OBLIGATORIO | validadores | VERIFICADO (V-08..V-16) |
| C-11 | Tests de contrato, paridad y regresión en CI Linux y Windows | OBLIGATORIO | `ci.yml` | VERIFICADO en `b43b5d6` (V-28) |
| C-12 | Gates server-side y HITL único de merge; los cambios al plano de control requieren `human-review` | OBLIGATORIO | ruleset `ai-native-main`, `merge-gate` | VERIFICADO: `human-review` WAITING para esta PR (V-27). Con F-005 y N-25; HITL alcanzable por el agente (N-40) |
| C-13 | Fuente de verdad del estado: `SESSION-CONTEXT.md` y `execution/current/` | OBLIGATORIO | `CLAUDE.md`, `SESSION-CONTEXT.md:3` | Actualizada, con una afirmación falsa y divergencia pendiente (N-39 residual) |
| C-14 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002, N-42) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, F-004) |
| Q6 Git/CI/CD/Release | 16 | 13.25 | MENOR (F-005, N-25, N-26, N-38, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 6.50 | MENOR (N-39, N-40, F-005) |
| **TOTAL** | **100** | **88.50** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Leyenda: **E** = evaluado de nuevo sobre el delta; **V** = hallazgo re-verificado en vivo o en el árbol; **D** = el diff `6f47eb2..b43b5d6` está vacío sobre el área (`git diff --quiet` → 0, V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación (re-verificación) |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V4.0.1-PATCH.md`, `PLAN-APPROVAL-RECEIPT.md:5-7` | — | E. El incidente, la corrección, lo que queda abierto y los límites de v4 están declarados |
| Q1.2 | Capacidades prometidas presentes | 3 | COMPLETO | 3.00 | V-18..V-21, V-30 | — | E. `pretag` hace lo que promete. El verificador v4 existe con sus pruebas, y su configuración ya cubre el código de `main` |
| Q1.3 | Coherencia doc/config/código | 3 | **MENOR** | 2.25 | V-30, V-33; `runtime/circuit` sin diff | N-31 | E + D. N-36 y N-37 cerrados: la configuración autoriza los blobs de `main` y el documento coincide con la configuración y con GitHub. Queda N-31 (heredado, D) |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E. Consumidor y TOCTOU declarados como futuro; lo pendiente de la PR son pasos de promoción |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-23 | — | E. Build ×2 idéntico |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | `ls governance/cleanup` (4), V-24 | F-002, **N-42** | V + E. N-41 cerrado. `runtime/audit/fixtures.mjs`, exclusivo de tests, sigue publicado y ahora fijado por un test. Sin rutas ni secretos en el delta (V-06) |
| Q2.3 | Personalización clara | 3 | COMPLETO | 3.00 | — | — | D (`template/`, `core/`) |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | `pretag.test.mjs:22-53,78-91` | — | E. El stand-in de GitHub ya no depende de `insteadOf` global; rutas cortas |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `pretag.mjs:15-17` | — | E. Importa las reglas, no las duplica |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | diffs | — | E. Las correcciones son mínimas: +11 líneas de JSON, un patrón y 3 líneas de `pretag` |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | `PLAN-APPROVAL-RECEIPT.md:134-136` | — | E. El procedimiento de rotación está documentado, y ahora lo impone un test de drift |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación/bootstrap | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.0.1-PATCH.md:50-55` | — | E. Orden de release: merge commit, `pretag` y tag |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `audit/README.md:23` | — | E |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-07..V-16 | — | E. Los 10 validadores dan exit 0; `git diff --check` (complementario) sale ahora con 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D. La estrategia del delta es buena: drift contra blobs commiteados y negativos de mezcla de revisiones |
| Q5.3 | Pruebas ejecutables y pasando | 4 | MENOR | 3.00 | V-18..V-20, V-28 | N-29, N-27 | E + V. Local: 147/147. CI del SHA exacto: 1272 tests y 0 FAIL en ambos SO. N-29/N-27 heredados sin caracterizar (D) |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | `plan-approval-receipt.test.mjs:928-941`, `release.test.mjs:109-115`, `pretag.test.mjs:178-201` | — | E. Cada corrección tiene su regresión. El hueco de N-36 (sin test config ↔ HEAD) está cerrado |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff fuera del workflow v4 | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-04 | — | E. 8 commits atómicos con su ID de hallazgo; cherry-pick con `-x`; PR = local = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-32 | F-005, N-25 | V. `required_approving_review_count 0`; `develop`: 404 y 0 reglas |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-29 | N-26 | V. El pilot offline Ubuntu pasa en `b43b5d6`, pero falló en `c99ed8f`, `7bfa2f0` y `07d93c1`; la causa no está demostrada |
| Q6.4 | Versionado y releases | 3 | MENOR | 2.25 | V-24; `VERSIONING-POLICY.md` sin diff | **N-38** | V. El PATCH v4.0.1 está bien razonado. La MAJOR v4 sigue sin justificar y falta el delta de consumidor desde v3.4.3 |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-23 | — | E. `sha256:30925624…dd5ca507` ×2; 235 archivos |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D. `bootstrap` idéntico a v3.4.3 |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-06, V-32 | F-007 | V. Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-32 | N-32 | V. 10 alertas Dependabot (1 high, 8 medium, 1 low); sin cambios |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-32 | F-008, CodeQL #27 | V. 0 rulesets de tag; CodeQL abierta solo #27; 0 alertas en `refs/pull/175/merge` |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-21, V-30, V-33 | — | E. Todo falla cerrado; `trusted-config` BLOCKED en local por `CONFIG_LOCAL_DIFFERS`, como corresponde antes del merge |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | MENOR | 1.50 | V-34 | **N-39 (residual)** | V. Estado actualizado, pero `SESSION-CONTEXT.md:15` es falso sobre `develop`, y la divergencia `main`/`develop` sigue abierta |
| Q8.2 | Responsabilidades y límites | 2 | MENOR | 1.50 | V-27, V-32 | **N-40** | V. BLOCKED; el agente puede aprobar `human-review` |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-32 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-04, V-27 | — | E. Informe c99ed8f → N-IDs en los commits → tests → CI → `human-review` → este informe |

## G. LEDGER DE VERIFICACIÓN

Todas son VERIFICACIÓN OFICIAL DEL PROYECTO, salvo las marcadas (A) (complementaria del auditor) y (R) (evidencia remota leída). Los logs están en `<scratchpad>/probe2/`.

| ID | Verificación | Comando/Método | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` (inicio y fin) | `b43b5d6bd1210f16261ac4d5c9465d72e92f4982` | PASS | — |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio, durante y al final | PASS | — |
| V-03 | PR y base (R) | `gh pr view 175`; `git ls-remote origin` | `headRefOid` = HEAD; OPEN; MERGEABLE; base `main` = `ced0969` = `origin/main` | PASS | — |
| V-04 | Alcance (A) | `git diff --stat 6f47eb2..HEAD`, `c99ed8f..HEAD`; `git show --stat` por commit | 27 archivos +5959/−20; tramo c99ed8f..HEAD: 13 archivos, 8 commits, uno por hallazgo | PASS | — |
| V-05 | Áreas heredadas sin diff (A) | `git diff --quiet 6f47eb2 HEAD -- <p>` | 0 para `README.md`, `AGENTS.md`, `core`, `scripts`, `ci.yml`, `release.yml`, `merge-gate.yml`, `runtime/{bootstrap,audit,pilot,adapters,circuit,lib}`, `template`, `foundation`, `evaluation/fixtures`, `package.json`, `governance/cleanup`, `build.mjs`, `cli-version.mjs`, `assert-unreleased.mjs`. `.github` y `contracts` solo con los archivos v4 ya auditados (0 en `c99ed8f..HEAD`) | PASS | — |
| V-06 | Higiene del delta (A) | grep de rutas de host, tokens, claves y TODO en las líneas añadidas de `c99ed8f..HEAD` | 2 coincidencias, ambas falsos positivos (la palabra española «todo»); sin secretos ni rutas | PASS | — |
| V-07 | EOL y espacios (A) | `git ls-files --eol`; `git diff --check 6f47eb2 HEAD`; `git diff --ignore-cr-at-eol c99ed8f 17e6446`; JSON parseado antes y después | ningún archivo `i/mixed` o `i/crlf`; `--check` exit 0; renormalización sin cambio de contenido (solo aparece el informe `.audit`); JSON idéntico | PASS (cierra ROOT-004) | — |
| V-08 | Método de auditoría | `node runtime/audit/cli.mjs check` | PASS, exit 0 | PASS | — |
| V-09 | Paridad | `node parity/validate-parity.mjs` | exit 0; 95/95 | PASS | — |
| V-10 | Contratos | `node contracts/validate-contracts.mjs` | exit 0; 7 datos | PASS | — |
| V-11 | Core / integridad | `core/validate-core.mjs`; `runtime/status/validate-integrity.mjs` | exit 0 ×2 | PASS | — |
| V-12 | Doc drift | `node runtime/docs/validate-doc-drift.mjs`; grep (A) de frases obsoletas en `governance/security/` | PASS; 0 frases obsoletas («Valor hoy», «404» del Environment, «sin commit», «sigue sin ellos») | PASS | — |
| V-13 | Entry points | `node runtime/adapters/validate-entrypoints.mjs` | PASS | PASS | — |
| V-14 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | «all 102 committed *.test.mjs files are run by a workflow» | PASS | — |
| V-15 | Acciones fijadas | `node scripts/validate-actions-pinned.mjs` | «all actions … pinned by full SHA» | PASS | — |
| V-16 | Matriz de compatibilidad | `node evaluation/compat/validate-compat-matrix.mjs` | exit 0; 3 fixtures | PASS | — |
| V-17 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate b43b5d6… --root .` | FAIL (32 errores), exit 1: 1 real («no current valid…») y 31 STALE | ESPERADO | `rg-before.txt` |
| V-18 | Test `pretag` | `node --test --test-concurrency=1 runtime/release/pretag.test.mjs` | **10/10 PASS** (incluye `insteadOf` hacia `x/evil` y `ls-tree` fallido) | PASS | `t-pretag.log` |
| V-19 | Test release/bundle | idem `runtime/release/release.test.mjs` | **19/19 PASS** (incluye `isShipped` N-41) | PASS | `t-release.log` |
| V-20 | Test verificador v4 | idem `runtime/gates/plan-approval-receipt.test.mjs` | **118/118 PASS**, incluido «drift (N-36)» | PASS | `t-receipt.log` |
| V-21 | `pretag` real (A) | `node runtime/release/pretag.mjs --tag v4.0.1 --candidate b43b5d6… --repo jlbellonGmail/ai-native` | NOT READY, exit 1. FAIL solo en «reachable from origin/main» (falta el merge) y en «release-gate» (falta este informe; +31 STALE). PASS: origin (`ls-remote --get-url` = `…/jlbellonGmail/ai-native.git`, sin `insteadOf`), tag libre local y remoto, sin release, `ci.yml` verde y `CLI_VERSION` | PASS (fail-closed esperado) | — |
| V-23 | Build reproducible y negativo | `node runtime/release/build.mjs --version v4.0.1 --commit b43b5d6… --out b1` y `b2`; `--version v4.0.0` | exit 0 ×2; los 6 assets idénticos por `cmp`; `sha256:30925624676fae868827d1fb13f991ce40252975ed3f4c29b6e9da90dd5ca507`; 235 archivos. Negativo: exit 1, «declares CLI_VERSION v4.0.1; this release is v4.0.0» | PASS | `b1.log`, `bneg.log` |
| V-24 | Delta de consumidor (A) | `gh release download v3.4.3` (sha256 `12c15adc…ea7b` = `SHA256SUMS`); `diff -rq`; `git grep fixtures.mjs` | Solo en v4.0.1: el schema, `plan-approval{,-receipt,-artifact}.mjs` y `pretag.mjs`. **Ya no aparece `plan-approval-zip.fixture.mjs`.** Difieren: los dos README, `platform.json`, `ai-native.mjs` y `bundle.mjs`. `bootstrap` idéntico. `runtime/audit/fixtures.mjs` está publicado (también en v3.4.3) y solo lo importa `fixtures.test.mjs` (N-42) | PASS (con N-38, N-42) | — |
| V-27 | HITL de esta PR (R) | `gh pr view 175 --json statusCheckRollup`; `gh api …/runs/41597605799/pending_deployments`; `environments/ai-native-human-review` | `merge-gate-job` success; **`human-review` WAITING** en `ai-native-human-review` (cambio de plano de control detectado). Reviewer `jlbellonGmail`, `prevent_self_review: false`, autor de la PR `jlbellonGmail`; **`current_user_can_approve: true` desde este proceso de agente** | PASS (con N-40, F-005) | — |
| V-28 | CI remota de `b43b5d6` (R) | `gh run list --branch release/v4.0.1`; `gh run view 41597608190 --log` | Los 11 workflows de `pull_request` y `trust-gate`: success. ubuntu: 1272 tests, 1271 PASS, 0 FAIL, 1 skip. windows: 1272, 1270 PASS, 0 FAIL, 2 skips. «drift (N-36)» y `isShipped` ✔ en ambos. Release dry-run: build success; publish y verify skipped | PASS | `ci.log` |
| V-29 | Pilot (R) | `gh run view 41597608126` | los 4 jobs success, incluido el offline Ubuntu. Falló en `c99ed8f` (V-29 de ese informe) | N-26 (heredado, intermitente) | — |
| V-30 | Sonda N-36 (A) | `probe2/n36.mjs`: importa `plan-approval-receipt.mjs` de HEAD; config `git show <cfg>:governance/gates/plan-approval.json`; blobs `git rev-parse <ref>:<trustedFile>`; `findWorkflowRevision` + `evaluateWorkflowRevision` | **config HEAD**: HEAD, `ced0969`, `c99ed8f` y `origin/main` → `r2-ced0969cf38b`, `[]`; `08a8581` y `07d93c1` → `r1-07d93c13d7a8`, `[]`. **config c99ed8f / origin/main**: HEAD y `ced0969` → `null`, `WORKFLOW_REVISION_UNKNOWN` | PASS (cierra N-36) | — |
| V-31 | `trustedFiles` sin cambios (A) | `git diff --quiet ced0969 HEAD -- <6 trustedFiles>`; `git log ced0969..HEAD -- …`; `rev-parse` en ambos | exit 0; log vacío; los 6 blobs iguales (`d8ff23f`, `0908ae0`, `1bc6208`, `483d6ea`, `2798b5b`, `124c505`). `plan-approval.json` no es `trustedFile` | PASS | — |
| V-32 | Plano de control (R) | `gh api` rulesets, `branches/develop/protection`, `rules/branches/develop`, code-scanning (también en `refs/pull/175/merge`), dependabot, secret-scanning; `check-agent-isolation` (A) | Ruleset `ai-native-main` activo, sin bypass: `required_approving_review_count 0`, merge/squash/rebase permitidos, 6 checks requeridos (strict). `develop`: 404 y 0 reglas. Rulesets de tag: 0. CodeQL abiertas: #27; PR: 0. Dependabot: 10 (1 high, 8 medium, 1 low; #145-154, `template/` y `foundation/`). Secret scanning: 0. `check-agent-isolation`: **BLOCKED** (`AGENT_HUMAN_GH_ACCOUNT`, `AGENT_GIT_CREDENTIAL`) | PASS (con F-005, N-25, F-008, N-32, N-40) | — |
| V-33 | Estado vivo v4 (R) | `gh api environments/ai-native-plan-approval` (y `deployment-branch-policies`), `users/ai-native-plan-approval%5Bbot%5D`; `gh run list --workflow plan-approval-receipt.yml`; `trusted-config`, `check-environment` | Environment 25906730072, `can_admins_bypass false`, `prevent_self_review true`, reviewer `jlbellonGmail`, solo `main`. Bot 350901564 `Bot`. Un único run: 41369500299 sobre `08a8581`, failure. `check-environment`: PASS. `trusted-config`: BLOCKED `CONFIG_LOCAL_DIFFERS` (la candidata difiere de `main`, esperado antes del merge) | PASS (coincide con el documento, N-37) | — |
| V-34 | Fuente de verdad (A/R) | lectura de `SESSION-CONTEXT.md:7-26` y `execution/current/README.md:1-15`; `gh api compare` en ambos sentidos; `merge-base --is-ancestor`; `git patch-id` de `7bfa211` y `238a0a4` | Estado v3.4.3, v4.0.0 y v4.0.1 correcto. Patch-id idéntico. **`SESSION-CONTEXT.md:15`: «develop no tiene #169/#171/#174», pero `07d93c1` (#169) y `08a8581` (#171) son ancestros de `develop` (#170, #173); solo falta #174.** `develop...ced0969`: diverged, ahead 3 / behind 4 | FAIL parcial (N-39 residual) | — |
| V-35 | Release-gate contra este informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate b43b5d6… --root . --reports <dir con este informe>` | **PASS_WITH_WARNINGS**, exit 0: «score 88.5 is below 90 but within the 2-point tolerance» | ESPERADO (coherente con §B) | `rg-after.txt` |

(V-22, V-25 y V-26 de `c99ed8f`, sobre el tag `v4.0.0` y la declaración de versión, no se repiten. Sus objetos no cambiaron: `ai-native.mjs`, `cli-version.mjs` y `release.yml` no tienen diff en `c99ed8f..HEAD`, y `pretag` V-21 confirma que el tag sigue libre.)

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas (heredado) | `runtime/circuit` sin diff (V-05) | Q1.3 | −0.75 |
| F-002 | SOBRA | MINOR | Residuos de cierre en `governance/cleanup/` (heredado) | `ls governance/cleanup` | Q2.2 | −0.75 (con N-42) |
| N-42 | SOBRA | MINOR | `runtime/audit/fixtures.mjs`, exclusivo de tests, se publica, y `release.test.mjs:114` lo fija | V-24; `bundle.mjs:24`; `fixtures.mjs:13` | Q2.2 | (incluido arriba) |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host Windows sin caracterizar (heredados) | V-05; no reproducidos en V-18..V-20 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-32 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-32 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | Pilot offline Ubuntu intermitente (Docker exit 125), sin causa demostrada | V-29 | Q6.3 | −0.75 |
| N-38 | INCORRECTO | MINOR | MAJOR v4 sin cambio incompatible ni justificación según la política; falta el delta de consumidor desde v3.4.3 | `VERSIONING-POLICY.md:23-36,57-65` sin diff; `V4.0.1-PATCH.md:39,48` | Q6.4 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-32 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 10 alertas Dependabot (1 high) en `template/` y `foundation/` | V-32 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-32 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |
| N-39 | OBSOLETO / INCORRECTO | MINOR | Residual: `SESSION-CONTEXT.md:15` afirma algo falso sobre `develop`; la divergencia `main`/`develop` sigue sin sincronizar | V-34 | Q8.1 | −0.50 |
| N-40 | RIESGO | MINOR | G5 no implantada. La credencial del propietario es alcanzable por los agentes y puede aprobar `human-review` y plan approval | V-27, V-32; `AGENT-HUMAN-IDENTITY-SEPARATION.md:3,58` | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR.**

* **Heredados de `6f47eb2` (17):** N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009 y F-010. CodeQL #27 se cuenta dentro de F-008.
* **De `c99ed8f` todavía abiertos (3):** N-38, N-39 (residual) y N-40.
* **Nuevo (1):** N-42.
* **Cerrados (3 MINOR):** N-36, N-37 y N-41. También se cerraron las sugerencias S-28 y S-29.

**Estado de N-36..N-41.**

| ID | Afirmación del Builder | Verificación del auditor | Estado |
|---|---|---|---|
| N-36 | r2 registrada con autorización humana; config en LF; test de drift | V-07, V-20, V-28, V-30, V-31. La autorización humana no es verificable; el control técnico es `human-review`, en WAITING (V-27) | **CERRADO** |
| N-37 | `PLAN-APPROVAL-RECEIPT.md` actualizado | V-12, V-33. El documento coincide con la configuración y con GitHub | **CERRADO** |
| N-38 | Abierto, decisión humana | `VERSIONING-POLICY.md` sin diff; no hay documento v4.0.0 | **ABIERTO** |
| N-39 | `SESSION-CONTEXT` y `execution/current` actualizados; cherry-pick del post-release v3.4.3 | V-34. Cherry-pick idéntico (patch-id); estado correcto; afirmación falsa en `:15`; divergencia pendiente | **PARCIAL (abierto, residual)** |
| N-40 | Abierto, decisión humana | V-27, V-32. BLOCKED; `current_user_can_approve: true` | **ABIERTO** |
| N-41 | Fixture fuera del bundle | V-19, V-23, V-24. 235 archivos, sin el fixture | **CERRADO** (residuo de la misma clase: N-42) |

**N-39 (MINOR, residual).**

* **Descripción.** Los dos ficheros de estado ya no están dos releases atrás. Pero la corrección introduce una afirmación falsa en la fuente de verdad. `SESSION-CONTEXT.md:15` dice «MAIN_DEVELOP: divergen; develop no tiene #169/#171/#174 (v4)». En realidad `develop` contiene `07d93c1` (#169, vía #170) y `08a8581` (#171, vía #173); solo le falta `ced0969` (#174). La comprobación está en `merge-base --is-ancestor` y en `compare` de la API: ahead 3 / behind 4 (V-34). Además sigue sin cumplirse el criterio de cierre que fijó `c99ed8f`: `rev-list` = 0 en ambos sentidos, o divergencia solo en `.audit/**`. Lo que queda es la sincronización post-release, que está declarada (`V4.0.1-PATCH.md:55`).
* **Impacto.** Bajo. Un agente que siga la fuente de verdad (CLAUDE.md lo exige) podría intentar llevar a `develop` el bootstrap #169/#171 que ya tiene.
* **Corrección mínima.** Cambiar `:15` a «develop no tiene #174 ni la candidata v4.0.1». Después de la release, sincronizar `main` → `develop`.
* **Verificación.** Leer la línea; `gh api compare/develop...main` con `ahead_by` solo en `.audit/**` tras la sincronización.
* **Puntos.** +0.50 en Q8.1.

**N-42 (MINOR, nuevo).**

* **Descripción.** `runtime/audit/fixtures.mjs` materializa los fixtures de auditoría de `evaluation/fixtures/audit` (`fixtures.mjs:13`). Ese directorio no se publica, y el módulo solo lo importa `runtime/audit/fixtures.test.mjs`. Aun así va en el bundle (V-24), como ya iba en v3.4.3. La corrección de N-41 excluyó solo el sufijo `.fixture.mjs`. El test nuevo, en `release.test.mjs:114`, afirma `isShipped("runtime/audit/fixtures.mjs")` como ejemplo de lo que debe seguir publicándose.
* **Impacto.** Bajo. Es un residuo: en un consumidor no hace nada útil, porque su `FIXTURES_ROOT` no existe allí.
* **Corrección mínima.** Renombrarlo a `runtime/audit/audit.fixture.mjs`, o excluirlo explícitamente, y cambiar el ejemplo positivo del test por un módulo de runtime real.
* **Verificación.** `diff -rq` del bundle sin el archivo; `release.test.mjs` verde.
* **Puntos.** Incluidos en el +0.75 de Q2.2, junto con F-002.

**N-38 y N-40.** La descripción, la corrección y la verificación no cambian respecto de `AUDIT-PLATFORM-c99ed8f.md` §H. N-40 suma una evidencia nueva y más directa. `pending_deployments` del run `merge-gate` de esta misma PR (41597605799) devuelve `current_user_can_approve: true` para el proceso del agente, y `ai-native-human-review` tiene `prevent_self_review: false`. Es decir, el único HITL técnico que hoy protege el cambio de plano de control de N-36 es aprobable por un agente. Lo que lo impide es la norma D6 (`HITL-MERGE-POLICY.md:11,25`), declarada como límite.

**Resto de hallazgos (heredados).** Sus descripciones están en `AUDIT-PLATFORM-247b284.md` §I/§J, `AUDIT-PLATFORM-d6c5d4a.md` §H y `AUDIT-PLATFORM-6f47eb2.md` §H. Siguen vigentes. Los re-verifiqué así:

* **En vivo (V-29, V-32):** F-005, N-25, N-32 (10 alertas, igual que en `c99ed8f`), F-008, CodeQL #27, F-007 y N-26.
* **En el árbol:** F-002.
* **Por diff vacío** `6f47eb2..b43b5d6` sobre su área (V-05): N-31, N-11, N-24, F-003, F-004, F-006, F-009, F-010 y N-29/N-27.

### H.1 Sugerencias (no restan puntos)

* **S-1..S-27:** heredadas. S-2 es crítica para esta candidata: el merge de #175 debe ser un *merge commit*, porque el ruleset permite squash y rebase (V-32).
* **S-28 y S-29:** cerradas en `b43b5d6` (V-18, V-21).
* **S-30 (nueva).** `r1-07d93c13d7a8` sigue registrada. Autoriza el código de `07d93c1`/`08a8581`, con el comparador previo a #174. El riesgo es bajo porque el run se evalúa en `run.head_sha` de `main`, que ya no tiene esos blobs. Aun así, retirar r1 en una PR de configuración posterior dejaría una sola revisión de confianza (lo deja pendiente `438cfc1`).
* **S-31 (nueva).** `PLAN-APPROVAL-RECEIPT.md:48` pone r2 bajo la columna «Valor en `main`», pero r2 solo llega a `main` con el merge de esta PR. Es coherente una vez mergeada; antes es una anticipación.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos relacionados | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones (0) | F-005 | Q6.2 y Q8.3, con descuento proporcional (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite; causa del flake no demostrada | N-29 | Q5.3 (un solo descuento) |
| ROOT-003 | Los agentes corren con la identidad Windows y GitHub del propietario | N-40 (y la ponderación de la independencia del auditor, §A) | Q8.2 (un solo descuento) |
| ROOT-004 | **CERRADA**: `plan-approval.json` en CRLF contra `.gitattributes` | N-36 (cerrado) | — (V-07) |
| ROOT-005 | La exclusión del bundle se hace por nombre (`*.test`, `*.fixture`), no por uso: un módulo exclusivo de tests con otro nombre se publica | N-41 (cerrado), N-42 | Q2.2 (un solo descuento, junto con F-002) |

## J. QUÉ SOBRA

* REVISAR: `governance/cleanup/*` (F-002, heredado).
* SIMPLIFICAR: sacar `runtime/audit/fixtures.mjs` del bundle (N-42).
* REVISAR: `r1-07d93c13d7a8` en `plan-approval.json` (S-30; decisión de confianza, no resta).

En el delta no encontré código muerto ni scripts sin uso.

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 21 MINOR abiertos de §H:

* las correcciones de N-38, N-39, N-40 y N-42 descritas arriba;
* las de los heredados, según `AUDIT-PLATFORM-247b284.md` §I/§J;
* para Q5.3, además, una corrida limpia y caracterizada que cierre N-29/N-27.

### MEJORAS OPCIONALES

S-1..S-27, S-30 y S-31. No restan puntos, no activan Quality Gates, no bloquean 100/100 y no forman parte del camino obligatorio a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| Autorización humana de r2 | Solo constan afirmaciones del Builder | Ninguno. El control técnico es `human-review` (V-27), que el humano debe aprobar en persona | Aprobación de `human-review` del run 41597605799 por el humano |
| Suite completa local | RAM del host; solo archivos sueltos | Dentro de Q5.3 (N-29); cubierta por la CI remota del SHA exacto (V-28) | CI remota |
| Dispatch real de plan approval tras el merge | Es una escritura (fuera del encargo) | Ninguno: N-36 está demostrado con el evaluador real (E4) | Tras el merge, un dispatch con la App: no debe dar `WORKFLOW_REVISION_UNKNOWN` |
| Ubicación de la clave privada de la App | No accesible por API | Dentro de N-40 | Revisión del propietario |
| F-007, Docker y causa del pilot; Codex y OpenCode | Heredados | F-007 en Q7.1; N-26 en Q6.3 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

Las capacidades esenciales están en verde:

* bootstrap y build reproducibles (V-23);
* la suite principal en CI, en Linux y en Windows, sobre el SHA exacto (V-28);
* los 10 validadores;
* `pretag`, en tests y en ejecución real.

En este SHA también pasa el pilot offline Ubuntu. `human-review` en WAITING no es un fallo: es el HITL requerido, pendiente.

**Release-gate contra este informe (V-35).** Ejecutado: **PASS_WITH_WARNINGS**, exit 0, con un aviso, «score 88.5 is below 90 but within the 2-point tolerance». El informe es CURRENT para `b43b5d6`. No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 88.50

N-31 (Q1.3)                          → +0.75
F-002, N-42 (Q2.2)                   → +0.75
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

Suma: 0.75×10 + 1.00 + 0.50×6 = 7.50 + 1.00 + 3.00 = 11.50
88.50 + 11.50 = 100.00
```

No hay ningún gate activo que eliminar.

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. Para llegar a 90 hacen falta +1.50, en este orden de valor y coste:

1. **Q6.4 (+0.75): N-38.**
   * Archivo nuevo: `governance/versioning/V4.0.0-RELEASE.md` o equivalente.
   * Contenido: la justificación de la MAJOR contra `VERSIONING-POLICY.md:23-36`, o la excepción humana registrada, y el delta de consumidor desde v3.4.3 (V-24).
   * Verificación: inspección.
2. **Q8.1 (+0.50): N-39 residual.**
   * Corregir `SESSION-CONTEXT.md:15` antes de congelar.
   * Sincronizar `main` → `develop` tras la release.
   * Verificación: V-34.
3. **Q2.2 (+0.75): N-42 + F-002.**
   * Sacar `runtime/audit/fixtures.mjs` del bundle y ajustar `release.test.mjs:114`.
   * Resolver `governance/cleanup/`.
   * Verificación: V-24, `ls`.
4. **Q8.2 (+0.50): N-40.** Separación de identidades, o decisión humana registrada. Verificación: `check-agent-isolation` PASS; `current_user_can_approve` false para el agente.
5. **El resto**, como en `AUDIT-PLATFORM-6f47eb2.md` §O.

Los puntos 1 y 2 suman 89.75, que todavía no llega a 90. Con el 1, el 2 y el 3: 90.50.

Cualquier corrección fuera de `.audit/**` cambia el SHA y deja este informe STALE: habría que reauditar el nuevo head congelado. Publicar con 88.50, bajo la tolerancia, es decisión del humano (precedente: v3.4.1 con 89.50). No se refleja aquí.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA (equivalente PLATFORM del «TEMPLATE PROFESIONAL DE REFERENCIA»)?

```text
NO
```

El 100/100 está prohibido: hay 21 MINOR puntuables y la confianza es MEDIA.

Para el uso que pide el perfil, un **gate de release con umbral 90 y tolerancia 2**, la candidata v4.0.1 queda **dentro de la tolerancia (88.50 ≥ 88), pero no alcanza 90**. No hay BLOCKER, CRITICAL ni MAJOR.

Las correcciones posteriores a `c99ed8f` son correctas y están verificadas con evidencia ejecutable:

* N-36, con el evaluador real y el test de drift en CI;
* N-37;
* N-41;
* S-28 y S-29.

Lo que separa la candidata de 90 es heredado o está pendiente de decisión humana: N-38, N-40, N-39 residual y N-42 junto con F-002.

### Comprobación de consistencia (§33 AUDIT_PROMPT / §90 AUDIT_RULES)

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos
[x] Ninguna SUGGESTION activa gates
[x] Ninguna SUGGESTION bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino obligatorio a 100
[x] 88.50 + 11.50 = 100.00 (puntos aplicables = 100, sin N/A)
[x] Los N/A están justificados (no hay N/A)
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
| Q6 | 3 + 2.25 + 2.25 + 2.25 + 2 + 1.5 | 13.25 |
| Q7 | 2.25 + 1.5 + 1.5 + 2 + 2.25 | 9.50 |
| Q8 | 1.5 + 1.5 + 1.5 + 2 | 6.50 |
| **Total** | | **88.50** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `c99ed8f` (87.75, otro auditor): +0.75.** Un solo subcriterio cambia:

| Subcriterio | Antes → ahora | Δ | Causa |
|---|---|---:|---|
| Q1.3 | 1.50 → 2.25 | +0.75 | N-36 y N-37 cerrados (V-30, V-33) |

* Q2.2 sigue en 2.25: N-41 cerrado, N-42 nuevo, F-002 sigue.
* Q8.1 sigue en 1.50: N-39 queda residual.
* Los otros 27 subcriterios no cambian.

**Divergencia con `6f47eb2` (90.25): −1.75**, debida a N-38 (Q6.4), N-39 (Q8.1) y N-40 (Q8.2), todos del contenido v4.

### Riesgos residuales

* **R-1 (MEDIO).** Mientras ROOT-003 siga abierto, cualquier aprobación de Environment es aprobable por un agente con la credencial del propietario. Afecta a plan approval y a `merge-gate`, incluido el `human-review` que hoy espera esta PR (V-27). La aprobación de esta PR debe hacerla el humano en persona.
* **R-2.** TOCTOU extremo a extremo NO RESUELTO y Coordinator consumer inexistente (declarado). No hay que usar receipts para habilitar trabajo.
* **R-3.** `pretag` es procedimental: no hay ruleset de tags (F-008). `release.yml` sigue siendo la única barrera técnica.
* **R-4.** El ruleset admite squash y rebase. Un merge de #175 que no sea merge commit deja STALE el SHA auditado (S-2).
* **R-5.** Hasta el merge, `main` sigue con r1 sola: cualquier dispatch en `main` da `WORKFLOW_REVISION_UNKNOWN` (V-30, config `origin/main`). Es fail-closed y esperable.
* **R-6.** La validación local completa no es sostenible en este host; la confirmación es la CI remota.

```text
AUDITED_SHA: b43b5d6bd1210f16261ac4d5c9465d72e92f4982
SCORE: 88.50/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 87.75 (c99ed8f), 90.25 (6f47eb2)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 21 (17 heredados re-verificados; abiertos de c99ed8f: N-38, N-39 residual, N-40; nuevo: N-42; cerrados: N-36, N-37, N-41)
N-36: CERRADO (evaluador real: HEAD/ced0969 → r2, []; config anterior → WORKFLOW_REVISION_UNKNOWN; 0 trustedFiles cambiados en ced0969..HEAD; LF; drift test CI ×2)
PR #175: CI verde (ubuntu 1271+1 skip, windows 1270+2 skips, 0 FAIL, 1272 tests); human-review WAITING (plano de control)
BUILD: reproducible (sha256:30925624…dd5ca507 ×2; 235 archivos; sin plan-approval-zip.fixture.mjs)
UMBRAL PLATFORM 90 (tolerancia 2): DENTRO DE TOLERANCIA (88.50 ≥ 88), NO ALCANZA 90
VERDICT: APTO CON CORRECCIONES (estado global §32)
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
