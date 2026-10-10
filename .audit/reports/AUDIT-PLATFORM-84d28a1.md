---
targetRepo: jlbellonGmail/ai-native
targetCommit: 84d28a16689540e922828b9794446572aee3f76c
platform:
  version: v3.0.0-dev
  commit: 84d28a16689540e922828b9794446572aee3f76c
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-10T05:56:00Z
scope: full repository at the exact commit (candidate v3.0.2, post-merge of PR #79), with focus on the delta 485c48e..84d28a1
score: 93.25
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 84d28a1 (candidata v3.0.2)

## A. Identificacion

- Repositorio: jlbellonGmail/ai-native. Rama: main. Commit auditado: `84d28a16689540e922828b9794446572aee3f76c` (merge de la PR #79). Tag: ninguno (VERSION=`3.0.0-dev`; ultima release publicada `v3.0.1`, inmutable). **v3.0.2 NO esta publicada**: se audita una CANDIDATA (release-gate previo a tag), no un release.
- Ruta: worktree DETACHED limpio en `/tmp/aud84` (`C:\Users\ASUS\AppData\Local\Temp\aud84`), creado con `git worktree add --detach` desde el repo local sin tocar ese checkout. `git rev-parse HEAD` = `84d28a16689540e922828b9794446572aee3f76c`; `git status --short` = 0 lineas antes y despues de todas las ejecuciones.
- Perfil: PLATFORM 1.2 (unico). QUALITY_SCORE 1.1, AUDIT_RULES 1.1, AUDIT_PROMPT 1.1; auditMethod 1.2. Node v26.10.0, Windows 11 Pro 10.0.26200, Git Bash.
- Fecha: 2026-10-10T05:56:00Z. GitHub solo con GET (`gh api`, `gh run list`). Sin push, merge, comentarios, tags, releases ni cambios de configuracion; no se descarto ninguna alerta.
- Independencia: los informes `.audit/reports/AUDIT-PLATFORM-485c48e.md` y `521d203` se usaron SOLO como plantilla de formato y para detectar regresiones/cierres. Ninguna puntuacion ni evidencia se reutiliza: todo comando se reejecuto sobre este commit.

## B. Veredicto ejecutivo

```
Score bruto: 93.25/100
Score final: 93.25/100
Quality Gate aplicado: ninguno (G1 PASS, G2 PASS, G3 PASS: ver M)
Confianza: MEDIA
Estado: APTO (banda 90-94 "Muy buen nivel"; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 10 MINOR abiertos, 9 con puntos propios; F-09 comparte la deduccion de F-01)
Consistencia metodologica: PASS
>= 90 (umbral nominal): SI
>= 88 (minimo efectivo del gate de release, tolerancia 2): SI
```

Veredicto de release-gate para la CANDIDATA v3.0.2: **PASA** el umbral de plataforma objetivo (>= 90: 93.25), el minimo efectivo (>= 88) y 0 BLOCKER/CRITICAL/MAJOR. Este informe no autoriza por si mismo ningun tag: los pasos 3 y 4 de `V3.0.2-PATCH.md` (tag anotado, release inmutable, `verify-release`) siguen pendientes y son del owner.

Resumen: el delta (32 commits desde `0e439ec`, 205 ficheros, +3314/-15514) hace lo que declara. Las brechas 1/2/6/7 del migrador estan implementadas y protegidas por regresiones que, **comprobado por mutacion**, fallan cuando se desactiva el codigo (ver G-18). El retiro de `legacy/template-v2` (165) y de las tres `_deprecated` (120) es verificable byte a byte contra `0e439ec` (0 discrepancias de sha256 sobre 285 ficheros, agregados coinciden), sin referencias operativas colgantes, parity `UNMAPPED=0`, y el job `legacy-template-baseline` retirado no afecta a los 6 checks requeridos del ruleset. #78 (checkout 7.0.1 fijado por SHA completo, imagen pilot por digest con coherencia sin red) es correcta. Cierran F-06 (legacy/_deprecated) y F-07 (validadores duplicados) del informe previo. Persisten MINOR heredados (F-01..F-05, F-08, F-11) y aparece la alerta de code scanning #27 abierta en main, que evaluo como falso positivo de CodeQL, no como vulnerabilidad, pero sin disposicion registrada. La documentacion vigente tiene afirmaciones desfasadas respecto a la realidad (F-09).

## C. Alcance y limitaciones

Inspeccionado: arbol completo del commit (1245 ficheros), `audit/**`, `contracts/`, `core/`, `runtime/**`, `parity/`, `profiles/`, `evaluation/`, `.github/workflows/` (14), `governance/**` (SESSION-CONTEXT, V3.0.2-PATCH, M7-CLOSURE, M7-INVENTORY, FINAL-CONSOLIDATION, CODEQL-ALERT-27, ACTIONS-CHECKOUT-7.0.1, QUALITY-MATRIX) y el estado remoto (runs, rulesets, code scanning, Dependabot, secret scanning, releases, environments).

Ejecutado (resultados en G): validadores del repo, suites `node --test` de migrate, gates, consumer, bootstrap, release, audit, m52 y de los validadores, la suite hermetica oficial completa, verificacion criptografica de los manifiestos de retiro contra `git show 0e439ec:<ruta>` (exhaustiva, no muestreo), mutacion de dos puntos del migrador, barrido de enlaces Markdown y de referencias colgantes, `git diff --check`.

No verificado (detalle en L): publicacion de v3.0.2 (no existe), revocacion de claves antiguas de `ai-native-trust`, cadena `tsc/eslint/vitest` de foundation/template, ejecucion real de `l3-consumer.yml` con los perfiles nuevos en un repo consumidor, brechas 3/4/5 (DEFER, fuera de alcance por declaracion), contenido del advisory GHSA-6w46-j5rx-g56g, CLIs reales (Claude/Codex/OpenCode) y el `release.yml` sobre un tag v3.0.2.

Branch protection: la API clasica devuelve 404 "Branch not protected"; la proteccion es por **ruleset** (ver G-08). No es un defecto: el control existe por el mecanismo moderno.

## D. Contrato detectado

| ID | Capacidad/Requisito | Clasificacion | Fuente | Estado |
|---|---|---|---|---|
| C-01 | Brecha 1: el migrador conserva archivos de plataforma que el perfil necesita (`keptByProfile`, `requiredFiles`) | OBLIGATORIO (candidata) | V3.0.2-PATCH | VERIFICADO (tests + mutacion) |
| C-02 | Brecha 2: perfiles `python-app`/`python-scripts`, `lock.productDir` | OBLIGATORIO (candidata) | V3.0.2-PATCH | VERIFICADO (tests l3 17/17; validate-contracts) |
| C-03 | Brecha 6: el migrador nunca crea/edita `pyproject.toml`/ruff/setup | OBLIGATORIO | V3.0.2-PATCH | IMPLEMENTADO / test de no-regresion (limite declarado) |
| C-04 | Brecha 7: `guard-develop-branch.yml` solo se retira con proteccion verificada; `NO_PROTECTION_GAP` | OBLIGATORIO | V3.0.2-PATCH, `ruleset-guard.mjs` | VERIFICADO (tests + mutacion) |
| C-05 | Brechas 3/4/5 | DEFER | M7-PLATFORM-GAPS | NO IMPLEMENTADAS (limitacion declarada, no hallazgo) |
| C-06 | Retiro de `legacy/template-v2` y 3 `_deprecated` con manifiestos sha256 | OBLIGATORIO | FINAL-CONSOLIDATION | VERIFICADO |
| C-07 | Parity `UNMAPPED=0` tras el borrado | OBLIGATORIO | `parity/validate-parity.mjs` | VERIFICADO (74/35/576, 95/95) |
| C-08 | #78: acciones por SHA completo, imagen pilot por digest, coherencia sin red | OBLIGATORIO | ACTIONS-CHECKOUT-7.0.1 | VERIFICADO |
| C-09 | Release verificable, SBOM, attestation, revocaciones (v3.0.1 publicada) | OBLIGATORIO | README, release.yml | DOCUMENTADO/ya auditado; v3.0.2 NO publicada |
| C-10 | Doc drift verde, una fuente por hecho | OBLIGATORIO | `validate-doc-drift` | VERIFICADO (PASS) pero con afirmaciones obsoletas fuera de su alcance (F-09) |
| C-11 | Merge humano unico, gates server-side | OBLIGATORIO | HITL-MERGE-POLICY, rulesets | PARCIAL: approvals=0 (F-02, limite declarado) |
| C-12 | No es gate de merge (`isMergeGate:false`) | OBLIGATORIO | schema | VERIFICADO |

## E. Matriz de puntuacion

| Area | Maximo | Obtenido | Estado |
|---|---|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR |
| Q2 Reutilizacion | 12 | 11.25 | MENOR |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentacion/DX | 12 | 11.50 | MENOR |
| Q5 Calidad/Tests | 16 | 14.25 | MENOR |
| Q6 Git/CI/CD/Release | 16 | 15.25 | MENOR |
| Q7 Seguridad | 12 | 10.25 | MENOR |
| Q8 Gobernanza | 8 | 7.50 | MENOR |
| **TOTAL** | **100** | **93.25** | |

Aritmetica: 11.25 + 11.25 + 12.00 + 11.50 + 14.25 + 15.25 + 10.25 + 7.50 = 93.25. Maximos: 12+12+12+12+16+16+12+8 = 100. Sin N/A (aplicables = 100); bruto = normalizado = final. Perdidas por area: Q1 0.75, Q2 0.75, Q3 0, Q4 0.50, Q5 1.75, Q6 0.75, Q7 1.75, Q8 0.50 = 6.75; 100 - 6.75 = 93.25.

## F. Detalle por subcriterio (COMPLETO 100%, MENOR 75%)

| ID | Max | Nivel | Obt. | Evidencia / hallazgo |
|---|--:|---|--:|---|
| Q1.1 | 3 | COMPLETO | 3 | README, AGENTS.md, V3.0.2-PATCH: proposito, alcance y estado CANDIDATE claros |
| Q1.2 | 3 | COMPLETO | 3 | capacidades de la candidata presentes y ejecutadas (G-04, G-18); brechas 3/4/5 declaradas como no implementadas |
| Q1.3 | 3 | MENOR | 2.25 | F-01 (QUALITY-MATRIX desfasada, arrastrada) y F-09 (SESSION-CONTEXT/M7-CLOSURE con afirmaciones obsoletas): causa raiz compartida, una sola deduccion |
| Q1.4 | 3 | COMPLETO | 3 | sin requisitos obligatorios rotos; F-02 es limite declarado, puntuado en Q6.2/Q8.3 |
| Q2.1 | 3 | COMPLETO | 3 | pilot online/offline en ubuntu y windows en success sobre el SHA (G-09); `bootstrap` 24/24 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 residual: `legacy/` y `_deprecated` retirados (G-12); quedan rutas locales `C:\Proyectos\...` en 3 documentos vigentes de `governance/cleanup/` (M7-CLOSURE, M7-INVENTORY, FINAL-CONSOLIDATION) |
| Q2.3 | 3 | COMPLETO | 3 | V3.0.2-PATCH documenta compatibilidad, pasos pendientes y comportamiento nuevo del migrador |
| Q2.4 | 3 | COMPLETO | 3 | CI Linux y Windows; lockstep de perfiles; sin rutas absolutas en codigo |
| Q3.1 | 3 | COMPLETO | 3 | 1245 ficheros, estructura coherente; cerrado el arbol heredado |
| Q3.2 | 3 | COMPLETO | 3 | `command-refs.mjs`, `ruleset-guard.mjs`, `protection-contract` separados de `migrate.mjs`; fail-closed |
| Q3.3 | 3 | COMPLETO | 3 | F-07 anterior CERRADO: 12 validadores duplicados eliminados (`find validate-*.mjs`), codigo muerto de `legacy/` retirado de doc-drift y test-hermetic |
| Q3.4 | 3 | COMPLETO | 3 | 78 `*.test.mjs`, todos en CI (`validate-ci-tests-listed` PASS) |
| Q4.1 | 3 | COMPLETO | 3 | README funcional, sin referencias a ficheros retirados salvo la nota de M7 |
| Q4.2 | 3 | COMPLETO | 3 | comandos oficiales ejecutados con exito desde un worktree limpio |
| Q4.3 | 2 | COMPLETO | 2 | validar/probar/liberar/verificar/migrar documentados |
| Q4.4 | 2 | COMPLETO | 2 | CONTRIBUTING, SECURITY, CODEOWNERS, nota sobre `_deprecated`/`legacy` actualizada |
| Q4.5 | 2 | MENOR | 1.5 | F-08: troubleshooting general sigue en una linea (README.md:78). Compensa parcialmente la seccion de estabilidad de V3.0.2-PATCH |
| Q5.1 | 3 | COMPLETO | 3 | validadores, pin-check, doc-drift, integrity, ci-tests-listed, validate-evidence en CI y ejecutados aqui |
| Q5.2 | 3 | MENOR | 2.25 | F-11: `l3-consumer.yml` no lo llama ningun workflow de este repo (`gh run list --workflow l3-consumer.yml` vacio); los perfiles `python-app`/`python-scripts` y `productDir` solo tienen tests unitarios/estaticos |
| Q5.3 | 4 | MENOR | 3 | F-05: la suite hermetica oficial paso 719/719 en UNA corrida (310 s, concurrencia 2), pero una corrida no satisface el gate propio de 3 consecutivas y la documentacion admite rojos intermitentes por entorno sobre el codigo final; cadena `tsc/eslint/vitest` fuera de CI y no ejecutada |
| Q5.4 | 3 | COMPLETO | 3 | G-18: desactivando `need` (keptByProfile) fallan 3 tests; desactivando la proteccion de `develop` fallan 3 tests distintos |
| Q5.5 | 3 | COMPLETO | 3 | 6 checks requeridos con integration_id; todos success en el SHA (G-08, G-09) |
| Q6.1 | 3 | COMPLETO | 3 | PRs #78/#79 con commits descriptivos, revision independiente documentada, experimentos #81-#86 cerrados |
| Q6.2 | 3 | MENOR | 2.25 | F-02: approvals=0, strict=false |
| Q6.3 | 3 | COMPLETO | 3 | 6 workflows y 15 check-runs success en el SHA; sin `continue-on-error` nuevo (el unico es de `release.yml:108`, condicionado a PR/prerelease, ya existente) |
| Q6.4 | 3 | COMPLETO | 3 | v3.0.2 es CANDIDATE documentada y consistente (VERSION 3.0.0-dev); flujo de release prospectivo no se penaliza; v3.0.1 inmutable |
| Q6.5 | 2 | COMPLETO | 2 | build determinista del bundle ya probado en v3.0.1; sin cambios en el pipeline de release |
| Q6.6 | 2 | COMPLETO | 2 | apply+revert byte-identico probado para brechas 1/6/7; fail-safe `NO_PROTECTION_GAP` |
| Q7.1 | 3 | MENOR | 2.25 | secret scanning + push protection enabled, 0 alertas, escaneo de patrones sin hallazgos; F-03: revocacion de claves antiguas NO VERIFICADO |
| Q7.2 | 2 | MENOR | 1.5 | F-10: code scanning #27 ABIERTA en main sin disposicion; Dependabot 0 abiertas (#144 descartada con justificacion razonable, G-11) |
| Q7.3 | 2 | MENOR | 1.5 | F-04: sin ruleset de tags; job `publish` con `contents/id-token/attestations: write` sin Environment |
| Q7.4 | 2 | COMPLETO | 2 | `sha_pinning_required=true`; workflow default permissions `read`; `productDir` confinado (regex+ruta+realpath); comandos solo del perfil fijado |
| Q7.5 | 3 | COMPLETO | 3 | attestation, SBOM y revocaciones de v3.0.1 intactos; imagen pilot fijada por digest verificado sin red |
| Q8.1 | 2 | COMPLETO | 2 | AGENTS.md/governance como fuente unica; manifiestos reemplazan los arboles retirados |
| Q8.2 | 2 | COMPLETO | 2 | roles y limites; CODEOWNERS; Environments `ai-native-human-review` y `ai-native-trust` |
| Q8.3 | 2 | MENOR | 1.5 | F-02: merge humano = norma + deteccion, no imposicion servidor |
| Q8.4 | 2 | COMPLETO | 2 | informe ligado a SHA exacto; notas de gobernanza propias para #78/#79 y CODEQL-ALERT-27 |

## G. Ledger de verificacion

Todos ejecutados en el worktree `/tmp/aud84` @ 84d28a1 salvo indicacion. Logs en `/tmp/aud84-out/logs/`.

| ID | Verificacion | Comando/Metodo | Resultado | Estado |
|---|---|---|---|---|
| G-01 | Estructura del metodo | `node runtime/audit/cli.mjs check` | PASS (exit 0) | PASS |
| G-02 | Doc drift | `node runtime/docs/validate-doc-drift.mjs` | PASS (exit 0) | PASS |
| G-03 | Integridad de estado | `node runtime/status/validate-integrity.mjs` | PASS (exit 0) | PASS |
| G-04 | Parity | `node parity/validate-parity.mjs` | PASS; capabilities 74 (unmapped=0), tests-map 35 ficheros/264 funciones (0), files-map 576 ficheros/13 areas (0), par-tests 95 registrados/95 implementados | PASS |
| G-05 | Pins y modos | `validate-actions-pinned.mjs` ("all actions pinned by full SHA"); `validate-audit-safe-script-mode.mjs` PASS; `validate-ci-tests-listed.mjs` ("all 78 committed *.test.mjs are run by a workflow") | exit 0 los tres | PASS |
| G-06 | Validadores de contratos/core/compat/evidencia/entrypoints | `contracts/validate-contracts.mjs` (15 schemas, 3 datos); `core/validate-core.mjs` (kernel 52/60); `evaluation/compat/validate-compat-matrix.mjs` (29 checks); `evaluation/m52/validate-evidence.mjs`; `runtime/adapters/validate-entrypoints.mjs` | exit 0 todos | PASS |
| G-07 | Tests por area | `node --test runtime/{migrate,gates,consumer,bootstrap,release}/*.test.mjs` | migrate 73/73, gates 62/62, consumer 17/17, bootstrap 24/24, release 24/24; 0 fail, 0 cancelled, 0 skipped. Ademas `runtime/audit` 16/16, `evaluation/m52` 14/14, tests de los 4 validadores y `validate-ci-tests-listed` OK | PASS |
| G-07b | Suite hermetica oficial completa | `node scripts/test-hermetic.mjs` (concurrencia 2, una sola corrida) | 719 tests, 78 ficheros, 719 pass, 0 fail, 310 s, win32, Node v26.10.0, concurrencia 2, exit 0 (log `/tmp/aud84-out/logs/hermetic.log`). Una sola corrida: no se repitio 3 veces | PASS |
| G-07c | Higiene de diff | `git diff --check`; `git status --short` | 0 / 0 lineas | PASS |
| G-08 | Ruleset activo | `gh api repos/.../rulesets` (1: `ai-native-main`, id 24405506, active, target branch, `~DEFAULT_BRANCH`, `bypass_actors: []`) + detalle | reglas `deletion`, `non_fast_forward`, `pull_request` (approvals 0, dismiss_stale true), `required_status_checks` strict=false con `validators (ubuntu-latest)`, `validators (windows-latest)`, `pin-check`, `pr-gate`, `ai-native/trust-gate`, `ai-native/merge-gate` (integration_id 15368 / 5170488). Los jobs `validators`, `pin-check`, `pr-gate` existen en los workflows; `legacy-template-baseline` no estaba requerido | PASS (F-02 residual) |
| G-09 | CI remoto sobre 84d28a1 | `gh run list --branch main --commit 84d28a1...` y check-runs | CI, pilot, CodeQL, Trivy, SBOM, Supply chain: success (+ Dependabot y Dependency Graph success). 15 check-runs success, incluidos `validators` ubuntu/windows, `pilot` online/offline x ubuntu/windows, `pin-check`, `sbom`, `trivy-fs`, `analyze` x2 | PASS |
| G-10 | Code scanning | `gh api .../code-scanning/alerts?state=open&ref=refs/heads/main` | 1 abierta: #27 `actions/untrusted-checkout/medium` en `l3-consumer.yml:116`. #18 (mismo rule/fichero/linea) descartada por el owner como false positive | Hallazgo F-10 |
| G-11 | Dependabot y secretos | `dependabot/alerts?state=open` = 0; dismissed #144 (pytest, GHSA-6w46-j5rx-g56g, medium, `evaluation/fixtures/migrate/requirements-dev.txt`, `not_used`); `secret-scanning/alerts?state=open` = 0; `security_and_analysis`: secret scanning, push protection y dependabot security updates enabled | `grep -rn "requirements-dev\|pip install" .github` = 0 resultados (ningun workflow instala pytest con ese manifiesto) | PASS |
| G-12 | Retiro de legacy y `_deprecated` | script node: para cada entrada de `parity/v2.0.5/legacy-import-manifest.json` (165) y `governance/history/DEPRECATED-2026-06-11-MANIFEST.json` (120) `git show 0e439ec:<ruta>`, sha256 y bytes; `git ls-tree` de ambos commits | 0 discrepancias en 285/285; hash agregado de legacy coincide (`18eb6dae...`); el arbol de `legacy/` en `0e439ec` tenia exactamente 165 ficheros, todos en el manifiesto; `_deprecated` 120 en `0e439ec`, 0 en HEAD; `legacy/` 0 en HEAD | PASS |
| G-13 | Referencias colgantes | `grep` de `legacy/template-v2`, `_deprecated`, `validate-(duplicate-detection\|historical-archive\|legacy-inventory\|obsolete-artifacts)`, `legacy-template-baseline` fuera de history/archive/.audit; barrido de enlaces Markdown relativos en 339 .md; comprobacion de rutas citadas en los docs de la candidata | 0 enlaces rotos; referencias vivas solo en notas de retiro (ci.yml:9, AGENTS.md:100, CONTRIBUTING.md:35, ROADMAP_TO_FILES.md) y en documentos historicos; ningun codigo ejecutable referencia lo retirado (`runtime/release/release.test.mjs` menciona `legacy/` como dato de prueba, y el test pasa) | PASS (con F-09: textos vigentes obsoletos) |
| G-14 | #78 pins | `grep` de `uses:` sin SHA de 40 hex; `checkout@` != `3d3c42e5...` | 0 acciones sin fijar; todas las `actions/checkout` en `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1) | PASS |
| G-15 | #78 imagen pilot | `OFFLINE_IMAGE` en `evaluation/m52/offline-image.mjs` (`public.ecr.aws/docker/library/node:24-bookworm@sha256:3d27e5c1...`); sha256 de `offline-image.index.json` calculado localmente = `3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0`; `node --test evaluation/m52/*.test.mjs` | el digest fijado coincide con el sha256 del indice versionado (sin red); 14/14 | PASS |
| G-16 | Release publicados | `gh api repos/.../releases`, `tags` | v3.0.1, v3.0.0 inmutables (immutable=true); rc.* prerelease inmutables; **no existe tag ni release v3.0.2** | PASS (coherente con CANDIDATE) |
| G-17 | Workflows: falsos exitos | `grep continue-on-error\|\|\| true\|pull_request_target` | solo `release.yml:108` (condicionado) y `|| true` dentro de un `grep` en un pipe de `release.yml:252`; `pull_request_target` solo en merge-gate, post-merge, trust-gate (diseno documentado, checkout de `base.sha`) | PASS |
| G-18 | Mutacion del migrador (copia en `/tmp/aud84m`, borrada) | (a) `const need = undefined` en `migrate.mjs:118`; (b) `developProtected !== true` -> `false` en `migrate.mjs:119`; `node --test runtime/migrate/migrate-v2.test.mjs` | (a) 3 tests de gap 1 fallan; (b) 3 tests de gap 7 fallan; sin mutacion 73/73. Las regresiones protegen lo que declaran | PASS |
| G-19 | Permisos de Actions | `gh api .../actions/permissions` y `/workflow` | `sha_pinning_required=true`; `default_workflow_permissions=read`; `can_approve_pull_request_reviews=false` | PASS |
| G-20 | Gate de release | `node runtime/audit/cli.mjs release-gate ...` | ver Z | ver Z |

## H. Hallazgos

Estado de los hallazgos del informe 485c48e (verificado ahora): F-06 (legacy, `_deprecated`) CERRADO salvo residual de rutas locales; F-07 (12 validadores duplicados) CERRADO. F-01, F-02, F-03, F-04, F-05, F-08, F-11 siguen ABIERTOS. F-10 reaparece con otra alerta (#27 en lugar de #26). Nuevo: F-09.

| ID | Tipo | Sev. | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|--:|
| F-01 | CONTRADICTORIO | MINOR | `governance/quality/QUALITY-MATRIX.md` sigue desfasada: l.3 "sobre `main` = `5afe752`"; l.25 `v3.0.0` "NOT PUBLISHED"; fila F-09 "PARTIAL (no probado en un tag real)". Arrastrado de 485c48e sin cambio | G-13; lectura del fichero | Q1.3 | -0.75 (compartido con F-09) |
| F-02 | RIESGO | MINOR | approvals=0, strict=false: el merge humano no lo impone el servidor (un solo maintainer; limite documentado, no ocultado) | G-08 | Q6.2, Q8.3 | -1.25 |
| F-03 | NO VERIFICADO | MINOR | Revocacion de claves antiguas de `ai-native-trust`: la API no expone claves de una App | SECRETS-BOUNDARY, SESSION-CONTEXT | Q7.1 | -0.75 |
| F-04 | INCOMPLETO | MINOR | Sin ruleset de tags (solo existe `ai-native-main`, target branch) y `publish` con escritura sin Environment (Environments existentes: `ai-native-human-review`, `ai-native-trust`). Mitigado por releases inmutables | G-08, G-16 | Q7.3 | -0.50 |
| F-05 | RIESGO / NO VERIFICADO | MINOR | Fragilidad local en Windows de git en repos temporales: la propia documentacion admite que el gate "3 corridas consecutivas verdes" NO se alcanzo sobre el codigo final (`bb0398a`); atribuida a antivirus por correlacion. Mi corrida: 719/719 verde en una corrida; no se repitieron 3 corridas, por lo que no se puede ni confirmar ni descartar el residual intermitente. Ademas la cadena `tsc/eslint/vitest` de foundation/template sigue fuera de CI | G-07, G-07b; V3.0.2-PATCH "Estabilidad" | Q5.3 | -1.00 |
| F-06 | SOBRA (residual) | MINOR | `legacy/` y `_deprecated` YA retirados (cerrado). Residual: rutas locales de usuario (`C:\Proyectos\_m6`, `_archive`, `Backup-...`) en 3 documentos vigentes de `governance/cleanup/` | G-12; `git grep -F 'C:\Proyectos'` | Q2.2 | -0.75 |
| F-08 | FALTA | MINOR | Troubleshooting general de una linea (README.md:78) | lectura README | Q4.5 | -0.50 |
| F-09 | CONTRADICTORIO | MINOR | Documentacion vigente con afirmaciones obsoletas tras la retirada de `legacy/`: `SESSION-CONTEXT.md` l.11 dice "`legacy/` es material congelado, no instrucciones" (ya no existe); l.7 "Actualizado: 2026-10-09 (post-M6; M7 COMPLETED)" no refleja el estado de la candidata; l.61 "#23-#26 (dependencias de `legacy/`...) se cierran tras su merge"; la tabla de auditorias PLATFORM no incluye `485c48e` (91.75, v3.0.1); `M7-CLOSURE.md` (l.55-57, 110, 112, 149) y `M7-INVENTORY.md` (l.30) afirman que `legacy/template-v2` "se conserva entero" y es REQUIRED_FOR_CI sin banner de superado (solo el titulo de la seccion PR #48 lo actualiza). `validate-doc-drift` PASS porque su alcance es derivado del codigo, no estas frases | G-02, G-13 | Q1.3 | (en F-01) |
| F-10 | RIESGO | MINOR | Alerta de code scanning #27 (`actions/untrusted-checkout/medium`, `l3-consumer.yml:116`) abierta en `main`, sin descarte ni waiver. Mi evaluacion: **no es un hallazgo de seguridad real** (ver detalle). El repo mantenia una disposicion registrada para el mismo hallazgo (#18 descartada) pero la #27 conserva otra huella y no tiene decision | G-10 | Q7.2 | -0.50 |
| F-11 | NO VERIFICADO | MINOR | `l3-consumer.yml` no se ejecuta en este repo (sin llamador; `gh run list --workflow l3-consumer.yml` vacio). La candidata aniade perfiles `python-app`/`python-scripts` y `lock.productDir` cuya unica validacion es de tests unitarios (17/17) y de esquema; v3.0.2 no esta publicada, asi que ningun consumidor GI la ejercita aun | `git grep l3-consumer -- .github`; G-07 | Q5.2 | -0.75 |

Total puntos perdidos: 0.75 (F-01/F-09) + 1.25 (F-02) + 0.75 (F-03) + 0.50 (F-04) + 1.00 (F-05) + 0.75 (F-06) + 0.50 (F-08) + 0.50 (F-10) + 0.75 (F-11) = 6.75 -> 93.25. BLOCKER 0, CRITICAL 0, MAJOR 0, MINOR 10 (F-01..F-06, F-08..F-11; F-09 no resta puntos propios porque comparte causa raiz y deduccion con F-01). Observaciones SUGGESTION (0 puntos): ver J.

### Detalle por hallazgo

**F-01 / F-09 (docs obsoletas)**. Descripcion: ver tabla. Impacto: un lector que siga SESSION-CONTEXT ("fuente de verdad del estado") o M7-CLOSURE creeria que existe `legacy/` y que es requisito de CI; con la candidata mergeada eso es falso. Causa raiz (ROOT-01): la PR sincronizo los documentos de la candidata (V3.0.2-PATCH, FINAL-CONSOLIDATION, parte de SESSION-CONTEXT) pero no barrio los textos que describian el estado anterior; el validador de doc drift no cubre prosa. Correccion minima: actualizar l.7/l.11/l.61 y la tabla de auditorias de SESSION-CONTEXT, anadir banner "superado por FINAL-CONSOLIDATION/V3.0.2-PATCH" en M7-CLOSURE/M7-INVENTORY y sincronizar QUALITY-MATRIX. Verificacion de cierre: `git grep -n "legacy/" governance/SESSION-CONTEXT.md` solo en notas de retiro; QUALITY-MATRIX sin "NOT PUBLISHED". Recuperable: +0.75.

**F-02**. Heredado y declarado (HITL-MERGE-POLICY). Cierre: segunda identidad humana y `required_approving_review_count>=1` / `strict=true`. +1.25 (Q6.2 +0.75, Q8.3 +0.50).

**F-03**. Accion humana (revocar claves) y registro. +0.75.

**F-04**. Ruleset de tags para `v*` y Environment con revisores para `publish`. +0.50.

**F-05**. Verificacion: una corrida completa de la suite hermetica oficial = 719/719 en 310 s (concurrencia 2) y las suites por area (migrate, gates, consumer, bootstrap, release) 100% verdes con la concurrencia por defecto de `node --test`; no se observo ningun `Permission denied` de git. La causa de entorno esta razonablemente documentada (misma firma `unable to write file .git/objects/...: Permission denied`, tests aislados pasan) pero sin causa raiz demostrada y el gate propio no se cumplio sobre el codigo final. Cierre: job de CI o clon aparte para la cadena TS; exclusion del antivirus en una maquina de referencia y 3 corridas consecutivas. +1.00.

**F-06 (residual)**. Rutas `C:\Proyectos\...` en documentos de limpieza. Correccion: sustituir por `<workspace>\...`. +0.75.

**F-08**. Anadir seccion de troubleshooting al README. +0.50.

**F-10 (alerta #27)**. Evaluacion propia, independiente del documento del repo: el paso marcado es `actions/checkout` de `inputs.platform-repo` (por defecto `jlbellonGmail/ai-native`) **sin `ref:` derivado del PR**, con `persist-credentials: false`, en un `workflow_call` con `permissions: contents: read` y sin secretos; el commit de plataforma se toma del lock de la rama base y debe ser ancestro de la rama por defecto (`merge-base --is-ancestor`) antes de ejecutarse. El codigo del PR (`consumer/`) se baja en otro paso sin credenciales y sus propios tests se ejecutan con `contents: read`: ese es el proposito del gate L3 y no concede privilegios que el PR no tuviera ya. Un llamador malicioso podria pasar otro `platform-repo`, pero el llamador es el workflow del propio consumidor (ya controla su CI) y el gate falla si el lock no apunta a ese repo. Conclusion: falso positivo de CodeQL (la heuristica ve un checkout en un contexto alcanzable desde `pull_request`), severidad real BAJA; la clasificacion `PREEXISTING_MAIN_FINDING` y la no-modificacion del estado son honestas y consistentes con la evidencia (alerta en `refs/heads/main` commit `84d28a1`; #18 descartada con comentario coherente). Lo que SI es un defecto: el repo tenia 0 alertas abiertas y ahora tiene 1 sin disposicion; el analisis de "umbral de 305 ficheros" del documento es empirico y no documentado por GitHub (el propio documento lo dice). Observacion del auditor: la explicacion de que #27 existe en `main` por cambio de huella tras el pin v7.0.1 es coherente pero, como reconoce el documento, no esta demostrada. Cierre: el owner descarta #27 como false positive con la misma justificacion que #18, o endurece separando el checkout del consumidor. +0.50.

**F-11**. Cierre: workflow de ensayo que llame a `l3-consumer.yml` con un fixture Python por perfil nuevo, o evidencia versionada del primer uso real tras publicar v3.0.2. +0.75.

### Sobre el descarte de la alerta Dependabot #144 (pytest)

Razonable. Evidencia: el unico manifiesto pip del repo es `evaluation/fixtures/migrate/requirements-dev.txt`, que los tests de Node leen como bytes (fixture del migrador, identico a Template); `grep -rn "requirements-dev\|pip install" .github` = 0, es decir, ningun workflow lo instala; la categoria `not_used` es la correcta y el comentario registra la razon. Dos cautelas: (1) la afirmacion del comentario de que CVE-2025-71176 "es local y solo UNIX" no la he contrastado con el advisory (NO VERIFICADO); (2) el mismo contenido (`requirements-dev.txt` con pytest) SI lo instalaran los repos consumidores con los perfiles Python, pero eso es riesgo de cada consumidor y no de esta plataforma. Si el fixture pasara a instalarse en algun workflow futuro, el descarte dejaria de ser valido.

## I. Causas raiz

| ID | Causa raiz | Hallazgos relacionados | Impacto |
|---|---|---|---|
| ROOT-01 | La prosa de gobernanza no tiene validacion automatica y la candidata no barrio los textos sobre el estado anterior | F-01, F-09, F-06 (rutas locales) | Q1.3 (una sola deduccion), Q2.2 |
| ROOT-02 | Un solo maintainer: ni el merge humano ni la rotacion de claves son imponibles por el servidor | F-02, F-03, F-04 | Q6.2, Q8.3, Q7.1, Q7.3 |
| ROOT-03 | Entorno Windows con filtro de antivirus + cadena TS fuera de CI | F-05 | Q5.3 |
| ROOT-04 | Gate L3 sin llamador de ensayo en el repo de la plataforma | F-11, y contexto de F-10 (la alerta nace de ese workflow) | Q5.2, Q7.2 |

## J. Que sobra

- REVISAR: `governance/cleanup/M7-CLOSURE.md` y `M7-INVENTORY.md` tablas de `legacy/`: historicas y ahora falsas como estado actual; marcar como superadas o recortar.
- SIMPLIFICAR (SUGGESTION, 0 puntos): `command-refs.mjs`/`ruleset-guard.mjs` implementan un analizador de shell por lista blanca y una lectura de YAML por lineas; son heuristicas con fail-safe y tests de propiedades, pero son superficie de mantenimiento. No se penaliza (regla de suficiencia); si el modelo de perfiles lo permite, declarar `requiredFiles`/`referencedFiles` explicitos en el perfil evitaria analizar comandos.
- No hay codigo muerto detectado con evidencia: los filtros `legacy/` fueron retirados.

## K. Que falta

### OBLIGATORIO PARA 100/100
Cerrar F-01..F-06, F-08, F-10, F-11 (ver N).

### MEJORAS OPCIONALES
Implementar brechas 3/4/5 (DEFER declarado; no puntuan). Reducir el analizador de comandos (ver J). Job de CI para la cadena TS si se decide mantenerla.

## L. NO VERIFICADO

| Item | Motivo | Impacto | Como verificar |
|---|---|---|---|
| Publicacion de v3.0.2 (tag, release inmutable, `verify-release`) | No existe | Ninguno (candidata) | `node scripts/verify-release.mjs v3.0.2 --expect-commit <sha>` tras publicar |
| Revocacion de claves antiguas de `ai-native-trust` | Accion humana sin API | Q7.1 (F-03) | El owner lo confirma y lo registra |
| Ejecucion real de `l3-consumer.yml` con `python-app`/`python-scripts`/`productDir` | Sin llamador en el repo; v3.0.2 sin publicar | Q5.2 (F-11) | Fixture consumidor en CI o primer `migrate bump` real |
| Cadena `tsc/eslint/vitest` de foundation/template | Requiere instalar dependencias | Q5.3 (F-05b) | Job de CI o clon aparte |
| Causa raiz del `Permission denied` intermitente de git | Dependiente de antivirus de la maquina | Q5.3 (F-05) | Corridas con y sin exclusion |
| Contenido del advisory GHSA-6w46-j5rx-g56g (solo local/UNIX) | No consultado | Ninguno (#144 `not_used` se sostiene por no ejecutarse) | Leer el advisory |
| Mecanismo/umbral de CodeQL que explica #27 en PR grandes | No documentado por GitHub | Ninguno | Soporte de GitHub / mas experimentos |
| Brechas 3/4/5 | DEFER declarado | Ninguno (no son hallazgo) | Futura version |
| CLIs reales (Claude/Codex/OpenCode), OpenCode MCP, Codex config | `NOT_AVAILABLE_FROM_TOOL`/fuera de alcance | Ninguno | Corrida con las CLIs |
| Sustitucion funcional del pytest baseline retirado | Se retira un job que ejecutaba pytest sobre el arbol v2; la paridad se prueba por `validate-parity` (estatico) | Ninguno puntuable (decision declarada) | Comparar con una ejecucion de v2.0.5 en su tag |

## M. Quality Gates

G1 BLOCKER: PASS (0 abiertos). G2 CRITICAL: PASS (0). G3 verificacion esencial: PASS: bootstrap, validacion principal y CI principal pasan; la suite principal pasa 719/719 por el runner oficial (una corrida) y por areas con la concurrencia por defecto de `node --test`. No se activa ningun gate.

## N. Camino matematico a 100

Score actual 93.25. F-01/F-09 +0.75 (Q1.3); F-06 +0.75 (Q2.2); F-08 +0.50 (Q4.5); F-11 +0.75 (Q5.2); F-05 +1.00 (Q5.3); F-02 +1.25 (Q6.2 +0.75, Q8.3 +0.50); F-03 +0.75 (Q7.1); F-10 +0.50 (Q7.2); F-04 +0.50 (Q7.3). Suma recuperable 6.75; 93.25 + 6.75 = 100. Aplicables = 100, sin normalizacion. Ningun gate activo.

## O. Plan de remediacion (solo MINOR; no hay BLOCKER/CRITICAL/MAJOR)

1. F-10 (owner, minutos): descartar #27 como false positive con la justificacion de #18 (o endurecer el workflow), antes de etiquetar v3.0.2. +0.50.
2. F-01/F-09 (agente, `governance/SESSION-CONTEXT.md`, `governance/quality/QUALITY-MATRIX.md`, `governance/cleanup/M7-*.md`): sincronizar prosa. +0.75. Verificacion: grep de `legacy/` y de "NOT PUBLISHED".
3. F-06 (agente): sustituir rutas locales por marcadores. +0.75.
4. F-08 (agente): seccion de troubleshooting. +0.50.
5. F-11 (agente): ensayo de `l3-consumer.yml` con fixture Python. +0.75.
6. F-05 (agente/humano): job de CI para la cadena TS; mitigacion de antivirus. +1.00.
7. F-02, F-03, F-04 (humano): segunda identidad y `strict`, revocacion de claves, ruleset de tags y Environment de `publish`. +2.50.

## P. Segunda pasada de 100

N/A (score < 100).

## Q. Certificacion final

Es hoy una PLATAFORMA PROFESIONAL DE REFERENCIA (100/100)? **NO.** Nivel "muy buen nivel": 93.25/100, 0 BLOCKER/CRITICAL/MAJOR, 10 MINOR (9 con puntos). La candidata v3.0.2 es tecnicamente solida: las correcciones del migrador estan implementadas y las regresiones fallan sin el codigo (mutacion), el retiro del legado es verificable byte a byte con parity intacta, los 6 workflows del SHA estan en verde, no hay secretos ni alertas Dependabot abiertas, y la unica alerta de code scanning abierta es, a mi juicio, un falso positivo sin disposicion registrada.

Release-gate de la candidata: cumple el umbral nominal (93.25 >= 90), el minimo efectivo (>= 88) y 0 BLOCKER/CRITICAL/MAJOR. Este informe certifica solo el commit `84d28a16689540e922828b9794446572aee3f76c` (o un descendiente cuya diferencia neta sea unicamente `.audit/**` y `STATUS.md`); no es una certificacion permanente ni un gate de merge (`isMergeGate: false`).

## Z. Resultado literal de release-gate

```
Comando (cwd = worktree /tmp/aud84 @ 84d28a1; --reports apunta al directorio de salida del informe):

$ node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 84d28a16689540e922828b9794446572aee3f76c --reports /tmp/aud84-out --root /tmp/aud84
PASS
EXIT=0

$ ... --json
{"status":"PASS","summary":"PASS","errors":[],"warnings":[],"report":"AUDIT-PLATFORM-84d28a1.md","score":93.25}

Front matter parseado y validado contra contracts/audit-report.schema.json por el propio release-gate (runtime/audit/report.mjs): sin errores ni avisos.
Estado final: `git rev-parse HEAD` = 84d28a16689540e922828b9794446572aee3f76c; `git status --short` = 0 lineas.
```

