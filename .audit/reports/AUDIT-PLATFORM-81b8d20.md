---
targetRepo: jlbellonGmail/ai-native
targetCommit: 81b8d2061ba852e06914564611620d2cf1c750a2
platform:
  version: "v3.4.0 candidate"
  commit: 81b8d2061ba852e06914564611620d2cf1c750a2
auditMethod: "1.2"
profile: PLATFORM
tool:
  name: Claude Code
  model: claude-opus-5-5
date: "2026-10-26T16:55:02Z"
scope: "Independent read-only PLATFORM 1.2 audit of the exact frozen v3.4.0 MINOR candidate (v3.3.1..81b8d20; develop a00e168..81b8d20) and of the live GitHub control plane. Auditor did not take part in the implementation. No fix, push, PR, merge, tag or release."
score: 89.75
isMergeGate: false
---

# AI-NATIVE — Auditoría PLATFORM 1.2 independiente (candidata v3.4.0)

## A. Identificación y veredicto

```text
Repositorio:   jlbellonGmail/ai-native (C:\Proyectos\ai-native)
Rama:          release/v3.4.0 (local; sin push: release/v3.4.0 y v3.4.0 no existen en origin)
Commit:        81b8d2061ba852e06914564611620d2cf1c750a2 (= AUDITED_SHA congelado)
Base:          develop a00e1683318e6696a320182de507e5d2274a7345 (= origin/develop, merge de #148)
Tag:           ninguno (v3.4.0 no existe)
Fecha:         2026-10-26
Estándar:      QUALITY_SCORE 1.1 + AUDIT_RULES 1.1 + perfil PLATFORM 1.2 (auditMethod 1.2)
Auditor:       Claude Code (claude-opus-5-5), independiente del Builder y de los reviewers de #146
Entorno:       Windows 11, Git Bash, node v26.12.1, pwsh, gh autenticado (solo lectura)
Worktree:      limpio al empezar y al terminar la verificación (git status --short vacío)
```

**Veredicto: APTO CON CORRECCIONES. Por debajo del umbral PLATFORM de 90.** 0 BLOCKER, 0 CRITICAL, 0 MAJOR. Score bruto 89.75/100, sin N/A y sin Quality Gate. Confianza MEDIA (§E). El `release-gate` oficial lo admite dentro de la tolerancia de 2 puntos (`PASS_WITH_WARNINGS`), pero el aviso de tolerancia no es histórico ni STALE.

**Independencia.** Leí la lista de hallazgos de `AUDIT-PLATFORM-65fc562.md` después de fijar mi evaluación inicial (§68). Solo cuento un hallazgo heredado si lo re-verifiqué en vivo o si `git diff 65fc562 81b8d20` sobre su área sale vacío. La deuda que declara `V3.4.0-RELEASE.md` se evaluó contra el código. No se aceptó como dada.

## B. Git, ancestry y diff real

| Comprobación | Resultado |
|---|---|
| `HEAD` = AUDITED_SHA, rama `release/v3.4.0`, worktree limpio | PASS |
| Ancestros de HEAD: `v3.3.1` (`4974fa6`), `origin/develop` (`a00e168`), `origin/main` (`fefd4b3`) | PASS ×3 |
| `v3.3.1..HEAD`, primer padre | #141 (docs post-v3.3.1), #148 (sync main→develop con #146), `ee86196` CLI_VERSION, `81b8d20` registro de candidata |
| `git diff --stat v3.3.1 HEAD` | 50 archivos, +3911/−131 |
| `a00e168..HEAD` | 4 archivos: `runtime/cli/ai-native.mjs` (literal), `governance/{SESSION-CONTEXT.md, execution/current/README.md, versioning/V3.4.0-RELEASE.md}` |
| `git diff --check v3.3.1 HEAD` | sin salida, exit 0 |
| `package.json`, lockfiles, `VERSION` desde v3.3.1 | sin cambios (`VERSION` = `3.0.0-dev`) |
| Escaneo del diff: secretos (`ghp_`, `github_pat_`, `sk-ant-`, `AKIA…`, claves privadas) y rutas de workstation | 0 coincidencias |

## C. Independent SDD review: revisión adversarial

Código: `runtime/circuit/{independent-review,review-ledger}.mjs`, `runtime/adapters/{claude-review,review-evidence,commands,sync}.mjs`, `runtime/circuit/{implement-all,coordinator,sdd-cli}.mjs`, `runtime/policy/hitl.mjs`, `core/agents.json`, `contracts/sdd-workflow*.json`.

| Requisito | Evidencia | Estado |
|---|---|---|
| Separación Coordinator → Builder → validación → Reviewer → fix/revalidación/re-review → HITL | `implement-all.mjs`: sin capacidad aislada, el reviewer es `selfReview` y el resultado `REVIEW_PENDING`. Una aprobación stale re-entra al bucle. Un adverso de la misma revisión da `adverse_review_stands`. `coordinator.mjs` re-chequea la evidencia de la validación final | VERIFICADO (E3+E4: circuit 253/253) |
| Fail-closed sin independencia demostrable | `resolveReviewCapability`: la ausencia de un hecho cuenta como `unknown`, y `unknown` como no disponible. `checkReviewEvidence` exige runtime `verified`, ejecución en allowlist, agente `reviewer`, aislamiento, nonce y revisión. `checkOutcomeCoherence` rechaza APPROVED sin PASS independiente | VERIFICADO |
| Transcript Claude: prompt canónico, nonce, revisión, veredicto del transcript, agent_id estructural, follow-up | `verifyClaudeReceipt`: la delegación coincide exactamente con el prompt emitido. El nonce sale del primer mensaje del subagente. Veredicto, nonce y revisión se leen de la respuesta registrada, nunca de `last_assistant_message`. El agent_id sale de la última línea `agentId:` del `tool_result` propio de la delegación. Un follow-up o una segunda respuesta impiden aprobar, y la respuesta adversa domina (`runVerdict`) | VERIFICADO (tests H1, A, C, M9) |
| Receipts: uno inválido no desplaza a uno válido; múltiples se re-validan; el adverso domina | claves por contenido con `wx`; `attestRuns` verifica cada recibo; `chooseRun` ordena por severidad; `status` re-atesta cada línea y cada recibo | VERIFICADO (test B) |
| Ledger: spoofing, stale, misma revisión, Windows, POSIX, ENOENT/ENOTDIR/ELOOP, FIFO, no-ficheros | `status` no lee los campos de evidencia de una línea a mano (`UNATTESTED`). Revisión = merge-base + contenido. `GONE` = ENOENT, ENOTDIR y ELOOP. `O_NONBLOCK` y `fstat().isFile()`. Ruta 8.3 cubierta con `realpathSync.native` | VERIFICADO (tests M12, revision:*). FIFO y permisos POSIX: `skip` en Windows, NO VERIFICADO aquí (sí en CI Linux de #146) |
| HITL: ningún review autoriza merge | sin ruta de merge ni push en el código nuevo (grep). `humanGate` = `required` salvo APPROVED, y entonces es el gate que deriva la política (nunca inferior). `hitl.mjs --base v3.3.1`: `risk high, human_gate required` | VERIFICADO |
| Adapters Codex/OpenCode fail-closed | `REVIEW_ATTESTERS` = solo `claude`. Sonda: `receipt codex` da «no review attester». Las notas proyectadas dicen «Independent review is UNAVAILABLE». `core/agents.json`: `unverified` | VERIFICADO (E4) |
| Flags de confianza rechazados | sonda: `--execution separate-process` da exit 1 «not accepted» | VERIFICADO (E4) |
| Restricción de modelo/aislamiento de la delegación (M-1) | sonda: delegación `Agent` con `model: "haiku"` y el resto canónico da `INDEPENDENT_REVIEW: PASS` / `APPROVED`. `isolation` tampoco se inspecciona | DEFECTO (N-30) |
| Adverso de una revisión retira cualquier aprobación de esa revisión | sonda: misma revisión, review CHANGES_REQUESTED en `specs/001-locales` y APPROVED en otra spec existente `specs/002-older` da `002-older` **APPROVED** (`001-locales` sigue CHANGES_REQUESTED). `attestedRunsOf` solo mira los recibos del slug consultado | DEFECTO (N-31) |
| Claude E2E real (Claude Code ejecutando el Reviewer) | registrado por el Builder en `specs/sdd-independent-review/verification.md` (2.1.305/2.1.306); no re-ejecutado por este auditor | NO VERIFICADO aquí |

Sondas: scripts del auditor fuera del repositorio, repos temporales, sin escribir en el árbol auditado.

## D. Verificación ejecutable

### D.1 Réplica local de `ci.yml` (job `validators`)

Ejecuté los 51 pasos de `ci.yml`, en el mismo orden y con los mismos comandos. Diferencias con CI: `hitl.mjs --base v3.3.1` en lugar de `origin/${base_ref}`, y `pwsh -File` para la conformidad PowerShell.

```text
51/51 pasos exit 0. node:test: 1082 tests, 1080 pass, 0 fail, 2 skipped
(FIFO y permisos POSIX, inaplicables en Windows). circuit 253/253 (+2 skip),
adapters 84/84, policy 69/69, core 5/5, contracts, parity, doc-drift, integrity,
entrypoints, pilot y migrate-v2 con red, audit check PASS, evals L1 PASS.
pr-gate --base origin/develop / origin/main / v3.3.1: PASS (exit 0).
validate-actions-pinned: PASS.
```

### D.2 Suite del gate de `release.yml`

`AI_NATIVE_REQUIRE_NETWORK=1 GH_TOKEN=… node --test runtime/*/*.test.mjs contracts/*.test.mjs core/*.test.mjs parity/*.test.mjs evaluation/*/*.test.mjs scripts/*.test.mjs` → 1072 tests, 1067 pass, **3 fail**, exit 1. Los 3 fallos (`consumer-launcher` F-17, `audit` «certification rejects…», `review-ledger` M9) son el mismo error de entorno: `git add`/`git commit` → `unable to write file .git/objects/…: Permission denied` en el repo temporal del test. Ninguno es una aserción de producto. Los tres archivos aislados: 0 / 2 / 5 fallos en 3 corridas, siempre por `Permission denied`. `review-ledger.test.mjs` aislado ×3: 40/40, 39/40, 39/40, con el único fallo de cada corrida por `Permission denied`. Aislados en serie: `consumer-launcher` y `audit` 0 fallos.

**G3 no se aplica.** La suite principal requerida (`ci.yml`) pasa completa (D.1). La CI remota de un árbol de contenido equivalente pasa en Ubuntu y Windows (D.4). Los fallos son del host, no del candidato. Puntuado en Q5.3 (N-29, empeorado: ahora también alcanza al test nuevo y ocurre aislado).

### D.3 Build y reproducibilidad

| Comprobación | Resultado |
|---|---|
| `build.mjs --version v3.4.0 --commit 81b8d20…` ×2 | exit 0 ambas; `diff -r` idéntico; digest `sha256:b868a6904be358fa641ee1a319bf1c6fe8175f41e2b6189bf9b7df3eec5b9b5f` (= BUILD_SHA256 declarado); 230 archivos |
| Negativo: `--version v3.3.1` sobre el candidato | exit 1 «declares CLI_VERSION v3.4.0; this release is v3.3.1» (fail-closed) |
| Rebuild de `v3.3.1` sobre `4974fa6` frente a la release publicada | `SHA256SUMS` idéntico en bundle (`1fc1f9b7…`), `platform.json`, CLI y revocaciones |
| `platform.json` candidato frente a v3.3.1 | `bootstrap` (`protocol 1`, `minCliVersion v3.2.0`, `adopt`), `kernel-contract` y `capabilities` idénticos; revocaciones byte-idénticas (v3.3.1 no queda revocada) |

### D.4 Configuración remota (gh, solo lectura)

| Elemento | Estado verificado |
|---|---|
| CI del SHA exacto | **NO VERIFICADO**: `81b8d20` no está en origin |
| CI de contenido equivalente | PR #148, cabeza `f4d56dc` (árbol = `a00e168`; `a00e168..81b8d20` = 3 docs de gobernanza + literal `CLI_VERSION`): validators ubuntu y windows, pr-gate, pin-check, CodeQL ×2, dependency-review, trivy-fs, sbom, security-scan: SUCCESS |
| Ruleset `ai-native-main` | activo; `required_approving_review_count 0`; merge, squash y rebase permitidos |
| `develop` | `rules/branches/develop` vacío (sin ruleset) |
| Rulesets de tag | 0 |
| Release v3.3.1 | publicada, `immutable: true` |
| Alertas | CodeQL abiertas: 1 (#27 `actions/untrusted-checkout/medium`, `l3-consumer.yml:116`, sin cambios). **Dependabot abiertas: 6** (#145–#150, `template/pnpm-lock.yaml`, scope development: vite ×5 con 1 high, `@vitest/mocker` ×1; creadas entre el 2026-10-21 y el 2026-10-25). Secret scanning: 0 |
| Pilot | últimas corridas: `fefd4b3` y `4974fa6` success (push a main); `8d5e313` failure (2026-10-18, PR) |

### D.5 release-gate y audit check

Antes de este informe: `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate 81b8d20… --root .` → **FAIL**, exit 1: «no current valid PLATFORM audit report», más los 24 informes históricos STALE. Es el resultado esperado. `audit check` → PASS.

## E. SemVer, delta de consumidor y confianza

**SemVer: MINOR (v3.4.0), aceptado.** `VERSIONING-POLICY.md` §MINOR: añade el campo opcional `writes` a `contracts/sdd-workflow.schema.json` (enum `review-state`) y una capacidad nueva. No es MAJOR: el lock no se rompe y `kernel-contract`, `bootstrap`, `protocol` y `minCliVersion` no cambian (verificado en el `platform.json` construido). Ningún schema se elimina ni cambia de forma incompatible. El cambio de rol de `/sdd-validate` (de `reviewer`/`readOnly` a `coordinator`/`writes: review-state`) conserva nombre, uso y fase, y no muta código. Se proyecta con la misma restricción que un comando de solo lectura (Claude `allowed-tools: Read, Grep, Glob`; OpenCode `plan`). Lectura defendible.

**Delta del bundle v3.3.1 → candidato:** 4 archivos nuevos (`runtime/adapters/{claude-review,review-evidence}.mjs`, `runtime/circuit/{independent-review,review-ledger}.mjs`) y 25 modificados.

**Delta de proyección al consumidor (`consumerFiles`):** pasa de 47 a 48 archivos. Uno nuevo, `.claude/settings.json` (hook `SubagentStop`), y 14 modificados (`.claude`/`.opencode` commands `sdd-{implement-all,validate,status}`, agents/roles `builder` y `reviewer`, skill `sdd`, `.codex/README.md`, `opencode.json`). Un consumidor con su propio `.claude/settings.json` lo conserva (colisión del upgrade). El hook entonces no se instala y el review queda `NOT_RUN`/`REVIEW_PENDING`: fail-closed y documentado. Los consumidores fijados a v3.3.1 no cambian sin un `upgrade` explícito.

**Confianza: MEDIA.** No se verificó: la CI remota del SHA exacto (no está en origin), un E2E propio con Claude Code real, FIFO y permisos POSIX (Windows), el `pilot` offline en Docker, ni una corrida limpia de la suite de release en este host.

## F. Puntuación

| Criterio | Puntos | Nivel | Causa |
|---|---:|---|---|
| Q1.1 | 3/3 | COMPLETO | `V3.4.0-RELEASE.md`, spec, `review.md` |
| Q1.2 | 3/3 | COMPLETO | capacidades declaradas presentes (§C) |
| Q1.3 | 2.25/3 | MENOR | N-31 (contradice `review.md` y `security.md`). N-28 de v3.3.1, cerrado: la gobernanza corrigió la afirmación |
| Q1.4 | 3/3 | COMPLETO | — |
| Q2.1 | 3/3 | COMPLETO | build reproducible |
| Q2.2 | 2.25/3 | MENOR | F-002 (rutas de workstation en `governance/`, re-verificado; el diff del candidato no añade ninguna) |
| Q2.3, Q2.4 | 6/6 | COMPLETO | — |
| Q3.1–Q3.4 | 12/12 | COMPLETO | core runtime-neutral validado por `validate-core` §5b; mecánica Claude solo en el adapter |
| Q4.1 | 3/3 | COMPLETO | S-1 |
| Q4.2 | 2.25/3 | MENOR | N-11 (heredado; README sin cambios) |
| Q4.3–Q4.5 | 6/6 | COMPLETO | `sdd-cli` usage, `review.md`, command bodies |
| Q5.1 | 3/3 | COMPLETO | — |
| Q5.2 | 2.25/3 | MENOR | N-24, F-003 (heredados) |
| Q5.3 | 3/4 | MENOR | N-29 (empeorado), N-27; CI remota del SHA exacto NO VERIFICADA |
| Q5.4 | 3/3 | COMPLETO | un test por amenaza (H1, A, B, C, M9, M12, L6, revision:*); mutación registrada 25/25 y 21/21 KILLED |
| Q5.5 | 2.25/3 | MENOR | F-004 (heredado) |
| Q6.1 | 3/3 | COMPLETO | develop → release → main; commits atómicos |
| Q6.2 | 2.25/3 | MENOR | F-005, N-25 (en vivo) |
| Q6.3 | 2.25/3 | MENOR | N-26 |
| Q6.4 | 3/3 | COMPLETO | MINOR justificado; `CLI_VERSION` = tag |
| Q6.5 | 2/2 | COMPLETO | D.3 |
| Q6.6 | 1.5/2 | MENOR | F-006 (heredado, `runtime/bootstrap` sin cambios) |
| Q7.1 | 2.25/3 | MENOR | F-007 (NO VERIFICABLE por API) |
| Q7.2 | 1.5/2 | MENOR | N-32 |
| Q7.3 | 1.5/2 | MENOR | F-008, CodeQL #27 |
| Q7.4 | 2/2 | COMPLETO | sin permiso nuevo; Codex y OpenCode sin attester |
| Q7.5 | 2.25/3 | MENOR | F-009, F-010 (heredados) |
| Q8.1 | 2/2 | COMPLETO | gobernanza coherente con el árbol |
| Q8.2 | 1.5/2 | MENOR | N-30 |
| Q8.3 | 1.5/2 | MENOR | F-005 |
| Q8.4 | 2/2 | COMPLETO | spec, verification, inspector e integración trazados |

**Validación matemática:** Q1 3+3+2.25+3 = 11.25 · Q2 3+2.25+3+3 = 11.25 · Q3 12.00 · Q4 3+2.25+2+2+2 = 11.25 · Q5 3+2.25+3+3+2.25 = 13.50 · Q6 3+2.25+2.25+3+2+1.5 = 14.00 · Q7 2.25+1.5+1.5+2+2.25 = 9.50 · Q8 2+1.5+1.5+2 = 7.00 → **89.75**. Puntos aplicables: 100 (sin N/A). Gates: ninguno. Score final 89.75: 0.25 por debajo del umbral PLATFORM de 90, dentro de la tolerancia de 2 del `release-gate`.

**Divergencia con `65fc562` (90.75), −1.00:** +0.75 en Q1.3 (N-28 cerrado) y −0.75 en Q1.3 (N-31), −0.50 en Q7.2 (N-32), −0.50 en Q8.2 (N-30). El resto coincide.

## G. Hallazgos

| ID | Criterio | Sev. | Tipo | Estado | Descripción · corrección · verificación |
|---|---|---|---|---|---|
| **N-31** | Q1.3 (Q8.3) | MINOR | CONTRADICTORIO | NUEVO | La revisión identifica el cambio, no la spec, pero recibos y ledger se buscan por slug. Un adverso atestado en `specs/A` no retira la aprobación de la misma revisión obtenida con `sdd review begin/record` sobre otra spec existente `specs/B`, cuyas tareas estén todas hechas. Sonda reproducible: A CHANGES_REQUESTED y B APPROVED sobre la misma `REVISION`. Contradice «An adverse review … of the current revision withdraws any approval of it» y «a new run of the same revision cannot wash out an adverse one». No es MAJOR: no hay ruta de merge, `HUMAN_GATE` nunca baja de la política, deja una línea visible en `specs/B/reviews.jsonl` del diff de la PR y exige elusión deliberada con comandos propios. Corrección: en `status` y `record`, considerar las corridas atestadas de la revisión en todos los slugs del state root. Verificación: la sonda da B ≠ APPROVED. |
| **N-30** | Q8.2 | MINOR | INCOMPLETO | NUEVO (M-1 confirmado) | `verifyClaudeReceipt` no inspecciona `model` ni `isolation` del `tool_use` de delegación. Sonda: `model: "haiku"` da `APPROVED`. Con `isolation: "worktree"` (INFERIDO) el Reviewer leería HEAD y no los archivos sin commit que el packet le pide leer. La independencia (contexto nuevo, solo lectura, prompt emitido) no se rompe; el límite del rol proyectado sí. Corrección: rechazar campos de la delegación fuera de `{description, subagent_type, prompt}` (o un allowlist). Verificación: test con `model` y con `isolation` → no aprueba. |
| **N-32** | Q7.2 | MINOR | RIESGO | NUEVO | 6 alertas Dependabot abiertas en `template/pnpm-lock.yaml` (scope development; 1 high en vite; parches 8.1.6 y 4.1.12 disponibles; PRs Dependabot #142–#147 abiertas y excluidas a propósito). No están en el bundle de la plataforma (verificado: `template/` no se empaqueta). Corrección: mergear o descartar con justificación en una PR separada. Verificación: `gh api …/dependabot/alerts?state=open` → 0. |
| N-29 | Q5.3 | MINOR | RIESGO | ABIERTO, EMPEORADO | `Permission denied` al escribir `.git/objects` en repos temporales de test (Windows). Ahora afecta a 3 archivos, incluido el nuevo `review-ledger.test.mjs`, y también ocurre aislado (D.2). Corrección: reintento o aislamiento de las escrituras git del harness. Verificación: 3 corridas completas limpias en Windows. |
| N-24, N-25, N-26, N-27 | Q5.2, Q6.2, Q6.3, Q5.3 | MINOR | — | ABIERTO | Heredados de `65fc562`. N-25 y N-26 re-verificados en vivo. N-27 no falló en esta corrida. |
| F-002, F-005, F-007, F-008, F-010 | Q2.2, Q6.2/Q8.3, Q7.1, Q7.3, Q7.5 | MINOR | — | ABIERTO | Re-verificados en vivo o en el árbol (F-007 sigue NO VERIFICABLE) |
| F-003, F-004, F-006, F-009, N-11 | Q5.2, Q5.5, Q6.6, Q7.5, Q4.2 | MINOR | — | ABIERTO (INFERIDO) | `git diff 65fc562 81b8d20` vacío en `README.md`, `runtime/{bootstrap,release,gates,pilot}`, `scripts`, `.github`, `evaluation/m52` |
| N-28 | Q1.3 | — | — | **CERRADO** | `SESSION-CONTEXT.md` ya declara que el pilot no corrió en la PR develop → main y que pasó en el push a main |

**Total: 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 18 MINOR (3 nuevos: N-30, N-31, N-32; 1 cerrado: N-28).**

**Deuda conocida de `V3.4.0-RELEASE.md`, evaluada (no puntúa salvo M-1 = N-30):**

| Deuda | Evaluación | Clasificación |
|---|---|---|
| M-1 model/isolation | confirmada por sonda | MINOR N-30 |
| Mutantes LOW supervivientes | las rondas registradas posteriores dan 25/25 y 21/21 KILLED; no re-ejecutado | SUGGESTION |
| `docs-gate` no cuenta `specs/**` ni `knowledge/**` | da falsos FAIL (fricción), no falsos PASS; `pr-gate` del candidato PASS | SUGGESTION |
| Hook no disparado = run invisible | falla cerrado para aprobar (`NOT_RUN`/`REVIEW_PENDING`); solo se pierde un adverso | SUGGESTION |
| Comando de validación trivial | el packet lo marca como dato y pide al Reviewer juzgarlo; residual documentado | SUGGESTION |
| `--base` estrecho | `BASE:` impreso y guardado; la CI del forge y `hitl --base origin/<base>` juzgan el cambio real | SUGGESTION |
| Evidencia no criptográfica | fuera del modelo de amenaza declarado (escritura deliberada fuera de los comandos) | SUGGESTION |
| Unix socket `ENXIO` | `contentOf` relanza todo código fuera de `GONE`, así que begin/status fallan con error (INFERIDO del código, no reproducido en Windows): fail-closed, sin aprobación falsa | SUGGESTION |

Ninguna demostró una explotación o impacto mayor que el declarado, salvo M-1, confirmado y puntuado. N-31 es nuevo: no estaba en la lista.

**Sugerencias (no puntúan):** S-1: el README (`CLI: v3.3.0 | PLATFORM: v3.2.0`) sigue desfasado. S-2: la promoción develop → main debe hacerse con merge commit, o este informe queda STALE. S-3: la deuda de la tabla anterior marcada como SUGGESTION.

## H. Camino a 100

Q1.3 +0.75 (N-31). Q2.2 +0.75 (F-002). Q4.2 +0.75 (N-11). Q5.2 +0.75 (N-24, F-003). Q5.3 +1.00 (N-29, N-27 y CI remota del SHA exacto). Q5.5 +0.75 (F-004). Q6.2 +0.75 (F-005, N-25). Q6.3 +0.75 (N-26). Q6.6 +0.50 (F-006). Q7.1 +0.75 (F-007). Q7.2 +0.50 (N-32). Q7.3 +0.50 (F-008, CodeQL #27). Q7.5 +0.75 (F-009, F-010). Q8.2 +0.50 (N-30). Q8.3 +0.50 (F-005).

Suma: 0.75×10 + 1.00 + 0.50×5 = 10.25. 89.75 + 10.25 = 100.00. Camino completo.

## I. Conclusión

```text
AUDITED_SHA: 81b8d2061ba852e06914564611620d2cf1c750a2
SCORE: 89.75/100 (bruto = final; sin N/A; sin gates)
BLOCKER: 0  CRITICAL: 0  MAJOR: 0  MINOR: 18 (nuevos: N-30, N-31, N-32; cerrado: N-28)
SUGGESTION: 9 (S-1, S-2 y 7 deudas conocidas no puntuables)
SEMVER: MINOR (v3.4.0)
BUILD: reproducible (2 builds byte-idénticos, sha256:b868a690…; v3.3.1 re-construida = publicada)
CONSUMER_DELTA: proyección 47 → 48 (+.claude/settings.json, 14 modificados) tras upgrade explícito
RELEASE_GATE (antes de este informe): FAIL (sin informe vigente; 24 STALE), lo esperado
UMBRAL PLATFORM 90: NO ALCANZADO (tolerancia del release-gate: sí)
VERDICT: APTO CON CORRECCIONES
CONFIANZA: MEDIA
TAG/RELEASE: NOT_CREATED / NOT_PUBLISHED (fuera de alcance)
```

Evidencia: los comandos están registrados arriba. Las salidas completas y las sondas del auditor quedaron en el scratchpad de la sesión, no persistidas en `.audit/evidence/` por instrucción de producir solo el informe.
