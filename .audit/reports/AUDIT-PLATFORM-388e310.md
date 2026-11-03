---
targetRepo: jlbellonGmail/ai-native
targetCommit: 388e310cf3aa4691f8b9541b8c016b9d36a61ed9
platform:
  version: "v4.0.1 candidate"
  commit: 388e310cf3aa4691f8b9541b8c016b9d36a61ed9
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-11-03T13:23:02Z"
scope: "Independent read-only PLATFORM 1.2 audit of the frozen v4.0.1 candidate 388e310 (branch release/v4.0.1, PR #175 to main) over the whole delta 6f47eb2..388e310, with focus on b43b5d6..388e310 (N-42 bundle exclusion, N-38 recorded human exception to SemVer MAJOR with measured consumer delta, N-39 MAIN_DEVELOP line). Baselines AUDIT-PLATFORM-6f47eb2.md (90.25), AUDIT-PLATFORM-c99ed8f.md (87.75) and AUDIT-PLATFORM-b43b5d6.md (88.50); every inherited finding re-verified live or justified by an empty diff over its area; v3.4.3 release asset re-downloaded and compared with two local builds of 388e310; N-36 re-run with the real evaluator on HEAD blobs; live GitHub control plane read-only. Auditor is an isolated-context subagent launched from the builder session with read-only instructions; it did not build or review the candidate. No fix, commit, push, PR, merge, tag, release or Environment approval."
score: 89.25
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v4.0.1, 388e310)

## A. IDENTIFICACIÓN

```text
Repositorio:        jlbellonGmail/ai-native (público)
Ruta:               C:\Proyectos\worktrees\ai-native\release-audit-v4 (worktree)
Branch:             release/v4.0.1 (= origin por ls-remote; PR #175 abierta contra main, MERGEABLE, 17 commits,
                    mergeStateStatus BLOCKED: falta el check requerido ai-native/merge-gate, ver N-44)
Commit:             388e310cf3aa4691f8b9541b8c016b9d36a61ed9 (= AUDITED_SHA congelado; igual a HEAD al empezar y al terminar)
Base:               origin/main = ced0969 (merge de #174) = cabeza viva de main por ls-remote
Tag:                ninguno en el commit. Tag v4.0.0 (objeto cf3059e) sobre ced0969, sin release. Release vigente: v3.4.3 (Latest)
Fecha:              2026-11-03 (UTC 13:23)
Worktree:           limpio al empezar y al terminar (git status --short vacío); este informe vive FUERA del repositorio
Perfil:             PLATFORM 1.2 (único perfil cargado)
QUALITY_SCORE:      1.1
AUDIT_RULES:        1.1 (AUDIT_PROMPT 1.1, auditMethod 1.2)
Nivel de confianza: MEDIA
Auditor:            Claude Code (claude-opus-5-5). Subagente con contexto aislado, lanzado desde la sesión del Builder,
                    con instrucciones de solo lectura. No participó en la implementación, en sus revisiones ni en las
                    auditorías c99ed8f y b43b5d6 (sus informes los escribieron otros auditores; aquí son contexto
                    histórico, §67 AUDIT_RULES). El humano debe ponderar esa independencia: el encargo lo hizo la sesión
                    del Builder y el proceso del auditor corre con la misma identidad de Windows y de GitHub que el
                    Builder (N-40, ROOT-003). El auditor no aprobó ningún Environment ni deployment.
Entorno:            Windows 11 Pro 10.0.26200, Git Bash, node v26.12.1, gh (solo lectura), %TEMP% por defecto
Temporales:         <scratchpad>/audit3 (fuera del árbol): sondas propias (n36probe, testonly, mut42, pjcmp), logs de
                    tests, builds b1/b2/bneg, release v3.4.3 descargada (v343) y extraída (x343), bundle extraído (x401),
                    logs de CI y de merge-gate
```

## B. VEREDICTO EJECUTIVO

```text
Score bruto: 89.25/100
Score final: 89.25/100
Quality Gate aplicado: ninguno
Confianza: MEDIA
Estado: APTO CON CORRECCIONES
Consistencia metodológica: PASS
```

**Contra el umbral PLATFORM de 90 (tolerancia 2, mínimo 88): DENTRO DE LA TOLERANCIA, NO ALCANZA 90 (+1.25 sobre 88; −0.75 respecto de 90).** `release-gate` contra este informe da PASS_WITH_WARNINGS, no PASS (V-38). 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR puntuables:

* 17 heredados de `6f47eb2`, todos re-verificados;
* N-39 (residual) y N-40, todavía abiertos;
* 2 nuevos: N-43 y N-44.

No hay N/A ni gates.

**Cerrado desde `b43b5d6` (verificado por mí).**

* **N-42 CERRADO (E4).** `bundle.mjs:27` excluye exactamente `^runtime/audit/fixtures.mjs$`. Dos builds dan los 6 assets idénticos (`cmp`): `sha256:949d4259…6f77d45`, 234 archivos (antes 235). `runtime/audit/fixtures.mjs` no aparece en el bundle. Ningún archivo publicado importa un módulo de fixtures (V-24, V-25). El test `release.test.mjs:115` mata al mutante: sin el patrón, `isShipped` devuelve `true` (V-27). `fixtures.test.mjs` sigue en verde, 9/9 (V-21). El módulo no es entry point: `main.mjs` no lo despacha y no lee `process.argv`.
* **N-38 CERRADO (E4 sobre el delta; decisión humana registrada).** Re-medí el delta de consumidor. Descargué la release v3.4.3: `SHA256SUMS` OK, digest `12c15adc…ea7b`, igual al de `SESSION-CONTEXT.md`. La comparé con mi build de 388e310:
  * `diff -rq` da 5 archivos nuevos, 1 eliminado y 5 cambiados;
  * en `platform.json` son idénticos `schemaVersion`, `components`, `capabilities` y `bootstrap` (V-25, V-26);
  * no hay lógica sensible a la MAJOR en `runtime/{bootstrap,cli,consumer}` (V-37);
  * el gate nuevo solo se dispara por `workflow_dispatch`.

  Por tanto, la clasificación «contenido MINOR» es cierta. Por el método, la corrección es adecuada:
  * el hallazgo de `c99ed8f` pedía «la justificación de la MAJOR … **o la excepción humana registrada**, y el delta de consumidor», y las dos cosas existen;
  * la excepción la decide el humano, que es la autoridad de versión. La motivan otra norma del repositorio (ADR-004:25, tags inmutables) y un espacio de tags monótono;
  * los cinco prerrequisitos de §Regla general están mapeados (`V4.0.1-PATCH.md:68-73`), y la evidencia en roadmap es D5;
  * volver a `v3.5.0` no es una alternativa conforme: publicaría una versión menor que un tag público existente.

  La política sigue sin mecanismo de excepciones y no remite a D5. Lo dejo como S-32 (no resta). Las imprecisiones del registro van aparte, en N-43.
* **N-36 sigue CERRADO (E4 + CI).** Mi sonda llama a `findWorkflowRevision` y `evaluateWorkflowRevision` reales de HEAD:
  * con la configuración de HEAD: HEAD, `ced0969`, `b43b5d6` y `origin/main` dan `r2-ced0969cf38b` y `[]`; `08a8581` y `07d93c1` dan `r1` y `[]`;
  * con la configuración de `origin/main`: HEAD y `ced0969` dan `WORKFLOW_REVISION_UNKNOWN` (V-29);
  * ningún `trustedFile` cambió en `ced0969..HEAD` (V-30).

  El test de drift pasa en local y en la CI de los dos SO (V-20, V-31).

**Lo que sigue abierto.**

* **N-39 PARCIAL (residual).** La línea falsa está corregida. `SESSION-CONTEXT.md:15` coincide ahora con `merge-base --is-ancestor`: `07d93c1` y `08a8581` son ancestros de `develop`, y `ced0969` y 388e310 no lo son (V-36). Sigue la divergencia `main`/`develop`, que se sincronizará tras la release:
  * `compare develop...main`: ahead 3 / behind 4;
  * el `SESSION-CONTEXT.md` de `develop` (`491a01e`) aún dice `V3.4.3_RELEASED_AND_VERIFIED` y no menciona v4 ni el tag consumido;
  * `develop` no tiene #174 desde el 2026-11-03, aunque #169 y #171 se sincronizaron enseguida (#170, #173).

  No se cumple el criterio de cierre que fijó `b43b5d6`, así que Q8.1 sigue en MENOR.
* **N-40 abierto, re-verificado.** `check-agent-isolation` da BLOCKED desde este proceso. `ai-native-human-review` tiene `prevent_self_review: false` (V-35).

**Nuevo.**

* **N-43 (MINOR, Q1.3).** El registro de N-38 tiene afirmaciones inexactas frente a lo medido:
  1. `V4.0.1-PATCH.md:53` dice «Sin archivos eliminados». Hay uno: `runtime/audit/fixtures.mjs`. El propio `:81` lo dice;
  2. `:80` dice «tres módulos». Son cuatro, porque falta `pretag.mjs`;
  3. según `:81`, `plan-approval-zip.fixture.mjs` «deja de publicarse», pero nunca estuvo en una release publicada;
  4. `:85` dice que la MAJOR «esta candidata no la revisa», cuando `:50-66` la revisa y la decide;
  5. el delta no menciona que, por `VERSIONING-POLICY.md` §Compatibilidad, la línea v3 pasa a «solo correcciones de seguridad».

  Q1.3 ya estaba en MENOR por N-31, así que la nota no cambia.
* **N-44 (MINOR, Q6.3).** El `merge-gate` del SHA exacto (run 41639881054) **falló**. A los 16 minutos de sondeo, `gh api repos/…/pulls/175` devolvió HTTP 503. `fetchPr` no reintenta (`merge-gate.mjs:71-75,100-104`), así que un 5xx transitorio aborta la ventana de 30 minutos. Consecuencias:
  * `human-review` y `merge-gate-finalize` quedaron SKIPPED;
  * el check requerido `ai-native/merge-gate` no existe para 388e310, y la PR está BLOCKED.

  El gate falla cerrado, como debe (Q8.3 no se toca). El defecto es de fiabilidad: hay que relanzar el job a mano. Q6.3 ya estaba en MENOR por N-26, así que la nota no cambia.

**Sensibilidad.** El único cambio de nota respecto de `b43b5d6` está en Q6.4: pasa de MENOR a COMPLETO (+0.75) al cerrarse N-38. N-42 se cierra, pero Q2.2 sigue en MENOR por F-002. Para llegar a 90 falta +0.75, y lo bloquean:

* N-39: sincronizar `develop`, +0.50;
* N-40: +0.50;
* F-002: +0.75;
* o cualquier heredado de 0.75.

Si se aceptara la sincronización post-release como cierre de N-39, el score sería 89.75. Seguiría sin llegar a 90.

## C. ALCANCE Y LIMITACIONES

**Inspeccionado.**

* Diff completo `6f47eb2..388e310`: 29 archivos, +6552/−20, 31 commits.
* Tramo `b43b5d6..388e310`: 3 commits y 7 archivos. Uno de ellos, el informe `b43b5d6`, solo toca `.audit/**`. Los otros dos:
  * `ec5939b` (N-42): `bundle.mjs` y `release.test.mjs`;
  * `388e310` (N-38, N-39): `SESSION-CONTEXT.md`, `execution/current/README.md`, `AI-NATIVE-V3-ROADMAP.md` (D5) y `V4.0.1-PATCH.md`.
* Leídos completos o en las líneas relevantes:
  * `bundle.mjs:1-80`;
  * `release.test.mjs:109-120`;
  * `V4.0.1-PATCH.md` completo;
  * `VERSIONING-POLICY.md` completo;
  * `ADR-004:25-29`;
  * `upgrade.mjs:14,59-128`;
  * `fixtures.mjs:1-25`;
  * `main.mjs` (despacho);
  * `merge-gate.mjs:66-138`;
  * `plan-approval-receipt.mjs:168-186`;
  * `SESSION-CONTEXT.md:1-40` (HEAD y `develop`);
  * `execution/current/README.md` (HEAD y `develop`);
  * la tabla de decisiones del roadmap.
* El resto del delta v4 (`6f47eb2..b43b5d6`) lo auditaron `c99ed8f` y `b43b5d6`. Lo re-verifiqué por diff y por ejecución, no por relectura completa:
  * `runtime/gates`, `governance/gates`, `.github` y `contracts`: diff vacío en `b43b5d6..HEAD`;
  * `trustedFiles`: diff vacío en `ced0969..HEAD`.

**Ejecutado por el auditor en 388e310** (ver §G):

* los 10 validadores oficiales;
* `git diff --check` y `ls-files --eol`;
* 5 archivos de test, uno a uno: 158 tests;
* la sonda N-36;
* 2 builds y un negativo;
* la descarga y verificación de v3.4.3, con el diff del bundle y de `platform.json`;
* una sonda de mutación de N-42 y otra de módulos importados solo por tests;
* `pretag` real;
* `check-agent-isolation`, `check-environment` y `trusted-config`;
* `release-gate`, antes y después del informe;
* la lectura de los logs de la CI y del `merge-gate` remotos del SHA exacto.

**No ejecutado localmente.**

* La suite completa, por la RAM del host.
* `plan-approval-artifact.test.mjs`, `review-ledger`, adapters, bootstrap y CLI. Sus áreas no tienen diff (V-05, V-30); la evidencia es la CI remota del SHA exacto (V-31).

**No verificado.**

* La autorización humana de r2 y la orden humana del 2026-11-03 de publicar v4.0.1 (`V4.0.1-PATCH.md:64`). Solo hay afirmaciones del Builder.
* `current_user_can_approve` para 388e310: no hay deployment pendiente, porque `human-review` quedó SKIPPED (N-44).
* Un dispatch real de plan approval tras el merge.
* La ubicación de la clave privada de la App.
* F-007.
* Codex y OpenCode.

**Accesos remotos.** `gh` autenticado como el propietario y usado solo en lectura:

* `pr view 175`;
* `run list` y `run view`, con logs, de CI y `merge-gate`;
* `release list` y `release download v3.4.3`, a un directorio temporal;
* `api` GET de:
  * `repos/…` (visibilidad);
  * rulesets y `rulesets/24405506`;
  * `branches/develop/protection` y `rules/branches/develop`;
  * `compare`;
  * los environments y `pending_deployments`;
  * `users/…[bot]`;
  * code-scanning (también en `refs/pull/175/merge`), dependabot y secret-scanning;
* `ls-remote`.

## D. CONTRATO DETECTADO

| ID | Capacidad/Requisito | Clasificación | Fuente | Estado |
|---|---|---|---|---|
| C-01 | Chequeo previo al tag con las reglas de `release.yml`. Sin overrides; lo no evaluable es FAIL | OBLIGATORIO (PR #175) | `pretag.mjs`, `VERSIONING-POLICY.md:76` | VERIFICADO (E4: 10/10 local tras un flake, CI ×2; ejecución real V-23) |
| C-02 | `CLI_VERSION` = tag `v4.0.1`; el build rechaza otra versión | OBLIGATORIO | `ai-native.mjs`, `cli-version.mjs` | VERIFICADO (V-24) |
| C-03 | Un tag publicado no se mueve ni se reutiliza | OBLIGATORIO | `VERSIONING-POLICY.md:76`, ADR-004:25 | VERIFICADO normativamente (`v4.0.0` = `ced0969`; `pretag`: v4.0.1 libre). Sin enforcement técnico de tags (F-008) |
| C-04 | SemVer: MAJOR solo por cambio incompatible, con impacto y evidencia en el roadmap | OBLIGATORIO | `VERSIONING-POLICY.md:23-64` | **EXCEPCIÓN HUMANA REGISTRADA** (D5; `V4.0.1-PATCH.md:50-81`). Delta medido cierto en lo sustancial (V-25, V-26). Imprecisiones: N-43 |
| C-05 | Bundle determinista; delta de consumidor aditivo; sin código de solo-tests | OBLIGATORIO (perfil Q6) | `build.mjs`, `bundle.mjs` | VERIFICADO (V-24, V-25, V-27). N-42 cerrado |
| C-06 | Verificador Plan Approval Receipt fail-closed | DECLARADO como *bootstrap* | `PLAN-APPROVAL-RECEIPT.md:5-7` | IMPLEMENTADO, con 118 tests (V-20) |
| C-07 | La configuración confiable autoriza exactamente los blobs que ejecuta `main` | OBLIGATORIO para C-06 | `plan-approval.json` | VERIFICADO en la candidata (V-29); efectivo en `main` solo tras el merge |
| C-08 | Coordinator consumer y TOCTOU extremo a extremo | FUTURO (declarado «NO RESUELTO») | `PLAN-APPROVAL-COORDINATOR-CONTRACT.md` | No implementado, como se declara (R-2) |
| C-09 | Separación humano/agente (G5) antes de operar la App | PROPUESTA con orden | `AGENT-HUMAN-IDENTITY-SEPARATION.md` | **No implantada** (N-40) |
| C-10 | Doc drift verde; todo test corre en CI; acciones fijadas por SHA | OBLIGATORIO | validadores | VERIFICADO (V-08..V-16) |
| C-11 | Tests de contrato, paridad y regresión en CI Linux y Windows | OBLIGATORIO | `ci.yml` | VERIFICADO en 388e310 (V-31) |
| C-12 | Gates server-side y HITL único de merge; los cambios al plano de control requieren `human-review` | OBLIGATORIO | ruleset `ai-native-main`, `merge-gate` | IMPLEMENTADO y fail-closed. En 388e310, `merge-gate` falló por HTTP 503 (N-44) y la PR está BLOCKED. Con F-005 y N-25; el HITL lo puede alcanzar el agente (N-40) |
| C-13 | Fuente de verdad del estado: `SESSION-CONTEXT.md` y `execution/current/` | OBLIGATORIO | `CLAUDE.md`, `SESSION-CONTEXT.md:3` | Correcta en la candidata. `develop` sigue en el estado v3.4.3 (N-39 residual) |
| C-14 | `.audit` es gate de release, nunca de merge | OBLIGATORIO | `audit/README.md`, schema | VERIFICADO |

## E. MATRIZ DE PUNTUACIÓN

| Área | Máximo | Obtenido | Estado |
|---|---:|---:|---|
| Q1 Conformidad | 12 | 11.25 | MENOR (N-31, N-43) |
| Q2 Reutilización | 12 | 11.25 | MENOR (F-002) |
| Q3 Arquitectura | 12 | 12.00 | COMPLETO |
| Q4 Documentación/DX | 12 | 11.25 | MENOR (N-11) |
| Q5 Calidad/Tests | 16 | 13.50 | MENOR (N-24, F-003, N-29, N-27, F-004) |
| Q6 Git/CI/CD/Release | 16 | 14.00 | MENOR (F-005, N-25, N-26, N-44, F-006) |
| Q7 Seguridad | 12 | 9.50 | MENOR (F-007, N-32, F-008, CodeQL #27, F-009, F-010) |
| Q8 Automatización/Gobernanza | 8 | 6.50 | MENOR (N-39, N-40, F-005) |
| **TOTAL** | **100** | **89.25** | APTO CON CORRECCIONES |

## F. DETALLE POR SUBCRITERIO

Leyenda:

* **E**: evaluado de nuevo sobre el delta;
* **V**: hallazgo re-verificado en vivo o en el árbol;
* **D**: el diff `6f47eb2..388e310` está vacío sobre el área (`git diff --quiet` → 0, V-05).

| ID | Criterio | Máx. | Nivel | Obtenido | Evidencia | Hallazgo | Justificación (re-verificación) |
|---|---|---:|---|---:|---|---|---|
| Q1.1 | Propósito y alcance | 3 | COMPLETO | 3.00 | `V4.0.1-PATCH.md`, `PLAN-APPROVAL-RECEIPT.md:5-7` | — | E. Están declarados el incidente, la corrección, la decisión de versión, lo abierto y los límites de v4 |
| Q1.2 | Capacidades prometidas presentes | 3 | COMPLETO | 3.00 | V-18..V-24, V-29 | — | E. `pretag` y el build hacen lo que prometen; el verificador v4 existe, con su configuración cubriendo el código de `main` |
| Q1.3 | Coherencia doc/config/código | 3 | MENOR | 2.25 | V-25; `V4.0.1-PATCH.md:53,80,81,85`; `runtime/circuit` sin diff | N-31, **N-43** | E + D. El registro del delta contradice la medición en puntos concretos (N-43). Sigue N-31 (heredado, D) |
| Q1.4 | Sin requisitos obligatorios incompletos | 3 | COMPLETO | 3.00 | §D | — | E. Consumidor y TOCTOU declarados como futuro; lo pendiente de la PR son pasos de promoción |
| Q2.1 | Inicialización reproducible | 3 | COMPLETO | 3.00 | V-24 | — | E. Build ×2 idéntico |
| Q2.2 | Sin residuos | 3 | MENOR | 2.25 | `ls governance/cleanup` (4), V-25, V-28 | F-002 | V + E. N-42 cerrado. Sigue F-002. Sin rutas ni secretos en el delta (V-06) |
| Q2.3 | Personalización clara | 3 | COMPLETO | 3.00 | — | — | D (`template/`, `core/`) |
| Q2.4 | Portabilidad | 3 | COMPLETO | 3.00 | `pretag.test.mjs` | — | E. Sin dependencias de host nuevas |
| Q3.1 | Estructura | 3 | COMPLETO | 3.00 | V-04 | — | E |
| Q3.2 | Responsabilidades | 3 | COMPLETO | 3.00 | `bundle.mjs:20-34` | — | E. La exclusión vive en la única lista de exclusiones |
| Q3.3 | Simplicidad | 3 | COMPLETO | 3.00 | diff `ec5939b` | — | E. Corrección mínima: un patrón anclado y su test |
| Q3.4 | Evolución | 3 | COMPLETO | 3.00 | `release.test.mjs:117-119` | — | E. El test fija que la exclusión es exacta y no arrastra a los vecinos |
| Q4.1 | README | 3 | COMPLETO | 3.00 | — | — | D |
| Q4.2 | Instalación/bootstrap | 3 | MENOR | 2.25 | `README.md` sin diff | N-11 | D |
| Q4.3 | Operaciones | 2 | COMPLETO | 2.00 | `V4.0.1-PATCH.md:87-92` | — | E. Orden de release: merge commit, `pretag` y tag |
| Q4.4 | Contribución | 2 | COMPLETO | 2.00 | — | — | D |
| Q4.5 | Troubleshooting | 2 | COMPLETO | 2.00 | `audit/README.md:23` | — | D |
| Q5.1 | Controles automáticos | 3 | COMPLETO | 3.00 | V-07..V-16 | — | E. Los 10 validadores dan exit 0; `git diff --check` (complementario) = 0 |
| Q5.2 | Estrategia de pruebas | 3 | MENOR | 2.25 | áreas sin diff | N-24, F-003 | D. El delta sigue la estrategia: un test de regresión exacto por exclusión |
| Q5.3 | Pruebas ejecutables y pasando | 4 | MENOR | 3.00 | V-18..V-22, V-31 | N-29, N-27 | E + V. Local: 158/158 tras **reproducir N-29** (EPERM de git en `.git/objects` de un repo temporal, 1 de 10 en `pretag`; el reintento da 10/10). CI del SHA exacto: 1272 tests y 0 FAIL en los dos SO |
| Q5.4 | Regresión | 3 | COMPLETO | 3.00 | `release.test.mjs:115`, V-27 | — | E. El test de N-42 mata al mutante |
| Q5.5 | Quality gates | 3 | MENOR | 2.25 | `.github/` sin diff fuera del workflow v4 | F-004 | D |
| Q6.1 | Estrategia Git | 3 | COMPLETO | 3.00 | V-03, V-04 | — | E. Commits atómicos con su ID de hallazgo; PR = local = origin |
| Q6.2 | Protección de ramas | 3 | MENOR | 2.25 | V-33 | F-005, N-25 | V. `required_approving_review_count 0`; `develop`: 404 y 0 reglas |
| Q6.3 | CI | 3 | MENOR | 2.25 | V-31, V-32 | N-26, **N-44** | V + E. CI y pilot verdes en 388e310, incluido el offline Ubuntu. `merge-gate` falló por un 503 sin reintento (N-44). N-26 no se reprodujo, pero sigue sin causa demostrada |
| Q6.4 | Versionado y releases | 3 | **COMPLETO** | 3.00 | V-24..V-26, V-37; `AI-NATIVE-V3-ROADMAP.md` D5; `V4.0.1-PATCH.md:50-81` | — | E. N-38 cerrado: excepción humana registrada, motivada por ADR-004 y con delta medido (cierto en lo sustancial, V-25/V-26). El PATCH v4.0.1 sobre el tag consumido está justificado. Las imprecisiones de redacción se cuentan en Q1.3 (N-43), no aquí |
| Q6.5 | Build reproducible | 2 | COMPLETO | 2.00 | V-24 | — | E. `sha256:949d4259…6f77d45` ×2; 234 archivos |
| Q6.6 | Compatibilidad/rollback | 2 | MENOR | 1.50 | `runtime/bootstrap` sin diff | F-006 | D |
| Q7.1 | Secretos | 3 | MENOR | 2.25 | V-06, V-33 | F-007 | V. Secret scanning: 0 |
| Q7.2 | Dependencias | 2 | MENOR | 1.50 | V-33 | N-32 | V. 10 alertas Dependabot (1 high, 8 medium, 1 low; #145-154), en `template/` y `foundation/` |
| Q7.3 | Seguridad CI/CD | 2 | MENOR | 1.50 | V-33 | F-008, CodeQL #27 | V. 0 rulesets de tag; CodeQL abierta: solo #27; 0 en `refs/pull/175/merge` |
| Q7.4 | Defaults seguros | 2 | COMPLETO | 2.00 | V-23, V-29, V-32, V-34 | — | E. Todo falla cerrado: `pretag` NOT READY, `merge-gate` sin check ante el 503, `trusted-config` BLOCKED por `CONFIG_LOCAL_DIFFERS` |
| Q7.5 | Supply chain | 3 | MENOR | 2.25 | sin diff | F-009, F-010 | D |
| Q8.1 | Fuente única de verdad | 2 | MENOR | 1.50 | V-36 | **N-39 (residual)** | V. La línea de la candidata es cierta; `develop` conserva un estado v3.4.3 sin v4 y no tiene #174 |
| Q8.2 | Responsabilidades y límites | 2 | MENOR | 1.50 | V-35 | **N-40** | V. BLOCKED; `prevent_self_review: false` en `human-review` |
| Q8.3 | Fail-safe | 2 | MENOR | 1.50 | V-33 | F-005 (CAUSA RAÍZ COMPARTIDA con Q6.2) | V. N-44 confirma el fail-closed del `merge-gate`: no resta aquí |
| Q8.4 | Trazabilidad | 2 | COMPLETO | 2.00 | V-04 | — | E. Informe `b43b5d6` → N-IDs en los commits → tests → CI → este informe |

## G. LEDGER DE VERIFICACIÓN

Todas son VERIFICACIÓN OFICIAL DEL PROYECTO, salvo las marcadas (A) (VERIFICACIÓN COMPLEMENTARIA DEL AUDITOR) y (R) (evidencia remota leída). Los logs y las sondas están en `<scratchpad>/audit3/`.

| ID | Verificación | Comando/Método | Resultado | Estado | Evidencia |
|---|---|---|---|---|---|
| V-01 | SHA congelado | `git rev-parse HEAD` (inicio y fin) | `388e310cf3aa4691f8b9541b8c016b9d36a61ed9` | PASS | — |
| V-02 | Worktree limpio | `git status --short` | vacío al inicio, durante y al final | PASS | — |
| V-03 | PR y base (R) | `gh pr view 175`; `git ls-remote origin` | `headRefOid` = HEAD; OPEN; MERGEABLE; 17 commits; `release/v4.0.1` = 388e310; `main` = `ced0969` = `origin/main`; `v4.0.0^{}` = `ced0969`; `v4.0.1` inexistente | PASS | — |
| V-04 | Alcance (A) | `git diff --stat 6f47eb2..HEAD` y `b43b5d6..HEAD`; `git show --stat ec5939b 388e310` | 29 archivos, +6552/−20. Tramo final: 7 archivos (1 en `.audit/**`), 2 commits con N-ID | PASS | — |
| V-05 | Áreas heredadas sin diff (A) | `git diff --quiet 6f47eb2 HEAD -- <p>` | 0 para `README.md`, `AGENTS.md`, `core`, `scripts`, `ci.yml`, `release.yml`, `merge-gate.yml`, `runtime/{bootstrap,audit,pilot,adapters,circuit,lib}`, `merge-gate.mjs`, `template`, `foundation`, `evaluation/fixtures`, `package.json`, `governance/cleanup`, `build.mjs`, `cli-version.mjs` y `assert-unreleased.mjs`. `.github` y `contracts`: solo los 3 archivos v4 ya auditados | PASS | — |
| V-06 | Higiene del delta (A) | grep de rutas de host, tokens, claves y TODO/FIXME en las líneas añadidas de `b43b5d6..HEAD` (sin `.audit`) | 0 coincidencias | PASS | — |
| V-07 | EOL y espacios (A) | `git ls-files --eol`; `git diff --check 6f47eb2 HEAD` | ningún archivo fuera de `i/lf`/`-text`; `--check` exit 0 | PASS | — |
| V-08 | Método de auditoría | `node runtime/audit/cli.mjs check` | PASS, exit 0 | PASS | — |
| V-09 | Paridad | `node parity/validate-parity.mjs` | exit 0; 95/95 | PASS | — |
| V-10 | Contratos | `node contracts/validate-contracts.mjs` | exit 0; 7 datos | PASS | — |
| V-11 | Core / integridad | `core/validate-core.mjs`; `runtime/status/validate-integrity.mjs` | exit 0 ×2 | PASS | — |
| V-12 | Doc drift | `node runtime/docs/validate-doc-drift.mjs` | PASS | PASS | — |
| V-13 | Entry points | `node runtime/adapters/validate-entrypoints.mjs` | PASS | PASS | — |
| V-14 | Tests listados en CI | `node scripts/validate-ci-tests-listed.mjs` | «all 102 committed *.test.mjs files are run by a workflow» | PASS | — |
| V-15 | Acciones fijadas | `node scripts/validate-actions-pinned.mjs` | «all actions … pinned by full SHA» | PASS | — |
| V-16 | Matriz de compatibilidad | `node evaluation/compat/validate-compat-matrix.mjs` | exit 0; 3 fixtures | PASS | — |
| V-17 | Release-gate antes del informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 388e310… --root .` | FAIL (33 errores), exit 1: 1 real («no current valid … for 388e310») y 32 STALE (incluido `b43b5d6`) | ESPERADO | `rg-before.txt` |
| V-18 | Test `pretag` | `node --test --test-concurrency=1 runtime/release/pretag.test.mjs` (×2) | 1.ª: 9/10. El fallo es en el *setup*: `git add -A` → «unable to write file .git/objects/8c/… Permission denied», no una aserción. 2.ª: **10/10 PASS**, 0 «Permission denied» | PASS (reproduce N-29) | `t-pretag.log`, `t-pretag2.log` |
| V-19 | Test release/bundle | idem `runtime/release/release.test.mjs` | **19/19 PASS**, incluido `isShipped` (N-41/N-42) | PASS | `t-release.log` |
| V-20 | Test verificador v4 | idem `runtime/gates/plan-approval-receipt.test.mjs` | **118/118 PASS**, incluido «drift (N-36)» | PASS | `t-receipt.log` |
| V-21 | Test de fixtures de auditoría | idem `runtime/audit/fixtures.test.mjs` | **9/9 PASS**: el único importador de `fixtures.mjs` sigue funcionando desde el árbol | PASS | `t-fixtures.log` |
| V-22 | Otro consumidor de `isShipped` | idem `runtime/consumer/knowledge.test.mjs` | **12/12 PASS** | PASS | `t-knowledge.log` |
| V-23 | `pretag` real (A) | `node runtime/release/pretag.mjs --tag v4.0.1 --candidate 388e310… --repo jlbellonGmail/ai-native` | NOT READY, exit 1. FAIL solo en «reachable from origin/main» (falta el merge) y en «release-gate» (falta este informe; +32 STALE). PASS: origin = `--repo`, tag libre local y remoto, sin release, `ci.yml` verde (1 run) y `CLI_VERSION` | PASS (fail-closed esperado) | — |
| V-24 | Build reproducible y negativo | `node runtime/release/build.mjs --version v4.0.1 --commit 388e310… --out b1` y `b2`; `--version v4.0.0` → `bneg` | exit 0 ×2; los 6 assets idénticos por `cmp`; `sha256:949d4259e410e1e9960a02bb3b6c75b0ba5be949480f07b1923a92deb6f77d45`; 234 archivos. Negativo: exit 1, «declares CLI_VERSION v4.0.1; this release is v4.0.0» | PASS | `b1.log`, `bneg.log` |
| V-25 | Delta de consumidor (A/R) | `gh release download v3.4.3` en un directorio vacío; `sha256sum -c SHA256SUMS`; extracción; `diff -rq x343 x401` | Los 6 assets OK; tar `12c15adc…ea7b` = `SESSION-CONTEXT.md:12`. v3.4.3: 230 archivos; candidata: 234. **Solo en 388e310** (5): `plan-approval-receipt.schema.json` y `runtime/gates/plan-approval{,-receipt,-artifact}.mjs` y `runtime/release/pretag.mjs`. **Solo en v3.4.3** (1): `runtime/audit/fixtures.mjs`. **Cambian** (5): `audit/README.md`, `contracts/README.md`, `platform.json`, `ai-native.mjs`, `bundle.mjs`. `bootstrap` y skills idénticos. 0 imports de módulos `*fixture*` en el bundle | PASS (contradice `V4.0.1-PATCH.md:53,80`: N-43) | — |
| V-26 | `platform.json` (A) | `pjcmp.mjs` sobre el embebido y el publicado | Idénticos `schemaVersion`, `components`, `capabilities` y `bootstrap`. Cambian solo `version`, `commit`, `generatedAt` y, en el publicado, `digest`, `sbom` y `provenance` | PASS (confirma `V4.0.1-PATCH.md:54`) | — |
| V-27 | Mutación de N-42 (A) | `mut42.mjs`: `isShipped` sin el patrón nuevo | HEAD: `isShipped("runtime/audit/fixtures.mjs") = false`; mutante: `true`, así que `release.test.mjs:115` falla. Vecinos (`framework.mjs`, `fixtures-extra.mjs`, `runtime/x/fixtures.mjs`): se publican | PASS | — |
| V-28 | Módulos publicados importados solo por tests (A) | `testonly.mjs`: grafo de imports estáticos de los 114 `.mjs` publicados | 22 candidatos, todos *entry points* de CLI o de workflow (`main.mjs` despacha p. ej. `consumer/l3.mjs`; `pretag.mjs`, `merge-gate.mjs` y `trust-gate.mjs` se ejecutan con `node`). Ninguno es otro residuo de la clase N-42 | PASS (ROOT-005 mitigada) | — |
| V-29 | Sonda N-36 (A) | `n36probe.mjs`: evaluador real de HEAD (= blob de HEAD); config `git show <cfg>:governance/gates/plan-approval.json`; blobs `git rev-parse <ref>:<trustedFile>` | **config HEAD**: HEAD, `ced0969`, `b43b5d6` y `origin/main` → `r2-ced0969cf38b`, `[]`; `08a8581` y `07d93c1` → `r1-07d93c13d7a8`, `[]`. **config origin/main**: HEAD y `ced0969` → `null`, `["WORKFLOW_REVISION_UNKNOWN"]` | PASS (N-36 sigue cerrado) | — |
| V-30 | Área de confianza sin cambios (A) | `git diff --quiet b43b5d6 HEAD -- runtime/gates governance/gates .github contracts`; `git diff --quiet ced0969 HEAD -- <6 trustedFiles>`; `rev-parse` | exit 0 y exit 0. Log vacío. Blobs iguales: `d8ff23f`, `0908ae0`, `1bc6208`, `483d6ea`, `2798b5b`, `124c505` | PASS | — |
| V-31 | CI remota de 388e310 (R) | `gh run list --branch release/v4.0.1`; `gh run view 41639887952 --log` | Los 10 workflows de `pull_request` y `trust-gate`: success. ubuntu: 1272 tests, 1271 PASS, 0 FAIL, 1 skip. windows: 1272, 1270 PASS, 0 FAIL, 2 skips. `isShipped` y «drift (N-36)» ✔ en los dos. Pilot: los 4 jobs success. Release dry-run: build success; publish y verify skipped | PASS | `ci.log` |
| V-32 | `merge-gate` de 388e310 (R) | `gh run view 41639881054 --json jobs` y `--log`; `gh pr view 175 --json statusCheckRollup,mergeStateStatus` | **failure**. `Evaluate merge readiness` empezó a las 12:56:11Z, con `WAIT_SECONDS 1800`. A las 13:12:09Z: «Error: gh api repos/jlbellonGmail/ai-native/pulls/175: gh: HTTP 503» en `fetchPr` (`merge-gate.mjs:79`), exit 1. `human-review` y `merge-gate-finalize`: SKIPPED. El check requerido `ai-native/merge-gate` no existe; `mergeStateStatus` BLOCKED | FAIL (externo; fail-closed correcto) → N-44 | `mg.log` |
| V-33 | Plano de control (R) | `gh api` de rulesets y `rulesets/24405506`, `branches/develop/protection`, `rules/branches/develop`, code-scanning (también en `refs/pull/175/merge`), dependabot y secret-scanning | Ruleset `ai-native-main` activo, sin bypass: `required_approving_review_count 0`, merge/squash/rebase permitidos, 6 checks requeridos, incluido `ai-native/merge-gate` (App 5170488). `develop`: 404 y 0 reglas. Rulesets de tag: 0. CodeQL abiertas: [27]; PR: 0. Dependabot: 10 (1 high, 8 medium, 1 low; #145..#154; `foundation`, `template`). Secret scanning: 0 | PASS (con F-005, N-25, F-008, N-32) | — |
| V-34 | Estado vivo v4 (R) | `gh api environments/ai-native-plan-approval`, `users/ai-native-plan-approval%5Bbot%5D`; `gh run list --workflow plan-approval-receipt.yml`; `check-environment`, `trusted-config` | Environment 25906730072: `can_admins_bypass false`, `prevent_self_review true`, reviewer `jlbellonGmail`. Bot 350901564, `Bot`. Un único run, 41369500299 sobre `08a8581`: failure. `check-environment`: PASS. `trusted-config`: BLOCKED `CONFIG_LOCAL_DIFFERS` (esperado antes del merge) | PASS | — |
| V-35 | Aislamiento agente/humano (A/R) | `node runtime/gates/plan-approval.mjs check-agent-isolation`; `environments/ai-native-human-review`; `pending_deployments` de 41639881054 y 41597605799 | **BLOCKED**: `AGENT_HUMAN_GH_ACCOUNT` (gh como `jlbellonGmail`) y `AGENT_GIT_CREDENTIAL` (3 destinos). `human-review`: `prevent_self_review false`, `can_admins_bypass false`. `pending_deployments`: `[]` en los dos (el de 388e310 no llegó a pedirlo; el de `b43b5d6` está cancelado) | FAIL (N-40 abierto) | — |
| V-36 | Fuente de verdad (A/R) | `SESSION-CONTEXT.md:7-37` en HEAD y en `491a01e`; `merge-base --is-ancestor`; `gh api compare` (`develop...main` y `develop...388e310`); `gh pr view 170 173 174` | **`:15` cierta**: `07d93c1` (#169) y `08a8581` (#171) son ancestros de `develop`, por #170 (`99f2a10`) y #173 (`491a01e`); `ced0969` (#174) y 388e310 no. `develop...main`: diverged, ahead 3 / behind 4. Lo único de `develop` son `238a0a4`, ya cherry-picked, y merges. El `SESSION-CONTEXT.md` de `develop` dice `V3.4.3_RELEASED_AND_VERIFIED`, sin v4 | PARCIAL (N-39 residual) | — |
| V-37 | Afirmaciones de N-38 (A/R) | `gh api repos/…` (visibilidad); `ADR-004:25`; `upgrade.mjs`; `git grep -i major` en `runtime/{bootstrap,cli,consumer}`; `on:` de `plan-approval-receipt.yml`; tabla de decisiones del roadmap | Repositorio público: tag `v4.0.0` público. ADR-004: «inmutables, protegidos» (normativo; 0 rulesets de tag, F-008). `upgrade.mjs:67` usa `cmpAny`, sin tratar el cruce de MAJOR. 0 lógica MAJOR en el camino del consumidor. Disparo único: `workflow_dispatch`. D5 registrada. `VERSIONING-POLICY.md` sin cambios en `b43b5d6..HEAD` | PASS | — |
| V-38 | Release-gate contra este informe | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 388e310… --root . --reports <scratchpad>/audit3` | **PASS_WITH_WARNINGS**, exit 0: «score 89.25 is below 90 but within the 2-point tolerance» | ESPERADO (coherente con §B) | `rg-after.txt` |

## H. HALLAZGOS

| ID | Tipo | Severidad | Hallazgo | Evidencia | Criterio | Puntos |
|---|---|---|---|---|---|---:|
| N-31 | CONTRADICTORIO | MINOR | El slug de la spec aísla las revisiones atestadas (heredado) | `runtime/circuit` sin diff (V-05) | Q1.3 | −0.75 (con N-43) |
| N-43 | INCORRECTO | MINOR | El registro del delta de N-38 contradice la medición: «sin archivos eliminados», «tres módulos», fixture «que deja de publicarse» sin haberse publicado nunca, «esta candidata no la revisa», y omite la ventana de soporte de v3 | V-25; `V4.0.1-PATCH.md:53,80,81,85`; `VERSIONING-POLICY.md` §Compatibilidad | Q1.3 | (incluido arriba) |
| F-002 | SOBRA | MINOR | Residuos de cierre en `governance/cleanup/` (heredado) | `ls governance/cleanup` (4) | Q2.2 | −0.75 |
| N-11 | INCOMPLETO | MINOR | Bootstrap del README (heredado) | V-05 | Q4.2 | −0.75 |
| N-24, F-003 | INCOMPLETO | MINOR | Huecos de estrategia de pruebas (heredados) | V-05 | Q5.2 | −0.75 |
| N-29, N-27 | RIESGO | MINOR | Flake de git e inestabilidad del host Windows sin caracterizar (heredados). N-29 se reprodujo en V-18 | V-18; V-05 | Q5.3 | −1.00 |
| F-004 | INCOMPLETO | MINOR | Quality gates (heredado) | V-05 | Q5.5 | −0.75 |
| F-005 | RIESGO | MINOR | `required_approving_review_count 0` en `main` | V-33 | Q6.2, Q8.3 | −0.375 / −0.50 (CAUSA RAÍZ COMPARTIDA) |
| N-25 | FALTA | MINOR | `develop` sin ruleset ni protección | V-33 | Q6.2 | −0.375 |
| N-26 | INCOMPLETO | MINOR | Pilot offline Ubuntu intermitente (Docker exit 125), sin causa demostrada; verde en 388e310 | V-31 | Q6.3 | −0.75 (con N-44) |
| N-44 | RIESGO | MINOR | `merge-gate` sin reintento ante 5xx transitorio: un 503 a los 16 min abortó el run de 388e310 y dejó la PR sin el check requerido | V-32; `merge-gate.mjs:71-75,100-104` | Q6.3 | (incluido arriba) |
| F-006 | INCOMPLETO | MINOR | Compatibilidad/rollback (heredado) | V-05 | Q6.6 | −0.50 |
| F-007 | NO VERIFICADO | MINOR | Gestión de secretos no verificable por API | V-33 | Q7.1 | −0.75 |
| N-32 | RIESGO | MINOR | 10 alertas Dependabot (1 high) en `template/` y `foundation/` | V-33 | Q7.2 | −0.50 |
| F-008 | FALTA | MINOR | 0 rulesets de tag; CodeQL #27 abierta | V-33 | Q7.3 | −0.50 |
| F-009, F-010 | INCOMPLETO | MINOR | Supply chain (heredados) | V-05 | Q7.5 | −0.75 |
| N-39 | OBSOLETO | MINOR | Residual: `develop` diverge de `main` (le falta #174) y su fuente de verdad sigue en el estado v3.4.3 | V-36 | Q8.1 | −0.50 |
| N-40 | RIESGO | MINOR | G5 no implantada: el proceso del agente tiene la identidad del propietario, que puede aprobar `human-review` y plan approval | V-35; `AGENT-HUMAN-IDENTITY-SEPARATION.md` | Q8.2 | −0.50 |

**Total abierto: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 21 MINOR.**

* **Heredados de `6f47eb2` (17):** N-31, F-002, N-11, N-24, F-003, N-29, N-27, F-004, F-005, N-25, N-26, F-006, F-007, N-32, F-008, F-009 y F-010. CodeQL #27 se cuenta dentro de F-008.
* **De `c99ed8f`/`b43b5d6` todavía abiertos (2):** N-39 (residual) y N-40.
* **Nuevos (2):** N-43 y N-44.
* **Cerrados en este tramo (2 MINOR):** N-38 y N-42. N-36, N-37 y N-41 siguen cerrados.

**Estado de N-36..N-42.**

| ID | Afirmación del Builder | Verificación del auditor | Estado |
|---|---|---|---|
| N-36 | r2 registrada; config en LF; test de drift | V-07, V-20, V-29, V-30, V-31. La autorización humana no es verificable; la barrera técnica es `human-review`, que hoy no se ha llegado a pedir (N-44) | **CERRADO** (se mantiene) |
| N-37 | `PLAN-APPROVAL-RECEIPT.md` alineado | Sin diff en `b43b5d6..HEAD`. Estado vivo igual (V-34) | **CERRADO** (se mantiene) |
| N-38 | La línea v4, como excepción humana a §MAJOR (D5); delta medido; política intacta | V-25, V-26, V-37. El contenido es MINOR. La excepción está registrada en roadmap y motivada. Es la corrección que pidieron `c99ed8f` y `b43b5d6` | **CERRADO**. Las imprecisiones del registro van en N-43; S-32 |
| N-39 | Línea `MAIN_DEVELOP` corregida | V-36. La línea es cierta. Sigue la divergencia, y `develop` tiene un estado v3.4.3 sin v4 | **PARCIAL (abierto, residual)** |
| N-40 | Abierto, decisión humana | V-35. BLOCKED | **ABIERTO** |
| N-41 | `*.fixture.mjs` fuera del bundle | V-25: ausente; V-19 | **CERRADO** (se mantiene) |
| N-42 | `runtime/audit/fixtures.mjs` fuera del bundle | V-19, V-21, V-24, V-25, V-27, V-28 | **CERRADO** |

**N-43 (MINOR, nuevo).**

* **Descripción.** El registro con el que se cierra N-38 se presenta como «medida, no supuesta» (`V4.0.1-PATCH.md:52`), pero tiene afirmaciones que la medición (V-25) contradice o que quedaron obsoletas:
  1. `:53` dice «Sin archivos eliminados». El bundle de 388e310 no tiene `runtime/audit/fixtures.mjs`, que sí estaba en v3.4.3. Es una eliminación, la que dice el propio `:81`.
  2. `:80` dice «tres módulos y un schema nuevos». Son cuatro módulos: `plan-approval.mjs`, `plan-approval-receipt.mjs`, `plan-approval-artifact.mjs` y `pretag.mjs`.
  3. `:81` dice que `runtime/gates/plan-approval-zip.fixture.mjs` «deja de publicarse», pero no existe en ninguna release publicada: no está en v3.4.3 y v4.0.0 no tiene release.
  4. `:85` («Versión: v4.0.1») sigue diciendo «La decisión MAJOR (v4) la tomó el humano con el tag `v4.0.0`; esta candidata no la revisa». La sección §SemVer (`:50-66`) la revisa y la decide.
  5. Falta un impacto: según `VERSIONING-POLICY.md` §Compatibilidad («Ventana de soporte»), con v4 vigente la línea v3 pasa a recibir solo correcciones de seguridad. El delta de consumidor no lo menciona.

  La clasificación MINOR y la conclusión «sin migración» siguen siendo correctas (V-26, V-37).
* **Impacto.** Bajo. Un lector del registro de versión recibe un inventario del delta que no cuadra con el bundle, y una frase que contradice la decisión registrada.
* **Causa raíz.** El registro se escribió a partir de la lista del Builder, no del `diff -rq` que cita.
* **Corrección mínima.**
  * `:53` → «Un archivo eliminado: `runtime/audit/fixtures.mjs` (solo de test, N-42)».
  * `:80` → «cuatro módulos (`plan-approval*.mjs` ×3 y `pretag.mjs`) y un schema».
  * `:81` → limitarlo a `runtime/audit/fixtures.mjs`.
  * `:85` → remitir a §SemVer.
  * Añadir una línea sobre la ventana de soporte de v3.
* **Verificación.** Leer las líneas y compararlas con `diff -rq` del bundle v3.4.3 contra el build (V-25).
* **Puntos.** Junto con N-31, +0.75 en Q1.3. Hay que cerrar los dos.

**N-44 (MINOR, nuevo).**

* **Descripción.** `merge-gate.mjs` sondea la PR cada 20 s hasta `WAIT_SECONDS` (1800) con `fetchPr`. Cada llamada a `gh` lanza una excepción ante cualquier estado distinto de 0 (`:71-75`), sin reintentos. En el run 41639881054 (SHA exacto), la llamada `gh api repos/jlbellonGmail/ai-native/pulls/175` devolvió HTTP 503 a las 13:12:09Z, tras 16 minutos de espera (V-32). Consecuencias:
  * el job sale con 1;
  * `human-review` y `merge-gate-finalize` quedan SKIPPED;
  * el check requerido `ai-native/merge-gate` no se emite, y la PR queda BLOCKED.

  El código no cambió desde `6f47eb2` (V-05). El defecto es heredado y se observó por primera vez en esta candidata.
* **Impacto.** Bajo, pero real. Un fallo transitorio de la API de GitHub convierte un gate correcto en una corrección manual: hay que relanzar el job. El comportamiento es fail-closed, que es lo correcto para Q8.3. Lo que falla es la fiabilidad (Q6.3).
* **Corrección mínima.** Hacer que `gh()` reintente, con un tope pequeño y backoff, ante 5xx y errores de red, y solo en las lecturas de `fetchPr`. Las escrituras siguen sin reintento. Añadir un test con un `gh` falso que devuelva un 503 y después 200.
* **Verificación.** El test nuevo pasa y la CI está verde. Para esta PR: relanzar el job `merge-gate` (lo hace el humano) y ver `human-review` en WAITING.
* **Puntos.** Junto con N-26, +0.75 en Q6.3. Hay que cerrar los dos.

**N-39 (MINOR, residual).**

* **Descripción.** La corrección de `:15` es exacta (V-36). Queda la divergencia `main`/`develop`, declarada como sincronización tras la release (`V4.0.1-PATCH.md:92`):
  * `develop` no tiene #174 (`ced0969`);
  * su `SESSION-CONTEXT.md` y su `execution/current/README.md` describen v3.4.3 como estado vigente, sin v4 ni el tag consumido.

  Un agente que parta de `develop` y siga la fuente de verdad, como exige `CLAUDE.md`, leerá un estado falso. Sincronizar `main` → `develop` ahora no cambia el SHA auditado; se hizo así con #170 y #173.
* **Corrección mínima.** Hacer ya una PR `main` → `develop` con `ced0969`, y otra después de la release.
* **Verificación.** `gh api compare/develop...main` con `ahead_by` limitado a `.audit/**`, o a 0.
* **Puntos.** +0.50 en Q8.1.

**N-40.** La descripción, la corrección y la verificación no cambian respecto de `AUDIT-PLATFORM-c99ed8f.md` §H y `AUDIT-PLATFORM-b43b5d6.md` §H. Para 388e310 no se puede observar `current_user_can_approve`, porque N-44 impidió que `human-review` llegara a pedir el deployment. La configuración que lo permitía no cambió (V-35).

**Resto de hallazgos (heredados).** Sus descripciones están en `AUDIT-PLATFORM-247b284.md` §I/§J, `AUDIT-PLATFORM-d6c5d4a.md` §H y `AUDIT-PLATFORM-6f47eb2.md` §H. Siguen vigentes. Los re-verifiqué así:

* **En vivo (V-31, V-33):** F-005, N-25, N-32 (10 alertas, igual que en `b43b5d6`), F-008, CodeQL #27, F-007 y N-26.
* **En el árbol:** F-002.
* **Reproducido:** N-29 (V-18).
* **Por diff vacío** `6f47eb2..388e310` sobre su área (V-05): N-31, N-11, N-24, F-003, F-004, F-006, F-009, F-010 y N-27.

### H.1 Sugerencias (no restan puntos)

* **S-1..S-31:** heredadas. Sigue crítica S-2: el merge de #175 debe ser un *merge commit* (V-33).
* **S-32 (nueva).** `VERSIONING-POLICY.md` no tiene mecanismo de excepción y no remite a D5. Quien lea solo la política, que es la norma de versión, ve una regla MAJOR que v4.x no cumple. Bastaría una línea en «Versión de plataforma» o en «Qué cuenta como MAJOR» que remita a D5 y a `V4.0.1-PATCH.md` §SemVer. No resta: la excepción está registrada donde la política pide evidencia (roadmap).
* **S-33 (nueva).** `release.test.mjs:116` (`!isShipped("evaluation/fixtures/audit/LIBRARY/x")`) no puede fallar por N-42: `evaluation/` nunca estuvo en `INCLUDE_PREFIXES`. Además, el directorio real es `library`, en minúsculas. Es cosmético; las aserciones que protegen están en `:115` y `:118-119` (V-27).
* **S-34 (nueva).** `V4.0.1-PATCH.md:62` y la D5 llaman «inmutable» al tag `v4.0.0`. Lo es por norma (ADR-004), no por control técnico (F-008). Convendría decir «inmutable por ADR-004».
* **S-35 (nueva).** `execution/current/README.md`, línea `CONTENT:`, lista N-41 pero no N-42 (N-42 aparece en `AUDIT:`).

## I. CAUSAS RAÍZ

| ID | Causa raíz | Hallazgos relacionados | Impacto |
|---|---|---|---|
| ROOT-001 | El ruleset de `main` no exige aprobaciones (0) | F-005 | Q6.2 y Q8.3, con descuento proporcional (CAUSA RAÍZ COMPARTIDA) |
| ROOT-002 | Host Windows sin recursos fiables para la suite; EPERM de git en repos temporales (reproducido, V-18) | N-29, N-27 | Q5.3 (un solo descuento) |
| ROOT-003 | Los agentes corren con la identidad Windows y GitHub del propietario | N-40 (y la ponderación de la independencia del auditor, §A) | Q8.2 (un solo descuento) |
| ROOT-004 | CERRADA: `plan-approval.json` en CRLF | N-36 (cerrado) | — |
| ROOT-005 | La exclusión del bundle se hace por nombre o por ruta, no por uso. **Mitigada**: N-41 y N-42 cerrados, y V-28 no encuentra otro residuo de la clase | N-41, N-42 (cerrados) | — (sin descuento vigente) |
| ROOT-006 | Las llamadas a la API de GitHub en los gates son de un solo intento | N-44 | Q6.3 (junto con N-26) |

## J. QUÉ SOBRA

* REVISAR: `governance/cleanup/*` (F-002, heredado).
* REVISAR: `r1-07d93c13d7a8` en `plan-approval.json` (S-30; decisión de confianza, no resta).
* SIMPLIFICAR: `release.test.mjs:116`, aserción vacía (S-33; no resta).

En el delta no encontré código muerto, scripts sin uso ni residuos nuevos (V-06, V-25, V-28).

## K. QUÉ FALTA

### OBLIGATORIO PARA 100/100

Los 21 MINOR abiertos de §H:

* las correcciones de N-39, N-40, N-43 y N-44 descritas arriba;
* las de los heredados, según `AUDIT-PLATFORM-247b284.md` §I/§J y `AUDIT-PLATFORM-6f47eb2.md` §O;
* para Q5.3, además, una corrida limpia y caracterizada que cierre N-29 y N-27.

### MEJORAS OPCIONALES

S-1..S-35. No restan puntos, no activan Quality Gates, no bloquean 100/100 y no forman parte del camino obligatorio a 100.

## L. NO VERIFICADO

| Elemento | Motivo | Impacto en puntuación | Cómo verificarlo |
|---|---|---|---|
| Autorización humana de r2 y orden humana de publicar v4.0.1 | Solo constan afirmaciones del Builder (`V4.0.1-PATCH.md:28,64`) | Ninguno. La excepción de versión es una decisión registrada, y la confirma el humano en el merge y el tag. El control técnico de r2 es `human-review` | El humano aprueba en persona `human-review` del `merge-gate` relanzado |
| `current_user_can_approve` en 388e310 | No hay deployment pendiente (N-44) | Dentro de N-40; la configuración no cambió | `pending_deployments` tras relanzar el `merge-gate` |
| Suite completa local | RAM del host; solo archivos sueltos | Dentro de Q5.3 (N-29); cubierta por la CI remota del SHA exacto (V-31) | CI remota |
| Dispatch real de plan approval tras el merge | Es una escritura (fuera del encargo) | Ninguno: N-36 está demostrado con el evaluador real (E4) | Tras el merge, un dispatch con la App: no debe dar `WORKFLOW_REVISION_UNKNOWN` |
| Ubicación de la clave privada de la App | No accesible por API | Dentro de N-40 | Revisión del propietario |
| F-007; causa del pilot (N-26); Codex y OpenCode | Heredados | F-007 en Q7.1; N-26 en Q6.3 | — |

## M. QUALITY GATES

```text
G1 BLOCKER: PASS (0 abiertos)
G2 CRITICAL: PASS (0 abiertos)
G3 VERIFICACIÓN ESENCIAL: PASS
```

Las capacidades esenciales que enumera §22 de QUALITY_SCORE pasaron durante la auditoría:

* bootstrap y build reproducibles (V-24);
* la suite principal en la CI (`ci.yml`), en Linux y en Windows, sobre el SHA exacto (V-31);
* los 10 validadores (V-08..V-16);
* `pretag`, en tests y en ejecución real.

**`merge-gate` (V-32) no activa G3.** No es la CI principal ni una de las verificaciones esenciales de la lista. Falló por un HTTP 503 de la API de GitHub, ajeno al repositorio, y falló cerrado, que es lo correcto. Lo que el repositorio sí controla, que no haya reintento, está puntuado en N-44 (Q6.3). Si el relanzamiento siguiera fallando por una causa propia, habría que reconsiderar G3.

**Release-gate contra este informe (V-38).** Ejecutado: **PASS_WITH_WARNINGS**, exit 0, con un aviso, «score 89.25 is below 90 but within the 2-point tolerance». El informe es CURRENT para 388e310. No forma parte de la nota.

## N. CAMINO MATEMÁTICO A 100

```text
Score actual: 89.25

N-31, N-43 (Q1.3)                    → +0.75
F-002 (Q2.2)                         → +0.75
N-11 (Q4.2)                          → +0.75
N-24, F-003 (Q5.2)                   → +0.75
N-29, N-27 (Q5.3)                    → +1.00
F-004 (Q5.5)                         → +0.75
F-005, N-25 (Q6.2)                   → +0.75
N-26, N-44 (Q6.3)                    → +0.75
F-006 (Q6.6)                         → +0.50
F-007 (Q7.1)                         → +0.75
N-32 (Q7.2)                          → +0.50
F-008, CodeQL #27 (Q7.3)             → +0.50
F-009, F-010 (Q7.5)                  → +0.75
N-39 (Q8.1)                          → +0.50
N-40 (Q8.2)                          → +0.50
F-005 (Q8.3, causa raíz compartida)  → +0.50

Suma: 0.75×9 + 1.00 + 0.50×6 = 6.75 + 1.00 + 3.00 = 10.75
89.25 + 10.75 = 100.00
```

No hay ningún gate activo que eliminar.

## O. PLAN DE REMEDIACIÓN

No hay acciones BLOCKER, CRITICAL ni MAJOR. Para llegar a 90 hacen falta +0.75. Las opciones de menor coste:

1. **Q8.1 (+0.50): N-39 residual.**
   * Cambio: PR `main` → `develop` con `ced0969` ya (no cambia el SHA auditado); otra después de la release.
   * Verificación: V-36.
   * Por sí sola: 89.75.
2. **Q2.2 (+0.75): F-002.**
   * Cambio: resolver `governance/cleanup/` (archivar o retirar los 4 documentos de cierre).
   * Verificación: `ls`.
   * Por sí sola: 90.00. Toca el árbol, así que obliga a reauditar.
3. **Q1.3 (+0.75): N-43 junto con N-31.**
   * Cambio: corregir `V4.0.1-PATCH.md:53,80,81,85` y añadir la ventana de soporte. N-31 es heredado y exige su propia corrección.
   * Verificación: V-25 y lectura.
4. **Q6.3 (+0.75): N-44 junto con N-26.**
   * Cambio: reintento acotado en las lecturas de `merge-gate.mjs` y un test. N-26 necesita la causa del Docker exit 125.
   * Verificación: test y CI.
5. **Q8.2 (+0.50): N-40.**
   * Cambio: separación de identidades, o decisión humana registrada.
   * Verificación: `check-agent-isolation` PASS; `current_user_can_approve` false para el agente.
6. **El resto**, como en `AUDIT-PLATFORM-6f47eb2.md` §O.

**Acción operativa inmediata, sin puntos.** Relanzar el job `merge-gate` del run 41639881054 o de un run nuevo, para que se emita `ai-native/merge-gate` y se pida `human-review`. El humano debe aprobarlo en persona (R-1). Relanzarlo no cambia el SHA ni deja este informe STALE.

Cualquier corrección fuera de `.audit/**` cambia el SHA y deja este informe STALE: habría que reauditar el nuevo head congelado. La opción 1 es la única que sube la nota sin tocar el árbol de la candidata, pero sola no alcanza 90. Publicar con 89.25, dentro de la tolerancia, es decisión del humano (precedente: v3.4.1 con 89.50). No se refleja aquí.

## P. SEGUNDA PASADA DE 100

N/A: el score provisional no fue 100/100.

## Q. CERTIFICACIÓN FINAL

> ¿Puede este repositorio considerarse actualmente una PLATAFORMA PROFESIONAL DE REFERENCIA (equivalente PLATFORM del «TEMPLATE PROFESIONAL DE REFERENCIA»)?

```text
NO
```

El 100/100 está prohibido: hay 21 MINOR puntuables y la confianza es MEDIA.

Para el uso que pide el perfil, un **gate de release con umbral 90 y tolerancia 2**, la candidata v4.0.1 queda **dentro de la tolerancia (89.25 ≥ 88), pero no alcanza 90**. No hay BLOCKER, CRITICAL ni MAJOR.

Las correcciones posteriores a `b43b5d6` cierran N-42 y N-38, y las verifiqué con evidencia ejecutable:

* N-42: build ×2, `diff -rq` y una mutación;
* N-38: un delta re-medido contra la release v3.4.3 descargada y verificada;
* N-39: la línea `MAIN_DEVELOP` es cierta.

Lo que separa la candidata de 90 es heredado (F-002, N-31, N-26) o está pendiente de decisión u operación humana (N-39 sincronización, N-40). A eso se suman dos MINOR nuevos que no cambian la nota: N-43, imprecisiones del registro de N-38, y N-44, `merge-gate` sin reintento.

Antes del merge, la PR necesita que se relance el `merge-gate` (V-32).

### Comprobación de consistencia (§33 AUDIT_PROMPT / §90 AUDIT_RULES)

```text
[x] Toda pérdida de puntos tiene causa identificada
[x] Todo hallazgo puntuable está materialmente relacionado con su criterio
[x] Ninguna SUGGESTION resta puntos
[x] Ninguna SUGGESTION activa gates
[x] Ninguna SUGGESTION bloquea 100/100
[x] Todos los puntos perdidos aparecen en el camino obligatorio a 100
[x] 89.25 + 10.75 = 100.00 (puntos aplicables = 100, sin N/A)
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
| Q8 | 1.5 + 1.5 + 1.5 + 2 | 6.50 |
| **Total** | | **89.25** |

Los máximos por área son 12, 12, 12, 12, 16, 16, 12 y 8, que suman 100.

**Divergencia con `b43b5d6` (88.50, otro auditor): +0.75.** Cambia un solo subcriterio:

| Subcriterio | Antes → ahora | Δ | Causa |
|---|---|---:|---|
| Q6.4 | 2.25 → 3.00 | +0.75 | N-38 cerrado (V-25, V-26, V-37) |

* Q2.2 sigue en 2.25: N-42 cerrado, F-002 sigue.
* Q1.3 sigue en 2.25: N-31, más N-43 nuevo.
* Q6.3 sigue en 2.25: N-26, más N-44 nuevo.
* Q8.1 sigue en 1.50: N-39 residual, con el mismo criterio de cierre que `b43b5d6`.
* Los otros 26 subcriterios no cambian.

**Divergencia con `6f47eb2` (90.25): −1.00**, debida a N-39 (Q8.1) y N-40 (Q8.2), los dos del contenido v4.

### Riesgos residuales

* **R-1 (MEDIO).** Mientras ROOT-003 siga abierto, cualquier aprobación de Environment la puede aprobar un agente con la credencial del propietario. Afecta a plan approval y a `merge-gate`. El `human-review` que pedirá el `merge-gate` relanzado debe aprobarlo el humano en persona.
* **R-2.** TOCTOU extremo a extremo NO RESUELTO, y el Coordinator consumer no existe (declarado). No hay que usar receipts para habilitar trabajo.
* **R-3.** `pretag` es procedimental: no hay ruleset de tags (F-008), y la inmutabilidad de `v4.0.0` en la que se apoya la excepción N-38 es normativa. `release.yml` sigue siendo la única barrera técnica.
* **R-4.** El ruleset admite squash y rebase. Un merge de #175 que no sea merge commit deja STALE el SHA auditado (S-2).
* **R-5.** Hasta el merge, `main` solo tiene r1: cualquier dispatch en `main` da `WORKFLOW_REVISION_UNKNOWN` (V-29, config `origin/main`). Es fail-closed y esperable.
* **R-6.** La validación local completa no es sostenible en este host (N-29 reproducido); la confirmación es la CI remota.
* **R-7.** Hasta que se relance, PR #175 no tiene el check requerido `ai-native/merge-gate` (V-32).

```text
AUDITED_SHA: 388e310cf3aa4691f8b9541b8c016b9d36a61ed9
SCORE: 89.25/100 (bruto = final; sin N/A; sin gates)   PREVIOUS: 88.50 (b43b5d6), 87.75 (c99ed8f), 90.25 (6f47eb2)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 21 (17 heredados re-verificados; abiertos: N-39 residual, N-40; nuevos: N-43, N-44; cerrados aquí: N-38, N-42)
N-36: CERRADO (evaluador real: HEAD/ced0969/b43b5d6 → r2, []; config origin/main → WORKFLOW_REVISION_UNKNOWN; 0 trustedFiles cambiados en ced0969..HEAD)
N-38: CERRADO (excepción humana registrada D5; delta re-medido contra v3.4.3: +5 / −1 / ~5, platform.json schemaVersion/components/capabilities/bootstrap idénticos; imprecisiones → N-43)
N-42: CERRADO (234 archivos, sin runtime/audit/fixtures.mjs; test mata al mutante)
PR #175: CI verde (ubuntu 1271+1 skip, windows 1270+2 skips, 0 FAIL, 1272 tests); merge-gate FAILURE por HTTP 503 (N-44) → BLOCKED, relanzar
BUILD: reproducible (sha256:949d4259…6f77d45 ×2; 234 archivos)
UMBRAL PLATFORM 90 (tolerancia 2): DENTRO DE TOLERANCIA (89.25 ≥ 88), NO ALCANZA 90
VERDICT: APTO CON CORRECCIONES (estado global §32)
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```
