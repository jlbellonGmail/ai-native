---
targetRepo: jlbellonGmail/ai-native
targetCommit: f4bc663a5c3034692fc6ebc8cce374e244b517c2
platform:
  version: v3.0.0-dev
  commit: f4bc663a5c3034692fc6ebc8cce374e244b517c2
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: claude-code (independent audit agent)
  model: claude-sonnet-5-5
date: 2026-10-11T22:00:00Z
scope: full repository at the exact commit (candidate v3.1.1, PR #102 head), focus on the delta 4bcd01e..f4bc663 (F-20, F-21, CodeQL #34/#35) and the security-relevant parts of f595c49..f4bc663
score: 92.25
isMergeGate: false
---

# Auditoria PLATFORM independiente - ai-native @ f4bc663 (candidata v3.1.1)

## A. Identificacion

- Repositorio jlbellonGmail/ai-native; worktree `C:/Users/ASUS/AppData/Local/Temp/aud2-v311`; HEAD detached = `f4bc663a5c3034692fc6ebc8cce374e244b517c2` (cabeza de la PR #102: `gh pr view 102` headRefOid identico). `VERSION` = `3.0.0-dev`. Ultima release publicada: `v3.1.0` (`gh release list`: Latest). v3.1.1 NO esta publicada: se audita una CANDIDATA.
- Worktree limpio antes de las ejecuciones. Perfil PLATFORM 1.2; QUALITY_SCORE 1.1; AUDIT_RULES 1.1; auditMethod 1.2. Node v26.10.0, Windows 11, Git Bash. GitHub solo con GET.
- El resumen de hallazgos previos se uso solo como lista de cosas a re-comprobar; cada punto se verifico aqui.

## B. Veredicto

```
Score bruto: 92.25/100
Quality Gate aplicado: ninguno (0 BLOCKER, 0 CRITICAL; validadores y suite hermetica PASS)
Score final: 92.25/100
Confianza: MEDIA (F-03 y l3-consumer.yml no verificables)
Estado: APTO (banda 90-94)
Hallazgos: BLOCKER 0 / CRITICAL 0 / MAJOR 0 / MINOR 11 (con puntos) / informativos 2
```

F-20 y las alertas CodeQL #34/#35 estan CERRADOS y verificados. F-21 esta cerrado (texto veraz); el riesgo residual es una propiedad de diseno documentada. Hay un hallazgo NUEVO real (F-22: `rollback` descarta campos del lock) y F-23 (observacion que el repo declaro sin puntuar; aqui puntuada).

## C. Alcance y limitaciones

Inspeccionado: `audit/**`, `git diff 4bcd01e..HEAD` completo, `launcher.mjs`, `sdd-cli.mjs`, `persistTaskState`, `hitl.mjs`, `l3.mjs::policyChecks`, `architecture.mjs` (normalizacion), `bootstrap/install.mjs` y `cache.mjs`, `core/commands/*.md` del diff, workflows, rulesets y environments (GET), code scanning, README/SESSION-CONTEXT/QUALITY-MATRIX.

NO_RUN: revocacion de claves antiguas (accion humana, sin evidencia remota), ejecucion real de `l3-consumer.yml` (sin llamador ni runs), cadena `tsc/eslint/vitest`, CLIs de agentes reales, fases post-release de v3.1.1 (no publicada).

## D. Matriz de puntuacion

| Area | Max | Obtenido |
|---|--:|--:|
| Q1 | 12 | 11.25 |
| Q2 | 12 | 11.25 |
| Q3 | 12 | 12.00 |
| Q4 | 12 | 11.50 |
| Q5 | 16 | 14.25 |
| Q6 | 16 | 14.75 |
| Q7 | 12 | 9.75 |
| Q8 | 8 | 7.50 |
| **Total** | **100** | **92.25** |

Aritmetica: 11.25+11.25+12+11.5+14.25+14.75+9.75+7.5 = 92.25; perdidas 0.75+0.75+0+0.5+1.75+1.25+2.25+0.5 = 7.75. Sin N/A.

## E. Subcriterios con perdida (el resto COMPLETO)

| ID | Max | Nivel | Obt. | Hallazgo |
|---|--:|---|--:|---|
| Q1.3 | 3 | MENOR | 2.25 | F-01 |
| Q2.2 | 3 | MENOR | 2.25 | F-06 |
| Q4.5 | 2 | MENOR | 1.5 | F-08 |
| Q5.2 | 3 | MENOR | 2.25 | F-11 |
| Q5.3 | 4 | MENOR | 3.0 | F-05 |
| Q6.2 | 3 | MENOR | 2.25 | F-02 |
| Q6.6 | 2 | MENOR | 1.5 | F-22 |
| Q7.1 | 3 | MENOR | 2.25 | F-03 |
| Q7.2 | 2 | MENOR | 1.5 | F-10 |
| Q7.3 | 2 | PARCIAL | 1.0 | F-04 (0.5) + F-23 (0.5), causas distintas |
| Q8.3 | 2 | MENOR | 1.5 | F-02 (causa compartida con Q6.2) |

Q6 pierde 0.75 (Q6.2) + 0.5 (Q6.6) = 1.25. Q7 pierde 0.75 + 0.5 + 1.0 = 2.25. Q5 pierde 0.75 + 1.0 = 1.75. Q4 0.5, Q8 0.5, Q1 0.75, Q2 0.75.

## F. Ledger de verificacion (comandos ejecutados por mi)

| ID | Comando | Resultado |
|---|---|---|
| G-01 | `node runtime/audit/cli.mjs check` | PASS, exit 0 |
| G-02 | `node runtime/docs/validate-doc-drift.mjs` | PASS, exit 0 |
| G-03 | `node parity/validate-parity.mjs` | PASS; capabilities 74 (unmapped 0), tests-map 35/264, files-map 576/13, par-tests 95/95 |
| G-04 | `node contracts/validate-contracts.mjs` | PASS; 20 schemas, 7 datos |
| G-05 | `node core/validate-core.mjs` | PASS; kernel 52/60, 8 perfiles |
| G-06 | `node scripts/validate-audit-safe-script-mode.mjs` | PASS |
| G-07 | `node scripts/validate-actions-pinned.mjs` | PASS (todas por SHA) |
| G-08 | `node scripts/validate-ci-tests-listed.mjs` | PASS: 89 `*.test.mjs` ejecutados por un workflow |
| G-09 | `node scripts/test-hermetic.mjs` (concurrencia 2, una corrida) | 864 tests, 89 ficheros, 864 pass, 0 fail, 265 s, win32, Node v26.10.0 |
| G-10 | `node --test runtime/adapters/consumer-launcher.test.mjs runtime/adapters/commands.test.mjs` | todo ok, incluido el test F-20 (symlinks permitidos en esta maquina: el test planta los enlaces de verdad) |
| G-11 | `gh pr checks 102` | CodeQL, analyze (actions, js-ts), build, dependency-review, human-review, merge-gate y finalize, pin-check, pr-gate, sbom, security-scan, trivy-fs, trust-gate, validators ubuntu y windows: pass; publish/verify "skipping" (esperado fuera de tag) |
| G-12 | `gh run list --branch fix/v3.1.1-consumer-runtime` | Release, CodeQL, CI, security-scan, Dependency review, pr-gate, Supply chain, SBOM: success sobre f4bc663 |

### F-20 (cierre verificado)

- Codigo: `persistTaskState` usa `${tasksPath}.${pid}.${randomBytes(6).hex}.tmp` con `writeFileSync(..., {flag:"wx"})` (O_EXCL), `renameSync`, y `rmSync(tmp,{force:true})` si falla.
- Sonda propia (script en el TEMP del sistema): con un symlink plantado en `tasks.md.tmp` hacia `victim.txt`, `persistTaskState` deja `victim.txt` intacto, `tasks.md` queda marcado `[x]` y no es symlink; con fichero inexistente lanza ENOENT. La misma sonda con el codigo de `4bcd01e` (`writeFileSync(tasks+".tmp")` + rename) escribio en `victim.txt`: el defecto era real y esta corregido.
- Barrido de otros `.tmp` fijos: `install.mjs` (`${path}.${pid}.tmp`, lock) y `upgrade-delta.mjs` (`${journalPath}.tmp`) escriben en el proyecto del propio usuario; no puntuo (sin vector de tercero demostrado).

### CodeQL #34/#35 (cierre verificado)

- `gh api code-scanning/alerts/34` y `/35`: `js/incomplete-multi-character-sanitization`, instancia en `refs/pull/102/merge` commit `5176f81` con estado `fixed`; analisis posteriores sobre `refs/pull/102/merge` (`0f83120`) con `results_count` 0; `alerts?ref=refs/pull/102/merge&state=open` devuelve 0. En `commands.test.mjs` y `consumer-launcher.test.mjs` las regex de comentarios HTML se sustituyeron por filtrar la linea `<!-- GENERATED`; la asercion sigue activa sobre el resto del texto.
- Alerta #27 (`actions/untrusted-checkout/medium`, `l3-consumer.yml`) sigue abierta en main: unico `state=open` (F-10).

### F-21 (cierre de texto verificado)

La cabecera del lanzador declara que la cache es la raiz de confianza, que el lanzador no reverifica antes de arrancar el bootstrap y que este reverifica antes de ejecutar comandos (`install.run` -> `verifyRelease` -> `runtime/main.mjs`: confirmado). La frase anterior ya no aparece en codigo ni docs normativos. Matiz informativo (0 pts): `verifyRelease` compara con el manifiesto de la propia cache y el digest del lock solo nombra el directorio; quien escribe en `AI_NATIVE_CACHE` controla lo que se ejecuta, y el texto lo dice.

### Seguridad de la parte amplia del parche (f595c49..HEAD)

- `sdd-cli.mjs`: slug `^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$` (sin `..` ni separadores) y `realpath(specs/<slug>)` bajo `realpath(specs)`; `mark` valida `T\d+` y estado cerrado. Un `tasks.md` symlink se reemplaza por rename, no se escribe a traves de el. Sin escalada.
- Lanzador: digest validado `^sha256:[0-9a-f]{64}$` antes de componer rutas; falla cerrado sin lock o sin release en cache.
- `allowNone`: `hitl.mjs` lo lee con `git show <base>:ai-native.lock.json`, no del working tree ni por flag; test "a PR cannot grant itself none" pasa; `l3.mjs` usa el lock base. `none` sigue forzado a `required` con riesgo alto, plano de control, release y production (tests F-19 pasan). Lock base invalido -> FAIL. Sin diff evaluable -> riesgo medium, nunca `none`.
- `hitl` y el cambio real: diff `base` contra working tree mas `ls-files --others --exclude-standard`; el test demuestra que una migracion sin commit y un `.env.production` nuevo suben a `high/required`. Solo quedan fuera ficheros ignorados por git (no entran en un commit). No encuentro via a un gate mas ligero que el cambio real. Limite: `--base HEAD` local es consultivo; el control vinculante es la CI con la base real.
- `forbiddenImports` simetrico: `canon()` en ambos lados; test F-18 pasa.
- Plano de control: sin cambios en `governance/gates/gates.json` ni `runtime/gates/**` en el delta.

## G. Hallazgos abiertos

| ID | Sev | Pts | Tipo | Descripcion / evidencia | Correccion y verificacion |
|---|---|--:|---|---|---|
| F-01 | MINOR | 0.75 (Q1.3) | OBSOLETO | `governance/quality/QUALITY-MATRIX.md` fechada 2026-10-05 (rc.2); README dice «latest stable `v3.0.2`» pero `gh release list` marca `v3.1.0` Latest; `SESSION-CONTEXT.md` fija `STABLE_BASELINE: v3.0.2` y no menciona v3.1.0 (absorbe el F-09 previo). El validador de doc drift pasa (no cubre estas afirmaciones). | Actualizar los tres documentos; grep de version y `validate-doc-drift`. |
| F-02 | MINOR | 0.75 Q6.2 + 0.50 Q8.3 | RIESGO | Ruleset `ai-native-main` (id 24405506): `required_approving_review_count: 0`, `require_code_owner_review: false`; si exige checks incluidos merge-gate y trust-gate; el humano entra por el Environment `ai-native-human-review` (`prevent_self_review: false`). Diseno de mantenedor unico declarado. | Segundo mantenedor + aprobacion + code owner, o control equivalente aceptado y documentado; `gh api rulesets/24405506`. |
| F-03 | MINOR | 0.75 Q7.1 | NO VERIFICADO | Revocacion de claves antiguas: accion humana, sin evidencia remota. | Ejecutarla y documentarla. |
| F-04 | MINOR | 0.50 Q7.3 | FALTA | Un unico ruleset (rama), ninguno de tags; `release.yml` job `publish` sin `environment:` (los existentes son `ai-native-human-review` y `ai-native-trust`). | Ruleset de tags `v*` + Environment para `publish`; verificar por GET. |
| F-05 | MINOR | 1.00 Q5.3 | RIESGO | La suite hermetica es no determinista en Windows segun el propio repo (`V3.0.2-PATCH.md`: 6 de 15 corridas rojas por `Permission denied` en `.git/objects`; `V3.1.1-PATCH.md`: `circuit e2e Feature/LIGHT` fallo una vez, pasa aislado 9/9). En MI corrida: 864/864, NO reproduzco el fallo (no intente repetirlo 3 veces por limite de memoria/tiempo); la perdida se basa en la evidencia documentada del repo. | Tres corridas consecutivas verdes en Windows o eliminar la causa en los helpers git de test. |
| F-06 | MINOR | 0.75 Q2.2 | SOBRA | `governance/cleanup/M7-INVENTORY.md` l.33 y l.51: rutas locales `C:/Proyectos/_m6/`. | Sustituir por descripcion relativa; grep. |
| F-08 | MINOR | 0.50 Q4.5 | INCOMPLETO | Troubleshooting del README = una linea (`status`/`doctor`); nada sobre fallos del lanzador (release no en cache, `AI_NATIVE_CACHE`, `hitl` rechaza `none`); el README no documenta lanzador, `sdd` ni `hitl` (solo AGENTS de plantilla y SKILL). | Seccion de problemas frecuentes con los mensajes `FAIL:` reales. |
| F-10 | MINOR | 0.50 Q7.2 | RIESGO | Alerta #27 `actions/untrusted-checkout/medium` abierta en main (`l3-consumer.yml`). | Corregir o descartar con justificacion; `alerts?state=open` = 0. |
| F-11 | MINOR | 0.75 Q5.2 | NO VERIFICADO | `l3-consumer.yml` reutilizable sin llamador ni runs en este repo; `policyChecks` solo con fixtures sinteticos. | Llamador o canary con run real. |
| F-22 | MINOR | 0.50 Q6.6 | ROTO | NUEVO. `install.mjs::canonical()` solo serializa `schemaVersion, platform, profiles, mcpProfiles, packs, overrides`; `rollback` (l.258-259) reescribe el lock con `canonical({...lock,...})`. Sonda propia: lock con `productDir:"app"` y `governance:{allowNone:true}`; tras `sync` de dos releases y `rollback`, el lock queda solo con `schemaVersion/platform/profiles`. Efecto: se pierde `governance.allowNone` (direccion fail-safe, pero silenciosa y contradice «publicado en el lock») y `productDir` (anterior a v3.1.1; L3 ejecutaria en la raiz). | Que `canonical` conserve `productDir` y `governance` + test de rollback; repetir la sonda. |
| F-23 | MINOR | 0.50 Q7.3 | RIESGO | `ci.yml` l.202-209 ejecuta `runtime/policy/hitl.mjs` desde el checkout del PR y `runtime/policy/**` no esta en `controlPlane` de `gates.json`: un PR puede debilitar la comprobacion que lo juzga (principio P44 del propio repo). V3.1.1-PATCH lo declara «observacion sin puntuar»; la fusion depende ademas del humano (Environment). Se puntua por el principio declarado del repo. | Ejecutar el gate desde el commit base o anadir `runtime/policy/**` al plano de control; verificar con un PR de prueba. |
| F-15 | informativo | 0 | — | `importsOf` es best effort por diseno declarado. |
| F-21 | cerrado | 0 | — | Ver seccion F. |

Informativo adicional (0 pts): el parseo de argumentos de `sdd` elimina de los posicionales cualquier valor igual al de un flag (por valor, no por indice); falla cerrado, sin impacto de seguridad.

## H. Camino a 100

Perdidas: Q1.3 0.75 (F-01) + Q2.2 0.75 (F-06) + Q4.5 0.5 (F-08) + Q5.2 0.75 (F-11) + Q5.3 1.0 (F-05) + Q6.2 0.75 y Q8.3 0.5 (F-02) + Q6.6 0.5 (F-22) + Q7.1 0.75 (F-03) + Q7.2 0.5 (F-10) + Q7.3 1.0 (F-04 0.5 + F-23 0.5) = 7.75. Obtenido 92.25 + recuperable 7.75 = 100 puntos aplicables. Correccion y verificacion de cada fila en la seccion G.

## I. Comprobacion de consistencia

- Toda perdida tiene causa; cada hallazgo se asocia a un criterio materialmente relacionado; ninguna SUGGESTION resta; el camino a 100 suma exactamente 7.75; sin N/A; ningun gate se activa.
- Causa compartida: F-02 afecta Q6.2 y Q8.3 (descuento repartido, no duplicado).
