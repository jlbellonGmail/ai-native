---
targetRepo: jlbellonGmail/ai-native
targetCommit: 15715eae4a471ca65320cb532f48a55b11f04914
platform:
  version: v3.0.0-dev
  commit: 15715eae4a471ca65320cb532f48a55b11f04914
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-05T19:22:00Z
scope: full repository at the exact commit (candidate content for v3.0.0)
score: 92.25
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 15715ea

## A. Identificacion

- Repositorio: jlbellonGmail/ai-native; ruta C:\Proyectos\ai-native; branch docs/m5-4-canary-closure. `git rev-parse HEAD` = 15715eae4a471ca65320cb532f48a55b11f04914 (coincide). `git status --short` = 0 lineas antes y despues de todas las ejecuciones. Sin ramas, commits ni ficheros modificados en el repo.
- Relacion con main: `git diff 5afe752 15715ea --stat` = 5 ficheros, todos bajo governance/ (SESSION-CONTEXT, canary, QUALITY-MATRIX, roadmap, RC2-READINESS; +31/-17). El arbol de codigo es el de main 5afe752.
- Perfil: PLATFORM 1.2 (unico). QUALITY_SCORE 1.1, AUDIT_RULES, AUDIT_PROMPT 1.1, metodo 1.2. Node v26.7.0, Windows 11. Umbrales y pesos sin cambios; sin waivers. VERSION = 3.0.0-dev (la version de la plataforma es el tag).
- Evidencia previa: no se ha reutilizado ningun informe de `.audit/reports/` (ni puntuacion ni evidencias); solo se tomo el front matter como formato. El informe de 9187fbc de la carpeta temporal se ignoro.
- Fecha: 2026-10-05. Solo lectura (GET con `gh`; `verify-release` descarga los assets de rc.2 a un directorio temporal).
- Confianza: MEDIA (revocacion de claves antiguas no verificable; el flujo `release.yml` para el tag `v3.0.0` no puede ejecutarse; fiabilidad de la suite local dependiente de la maquina).

## B. Veredicto ejecutivo

```
Score bruto: 92.25/100
Score final: 92.25/100
Quality Gate aplicado: ninguno (G1 PASS, G2 PASS, G3 no activado)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 9 MINOR)
Consistencia metodologica: PASS
>= 88 (minimo efectivo del gate de release, tolerancia 2): SI
>= 90 (umbral nominal): SI
```

Resumen: en el SHA de codigo (main 5afe752) CI, CodeQL, Trivy, SBOM, Supply chain y pilot estan en success (11 check-runs success). Suite node 657/657 PASS dos veces (concurrencia 2: 349 s; concurrencia por defecto: 241 s). Parity 95/95 con unmapped=0, doc-drift, pin-check, ci-tests-listed (72/72), `runtime/audit/cli.mjs check` y validadores de area (7+18+19) PASS. `verify-release v3.0.0-rc.2 --expect-commit 51ef185...` PASS (22 checks). 0 alertas de code scanning abiertas, secret scanning y push protection enabled, 0 alertas de secretos, 0 Dependabot. Ningun documento afirma que v3.0.0 este publicada. Defectos reales: documentacion de estado incompleta/incoherente respecto de M5.2 y C-2 (F-01), `release.yml` no idempotente (F-09), tests no hermeticos y fragiles en Windows (F-05), mas los limites ya conocidos (F-02, F-03, F-04, F-06, F-07, F-08).

## C. Alcance y limitaciones

Inspeccionado: arbol (git ls-files), diff 5afe752..15715ea completo, workflows (release.yml), ruleset, Environments, alertas, releases/tags, template-starter (PR #4, ruleset, lock), governance (SESSION-CONTEXT, QUALITY-MATRIX, RC2-READINESS, canary, roadmap).

NO VERIFICADO: (1) revocacion de claves antiguas de la App ai-native-trust (sin API); (2) ejecucion de `release.yml` para `v3.0.0` (no se crea tag); (3) re-ejecucion del reviewer ACCEPT y del rollback LF/CRLF del canary (se verifica el estado en GitHub, no se repiten); (4) reproducibilidad bit a bit de rc.2; (5) causa raiz de los `Permission denied` locales (hipotesis en F-05).

## D. Contrato y verificaciones del contrato

| ID | Capacidad | Clasificacion | Evidencia | Estado |
|---|---|---|---|---|
| C1 | platform.json coherente con lock schema | VERIFICADO | verify-release rc.2: digest == sha256 tarball, version/commit == tag | OK |
| C2 | Paridad v2->v3 | EJECUTADO | capabilities 74, tests-map 35/264, files-map 576, par-tests 95/95, unmapped=0 | OK |
| C3 | Bundle determinista, SBOM, attestation, revocaciones | VERIFICADO (rc.2) | 22/22: attestation x4, offline, repo ajeno rechazado, SBOM CycloneDX 1.7 | OK |
| C4 | Default deny MCP/politicas | EJECUTADO | suite 657/657 | OK |
| C5 | HITL unico de merge, gates server-side | PARCIAL | ruleset: approvals=0, strict=false | F-02 |
| C6 | Evidencia hash-chained | EJECUTADO | tests circuit/mcp-gateway en la suite | OK |

## E. Matriz de puntuacion

| Area | Maximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR |
| Q2 Reutilizacion | 12 | 11.25 | MENOR |
| Q3 Arquitectura | 12 | 10.50 | MENOR |
| Q4 Documentacion/DX | 12 | 11.50 | MENOR |
| Q5 Calidad/Tests | 16 | 15.00 | MENOR |
| Q6 Git/CI/CD/Release | 16 | 14.50 | MENOR |
| Q7 Seguridad | 12 | 10.75 | MENOR |
| Q8 Gobernanza | 8 | 7.50 | MENOR |
| **TOTAL** | **100** | **92.25** | |

Aritmetica: 11.25 + 11.25 + 10.50 + 11.50 + 15.00 + 14.50 + 10.75 + 7.50 = 92.25. Sin N/A (aplicables = 100). Bruto = final. Escala usada: COMPLETO 100 %, MENOR 75 % (sin porcentajes intermedios).

## F. Detalle por subcriterio

| ID | Max | Nivel | Obt. | Evidencia / hallazgo |
|---|--:|---|--:|---|
| Q1.1 | 3 | COMPLETO | 3 | README, AGENTS.md, SESSION-CONTEXT: alcance claro |
| Q1.2 | 3 | COMPLETO | 3 | G-02, G-04: capacidades presentes y ejecutadas |
| Q1.3 | 3 | MENOR | 2.25 | F-01: M5.2 abierta no propagada; C-2 desfasado en SESSION-CONTEXT |
| Q1.4 | 3 | COMPLETO | 3 | sin requisitos obligatorios rotos (M5.2 abierta esta declarada como tal en el roadmap) |
| Q2.1 | 3 | COMPLETO | 3 | pilot online ubuntu/windows success; verify-release con consumidor real PASS |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q2.3 | 3 | COMPLETO | 3 | lock + CONTRIBUTING + MIGRATION-V2-TO-V3 |
| Q2.4 | 3 | COMPLETO | 3 | CI ubuntu+windows |
| Q3.1 | 3 | MENOR | 2.25 | F-06 (causa compartida con Q2.2) |
| Q3.2 | 3 | COMPLETO | 3 | ruleset-guard, bump, migrate separados |
| Q3.3 | 3 | MENOR | 2.25 | F-07 |
| Q3.4 | 3 | COMPLETO | 3 | SESSION-CONTEXT 64 lineas; 72 ficheros de test, todos listados en CI |
| Q4.1 | 3 | COMPLETO | 3 | README funcional |
| Q4.2 | 3 | COMPLETO | 3 | comandos ejecutados con exito |
| Q4.3 | 2 | COMPLETO | 2 | validar/probar/liberar/verificar documentados |
| Q4.4 | 2 | COMPLETO | 2 | CONTRIBUTING, SECURITY, CODEOWNERS |
| Q4.5 | 2 | MENOR | 1.5 | F-08 |
| Q5.1 | 3 | COMPLETO | 3 | validadores, pin-check, doc-drift en CI |
| Q5.2 | 3 | COMPLETO | 3 | contrato/paridad/regresion/pilot/migracion |
| Q5.3 | 4 | MENOR | 3 | F-05 |
| Q5.4 | 3 | COMPLETO | 3 | 95 PAR-tests |
| Q5.5 | 3 | COMPLETO | 3 | 6 checks requeridos con integration_id |
| Q6.1 | 3 | COMPLETO | 3 | flujo por PR, commits convencionales |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.3 | 3 | MENOR | 2.25 | F-09: workflow Release no idempotente (el CI en si: 11 check-runs success) |
| Q6.4 | 3 | COMPLETO | 3 | rc.1/rc.2 inmutables, verify-release 22/22; v3.0.0 no publicada y los docs lo declaran |
| Q6.5 | 2 | COMPLETO | 2 | SHA256SUMS, digest, tests de bundle reproducible |
| Q6.6 | 2 | COMPLETO | 2 | revert CRLF-safe, guarda de ruleset, bump, rollback |
| Q7.1 | 3 | MENOR | 2.25 | F-03 (NO VERIFICADO); secret scanning + push protection enabled, 0 alertas |
| Q7.2 | 2 | COMPLETO | 2 | 0 Dependabot; #48 abierta a proposito (plano de control) |
| Q7.3 | 2 | MENOR | 1.5 | F-04 |
| Q7.4 | 2 | COMPLETO | 2 | default deny, guarda fail-closed |
| Q7.5 | 3 | COMPLETO | 3 | SBOM, attestation x4 + offline + repo ajeno rechazado, revocaciones identicas |
| Q8.1 | 2 | COMPLETO | 2 | AGENTS.md/governance fuente; doc-drift verde |
| Q8.2 | 2 | COMPLETO | 2 | roles y limites; Environment human-review; CODEOWNERS |
| Q8.3 | 2 | MENOR | 1.5 | F-02 |
| Q8.4 | 2 | COMPLETO | 2 | eventos hash-chained; informes ligados a SHA exacto |

## G. Ledger de verificacion (comandos realmente ejecutados)

| ID | Verificacion | Resultado |
|---|---|---|
| G-01 | `git rev-parse HEAD`; `git status --short` | SHA exacto; 0 lineas al inicio y al final |
| G-02 | `node --test --test-concurrency=2 $(git ls-files '*.test.mjs' \| grep -v '^legacy/')` (log tests2.log) | 657 tests, 657 pass, 0 fail, 0 skip, EXIT=0, 349.6 s |
| G-03 | idem con la concurrencia POR DEFECTO (log tests-def-15715ea.log) | 657/657 pass, EXIT=0, 240.9 s. En esta ejecucion NO fallo (1 de 1). Los logs previos de la misma maquina (tests-default.log) si mostraban `unable to write file .git/objects/..: Permission denied`: comportamiento intermitente (flaky), no determinista |
| G-04 | `node parity/validate-parity.mjs` | PASS: capabilities 74 (unmapped=0), tests-map 35/264 (0), files-map 576 (0), par-tests 95/95 |
| G-05 | `node runtime/audit/cli.mjs check` | PASS |
| G-06 | `scripts/validate-actions-pinned.mjs`, `scripts/validate-ci-tests-listed.mjs`, `runtime/docs/validate-doc-drift.mjs` | PASS; 72/72 ficheros de test ejecutados por un workflow |
| G-07 | `scripts/validate-*.mjs` desde foundation/, knowledge/, template/ | 7/7, 18/18, 19/19 PASS (exit 0) |
| G-08 | CI de main 5afe752 (check-runs y workflow runs) | 11 check-runs success (analyze x2, pilot x2, legacy baseline x2, validators x2, sbom, trivy-fs, pin-check); workflows CI, CodeQL, Trivy, SBOM, Supply chain, pilot = success |
| G-09 | code scanning `state=open` | 0 alertas abiertas |
| G-10 | ruleset ai-native-main (24405506), unico ruleset, active | bypass_actors=[]; deletion, non_fast_forward, pull_request (approvals 0), required_status_checks: validators ubuntu/windows, pin-check, pr-gate, ai-native/trust-gate, ai-native/merge-gate (todos con integration_id); strict=false |
| G-11 | secret scanning y configuracion | secret_scanning enabled, push_protection enabled, 0 alertas; Dependabot 0; sha_pinning_required=true; Environments: ai-native-human-review, ai-native-trust; unica PR abierta #48 |
| G-12 | `node scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit 51ef1859fbb39af5f0c82547597faa54aa945457` | PASS (22 checks): tag==commit esperado, release publicado e inmutable, 6 assets, SHA256SUMS 4/4, digest, attestation x4 + offline + repo ajeno rechazado, SBOM CycloneDX 1.7, revocaciones identicas, bootstrap init/sync/doctor/run/status READY CHECKED |
| G-13 | releases y tags | v3.0.0-alpha.1, v3.0.0-rc.1, v3.0.0-rc.2: publicados (draft=false), prerelease, inmutables. NO queda ningun borrador duplicado de rc.2. Tags: rc.2 -> 51ef185, rc.1 -> 0ffe68d. No existe v3.0.0 |
| G-14 | template-starter: PR #4 | MERGED, mergeCommit 9d711d08eaad07593890cac06155d89223360dd8, mergedAt 2026-10-05T18:30:41Z; main = 9d711d0 |
| G-15 | template-starter ai-native.lock.json en main | v3.0.0-rc.2, commit 51ef1859fbb39af5f0c82547597faa54aa945457, digest sha256:55b9589f..., canal rc |
| G-16 | ruleset template-starter-main (24421920) | active, bypass_actors=[], reglas deletion, non_fast_forward, pull_request, required_status_checks = unicamente `l3 / l3-consumer` (integration 15368) |
| G-17 | `release-gate --profile PLATFORM --candidate 15715ea` (informativo, antes de este informe) | FAIL "no current valid PLATFORM audit report": esperado; los informes anteriores (3477428, 5a60072) estan STALE porque el candidato difiere en governance/**. El mecanismo exact-commit funciona. El commit de release (este commit + este informe bajo .audit/reports/) tendra diferencia neta solo en `.audit/**`, por lo que este informe seria vigente para el |
| G-18 | `release.yml` (estatico) y runs | trigger por tag + pull_request; `concurrency` con `cancel-in-progress: false`; el paso publish hace `gh release create --draft` + `gh release edit --draft=false` sin comprobar si la release/tag ya existe. Runs 37346705404 y 37346705885, mismo push del tag rc.2 (ver F-09) |
| G-19 | rutas locales | `git grep -F 'C:\Users\jlbel'` y `'D:\proyectos'` en governance/execution/archive/ENTERPRISE-10-10-V1 y ADR-003 |

## H. Verificacion de afirmaciones de la documentacion

| Afirmacion | Fuente | Realidad | Resultado |
|---|---|---|---|
| PR #4 de template-starter mergeada como 9d711d0 | SESSION-CONTEXT, canary, matriz | G-14 | CONFIRMADO |
| Lock rc.2 (51ef185, digest 55b9589f...) en main de template-starter | canary, matriz | G-15 | CONFIRMADO |
| Ruleset template-starter-main con unico check `l3 / l3-consumer`, sin bypass | SESSION-CONTEXT, canary | G-16 | CONFIRMADO |
| rc.2 verify-release 22 checks PASS | RC2-READINESS, matriz | G-12 | CONFIRMADO |
| Borrador duplicado de rc.2 eliminado | matriz F-09 | G-13: ninguno | CONFIRMADO |
| main = 5afe752 en la matriz; Trivy success en 5afe752 | matriz | G-08 | CONFIRMADO |
| 0 alertas CodeQL abiertas | matriz | G-09 (el desglose fixed/dismissed no se recontó) | CONFIRMADO en lo esencial |
| M5.2 sin tildar, cierre = decision humana pendiente | roadmap | checkbox `[ ]` y texto explicito en el roadmap; ausente en SESSION-CONTEXT y matriz | HONESTO, INCOMPLETAMENTE PROPAGADO (F-01) |
| M5.1 y M5.4 tildados | roadmap | M5.1: rc.1 y rc.2 publicadas (G-13); M5.4: G-14..G-16 | CONFIRMADO |
| v3.0.0 NO publicada | SESSION-CONTEXT, matriz, RC2-READINESS, roadmap `[ ] M5.5` | G-13: no hay tag ni release v3.0.0; ningun documento del arbol afirma lo contrario (el extracto del plan maestro la define como objetivo) | CONFIRMADO |
| L3 post-merge reproducido a mano, sin runs en push | canary | No re-ejecutado (NO VERIFICADO); la matriz lo declara con ese limite | Declarado honestamente |

## I. Hallazgos

| ID | Tipo | Sev. | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|--:|
| F-01 | Contradiccion / omision doc | MINOR | (a) M5.2 queda `[ ]` con decision humana pendiente SOLO en el roadmap. SESSION-CONTEXT, que se declara fuente del "estado vigente", no tiene fila M5.2 ni M5.3 (tabla: M0-M4, M5.1, M5.1b, M5.4, M5.5, M6), y su fila M5.5 dice "falta auditoria PLATFORM vigente, release-gate y publicacion" sin mencionar que M5.2 sigue abierto; QUALITY-MATRIX tampoco tiene fila M5.2. Un lector de SESSION-CONTEXT concluiria que solo falta auditar y publicar. (b) SESSION-CONTEXT conserva "C-2, bloqueo externo... queda BLOCKED... No se modifica ese ruleset" (l.42) como hallazgo vigente, en contradiccion con su propia fila M5.4 (ruleset con unico check `l3 / l3-consumer`; PR mergeada). (c) SESSION-CONTEXT no recoge F-05 ni F-09, que solo constan en la matriz. Lo hecho en 15715ea (desmarcar M5.2 y no declararlo cerrado) es honesto y correcto; lo que falla es la propagacion | SESSION-CONTEXT.md (tabla y l.42); roadmap l.58; QUALITY-MATRIX l.26-27 | Q1.3 | -0.75 |
| F-02 | Limitacion conocida | MINOR | approvals=0, strict=false: el merge humano no lo impone el servidor | G-10 | Q6.2 (-0.75), Q8.3 (-0.5) | -1.25 |
| F-03 | NO VERIFICADO | MINOR | Revocacion de claves antiguas de ai-native-trust no verificable (sin API); QUALITY_SCORE 16 impide COMPLETO | SESSION-CONTEXT, matriz | Q7.1 | -0.75 |
| F-04 | Defecto | MINOR | Un solo ruleset (de rama): no hay ruleset de tags. El job `publish` tiene permisos de escritura (contents, id-token, attestations) sin Environment. Relevante para el tag `v3.0.0` inminente | G-10, G-18 | Q7.3 | -0.5 |
| F-05 | Defecto de pruebas | MINOR | Tests con repos git temporales fragiles bajo concurrencia por defecto en Windows (`Permission denied` al escribir `.git/objects`, tests distintos cada vez; las ejecuciones locales previas fallaron, esta pasada paso 657/657: intermitente). Ademas la salida muestra repetidos `warning: could not open directory 'Configuracion local/': Permission denied` (80 lineas con concurrencia 2; tambien con la de por defecto): algun test ejecuta git con cwd en el directorio de usuario (C:\Users\ASUS tiene `.git`), lo que indica falta de hermeticidad (hipotesis; origen exacto no localizado). Con `--test-concurrency=2` 657/657 y CI Linux+Windows verde, asi que no activa G3. No se corrigio | G-02, G-03 | Q5.3 | -1.0 |
| F-06 | Residuo | MINOR | legacy/ (165 ficheros rastreados), scripts/_deprecated (5) y rutas locales de usuario (`C:\Users\jlbel`, `D:\proyectos`) en governance/execution/archive y ADR-003 | G-19 | Q2.2, Q3.1 | -1.5 |
| F-07 | Duplicacion | MINOR | 4 validadores (duplicate-detection, historical-archive, legacy-inventory, obsolete-artifacts) existen 3 veces (12 ficheros en foundation, knowledge, template) | ls | Q3.3 | -0.75 |
| F-08 | Documentacion | MINOR | Troubleshooting general de una linea (README.md:79) | README | Q4.5 | -0.5 |
| F-09 | Defecto de automatizacion | MINOR | `release.yml` no es idempotente: el push del tag rc.2 disparo dos runs `Release` (37346705404 y 37346705885) y el segundo creo un borrador duplicado (id 403952697, SBOM distinto), borrado a mano; hoy no queda ninguno (G-13). `concurrency` con `cancel-in-progress: false` solo serializa; el paso publish no comprueba si la release existe. El riesgo se repite en el tag `v3.0.0` (estable e inmutable): tras el push hay que comprobar que no queda borrador duplicado ni release alterada. Es plano de control (cambio con HITL) | G-13, G-18, matriz | Q6.3 | -0.75 |

Total puntos perdidos: 0.75 + 1.25 + 0.75 + 0.5 + 1.0 + 1.5 + 0.75 + 0.5 + 0.75 = 7.75 -> 92.25.

Estado de F-02..F-09 (lista del encargo): todos ABIERTOS en el arbol; F-05 y F-09 constan solo en QUALITY-MATRIX (ver F-01c). Ninguno es BLOCKER/CRITICAL/MAJOR.

## J. Causas raiz

| ID | Causa raiz | Hallazgos | Impacto |
|---|---|---|---|
| R-1 | Un unico maintainer | F-02, F-03 | Q6.2, Q7.1, Q8.3 |
| R-2 | Documentacion de estado escrita a mano, sin fuente unica para M5.x | F-01 | Q1.3 |
| R-3 | Tests con repos temporales no aislados ni reintento; tests que tocan el directorio de usuario | F-05 | Q5.3 |
| R-4 | Monorepo con historico congelado y validadores copiados | F-06, F-07 | Q2.2, Q3.1, Q3.3 |
| R-5 | Workflow de release sin guarda de existencia ni ruleset de tags | F-09, F-04 | Q6.3, Q7.3 (cada criterio penalizado una sola vez) |

## K. Que sobra / que falta

Sobra: validadores triplicados (F-07); legacy/, _deprecated y rutas locales archivadas (F-06).
Falta para 100/100 (obligatorio, 7.75 puntos): cerrar F-01 a F-09. Sin puntos (SUGGESTION): resolver PR #48.

## L. NO VERIFICADO

| Item | Motivo | Impacto | Como verificar |
|---|---|---|---|
| Revocacion de claves de ai-native-trust | Accion humana, sin API | Q7.1 no COMPLETO (F-03) | Maintainer confirma en GitHub Apps |
| `release.yml` para `v3.0.0` | No se crea tag | Revision estatica + rc.2 observado | Tag y `verify-release v3.0.0 --expect-commit <sha>`; comprobar 0 borradores |
| Reviewer ACCEPT y rollback LF/CRLF del canary | No se repitio | Solo respaldado por el documento | Reejecutar `migrate revert` desde rc.2 |
| Origen de los warnings sobre `~` y de los `Permission denied` | No localizado | Hipotesis en F-05 | Bucle de ejecucion con trazas por test |

## M. Quality Gates

G1 BLOCKER: PASS. G2 CRITICAL: PASS. G3: no activado; durante esta auditoria todas las verificaciones esenciales (suite principal con concurrencia 2 y por defecto, validacion principal, CI del SHA, verify-release) terminaron correctamente. La inestabilidad local historica se trata como F-05 (MINOR, Q5.3). Aun con una lectura estricta de G3 el techo (89) seria superior al minimo efectivo de 88.

## N. Camino matematico a 100

Score 92.25. F-01 +0.75 (Q1.3); F-02 +1.25 (Q6.2 +0.75, Q8.3 +0.50); F-03 +0.75 (Q7.1); F-04 +0.50 (Q7.3); F-05 +1.00 (Q5.3); F-06 +1.50 (Q2.2 +0.75, Q3.1 +0.75); F-07 +0.75 (Q3.3); F-08 +0.50 (Q4.5); F-09 +0.75 (Q6.3). Suma 7.75; 92.25 + 7.75 = 100 (100/100 exigiria ademas confianza ALTA).

## O. Integridad matematica

Suma de subcriterios por area = valores de la matriz E; suma de areas = 92.25; sin N/A; maximos suman 100; sin gates; puntos recuperables = perdidos. Consistente.

## P. Veredicto para v3.0.0

Score 92.25 >= 90 (umbral nominal) y >= 88 (minimo efectivo). Condiciones: (1) el commit de release debe diferir de 15715ea solo en `.audit/**` para que `release-gate` reconozca este informe; (2) decision humana explicita sobre M5.2 antes de declarar M5.5 (el roadmap lo mantiene abierto); (3) tras el push del tag `v3.0.0`, comprobar que no queda borrador duplicado (F-09) y ejecutar `verify-release v3.0.0 --expect-commit <sha>`.
