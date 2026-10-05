---
targetRepo: jlbellonGmail/ai-native
targetCommit: 5a600724fd4523355642d9b024d3a37a02e7e779
platform:
  version: v3.0.0-dev
  commit: 5a600724fd4523355642d9b024d3a37a02e7e779
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-05T03:15:00Z
scope: full repository at the exact commit
score: 92.5
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ 5a60072

## A. Identificacion

- Repositorio: jlbellonGmail/ai-native; ruta C:\Proyectos\ai-native; branch main; tag auditado: ninguno (VERSION=3.0.0-dev; ultimo release publicado v3.0.0-alpha.1)
- Commit: `git rev-parse HEAD` = 5a600724fd4523355642d9b024d3a37a02e7e779 (coincide). `git status --short` vacio antes y despues de todas las ejecuciones (0 lineas). No se uso worktree.
- Perfil: PLATFORM (unico). QUALITY_SCORE 1.1, AUDIT_RULES, AUDIT_PROMPT 1.1. Metodo 1.2. Node v26.7.0.
- Fecha: 2026-10-05. Solo lectura (GET a la API; assets descargados a tmp).
- Nivel de confianza: MEDIA (la revocacion de la clave antigua de ai-native-trust no es verificable).

## B. Veredicto ejecutivo

```
Score bruto: 92.5/100
Score final: 92.5/100
Quality Gate aplicado: ninguno (G1 PASS, G2 PASS, G3 PASS)
Confianza: MEDIA
Estado: APTO CON CORRECCIONES (banda 90-94 "Muy buen nivel"; 1 MAJOR abierto y 7 MINOR)
Consistencia metodologica: PASS
```

Resumen: sin BLOCKER ni CRITICAL. 627 tests node (70 ficheros), 41 validadores de area, paridad (95/95, UNMAPPED=0), doc-drift, pin-check, ci-tests-listed (70/70) y `runtime/audit/cli.mjs check` pasan. CI verde en el SHA exacto (12 check-runs success, Linux y Windows). Ruleset activo sin bypass; sha_pinning_required=true; secretos TRUST_* solo en el Environment; release alpha.1 con checksums, SBOM y atestacion verificados. Abiertos: alerta CodeQL #10 (high) sigue ABIERTA mientras el triage la declara FIXED (contradiccion); secret scanning/push protection desactivados; ruleset con 0 aprobaciones y strict=false (limitacion F2 conocida); sin proteccion de tags.

## C. Alcance y limitaciones

Inspeccionado: arbol completo (165 ficheros rastreados, 1478 en legacy/), workflows, gates, release, contratos, governance, ruleset, Environments, alertas, release alpha.1. Ejecutado: seccion G. No verificable: revocacion de claves antiguas, ejecucion real de release.yml (no se crea tag), reconstruccion bit a bit de alpha.1, reviewers del Environment ai-native-human-review.

## D. Contrato detectado

| ID | Capacidad | Clasificacion | Fuente | Estado |
|---|---|---|---|---|
| C1 | platform.json coherente con lock schema; capacidades executable con evidencia | EJECUTADO | contracts/, asset platform.json, validate-contracts | OK |
| C2 | Paridad v2->v3, 95 PAR tests | EJECUTADO | parity/validate-parity.mjs | OK |
| C3 | Bundle determinista, SBOM, atestacion, revocaciones | VERIFICADO (alpha.1) | release.yml, assets | OK |
| C4 | Default deny MCP/politicas | VERIFICADO | core/security-policy.json `defaultDecision: deny`; tests runtime/mcp, mcp-gateway | OK |
| C5 | HITL unico de merge, gates server-side | PARCIAL | HITL-MERGE-POLICY.md, ruleset | Limitacion F2 documentada |
| C6 | Evidencia hash-chained | EJECUTADO | runtime/circuit/events.mjs, mcp-gateway/gateway.mjs + tests | OK |

## E. Matriz de puntuacion

| Area | Maximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR |
| Q2 Reutilizacion | 12 | 11.25 | MENOR |
| Q3 Arquitectura | 12 | 10.50 | MENOR |
| Q4 Documentacion/DX | 12 | 11.50 | MENOR |
| Q5 Calidad/Tests | 16 | 15.00 | MENOR |
| Q6 Git/CI/CD/Release | 16 | 15.25 | MENOR |
| Q7 Seguridad | 12 | 10.25 | MENOR |
| Q8 Gobernanza | 8 | 7.50 | MENOR |
| **TOTAL** | **100** | **92.50** | |

Aritmetica: 11.25 + 11.25 + 10.50 + 11.50 + 15.00 + 15.25 + 10.25 + 7.50 = 92.50. Sin N/A (aplicables = 100). Score bruto = final (sin gates).

## F. Detalle por subcriterio (COMPLETO 100%, MENOR 75%)

| ID | Max | Nivel | Obt. | Evidencia / hallazgo / justificacion |
|---|--:|---|--:|---|
| Q1.1 | 3 | COMPLETO | 3 | README.md (91 lineas), AGENTS.md, SESSION-CONTEXT: alcance claro |
| Q1.2 | 3 | COMPLETO | 3 | parity 95/95; validate-contracts, validate-core, compat 29 checks OK |
| Q1.3 | 3 | MENOR | 2.25 | F-01: ALERTS-TRIAGE-2026-10-04.md:19 dice #10 FIXED; GitHub la muestra open en 5a60072 y existsSync->readFileSync sigue en incident-repository.ts:17-19 y 41-45 |
| Q1.4 | 3 | COMPLETO | 3 | Sin requisitos obligatorios rotos; rc.1 bloqueada por gate de release (decision documentada) |
| Q2.1 | 3 | COMPLETO | 3 | bootstrap/pilot tests y CI `pilot online` verdes en ubuntu/windows |
| Q2.2 | 3 | MENOR | 2.25 | F-07: legacy/ (1478 ficheros) y _deprecated/; sin rutas locales ni secretos (git grep) |
| Q2.3 | 3 | COMPLETO | 3 | lock + CONTRIBUTING |
| Q2.4 | 3 | COMPLETO | 3 | CI Linux y Windows; sin rutas absolutas |
| Q3.1 | 3 | MENOR | 2.25 | Monorepo 4 areas + legacy (F-07, causa compartida) |
| Q3.2 | 3 | COMPLETO | 3 | core/contracts/runtime/audit separados; doc-drift verde |
| Q3.3 | 3 | MENOR | 2.25 | F-08: validate-duplicate-detection/historical-archive/legacy-inventory/obsolete-artifacts triplicados en foundation/knowledge/template |
| Q3.4 | 3 | COMPLETO | 3 | SESSION-CONTEXT 55 lineas con historia archivada; 70 ficheros de test |
| Q4.1 | 3 | COMPLETO | 3 | README funcional |
| Q4.2 | 3 | COMPLETO | 3 | comandos de CONTRIBUTING/README ejecutados con exito |
| Q4.3 | 2 | COMPLETO | 2 | validar/probar/liberar documentados |
| Q4.4 | 2 | COMPLETO | 2 | CONTRIBUTING.md (39 l.), SECURITY.md (29 l.), .github/CODEOWNERS |
| Q4.5 | 2 | MENOR | 1.5 | F-09: troubleshooting de una linea (README.md:73) |
| Q5.1 | 3 | COMPLETO | 3 | validadores, pin-check, doc-drift, integrity en CI |
| Q5.2 | 3 | COMPLETO | 3 | contrato/paridad/regresion/L1 evals/pilot |
| Q5.3 | 4 | MENOR | 3 | 627/627 pasan; 70/70 ficheros en workflow. F-06: template/validation/tests/prompt-snapshots/user-prompts.test.ts (vitest) y tsc/eslint de foundation/template no corren en CI |
| Q5.4 | 3 | COMPLETO | 3 | 95 PAR tests, regresiones de secret-exposure |
| Q5.5 | 3 | COMPLETO | 3 | 6 checks requeridos con integration_id; CI verde en el SHA |
| Q6.1 | 3 | COMPLETO | 3 | PRs, commits conventional, tags |
| Q6.2 | 3 | MENOR | 2.25 | Ruleset activo, 0 bypass, PR obligatoria, 6 checks. F-03: approvals=0 (F2), strict=false |
| Q6.3 | 3 | COMPLETO | 3 | 12/12 check-runs success en el SHA, matriz ubuntu+windows |
| Q6.4 | 3 | COMPLETO | 3 | VERSION 3.0.0-dev; alpha.1 con platform.json.digest = sha256 del tarball |
| Q6.5 | 2 | COMPLETO | 2 | tests PAR-REPRODUCIBLE-BUNDLE pasan; SHA256SUMS OK |
| Q6.6 | 2 | COMPLETO | 2 | tests de rollback bootstrap, migrate revert, revocations |
| Q7.1 | 3 | MENOR | 2.25 | Sin secretos (git grep), repo secrets=[], env ai-native-trust = TRUST_APP_ID/TRUST_APP_PRIVATE_KEY. F-04: secret scanning y push protection disabled; revocacion de clave antigua NO VERIFICADO (impide COMPLETO) |
| Q7.2 | 2 | MENOR | 1.5 | Dependabot 0 abiertas, lockfiles, dependabot.yml; F-01 alerta CodeQL high abierta |
| Q7.3 | 2 | MENOR | 1.5 | permissions top-level en 14/14 workflows, SHA pin + sha_pinning_required, secret-exposure 0 hallazgos. F-05: sin ruleset de tags, `publish` sin Environment |
| Q7.4 | 2 | COMPLETO | 2 | defaultDecision deny; neutral != PASS |
| Q7.5 | 3 | COMPLETO | 3 | SBOM CycloneDX, sigstore bundle, `gh attestation verify` rc=0 (SAN release.yml@refs/tags/v3.0.0-alpha.1), revocations-1.json identico al repo, LICENSE |
| Q8.1 | 2 | COMPLETO | 2 | AGENTS.md/governance fuente; doc-drift verde |
| Q8.2 | 2 | COMPLETO | 2 | matriz de capacidades por rol, CODEOWNERS |
| Q8.3 | 2 | MENOR | 1.5 | F-03: merge humano de PRs no de plano de control = norma + deteccion, no imposicion servidor |
| Q8.4 | 2 | COMPLETO | 2 | eventos hash-chained con tests; post-merge detecta merged_by |

## G. Ledger de verificacion

| ID | Verificacion | Resultado |
|---|---|---|
| G-01 | git rev-parse HEAD; git status --short | SHA exacto; 0 lineas (tambien al final) |
| G-02 | node --test runtime/ (60 ficheros) | 591 tests, 591 pass, 0 fail, 0 skip |
| G-03 | node --test evaluation/ (5) | 19/19 |
| G-04 | node --test parity/ (1) | 5/5 |
| G-05 | node --test contracts/ (1) | 3/3 |
| G-06 | node --test core/ (1) | 4/4 |
| G-07 | node --test scripts/ (2) | 9/9. Total 70 ficheros, 627 tests, 0 fallos |
| G-08 | foundation/scripts/validate-*.mjs desde foundation/ | 7/7 PASS |
| G-09 | knowledge/scripts/validate-*.mjs desde knowledge/ | 17/17 PASS |
| G-10 | template/scripts/validate-*.mjs desde template/ | 17/17 PASS |
| G-11 | template validate-structure y validate-enterprise-template desde la raiz | ambos rc=0 PASS (cwd-independientes) |
| G-12 | parity/validate-parity.mjs | PASS: 576 ficheros, unmapped=0; 95 par-tests registrados/95 implementados |
| G-13 | runtime/docs/validate-doc-drift.mjs | PASS |
| G-14 | scripts/validate-actions-pinned.mjs | PASS |
| G-15 | scripts/validate-ci-tests-listed.mjs | PASS: 70 test files corridos por un workflow |
| G-16 | node runtime/audit/cli.mjs check | PASS |
| G-17 | contracts (15 schemas), core, compat-matrix (29 checks), status integrity, adapters entrypoints, audit-safe-script-mode | todos rc=0 PASS |
| G-18 | checkSecretExposure sobre los 14 workflows | 0 hallazgos; solo merge-gate (2x) y trust-gate (1x) usan secrets.TRUST_APP_*, triggers pull_request_target |
| G-19 | gh run list --commit SHA; check-runs | CI, CodeQL, Trivy, SBOM, Supply chain, pilot, Dependency Graph success; 12 check-runs success |
| G-20 | ruleset ai-native-main (24405506) | active; bypass_actors=[]; ~DEFAULT_BRANCH; deletion, non_fast_forward, pull_request (approvals 0, dismiss_stale true), checks: validators ubuntu/windows, pin-check, pr-gate (id 15368), ai-native/trust-gate y merge-gate (id 5170488); strict=false; solo 1 ruleset (sin tags); sin branch protection clasica |
| G-21 | actions/permissions | sha_pinning_required=true; allowed_actions=all |
| G-22 | Environments/secretos (nombres) | ai-native-human-review (sin secretos), ai-native-trust (TRUST_APP_ID, TRUST_APP_PRIVATE_KEY); ambos custom_branch_policies; repo secrets: ninguno (WORKER_* ausentes) |
| G-23 | code-scanning (GET) | 13 alertas: 1 open (#10), 9 fixed (#1-#8, #11), 3 dismissed (#9 won't fix con justificacion; #12 y #18 false positive con comentario). Abierta: #10 js/file-system-race high, incident-repository.ts:34-37, instancia en commit 5a60072 |
| G-24 | Dependabot | 0 abiertas (state=open length 0) |
| G-25 | secret scanning | disabled (API 404); push protection disabled |
| G-26 | release v3.0.0-alpha.1 (prerelease) | assets: tar.gz, sbom.cdx.json, sigstore.json, platform.json, revocations-1.json, SHA256SUMS; sha256sum -c 4/4 OK; platform.json.digest = sha256 tarball; gh attestation verify rc=0 |
| G-27 | release.yml (estatico) | tag-trigger, tag ancestro de main, CI verde exigido, gates, SBOM, attest-build-provenance + attest-sbom, job verify con bootstrap --require-attestation, permisos minimos por job |
| G-28 | revocaciones | governance/versioning/revocations-1.json (entries: []) identico al asset |
| G-29 | MCP default deny; HITL docs | core/security-policy.json defaultDecision=deny; HITL-MERGE-POLICY.md y SECRETS-BOUNDARY.md coherentes con G-20/G-22 |
| G-30 | Presencia | LICENSE (propietaria), SECURITY.md, CONTRIBUTING.md, .github/CODEOWNERS, SESSION-CONTEXT.md 55 l., VERSION 3.0.0-dev |
| G-31 | Observabilidad | runtime/observability/correlate.test.mjs y fs-safe.test.mjs dentro de G-02, pasan y estan en ci.yml |

## H. Hallazgos

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|--:|
| F-01 | Defecto + contradiccion doc | MAJOR | Alerta CodeQL #10 (high, js/file-system-race) abierta tras re-analisis; el triage afirma FIXED | alerts/10 state=open, commit 5a60072, lineas 34-37; incident-repository.ts:17->19, 41->45; ALERTS-TRIAGE-2026-10-04.md:19 | Q1.3, Q7.2 | -1.25 |
| F-03 | Limitacion conocida | MINOR | approvals=0, strict=false; merge humano no impuesto por servidor (F2) | G-20; HITL-MERGE-POLICY.md | Q6.2, Q8.3 | -1.25 |
| F-04 | Defecto | MINOR | Secret scanning y push protection desactivados en repo publico (+ revocacion NO VERIFICADO) | repos API; secret-scanning 404 | Q7.1 | -0.75 |
| F-05 | Defecto | MINOR | Sin ruleset de tags; publish (contents/attestations write) sin Environment. Mitigado por ancestro de main y CI verde | G-20; release.yml:155-161 | Q7.3 | -0.5 |
| F-06 | Defecto | MINOR | tsc/eslint/vitest de template y foundation fuera de CI; 1 test TS no corrido | ci.yml sin pnpm/vitest/tsc; template/package.json:19,23 | Q5.3 | -1.0 |
| F-07 | Residuo | MINOR | legacy/ (1478 ficheros) y _deprecated/ | git ls-files | Q2.2, Q3.1 | -1.5 |
| F-08 | Duplicacion | MINOR | Validadores triplicados entre areas | foundation/knowledge/template scripts/ | Q3.3 | -0.75 |
| F-09 | Doc | MINOR | Troubleshooting de una linea | README.md:73 | Q4.5 | -0.5 |

(F-02 no se usa; la numeracion se mantiene estable con F-03 = limitacion F2 de las auditorias previas.)

### F-01 detalle (alerta #10)

- Descripcion: la alerta sigue open en main con instancia en 5a60072 (analysis_key codeql.yml:analyze, creada 2026-10-02). El codigo conserva el patron existsSync -> readFileSync (:17/:19 y :41/:45) y escritura posterior. El triage lo marca FIXED ("se cierra sola con el reanalisis"), pero el CodeQL del SHA auditado fue success y no la cerro.
- Clasificacion honesta: TOCTOU real pero de baja explotabilidad (ruta fija `process.cwd()/logs/incidents-history.json`, codigo de ejemplo). `template/examples/` NO esta en el bundle: runtime/release/bundle.mjs:21 INCLUDE_PREFIXES = runtime/, contracts/, core/, mcp/, profiles/, audit/, .agents/skills/. No afecta al release publicado; es una alerta high abierta en main y un documento de gobernanza inexacto.
- Causa raiz: R-2. Correccion minima: reescribir save/getAll con try/catch por ENOENT (como runtime/lib/fs-safe.mjs) y corregir el triage a la realidad. Verificacion: alerts/10 state=fixed tras nuevo analisis. Puntos recuperables 1.25.

Clasificacion agente-corregible vs maintainer humano:

- Agente: F-01, F-06 (job CI o declarar el test fuera de alcance), F-07/F-08 (consolidar), F-09, propuesta de workflow para F-05.
- Humano: F-03 (segundo maintainer/identidad), F-04 (activar secret scanning y push protection en Settings), F-05 (ruleset de tags / Environment de publish), revocacion de claves antiguas de ai-native-trust, merges.

## I. Causas raiz

| ID | Causa raiz | Hallazgos | Impacto |
|---|---|---|---|
| R-1 | Un unico maintainer | F-03 | Q6.2, Q8.3 (CAUSA RAIZ COMPARTIDA, penalizada una sola vez por criterio) |
| R-2 | Areas heredadas template/foundation con cadena TS fuera de CI raiz | F-01, F-06 | Q1.3, Q5.3, Q7.2 |
| R-3 | Monorepo con historico congelado y validadores copiados | F-07, F-08 | Q2.2, Q3.1, Q3.3 |

## J. Que sobra

- CONSOLIDAR: validadores duplicados (F-08).
- REVISAR: legacy/ y _deprecated/ (F-07).

## K. Que falta

Obligatorio para 100/100: cerrar F-01, F-03, F-04, F-05, F-06, F-07, F-08, F-09 y verificar la revocacion de claves. Mejoras opcionales: ninguna listada.

## L. NO VERIFICADO

| Item | Motivo | Impacto | Como verificar |
|---|---|---|---|
| Revocacion de claves privadas antiguas de ai-native-trust | Accion humana, sin API; SESSION-CONTEXT la declara pendiente | Q7.1 no puede ser COMPLETO; no se puntua como hecho | Maintainer confirma en GitHub Apps que solo existe la clave vigente |
| Reproducibilidad bit a bit del bundle | No se reconstruyo alpha.1 (commit 9e155b4) | Puntuado por tests y digest publicado | Rebuild en 9e155b4 y comparar |
| Ejecucion real de release.yml | No se crea tag (solo lectura) | Revision estatica + alpha.1 | Tag rc.1 |
| Reviewers del Environment ai-native-human-review | Detalle no consultado | Ninguno en score | gh api environments |

## M. Quality Gates

G1 BLOCKER: PASS. G2 CRITICAL: PASS. G3 VERIFICACION ESENCIAL: PASS.

## N. Camino matematico a 100

Score actual 92.5. F-01 +1.25 (Q1.3 +0.75, Q7.2 +0.5); F-03 +1.25 (Q6.2 +0.75, Q8.3 +0.5); F-04 +0.75 (Q7.1); F-05 +0.5 (Q7.3); F-06 +1.0 (Q5.3); F-07 +1.5 (Q2.2 +0.75, Q3.1 +0.75); F-08 +0.75 (Q3.3); F-09 +0.5 (Q4.5). Suma 7.5. Score bruto esperado 100.

## O. Plan de remediacion

1. MAJOR F-01: reescribir `template/examples/reference-app/services/infrastructure/learning/incident-repository.ts` sin existsSync previo; corregir governance/security/ALERTS-TRIAGE-2026-10-04.md; verificar alerta #10 fixed. +1.25. Riesgo bajo.
2. MINOR: F-03/F-04/F-05 (humano), F-06, F-07, F-08, F-09 segun N. El umbral de release (>=90, tolerancia 2 -> 88) se cumple con 92.5.

## P. Segunda pasada de 100

N/A.

## Q. Certificacion final

Puede considerarse actualmente un TEMPLATE/PLATAFORMA PROFESIONAL DE REFERENCIA? NO. Hay 1 MAJOR y 7 MINOR abiertos y la revocacion de claves es NO VERIFICADO; sin BLOCKER ni CRITICAL.

## Bloqueadores previos (estado verificado)

- H1 frontera de secretos: RESUELTO (repo secrets vacios; TRUST_* solo en Environment ai-native-trust; WORKER_* ausentes; secret-exposure 0 hallazgos).
- HITL merge: limitacion F2 documentada, no impuesta por servidor (F-03).
- LICENSE, SECURITY.md, CONTRIBUTING.md, CODEOWNERS: presentes.
- Revocacion de la clave antigua: NO VERIFICADO (nunca puntuado como hecho).
- Sprawl de SESSION-CONTEXT: resuelto (55 lineas, historia archivada).
- VERSION consistente (3.0.0-dev raiz; areas con versiones propias). Validadores cwd-independientes: OK. Tests de observabilidad: pasan y estan en CI.
