---
targetRepo: jlbellonGmail/ai-native
targetCommit: 3477428a47f4578ca1f74542b5f441b03985c078
platform:
  version: v3.0.0-dev
  commit: 3477428a47f4578ca1f74542b5f441b03985c078
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-05T16:06:00Z
scope: full repository at the exact commit
score: 93.0
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 3477428

## A. Identificacion

- Repositorio: jlbellonGmail/ai-native; ruta C:\Proyectos\ai-native; branch main; tag auditado: ninguno (VERSION=3.0.0-dev; ultimo release publicado v3.0.0-rc.1 sobre 0ffe68d, que NO contiene el codigo auditado aqui).
- Commit: `git rev-parse HEAD` = 3477428a47f4578ca1f74542b5f441b03985c078 (coincide). `git status --short` = 0 lineas antes y despues (comprobado tras cada bloque de ejecuciones). Sin worktree, sin ramas, sin commits.
- Perfil: PLATFORM 1.2 (unico). QUALITY_SCORE 1.1, AUDIT_RULES, AUDIT_PROMPT 1.1; metodo 1.2. Node v26.7.0, Windows 11. Umbrales y pesos sin cambios; sin waivers.
- Fecha: 2026-10-05. Solo lectura (GET a la API; los assets del release se descargan a un directorio temporal que se borra).
- Evidencia previa: `.audit/reports/AUDIT-PLATFORM-5a60072.md` se uso SOLO para formato y para comprobar el cierre de sus hallazgos; no se reutiliza ninguna evidencia ni puntuacion.
- Nivel de confianza: MEDIA (revocacion de claves antiguas de ai-native-trust no verificable; release.yml no ejecutado para un tag nuevo; fiabilidad de la suite local dependiente de la concurrencia, ver F-05).

## B. Veredicto ejecutivo

```
Score bruto: 93.00/100
Score final: 93.00/100
Quality Gate aplicado: ninguno (G1 PASS, G2 PASS, G3 no activado: ver M)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94 "Muy buen nivel"; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 8 MINOR)
Consistencia metodologica: PASS
>= 88 (minimo efectivo del gate de release, tolerancia 2): SI
>= 90 (umbral nominal): SI
```

Resumen: no hay BLOCKER, CRITICAL ni MAJOR. En el SHA exacto: 11 check-runs y 6 workflows en success (CI, CodeQL, Trivy, SBOM, Supply chain, pilot; matriz ubuntu+windows). Parity 95/95 con unmapped=0, doc-drift, pin-check, ci-tests-listed (72/72) y `runtime/audit/cli.mjs check` pasan. Validadores de area 44/44 PASS. La alerta CodeQL #10 esta `fixed` (F-01 anterior CERRADO). Secret scanning y push protection estan `enabled` (verificado por API). Ruleset activo sin bypass. `verify-release.mjs v3.0.0-rc.1`: 21/21 PASS. La suite node (657 tests) pasa 657/657 con `--test-concurrency=2`, pero con la concurrencia por defecto fallo en 2 de 2 ejecuciones completas locales (tests distintos cada vez, por `Permission denied` al escribir en `.git/objects` de repos temporales): fragilidad real de aislamiento/robustez, ver F-05. La documentacion de gobernanza (RC2-READINESS, QUALITY-MATRIX, SESSION-CONTEXT) ha quedado desfasada respecto de la realidad (F-01).

## C. Alcance y limitaciones

Inspeccionado: arbol (1488 ficheros rastreados, 165 en legacy/), workflows, `git diff 5a60072..3477428` (18 ficheros), runtime/migrate (migrate.mjs, bump.mjs, ruleset-guard.mjs y tests), scripts/verify-release.mjs, fs-safe, governance (SESSION-CONTEXT, QUALITY-MATRIX, RC2-READINESS, ALERTS-TRIAGE), ruleset, Environments, alertas, release rc.1.
No verificable (NO VERIFICADO): revocacion de claves antiguas de la App ai-native-trust (sin API); ejecucion real de `release.yml` sobre un tag futuro (no se crea tag); reconstruccion bit a bit de rc.1; reproduccion del fallo unico observado en la sesion del migrate (ver F-05, no reproducido en 8 intentos).

## D. Contrato detectado

| ID | Capacidad | Clasificacion | Evidencia | Estado |
|---|---|---|---|---|
| C1 | platform.json coherente con lock schema | VERIFICADO | verify-release rc.1: digest == sha256 tarball, version/commit == tag | OK |
| C2 | Paridad v2->v3 | EJECUTADO | `node parity/validate-parity.mjs`: capabilities 74, tests-map 35/264, files-map 576, par-tests 95/95, unmapped=0 | OK |
| C3 | Bundle determinista, SBOM, attestation, revocaciones | VERIFICADO (rc.1) | verify-release 21/21 incl. attestation offline y rechazo de repo ajeno | OK |
| C4 | Default deny MCP/politicas | EJECUTADO | core/security-policy.json + tests | OK |
| C5 | HITL unico de merge, gates server-side | PARCIAL | ruleset: approvals=0 (limitacion F2) | Documentada |
| C6 | migrate v2->v3 reversible + guarda de ruleset + bump | EJECUTADO | migrate-v2.test (17/17 en 8 ejecuciones), ruleset-guard.test + verify-release.test 22/22 | OK |
| C7 | Evidencia hash-chained | EJECUTADO | tests circuit/mcp-gateway | OK |

## E. Matriz de puntuacion

| Area | Maximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR |
| Q2 Reutilizacion | 12 | 11.25 | MENOR |
| Q3 Arquitectura | 12 | 10.50 | MENOR |
| Q4 Documentacion/DX | 12 | 11.50 | MENOR |
| Q5 Calidad/Tests | 16 | 15.00 | MENOR |
| Q6 Git/CI/CD/Release | 16 | 15.25 | MENOR |
| Q7 Seguridad | 12 | 10.75 | MENOR |
| Q8 Gobernanza | 8 | 7.50 | MENOR |
| **TOTAL** | **100** | **93.00** | |

Aritmetica: 11.25 + 11.25 + 10.50 + 11.50 + 15.00 + 15.25 + 10.75 + 7.50 = 93.00. Sin N/A (aplicables = 100). Bruto = final.

## F. Detalle por subcriterio (COMPLETO 100%, MENOR 75%)

| ID | Max | Nivel | Obt. | Evidencia / hallazgo |
|---|--:|---|--:|---|
| Q1.1 | 3 | COMPLETO | 3 | README, AGENTS.md, SESSION-CONTEXT: alcance claro |
| Q1.2 | 3 | COMPLETO | 3 | G-09, G-10: capacidades presentes y ejecutadas |
| Q1.3 | 3 | MENOR | 2.25 | F-01: docs de gobernanza contradicen la realidad |
| Q1.4 | 3 | COMPLETO | 3 | sin requisitos obligatorios rotos |
| Q2.1 | 3 | COMPLETO | 3 | pilot online ubuntu/windows en success; verify-release con consumidor real PASS |
| Q2.2 | 3 | MENOR | 2.25 | F-06: legacy/ (165 ficheros), scripts/_deprecated (5), rutas locales `C:\Users\jlbel` en governance/execution/archive |
| Q2.3 | 3 | COMPLETO | 3 | lock + CONTRIBUTING + MIGRATION-V2-TO-V3 |
| Q2.4 | 3 | COMPLETO | 3 | CI Linux y Windows |
| Q3.1 | 3 | MENOR | 2.25 | F-06 (causa compartida con Q2.2) |
| Q3.2 | 3 | COMPLETO | 3 | ruleset-guard, bump, migrate separados; L3_CHECK con test de consistencia contra l3-consumer.yml |
| Q3.3 | 3 | MENOR | 2.25 | F-07: 4 validadores x 3 areas duplicados |
| Q3.4 | 3 | COMPLETO | 3 | SESSION-CONTEXT 61 lineas; 72 ficheros de test |
| Q4.1 | 3 | COMPLETO | 3 | README funcional (seccion de verificacion de release anadida) |
| Q4.2 | 3 | COMPLETO | 3 | comandos ejecutados con exito |
| Q4.3 | 2 | COMPLETO | 2 | validar/probar/liberar/verificar release/migrar documentados |
| Q4.4 | 2 | COMPLETO | 2 | CONTRIBUTING, SECURITY, CODEOWNERS |
| Q4.5 | 2 | MENOR | 1.5 | F-08: troubleshooting general sigue en una linea (README.md:79) |
| Q5.1 | 3 | COMPLETO | 3 | validadores, pin-check, doc-drift, integrity en CI |
| Q5.2 | 3 | COMPLETO | 3 | contrato/paridad/regresion/pilot/migracion |
| Q5.3 | 4 | MENOR | 3 | F-05: 657/657 con concurrencia 2 y en CI, pero 2/2 ejecuciones locales a concurrencia por defecto con fallos distintos; cadena TS fuera de CI |
| Q5.4 | 3 | COMPLETO | 3 | 95 PAR-tests; regresiones CRLF del revert y de la guarda de ruleset |
| Q5.5 | 3 | COMPLETO | 3 | 6 checks requeridos con integration_id |
| Q6.1 | 3 | COMPLETO | 3 | PRs #55/#56/#57 mergeadas, commits convencionales |
| Q6.2 | 3 | MENOR | 2.25 | F-02: approvals=0, strict=false |
| Q6.3 | 3 | COMPLETO | 3 | 11 check-runs success en el SHA, matriz ubuntu+windows |
| Q6.4 | 3 | COMPLETO | 3 | rc.1 inmutable, 21/21 en verify-release; rc.2 no publicada y la documentacion lo declara |
| Q6.5 | 2 | COMPLETO | 2 | SHA256SUMS, digest, tests de bundle reproducible |
| Q6.6 | 2 | COMPLETO | 2 | revert CRLF-safe, guarda de ruleset, bump de 2 ficheros, rollback por cache |
| Q7.1 | 3 | MENOR | 2.25 | secret scanning + push protection enabled; repo secrets=0; F-03: revocacion de la clave antigua NO VERIFICADO |
| Q7.2 | 2 | COMPLETO | 2 | Dependabot 0 abiertas; alerta #10 `fixed`; unica PR abierta #48 (bump actions/checkout, deliberada) |
| Q7.3 | 2 | MENOR | 1.5 | F-04: sin ruleset de tags; job `publish` sin Environment |
| Q7.4 | 2 | COMPLETO | 2 | defaultDecision deny; la guarda de ruleset falla cerrado (RULESET_UNREADABLE) |
| Q7.5 | 3 | COMPLETO | 3 | SBOM CycloneDX 1.7, attestation x4 + offline + repo ajeno rechazado, revocaciones identicas |
| Q8.1 | 2 | COMPLETO | 2 | AGENTS.md/governance fuente; doc-drift verde |
| Q8.2 | 2 | COMPLETO | 2 | roles y limites; CODEOWNERS; Environment human-review con reviewer requerido |
| Q8.3 | 2 | MENOR | 1.5 | F-02: merge humano = norma + deteccion, no imposicion servidor |
| Q8.4 | 2 | COMPLETO | 2 | eventos hash-chained; informes ligados a SHA exacto (G-22) |

## G. Ledger de verificacion

| ID | Verificacion | Resultado |
|---|---|---|
| G-01 | `git rev-parse HEAD`; `git status --short` | SHA exacto; 0 lineas antes y despues |
| G-02 | `node --test $(git ls-files '*.test.mjs' | grep -v '^legacy/')`, ejecucion 1 (concurrencia por defecto, solapada con verify-release) | 657 tests, 655 pass, 2 FAIL (`runtime/gates/trust-gate.test.mjs:72` y `runtime/status/integrity.test.mjs:46`): `unable to write file .git/objects/..: Permission denied` en `git add -A` de repos temporales |
| G-03 | idem, ejecucion 2 (concurrencia por defecto) | 657, 656 pass, 1 FAIL (`runtime/audit/fixtures.test.mjs:65` LIBRARY exact-commit): `Permission denied` en `git commit` |
| G-04 | reejecucion aislada de trust-gate + integrity (x3) | 17/17 x3 |
| G-05 | idem, suite completa con `--test-concurrency=2` | 657/657 pass, 0 fail, 0 skip, EXIT=0 (335 s) |
| G-06 | `runtime/migrate/migrate-v2.test.mjs`: 1 aislada + 6 en paralelo (+ pasada en G-03 y G-05) | 17/17 en todas (el fallo de la sesion NO se reprodujo) |
| G-07 | `verify-release.test` + `ruleset-guard.test` | 22/22 |
| G-08 | foundation/knowledge/template `scripts/validate-*.mjs` desde su area | 7/7, 18/18, 19/19 PASS |
| G-09 | `node parity/validate-parity.mjs` | PASS (unmapped=0; par-tests 95/95) |
| G-10 | `validate-doc-drift`, `validate-actions-pinned`, `validate-ci-tests-listed` (72 ficheros), `runtime/audit/cli.mjs check` | todos PASS, rc=0 |
| G-11 | CI del SHA | 11 check-runs success (analyze x2, pin-check, pilot x2, trivy-fs, validators x2, legacy baseline x2, sbom); workflows CodeQL, Supply chain, pilot, SBOM, Trivy, CI = success |
| G-12 | code-scanning alerts | 13: #1-#8, #10, #11 `fixed`; #9 dismissed (won't fix, justificada); #12 y #18 dismissed (false positive, justificadas); abiertas en main = 0 |
| G-13 | Dependabot / PRs | 0 alertas abiertas; PR abierta #48 (actions/checkout 4.2.2 -> 7.0.1) |
| G-14 | secret scanning | secret_scanning enabled, push_protection enabled; alertas de secret scanning = [] |
| G-15 | ruleset ai-native-main (24405506) | unico ruleset, active, bypass_actors=[], ~DEFAULT_BRANCH; deletion, non_fast_forward, pull_request (approvals 0, dismiss_stale true), checks: validators ubuntu/windows, pin-check, pr-gate, ai-native/trust-gate, ai-native/merge-gate; strict=false; sin proteccion de rama clasica (404) |
| G-16 | actions/permissions; Environments; secretos | sha_pinning_required=true, allowed_actions=all; ai-native-human-review (required_reviewers: jlbellonGmail, prevent_self_review=false), ai-native-trust; secretos de repo = 0 |
| G-17 | `node scripts/verify-release.mjs v3.0.0-rc.1` | PASS (21 checks): tag->0ffe68d, release inmutable, 6 assets, SHA256SUMS 4/4, digest, attestation x4 + offline + repo ajeno rechazado, SBOM CycloneDX 1.7 (0 componentes), revocaciones identicas, bootstrap init/sync --require-attestation/doctor/run/status READY CHECKED |
| G-18 | tags / releases | v3.0.0-alpha.1 y v3.0.0-rc.1 (prerelease, no draft); rc.1 (0ffe68d) ancestro de main |
| G-19 | permissions en workflows | todos los workflows tienen `permissions:` top-level (`grep -L` vacio) |
| G-20 | secretos en el arbol | `git grep` sin tokens ni claves privadas (solo ejemplos enmascarados en audit/method); rutas locales de usuario en governance/execution/archive (F-06) |
| G-21 | `release.yml` publish (estatico) | permissions contents/id-token/attestations write; sin `environment:` |
| G-22 | `release-gate --profile PLATFORM` con `--candidate 0ffe68d` / `--candidate 3477428` | PASS / FAIL "no current valid PLATFORM audit report" (5a60072 STALE: README, SESSION-CONTEXT, CANARY, MIGRATION, QUALITY-MATRIX difieren): el mecanismo exact-commit funciona; este informe cubre 3477428 |

## H. Hallazgos

Estado de los hallazgos de la auditoria 5a60072 (verificado ahora): F-01 alerta #10 CERRADO (state=fixed); F-04 secret scanning CERRADO (la revocacion de claves sigue NO VERIFICADO); F-03, F-05, F-06, F-07, F-08, F-09 siguen ABIERTOS (renumerados abajo).

| ID | Tipo | Sev. | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|--:|
| F-01 | Contradiccion doc/realidad | MINOR | Documentacion de gobernanza desfasada tras los merges #55/#56/#57 y el cierre de #10: RC2-READINESS lista las condiciones 1-3 como PENDING_HUMAN y la 5 como pendiente (estan mergeadas y #10 esta `fixed`); QUALITY-MATRIX marca CodeQL PARTIAL con #10 "abierta" y "main = 0ffe68d"; SESSION-CONTEXT dice "los pendientes siguen abiertos: alerta #10"; RC2-READINESS afirma verify-release "22/22 PASS" y el comando imprime 21 checks | RC2-READINESS.md, QUALITY-MATRIX.md, SESSION-CONTEXT.md; G-12, G-17 | Q1.3 | -0.75 |
| F-02 | Limitacion conocida | MINOR | approvals=0, strict=false: el merge humano no lo impone el servidor (un solo maintainer, F2) | G-15 | Q6.2, Q8.3 | -1.25 |
| F-03 | NO VERIFICADO | MINOR | Revocacion de claves antiguas de ai-native-trust no verificable (sin API); impide COMPLETO en Q7.1 (QUALITY_SCORE 16) | SESSION-CONTEXT | Q7.1 | -0.75 |
| F-04 | Defecto | MINOR | Sin ruleset de tags (1 solo ruleset, de rama); `publish` con permisos de escritura sin Environment. Mitigado por ancestro de main, CI verde y audit gate en release.yml | G-15, G-21 | Q7.3 | -0.5 |
| F-05 | Defecto de pruebas | MINOR | (a) Tests con repos git temporales fragiles bajo concurrencia en Windows: 2/2 ejecuciones completas locales con concurrencia por defecto fallaron (3 tests distintos, `Permission denied` en `.git/objects`); con `--test-concurrency=2` 657/657 y en aislado 3/3; sin reintentos ni aislamiento. (b) cadena TS (tsc/eslint/vitest) de template/ y foundation/ fuera de CI | G-02..G-05; ci.yml sin tsc/vitest | Q5.3 | -1.0 |
| F-06 | Residuo | MINOR | legacy/ (165 ficheros), scripts/_deprecated (5) y rutas locales de usuario (`C:\Users\jlbel`, `D:\proyectos`) en governance/execution/archive | git ls-files; G-20 | Q2.2, Q3.1 | -1.5 |
| F-07 | Duplicacion | MINOR | validate-duplicate-detection / historical-archive / legacy-inventory / obsolete-artifacts existen 3 veces (foundation, knowledge, template) | ls | Q3.3 | -0.75 |
| F-08 | Documentacion | MINOR | Troubleshooting general de una linea (README.md:79) | README | Q4.5 | -0.5 |

Total puntos perdidos: 0.75 + 1.25 + 0.75 + 0.5 + 1.0 + 1.5 + 0.75 + 0.5 = 7.00 -> 93.00.

### F-05 detalle: el fallo de migrate-v2 observado en la sesion

El mensaje "working tree is not clean: commit or stash first" lo lanza `planMigration` (primera comprobacion, `git status --porcelain`) sobre `starter`, el clon real de template-starter compartido y mutable por todos los tests `net` de migrate-v2.test.mjs (sin `beforeEach` de reset; solo `reset --hard` manual al final de algunos). El test de WILL_DISAPPEAR es el ultimo en orden y depende de que cada test anterior deje el arbol exactamente limpio. Hipotesis mas probable (NO reproducida, por tanto no demostrada): una escritura git transitoria fallida (el mismo `Permission denied` sobre `.git/objects` que SI se observo en 3 tests de otros ficheros bajo concurrencia por defecto; probable bloqueo de antivirus/indexador en Windows, con `core.autocrlf=true` global) dejo el clon sucio y el fallo se propago al test siguiente. Intentos de reproduccion: 1 ejecucion aislada + 6 en paralelo + 2 ejecuciones completas + 1 con concurrencia 2: migrate-v2 17/17 en las 9 ocasiones. Conclusion: no hay no determinismo logico demostrado en la guarda; si hay un riesgo de diseno de test (estado compartido y orden dependiente) y fragilidad ambiental generalizada de los tests con repos temporales en Windows. CI (Linux y Windows) esta verde en el SHA.

## H-bis. Revision del codigo cambiado desde 5a60072

- `migrate revert` CRLF: compara `sha(current)` y `normalizedSha(current)` contra el hash del journal; dos tests (CRLF limpio -> REVERTED; edicion real con CRLF -> PARTIAL). Correcto, no relaja la proteccion de ediciones del usuario.
- Guarda de ruleset: falla cerrado (RULESET_UNREADABLE sin fuente; workflow retirado leido parcialmente = error; checks sin fuente = UNKNOWN_SOURCE warning; `push` y `paths` no cuentan como fuente fiable); `apply` se niega sin `--accept-ruleset-change`; nunca edita un ruleset. Limitacion declarada: lectura de YAML por lineas, no parser. Observacion (SUGGESTION, sin puntos): `--skip-ruleset-check` solo emite un warning en la salida; el comentario de cabecera dice "records that it was NOT checked" pero no queda registrado en el journal.
- `migrate bump`: toca solo lock + pin SHA del caller (PAR-BUMP-FOOTPRINT), exige `--caller-sha` de 40 hex, rechaza prerelease desde canal stable, respeta `--dry-run`. Correcto.
- `scripts/verify-release.mjs`: ejecutado contra rc.1 con exito (21 checks); valida el formato del tag antes de usar red. Sus 3 tests unitarios cubren solo parseo y validacion del tag (SUGGESTION: sin mocks del camino de red). Sin `--expect-commit` no compara contra un commit independiente.
- `incident-repository.ts`: elimina `existsSync` previo en `save()` y `getAll()`; coincide con el cierre de la alerta #10 en GitHub (`fixed`).
- `runtime/bootstrap/install.mjs`: solo cambia un mensaje de error (accionable); test actualizado.

## I. Causas raiz

| ID | Causa raiz | Hallazgos | Impacto |
|---|---|---|---|
| R-1 | Un unico maintainer | F-02, F-03 | Q6.2, Q7.1, Q8.3 (penalizada una sola vez por criterio) |
| R-2 | Documentacion de estado escrita a mano y no cerrada tras los merges | F-01 | Q1.3 |
| R-3 | Areas heredadas fuera de la CI raiz; tests con repos temporales sin aislamiento | F-05 | Q5.3 |
| R-4 | Monorepo con historico congelado y validadores copiados | F-06, F-07 | Q2.2, Q3.1, Q3.3 |

## J. Que sobra

CONSOLIDAR validadores duplicados (F-07); REVISAR legacy/, _deprecated y rutas locales archivadas (F-06).

## K. Que falta

Obligatorio para 100/100: cerrar F-01 a F-08 (7.00 puntos). Mejoras opcionales (sin puntos): registrar `--skip-ruleset-check` en el journal; tests con mocks de red para verify-release; resolver PR #48.

## L. NO VERIFICADO

| Item | Motivo | Impacto | Como verificar |
|---|---|---|---|
| Revocacion de claves de ai-native-trust | Accion humana, sin API | Q7.1 no COMPLETO (F-03) | Maintainer confirma en GitHub Apps |
| Ejecucion de release.yml para rc.2 | No se crea tag | Revision estatica + rc.1 verificado externamente | Tag rc.2 + verify-release --expect-commit |
| Reproducibilidad bit a bit de rc.1 | No se reconstruyo | Puntuado por tests y digest | Rebuild en 0ffe68d |
| Causa exacta del fallo unico de migrate-v2 | No reproducido | Hipotesis en F-05 | Ejecutar en bucle con trazas de `git status` |

## M. Quality Gates

G1 BLOCKER: PASS. G2 CRITICAL: PASS. G3 verificacion esencial: NO ACTIVADO, con justificacion explicita: la suite principal fallo localmente con la concurrencia por defecto (G-02, G-03) por un error de entorno (Permission denied al escribir objetos git en repos temporales), pero pasa 657/657 con `--test-concurrency=2` (G-05), cada test fallido pasa en aislamiento (G-04) y CI Linux y Windows esta verde en el SHA exacto (G-11). Se trata como F-05 (MINOR, Q5.3). Con una lectura estricta del gate (cualquier fallo durante la auditoria) el techo seria 89/100: seguiria siendo >= 88 pero < 90. Se hace constar para que quien consuma el informe decida con transparencia.

## N. Camino matematico a 100

Score actual 93.00. F-01 +0.75 (Q1.3); F-02 +1.25 (Q6.2 +0.75, Q8.3 +0.5); F-03 +0.75 (Q7.1); F-04 +0.50 (Q7.3); F-05 +1.00 (Q5.3); F-06 +1.50 (Q2.2 +0.75, Q3.1 +0.75); F-07 +0.75 (Q3.3); F-08 +0.50 (Q4.5). Suma 7.00; 93.00 + 7.00 = 100.

## O. Plan de remediacion

1. F-01 (agente): cerrar condiciones 1-3 y 5 de RC2-READINESS, actualizar QUALITY-MATRIX (CodeQL PASS, #10 fixed, main = 3477428) y SESSION-CONTEXT, corregir "22/22" a 21. +0.75.
2. F-05 (agente): aislar los tests con repos temporales (reintento ante EPERM o `--test-concurrency` explicito; clon `starter` por test o reset en `beforeEach`); anadir job CI de tsc/vitest o declarar el area fuera de alcance. +1.0.
3. F-06/F-07/F-08 (agente): consolidar validadores, retirar o separar legacy/_deprecated, anonimizar rutas archivadas, ampliar troubleshooting. +2.75.
4. F-02/F-03/F-04 (humano): segundo maintainer o identidad, confirmar revocacion de claves, ruleset de tags y Environment de publish. +2.5.

## P. Segunda pasada de 100

N/A (score < 100).

## Q. Certificacion final

Es hoy una PLATAFORMA PROFESIONAL DE REFERENCIA (100/100)? NO. Nivel "muy buen nivel": 93.00/100, 0 BLOCKER/CRITICAL/MAJOR, 8 MINOR abiertos, un punto NO VERIFICADO (revocacion de claves) y un riesgo de fiabilidad de tests locales bajo concurrencia. Cumple el umbral nominal de release (>= 90) y el minimo efectivo (>= 88). Este informe certifica solo el commit 3477428 (o un descendiente cuya diferencia neta sea unicamente `.audit/**` y `STATUS.md`).
