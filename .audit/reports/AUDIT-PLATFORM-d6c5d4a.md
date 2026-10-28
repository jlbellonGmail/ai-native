---
targetRepo: jlbellonGmail/ai-native
targetCommit: d6c5d4a6d4cd909b2ae7eaa938214e708cddab9d
platform:
  version: "v3.4.2 candidate"
  commit: d6c5d4a6d4cd909b2ae7eaa938214e708cddab9d
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-10-28T14:48:12Z"
scope: "Independent read-only PLATFORM 1.2 audit of the exact frozen v3.4.2 PATCH candidate d6c5d4a (N-34: SubagentHandback delivery of the independent reviewer's report; 10 commits a446488..d6c5d4a on 4260fa8, PR base origin/develop 49868e4 with the same tree) and of the live GitHub control plane (read-only). Previous release v3.4.1 (tag on 635a60c) checked as immutable. Previous report AUDIT-PLATFORM-247b284.md used for format only; every inherited finding re-verified live or justified by an empty diff 247b284..d6c5d4a over its area. Auditor did not take part in the implementation or its reviews. No fix, commit, push, PR, merge, tag or release."
score: 90.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v3.4.2, d6c5d4a)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native
Ruta:               C:\Proyectos\ai-native-n34 (worktree)
Branch:             fix/n34-subagent-handback-v3.4.2 (solo local; no existe en origin)
Commit:             d6c5d4a6d4cd909b2ae7eaa938214e708cddab9d (= AUDITED_SHA congelado; igual a HEAD al empezar y al terminar)
Base:               4260fa8 (padre de a446488). PR base: origin/develop = 49868e4 (merge de #160), mismo árbol 42f603fd…
Tag:                ninguno en el commit. Release previa: v3.4.1 (tag anotado c3c96ee -> 635a60c, local = origin)
Fecha:              2026-10-28
Worktree:           limpio al empezar (git status --short vacío); al terminar solo este informe sin commit
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code 2.1.312 (claude-opus-5-5), independiente del Builder y de los Reviewers de la candidata
Entorno:            Windows 11 Pro 10.0.26200, Git Bash, node v26.12.1, git 2.56.0.windows.1, gh 2.101.0 (solo lectura)
Límites del host:   ~1.7 GB de RAM libre: tests por archivo/directorio con --test-concurrency=1, uno a la vez
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

**Contra el umbral PLATFORM de 90: ALCANZADO (+0.25).** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR puntuables, sin N/A y sin gates.

**El parche hace lo que dice.** Antes, con el adaptador de `v3.4.1`, los tres receipts reales de Claude Code 2.1.312 (el incidente de `gi-common-reference`, la E2E aprobada y la E2E adversa con dos receipts) daban 5, 5, 2 y 2 errores. En dos de ellos se perdía el veredicto (`observed: null`). Con el adaptador de HEAD (blob `38a911e`, el mismo de `f877b2c`) dan 0 errores. Los veredictos se conservan: `CHANGES_REQUESTED`, `APPROVED`, `CHANGES_REQUESTED` ×2. Lo verifiqué yo mismo con un script propio (§G, V-25).

Una sonda adversarial de 23 transcripts sintéticos no encontró ningún camino que convierta un veredicto adverso en `APPROVED` (§G, V-26). La lista de textos del arnés es exacta y falla cerrada.

**N-34 queda CERRADO** para el runtime actual (2.1.312). Para 2.1.311 la cobertura es menor: los dos transcripts reales de Reviewer se leen bien (1 respuesta, 0 follow-ups), pero no hay un receipt completo ni una E2E de esa versión.

**Por qué 90.25 y no 89.50.** Se recupera Q1.2, que en `247b284` perdía 0.75 por N-34. Los demás subcriterios no cambian: sus hallazgos siguen abiertos y los re-verifiqué en vivo, o el diff `247b284..d6c5d4a` sobre su área sale vacío.

**Margen escaso y confianza MEDIA.** Hay dos riesgos reales:

* La CI remota de la candidata no existe (NO VERIFICADO).
* El flake de git del host (N-29) se manifestó ahora también en corridas **secuenciales**: 6/92 en adapters y 1/59 en review-ledger. Todos los tests que fallaron pasan al repetirlos solos.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* El diff completo `4260fa8..d6c5d4a` (11 archivos, +909/−27). Línea por línea en `runtime/adapters/claude-review.mjs` (completo, 350 líneas), `runtime/cli/ai-native.mjs`, la evidencia JSON, `V3.4.2-PATCH.md`, `SESSION-CONTEXT.md`, `execution/current/README.md`, `findings.md` y `specs/sdd-independent-review/*`.
* Los tests «N-34» de `review-ledger.test.mjs`.
* `VERSIONING-POLICY.md`, `runtime/release/cli-version.mjs`, `core/agents.json` y `ci.yml`.
* El plano de control de GitHub.

**Ejecutado por el auditor en d6c5d4a.** Ver §G:

* los validadores (10);
* `runtime/adapters/*.test.mjs`, `runtime/circuit/review-ledger.test.mjs`, `runtime/release/*.test.mjs` y `runtime/cli/*.test.mjs`;
* dos builds y un negativo de versión;
* el diff del bundle contra el v3.4.1 publicado;
* la re-verificación de los receipts reales con el adaptador de HEAD y con el de `v3.4.1` (RED);
* una sonda adversarial y un relevamiento de 17 transcripts locales con `SubagentHandback`.

**Evidencia previa aceptada, etiquetada como tal.** Es la réplica secuencial del job `validators` de `ci.yml` en `f877b2c` (`review3/ci-replay-f877b2c/`): 50 pasos, 1016 PASS, 6 FAIL, todos el flake de git, y 6/6 PASS al repetirlos solos (`rerun-flakes.log`, que inspeccioné).

Es válida para d6c5d4a porque `git diff f877b2c d6c5d4a` solo toca `governance/**` (4 archivos) y el blob del adaptador es idéntico. Lo verifiqué en V-05.

No re-ejecuté: bootstrap, migrate, consumer, pilot, policy, gates, mcp-gateway ni los validadores de foundation/knowledge/template. Los acepto de la réplica.

**No verificado.**

* La CI remota del SHA exacto: la rama no está en origin, y `GET /commits/d6c5d4a/check-runs` devuelve 422.
* Una E2E nueva con el adaptador final. La E2E del Builder usó el bundle de la primera corrección; el adaptador final lo verifiqué sobre los receipts reales almacenados.
* Claude Code 2.1.311 a nivel de receipt.
* Docker y el pilot offline Ubuntu (exit 125, diferido).
* FIFO y permisos POSIX (2 skips de SO).
* Codex y OpenCode (la CLI de OpenCode 2.2.0 está rota en el host).
* F-007 (no verificable por API).

**Accesos remotos.** `gh` autenticado, solo lectura: rulesets, protección, activity, PR, releases, alertas de CodeQL, Dependabot y secret scanning.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | La revisión independiente atestada de Claude lee el informe entregado por `SubagentHandback`, no cuenta como follow-up la instrucción exacta del arnés y falla cerrada ante cualquier otra cosa | OBLIGATORIO (capacidad `verified` en `core/agents.json`) | `V3.4.2-PATCH.md`, `claude-review.mjs:19-29,150-226` | VERIFICADO (E4: receipts reales 2.1.312, tests, sonda) |
| C-02 | Un veredicto adverso nunca se pierde ni se convierte en APPROVED | OBLIGATORIO | `claude-review.mjs:228-234`, `review.md` | VERIFICADO (V-25, V-26, tests N-34) |
| C-03 | La sesión no puede continuar la corrida: `SendMessage` por `to` o `recipient`, `resume`, o una delegación con `name` o `team_name` impiden aprobar | OBLIGATORIO | `claude-review.mjs:288-303` | VERIFICADO (tests N-34; inspección) |
| C-04 | La comprobación de solo lectura sigue vigente; solo se exime `SubagentHandback` | OBLIGATORIO | `claude-review.mjs:304-306` | VERIFICADO (test «delivery channel, not a capability») |
| C-05 | `CLI_VERSION` = tag de la release (`v3.4.2`); el build rechaza otra versión | OBLIGATORIO | `cli-version.mjs`, `ai-native.mjs:23` | VERIFICADO (V-22, V-24) |
| C-06 | SemVer PATCH: corrección de un defecto sin cambio de contrato | OBLIGATORIO | `VERSIONING-POLICY.md` §PATCH | VERIFICADO (bundle: 3 archivos cambian; `bootstrap` igual) |
| C-07 | `v3.4.1` inmutable | OBLIGATORIO | `V3.4.2-PATCH.md:3` | VERIFICADO (tag c3c96ee→635a60c local y en origin; release `immutable: true`) |
| C-08 | Bundle determinista | OBLIGATORIO (perfil Q6) | `build.mjs` | VERIFICADO (2 builds idénticos) |
| C-09 | Doc drift verde; todo test del repo corre en CI; acciones fijadas por SHA | OBLIGATORIO (perfil Q4, Q5, Q7) | validadores | VERIFICADO (V-13, V-15, V-16) |
| C-10 | Tests de contrato, paridad y regresión en CI Linux y Windows | OBLIGATORIO (perfil Q5) | `ci.yml` | VERIFICADO sobre la base `4260fa8` (PR #160); NO VERIFICADO sobre la candidata |
| C-11 | Gates server-side y HITL único de merge | OBLIGATORIO (perfil Q8) | ruleset `ai-native-main` | VERIFICADO en `main` con F-005; `develop` sin protección (N-25) |
| C-12 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO (`isMergeGate: false`) |
| C-13 | Cobertura E2E de Claude Code 2.1.311 | RECOMENDADO (declarada «no cubierta») | `V3.4.2-PATCH.md` «Límites honestos» | NO VERIFICADO (solo a nivel de transcript, V-27) |
| C-14 | OpenCode | EXPERIMENTAL (`unverified` en `core/agents.json`) | `core/agents.json:8` | coherente: no se declara verificado |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, CI remota NO VERIFICADA, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 7.50 | MENOR (F-005, causa raíz compartida) |
| **TOTAL** | **100** | **90.25** | APTO |

## F. DETALLE POR SUBCRITERIO

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V3.4.2-PATCH.md`: defecto, corrección, fuera de alcance, límites | — | Alcance, límites y lo no cubierto (2.1.311, OpenCode, Docker) están explícitos |
| Q1.2 | Capacidades prometidas presentes | 3 | COMPLETO | 3.00 | V-25 (4 receipts reales, 0 errores), V-26, V-27, V-19 | N-34 **CERRADO** | `independentReview: verified` para Claude vuelve a producir PASS con el runtime actual (2.1.312, también el del auditor). 2.1.311 se lee bien a nivel de transcript; el contrato no promete cobertura por versión |
| Q1.3 | Coherencia doc/config/código | 3 | MENOR | 2.25 | `review-ledger.mjs` sin diff desde 247b284 | N-31 | Sigue la contradicción del aislamiento por slug. La documentación de la candidata coincide con el código y con mis mediciones; las imprecisiones encontradas (S-19, S-20) son de redacción y no restan |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | Pendientes declarados (CI, PR, release) son pasos de promoción, no requisitos del parche |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-22 | — | Build ×2 idéntico |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | `governance/cleanup/{M7-CLOSURE,FINAL-CONSOLIDATION,…}.md` presentes | F-002 | Heredado. El delta no añade residuos: 0 rutas de workstation y 0 secretos en las líneas añadidas (V-07) |
| Q2.3 | Personalización clara | 3 | COMPLETO | 3.00 | — | — | Sin cambio |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | — | — | El adaptador normaliza CRLF y no usa metadatos no documentados (`isMeta`) |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | — | — | El cambio se limita al adaptador de Claude, como exige su cabecera |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | — | — | `independent-review.mjs`, `review-ledger.mjs` y `core/` sin cambios |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | `claude-review.mjs:181-226` | — | `readReviewerRun` tiene más estado (`undelivered`), pero es complejidad esencial de una lista exacta con posición; está documentada |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | — | — | Un texto futuro del arnés falla cerrado y se corrige en un punto (`HANDBACK_REMINDERS`/`HANDBACK_ENFORCE`) |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | S-1 (sugerencia) | Sin cambio |
| Q4.2 | Instalación/bootstrap | 3 | MENOR | 2.25 | `README.md` sin diff desde 247b284 | N-11 | Heredado (INFERIDO por diff vacío) |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | — | — | — |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | — |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `verification.md`, `findings.md` | — | Los límites de `SubagentHandback` y del proxy de compresión están documentados |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-08..V-17 | — | 10 validadores, exit 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | Heredado. La estrategia del parche es buena: 16 tests N-34 por el CLI real, más los receipts reales |
| Q5.3 | Pruebas ejecutables y pasando | 4 | MENOR | 3.00 | V-18, V-19, V-30 | N-29, N-27; CI remota NO VERIFICADA | Todo test fallido pasó al repetirlo solo, pero el flake apareció en modo secuencial (empeora frente a 247b284) y la CI del SHA exacto no existe |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | V-25 (RED v3.4.1 → GREEN HEAD sobre receipts reales), V-19 | — | Hay regresión para el defecto, con RED/GREEN reproducido por el auditor sobre datos reales |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff | F-004 | Heredado |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | 10 commits atómicos, cada uno coherente con su diff. La base `4260fa8` tiene el mismo árbol que `origin/develop` (documentado) |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-29 | F-005, N-25 | En vivo: `required_approving_review_count 0` en `main`; `develop` sin ruleset ni protección (404, `rules/branches/develop` = `[]`). Sin pushes directos desde el 2026-10-26 |
| Q6.3 | CI | 3 | MENOR | 2.25 | `.github/`, `runtime/pilot` sin diff | N-26 | Heredado |
| Q6.4 | Versionado y releases | 3 | COMPLETO | 3.00 | V-06, V-22, V-24 | — | PATCH justificado, `CLI_VERSION` v3.4.2, `VERSION` 3.0.0-dev, v3.4.1 intacto, negativo del build PASS |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-22, V-23 | — | `sha256:ef52ac29…98bf5` ×2; delta contra v3.4.1 publicado: 3 archivos |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | Heredado. El cambio de comportamiento (`name`/`team_name`) está documentado |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-07, V-29 | F-007 | Secret scanning 0 (en vivo); F-007 no verificable por API |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-29 | N-32 | 7 alertas Dependabot de `template/`, scope `development`, 1 high (en vivo) |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-29, V-16 | F-008, CodeQL #27 | 0 rulesets de tag; CodeQL #27 abierta (`l3-consumer.yml`); acciones fijadas por SHA (PASS) |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-26 | — | Lista exacta, fail-closed; se rechazan `name`/`team_name`; la contraverificación con la sesión padre amplía el default seguro |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | Heredado |
| Q8.1 | Fuente única de verdad | 2 | COMPLETO | 2.00 | `SESSION-CONTEXT`, `execution/current`, `V3.4.2-PATCH`, JSON | — | Coinciden entre sí y con el estado vivo: refs, PR #160, tag, release |
| Q8.2 | Responsabilidades y límites | 2 | COMPLETO | 2.00 | — | — | Fuera de alcance explícito |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-29 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | El parche mejora el fail-safe (V-26); el descuento es solo por F-005 |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-05 | — | Defecto → `a446488` → revisión 1 (CR) → `14d6a87`/`3b9f2e6` → revisión 2 (CR) → `f877b2c` → revisión 3 (APPROVED) → `f4ec7d5`, `d6c5d4a` (deltas APPROVED, fuera del árbol) → este informe |

## G. LEDGER DE VERIFICACIÓN

Todas las filas son VERIFICACIÓN OFICIAL DEL PROYECTO, salvo las marcadas con (A) (VERIFICACIÓN COMPLEMENTARIA DEL AUDITOR) o con (R) (evidencia de la réplica previa, aceptada). Los logs del auditor están en el scratchpad de la sesión, carpeta `audit/`, fuera del árbol.

| ID | Verificación | Comando/Método | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` (inicio y fin) | `d6c5d4a6d4cd…` ambas veces | PASS | — |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio | PASS | — |
| V-03 | Ancestry y base (A) | `merge-base --is-ancestor`; `rev-parse X^{tree}` | `4260fa8` padre de `a446488`; `49868e4` no es ancestro, pero `49868e4^{tree}` = `4260fa8^{tree}` = `42f603fd…`; `635a60c` (v3.4.1, = origin/main) es ancestro | PASS | — |
| V-04 | Alcance | `git diff --stat origin/develop...HEAD` | 11 archivos (+909/−27): `claude-review.mjs`, `review-ledger.test.mjs`, `ai-native.mjs`, `findings.md`, 3 de `specs/sdd-independent-review/`, 4 de `governance/`. Nada ajeno a N-34 | PASS | — |
| V-05 | Código d6c5d4a = f877b2c | `git diff --stat f877b2c d6c5d4a`; `git rev-parse {HEAD,f877b2c}:runtime/adapters/claude-review.mjs` | solo `governance/**` (4 archivos); blob `38a911e8…` en ambos; `git diff --quiet f877b2c d6c5d4a -- runtime core contracts scripts .github parity evaluation specs knowledge template` → 0 | PASS | — |
| V-06 | v3.4.1 intacto | `git diff --name-only v3.4.1 HEAD`; `git cat-file -p v3.4.1`; `git ls-remote --tags origin` | 13 archivos: los 11 de la candidata más `V3.4.1-PATCH.md` y `V3.4.1-POST-RELEASE-VERIFICATION.md` (post-release ya en `develop` `4260fa8`). Tag `c3c96ee` → `635a60c` local y en origin. Release `immutable: true` | PASS | — |
| V-07 | Higiene del delta (A) | `git diff --check 4260fa8 HEAD`; grep de secretos, rutas y emails en las líneas añadidas | exit 0; 0 coincidencias | PASS | — |
| V-08 | Método de auditoría | `node runtime/audit/cli.mjs check` | `PASS`, exit 0 | PASS | `validators-d6c5d4a.log` |
| V-09 | Paridad | `node parity/validate-parity.mjs` | exit 0; unmapped=0; 95/95 par-tests | PASS | idem |
| V-10 | Contratos | `node contracts/validate-contracts.mjs` | exit 0; 20 schemas, 7 datos | PASS | idem |
| V-11 | Core | `node core/validate-core.mjs` | exit 0 | PASS | idem |
| V-12 | Integridad de status | `node runtime/status/validate-integrity.mjs` | exit 0 | PASS | idem |
| V-13 | Doc drift | `node runtime/docs/validate-doc-drift.mjs` | exit 0 | PASS | idem |
| V-14 | Entry points | `node runtime/adapters/validate-entrypoints.mjs` | exit 0 | PASS | idem |
| V-15 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | «all 99 committed *.test.mjs files are run by a workflow» | PASS | idem |
| V-16 | Acciones fijadas | `node scripts/validate-actions-pinned.mjs` | «all actions … pinned by full SHA» | PASS | idem |
| V-17 | Matriz de compatibilidad | `node evaluation/compat/validate-compat-matrix.mjs` | exit 0; 32 checks | PASS | idem |
| V-18 | Adapters | `node --test --test-concurrency=1 runtime/adapters/*.test.mjs` | 92 tests: 86 PASS, 6 FAIL. Los 6 en `consumer-launcher.test.mjs`, todos `git add -A: … unable to write file .git/objects/… Permission denied`. Repetido el archivo solo: 9/10 (1 flake, `F-19 default`). `F-19 default` solo, ×2: PASS. **6/6 PASS al repetirlos solos** | PASS (flake N-29) | `adapters-d6c5d4a.log`, `adapters-launcher-rerun.log`, `adapters-f19-rerun.log` |
| V-19 | Review ledger (incluye los 16 N-34) | `node --test --test-concurrency=1 runtime/circuit/review-ledger.test.mjs` | 59 tests: 56 PASS, 1 FAIL, 2 skips de SO (FIFO, POSIX), 11 min. FAIL = «N-34: anything but the exact harness instruction…» por `git add -A … Permission denied`. Repetido solo (`--test-name-pattern`): **1/1 PASS**. Los 16 N-34 pasan | PASS (flake N-29) | `review-ledger-d6c5d4a.log`, `review-ledger-rerun1.log` |
| V-20 | Release | `node --test --test-concurrency=1 runtime/release/*.test.mjs` | 30/30 | PASS | `release-d6c5d4a.log` |
| V-21 | CLI | `node --test --test-concurrency=1 runtime/cli/*.test.mjs` | 64/64 PASS, 0 FAIL, exit 0 (incluye la declaración `CLI_VERSION` y el ciclo de vida del CLI) | PASS | `cli-d6c5d4a.log` |
| V-22 | Build reproducible y negativo | `node runtime/release/build.mjs --version v3.4.2 --out <scratch>/build{1,2} --commit d6c5d4a…` ×2; `--version v3.4.1` | 230 archivos; `diff -r` idéntico; tarball `sha256:ef52ac292373df32a40626453d39a7840afc2c1ee797424ce6942eb425e98bf5` ×2; `platform.json` `bootstrap` = `{protocol 1, minCliVersion v3.2.0, requiredCapabilities [adopt]}`. Negativo: exit 1, «declares CLI_VERSION v3.4.2; this release is v3.4.1» | PASS | `build-d6c5d4a.log` |
| V-23 | Delta de consumidor (A) | `gh release download v3.4.1` + `diff -rq` del contenido | sha256 publicado `ab7617d2…95e7` = digest de `SESSION-CONTEXT.md`. 230 = 230 entradas; difieren solo `platform.json`, `runtime/adapters/claude-review.mjs`, `runtime/cli/ai-native.mjs` | PASS | — |
| V-24 | Declaración de versión (A) | `declaredCliVersion` / `assertCliDeclaresTag` de `runtime/release/cli-version.mjs` sobre `ai-native.mjs`; `cat VERSION` | `v3.4.2`; acepta `v3.4.2`, rechaza `v3.4.1`; `VERSION` = `3.0.0-dev` | PASS | — |
| V-25 | Receipts reales RED/GREEN (A) | script propio `verify-receipts.mjs` (`verifyClaudeReceipt` + `readReviewerRun` con las herramientas y el modelo proyectados) sobre los receipts almacenados: incidente `gi-common-reference` (`ff8fee1f…`), E2E aprobada (`479f8ff2…`), E2E adversa (`460080ca…`, 2 receipts); adaptador de HEAD y de `v3.4.1` (`git archive v3.4.1`) | HEAD: 4 receipts con **0 errores**; `observed` = `evidence` = `CHANGES_REQUESTED` / `APPROVED` / `CHANGES_REQUESTED` ×2; cada uno 1 respuesta y 0 follow-ups; transcripts `version 2.1.312`. v3.4.1: 5 / 5 / 2 / 2 errores; veredicto `null` en el incidente y en la aprobada | PASS | `receipts-d6c5d4a.txt` |
| V-26 | Sonda adversarial (A) | `probe.mjs`: 23 transcripts sintéticos sobre `readReviewerRun` + agregación de veredicto (misma regla que `runVerdict`) | Ningún caso con veredicto adverso es aprobable: CR→E→handback APPROVED, APPROVED→E→CR, CR sin E, texto CR en el mismo mensaje, CR sin nonce, otra revisión, dos handbacks. Los textos alterados, repetidos o fuera de posición cuentan como follow-up. Un handback con `message` en array o vacío no aprueba. Aprobables solo: R1, R2, R2 con CRLF, «APPROVED en texto + E sin handback» (decisión documentada) y «texto CR junto a un `Read`, luego handback APPROVED» (semántica previa, igual en v3.4.1; S-21) | PASS | `probe-d6c5d4a.txt`, `probe-v341.txt` |
| V-27 | Transcripts reales (A) | `survey.mjs`: `readReviewerRun` de HEAD sobre todo transcript local de subagente con un `tool_use` `SubagentHandback` | 17 corridas. **Reviewer: 10/10 con 1 respuesta y 0 follow-ups** (2.1.311 ×2, que son las E2E de v3.4.0 y v3.4.1; 2.1.312 ×8). Otras: builders continuados por `SendMessage` (follow-ups legítimos) y un general-purpose de 2.1.305 con 2 respuestas | PASS | `survey-d6c5d4a.txt` |
| V-28 | Texto vivo del arnés (A) | transcript del propio auditor (Claude Code 2.1.312) | Primer turno tras el prompt: `isMeta` user con R1, la forma larga con la frase de `SendMessage`. `readReviewerRun` lo reconoce: 0 follow-ups | PASS | (S-19) |
| V-29 | Plano de control | `gh api` (rulesets, `branches/*/protection`, `rules/branches/develop`, activity, alertas), `gh pr view 160`, `gh release` | Ruleset `ai-native-main` (24405506) activo, sin bypass: deletion, non_fast_forward, pull_request (`required_approving_review_count 0`), 6 required checks (strict). Protección clásica 404 en `main` y `develop`; `develop` sin reglas. Activity de `develop` desde el 2026-10-26: solo `pr_merge`. PR #160 MERGED 2026-10-28T12:50:56Z como `49868e4`. Latest release v3.4.1 (`immutable: true`). CodeQL abiertas: 1 (#27). Dependabot: 7 (1 high, `development`). Secret scanning: 0. Rulesets de tag: 0 | PASS (con F-005, N-25, F-008, N-32) | — |
| V-30 | CI remota | `gh api …/commits/d6c5d4a…/check-runs`; `gh pr view 160 --json statusCheckRollup` | Candidata: **422 «No commit found» → NO VERIFICADO**. Base `4260fa8` (head de #160): `validators (ubuntu-latest)` y `(windows-latest)`, CodeQL ×2, dependency-review, sbom, pin-check, trivy-fs, pr-gate, security-scan: SUCCESS | NO VERIFICADO | — |
| V-31 | Réplica de CI (R) | `review3/ci-replay-f877b2c/summary.txt`, `rerun-flakes.log` | 50 pasos; 1016 PASS / 6 FAIL. Los 6 son `Permission denied` (lib-git 1, circuit-other 1, adapters 1, cli 2, audit 1); 6/6 PASS solos. Los validadores y el resto de suites, exit 0 | ACEPTADA (código idéntico, V-05) | réplica |
| V-32 | release-gate antes de este informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate d6c5d4a… --root . --reports <copia sin este informe>` | Sobre una copia de `.audit/reports` sin este informe: **FAIL (29 errors)**, exit 1. Son «no current valid PLATFORM audit report for d6c5d4a…» y los 28 informes históricos STALE, incluido `247b284`. Es lo esperado antes de este informe | ESPERADO | `release-gate-before.txt` |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-34 | ROTO | MINOR → **CERRADO** | La revisión atestada no podía aprobar con `SubagentHandback` | V-25, V-26, V-27, V-19 | Q1.2 | +0.75 recuperado |
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas | `review-ledger.mjs:57,107` (sin diff) | Q1.3 | −0.75 |
| F-002 | SOBRA | MINOR | Residuos de cierre en `governance/cleanup/` | `ls governance/cleanup` | Q2.2 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | `README.md` sin diff | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | áreas sin diff | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git `Permission denied` al crear repos temporales en Windows, **ahora también en serie**; N-27 heredado | V-18, V-19 | Q5.3 | −1.00 (junto con la CI remota NO VERIFICADA) |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | `.github/` sin diff | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-29 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-29 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | CI (heredado; incluye el pilot Ubuntu diferido) | sin diff | Q6.3 | −0.75 |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | sin diff | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-29 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 7 alertas Dependabot (1 high) en `template/` | V-29 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-29 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | sin diff | Q7.5 | −0.75 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR.** Son N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009 y F-010. **Cerrado:** N-34. **Nuevos puntuables:** ninguno.

**N-34 (CERRADO).**

* **Descripción.** El adaptador de `v3.4.1` cuenta el recordatorio de `SubagentHandback` como follow-up y trata la herramienta como ajena al conjunto de solo lectura. Además ignora el `message` entregado.
* **Corrección.** `claude-review.mjs:44,150-156,181-226,288-306` aplica una lista exacta de textos R1, R2 y E con su posición, lee `input.message` como respuesta, deduplica el caso «texto plano + E + handback que lo repite» y añade la contraverificación con la sesión padre y el rechazo de `name`/`team_name`.
* **Verificación de cierre ejecutada:**
  * los receipts reales pasan de 5/5/2/2 errores a 0 (V-25);
  * los 16 tests N-34 pasan (V-19);
  * los 10 Reviewer reales de 2.1.311 y 2.1.312 dan 1 respuesta y 0 follow-ups (V-27);
  * la sonda no encuentra ningún camino de adverso a APPROVED (V-26).
* **Riesgo residual.** No hay receipt de 2.1.311; un texto futuro del arnés dará `NOT_PROVEN`, que es fail-closed y está documentado.

**N-29 (MINOR, re-verificado; empeora).**

* **Descripción.** En `247b284` el flake solo aparecía en corridas paralelas. En esta auditoría apareció con `--test-concurrency=1`:
  * 6/92 en adapters (todos en `consumer-launcher.test.mjs`);
  * 1/59 en review-ledger;
  * 1/10 al repetir `consumer-launcher.test.mjs` solo.
* **Impacto.** En este host no se obtiene una corrida local limpia de la suite completa. Todos los tests afectados pasan solos y la CI de la base pasa en Windows y Linux, así que **no lo cuento como defecto del producto ni activa G3**. No afirmo ninguna causa.
* **Corrección mínima.** Una corrida limpia de la CI remota sobre el SHA del PR, y la caracterización del flake en el harness de tests (reintento acotado de `git add` en el fixture o directorio temporal propio), registrada con evidencia.
* **Verificación.** CI verde en `validators (windows-latest)` y `(ubuntu-latest)` para el head del PR.
* **Puntos recuperables.** Ver §N.

**Resto de hallazgos (heredados).** Su descripción, corrección y verificación están en `AUDIT-PLATFORM-247b284.md` §I/§J y siguen vigentes. Los re-verifiqué en vivo (F-005, N-25, N-32, F-008, CodeQL #27, F-007) o por diff vacío `247b284..d6c5d4a` sobre `README.md`, `scripts/`, `.github/`, `runtime/pilot`, `runtime/bootstrap`, `evaluation/fixtures`, `core/`, `runtime/circuit/review-ledger.mjs`, `independent-review.mjs` y `knowledge/sdd/methodology/review.md` (`git diff --quiet` → 0). F-002 lo re-verifiqué en el árbol.

### H.1 Sugerencias (no restan puntos)

* S-1: `README.md:65` sigue mostrando `CLI: v3.3.0 | PLATFORM: v3.2.0`.
* S-2: la promoción `develop` → `main` debe hacerse con merge commit, o este informe queda STALE.
* S-3..S-6, S-9, S-10, S-12..S-18: heredadas, sin cambio. S-14..S-17 están diferidas por decisión registrada. S-18 queda resuelta en la redacción de v3.4.2: «su árbol (`42f603fd…`) es el de `4260fa8`», verificado en V-03.
* **S-19 (nueva).** `V3.4.2-PATCH.md` §Defecto y la evidencia JSON (`harnessShapes`/`rules`) atribuyen R1 a «2.1.305 y 2.1.311» y R2 a «2.1.311 y 2.1.312». En el transcript del propio auditor, Claude Code 2.1.312 inyecta **R1** (V-28). El código acepta ambas formas en cualquier versión, así que no tiene efecto funcional. Las etiquetas de los tests (`review-ledger.test.mjs:1305-1306`) heredan esa atribución. Conviene redactarlo como «observado en», no como lista cerrada de versiones.
* **S-20 (nueva).** `V3.4.2-PATCH.md` §Validación, `SESSION-CONTEXT.md` y `execution/current/README.md` (DOCS COMMIT/PENDING) siguen diciendo que la revisión delta está pendiente. Las revisiones delta de `f4ec7d5` y `d6c5d4a` (APPROVED) constan solo fuera del árbol. Es una autorreferencia inevitable sin cambiar el SHA auditado (como S-13); conviene registrarlas en el PR o en el post-release.
* **S-21 (nueva, preexistente).** Un mensaje del asistente con texto `VERDICT: CHANGES_REQUESTED` **y** una llamada a otra herramienta (p. ej. `Read`) no cuenta como respuesta, de modo que un handback `APPROVED` posterior aprueba (V-26). La semántica es la de `v3.4.1` («una respuesta final es un mensaje sin tool_use») y la decisión es del propio Reviewer, sin mensajes de la sesión. Aun así, el nuevo código ya trata como segunda respuesta el texto con otro veredicto que acompaña a un handback; extenderlo a cualquier mensaje con un `VERDICT:` en la primera línea sería más uniforme.
* **S-22 (nueva).** El comentario de cabecera dice «Since Claude Code 2.1.271» y el de `HANDBACK_REMINDERS` dice «2.1.305 to 2.1.312». Lo primero viene de la documentación previa (`findings.md`) y lo segundo de lo observado. Conviene indicarlo para que no se lea como contradicción.
* S-23: las sugerencias diferidas de la segunda revisión independiente: lista permitida de claves de la delegación, inspección del `tool_result` del handback y `message` en bloques de contenido. Ya están registradas.

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos relacionados | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones (0) | F-005 | Q6.2 y Q8.3, con descuento proporcional (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Flake de git del host al crear repos temporales; causa no demostrada | N-29 | Q5.3; también aparece en V-18, V-19 y V-31 (un solo descuento) |

## J. QUÉ SOBRA

* REVISAR: `governance/cleanup/*` (F-002, heredado).
* SIMPLIFICAR (opcional): el estado `undelivered` de `readReviewerRun` está justificado. Solo el comentario de `claude-review.mjs:176` omite que entre E y el handback se toleran llamadas del propio Reviewer (INFO de la revisión delta de `f4ec7d5`).

No encontré código muerto, scripts sin uso ni artefactos generados en el delta.

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 17 MINOR abiertos de §H, con las correcciones de `AUDIT-PLATFORM-247b284.md` §I/§J. Además:

* la CI remota verde del SHA del PR (Q5.3);
* una corrida local o remota limpia que cierre N-29 (Q5.3).

### MEJORAS OPCIONALES

S-1..S-23. No restan puntos, no activan Quality Gates, no bloquean 100/100 y no forman parte del camino obligatorio a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| CI remota de d6c5d4a | La rama no está en origin (422) | Parte de los −1.00 de Q5.3 | Abrir el PR y ver `validators` ×2, pin-check, pr-gate, trust-gate y merge-gate verdes |
| E2E con el adaptador final | La E2E del Builder usó el bundle de la primera corrección (`2babe5a`) | Ninguno: Q1.2 y Q5.4 descansan en los receipts reales re-verificados con el adaptador final (V-25) | `claude -p "/sdd-validate 001-demo"` con un bundle de d6c5d4a |
| Claude Code 2.1.311 a nivel de receipt | No disponible en el host | Ninguno (C-13 es RECOMENDADO; V-27 cubre el parseo) | Receipt real con 2.1.311 |
| Suite completa en una sola invocación | Límite de memoria del host y flake N-29 | Dentro de Q5.3 | CI remota |
| Docker / pilot offline Ubuntu (exit 125) | Diferido; sin stderr | N-26 (heredado) | Corrida del pilot con stderr |
| FIFO y permisos POSIX | Windows (2 skips) | Ninguno (cubierto por la CI Linux de la base) | CI ubuntu |
| Codex / OpenCode | CLI no disponibles o rotas | Ninguno (`unverified` declarado) | — |
| F-007 | No verificable por API | Q7.1 | Revisión manual de la configuración de secretos |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

En G3, las 8 fallas observadas (V-18, V-19) son todas `git … Permission denied` en repos temporales del harness, y todas pasan al repetirlas solas. La CI de la base pasa en Windows y Linux. Es una limitación del entorno (§19 AUDIT_RULES), registrada como N-29 y NO VERIFICADO, no un fallo de una capacidad esencial. Los 10 validadores y el build están en exit 0.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 90.25

N-31 (Q1.3)                          → +0.75
F-002 (Q2.2)                         → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 + CI remota (Q5.3)        → +1.00
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

Score bruto esperado: 100
```

No hay gate activo que eliminar.

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. MINOR, por orden de valor:

1. **Q5.3 (+1.00), N-29/N-27 y CI remota.**
   * Archivos: ninguno para la CI; para el flake, el fixture de repos temporales de los tests.
   * Cambio: abrir el PR de la candidata contra `develop` (`49868e4`) y obtener CI verde. Caracterizar el flake con evidencia y endurecer el fixture.
   * Riesgo: bajo.
   * Verificación: checks requeridos verdes en el head del PR.
2. **Q6.2 / Q8.3 (+0.75 / +0.50), F-005 y N-25.**
   * Archivos: rulesets de GitHub.
   * Cambio: `required_approving_review_count ≥ 1`, o un control equivalente verificable, y un ruleset para `develop`.
   * Riesgo: medio (flujo de un solo mantenedor).
   * Verificación: `gh api …/rulesets`.
3. **Q1.3 (+0.75), N-31.**
   * Archivo: `runtime/circuit/review-ledger.mjs`.
   * Cambio: resolver el aislamiento por slug.
   * Verificación: el test asociado.
4. **Resto:** según `AUDIT-PLATFORM-247b284.md` §J. Son F-002, N-11, N-24/F-003, F-004, N-26, F-006, F-007, N-32, F-008/#27 y F-009/F-010, cada uno con los puntos indicados en §N.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA (equivalente PLATFORM del «TEMPLATE PROFESIONAL DE REFERENCIA»)?

```text
NO
```

El 100/100 está prohibido: hay 17 MINOR puntuables, la confianza es MEDIA y quedan verificaciones críticas sin hacer (CI remota). Para el uso que pide el perfil, **gate de release con umbral 90**, la candidata v3.4.2 **alcanza el umbral**:

* score 90.25, sin BLOCKER, CRITICAL ni MAJOR;
* el defecto N-34 está corregido y su regresión reproducida sobre datos reales.

La promoción debe esperar a la CI remota verde del PR (NO VERIFICADO en esta auditoría).

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

**Divergencia con 247b284 (89.50): +0.75.** Viene solo de Q1.2, por el cierre de N-34. Los otros 29 subcriterios no cambian. N-29 empeora en su manifestación, pero Q5.3 ya estaba en MENOR por las mismas causas.

```text
AUDITED_SHA: d6c5d4a6d4cd909b2ae7eaa938214e708cddab9d
SCORE: 90.25/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 89.50 (247b284)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 17 (cerrado: N-34; nuevos puntuables: 0)
N-34: CERRADO (receipts reales 2.1.312: 0 errores, veredictos conservados; RED v3.4.1: 5/5/2/2)
SEMVER: PATCH (v3.4.2); CLI_VERSION v3.4.2; VERSION 3.0.0-dev; v3.4.1 intacto
BUILD: reproducible (sha256:ef52ac29…98bf5 ×2); delta vs v3.4.1 publicado: platform.json + claude-review.mjs + ai-native.mjs
CI REMOTA DEL SHA EXACTO: NO VERIFICADO; base 4260fa8 (PR #160): CI Linux + Windows success
UMBRAL PLATFORM 90: ALCANZADO (+0.25)
VERDICT: APTO (estado global §32)
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
