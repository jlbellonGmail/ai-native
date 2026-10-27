---
targetRepo: jlbellonGmail/ai-native
targetCommit: 9f0f9a4f760c9f2891036daf5df9c1389184e53f
platform:
  version: "v3.4.0 candidate"
  commit: 9f0f9a4f760c9f2891036daf5df9c1389184e53f
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-10-27T02:40:02Z"
scope: "Independent read-only PLATFORM 1.2 audit of the exact frozen v3.4.0 MINOR candidate 9f0f9a4 (v3.3.1..9f0f9a4; delta 9678acb..9f0f9a4 = AUDIT-PLATFORM-9678acb report f824ce3, merge aebb832 of #149, Trivy remediation 7d5d0f7, governance 16d08f8 and the N-33 reconciliation 9f0f9a4) and of the live GitHub control plane. Supersedes AUDIT-PLATFORM-81b8d20.md and AUDIT-PLATFORM-9678acb.md for release purposes (both stay as history, STALE for this candidate). Auditor did not take part in the implementation. No fix, push, PR, merge, tag or release."
score: 90.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v3.4.0, 9f0f9a4)

## A. Identificación y veredicto

```text
Repositorio:   jlbellonGmail/ai-native (worktree C:\Proyectos\ai-native-trivy-fix)
Rama:          release/v3.4.0 (local; origin/release/v3.4.0 = 16d08f8, 9f0f9a4 no está en origin)
Commit:        9f0f9a4f760c9f2891036daf5df9c1389184e53f (= AUDITED_SHA congelado)
Auditorías previas de v3.4.0: 81b8d20 (89.75, STALE), 9678acb (90.25, STALE), 16d08f8 (89.75, sin informe; N-33)
Base:          develop aebb832fe5ba7b1e24b2d9f38ef5d3574a240166 (= origin/develop, merge de #149)
Tag:           ninguno (v3.4.0 no existe ni local ni en origin)
Fecha:         2026-10-27
Estándar:      QUALITY_SCORE 1.1 + AUDIT_RULES 1.1 + perfil PLATFORM 1.2 (auditMethod 1.2)
Auditor:       Claude Code (claude-opus-5-5), independiente del Builder de 7d5d0f7/16d08f8/9f0f9a4
Entorno:       Windows 11, Git Bash, node v26.12.1, pwsh 7.6.4, pnpm 10.34.9 (vía npx), gh autenticado (solo lectura)
Worktree:      limpio al empezar y al terminar la verificación (git status --short vacío)
```

**Veredicto: APTO. Score 90.25/100, en el umbral PLATFORM de 90 o por encima, sin usar la tolerancia.** 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR. Sin N/A y sin Quality Gate. Confianza MEDIA (§E). N-33 queda **CERRADO** (§C). N-30 sigue **CERRADO** (código idéntico a 9678acb). N-32 cambia de contenido: los HIGH/CRITICAL de Trivy en dependencias de producción quedan remediados, y siguen abiertas 7 alertas Dependabot de `template/` en scope `development`. El margen es de 0.25: cualquier MINOR nuevo puntuable dejaría la candidata por debajo de 90.

**Independencia.** Reevalué los 30 subcriterios Q1–Q8. No arrastré el score anterior. Un hallazgo heredado solo cuenta si lo re-verifiqué en vivo o si el diff `9678acb..9f0f9a4` sobre su área sale vacío. No acepté los resultados del Builder (Trivy local 0, `--frozen-lockfile` PASS) sin re-verificarlos (§D).

## B. Git, ancestry y diff real

| Comprobación | Resultado |
|---|---|
| `HEAD` = AUDITED_SHA, rama `release/v3.4.0`, worktree limpio | PASS |
| Ancestros de HEAD: `v3.3.1`, `origin/main` (`fefd4b3`), `origin/develop` (`aebb832`), `9678acb`, `16d08f8` | PASS ×5 |
| `9678acb..HEAD` | `f824ce3` informe de 9678acb · `aebb832` merge de #149 · `7d5d0f7` fix(security) · `16d08f8` docs(governance) · `9f0f9a4` docs(v3.4.0) |
| `git diff --name-only 9678acb HEAD` sin `.audit/`, `governance/` ni `{foundation,template}/{package.json,pnpm-lock.yaml}` | **vacío** |
| `git diff --name-only 16d08f8 HEAD` | 3 archivos: `governance/SESSION-CONTEXT.md`, `governance/execution/current/README.md`, `governance/versioning/V3.4.0-RELEASE.md` |
| Blobs de `claude-review.mjs`, `review-ledger.mjs`, `review-ledger.test.mjs`, `independent-review.mjs`, `hitl.mjs`, `core/agents.json`, `runtime/cli/ai-native.mjs` | idénticos en 9678acb y HEAD |
| `git diff --stat v3.3.1 HEAD` | 56 archivos, +4607/−220 |
| `git diff --check 9678acb HEAD` | sin salida, exit 0 |
| Escaneo de líneas añadidas `9678acb..HEAD` (fuera de `.audit/`): secretos, rutas de workstation, emails | 0 coincidencias |
| `VERSION` / `CLI_VERSION` | `3.0.0-dev` / `v3.4.0` (sin cambios) |

## C. N-33: verificación del cierre

N-33 (auditoría de 16d08f8): la gobernanza describía la candidata como local, sin push y sin PR. `9f0f9a4` solo toca los 3 archivos de gobernanza. Contrasté cada afirmación con el estado vivo (`git ls-remote`, `gh pr view`, `gh release view`, `gh api …/activity`):

| Afirmación (V3.4.0-RELEASE.md, execution/current/README.md, SESSION-CONTEXT.md) | Estado real verificado | Resultado |
|---|---|---|
| `release/v3.4.0` publicada en origin | `refs/heads/release/v3.4.0` = `16d08f8` | COHERENTE |
| #149 `release/v3.4.0` → `develop` MERGED por el humano; `develop` = `aebb832` (merge commit); incluye `9678acb` y `f824ce3` | `MERGED` 2026-10-26T20:20:06Z, `mergeCommit` `aebb832`, `headRefOid` `f824ce3`, `mergedBy` `jlbellonGmail` (`is_bot: false`); `refs/heads/develop` = `aebb832` | COHERENTE (la autoría humana del merge es norma D6, no imposición técnica; `HITL-MERGE-POLICY.md`) |
| Remediación Trivy `7d5d0f7`, posterior a #149; governance `16d08f8` | `aebb832` es ancestro de `7d5d0f7`; ninguno de los dos está en `develop` | COHERENTE |
| #151 `release/v3.4.0` → `develop` OPEN, NO mergeada | `OPEN`, `mergedAt null`, head `16d08f8` | COHERENTE (ver S-11) |
| #150 `develop` → `main` OPEN, NO mergeada | `OPEN`, `mergedAt null`, head `aebb832` | COHERENTE |
| `main` = `fefd4b3`, sin v3.4.0 | `refs/heads/main` = `fefd4b3`; `81b8d20`, `ef103e9`, `9678acb` no son ancestros de `origin/main`; `CLI_VERSION` en `main` = `v3.3.1` | COHERENTE |
| `AUDIT-PLATFORM-9678acb.md` existe y está STALE | `release-gate` lo rechaza: «STALE (candidate differs … outside .audit/**)» | COHERENTE |
| Auditoría PLATFORM del candidato actual PENDIENTE; `release-gate` no ha pasado | `release-gate` previo a este informe: FAIL (§D.5) | COHERENTE |
| Tag `v3.4.0` NO EXISTE; GitHub Release `v3.4.0` NO PUBLICADA | `ls-remote` sin `refs/tags/v3.4.0`; `git tag -l 'v3.4*'` vacío; `gh release view v3.4.0` → `release not found`; Latest = v3.3.1 | COHERENTE |
| La remediación arregla el `trivy-fs` fallido en #150 | Trivy en `aebb832` (#150): runs 40394996873 y 40401738108 `failure` | COHERENTE |
| N-31 registrada como deuda conocida no bloqueante | fila nueva en la tabla «Deuda conocida no bloqueante» de `V3.4.0-RELEASE.md` | COHERENTE (§G.1) |
| `v3.3.1` sigue siendo la release vigente (`STATUS: V3.3.1_RELEASED_AND_VERIFIED`) | Latest = v3.3.1 | COHERENTE |

Ningún documento afirma como completado algo pendiente. `validate-doc-drift` e `integrity` PASS sobre 9f0f9a4.

**Conclusión N-33: CERRADO.** Dos matices no puntuables:

* **S-10 (omisión, no contradicción).** El registro de actividad de `develop` muestra un `push` directo `aebb832 → 16d08f8` a las 21:02:41Z (el mismo push movió `release/v3.4.0` `f824ce3 → 16d08f8`) y un `force_push` `16d08f8 → aebb832` a las 21:07:53Z, ambos con la cuenta `jlbellonGmail`. La PR #151 se abrió a las 21:08:18Z. Durante ~5 minutos `develop` contuvo los dos commits sin auditar y sin PR. La gobernanza no registra el episodio. No contradice nada de lo que afirma (`develop` = `aebb832` es cierto). Es la materialización en vivo de N-25 (§G).
* **S-11 (autorreferencia).** «#151 … lleva 7d5d0f7, 16d08f8 y la reconciliación posterior» solo es cierto cuando `9f0f9a4` llegue a la PR. Es el mismo límite que el registro declara para su propio SHA («un archivo no puede contener el SHA del commit que lo crea») y es el siguiente paso planificado. No lo cuento como afirmación falsa.

## D. Verificación ejecutable

### D.1 Réplica local de `ci.yml` (job `validators`)

El runner del auditor (`ci-replica.mjs`) extrae los 51 pasos `run:` de `ci.yml` y los ejecuta literales y en orden (bash, o pwsh donde el paso lo declara). Única diferencia con CI: `hitl.mjs --base origin/develop` sin el `git fetch` previo.

```text
Primera pasada: 48/51 pasos exit 0.
  Fallaron: paso 30 runtime/adapters (83/84), paso 43 runtime/migrate (120/122), paso 44 runtime/consumer (35/36).
  Los 4 tests fallidos tienen la misma primera causa: `git add -A` → `unable to write file .git/objects/…: Permission denied` (N-29).
Re-ejecución literal de los 3 pasos: adapters 84/84, migrate 122/122, consumer 36/36; exit 0.
→ 51/51 pasos con resultado PASS en este host. circuit 254/254 (+2 skip FIFO/permisos POSIX), cli 64/64,
  migrate-v2 y pilot con red PASS; constitution, doc-drift, integrity, entrypoints, audit check, evals L1: PASS.
  hitl --base origin/develop: «risk low, human_gate final-only» (el delta frente a develop es lockfiles + governance).
  hitl --base v3.3.1: «specs/sdd-independent-review/spec.md: risk high, human_gate required».
```

### D.2 Suite del gate de `release.yml`

Los 6 validadores (`parity`, `contracts`, `core`, `integrity`, `doc-drift`, `actions-pinned`) dan exit 0. `AI_NATIVE_REQUIRE_NETWORK=1 node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs` da 1073 tests, 1066 pass, **5 fail**, 2 skipped, exit 1. Los 5 fallos son de `consumer-launcher` (4) y `migrate-v2` (1). Cuatro tienen como primera causa `git add -A` → `Permission denied` en `.git/objects`. El quinto (`real starter v2.0.4: a user edit … survives revert`) falla en `git read-tree` → `fatal: unable to write new index file`, que es la misma familia de fallo de escritura en el git dir temporal. **Ninguno es una aserción de producto, y los 5 tests pasan en otra corrida** (D.1 primera pasada y re-ejecución).

Observación del entorno (INFERIDO como factor contribuyente de N-29): `C:\Users\ASUS` es en sí un repositorio git (`git -C %TEMP% rev-parse --show-toplevel` → `C:/Users/ASUS`), así que los repos temporales del harness viven dentro de otro repo. Eso explica los avisos `could not open directory 'Cookies/'…` del log.

**G3 no se aplica**, por la misma regla que en 81b8d20 y 9678acb: la suite principal (`ci.yml`) pasa completa en este host con la re-ejecución de 3 pasos, y la CI remota del padre `16d08f8` pasó en Linux y Windows (§D.4). La causa es del host y no del candidato (§19 AUDIT_RULES). No hay evidencia nueva de regresión funcional. **N-29 se mantiene**: 4 fallos en la primera pasada de `ci.yml` y 5 en la suite de release (antes 6 y 11).

### D.3 Build y reproducibilidad

| Comprobación | Resultado |
|---|---|
| `build.mjs --version v3.4.0 --commit 9f0f9a4…` ×2 | exit 0 ambas; `diff -r` idéntico; tarball `sha256:d6f6ceeca2d43baae3ab40f4c4e6787abbe254baf7fdbcedcb44fe3fb3165668` en los dos; 230 entradas |
| Contenido del bundle | 0 rutas `template/`, `foundation/`, `governance/` o `.audit/`: el delta de dependencias y de gobernanza no entra en el artefacto. `platform.json` lleva el commit `9f0f9a4` |
| Negativo: `--version v3.3.1` | exit 1 «declares CLI_VERSION v3.4.0; this release is v3.3.1» (fail-closed) |

### D.4 Configuración y evidencia remota (gh, solo lectura)

**CI del SHA exacto: NO VERIFICADO.** `9f0f9a4` no está en origin (`git branch -r --contains` vacío; `release/v3.4.0` en origin = `16d08f8`).

**Evidencia remota sobre `16d08f8` (padre de 9f0f9a4; el diff es de 3 archivos `.md` de gobernanza).** Los check runs son por SHA, así que `gh pr checks 151` muestra runs de dos PR distintas. Atribución exacta:

| Check | Run | Disparado por | Conclusión |
|---|---|---|---|
| CodeQL (check), `analyze (actions)`, `analyze (javascript-typescript)` | 40401793402 | #151 (`pull_request`, base `develop`) | success |
| `dependency-review` | 40401793409 | #151 | success |
| `pin-check` (Supply chain) | 40401793447 | #151 | success |
| `pr-gate` | 40401793413 | #151 | success |
| `sbom` | 40401793387 | #151 | success |
| `security-scan` | 40401793333 | #151 | success |
| `trivy-fs` | 40401793352 | #151 | success: `foundation/pnpm-lock.yaml` 0 y `template/pnpm-lock.yaml` 0 vulnerabilidades HIGH/CRITICAL |
| `validators (ubuntu-latest)`, `validators (windows-latest)` (CI) | 40401793408 | #151 | success ×2 |
| `build (gates, reproducible bundle, SBOM)` (Release) | 40400980370 | **#150** (`develop` apuntó a `16d08f8` entre 21:02:41Z y 21:07:53Z) | success |
| `publish (provenance, release)`, `verify (public assets, …)` | 40400980370 | #150 | **skipped** |
| `trust-gate` y status `ai-native/trust-gate` | 40400976106 | **#150** (`pull_request_target`) | success |
| `merge-gate-job`, `human-review`, `merge-gate-finalize` | 40400976088 | **#150** | **cancelled** los tres a las 21:08:40Z (concurrency `merge-gate-150`, `cancel-in-progress`, tras el force-push de `develop`). `human-review` quedó **cancelled**, no skipped. `gh pr checks` los muestra como `fail` |
| CI de #150 sobre `16d08f8` | 40400980346 | #150 | cancelled (`validators (windows-latest)` cancelled; ubuntu success) |

Ninguno de los checks `merge-gate-*`, `human-review`, `publish` o `verify` pasó. El estado combinado de `16d08f8` es `pending`. `merge-gate.yml` solo se dispara con base `main`: #151 (base `develop`) no lo ejecuta.

| Elemento | Estado verificado |
|---|---|
| Ruleset `ai-native-main` | activo (sin cambios en `.github/` desde v3.3.1) |
| `develop` | sin ruleset. Push directo y force-push ejercidos el 2026-10-26 (S-10, N-25) |
| Alertas | CodeQL abiertas: 1 (#27 `actions/untrusted-checkout/medium`, `l3-consumer.yml`). Dependabot abiertas: 7 (#145–#151, todas `template/pnpm-lock.yaml`, scope `development`). Secret scanning: 0 |
| Docker / Linux local | daemon de Docker no disponible: `pilot offline` y tests POSIX NO VERIFICADOS aquí |

### D.5 release-gate y audit check

Antes de este informe: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 9f0f9a4… --root .` → **FAIL** (27 errores), exit 1: «no current valid PLATFORM audit report for 9f0f9a4…», más 26 informes STALE (incluye `81b8d20` y `9678acb`). Es lo esperado. `audit check` → PASS.

## E. SemVer, delta de consumidor y confianza

**SemVer: MINOR (v3.4.0), sin cambios respecto a 9678acb.** El delta funcional desde 9678acb se limita a dependencias de `foundation/` y `template/`, que no entran en el bundle (D.3). No cambia ningún contrato, schema, `bootstrap`, `protocol`, `minCliVersion`, `CLI_VERSION` ni archivo del runtime. Los bumps son menores dentro de su rango (`next` 16.3.8 → 16.4.3 en `foundation/`; `next` 15.5.27 → 15.5.28 y `body-parser` 2.3.0 → 2.4.0 en `template/`).

**Delta de consumidor frente a 9678acb:** ninguno (bundle sin `template/` ni `foundation/`).

**Confianza: MEDIA.** No se verificó: la CI remota del SHA exacto (no está en origin; el padre `16d08f8` tiene CI verde en los dos sistemas), un E2E con Claude Code real ejecutando el Reviewer, FIFO y permisos POSIX (Windows), el `pilot offline` en Docker, un escaneo Trivy local (binario no disponible; uso la corrida remota del árbol de lockfiles idéntico), un `next build` de `foundation/` o `template/` (la CI de la plataforma no instala paquetes, por diseño), ni una corrida limpia de la suite de release en este host (N-29).

## F. Puntuación (reevaluada criterio por criterio)

| Criterio | Puntos | Nivel | Causa |
|---|---:|---|---|
| Q1.1 | 3/3 | COMPLETO | `V3.4.0-RELEASE.md`, spec, `review.md` |
| Q1.2 | 3/3 | COMPLETO | capacidades declaradas presentes; código del review idéntico a 9678acb |
| Q1.3 | 2.25/3 | MENOR | N-31 (sigue contradiciendo `review.md:51` y `:73`; registrarla como deuda no cambia el texto normativo). N-33 cerrado: la gobernanza coincide con refs, PR, tags y releases (§C) |
| Q1.4 | 3/3 | COMPLETO | — |
| Q2.1 | 3/3 | COMPLETO | build reproducible; lockfiles `--frozen-lockfile` coherentes |
| Q2.2 | 2.25/3 | MENOR | F-002 (re-verificado: rutas de workstation en archivos versionados, p. ej. `governance/cleanup/M7-INVENTORY.md` y `evaluation/m52/`; el delta no añade ninguna) |
| Q2.3, Q2.4 | 6/6 | COMPLETO | — |
| Q3.1–Q3.4 | 12/12 | COMPLETO | sin cambios de arquitectura en el delta |
| Q4.1 | 3/3 | COMPLETO | S-1 |
| Q4.2 | 2.25/3 | MENOR | N-11 (`README.md` sin cambios) |
| Q4.3–Q4.5 | 6/6 | COMPLETO | — |
| Q5.1 | 3/3 | COMPLETO | — |
| Q5.2 | 2.25/3 | MENOR | N-24, F-003 (heredados) |
| Q5.3 | 3/4 | MENOR | N-29 (misma causa, menos frecuente en esta corrida), N-27; CI remota del SHA exacto NO VERIFICADA |
| Q5.4 | 3/3 | COMPLETO | test N-30 y suite circuit 254/254 sobre código idéntico |
| Q5.5 | 2.25/3 | MENOR | F-004 (heredado) |
| Q6.1 | 3/3 | COMPLETO | commits atómicos (fix de dependencias, su registro, la reconciliación); informes anteriores preservados. La desviación en `develop` se imputa a su causa raíz en Q6.2 (§36 AUDIT_RULES) |
| Q6.2 | 2.25/3 | MENOR | F-005; N-25 **materializado en vivo** (push directo y force-push a `develop`, S-10). El control efectivo sobre `main` (ruleset, checks requeridos, merge-gate por SHA exacto, merge humano) no cambió |
| Q6.3 | 2.25/3 | MENOR | N-26 (heredado; `.github/` y `runtime/pilot` sin cambios) |
| Q6.4 | 3/3 | COMPLETO | MINOR justificado; `CLI_VERSION` = tag; el build rechaza otra versión |
| Q6.5 | 2/2 | COMPLETO | D.3 |
| Q6.6 | 1.5/2 | MENOR | F-006 (heredado) |
| Q7.1 | 2.25/3 | MENOR | F-007 (NO VERIFICABLE por API); secret scanning 0 |
| Q7.2 | 1.5/2 | MENOR | N-32 (§G.2): Trivy de producción remediado; 7 alertas Dependabot de desarrollo abiertas, 1 high con parche |
| Q7.3 | 1.5/2 | MENOR | F-008, CodeQL #27 |
| Q7.4 | 2/2 | COMPLETO | — |
| Q7.5 | 2.25/3 | MENOR | F-009, F-010 (heredados) |
| Q8.1 | 2/2 | COMPLETO | N-33 cerrado: la gobernanza ya no contradice el estado de Git/GitHub |
| Q8.2 | 2/2 | COMPLETO | N-30 cerrado (código idéntico a 9678acb) |
| Q8.3 | 1.5/2 | MENOR | F-005 |
| Q8.4 | 2/2 | COMPLETO | Trivy `trivy-fs` en #150 → `7d5d0f7` → `16d08f8` → CI de #151 → N-33 → `9f0f9a4` → este informe. El episodio de `develop` queda en el registro de actividad del servidor (actor, SHAs, horas); su ausencia en la gobernanza es S-10 |

**Validación matemática:** Q1 3+3+2.25+3 = 11.25 · Q2 3+2.25+3+3 = 11.25 · Q3 12.00 · Q4 3+2.25+2+2+2 = 11.25 · Q5 3+2.25+3+3+2.25 = 13.50 · Q6 3+2.25+2.25+3+2+1.5 = 14.00 · Q7 2.25+1.5+1.5+2+2.25 = 9.50 · Q8 2+2+1.5+2 = 7.50 → **90.25**. Puntos aplicables: 100 (sin N/A). Gates: ninguno. **Score final 90.25 ≥ 90**: el umbral se alcanza sin tolerancia.

**Divergencia:** con 9678acb (90.25): 0, con los 30 subcriterios iguales. Con la auditoría de 16d08f8 (89.75, sin informe): +0.50 por el cierre de N-33.

**Comprobación de consistencia (§90):** toda pérdida tiene causa identificada · todo hallazgo puntuable está asociado a un criterio materialmente relacionado · ninguna SUGGESTION resta puntos · el camino a 100 cubre 9.75 = 100 − 90.25 · sin N/A · sin gates. **Consistencia metodológica: PASS.**

## G. Hallazgos

| ID | Criterio | Sev. | Tipo | Estado | Descripción · corrección · verificación |
|---|---|---|---|---|---|
| **N-33** | Q1.3/Q8.1 | — | — | **CERRADO** | `9f0f9a4` reconcilia los 3 documentos con el estado real. Cada afirmación verificada en vivo (§C). Residuales no puntuables: S-10, S-11. |
| **N-30** | Q8.2 | — | — | **CERRADO** | Sin cambios desde 9678acb: los 7 blobs del área son idénticos y el diff `9678acb..HEAD` fuera de `.audit/`, `governance/` y lockfiles está vacío. La evidencia E4 de `AUDIT-PLATFORM-9678acb.md` §C (sonda 27/27, mutación 6/6 declaradas KILLED) sigue aplicando, y el test N-30 pasa hoy dentro de circuit 254/254. |
| **N-31** | Q1.3 (Q8.3) | MINOR | CONTRADICTORIO | ABIERTO, registrado como deuda | Ver §G.1. |
| **N-32** | Q7.2 | MINOR | RIESGO | ABIERTO, contenido actualizado | Ver §G.2. |
| N-29 | Q5.3 | MINOR | RIESGO | ABIERTO (ambiental) | `Permission denied` / `unable to write new index file` en los git dir temporales del harness (Windows). En esta auditoría: 4 tests en la primera pasada de `ci.yml` y 5 en la suite de release. Todos pasan en otra corrida. Factor del host INFERIDO: `C:\Users\ASUS` es un repo git que contiene `%TEMP%`. Corrección: aislar las escrituras git del harness (p. ej. `GIT_CEILING_DIRECTORIES`, reintento). Verificación: 3 corridas completas limpias en Windows. |
| N-25 | Q6.2 | MINOR | FALTA | ABIERTO, **materializado** | `develop` sin ruleset. El 2026-10-26 recibió un push directo de `7d5d0f7`+`16d08f8` (21:02:41Z) y un force-push de vuelta a `aebb832` (21:07:53Z), que además canceló el merge-gate y la CI de #150. El estado final es coherente y `main` no se vio afectado. Corrección: ruleset en `develop` (PR obligatoria, sin force-push). Verificación: `gh api repos/…/rulesets` con un ruleset activo sobre `develop`. |
| N-24, N-26, N-27 | Q5.2, Q6.3, Q5.3 | MINOR | — | ABIERTO | Heredados. N-27 no falló en esta auditoría. |
| F-002, F-005, F-007, F-008, F-010 | Q2.2, Q6.2/Q8.3, Q7.1, Q7.3, Q7.5 | MINOR | — | ABIERTO | Re-verificados en vivo o en el árbol (F-007 sigue NO VERIFICABLE). |
| F-003, F-004, F-006, F-009, N-11 | Q5.2, Q5.5, Q6.6, Q7.5, Q4.2 | MINOR | — | ABIERTO (INFERIDO) | El delta `9678acb..9f0f9a4` no toca `README.md`, `runtime/`, `scripts/`, `.github/` ni `evaluation/`. |

**Total: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR (cerrados: N-30, N-33; 0 nuevos puntuables).**

### G.1 N-31: reevaluación (sin corregir)

* **Mecanismo (E3; el código es idéntico al de 81b8d20 y 9678acb).** `reviewStatus(project, slug)` y `attestedRunsOf` solo leen `reviewStateDir(project, slug)` (`review-ledger.mjs:107`, `:325-326`, `:403`). La revisión identifica el cambio y no la spec. Un adverso atestado bajo `specs/A` no retira una aprobación de la misma revisión registrada bajo otra spec `specs/B`.
* **Severidad: sigue siendo MINOR.** Contradice `review.md:51` y `:73`. Ahora figura en la deuda conocida de `V3.4.0-RELEASE.md` (S-8 de 9678acb, cumplida), pero el texto normativo no cambió: −0.75 en Q1.3, sin cambios.
* **¿Bypass del merge humano? No.** `runtime/policy/hitl.mjs`, `runtime/gates/**` y `.github/workflows/**` no leen ledger, recibos ni el outcome del review (grep de `review-ledger|reviews.jsonl|reviewStatus|attestedRuns|claude-review|independent-review|deriveReviewOutcome`: 0 referencias). El merge a `main` sigue exigiendo PR, los checks requeridos del ruleset, el veredicto del merge-gate sobre el SHA exacto y un merge humano (D6).
* **¿Bypass del HITL? No, pero sí puede rebajar el `HUMAN_GATE` que *reporta* el circuito local.** `deriveReviewOutcome` devuelve `humanGate = policyGate` solo con `APPROVED`, y `required` en cualquier otro caso (`independent-review.mjs:157`, coherencia en `:171-172`). En el escenario N-31, `specs/B` puede llegar a `APPROVED`, y entonces su circuito reporta el gate que deriva la política (`deriveHumanGate`, `hitl.mjs:57`) en lugar de `required`:
  * riesgo alto o plano de control: el gate de la política ya es `required` → **sin efecto** (esta misma feature: `hitl --base v3.3.1` → «risk high, human_gate required»);
  * riesgo bajo o medio: puede bajar de `required` a `final-only`, que conserva la revisión humana final;
  * `none`: solo con el opt-in `governance.allowNone` en el lock de la rama base, más una declaración explícita y la autonomía exigida (`hitl.mjs:35-36`, `:70-71`).

  Requiere elusión deliberada con comandos propios y deja la línea APPROVED de `specs/B/reviews.jsonl` en el diff de la PR. No toca el control server-side de `main`.
* **¿Deuda aceptable para v3.4.0? Sí.** Corrección: en `status` y `record`, considerar las corridas atestadas de la revisión en todos los slugs del state root. Verificación: la sonda A/B debe dar B ≠ APPROVED.

### G.2 N-32: reevaluación con la remediación Trivy

* **Remediación verificada.** `foundation/`: `next` 16.4.3 (specifier `^16.4.3`). `template/`: `next` 15.5.28 (`^15.5.28`) y `body-parser` 2.4.0, transitiva de `express` 5.2.1, sin override. El único override de `template/package.json` (`postcss@<8.5.12`) ya existía y el diff `9678acb..HEAD` de ese archivo es solo la línea de `next`. No hay `.trivyignore` versionado ni en el árbol. `.github/` sin cambios desde v3.3.1: `trivy.yml` mantiene `scanners: vuln,secret,misconfig`, `severity: HIGH,CRITICAL`, `exit-code: "1"`.
* **Lockfiles coherentes (VERIFICACIÓN COMPLEMENTARIA DEL AUDITOR).** Copias aisladas de `package.json` y `pnpm-lock.yaml` (más `pnpm-workspace.yaml` en `foundation/`): `pnpm@10.34.9 install --frozen-lockfile --lockfile-only --ignore-scripts` → exit 0 en ambos, y los lockfiles quedan byte-idénticos.
* **Trivy:** `trivy-fs` remoto sobre `16d08f8` (lockfiles idénticos a 9f0f9a4) → 0 HIGH/CRITICAL en `foundation/pnpm-lock.yaml` y en `template/pnpm-lock.yaml`. Sobre `aebb832` (#150) sigue en `failure`, que es lo que corrige #151. Alcance (INFERIDO: es coherente con que Trivy dé 0 en `template/` mientras la alerta Dependabot #146 de vite es *high*): Trivy, con su configuración por defecto para pnpm, no evalúa dependencias de desarrollo. El «0» cubre la superficie de producción escaneada, no el toolchain de desarrollo.
* **Sigue abierto:** 7 alertas Dependabot en `template/pnpm-lock.yaml`, todas scope `development`: vite ×5 (#145–#147, #149, #150: 1 high, 3 medium, 1 low; parche 8.1.6; resuelto hoy 8.0.16) y `@vitest/mocker` ×2 (#148, #151 medium, parche 4.1.12; #151 creada 2026-10-26T19:31Z). La PR Dependabot #147 sigue excluida de la candidata.
* **¿Bundle, runtime o supply chain de la release? No** (0 rutas `template/`/`foundation/` en el bundle; `release.yml` no instala paquetes).
* **Clasificación: sigue siendo MINOR en Q7.2 (1.5/2).** La parte HIGH/CRITICAL de producción queda cerrada, pero se mantiene una vulnerabilidad *high* de desarrollo con parche disponible. No sube a MAJOR (no hay exposición del artefacto) y no baja a SUGGESTION (resta puntos). Corrección: mergear o descartar con justificación #147 y la actualización de `@vitest/mocker`, en una PR separada. Verificación: `gh api …/dependabot/alerts?state=open` → 0.

### G.3 Sugerencias (no puntúan)

* S-1: el README (`CLI: v3.3.0 | PLATFORM: v3.2.0`, `README.md:65`) sigue desfasado.
* S-2: la promoción develop → main debe hacerse con merge commit, o este informe queda STALE.
* S-3: las 7 deudas conocidas de `V3.4.0-RELEASE.md` distintas de N-31 (mutantes LOW y LOWs registrados, `docs-gate`, hook no disparado, comando de validación trivial, `--base` estrecho, evidencia no criptográfica, Unix socket `ENXIO`).
* S-4, S-5, S-6, S-9: como en `AUDIT-PLATFORM-9678acb.md` (allowlist de campos de la delegación, caso de capitalización en el test N-30, contraste del modelo ejecutado, espacio en el título `M10:an`).
* S-10: registrar en la gobernanza el push directo y el force-push de `develop` del 2026-10-26 y su efecto en los checks de #150.
* S-11: tras el push de `9f0f9a4`, la frase «#151 … lleva … la reconciliación posterior» pasa a ser literal. Si no se publica, corregirla.

Cerradas desde 9678acb: S-7 (la gobernanza ya refleja auditoría, fix y estado) y S-8 (N-31 registrada).

## H. Camino a 100

Q1.3 +0.75 (N-31). Q2.2 +0.75 (F-002). Q4.2 +0.75 (N-11). Q5.2 +0.75 (N-24, F-003). Q5.3 +1.00 (N-29, N-27 y CI remota del SHA exacto). Q5.5 +0.75 (F-004). Q6.2 +0.75 (F-005, N-25). Q6.3 +0.75 (N-26). Q6.6 +0.50 (F-006). Q7.1 +0.75 (F-007). Q7.2 +0.50 (N-32). Q7.3 +0.50 (F-008, CodeQL #27). Q7.5 +0.75 (F-009, F-010). Q8.3 +0.50 (F-005).

Suma: 0.75×9 + 1.00 + 0.50×4 = 6.75 + 1.00 + 2.00 = **9.75**. 90.25 + 9.75 = 100.00. Camino completo. F-005 afecta a dos criterios distintos (Q6.2 y Q8.3): causa raíz compartida, descuento proporcional en cada uno.

## I. Conclusión

```text
AUDITED_SHA: 9f0f9a4f760c9f2891036daf5df9c1389184e53f
SCORE: 90.25/100 (bruto = final; sin N/A; sin gates)  PREVIOUS: 90.25 (9678acb), 89.75 (16d08f8, sin informe)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 17 (cerrados: N-30, N-33; nuevos puntuables: 0)
SUGGESTION: 15 (S-1, S-2, 7 deudas conocidas, S-4, S-5, S-6, S-9, S-10, S-11)
N-33: CERRADO (12 afirmaciones contrastadas en vivo; matices S-10 y S-11, no puntuables)
N-30: CERRADO (código idéntico a 9678acb; evidencia E4 previa vigente; test N-30 PASS)
N-31: ABIERTO, MINOR (Q1.3); registrada como deuda; sin bypass del merge humano ni del HITL de main;
      puede rebajar el HUMAN_GATE reportado por el circuito local a final-only en riesgo bajo/medio (none solo con opt-in)
N-32: ABIERTO, MINOR (Q7.2); Trivy HIGH/CRITICAL de producción remediado (0/0 en remoto); 7 alertas Dependabot de desarrollo abiertas
N-29: AMBIENTAL; 4 + 5 fallos de escritura git en temporales, todos PASS en otra corrida; sin fallo de producto
N-25: MATERIALIZADO (push directo + force-push en develop, 2026-10-26); main intacta
SEMVER: MINOR (v3.4.0)
BUILD: reproducible (2 builds byte-idénticos, sha256:d6f6ceec…)
RELEASE_GATE (antes de este informe): FAIL (sin informe vigente; 26 STALE), lo esperado
UMBRAL PLATFORM 90: ALCANZADO sin tolerancia (margen 0.25)
VERDICT: APTO
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```

Evidencia: los comandos están registrados arriba. Las salidas completas y el script del auditor (`ci-replica.mjs`) quedaron en el scratchpad de la sesión, fuera del árbol auditado, y no se persistieron en `.audit/evidence/` porque el encargo era producir solo el informe.
