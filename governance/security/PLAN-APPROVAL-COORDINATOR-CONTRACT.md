# Contrato del Coordinator consumer del Plan Approval Receipt

Estado: **ESPECIFICACIÓN. El Coordinator consumer NO está implementado.** Lo que existe es el verificador que este consumidor deberá llamar (`verifyFromGitHub` en `runtime/gates/plan-approval.mjs`, `verifyReceiptProvenance` y `evaluateBinding` en `runtime/gates/plan-approval-receipt.mjs`), con pruebas con mocks. Este documento fija lo que el consumidor **debe** hacer; nada de aquí se ha ejecutado contra un receipt real.

**TOCTOU end-to-end: NO RESUELTO.** El verificador reduce la ventana (PR y `main` se leen dos veces, todo se relee en vivo, el binding se ata al SHA exacto), pero ninguna comprobación previa puede impedir que el estado cambie después. Sólo el consumidor, aplicando este contrato antes de **cada** habilitación y de **cada** acción exterior, acota el riesgo; y aun así queda una ventana residual (sección «Ventana residual»). Mientras el consumidor no exista y no se haya probado extremo a extremo, no se declara resuelto.

## Qué es y qué no es

- Es la puerta que decide si el Builder puede trabajar sobre **un PR concreto en un SHA concreto** con **un conjunto concreto de nueve documentos** que el propietario aprobó.
- Un receipt **no autoriza** merges, releases, tags ni cambios fuera de los nueve documentos. El consumidor nunca amplía el alcance del receipt.
- Un PASS previo **no es una autorización**: es una observación fechada (`binding.verifiedAt`). La autorización es la verificación que acaba de ocurrir.

## Entradas

| Entrada | Procedencia | Confianza |
|---|---|---|
| Pin del repositorio `{ fullName, id }` | configuración propia del Coordinator / su proyecto (hoy: bloque `repository` del checkout, sólo como pin y localizador) | confiable: **no sale del receipt** |
| `expected` = `{ scopeId, repositoryId, pullRequestNumber, headSha }` (+ `planSetFingerprint` si ya se conoce) | lo que el Coordinator **está a punto de habilitar** | confiable |
| receipt (JSON) | artifact del run o copia local | **candidato no confiable**: sólo dice qué run y qué PR mirar |
| Credencial de lectura de GitHub | token de instalación de una App técnica de **sólo lectura** | nunca la credencial del propietario ni la de la App que solicita (`ai-native-plan-approval`) |

La credencial de lectura necesita únicamente: Actions: read (runs, artifacts, historial de aprobación), Contents: read (configuración, documentos, blobs), Pull requests: read y Metadata: read. El permiso para leer el Environment **no está confirmado** en la documentación oficial (sólo dice «read access al repositorio»): hay que comprobarlo en la primera prueba real; si no alcanza, `ENV_UNREADABLE` ⇒ BLOCKED.

## Algoritmo obligatorio

Todo paso que falle, falte, devuelva un estado desconocido o lance una excepción ⇒ **BLOCKED**. No existe «continuar con una advertencia» ni «saltar la comprobación».

1. **Pin del repositorio.** Tomar `fullName` e `id` de la configuración del Coordinator. Un nombre con segmentos `.`/`..` o con formato inválido ⇒ BLOCKED sin consultar nada.
2. **Recuperar la configuración confiable** (`loadTrustedConfig`): `GET repos/{repo}`, cabeza de `main`, y `governance/gates/plan-approval.json` en **ese** commit. La configuración **no** se acepta del PR, del worktree, del receipt ni de ningún input. Si no puede recuperarse ⇒ BLOCKED `CONFIG_UNREADABLE` y no se evalúa nada más (no hay raíz de confianza no circular).
3. **Cargar el receipt candidato** y validar su forma (esquema). Ningún campo del receipt llega a una ruta de API si no tiene la forma exacta esperada (enteros positivos, SHA de 40 hex).
4. **Recolectar la evidencia viva** (tabla siguiente), con `main` y el PR leídos **de nuevo al final**.
5. **Llamar a `verifyReceiptProvenance`** con esa evidencia y la configuración recuperada en el paso 2.
6. Si PASS: obtener el `binding` (inmutable). Si ya existe un binding aprobado anterior para esta tarea o sesión, llamar a `evaluateBinding(previo, nuevo)`; cualquier diferencia en un campo de identidad ⇒ BLOCKED.
7. **Habilitar al Builder únicamente para `binding.headSHA`**: worktree fijado a ese commit exacto. Registrar el binding y la hora en la evidencia de la tarea (sin secretos).
8. Repetir 1-7 **antes de cada habilitación** (nueva tarea, nueva sesión, reanudación) y **antes de cada acción exterior** que dependa de la aprobación (push de resultados, actualización del PR). Un BLOCKED en cualquier repetición descarta lo producido desde la última verificación válida y avisa a un humano.

## Evidencia viva que se debe recolectar y verificar

Cada pieza es obligatoria (`EVIDENCE_INCOMPLETE` si falta). El código las exige por nombre; una prueba mantiene esta lista sincronizada con `REQUIRED_EVIDENCE`.

| Campo | Qué es | Qué demuestra |
|---|---|---|
| `live.now` | reloj del consumidor (ISO 8601 estricto) | caducidad del artifact; receipt no fechado en el futuro |
| `live.artifacts` | artifacts del run listados por GitHub | existe exactamente uno con el nombre esperado, no expirado, con `digest` sha256 |
| `live.archive` | bytes **descargados** del artifact, su SHA-256 y el receipt extraído | digest == bytes; ZIP del perfil estricto (un archivo regular); contenido == receipt bajo prueba |
| `live.run` | el run emisor | ruta, evento `workflow_dispatch`, rama `main`, `run_attempt` 1, `success`, actor = App fijada, repositorio |
| `live.workflowAncestry` | `compare` del commit del run contra `main` | el commit del run está en `main` |
| `live.workflowFiles` | blobs de los ficheros que el run ejecutó, en `run.head_sha` | coinciden con una revisión registrada **en la configuración actual** (no histórica, no desconocida) |
| `live.trustedConfig` | repositorio, cabeza de `main` (leída dos veces), configuración en la cabeza y en `sourceRevision`, ancestría | la configuración vigente es la del receipt (git blob y SHA-256 idénticos), viene de `main`, y `main` no se movió durante la verificación |
| `live.pr` | PR vivo | abierto, no fusionado, base y rama esperadas, no fork, **Head SHA** == el del receipt |
| `live.prRecheck` | segunda lectura del PR, tomada la última | el PR no cambió durante la recolección (`TOCTOU_PR_CHANGED`) |
| `live.documents` | SHA-256 vivos de los nueve documentos en el SHA del PR | cada hash == el del receipt; el conjunto == el scope |
| `live.environment` | protecciones vivas del Environment dedicado | id/nombre, sin bypass de administradores, `prevent_self_review`, único reviewer, sólo `main` |
| `live.approvals` | historial de aprobación del run | exactamente una entrada `approved`, del aprobador fijado, ≠ solicitante |
| `live.expected` | lo que el consumidor va a autorizar | scope, **Repository ID**, PR y **Head SHA** coinciden con el receipt (`RECEIPT_STALE` si no) |

## Condiciones que producen BLOCKED

Cualquiera de las siguientes, sin excepción ni umbral:

1. **Repository ID** (o nombre) distinto en la configuración, el receipt, el artifact, el run o el pin del consumidor.
2. PR cerrado, fusionado, de otro número, de un fork, con otra base o rama.
3. **Head SHA** del PR distinto del aprobado.
4. Cualquiera de los nueve documentos ausente, cambiado, no regular o fuera del scope.
5. Plan fingerprint distinto del recalculado, o distinto del que el consumidor ya esperaba.
6. Scope desconocido, o cuya definición ya no coincide con el receipt.
7. Configuración confiable no recuperable, cambiada (git blob o SHA-256 distintos), con un `sourceRevision` que no es ancestro de `main`, o no leída del commit del run.
8. Workflow no ejecutado desde `main`, `run_attempt` ≠ 1, run no exitoso, o revisión de ficheros no registrada (histórica, desconocida o retirada).
9. Artifact ausente, ambiguo, expirado, de otro run/repositorio/rama/commit, sin digest, con digest o tamaño distintos de los bytes descargados, con ZIP fuera del perfil (symlink, directorio, entradas extra, cabeceras incoherentes, ZIP64, CRC, ratio…), o con contenido distinto del receipt.
10. Identidad del solicitante que no es la App fijada, o aprobador que no es el fijado, o aprobador == solicitante.
11. **Environment** no es el dedicado, protecciones debilitadas, o ilegible.
12. Estado de aprobación ausente, pendiente, rechazado, ambiguo o desconocido.
13. `main` o el PR se movieron mientras se recolectaba la evidencia.
14. Cualquier excepción, respuesta malformada, estado `UNKNOWN`, `null` donde se exige un valor, o error de red.

## Binding inmutable

`verifyReceiptProvenance` devuelve, sólo en PASS, un `binding` **congelado** (`Object.freeze`; asignar a un campo lanza `TypeError`):

```text
scopeId, repositoryId, pullRequestNumber, headSHA, planSetFingerprint, workflowRunId, workflowRevisionId,
trustedConfigSha256, trustedConfigBlobSha, trustedConfigSourceRevision          ← identidad: define QUÉ se aprobó y con QUÉ reglas
mainTipSha, verifiedAt                                                           ← observaciones: no son identidad
```

`evaluateBinding(aprobado, fresco)` compara **todos** los campos de identidad; cualquier diferencia (un nuevo `headSHA`, otro fingerprint, otra configuración, otra revisión del workflow, otro run) ⇒ BLOCKED `BINDING_CHANGED`; un binding ausente, incompleto o con `null` ⇒ BLOCKED `BINDING_INCOMPLETE`. `mainTipSha` y `verifiedAt` quedan fuera a propósito: `main` avanza con commits ajenos sin que eso toque lo aprobado.

**Los dos bindings (aprobado y fresco) se validan ANTES de compararse; un binding que no se puede validar es BLOCKED y no se compara nada.** Un binding es un objeto JSON plano y cerrado, **nunca un `Proxy`** (ni transparente ni revocado: se detecta con `util.types.isProxy` como PRIMERA comprobación, antes de leer prototipo, claves o descriptores, de modo que no se ejecuta ningún trap; `BINDING_MALFORMED`): prototipo `Object.prototype` o `null` (nada heredado, ni arrays, ni instancias de clase), cada campo de identidad es una propiedad **propia**, de datos y enumerable (ni getters, ni heredada de `Object.prototype`), ninguna propiedad inesperada (tampoco símbolos ni no enumerables), y cada valor está presente y es válido para su campo: `scopeId` `^[a-z0-9][a-z0-9-]*$`; `repositoryId`, `pullRequestNumber`, `workflowRunId` enteros seguros ≥ 1 (no cadenas, no `NaN`/`Infinity`); `headSHA`, `trustedConfigBlobSha`, `trustedConfigSourceRevision` 40 hex minúsculas; `planSetFingerprint`, `trustedConfigSha256` 64 hex minúsculas; `workflowRevisionId` un único token visible de 1–128 caracteres. Esos formatos salen del schema del receipt y de la configuración; el único campo sin formato fijado por ningún contrato es `workflowRevisionId` (la documentación sólo da `r1-<M corto>` como ejemplo), de modo que sólo se exige lo seguro (no vacío, sin espacios ni caracteres de control, acotado) y el mismo requisito se aplica a la revisión registrada en `workflow.trustedRevisions` (`TRUST_CONFIG_INVALID`), para que productor y validador no discrepen. `mainTipSha` (40 hex o `null`) y `verifiedAt` (instante ISO 8601 real) son opcionales pero, si están, se validan. Un campo ausente, `undefined`, `null`, no propio o que no es un objeto plano ⇒ `BINDING_INCOMPLETE`; un campo presente pero de tipo o formato inválido, un accesor o una propiedad inesperada ⇒ `BINDING_MALFORMED`. Los hallazgos no repiten el valor ofensivo. La comparación posterior es exacta: no se recorta, no se pasa a minúsculas, no se convierte `"168"` en `168`. `evaluateBinding` nunca lanza: cualquier excepción se devuelve como hallazgo.

`evaluateBinding` **no sustituye** a la verificación fresca: dice si el estado recién verificado sigue siendo el aprobado. Nunca se usa para saltarse la relectura.

## Reutilización sin ceremonia por tarea

El mismo receipt se reutiliza (sin pedir otra aprobación humana, sin registro de consumo) **mientras** el conjunto de condiciones aprobadas siga idéntico: mismo repositorio, PR, Head SHA, nueve documentos, scope, configuración confiable, revisión del workflow, aprobador y estado de aprobación. La verificación automática se repite en cada habilitación (paso 8) — eso es máquina, no burocracia humana. Si algo cambia, el receipt deja de valer y hace falta una nueva aprobación **de ese conjunto nuevo**. Un cambio en `plan-approval.json` (p. ej. registrar una revisión del workflow, añadir un scope) cambia la identidad de la configuración y exige reemitir: es burocracia por **cambio de configuración**, no por tarea.

## Ventana residual (por qué el TOCTOU no se declara resuelto)

| Qué cierra este contrato | Qué NO cierra |
|---|---|
| Habilitar con un SHA o un documento distintos del aprobado | Alguien con permiso de push a la rama del PR puede empujar **después** de la última verificación y **antes** de que el Builder actúe |
| Reutilizar una aprobación tras cambiar configuración, workflow, Environment o aprobador | Una verificación sólo vale en el instante en que se hizo: no hay atomicidad entre «verificar» y «actuar» |
| Que el Builder trabaje sobre otro commit que el aprobado (worktree fijado al SHA) | Que un push al PR **durante** una tarea larga pase desapercibido hasta la siguiente verificación |
| Receipts viejos tras mover `main` de configuración | Cambios en GitHub (Environment, ruleset) entre dos lecturas |

Mitigaciones del contrato: worktree fijado al `headSHA`; verificación antes de cada habilitación **y** antes de cada acción exterior; descarte de lo producido si una repetición da BLOCKED. Cerrar del todo la ventana exigiría que la rama del PR no admita pushes durante la ejecución (ruleset/permisos), decisión humana fuera de esta tarea.

## Requisitos de implementación

- Sólo GET. Sin escritura en GitHub, sin aprobar, sin mergear, sin `workflow_dispatch`.
- Ningún secreto en logs, en el binding ni en la evidencia. Sin lectura de credenciales humanas.
- Nada del PR se ejecuta ni se instala: los documentos sólo se hashean.
- Fail-closed ante cualquier excepción: salida distinta de 0 / estado BLOCKED, nunca PASS.
- Un único punto de entrada: `verifyFromGitHub` (la configuración no es un parámetro). El consumidor no debe reimplementar las comprobaciones.
- La salida del consumidor al resto del sistema es el `binding` o un BLOCKED con códigos; no debe exponer «aprobado» de ninguna otra forma.

## Pruebas de conformidad requeridas para el futuro consumidor

1. PASS sólo con toda la evidencia; cada pieza ausente ⇒ BLOCKED.
2. Cambio de Head SHA, de cualquiera de los nueve documentos, de base o de rama ⇒ BLOCKED.
3. Cambio de configuración en `main` tras la emisión ⇒ BLOCKED; configuración aportada por parámetro, worktree o PR ⇒ ignorada.
4. Revisión histórica o desconocida del workflow o de la configuración ⇒ BLOCKED.
5. Artifact falsificado (ZIP hostil, receipt local distinto del del run, digest ajeno) ⇒ BLOCKED.
6. Estado `UNKNOWN`, `null`, error de red o excepción en cualquier lectura ⇒ BLOCKED.
7. `main` o el PR que se mueven durante la verificación ⇒ BLOCKED.
8. Reutilización del mismo receipt en dos habilitaciones con condiciones idénticas ⇒ PASS en ambas sin nueva aprobación; con un cambio de identidad ⇒ BLOCKED.
9. Binding congelado; `evaluateBinding` detecta cualquier cambio de identidad.
10. Ningún camino de código escribe en GitHub ni imprime un secreto.

Las pruebas 1-9 existen hoy contra mocks para el verificador (`runtime/gates/plan-approval-receipt.test.mjs`); el consumidor deberá añadir las suyas y una prueba extremo a extremo con un receipt real (fuera de esta tarea).
