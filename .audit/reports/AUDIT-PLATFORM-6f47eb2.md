---
targetRepo: jlbellonGmail/ai-native
targetCommit: 6f47eb2e0e0d7123a704c220e6c39c8371e44314
platform:
  version: "v3.4.3 candidate"
  commit: 6f47eb2e0e0d7123a704c220e6c39c8371e44314
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-10-29T03:13:07Z"
scope: "Independent read-only PLATFORM 1.2 audit of the exact frozen v3.4.3 PATCH candidate 6f47eb2 (N-35: verifyClaudeReceipt no longer counts a reviewer tool call that Claude Code refused before it ran; 8 commits 7707e93..6f47eb2 on origin/develop 3f4351d, open PR #164) and of the live GitHub control plane (read-only). Previous release v3.4.2 (tag on 30119d5) checked as immutable. Baseline and format: AUDIT-PLATFORM-d6c5d4a.md; every inherited finding re-verified live or justified by an empty diff d6c5d4a..6f47eb2 over its area. Auditor did not take part in the implementation or its reviews. No fix, commit, push, PR, merge, tag or release."
score: 90.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v3.4.3, 6f47eb2)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native
Ruta:               C:\Proyectos\ai-native-v3.4.3-fix (worktree)
Branch:             feature/fix-independent-review-rejected-tools-v343 (= origin, PR #164 abierta contra develop)
Commit:             6f47eb2e0e0d7123a704c220e6c39c8371e44314 (= AUDITED_SHA congelado; igual a HEAD al empezar y al terminar)
Base:               origin/develop = 3f4351d (merge de #163, cierre documental de v3.4.2); ancestro directo de 7707e93
Tag:                ninguno en el commit. Release previa: v3.4.2 (tag anotado 035300b -> 30119d5, local = origin)
Fecha:              2026-10-29
Worktree:           limpio al empezar (git status --short vacío); al terminar solo este informe sin commit
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5), independiente del Builder y de los Reviewers de la candidata
Entorno:            Windows 11 Pro 10.0.26200, Git Bash, node v26.12.1, git 2.56.0.windows.1, gh (solo lectura)
Límites del host:   ~1.5 GB de RAM libre; el arnés mató por falta de memoria la corrida completa de review-ledger.test.mjs (V-19)
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 90.25/100
Score final: 90.25/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM de 90: ALCANZADO (+0.25).** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR puntuables (los mismos 17 heredados de `d6c5d4a`), sin N/A y sin gates.

**El parche hace lo que dice, y la propiedad de seguridad se sostiene.** Lo comprobé por tres vías independientes:

* **Receipts reales RED/GREEN (V-25).** Con el adaptador de `v3.4.2` (blob `38a911e`, extraído con `git archive 3f4351d`) y con el de HEAD (blob `f40f92f`, = `bf885e4`) sobre los 9 receipts almacenados. Los dos de `gi-common-reference` con `Bash` rechazado y la E2E A pasan de 1 error («tools outside its read-only set: Bash») a 0 errores, con veredicto y revisión conservados (`APPROVED`, `CHANGES_REQUESTED`, `APPROVED`; `matchesIssued: true`). B (`Bash` corrió, `is_error: false`) y C (`Bash` corrió, `Exit code 3`) siguen rechazados con HEAD. El continuado (`10cb00`) sigue rechazado por follow-up. Los dos sin `Bash` no cambian.
* **Transcripts reales (V-26).** Volqué las llamadas no read-only de los 5 transcripts implicados. El rechazo del arnés es exactamente la forma 2.1.312 (`is_error: true`). Lo que corrió tiene otra forma: «(Bash completed with no output)» con `is_error: false`, o «Exit code 3».
* **Sonda adversarial propia (V-27).** 17 transcripts sintéticos contra `verifyClaudeReceipt` de HEAD y de `v3.4.2`. Ningún caso en que una herramienta no read-only haya corrido según los turnos se atesta. Eso incluye: un rechazo seguido de la misma herramienta con otro id, el id duplicado con otro nombre, el rechazo en un turno `type:user` con `role:assistant`, un bloque no textual añadido, MCP, sin `is_error` e id vacío. Un adverso con una llamada rechazada se atesta como adverso. La negativa no excusa nada más: el único cambio de comportamiento está en el cálculo de `used` (`claude-review.mjs:324-325`).

**N-35 queda CERRADO** para Claude Code 2.1.312. La forma 2.1.288 solo está cubierta por tests (no hay transcript real de esa versión en la evidencia).

**Por qué 90.25 de nuevo.**

* Ningún subcriterio cambia.
* N-35 era un defecto de `v3.4.2` descubierto después de su auditoría. No estaba puntuado en `d6c5d4a` y la candidata lo cierra.
* Los 17 MINOR siguen abiertos. Los re-verifiqué en vivo, o el diff `d6c5d4a..6f47eb2` sobre su área sale vacío.
* La CI remota mejora: verde en `d7a2ee5`, y en `6f47eb2` verde en Linux y Windows (run 40809051639: ubuntu 1110/1110, windows 1108 PASS, 0 FAIL, 2 skips). Aun así, Q5.3 sigue en MENOR por N-29/N-27.

**Margen escaso y confianza MEDIA.** Dos motivos:

* No pude correr localmente la suite de `review-ledger` completa: el arnés la mató por falta de memoria del host. Solo corrí los 3 tests N-35.
* Las suites de adapters, release y CLI no las re-ejecuté localmente. Descanso en la CI remota.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* El diff completo `3f4351d..6f47eb2` (11 archivos, +623/−8), commit por commit (V-04).
* `runtime/adapters/claude-review.mjs`: diff completo y lectura de las líneas 1-371 (todo el verificador).
* Los 3 tests «N-35» y el helper `toolCall` de `review-ledger.test.mjs`.
* `V3.4.3-PATCH.md`, la evidencia JSON, `SESSION-CONTEXT.md`, `execution/current/README.md`, `findings.md`, `knowledge/sdd/methodology/review.md` y `specs/sdd-independent-review/{security,verification}.md`.
* La evidencia cruda local `~/.ai-native/evidence/v3.4.3-n35/`: TAP, transcripts y `replay.mjs`.
* El plano de control de GitHub.

**Ejecutado por el auditor en 6f47eb2.** Ver §G:

* los 10 validadores y `git diff --check`;
* los 3 tests N-35;
* dos builds y un negativo de versión;
* el diff del bundle contra el v3.4.2 publicado;
* los digests de los TAP;
* la reverificación de los 9 receipts reales con dos adaptadores;
* el volcado de los transcripts reales;
* una sonda adversarial de 17 casos;
* la lectura de los logs de CI de `d7a2ee5` y `6f47eb2`.

**No ejecutado localmente (NOT_RUN).**

* `review-ledger.test.mjs` completo: matado por presión de memoria, sin salida.
* `runtime/adapters/*.test.mjs`, `runtime/release/*.test.mjs`, `runtime/cli/*.test.mjs`: no se lanzaron para no repetir la presión de memoria.

Su evidencia es la CI remota: `validators` ubuntu y windows en `d7a2ee5`, 1110 tests cada uno, y los dos en el SHA exacto `6f47eb2` (ubuntu 1110/1110; windows 1108 PASS, 0 FAIL, 2 skips; V-30).

**No verificado.**

* Claude Code 2.1.288 a nivel de receipt o E2E.
* El formato de error de herramientas MCP (por eso se excluyen).
* Una E2E con el adaptador final (`bf885e4`). La E2E del Builder usó el bundle de `4a4765a`; el endurecimiento MCP no cambia sus casos, y lo verifiqué sobre los receipts (V-25).
* Claude Code 2.1.311.
* Docker y el pilot Ubuntu.
* Codex y OpenCode.
* F-007.

**Accesos remotos.** `gh` autenticado, solo lectura: PR #164, runs, logs de jobs, rulesets, protección, activity, releases, alertas de CodeQL, Dependabot y secret scanning.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | Una llamada del Reviewer que Claude Code rechazó antes de ejecutarla no cuenta como herramienta usada; solo el par exacto llamada/negativa para esa herramienta, leído de los turnos | OBLIGATORIO (capacidad `verified` en `core/agents.json`) | `V3.4.3-PATCH.md`, `claude-review.mjs:157-174,322-326` | VERIFICADO (E4: receipts reales 2.1.312, tests, sonda) |
| C-02 | Un Reviewer que ejecutó una herramienta fuera del conjunto read-only nunca produce un `APPROVED` atestable | OBLIGATORIO (seguridad) | `security.md`, `verification.md` | VERIFICADO (V-25 B/C, V-27, tests N-35 #2) |
| C-03 | Una llamada rechazada no excusa nada más (nonce, `agent_id`, revisión, packet, follow-ups, respuestas, prompt, `model`/`isolation`/`name`/`team_name`, N-34) | OBLIGATORIO | `V3.4.3-PATCH.md` §Corrección | VERIFICADO (diff: solo cambia `used`; test N-35 #3; V-27 P10) |
| C-04 | Una llamada `mcp__…` nunca se excusa | OBLIGATORIO | `claude-review.mjs:161,171` | VERIFICADO (tests, V-27 P16) |
| C-05 | `CLI_VERSION` = tag (`v3.4.3`); el build rechaza otra versión | OBLIGATORIO | `cli-version.mjs`, `ai-native.mjs:23` | VERIFICADO (V-22, V-24) |
| C-06 | SemVer PATCH: corrección sin cambio de contrato | OBLIGATORIO | `VERSIONING-POLICY.md` §PATCH | VERIFICADO (bundle: 4 archivos cambian, `bootstrap` igual) |
| C-07 | `v3.4.2` inmutable | OBLIGATORIO | `V3.4.3-PATCH.md` | VERIFICADO (tag `035300b`→`30119d5` local y en origin; release `immutable: true`) |
| C-08 | Bundle determinista | OBLIGATORIO (perfil Q6) | `build.mjs` | VERIFICADO (2 builds idénticos) |
| C-09 | Doc drift verde; todo test del repo corre en CI; acciones fijadas por SHA | OBLIGATORIO (perfil Q4, Q5, Q7) | validadores | VERIFICADO (V-13, V-15, V-16) |
| C-10 | Tests de contrato, paridad y regresión en CI Linux y Windows | OBLIGATORIO (perfil Q5) | `ci.yml` | VERIFICADO en `d7a2ee5` (ambos); en `6f47eb2`: verde en Linux y Windows (run 40809051639: ubuntu 1110/1110, windows 1108 PASS, 0 FAIL, 2 skips) |
| C-11 | Gates server-side y HITL único de merge | OBLIGATORIO (perfil Q8) | ruleset `ai-native-main` | VERIFICADO en `main` con F-005; `develop` sin protección (N-25) |
| C-12 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO (`isMergeGate: false`) |
| C-13 | Cobertura de la forma 2.1.288 de la negativa | RECOMENDADO (declarada «no cubierta» por E2E) | `V3.4.3-PATCH.md` «Límites honestos» | Solo tests sintéticos (test N-35 #1) |
| C-14 | OpenCode | EXPERIMENTAL (`unverified`) | `core/agents.json` | coherente: no se declara verificado |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.50 | MENOR (F-005, causa raíz compartida) |
| **TOTAL** | **100** | **90.25** | APTO |

## F. DETALLE POR SUBCRITERIO

Las columnas «Re-verificación» indican: **E** = evaluado de nuevo sobre el delta; **V** = hallazgo re-verificado en vivo o en el árbol; **D** = diff `d6c5d4a..6f47eb2` vacío sobre el área (`git diff --quiet` → 0, V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación (re-verificación) |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V3.4.3-PATCH.md` | — | E. Defecto, corrección, fuera de alcance y límites (2.1.288 sin E2E, MCP, INFO-5) explícitos |
| Q1.2 | Capacidades prometidas presentes | 3 | COMPLETO | 3.00 | V-25, V-26, V-27, V-18 | N-35 **CERRADO** | E. `independentReview: verified` vuelve a atestar una corrida con una llamada rechazada; las que ejecutaron siguen sin poder aprobar |
| Q1.3 | Coherencia doc/config/código | 3 | MENOR | 2.25 | `review-ledger.mjs` sin diff | N-31 | D + E. La documentación nueva coincide con el código y con mis mediciones; las imprecisiones (S-24, S-25) son de redacción y no restan |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E. Pendientes declarados (CI final, merge, release) son pasos de promoción |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-22 | — | E. Build ×2 idéntico |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | `ls governance/cleanup` (4 archivos) | F-002 | V. El delta no añade residuos: 0 rutas, secretos ni TODO en las líneas añadidas (V-07) |
| Q2.3 | Personalización clara | 3 | COMPLETO | 3.00 | — | — | D |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | código | — | E. CRLF normalizado en la comparación; sin metadatos no documentados (`tool_result` `tool_use_id/is_error/content` son API) |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E. El cambio vive solo en el adaptador de Claude |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | V-05 | — | D. `independent-review.mjs`, `review-ledger.mjs`, `core/` sin cambios |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | `claude-review.mjs:162-174` | — | E. `refusedCalls` es una función pura de 10 líneas; la condición de la línea 171 es larga pero enumerable y comentada (S-26 opcional) |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | `REFUSALS` | — | E. Una redacción futura falla cerrado y se corrige en un punto |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | S-1 | D |
| Q4.2 | Instalación/bootstrap | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D (INFERIDO) |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `findings.md`, `verification.md` | — | E. Las formas de la negativa y lo que no se excusa están documentados |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-08..V-17 | — | E. 10 validadores, exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D. La estrategia del parche es buena: 3 tests de tabla (5 + 23 + 8 casos) por el CLI real, más los receipts reales |
| Q5.3 | Pruebas ejecutables y pasando | 4 | MENOR | 3.00 | V-18, V-19, V-30 | N-29, N-27 | E + V. CI remota verde en `d7a2ee5` (1108+2 skips / 1110) y verde en Linux y Windows (run 40809051639: ubuntu 1110/1110, windows 1108 PASS, 0 FAIL, 2 skips) en `6f47eb2`; localmente el host no sostuvo `review-ledger` completo (matado por memoria). N-27 heredado (D) |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | V-18, V-25, V-23 (TAP) | — | E. RED/GREEN reproducido por el auditor sobre receipts reales; TAP RED/GREEN del Builder con digests verificados |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | E. 8 commits atómicos, cada uno coherente con su mensaje; los commits de PR = locales = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-29 | F-005, N-25 | V. `required_approving_review_count 0` en `main`; `develop` sin protección (404, `rules/branches/develop` = `[]`); activity de `develop` solo `pr_merge` |
| Q6.3 | CI | 3 | MENOR | 2.25 | `.github/`, `runtime/pilot` sin diff | N-26 | D |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-06, V-22, V-24 | — | E. PATCH justificado, `CLI_VERSION` v3.4.3, `VERSION` 3.0.0-dev, v3.4.2 intacto, negativo del build PASS |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-22, V-23 | — | E. `sha256:73d53cc8…b05ebb` ×2 |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D. El cambio es estrictamente más permisivo solo para negativas exactas; el consumidor fijado a v3.4.2 no cambia |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-07, V-29 | F-007 | V. Secret scanning 0; F-007 no verificable por API |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-29 | N-32 | V. 7 alertas Dependabot (1 high, 5 medium, 1 low) |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-29, V-16 | F-008, CodeQL #27 | V. 0 rulesets de tag; CodeQL #27 abierta; la alerta nueva #46 (test N-35) está `fixed` |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-27, código | — | E. Lista exacta, por id y nombre, solo turnos, `mcp__` excluido, fail-closed |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | `SESSION-CONTEXT`, `execution/current`, `V3.4.3-PATCH`, JSON | — | E. Coinciden entre sí y con el estado vivo (PR #164, CI de `d7a2ee5`, CodeQL #46, tag v3.4.2); autorreferencias pendientes en S-25 |
| Q8.2 | Responsabilidades y límites | 2 | COMPLETO | 2.00 | — | — | E. Fuera de alcance explícito (INFO-5, 2.1.311, OpenCode, pilot) |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-29 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V. El parche conserva el fail-closed (V-27) |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-04, V-23 | — | E. Incidente gi → `7707e93` → revisión 1 (APPROVED, LOW-1/2) → `bf885e4` → revisión 2 (delta, APPROVED) → `d7a2ee5` → CI + CodeQL #46 → `a4165b3` → `6f47eb2` → este informe |

## G. LEDGER DE VERIFICACIÓN

Todas las filas son VERIFICACIÓN OFICIAL DEL PROYECTO, salvo las marcadas con (A) (VERIFICACIÓN COMPLEMENTARIA DEL AUDITOR) o con (R) (evidencia remota o del Builder, aceptada tras verificarla). Los logs del auditor están en `C:\Users\ASUS\audit-v343-tmp\`, fuera del árbol, temporales.

| ID | Verificación | Comando/Método | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` (inicio, durante y fin) | `6f47eb2e0e0d…` siempre | PASS | — |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio | PASS | — |
| V-03 | Ancestry y base (A) | `merge-base --is-ancestor`; `gh pr view 164` | `3f4351d` (= `origin/develop`, `baseRefOid`) y `d6c5d4a` son ancestros; `headRefOid` = HEAD = `origin/feature/…`; commits del PR = los 8 locales; `MERGEABLE` | PASS | — |
| V-04 | Alcance | `git diff --stat 3f4351d..HEAD`; `git show --stat` por commit | 11 archivos (+623/−8). Código: `claude-review.mjs` (+26/−3), `ai-native.mjs` (1 línea), `review-ledger.test.mjs`. Docs: `findings.md`, `review.md`, 2 de `specs/`, 4 de `governance/`. Cada commit coincide con su mensaje. Nada ajeno a N-35 | PASS | — |
| V-05 | Áreas heredadas sin diff (A) | `git diff --quiet d6c5d4a HEAD -- <p>` | 0 para `README.md`, `scripts`, `.github`, `runtime/pilot`, `runtime/bootstrap`, `evaluation/fixtures`, `core`, `review-ledger.mjs`, `independent-review.mjs`, `governance/cleanup`, `template`, `contracts`, `runtime/release`, `runtime/audit`, `package.json` | PASS | — |
| V-06 | v3.4.2 intacto | `git ls-remote --tags origin v3.4.2`; `git rev-parse v3.4.2^{}`; `gh api releases/latest`; `git diff --name-only 30119d5 HEAD` | tag `035300b` → `30119d5` local = origin; release `immutable: true`, Latest. Diff: los 11 de la candidata más `V3.4.2-PATCH.md` y `V3.4.2-POST-RELEASE-VERIFICATION.md` (post-release de `3f4351d`). `30119d5` no es ancestro (sync `main`→`develop` pendiente, ya registrado) pero `d6c5d4a..30119d5` solo añade `.audit/**` | PASS | — |
| V-07 | Higiene del delta (A) | `git diff --check 3f4351d HEAD`; grep de secretos, rutas de host, emails y TODO/FIXME en las líneas añadidas | exit 0; 0 coincidencias | PASS | — |
| V-08 | Método de auditoría | `node runtime/audit/cli.mjs check` | `PASS`, exit 0 | PASS | `validators.log` |
| V-09 | Paridad | `node parity/validate-parity.mjs` | exit 0; unmapped=0; 95/95 par-tests | PASS | idem |
| V-10 | Contratos | `node contracts/validate-contracts.mjs` | exit 0; 20 schemas, 7 datos | PASS | idem |
| V-11 | Core | `node core/validate-core.mjs` | exit 0 | PASS | idem |
| V-12 | Integridad de status | `node runtime/status/validate-integrity.mjs` | exit 0 | PASS | idem |
| V-13 | Doc drift | `node runtime/docs/validate-doc-drift.mjs` | exit 0 | PASS | idem |
| V-14 | Entry points | `node runtime/adapters/validate-entrypoints.mjs` | exit 0 | PASS | idem |
| V-15 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | «all 99 committed *.test.mjs files are run by a workflow» | PASS | idem |
| V-16 | Acciones fijadas | `node scripts/validate-actions-pinned.mjs` | «all actions … pinned by full SHA» | PASS | idem |
| V-17 | Matriz de compatibilidad | `node evaluation/compat/validate-compat-matrix.mjs` | exit 0; 32 checks | PASS | idem |
| V-18 | Tests N-35 | `TMP=TEMP=<tmp del auditor> node --test --test-concurrency=1 --test-name-pattern="N-35" runtime/circuit/review-ledger.test.mjs` | **3/3 PASS**, 0 FAIL, 169 s; sin flake | PASS | `n35-tests.log` |
| V-19 | Review ledger completo | `node --test --test-concurrency=1 runtime/circuit/review-ledger.test.mjs` (62 tests) | **Matado por el arnés por falta de memoria del host**, sin salida. No se relanzó | NOT_RUN | — |
| V-20 | Adapters, release, CLI | — | No lanzados localmente (presión de memoria); cubiertos por V-30 | NOT_RUN | — |
| V-21 | CI remota de `d7a2ee5` (R) | `gh api …/actions/jobs/{123230319411,123230319744}/logs`; suma de `ℹ tests/pass/fail/skipped` | windows: 1110 tests, 1108 PASS, 0 FAIL, 2 skips; ubuntu: 1110/1110. Los 3 «✔ N-35» en ambos. Coincide con lo declarado en `V3.4.3-PATCH.md` | PASS | `ci-d7a2-*.log` |
| V-22 | Build reproducible y negativo | `node runtime/release/build.mjs --version v3.4.3 --out <tmp>/build{1,2} --commit 6f47eb2…` ×2; `--version v3.4.2` | 230 archivos; `diff -r` idéntico; tarball `sha256:73d53cc8aaa3e368c126c17c130a851303d52f409e70f3055d607988dfb05ebb` ×2; `platform.json` `version v3.4.3`, `commit 6f47eb2…`, `bootstrap` = `{protocol 1, minCliVersion v3.2.0, requiredCapabilities [adopt]}`. Negativo: exit 1, «declares CLI_VERSION v3.4.3; this release is v3.4.2» | PASS | `build*.log` |
| V-23 | Delta de consumidor y TAP (A) | `gh release download v3.4.2` + `diff -rq`; `sha256sum` de los TAP de `~/.ai-native/evidence/v3.4.3-n35/` contra la evidencia JSON | sha256 publicado `97da1195…d76f` = `SHA256SUMS` = `SESSION-CONTEXT.md`. 230 = 230 entradas; difieren `platform.json`, `claude-review.mjs`, `ai-native.mjs` **y `knowledge/sdd/methodology/review.md`** (S-24). Los 5 digests de TAP declarados coinciden | PASS | — |
| V-24 | Declaración de versión (A) | `declaredCliVersion` / `assertCliDeclaresTag` sobre `ai-native.mjs`; `cat VERSION` | `v3.4.3`; acepta `v3.4.3`, rechaza `v3.4.2`; `VERSION` = `3.0.0-dev` | PASS | — |
| V-25 | Receipts reales RED/GREEN (A) | `replay.mjs` del Builder (leído; copiado a `<tmp>`), `verifyClaudeReceipt` con las herramientas y el modelo proyectados de cada árbol, sobre los 9 receipts almacenados (4 de `gi-common-reference/.git/ai-native/review/002-regions-subregions`, 5 de las E2E A, A1, B×2 y C); adaptador de HEAD y de `v3.4.2` (`git archive 3f4351d`) | HEAD: gi `bc6845` 0 errores `APPROVED`; gi `4bf803` 0 errores `CHANGES_REQUESTED`; E2E A 0 errores `APPROVED`; las tres con `matchesIssued: true`. gi `10cb00`: follow-up; B ×2 y C: «tools outside its read-only set: Bash». `ff8fee` y A1 sin cambio (0 errores, `CHANGES_REQUESTED`). v3.4.2: los tres primeros con 1 error («Bash»), el resto igual. **Coincide exactamente con la tabla de `V3.4.3-PATCH.md`** | PASS | `receipts.txt` |
| V-26 | Transcripts reales (A) | `dumpbash.mjs`: toda llamada no read-only y su resultado en los transcripts de A, B, C y de los dos gi | A, gi ×2: `is_error: true` y la negativa 2.1.312 exacta; transcripts `version 2.1.312`. B: `is_error: false`, «(Bash completed with no output)». C: `is_error: true`, «Exit code 3». En todos, el `api-request-blob` repite la llamada con el mismo id y nombre | PASS | — |
| V-27 | Sonda adversarial (A) | `probe.mjs`: 17 stores sintéticos completos (sesión + subagente) → `verifyClaudeReceipt` de HEAD y de `v3.4.2` | HEAD rechaza: refusal + Write corrido con otro id (P03), resultado junto a texto (P04, follow-up), id vacío (P07), sin `is_error` (P08), `Agent` corrido (P12), resultado con `role:assistant` en `type:user` (P14), bloque no textual (P15), MCP (P16), dos `tool_use` con el mismo id (P17). Atesta: la negativa base (P01), el blob con el mismo id y nombre e input distinto (P02), un `tool_result` contradictorio solo en un blob (P05, S-27), un `Read` del packet rechazado (P06, INFO-5 preexistente, igual en v3.4.2), texto CR + `Bash` rechazado y luego handback APPROVED (P09, S-21 preexistente), `Agent` rechazado (P11), nombre con espacio rechazado (P13). Adverso + rechazo → atestado **como adverso** (P10). Ningún caso en que una herramienta no read-only corrió según los turnos se atesta | PASS | `probe.txt` |
| V-28 | Revisiones independientes del Builder | lectura de `V3.4.3-PATCH.md` §Revisión y de la evidencia JSON | Revisión 1 (`4a4765a`) APPROVED con LOW-1/LOW-2 → `bf885e4` (comprobado en el diff: exclusión `mcp__` y los casos LOW-2 en la tabla del test #2). Revisión 2 (delta) APPROVED. No son corridas atestadas por la plataforma (declarado) | ACEPTADA | — |
| V-29 | Plano de control | `gh api` (rulesets, `branches/develop/protection`, `rules/branches/develop`, activity, code-scanning, dependabot, secret-scanning), `gh release list` | Ruleset `ai-native-main` (24405506) activo, sin bypass: deletion, non_fast_forward, pull_request (`required_approving_review_count 0`), 6 required checks (strict). `develop`: 404 y `[]`; activity de `develop` solo `pr_merge` (último `3f4351d`, 2026-10-28T19:50:34Z). CodeQL abiertas: 1 (#27). La #46 (`js/useless-regexp-character-escape`, `review-ledger.test.mjs:1668`, de la PR) está `fixed`. Dependabot: 7 (1 high, 5 medium, 1 low). Secret scanning: 0. Rulesets de tag: 0 | PASS (con F-005, N-25, F-008, N-32) | — |
| V-30 | CI remota de `6f47eb2` | `gh pr view 164 --json statusCheckRollup`; `gh run view 40809051639`; log del job ubuntu (`123235166933`) | CodeQL ×2 + check `CodeQL`, dependency-review, sbom, pin-check, trivy-fs, pr-gate, security-scan: SUCCESS. `validators (ubuntu-latest)`: SUCCESS, 1110 tests, 1110 PASS, 0 FAIL, 3 «✔ N-35», 16 N-34. `validators (windows-latest)`: SUCCESS (job 123235167107, 15m20s), 1110 tests, 1108 PASS, 0 FAIL, 2 skips (SO), 3 «✔ N-35». `gh pr checks 164`: 11/11 pass | PASS | `ci-6f47-ubuntu.log` |
| V-31 | release-gate antes de este informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 6f47eb2… --root . --reports <copia sin este informe>` | **FAIL (30 errors)**, exit 1: «no current valid PLATFORM audit report for 6f47eb2…» y los 29 informes históricos STALE, incluido `d6c5d4a`. Es lo esperado antes de este informe | ESPERADO | `release-gate-before.txt` |
| V-32 | release-gate después de este informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 6f47eb2e0e0d7123a704c220e6c39c8371e44314 --root .` | **PASS_WITH_WARNINGS (29 warnings)**, exit 0. Las 29 advertencias son los informes históricos ignorados por STALE (incluido `d6c5d4a`); ninguna sobre este informe, que es el único vigente para la candidata | PASS | `release-gate-after.txt` |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-35 | ROTO | (defecto de v3.4.2, no puntuado en d6c5d4a) → **CERRADO** | La revisión atestada de Claude no podía aprobar una corrida que solo **intentó** una herramienta que no tiene | V-18, V-25, V-26, V-27, V-21 | Q1.2 | 0 (sin descuento previo) |
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas | `review-ledger.mjs` sin diff (V-05) | Q1.3 | −0.75 |
| F-002 | SOBRA | MINOR | Residuos de cierre en `governance/cleanup/` | `ls governance/cleanup` | Q2.2 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git del host (heredado; ahora además el host no sostiene `review-ledger` completo por memoria); N-27 heredado | V-19, V-20; `V3.4.3-PATCH.md` (9 FAIL locales en `4a4765a`, no reproducidos en CI) | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-29 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-29 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | CI (heredado; incluye el pilot Ubuntu diferido) | V-05 | Q6.3 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-29 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 7 alertas Dependabot (1 high) en `template/` | V-29 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-29 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR.** Son N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009 y F-010. **Cerrado:** N-35. **Nuevos puntuables:** ninguno.

**N-35 (CERRADO).**

* **Descripción.** `verifyClaudeReceipt` de `v3.4.2` contaba como herramienta usada todo `tool_use` fuera de `Read/Grep/Glob`. Contaba también una llamada que Claude Code rechazó antes de ejecutarla («No such tool available»). Así, un Reviewer que solo intentó `Bash` no podía atestarse (incidente `gi-common-reference`, `002-regions-subregions`, 2.1.312).
* **Corrección.** `claude-review.mjs:157-174` (`REFUSALS`, `isRefusal`, `refusedCalls`) y `322-326`. Se excusa por id **y** nombre, leído solo de los turnos, con estas condiciones:
  * un único `tool_use` con ese id;
  * un único `tool_result` posterior en un turno de usuario;
  * `is_error === true` y solo texto;
  * el texto entero igual a una de las dos negativas para esa herramienta;
  * nunca `mcp__…`.
* **Propiedad de seguridad (juicio del auditor).**
  * *Un Reviewer que ejecutó una herramienta no read-only nunca produce un `APPROVED` atestable.* **Se sostiene** con los formatos observados de Claude Code 2.1.312: lo que corre devuelve `is_error: false` o un `is_error: true` con prefijo `Exit code N` (V-26). La negativa debe nombrar la misma herramienta y ocupar todo el resultado, y los errores MCP los escribe un servidor y se excluyen. El residuo está en §Riesgos residuales (R-1, R-2).
  * *Una llamada rechazada no excusa nada más.* **Se sostiene**:
    * el diff solo cambia el filtro de `used`;
    * el test N-35 #3 cubre los adversos, otro nonce, otro `agent_id`, sin respuesta, corrida continuada y receipt alterado;
    * mi sonda P10 lo confirma, y P03/P17 confirman que no se extiende a otras llamadas.
* **Verificación de cierre ejecutada:**
  * los 3 tests N-35 pasan (V-18 local; V-21/V-30 CI);
  * receipts reales RED v3.4.2 → GREEN HEAD (V-25);
  * transcripts reales con la forma exacta (V-26);
  * sonda (V-27).
* **Riesgo residual.** No hay E2E ni receipt de 2.1.288 (solo tests). Un texto futuro del arnés da `NOT_PROVEN`: es fail-closed y está documentado.

**N-29 (MINOR, re-verificado).**

* En esta auditoría los 3 tests N-35 pasaron sin flake con `TMP`/`TEMP` propios.
* La corrida completa de `review-ledger` no terminó: el arnés la mató por memoria, lo que no es un fallo del producto.
* El Builder registra 9 FAIL locales en `4a4765a` por el flake. No se reprodujeron en la CI de `d7a2ee5` (V-21), pero tampoco se repitieron localmente.
* No afirmo causa. **No activa G3:** la CI remota está verde en Linux y Windows para `d7a2ee5`.

**Resto de hallazgos (heredados).** Su descripción, corrección y verificación están en `AUDIT-PLATFORM-247b284.md` §I/§J y `AUDIT-PLATFORM-d6c5d4a.md` §H y siguen vigentes. Los re-verifiqué en vivo (F-005, N-25, N-32, F-008, CodeQL #27, F-007), en el árbol (F-002) o por diff vacío `d6c5d4a..6f47eb2` sobre su área (V-05).

### H.1 Sugerencias (no restan puntos)

* S-1..S-23: heredadas de `d6c5d4a`, sin cambio. S-2 sigue vigente: la promoción `develop` → `main` debe hacerse con merge commit, o este informe queda STALE. S-21 aplica igual con una llamada rechazada que con un `Read` (V-27 P09); no es nuevo.
* **S-24 (nueva).** `V3.4.3-PATCH.md` §«Delta para un consumidor» dice que cambian el adaptador y `CLI_VERSION`. El bundle también cambia `knowledge/sdd/methodology/review.md` (V-23): es documentación, sin efecto funcional, pero conviene listarla.
* **S-25 (nueva, autorreferencia).** `execution/current/README.md` (PENDING) lista «REMOTE CI» dos veces y «PR to develop», aunque la PR #164 ya existe; `SESSION-CONTEXT.md` lo dice bien («merge humano de la PR #164»). Como S-20, conviene ajustarlo en el post-release.
* **S-26 (nueva, opcional).** La condición de `claude-review.mjs:171` encadena 8 cláusulas en una línea. Partirla en predicados con nombre facilitaría auditarla.
* **S-27 (nueva).** `refusedCalls` ignora (correctamente) los `api-request-blob`, así que un blob que contradiga el turno no cambia nada (V-27 P05). Es coherente con el modelo de amenazas declarado (quien escribe el store puede falsificarlo). Una comprobación de coherencia blob/turno sería defensa en profundidad, no una corrección.
* INFO-5 de la revisión 1 (preexistente, diferido): la lectura del packet se comprueba por la llamada `Read`, no por su resultado. Incluso un `Read` rechazado cuenta como lectura (V-27 P06, igual en v3.4.2). No cambia con N-35.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos relacionados | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones (0) | F-005 | Q6.2 y Q8.3, con descuento proporcional (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite (flake de git; memoria); causa del flake no demostrada | N-29 | Q5.3 (un solo descuento) |

## J. QUÉ SOBRA

* REVISAR: `governance/cleanup/*` (F-002, heredado).

No encontré código muerto, scripts sin uso ni artefactos generados en el delta. La evidencia cruda queda fuera del árbol por contener datos del host (declarado).

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 17 MINOR abiertos de §H, con las correcciones de `AUDIT-PLATFORM-247b284.md` §I/§J. Además, una corrida local o remota limpia y caracterizada que cierre N-29 (Q5.3).

### MEJORAS OPCIONALES

S-1..S-27. No restan puntos, no activan Quality Gates, no bloquean 100/100 y no forman parte del camino obligatorio a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| `review-ledger.test.mjs` completo, local | Matado por el arnés por memoria | Dentro de Q5.3 (N-29); cubierto por la CI remota | CI remota (V-21, V-30) |
| adapters / release / CLI, local | No lanzados (memoria) | Ninguno adicional: CI remota | idem |
| (resuelto) `validators (windows-latest)` en `6f47eb2` | Terminó durante la auditoría: SUCCESS (V-30) | Ninguno | — |
| E2E con el adaptador final `bf885e4` | La E2E del Builder usó el bundle de `4a4765a` | Ninguno: el endurecimiento MCP no cambia los casos A/B/C; receipts reverificados con el adaptador final (V-25) | `claude -p "/sdd-validate 001-demo"` con un bundle de `6f47eb2` |
| Negativa 2.1.288 en un receipt real | No disponible | Ninguno (C-13 RECOMENDADO; tests) | Receipt real con 2.1.288 |
| Formato de error MCP | No observado | Ninguno (se excluye) | — |
| Claude Code 2.1.311 / Docker / pilot Ubuntu / FIFO-POSIX / Codex / OpenCode | Heredados | N-26 (heredado); el resto ninguno | — |
| F-007 | No verificable por API | Q7.1 | Revisión manual |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

G3: la capacidad esencial del parche (N-35) está verificada por:

* los tests N-35, local y en CI;
* los receipts reales;
* la sonda.

Los 10 validadores y el build están en exit 0, y la CI remota de `d7a2ee5` está verde en ambos SO. Lo no ejecutado localmente es una limitación del entorno (§19 AUDIT_RULES), registrada como NOT_RUN, no un fallo.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 90.25

N-31 (Q1.3)                          → +0.75
F-002 (Q2.2)                         → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 (Q5.3)                    → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26 (Q6.3)                          → +0.75
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27 (Q7.3)             → +0.50
F-009, F-010 (Q7.5)                  → +0.75
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 0.75×9 + 1.00 + 0.50×4 = 6.75 + 1.00 + 2.00 = 9.75
90.25 + 9.75 = 100.00
```

No hay gate activo que eliminar.

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. Para los MINOR rige el mismo plan que en `AUDIT-PLATFORM-d6c5d4a.md` §O, por orden de valor:

1. **Q5.3 (+1.00).** Caracterizar el flake (N-29) y cerrar N-27.
2. **Q6.2/Q8.3 (+0.75/+0.50).** F-005 y N-25.
3. **Q1.3 (+0.75).** N-31.
4. **El resto**, según `AUDIT-PLATFORM-247b284.md` §J.

Para la promoción de esta candidata:

* CI remota de `6f47eb2` ya verde (V-30);
* merge humano de #164;
* `develop` → `main` con merge commit (S-2);
* `release-gate` sobre este informe.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA (equivalente PLATFORM del «TEMPLATE PROFESIONAL DE REFERENCIA»)?

```text
NO
```

El 100/100 está prohibido: hay 17 MINOR puntuables y la confianza es MEDIA. Para el uso que pide el perfil, **gate de release con umbral 90**, la candidata v3.4.3 **alcanza el umbral**:

* score 90.25, sin BLOCKER, CRITICAL ni MAJOR;
* N-35 corregido, con su regresión reproducida sobre datos reales;
* la propiedad de seguridad se sostiene frente a la sonda.

### Comprobación de consistencia (§33 AUDIT_PROMPT / §90 AUDIT_RULES)

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos
[x] Ninguna SUGGESTION activa gates
[x] Ninguna SUGGESTION bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino obligatorio a 100
[x] 90.25 + 9.75 = 100.00 (puntos aplicables = 100, sin N/A)
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
| Q6 | 3 + 2.25 + 2.25 + 3 + 2 + 1.5 | 14.00 |
| Q7 | 2.25 + 1.5 + 1.5 + 2 + 2.25 | 9.50 |
| Q8 | 2 + 2 + 1.5 + 2 | 7.50 |
| **Total** | | **90.25** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `d6c5d4a` (90.25): 0.** Los 30 subcriterios no cambian. N-35 no restaba en `d6c5d4a` (no se conocía) y queda cerrado. La CI remota del SHA exacto pasa de NO VERIFICADA a verificada (Linux y Windows en `6f47eb2`), lo que recupera la parte de Q5.3 que dependía de ella. Aun así Q5.3 no sube: el hallazgo N-29/N-27 sigue abierto y no hay medición objetiva que justifique un porcentaje intermedio.

### Riesgos residuales

* **R-1 (BAJO).** La seguridad de la excusa depende de que ninguna herramienta no-MCP que se ejecute pueda devolver, como resultado completo con `is_error: true`, el texto exacto de la negativa que la nombra.
  * Con 2.1.312 lo que corre devuelve `is_error: false` o `Exit code N` (V-26).
  * Si una versión futura cambiara el formato de error de `Bash`, por ejemplo quitando el prefijo, un comando que imprima la negativa y salga con error podría excusarse.
  * Mitigaciones: el Reviewer proyectado no tiene `Bash` (`tools: Read, Grep, Glob`) y concederlo exige escribir `.claude/`, lo que queda fuera del modelo de amenazas declarado.
* **R-2 (BAJO).** El modelo de amenazas sigue siendo que quien escribe el store de transcripts o `.claude/` puede falsificar todo (declarado en la cabecera del adaptador). N-35 no lo empeora (S-27).
* **R-3.** La forma 2.1.288 solo está cubierta por tests sintéticos.
* **R-4.** La validación local completa no es sostenible en este host (memoria, flake); la confirmación es la CI remota.

### release-gate (tras escribir este informe)

```text
$ node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 6f47eb2e0e0d7123a704c220e6c39c8371e44314 --root .
PASS_WITH_WARNINGS (29 warnings)            exit 0
WARNING ignored report AUDIT-PLATFORM-<sha>.md: STALE (…) ×29 (todos los informes históricos, incluido d6c5d4a)
```

```text
AUDITED_SHA: 6f47eb2e0e0d7123a704c220e6c39c8371e44314
SCORE: 90.25/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 90.25 (d6c5d4a)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 17 (cerrado: N-35; nuevos puntuables: 0)
N-35: CERRADO (receipts reales 2.1.312: gi bc6845/4bf803 y E2E A 1 error -> 0, veredictos conservados; B/C, que ejecutaron Bash, siguen NOT_PROVEN)
SEGURIDAD: una herramienta no read-only ejecutada nunca produce un APPROVED atestable (sonda 17 casos, tests, receipts); la negativa no excusa nada más
SEMVER: PATCH (v3.4.3); CLI_VERSION v3.4.3; VERSION 3.0.0-dev; v3.4.2 intacto
BUILD: reproducible (sha256:73d53cc8…b05ebb ×2); delta vs v3.4.2 publicado: platform.json + claude-review.mjs + ai-native.mjs + review.md
CI REMOTA: 6f47eb2 verde, 11/11 checks de la PR (run 40809051639: ubuntu 1110/1110, windows 1108 PASS, 0 FAIL, 2 skips); d7a2ee5 también verde
UMBRAL PLATFORM 90: ALCANZADO (+0.25)
VERDICT: APTO (estado global §32)
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
