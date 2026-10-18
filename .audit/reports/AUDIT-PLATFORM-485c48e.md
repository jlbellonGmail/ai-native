---
targetRepo: jlbellonGmail/ai-native
targetCommit: 485c48e53c80a8c217784fad1afe73aa946f1689
platform:
  version: v3.0.0-dev
  commit: 485c48e53c80a8c217784fad1afe73aa946f1689
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-07T03:30:00Z
scope: full repository at the exact commit, with focus on the delta 521d203..485c48e (PR #66, candidate v3.0.1)
score: 91.75
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 485c48e

## A. Identificacion

- Repositorio: jlbellonGmail/ai-native; ruta C:\Proyectos\ai-native; branch main; tag auditado: ninguno (VERSION=3.0.0-dev; ultima release publicada `v3.0.0` sobre afd375d, inmutable). El codigo de la PR #66 NO esta en ninguna release publicada: es el candidato `v3.0.1`.
- Commit: `git rev-parse HEAD` = `git rev-parse origin/main` = 485c48e53c80a8c217784fad1afe73aa946f1689. `git status --short` = 0 lineas antes y despues de todas las ejecuciones (suite completa incluida). Sin worktree, sin ramas, sin commits, sin escrituras en el repo. Los experimentos auxiliares (archivo de 521d203 y servidores locales de redireccion) se hicieron en un directorio temporal fuera del repo.
- Perfil: PLATFORM 1.2 (unico). QUALITY_SCORE 1.1, AUDIT_RULES 1.1, AUDIT_PROMPT 1.1; metodo 1.2. Node v26.7.0, Windows 11 Pro. Umbrales y pesos sin cambios; sin waivers.
- Fecha: 2026-10-07. Solo lectura sobre GitHub (GET).
- Evidencia previa: `.audit/reports/AUDIT-PLATFORM-521d203.md` (y 3477428, 15715ea, 5a60072) se usaron SOLO como plantilla de formato, pesos y para comprobar el cierre de sus hallazgos. No se reutiliza ninguna puntuacion ni evidencia: todos los comandos y consultas se repitieron sobre este commit.
- Nivel de confianza: MEDIA (revocacion de claves antiguas de `ai-native-trust` no verificable; `l3-consumer.yml` con el paso nuevo de setup-python no ejecutado en ningun run real de este repo; fragilidad residual de git en Windows sin causa raiz; cadena TypeScript de foundation/template no ejecutada).

## B. Veredicto ejecutivo

```
Score bruto: 91.75/100
Score final: 91.75/100
Quality Gate aplicado: ninguno (G1 PASS, G2 PASS, G3 PASS: ver M)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94 "Muy buen nivel"; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 10 MINOR)
Consistencia metodologica: PASS
>= 88 (minimo efectivo del gate de release, tolerancia 2): SI
>= 90 (umbral nominal): SI
```

Resumen: el delta 521d203..485c48e (20 ficheros; codigo: `runtime/bootstrap/remote.mjs`, `runtime/consumer/l3.mjs`, `l3-consumer.yml`, 2 perfiles Python, `profile.schema.json`, 2 tests) es pequeno y correcto. Intentos adversariales: no se encontro inyeccion de comandos via `productSetupCommand` (el comando es un literal del perfil de la plataforma fijada, sin interpolacion de datos del PR), ni fuga del token a hosts distintos de api.github.com (verificado empiricamente, tambien ante redirecciones), ni accion sin fijar (`actions/setup-python` por SHA completo = v5.6.0, contrastado con la API; `validate-actions-pinned` PASS). Los 3 tests nuevos fallan sin el parche y pasan con el (verificado). En el SHA exacto: 13 check-runs y 6 workflows en success; suite completa por el runner hermetico oficial 683/683; todos los validadores PASS. Hallazgos nuevos (ambos MINOR): la alerta de code scanning #26 esta ABIERTA y sin triar sobre la linea nueva de `remote.mjs` (patron identico a la #12, ya descartada como falso positivo), y el workflow reusable `l3-consumer.yml` (con el paso nuevo) no se ejecuta en ningun run real de este repo. Se cierra F-09 de la auditoria anterior (el guard de doble publicacion se ejercio en el run real del tag v3.0.0). Neto frente a 521d203: +0.75 (F-09) -0.50 (F-10) -0.75 (F-11) = -0.50 -> 91.75.

## C. Alcance y limitaciones

Inspeccionado: `git diff 521d203..485c48e` (20 ficheros) completo; `.github/workflows/l3-consumer.yml` completo; `runtime/consumer/l3.mjs`, `runtime/bootstrap/remote.mjs` y `cli.mjs` (flujo de revocaciones), `contracts/lock.schema.json` (patron de `profiles`), perfiles, tests `l3.test.mjs` y `release.test.mjs`, `governance/versioning/V3.0.1-PATCH.md`, SESSION-CONTEXT, QUALITY-MATRIX, SECRETS-BOUNDARY, ruleset, permisos de Actions, alertas, releases y el run real del tag v3.0.0.

Ejecutado: ver G. NO VERIFICADO: revocacion de claves antiguas de `ai-native-trust` (sin API); ejecucion real de `l3-consumer.yml` con setup-python y con la consulta de revocaciones autenticada dentro de un runner (es `workflow_call` sin llamador en este repo; la evidencia que cita V3.0.1-PATCH vive en repos GI externos y no se re-ejecuto); CLIs reales y OpenCode MCP (declarado `NOT_AVAILABLE_FROM_TOOL` por el repo); cadena `tsc/eslint/vitest` de foundation/template (requiere instalar dependencias en el repo: prohibido); suite con la concurrencia por defecto de `node --test`; semantica de redireccion de `fetch` en la version de Node de `ubuntu-latest` (se probo en Node v26.7.0 local).

## D. Contrato detectado

| ID | Capacidad | Clasificacion | Evidencia | Estado |
|---|---|---|---|---|
| C1 | platform.json coherente con lock schema; `profile.schema.json` admite `productSetupCommand` | OBLIGATORIO | `contracts/validate-contracts.mjs` PASS (15 schemas) | VERIFICADO |
| C2 | Paridad v2->v3 | OBLIGATORIO | parity: capabilities 74, tests-map 35/264, files-map 576, par-tests 95/95, unmapped=0 | VERIFICADO |
| C3 | Gate L3 de consumidor: perfil y comandos vienen de la plataforma fijada, nunca del PR | OBLIGATORIO | `l3.mjs`: `profileLock` = lock de BASE; `platformRoot` = checkout del commit fijado y verificado en el historial de la rama por defecto; test "profile comes from the BASE lock" y test nuevo de setup | VERIFICADO (G-15) |
| C4 | Credencial solo hacia api.github.com | OBLIGATORIO (nuevo en PR #66) | `apiHeaders()` con un unico uso (remote.mjs:105, URL literal); descargas de assets sin `authorization`; experimento de redireccion | VERIFICADO (Node 26.7.0 local; G-17, G-18) |
| C5 | Default deny MCP/politicas | OBLIGATORIO | `core/validate-core.mjs` PASS; tests de runtime/mcp en la suite 683/683 | VERIFICADO |
| C6 | HITL unico de merge, gates server-side | OBLIGATORIO | ruleset: 6 checks requeridos, approvals=0 (F-02) | PARCIAL (limite documentado) |
| C7 | Release publicable una sola vez por tag | OBLIGATORIO | run real del tag v3.0.0 (37465219009): paso "Refuse to publish twice for the same tag" success | VERIFICADO (G-13) |
| C8 | Offline real sin red (Ubuntu/Docker, Windows net-guard) | OBLIGATORIO (M5.2) | `pilot offline` ubuntu y windows en success en el SHA | VERIFICADO |
| C9 | Gate reusable `l3-consumer.yml` ejecutable en un runner limpio con perfil Python | OBLIGATORIO (defecto M6) | solo test estatico de forma (pin por SHA, orden de pasos); ningun run real de este repo | NO VERIFICADO en runner (F-11) |

## E. Matriz de puntuacion

| Area | Maximo | Obtenido | Estado |
|---|---|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR |
| Q2 Reutilizacion | 12 | 11.25 | MENOR |
| Q3 Arquitectura | 12 | 10.50 | MENOR |
| Q4 Documentacion/DX | 12 | 11.50 | MENOR |
| Q5 Calidad/Tests | 16 | 14.25 | MENOR |
| Q6 Git/CI/CD/Release | 16 | 15.25 | MENOR |
| Q7 Seguridad | 12 | 10.25 | MENOR |
| Q8 Gobernanza | 8 | 7.50 | MENOR |
| **TOTAL** | **100** | **91.75** | |

Aritmetica: 11.25 + 11.25 + 10.50 + 11.50 + 14.25 + 15.25 + 10.25 + 7.50 = 91.75. Sin N/A (aplicables = 100). Bruto = final.

## F. Detalle por subcriterio (COMPLETO 100%, MENOR 75%)

| ID | Max | Nivel | Obt. | Evidencia / hallazgo |
|---|--:|---|--:|---|
| Q1.1 | 3 | COMPLETO | 3 | README, AGENTS.md, SESSION-CONTEXT: proposito y alcance claros |
| Q1.2 | 3 | COMPLETO | 3 | capacidades presentes y ejecutadas; las `NOT_AVAILABLE_FROM_TOOL` declaradas como no cumplidas |
| Q1.3 | 3 | MENOR | 2.25 | F-01: QUALITY-MATRIX dice `v3.0.0` "NOT PUBLISHED" (l.25), F-09 "PARTIAL" (l.26) y "main = 5afe752" (l.3) cuando v3.0.0 esta publicada y el guard se ejercio |
| Q1.4 | 3 | COMPLETO | 3 | sin requisitos obligatorios rotos (F-02 es un limite declarado, puntuado en Q6.2/Q8.3) |
| Q2.1 | 3 | COMPLETO | 3 | pilot online y offline en ubuntu y windows en success |
| Q2.2 | 3 | MENOR | 2.25 | F-06: legacy/ (165 ficheros), `_deprecated`, rutas locales de usuario |
| Q2.3 | 3 | COMPLETO | 3 | lock + CONTRIBUTING + MIGRATION-V2-TO-V3; V3.0.1-PATCH explica por que no hay workaround local |
| Q2.4 | 3 | COMPLETO | 3 | CI Linux y Windows; runner hermetico sin rutas absolutas |
| Q3.1 | 3 | MENOR | 2.25 | F-06 (causa compartida) |
| Q3.2 | 3 | COMPLETO | 3 | cambio acotado: `apiHeaders` separado y exportado; `productTests` lee el perfil una vez; el gate no depende del PR |
| Q3.3 | 3 | MENOR | 2.25 | F-07: 4 validadores x 3 areas duplicados (12 ficheros) |
| Q3.4 | 3 | COMPLETO | 3 | SESSION-CONTEXT conciso; 75 ficheros de test, todos listados en CI |
| Q4.1 | 3 | COMPLETO | 3 | README funcional con verificacion de release; actualizado a v3.0.0 estable |
| Q4.2 | 3 | COMPLETO | 3 | comandos oficiales ejecutados con exito |
| Q4.3 | 2 | COMPLETO | 2 | validar/probar/liberar/verificar release/migrar documentados |
| Q4.4 | 2 | COMPLETO | 2 | CONTRIBUTING, SECURITY, CODEOWNERS |
| Q4.5 | 2 | MENOR | 1.5 | F-08: troubleshooting general sigue en una linea (README.md:79) |
| Q5.1 | 3 | COMPLETO | 3 | validadores, pin-check, doc-drift, integrity, ci-tests-listed, validate-evidence en CI |
| Q5.2 | 3 | MENOR | 2.25 | F-11: el workflow reusable `l3-consumer.yml` no tiene ejecucion de ensayo en este repo; solo un test estatico de forma |
| Q5.3 | 4 | MENOR | 3 | F-05: 683/683 por el runner oficial (concurrencia 2) y CI verde; residual de fragilidad local sin causa raiz; cadena TS fuera de CI y no ejecutada |
| Q5.4 | 3 | COMPLETO | 3 | 3 regresiones nuevas que FALLAN sin el parche y pasan con el (G-16); el test de token comprueba host, cabecera y ausencia de token |
| Q5.5 | 3 | COMPLETO | 3 | 6 checks requeridos con integration_id; todos success en el SHA |
| Q6.1 | 3 | COMPLETO | 3 | PRs #62-#66 mergeadas, commits convencionales, observaciones del reviewer atendidas en commits propios (67202db, 18e7d5f) |
| Q6.2 | 3 | MENOR | 2.25 | F-02: approvals=0, strict=false |
| Q6.3 | 3 | COMPLETO | 3 | 13 check-runs y 6 workflows success en el SHA; sin `continue-on-error` nuevo |
| Q6.4 | 3 | COMPLETO | 3 | el guard anti-doble-publicacion se ejercio en el run real del tag v3.0.0 (cierra F-09); release inmutable |
| Q6.5 | 2 | COMPLETO | 2 | paso "Build bundle (twice, must be byte-identical)" success en el run del tag |
| Q6.6 | 2 | COMPLETO | 2 | rollback/revert documentados y ejecutados (evidencia post-release v3.0.0) |
| Q7.1 | 3 | MENOR | 2.25 | secret scanning + push protection enabled, 0 alertas; F-03: revocacion de la clave antigua NO VERIFICADO |
| Q7.2 | 2 | MENOR | 1.5 | F-10: code scanning con 1 alerta ABIERTA (#26, medium) sin triar sobre este SHA; Dependabot 0 abiertas |
| Q7.3 | 2 | MENOR | 1.5 | F-04: sin ruleset de tags; job `publish` con escritura y sin Environment |
| Q7.4 | 2 | COMPLETO | 2 | `productSetupCommand` solo del perfil fijado; token solo a api.github.com; sin inyeccion alcanzable (G-15, G-17, G-18); `sha_pinning_required=true` |
| Q7.5 | 3 | COMPLETO | 3 | attestation, SBOM, revocaciones; la autenticacion del listado no relaja ninguna verificacion (sin token sigue fallando cerrado) |
| Q8.1 | 2 | COMPLETO | 2 | AGENTS.md/governance como fuente; V3.0.1-PATCH registra defectos, procedimiento y alcance |
| Q8.2 | 2 | COMPLETO | 2 | roles y limites; CODEOWNERS; Environment `ai-native-human-review` |
| Q8.3 | 2 | MENOR | 1.5 | F-02: merge humano = norma + deteccion, no imposicion servidor |
| Q8.4 | 2 | COMPLETO | 2 | informes ligados a SHA exacto; PR #66 con nota de gobernanza propia (docs-gate) |

## G. Ledger de verificacion

| ID | Verificacion | Comando/Metodo | Resultado | Estado |
|---|---|---|---|---|
| G-01 | Identidad y worktree | `git rev-parse HEAD origin/main`; `git status --short` | ambos = 485c48e53c80a8c217784fad1afe73aa946f1689; 0 lineas antes y despues | PASS |
| G-02 | Paridad | `node parity/validate-parity.mjs` | capabilities 74, tests-map 35/264, files-map 576, par-tests 95/95, unmapped=0; rc=0 | PASS |
| G-03 | Doc drift / pin / audit framework | `node runtime/docs/validate-doc-drift.mjs`; `node scripts/validate-actions-pinned.mjs`; `node runtime/audit/cli.mjs check` | PASS; "PASS: all actions in .github\workflows pinned by full SHA"; PASS (rc=0 los tres) | PASS |
| G-04 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | PASS: all 75 committed *.test.mjs files are run by a workflow | PASS |
| G-05 | Suite completa (UNA vez) | `node scripts/test-hermetic.mjs --log ...` (runner oficial, concurrencia 2) | 683 tests, 683 pass, 0 fail, 0 cancelled, 0 skipped, 75 ficheros, EXIT=0, 334 s | PASS |
| G-06 | Contratos, core, integridad, entrypoints, evidencia M5.2 | `contracts/validate-contracts.mjs`; `core/validate-core.mjs`; `runtime/status/validate-integrity.mjs`; `runtime/adapters/validate-entrypoints.mjs`; `evaluation/m52/validate-evidence.mjs` | todos PASS, rc=0 (15 schemas, 3 ficheros de datos, 6 perfiles) | PASS |
| G-07 | CI del SHA (check-runs) | `gh api repos/.../commits/<sha>/check-runs` | 13 check-runs completed/success: validators ubuntu+windows, legacy baseline x2, pin-check, pilot online x2, pilot offline x2, trivy-fs, analyze (actions), analyze (javascript-typescript), sbom | PASS |
| G-08 | CI del SHA (workflows) | `gh api "actions/runs?head_sha=<sha>"` | 6 workflows push success: Supply chain 37563151341, pilot 37563151236, SBOM 37563151251, Trivy 37563151293, CodeQL 37563151353, CI 37563151316 | PASS |
| G-09 | Code scanning | `gh api code-scanning/alerts?state=open` | 1 ABIERTA: #26 `js/file-access-to-http` (medium), `runtime/bootstrap/remote.mjs:105`, commit 485c48e, creada 2026-10-07T02:33Z. #12 (misma regla, linea previa 97) `dismissed` como falso positivo con motivo registrado; resto fixed/dismissed | HALLAZGO (F-10) |
| G-10 | Dependabot / secret scanning / PRs | `gh api dependabot/alerts?state=open`; `secret-scanning/alerts?state=open`; `gh pr list` | 0; 0; unica PR abierta #48 (actions/checkout 4.2.2 -> 7.0.1, deliberada) | PASS |
| G-11 | Rulesets y permisos | `gh api rulesets/24405506`; `actions/permissions` | unico ruleset `ai-native-main` (branch, active): required_approving_review_count=0, strict=false, 6 checks requeridos; sin ruleset de tags; `sha_pinning_required=true`, `allowed_actions=all` | VERIFICADO (F-02, F-04) |
| G-12 | Releases/tags | `gh release list`; `git ls-remote --tags origin`; `gh release view v3.0.0` | v3.0.0 Latest, isImmutable=true, tag anotado -> afd375d; rc.2, rc.1, alpha.1 pre-release; no existe tag v3.0.1 (es candidato) | VERIFICADO |
| G-13 | Guard de doble publicacion en un tag real | `gh run view 37465219009` (release.yml, tag v3.0.0) | pasos "Checkout (the tagged commit, for the pre-publish guard)", "Refuse to publish twice for the same tag", "Create draft release, upload assets, publish" y job verify = success; run previo 37375627747 cancelado | PASS (cierra F-09) |
| G-14 | Pin de actions/setup-python | `gh api repos/actions/setup-python/git/ref/tags/v5.6.0`; lectura de l3-consumer.yml | tag v5.6.0 = a26af69be951a213d495a4c3e4e4022e16d87065 = SHA del workflow; las acciones del workflow (checkout x2, setup-python, upload-artifact) van por SHA de 40 hex | PASS |
| G-15 | Trazabilidad de `productSetupCommand` | lectura de `l3.mjs:108-122`, `profile.schema.json`, `lock.schema.json`, `profiles/python-*.json` | el valor sale de `profiles/<id>.json` bajo `platformRoot` = checkout del commit fijado en el lock de BASE (workflow verifica ancestro de la rama por defecto); es el literal `python -m pip install --quiet . -r requirements-dev.txt`; ningun dato del PR se interpola; `shell:true` se aplica a esa cadena fija; `<id>` del lock de HEAD (primera adopcion) validado con `^[a-z][a-z0-9-]*$` | PASS |
| G-16 | Tests de PR #66 sin el parche | `git archive 521d203` en directorio temporal + `git init` + los 2 ficheros de test de 485c48e; `node --test runtime/consumer/l3.test.mjs runtime/release/release.test.mjs` | 14 tests, 11 pass, 3 FAIL: "productSetupCommand runs first...", "python profiles declare a setup command and l3-consumer.yml sets up a pinned Python", y release.test.mjs (import `apiHeaders` inexistente). Coincide con V3.0.1-PATCH ("3 tests que fallan sin el parche") | PASS |
| G-17 | Fuga de token por redireccion | script temporal fuera del repo: servidor A responde 302 hacia servidor B (otro origen); `fetch(urlA, {headers: apiHeaders({GH_TOKEN:"SECRET"})})` con el `apiHeaders` real de remote.mjs | A recibe `Bearer SECRET`; B recibe `authorization: null`. Salida: `[{"port":"A","auth":"Bearer SECRET"},{"port":"B","auth":null}]` (undici elimina la cabecera en redireccion cross-origin) | PASS (Node v26.7.0; sin cobertura en test del repo, S-02) |
| G-18 | Consumidores de `apiHeaders` y descargas | `grep fetch/headers/redirect` en runtime/bootstrap y release | un unico uso (remote.mjs:105, URL literal `https://api.github.com/repos/${slug}/releases`); `getBytes` (assets/bundle) solo envia `user-agent`; `slug` validado por `^github:[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$` y host constante | PASS |
| G-19 | Alcance del token en el workflow | lectura de l3-consumer.yml | `GH_TOKEN` solo en el paso "Bootstrap sync" (permissions `contents: read`); el paso "L3 consumer gate" (que ejecuta setup y tests del consumidor) NO recibe el token; `persist-credentials: false` en ambos checkouts | PASS |
| G-20 | Workflows: permisos y fallos silenciados | `git diff` del delta; lectura | `permissions: contents: read` top-level en l3-consumer.yml; sin `continue-on-error` nuevo | PASS |
| G-21 | Secretos en el arbol | revision del delta | sin credenciales; los tokens de test son literales sinteticos (`t1`, `t2`, `tok`) | PASS |
| G-22 | Residuos | `git ls-files`; `git grep -lF` | legacy 165 ficheros; `_deprecated` en 125 rutas; `C:\Users\jlbel` en 6 ficheros, `D:\proyectos` en 21; 3 copias de validate-duplicate-detection | HALLAZGO (F-06, F-07) |
| G-23 | Documentacion de estado | `git grep "pendiente de merge\|cierra al mergear\|sobre main = "`; lectura de QUALITY-MATRIX l.3, 25, 26 | SESSION-CONTEXT, roadmap y M5-2-MATRIX ya coherentes (la parte de 521d203 queda cerrada); QUALITY-MATRIX sigue con `v3.0.0` NOT PUBLISHED, guard F-09 PARTIAL y `main = 5afe752` | HALLAZGO (F-01) |
| G-24 | Release-gate del propio informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 485c48e53c80a8c217784fad1afe73aa946f1689 --reports <dir temporal con este informe> --root .` | PASS, rc=0 (salida: `PASS`) | PASS |

## H. Hallazgos

Estado de los hallazgos de la auditoria 521d203 (verificado ahora): F-09 CERRADO (G-13). F-01 PARCIALMENTE cerrado: SESSION-CONTEXT/roadmap/M5-2-MATRIX ya son coherentes, pero QUALITY-MATRIX sigue desfasada (F-01 actual). F-02, F-03, F-04, F-05, F-06, F-07, F-08 siguen ABIERTOS sin cambio. Nuevos: F-10, F-11.

| ID | Tipo | Sev. | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|--:|
| F-01 | CONTRADICTORIO | MINOR | `governance/quality/QUALITY-MATRIX.md` desfasada: l.3 "sobre main = 5afe752"; l.25 `v3.0.0` "NOT PUBLISHED"; l.26 idempotencia (F-09) "PARTIAL (no probado en un tag real)" cuando v3.0.0 esta publicada (inmutable) y el guard corrio en su run real | G-23, G-12, G-13 | Q1.3 | -0.75 |
| F-02 | RIESGO | MINOR | approvals=0, strict=false: el merge humano no lo impone el servidor (un solo maintainer, limite conocido) | G-11 | Q6.2, Q8.3 | -1.25 |
| F-03 | NO VERIFICADO | MINOR | Revocacion de las claves antiguas de `ai-native-trust` no verificable (la API no expone claves de una App; SECRETS-BOUNDARY:42 lo reconoce) | SECRETS-BOUNDARY | Q7.1 | -0.75 |
| F-04 | INCOMPLETO | MINOR | Sin ruleset de tags y `publish` (contents/id-token/attestations write) sin Environment | G-11, G-12 | Q7.3 | -0.50 |
| F-05 | RIESGO / NO VERIFICADO | MINOR | (a) fragilidad local en Windows de git en repos temporales (residual sin causa raiz; mitigada con concurrencia 2; hoy 683/683 con el runner oficial); (b) cadena `tsc/eslint/vitest` de foundation/template fuera de CI y no ejecutada | G-05 | Q5.3 | -1.00 |
| F-06 | SOBRA | MINOR | legacy/ (165), `_deprecated` y rutas locales de usuario en ficheros de gobernanza archivada | G-22 | Q2.2, Q3.1 | -1.50 |
| F-07 | DUPLICADO | MINOR | 4 validadores x 3 areas duplicados | G-22 | Q3.3 | -0.75 |
| F-08 | FALTA | MINOR | Troubleshooting general de una linea (README.md:79) | README | Q4.5 | -0.50 |
| F-10 | RIESGO | MINOR | Alerta de code scanning #26 (`js/file-access-to-http`, medium) ABIERTA y sin triar sobre `remote.mjs:105`, la linea de `fetchRevocations` que ahora usa `apiHeaders()`. Mismo patron que la #12 (linea 97 anterior), descartada como falso positivo con justificacion (host constante, slug validado, sin contenido de fichero en la peticion). Mi analisis (G-17, G-18) coincide con que es un falso positivo, pero el repo mantenia 0 alertas abiertas y ahora tiene 1 sin disposicion registrada | G-09 | Q7.2 | -0.50 |
| F-11 | NO VERIFICADO | MINOR | El workflow reusable `l3-consumer.yml` (con el paso nuevo `actions/setup-python`) no lo llama ningun workflow de este repo y `gh run list --workflow l3-consumer.yml` esta vacio: la unica garantia en el repo es un test estatico (regex del `uses:` y orden de pasos). La evidencia de funcionamiento real (run del gate en un repo GI) es externa y no verificable aqui. Misma causa raiz que F-09 antes de v3.0.0 | G-14; `git grep l3-consumer -- .github` | Q5.2 | -0.75 |

Total puntos perdidos: 0.75 + 1.25 + 0.75 + 0.50 + 1.00 + 1.50 + 0.75 + 0.50 + 0.50 + 0.75 = 8.25 -> 91.75.

### Detalle por hallazgo

**F-01.** Impacto: un lector de la matriz de calidad creeria que `v3.0.0` no esta publicada y que el guard de release no se ha probado. Causa raiz R-2. Correccion minima: actualizar l.3, l.25 y l.26 de QUALITY-MATRIX con el estado real (v3.0.0 publicada sobre afd375d, run 37465219009). Verificacion: `git grep -n "NOT PUBLISHED\|5afe752" governance/quality` vacio y `validate-doc-drift` verde. Recupera +0.75.

**F-02.** Causa raiz R-1. Correccion: segunda identidad humana con `required_approving_review_count>=1` y `strict_required_status_checks_policy=true`, o decision registrada que cambie el contrato (sin waiver). Verificacion: `gh api rulesets/24405506`. Recupera +1.25 (Q6.2 +0.75, Q8.3 +0.50).

**F-03.** Correccion: el maintainer revoca las claves antiguas y lo registra con fecha verificable en SECRETS-BOUNDARY. Recupera +0.75.

**F-04.** Correccion: ruleset de tags `v*` (creacion restringida, sin bypass) y `environment:` en `publish`. Verificacion: `gh api rulesets` lista target=tag. Recupera +0.50.

**F-05.** Correccion minima: demostrar la causa del `Permission denied` o reintento acotado; job CI de `tsc --noEmit`/tests TS o declarar esas areas fuera del alcance. Recupera +1.00.

**F-06.** Correccion: mover legacy/ y `_deprecated` a un tag/rama de archivo o declararlos en un manifiesto con test, y anonimizar rutas locales. Recupera +1.50.

**F-07.** Correccion: un unico validador parametrizado por area. Recupera +0.75.

**F-08.** Correccion: seccion de troubleshooting con los estados de `status` (RESTART_REQUIRED, DEGRADED_READONLY, REVOKED...) y su accion. Recupera +0.50.

**F-10.** Impacto: una alerta abierta en la rama por defecto (medium) sin disposicion. No explotable segun G-17/G-18. Causa raiz R-6 (CodeQL no reconoce que el origen del dato es el lock validado por regex; ya ocurrio con la #12). Correccion minima: descartar la #26 como `false positive` con el mismo motivo que la #12 y registrarlo en `governance/security/ALERTS-TRIAGE-*.md` (accion del maintainer, requiere permiso sobre code scanning), o reestructurar la construccion de la URL para que CodeQL no vea el flujo. Verificacion: `gh api code-scanning/alerts?state=open` devuelve `[]`. Recupera +0.50. Recomendado ANTES de etiquetar v3.0.1.

**F-11.** Impacto: si el paso setup-python o su orden respecto al gate fallara en un runner real (version de Python, `pip`, `requirements-dev.txt` ausente en el consumidor), solo se sabria en un repo consumidor. Causa raiz R-5. Correccion minima: un workflow de este repo (PR/`workflow_dispatch`) que llame a `./.github/workflows/l3-consumer.yml` contra un fixture consumidor Python minimo y exija `product: PASS` en `l3-result`; o aportar como evidencia versionada el run real del gate de M6 con su SHA. Recupera +0.75. Recomendado antes de v3.0.1 (es el cambio que se publica).

### H-bis. Revision adversarial del delta 521d203..485c48e

1. **Inyeccion de comandos via `productSetupCommand`.** El comando es `JSON.parse(profiles/<id>.json).productSetupCommand`, ejecutado con `shell:true` y `cwd: project`. `<id>` sale de `lock.profiles[0]` del lock de BASE (o del de HEAD solo en primera adopcion, validado por `readLock` contra `lock.schema.json`: `^[a-z][a-z0-9-]*$`, sin `/` ni `.`), y la ruta se resuelve bajo el checkout del commit fijado (verificado como ancestro de la rama por defecto). Ningun campo del PR llega a la cadena. No hay inyeccion alcanzable. Observaciones sin puntos: (a) el lock de BASE se parsea con `JSON.parse` sin revalidar el patron del id (S-01); irrelevante en la practica: ese contenido ya fue mergeado y la ruta solo puede apuntar a un JSON dentro del checkout fijado de la plataforma; (b) `pip install . -r requirements-dev.txt` ejecuta codigo del consumidor (build backend / `setup.py`) igual que `pytest` ya lo hacia: la superficie no crece, y ambos corren sin token y con `contents: read`.
2. **Comando controlado por el consumidor.** No: el consumidor solo controla `requirements-dev.txt` y el codigo del proyecto, que `pytest` ya ejecutaba. El test existente "the product-test profile comes from the BASE lock" sigue verde y el nuevo cubre orden y fallo cerrado (setup que sale con 4 -> `FAIL`, tests no ejecutados).
3. **Fuga del token a hosts distintos de api.github.com.** `apiHeaders` tiene un unico llamador con URL literal `https://api.github.com/...`; el slug esta validado y no puede alterar el host. Las descargas de assets (`browser_download_url`, `github.com/.../releases/download`) no llevan `authorization` aunque la API devolviera una URL de otro host. Redirecciones: `fetch` sigue por defecto; Node/undici descarta `authorization` en redireccion cross-origin (G-17, probado con servidores locales). Es comportamiento de la implementacion de fetch, no una garantia del codigo ni del test del repo (S-02). `GH_TOKEN` solo existe en el paso sync (G-19).
4. **Acciones sin fijar.** `actions/setup-python@a26af69b...` coincide con el tag v5.6.0 en la API (G-14); `validate-actions-pinned` PASS; `sha_pinning_required=true` a nivel de repo.
5. **Alcance real del arreglo.** Los parches de runtime (`l3.mjs`, `remote.mjs`, perfiles) se ejecutan desde el commit de plataforma fijado en el lock del consumidor, no desde el SHA del workflow: los consumidores fijados a `v3.0.0` NO reciben `productSetupCommand` ni el token en revocaciones hasta fijar `v3.0.1`; solo el paso setup-python viaja con el SHA del workflow. V3.0.1-PATCH lo reconoce ("hasta entonces los consumidores GI quedan fijados a v3.0.0 y su gate L3 no es verde en repos Python") (S-03).
6. **Documentacion.** V3.0.1-PATCH.md es veraz en lo contrastable: 3 tests que fallan sin el parche (G-16), procedimiento igual a rc.2, no modifica v3.0.0. La cita del intento 1 del run 37482275406 (403 en `pilot online (windows-latest)`) no se re-verifico: NO VERIFICADO, sin impacto en puntos.

Sugerencias (0 puntos): S-01 revalidar el patron del id de perfil del lock de BASE en `productTests`; S-02 `redirect: "manual"` o un test de redireccion en `fetchRevocations` para no depender del comportamiento implicito de fetch; S-03 una linea explicita sobre que parte del arreglo viaja con el SHA del workflow y cual con el pin de plataforma; S-04 setup-python sin `cache`/version de pip fijada: aceptable, solo reproducibilidad.

## I. Causas raiz

| ID | Causa raiz | Hallazgos | Impacto |
|---|---|---|---|
| R-1 | Un unico maintainer | F-02, F-03 | Q6.2, Q7.1, Q8.3 |
| R-2 | Documentacion de estado escrita a mano y no cerrada tras cada merge | F-01 | Q1.3 |
| R-3 | Tests con repos git temporales en Windows sin causa raiz demostrada; areas heredadas fuera de la CI raiz | F-05 | Q5.3 |
| R-4 | Monorepo con historico congelado y validadores copiados | F-06, F-07 | Q2.2, Q3.1, Q3.3 |
| R-5 | Workflow reusable o de solo-tag sin ensayo propio | F-11 (F-04 parcial) | Q5.2 |
| R-6 | Heuristica de CodeQL sobre un flujo ya triado una vez | F-10 | Q7.2 |

## J. Que sobra

CONSOLIDAR los 12 validadores triplicados (F-07); REVISAR legacy/, `_deprecated` y rutas locales archivadas (F-06). Todo lo demas inspeccionado en el delta tiene uso verificable.

## K. Que falta

### OBLIGATORIO PARA 100/100

Cerrar F-01 a F-08, F-10 y F-11 (8.25 puntos).

### MEJORAS OPCIONALES (0 puntos)

S-01 a S-04; resolver la PR #48 con nota de gobernanza; segunda ejecucion de las CLIs reales en un runner Linux de CI.

## L. NO VERIFICADO

| Item | Motivo | Impacto | Como verificar |
|---|---|---|---|
| Revocacion de claves de `ai-native-trust` | Accion humana, sin API | Q7.1 (F-03) | El maintainer confirma en GitHub Apps y lo registra |
| Ejecucion real de `l3-consumer.yml` con setup-python / consulta autenticada | Sin llamador ni runs en este repo | Q5.2 (F-11) | Fixture consumidor Python en CI de este repo, o evidencia versionada del run de M6 |
| Cita del 403 en el intento 1 del run 37482275406 | Log del intento 1 no consultado | Ninguno | `gh run view 37482275406 --attempt 1 --log` |
| Semantica de redireccion de fetch en la Node de `ubuntu-latest` | Probado solo en Node v26.7.0 local | Q7.4 (sin puntos) | Repetir G-17 en el runner |
| Causa raiz del `Permission denied` intermitente de git | No reproducido con concurrencia por defecto | Q5.3 (F-05) | Bucle con trazas y exclusion antivirus |
| Cadena `tsc/eslint/vitest` de foundation/template | Requiere instalar dependencias en el repo | Q5.3 (F-05b) | Job de CI o clon aparte |
| OpenCode MCP y `.codex/config.toml` | `NOT_AVAILABLE_FROM_TOOL` | Ninguno | Corrida que observe gateway/config |

## M. Quality Gates

G1 BLOCKER: PASS (0). G2 CRITICAL: PASS (0). G3 verificacion esencial: PASS: bootstrap/validacion principal/CI principal pasan y la suite principal pasa 683/683 por el runner oficial. Constancia de transparencia: la suite con la concurrencia por defecto de `node --test` no se repitio; el residual F-05a no se observo. No se activa ningun gate; con una lectura estricta de G3 el techo seria 89, que sigue siendo >= 88.

## N. Camino matematico a 100

Score actual 91.75. F-01 +0.75 (Q1.3); F-02 +1.25 (Q6.2 +0.75, Q8.3 +0.50); F-03 +0.75 (Q7.1); F-04 +0.50 (Q7.3); F-05 +1.00 (Q5.3); F-06 +1.50 (Q2.2 +0.75, Q3.1 +0.75); F-07 +0.75 (Q3.3); F-08 +0.50 (Q4.5); F-10 +0.50 (Q7.2); F-11 +0.75 (Q5.2). Suma 8.25; 91.75 + 8.25 = 100. Aplicables = 100, sin normalizacion.

## O. Plan de remediacion (solo MINOR; no hay BLOCKER/CRITICAL/MAJOR)

1. F-10 (maintainer, minutos): descartar la alerta #26 con la misma justificacion que la #12 y registrar el triaje, o reestructurar la construccion de la URL. +0.50. Antes de etiquetar v3.0.1.
2. F-11 (agente): workflow de ensayo que llame a `l3-consumer.yml` con un fixture Python, o evidencia versionada del run de M6. +0.75. Antes de v3.0.1.
3. F-01 (agente): sincronizar QUALITY-MATRIX. +0.75.
4. F-05, F-06, F-07, F-08 (agente). +3.75.
5. F-02, F-03, F-04 (humano): segunda identidad y `strict`, revocacion de claves, ruleset de tags y Environment de publish. +2.50.

## P. Segunda pasada de 100

N/A (score < 100).

## Q. Certificacion final

Es hoy una PLATAFORMA PROFESIONAL DE REFERENCIA (100/100)? NO. Nivel "muy buen nivel": 91.75/100, 0 BLOCKER/CRITICAL/MAJOR, 10 MINOR abiertos. El candidato v3.0.1 (PR #66) es tecnicamente solido: sin inyeccion alcanzable, sin fuga de token verificable, acciones fijadas, regresiones reales. Cumple el umbral nominal de release (>= 90) y el minimo efectivo (>= 88). Este informe certifica solo el commit 485c48e (o un descendiente cuya diferencia neta sea unicamente `.audit/**` y `STATUS.md`). Si v3.0.1 se etiqueta sobre un SHA que cambie codigo, exigira un informe nuevo ligado a ese SHA.
