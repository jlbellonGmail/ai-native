# Plan de desbloqueo del circuito de aprobación de planes (B2–B5)

Estado: **PROPUESTA. No aprobada. No implementada.** Preparada el 2026-11-23
sobre `main` `d08531e` / `develop` `15548c1` por autorización expresa del
propietario para *preparar* (no para implementar). Nada de este documento se ha
ejecutado: no se crearon usuarios, Apps, claves, rulesets, workflows ni código.

Complementa, sin sustituirlos, a `PLAN-APPROVAL-RECEIPT.md`,
`PLAN-APPROVAL-COORDINATOR-CONTRACT.md` y `AGENT-HUMAN-IDENTITY-SEPARATION.md`.
Las enmiendas de contrato que propone (U4, U5) sólo valen si el propietario las
aprueba por el procedimiento de la sección «Arranque».

## Problema verificado

| Bloqueo | Evidencia (2026-11-23) | Garantía afectada |
|---|---|---|
| B2 separación humano/agente | `node runtime/gates/plan-approval.mjs check-agent-isolation` ⇒ BLOCKED (`AGENT_HUMAN_GH_ACCOUNT`, `AGENT_GIT_CREDENTIAL`): el agente corre con `gh` autenticado como `jlbellonGmail` y credenciales GitHub en Credential Manager. `ai-native-human-review` tiene `prevent_self_review: false` | Independencia de toda aprobación humana (Environment, merge, comentario) |
| B3 dispatch | El workflow exige `actor` y `triggering_actor` = bot 350901564 (`plan-approval-receipt.mjs`, `ACTOR_NOT_BOT`); no hay en el repo nada que emita un token de instalación de la App; la clave debe vivir en un perfil de agente que no existe | Que la solicitud la haga sólo la App |
| B4 consumo | `runtime/circuit/coordinator.mjs:77` sólo devuelve `AWAITING_HUMAN_APPROVAL`; nadie llama a `verifyFromGitHub`; no existe la credencial de lectura que exige el contrato | Que sin receipt válido no se implemente |
| B5 continuidad | `verify` exige PR abierto, sin merge y head == SHA aprobado (`HEAD_CHANGED`, `PR_MERGED`, `RECEIPT_STALE`); el receipt «no autoriza cambios fuera de los nueve documentos»; `develop` no tiene ruleset ni protección (`GET branches/develop/protection` ⇒ 404; único ruleset `ai-native-main`, sólo rama por defecto) | Vínculo entre planes aprobados y commits de implementación |

Hechos reutilizables: ruleset `ai-native-main` (PR obligatorio, checks
requeridos `ai-native/trust-gate` y `ai-native/merge-gate` de la App
`ai-native-trust`, sin bypass); `merge-gate.yml` (código de BASE, App
`ai-native-trust` con `checks: write`, Environment `ai-native-human-review` para
cambios de control plane hacia `main`); Environment `ai-native-plan-approval`
(revisor único `jlbellonGmail`, `prevent_self_review: true`, sólo `main`, sin
bypass de administradores); verificador completo con pruebas sobre mocks.

## Principios

1. **Raíz de confianza no circular.** Ninguna tarea de este plan usa el
   receipt para autorizarse. La raíz es la separación de cuentas de Windows (U0,
   acción humana sin código) más controles de GitHub ya existentes
   (Environment con revisor humano, ruleset de `main`, App `ai-native-trust`).
2. **Detección no es aislamiento.** `check-agent-isolation` es una sonda; la
   frontera es la cuenta de Windows.
3. **Fail-closed.** Todo estado desconocido, ausente o malformado ⇒ BLOCKED.
4. **Sin secretos en el canal.** Ninguna clave ni token se pide por chat, se
   pasa por línea de comandos, se escribe en el repositorio, en variables de
   entorno persistentes ni en logs. Los comandos sólo nombran *rutas*.
5. **Sin rebaja.** Nada de este plan relaja `plan-approval.json`, los
   Environments, el ruleset de `main` ni los umbrales de auditoría.

## Identidades

| Identidad | Estado | Uso en este plan | Justificación |
|---|---|---|---|
| `jlbellonGmail` (persona) | existe | única aprobadora; empuja y mergea mientras el agente no tenga identidad de escritura | ya es el revisor fijado; no se añade otra persona |
| Usuario Windows `ai-agent` | **nuevo (U0)** | ejecuta todos los agentes | es la frontera que hace inaccesibles las credenciales humanas; sin coste |
| App `ai-native-plan-approval` | existe (bot 350901564) | sólo solicita (`workflow_dispatch`) | reutilizada; no puede aprobar Environments |
| App `ai-native-trust` | existe (integration 5170488) | publica checks de veredicto/atestación | reutilizada: ya es la identidad de checks requeridos y su clave sólo vive en el Environment `ai-native-trust` (restringido a `main`) |
| `GITHUB_TOKEN` de lectura | existe | credencial del verificador en CI | es un token de instalación de solo lectura que no es del propietario ni de la App solicitante, como exige el contrato |
| App de lectura `ai-native-plan-reader` | **condicional** | sólo si la sonda de U3 demuestra que `GITHUB_TOKEN` no puede leer protecciones del Environment o el historial de aprobaciones | el contrato prohíbe usar al propietario o a la App solicitante; clave sólo en un Environment restringido a `main` |
| Identidad de escritura para el agente | **no se crea** | — | mínimo: mientras no se apruebe otra cosa, el agente no tiene escritura en GitHub y el humano empuja desde su perfil tras revisar |

## Tareas y dependencias

```text
U0 (humano, B2) ──► U1 (humano, ruleset develop) ──► U2 (B3) ─┐
                                   │                          ├─► U6 (entrega a main + E2E) ──► U7 (aprobación de planes 001–003)
                                   └──► U3 (B4a) ──► U4 (B4b) ─┤
                                              └────► U5 (B5) ──┘
```

Cada tarea de código (U2–U5) es control plane (`.github/**`,
`runtime/gates/**`, `governance/gates/**`) ⇒ `human_gate: required`, una tarea
por ejecución, su propia spec/plan/tasks bajo `specs/004-plan-approval-enforcement/`
(se crea al aprobarse este documento), revisión independiente y merge humano.

### U0 — B2: separación humano/agente (procedimiento humano, sin código)

Reutiliza `AGENT-HUMAN-IDENTITY-SEPARATION.md`, pasos 1–6, con estas precisiones:

1. Crear el usuario local estándar `ai-agent` sin pertenencia a
   Administradores y sin conocer ninguna contraseña de administrador.
2. ACL sólo sobre las carpetas de trabajo que usará el agente (hoy
   `D:\proyectos\ai-native` y sus worktrees `D:\proyectos\ai-native-*`):
   `icacls <carpeta> /grant ai-agent:(OI)(CI)M`. Nada sobre `C:\Users\<humano>`.
   No guardar secretos en esas carpetas.
3. Instalar e iniciar sesión de Claude Code, Codex y OpenCode *dentro* de
   `ai-agent` (autenticación del proveedor LLM, no de GitHub). No lanzar ningún
   agente desde el perfil humano a partir de ese momento.
4. Perfil `ai-agent` sin credenciales GitHub: `gh` sin sesión, sin
   `GH_TOKEN`/`GITHUB_TOKEN`, sin destinos `github` en `cmdkey`. La clave de la
   App solicitante **no** se instala todavía (se instala en U2, cuando exista
   la herramienta que la usa).
5. Ajuste en GitHub: ninguno en U0. `ai-native-human-review` mantiene
   `prevent_self_review: false` porque, en el esquema mínimo, quien empuja los
   PR es el propio humano; la independencia la da que el agente ya no pueda
   actuar como `jlbellonGmail`.

**Impacto sobre el entorno actual.** Esta sesión de agente (perfil humano, con
credenciales del propietario) deja de ser un lugar válido para agentes. El
agente deja de poder hacer `git push`, abrir PR o comentar en GitHub: prepara
commits locales y el humano los revisa (`git log -p`) y empuja desde su perfil.
Git puede rechazar repositorios de otro propietario («dubious ownership»):
`git config --global --add safe.directory <ruta>` en el perfil que lo necesite.
El cambio local sin commitear de `D:\proyectos\ai-native\scripts\ai-cli.mjs` no
se toca (las ACL no alteran contenido). Herramientas de control de
navegador/escritorio no se usan en la sesión humana mientras haya aprobaciones
pendientes. Reversión: `net user ai-agent /delete` e `icacls <carpeta> /remove ai-agent`.

**Verificación requerida** (evidencia sin secretos, registrada en
`governance/execution/current/`):

| Desde | Comando | Esperado |
|---|---|---|
| sesión `ai-agent` | `whoami` | `<equipo>\ai-agent` |
| sesión `ai-agent` | `net localgroup Administrators` | `ai-agent` no aparece |
| sesión `ai-agent` | `node runtime/gates/plan-approval.mjs check-agent-isolation` | `agent-isolation: PASS` |
| sesión `ai-agent` | `gh auth status` | sin sesión |
| sesión `ai-agent` | `cmdkey /list` | sin destinos `github` |
| sesión `ai-agent` | `dir C:\Users\<humano>` | acceso denegado |
| sesión humana | `node runtime/gates/plan-approval.mjs check-agent-isolation` | BLOCKED (control positivo: la sonda sigue detectando) |

Criterio de cierre: las siete filas, con fecha y SHA del repositorio. Hasta
entonces toda aprobación humana posterior se considera **no independiente**.

### U1 — Ruleset de `develop` (humano, configuración remota)

Crear el ruleset `ai-native-develop` sobre `refs/heads/develop`: PR
obligatorio; sin borrado ni non-fast-forward; método de merge sólo «merge
commit» (preserva el SHA aprobado como ancestro); actualizaciones restringidas
de modo que sólo el propietario pueda mergear (regla «restrict updates» con
bypass del rol administrador en modo *pull request*; si la plataforma no ofrece
esa combinación, U1 queda BLOCKED y se informa, sin sustituto más débil). Los
checks requeridos se añaden en U6, cuando existan (un check requerido que nunca
se publica bloquearía todo merge). Verificación: `gh api repos/jlbellonGmail/ai-native/rulesets`
muestra el ruleset activo con esas reglas. Depende de U0 (si no, el agente
podría mergear como propietario).

### U2 — B3: dispatch soportado de la App con custodia de la clave

- **Componente:** `runtime/gates/plan-approval-dispatch.mjs` (nuevo; control
  plane). Reutiliza el modo `request` y `loadTrustedConfig` de
  `plan-approval.mjs`.
- **Comportamiento:** (1) ejecuta `check-agent-isolation` y se niega con
  BLOCKED si no es PASS; (2) carga la configuración confiable desde `main` en
  GitHub; (3) comprueba en vivo que el PR está abierto y que su head es el SHA
  pedido; (4) lee la clave desde una ruta de fichero (`--key-file`), firma un JWT
  RS256 de vida ≤ 10 min, obtiene un token de instalación restringido al
  repositorio `1262211240` con `actions: write` únicamente; (5) hace
  `POST …/actions/workflows/plan-approval-receipt.yml/dispatches` con `ref: main`
  y los tres inputs; (6) localiza el run creado (evento `workflow_dispatch`,
  actor = bot fijado) e imprime sólo su id y URL. El token vive en memoria; nunca
  se imprime, se guarda ni se pasa a un subproceso.
- **Custodia:** el propietario genera la clave en la configuración de la App
  desde su perfil, la mueve a `%USERPROFILE%\.ai-native\keys\` *del perfil
  `ai-agent`* con `icacls <clave.pem> /inheritance:r /grant:r ai-agent:R`, y
  borra la copia descargada. Nunca en el repositorio, en secrets de GitHub, en
  variables de entorno ni en el chat. Rotación y revocación: desde la
  configuración de la App (perfil humano). Riesgo aceptado y acotado: quien
  tiene la clave *es* el solicitante, y el solicitante no puede aprobar.
- **Pruebas:** con claves efímeras generadas en la propia prueba y API
  simulada: rechazo con aislamiento BLOCKED, PR cerrado, head distinto, scope
  desconocido; el token no aparece en ninguna salida ni error; permisos pedidos
  exactamente `{actions: write}`.

### U3 — B4a: verificación en CI y atestación de la aprobación

- **Componente:** `.github/workflows/plan-approval-attest.yml` (nuevo) disparado
  por `workflow_run` del workflow `plan-approval-receipt` completado; GitHub lo
  ejecuta desde el fichero y commit de `main`.
- **Job `verify`:** sin secretos ni Environment; `permissions: { actions: read,
  contents: read, pull-requests: read, deployments: read }`; checkout de su
  propio commit de `main` con `persist-credentials: false`; descarga el artifact
  del run como datos; ejecuta `node runtime/gates/plan-approval.mjs verify` (el
  verificador existente, sin reimplementarlo) con `GITHUB_TOKEN`; produce el
  `binding` canónico o los códigos BLOCKED.
- **Job `publish`:** Environment `ai-native-trust`; token de `ai-native-trust`
  con `checks: write`; lee sólo el JSON de `verify`, lo valida contra el schema
  del binding y publica el check `ai-native/plan-approval` sobre
  `binding.headSHA` con el binding canónico y su SHA-256 en la salida
  (`success` sólo con PASS; `failure` con los códigos en otro caso).
- **Sonda previa obligatoria:** confirmar con `GITHUB_TOKEN` que se pueden leer
  el Environment y `GET …/actions/runs/{id}/approvals`. Si no, crear la App
  condicional `ai-native-plan-reader` (sólo lectura, clave en un Environment
  restringido a `main`); nunca usar la credencial del propietario.
- **Pruebas:** receipt ausente, artifact ajeno, run de otra rama o con
  `run_attempt` 2, aprobación de otra persona, documentos cambiados ⇒ check
  `failure`; el job `verify` no tiene secretos (prueba estática del YAML).

### U4 — B4b: consumidor obligatorio en el Coordinator

- **Enmienda de contrato v2** (`PLAN-APPROVAL-COORDINATOR-CONTRACT.md`): la
  verificación completa ocurre en CI (U3) con código de `main`; el consumidor
  local consume la atestación y vuelve a comprobar en vivo el estado del PR y la
  continuidad (U5). No elimina ninguna comprobación: las desplaza al único lugar
  donde el código y la credencial son confiables.
- **Componente:** `runtime/circuit/coordinator.mjs` (cambio en línea 77) y un
  módulo `runtime/gates/plan-approval-consumer.mjs`. Ante `human_gate:
  required`: lee la configuración desde `main`, busca el check
  `ai-native/plan-approval` en el head del PR de planes, exige `app.id` =
  `ai-native-trust`, `conclusion: success`, binding válido (`evaluateBinding`)
  y continuidad PASS (U5); entonces habilita al Builder fijado a ese SHA. Repite
  antes de cada tarea y de cada acción exterior. Cualquier fallo ⇒ BLOCKED y
  se descarta lo producido desde la última verificación válida.
- **Límite honesto:** un agente que corre en la máquina puede ignorar el
  Coordinator; la obligatoriedad real la da el check requerido de U5 en los
  PR de implementación. El consumidor local es parada temprana.
- **Pruebas:** sin atestación, atestación de otra App, `failure`, otro SHA,
  binding manipulado, red caída ⇒ BLOCKED; dos habilitaciones con estado
  idéntico ⇒ PASS sin nueva aprobación.

### U5 — B5: continuidad verificable hacia la implementación

**Registro de aprobación.** El check `ai-native/plan-approval` publicado por
`ai-native-trust` sobre el SHA aprobado `H` (U3). Es inmutable, sobrevive al
merge del PR de planes y sólo puede crearlo la App cuya clave vive en un
Environment restringido a `main`. Ser descendiente de `H` **no** es una
autorización: es sólo una de las condiciones.

**Declaración del PR de implementación.** Trailer o cuerpo con
`Plan-Scope: <scopeId>` y `Plan-Task: <feature>/<Tn>`, de formato estricto.

**Gate `ai-native/plan-continuity`** (nuevo workflow por `workflow_run` del CI,
con el mismo reparto `analyze` sin secretos / `publish` con `ai-native-trust`;
código de `main`, PR leído como datos). PASS sólo si se cumplen todas:

1. Existe exactamente un check `ai-native/plan-approval` de la App fijada con
   `success` sobre el head final `H` del PR de planes del scope (leído de la API
   del PR, también tras el merge), y su binding valida.
2. El PR de planes está abierto con head `H`, o mergeado con `H` como ancestro
   del commit de merge. Cerrado sin merge ⇒ aprobación **revocada**.
3. `H` es ancestro del head del PR de implementación.
4. Los nueve documentos del scope, en el head del PR de implementación y en su
   base, tienen exactamente los SHA-256 del binding, y el diff del PR no los
   toca.
5. `Plan-Task` existe en el `tasks.md` aprobado (verificado por hash) del
   feature declarado.
6. La entrada del scope en `plan-approval.json` de `main` tiene el mismo digest
   canónico que en la aprobación, la revisión del workflow emisor sigue
   registrada, y el Environment, el aprobador y el solicitante fijados no
   cambiaron (decisión D-1).
7. Las protecciones vivas del Environment siguen cumpliendo `check-environment`.

**Qué invalida la aprobación y cómo se detecta**

| Cambio | Detección | Efecto |
|---|---|---|
| Push al PR de planes tras aprobar | head ≠ `H` (condición 1/2) | BLOCKED hasta nueva aprobación del nuevo head |
| Cambio de cualquiera de los nueve documentos después | condición 4 | BLOCKED; requiere nuevo PR de planes y nueva aprobación |
| PR de planes cerrado sin merge | condición 2 | aprobación revocada |
| PR de planes mergeado con squash/rebase | `H` no es ancestro (condición 2/3) | BLOCKED; U1 impone «merge commit» |
| Scope, workflow emisor, Environment o aprobador cambiados | condición 6/7 | BLOCKED; reemisión |
| Tarea no aprobada o sin declarar | condición 5 / formato | BLOCKED |

**Al mergear el PR de planes:** permitido sólo con el check
`ai-native/plan-approval` en `success` sobre su head (check requerido para PR
que toquen documentos de un scope); la aprobación persiste en ese check.
**Al cerrarlo sin merge:** revocada; los PR de implementación quedan bloqueados.

**Límite honesto:** nadie impide empujar commits a una rama cualquiera; lo que
se impide es que lleguen a `develop` o `main` sin el check (requerido por U1/U6).

### U6 — Entrega y activación en la base confiable

PR `develop` → `main` con U2–U5; `merge-gate` detecta control plane y exige la
aprobación del Environment `ai-native-human-review` por el propietario desde su
perfil (independiente tras U0). Mismo PR (control plane): registrar la nueva
`trustedRevision` del workflow en `plan-approval.json` y un scope de prueba
`unblock-e2e-v1` sobre un PR de prueba con un documento trivial. Tras el merge
humano: añadir `ai-native/plan-approval` (PR con documentos de scope),
`ai-native/plan-continuity` y los checks existentes como requeridos en los
rulesets de `develop` y `main` (acción humana). Prueba extremo a extremo con un
receipt real del scope de prueba y los criterios negativos de abajo.

### U7 — Aprobación de los planes 001–003 (objetivo final, fuera de este plan)

Con U0–U6 cerrados: dispatch por U2 desde `ai-agent` sobre el head de #168,
aprobación del propietario en el Environment desde su perfil, atestación U3,
consumo U4 y continuidad U5 para cada tarea de implementación.

## Arranque: autorizaciones distintas y procedimiento existente

| Etapa | Quién | Mecanismo existente | ¿Lo exige el runtime? | Disponible hoy |
|---|---|---|---|---|
| 1. Autorización para preparar este plan | propietario | instrucción en la sesión (2026-11-23), registrada en `V4-STATE.md` | no | sí (dada) |
| 2. Aprobación humana del plan de desbloqueo | propietario | comentario del propietario en #168 citando el SHA del commit y el blob de este fichero, **hecho desde el perfil humano después de U0** | no (procedimiento manual); su valor depende de U0 | no: hasta U0 un comentario de `jlbellonGmail` no se distingue del agente |
| 3. Autorización para implementar U2–U5 | propietario | instrucción por tarea (una tarea por ejecución) + `human_gate: required` derivado del diff | parcial (`hitl.mjs` lo marca; no aprueba) | tras etapa 2 |
| 4. Merge y activación en `main` | propietario | ruleset `ai-native-main` + `merge-gate` + Environment `ai-native-human-review`; merge de `develop` con U1 | sí (checks de `ai-native-trust` y Environment) | tras U0 y U1 |
| 5. Aprobación de los planes de Native Acceptance | propietario | receipt (U2) + atestación (U3) + consumo (U4) + continuidad (U5) | sí | tras U6 |

Ninguna etapa usa el circuito incompleto: la 2 es un registro manual cuyo
valor depende sólo de U0 (que no requiere aprobar código), y la 4 usa el
Environment y el ruleset que ya existen. **El procedimiento existente no
alcanza hoy** porque, sin U0, el agente puede actuar como el aprobador en las
etapas 2 y 4. Acción humana necesaria para salir del bloqueo: ejecutar U0 y
verificarlo; luego aprobar este plan (etapa 2) y crear el ruleset de U1.

## Criterios verificables

| Caso | Resultado exigido | Dónde se prueba |
|---|---|---|
| Receipt ausente | atestación no publicada; consumidor y `plan-continuity` BLOCKED | U3, U4, U5 |
| Receipt inválido (schema, digest, ZIP hostil, otro contenido) | `verify` BLOCKED; check `failure` | U3 (reusa pruebas del verificador) |
| Receipt vencido (artifact expirado) o reemitido tras cambio de configuración | BLOCKED (`ARTIFACT_EXPIRED`, `CONFIG_CHANGED`) | U3 |
| Receipt ajeno (otro repo, PR, scope, run o rama) | BLOCKED (`RECEIPT_STALE`, ids distintos) | U3, U4 |
| Cambio de planes tras aprobar | condición 4 de U5 ⇒ BLOCKED | U5 |
| Implementación sin autorización (sin trailer, tarea no aprobada, sin atestación) | `plan-continuity` BLOCKED; el ruleset impide el merge | U5, U6 |
| Cambio del verificador desde el PR | el veredicto lo calcula el código de `main`; el PR es control plane ⇒ Environment humano | U3, U5, U6 |
| Agente con capacidad de aprobación humana | `check-agent-isolation` BLOCKED ⇒ U2 y U4 se niegan; U0 verificado | U0, U2, U4 |
| Continuidad válida | atestación sobre `H` + ancestro + documentos idénticos + tarea aprobada ⇒ PASS en dos tareas sucesivas sin nueva aprobación | U5, U6 |

## Decisiones humanas requeridas

- **D-0:** aprobar o rechazar este plan (etapa 2), después de U0.
- **D-1:** qué cambios de `plan-approval.json` invalidan una aprobación ya
  atestada. Propuesta: el digest canónico de la entrada del scope, la
  revisión emisora retirada, y cambios de Environment, aprobador o solicitante.
  La alternativa estricta (cualquier cambio de configuración) haría imposible
  registrar nuevas revisiones sin re-aprobar todo.
- **D-2:** mantener el esquema mínimo (el agente sin escritura en GitHub; el
  humano empuja) o aprobar más adelante una identidad de escritura para el
  agente con su propia justificación.
- **D-3:** dónde vive este plan: en #168 (actual) o en un PR propio.

## Riesgos residuales

Ventana TOCTOU entre verificar y actuar (acotada, no resuelta); una cuenta
`ai-agent` con privilegios de administrador anularía U0; herramientas de
control de escritorio en la sesión humana; `workflow_run` trata datos de un run
no confiable (mitigado: no se ejecutan, se validan contra la API viva);
consumidores que no hagan requerido el check; límites de la API de GitHub.
