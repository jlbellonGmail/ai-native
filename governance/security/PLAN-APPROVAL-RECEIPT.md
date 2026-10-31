# Plan Approval Receipt (bootstrap)

Mecanismo mínimo para que el Coordinator pueda exigir, antes de habilitar al Builder, una aprobación humana de un conjunto exacto de documentos SDD **verificable contra GitHub**. Una aprobación conversacional no es evidencia runtime; un JSON local aislado tampoco.

Estado: **bootstrap local remediado por tercera vez** tras el dictamen REJECT de la segunda revisión independiente de Codex, pendiente de tercera revisión. **No hay seguridad operativa extremo a extremo.** Faltan la configuración externa (App, Environment dedicado, registro de la revisión del workflow, separación de credenciales), el Coordinator consumer y la prueba extremo a extremo. Lo que existe es el verificador (`verifyFromGitHub` / `plan-approval.mjs verify`) que ese consumidor llamará; su contrato obligatorio está en `PLAN-APPROVAL-COORDINATOR-CONTRACT.md`.

**TOCTOU end-to-end: NO RESUELTO.** El verificador reduce la ventana y el contrato del consumidor la acota, pero sin consumidor implementado y probado no hay garantía posterior a la emisión del receipt (ver «TOCTOU y reutilización»).

## Flujo

```text
1 agente      → App `ai-native-plan-approval` hace workflow_dispatch (pr_number, head_sha, scope_id)
2 workflow    → .github/workflows/plan-approval-receipt.yml, ejecutado desde main
3 verify-request   PR, SHA, nueve documentos (sólo hash), identidad App, revisión del workflow, identidad de la configuración, Environment → BLOCKED o fingerprint
4 human-approval   Environment DEDICADO `ai-native-plan-approval` (aprobación del propietario en GitHub)
5 issue-receipt    re-verifica todo, lee el historial de aprobación del run, escribe el receipt
6 artifact         plan-approval-receipt-<run_id> del propio run
7 (futuro)    → el Coordinator recupera la configuración de main y llama a verify contra GitHub inmediatamente antes de habilitar al Builder
```

El receipt NO autoriza merges, releases, tags ni cambios fuera de los nueve documentos aprobados. El agente sólo puede solicitar; no aprueba, no modifica el Environment, no altera el receipt y no mergea.

## Piezas

| Pieza | Ruta |
|---|---|
| Workflow confiable | `.github/workflows/plan-approval-receipt.yml` |
| Configuración confiable (scope, identidades, revisiones del workflow) | `governance/gates/plan-approval.json` |
| Esquema del receipt | `contracts/plan-approval-receipt.schema.json` |
| Decisiones puras, identidad de la configuración, binding y verificador de procedencia | `runtime/gates/plan-approval-receipt.mjs` |
| Bytes del artifact (SHA-256, perfil ZIP estricto, CRC-32) | `runtime/gates/plan-approval-artifact.mjs` |
| E/S con GitHub (`request`, `issue`, `verify`, `trusted-config`, `check-environment`, `check-agent-isolation`; sólo GET) | `runtime/gates/plan-approval.mjs` |
| Pruebas del lector ZIP (archivos generados en memoria) | `runtime/gates/plan-approval-artifact.test.mjs`, generador `plan-approval-zip.fixture.mjs` |
| Pruebas del resto (fixtures/mocks, sin red ni credenciales) | `runtime/gates/plan-approval-receipt.test.mjs` |
| Contrato obligatorio del futuro Coordinator consumer | `governance/security/PLAN-APPROVAL-COORDINATOR-CONTRACT.md` |
| Separación humano/agente en Windows (propuesta) | `governance/security/AGENT-HUMAN-IDENTITY-SEPARATION.md` |

Todo es plano de control (`.github/**`, `governance/gates/**`, `contracts/**`, `runtime/gates/**`): cambiarlo exige revisión humana por el `merge-gate`.

## Tres pines que bloquean (fail-closed) hasta que un humano los fije

`governance/gates/plan-approval.json` nace con tres valores sin fijar. Mientras cualquiera lo esté, **toda petición y toda verificación quedan BLOCKED**; ningún entorno de producción acepta «cualquier» valor.

| Pin | Valor hoy | Código de bloqueo | Quién lo fija y cuándo |
|---|---|---|---|
| `requester.botUserId` | `null` | `REQUESTER_NOT_PINNED` | humano, tras crear la App (PR revisada) |
| `environment.id` | `null` | `ENV_NOT_PINNED` | humano, tras crear el Environment dedicado (PR revisada) |
| `workflow.trustedRevisions` | `[]` | `WORKFLOW_REVISIONS_EMPTY` | humano, tras integrar el workflow en `main` (PR revisada) |

Los tests usan fixtures explícitos con estos valores rellenados; un test fija que el fichero del repositorio sigue sin ellos.

## Configuración confiable: modelo de confianza no circular (hallazgo HIGH 2)

Problema: `plan-approval.json` decide casi todo (identidades, Environment, revisiones del workflow) pero no podía fijarse a sí misma (el hash de un fichero dentro de sí mismo es imposible) y quedaba fuera de los seis blobs fijados; el consumidor la leía del worktree.

**Raíz de confianza**: el historial de `main` en GitHub — commits direccionables por contenido en una rama con ruleset activo `ai-native-main` (PR obligatorio, checks obligatorios incluido `ai-native/merge-gate`, sin bypass, sin borrado ni force-push; id 24405506, GET). La revisión humana del plano de control no la aporta el ruleset (`required_approving_review_count: 0`) sino el check obligatorio `merge-gate`, que exige la aprobación humana del Environment `ai-native-human-review` para esos ficheros. La identidad de la configuración **no se guarda dentro de la configuración**: se registra en el receipt y se comprueba contra GitHub.

Tres conceptos separados que **no se mezclan**:

| Concepto | Qué es | Dónde vive | Entra en el fingerprint |
|---|---|---|---|
| Plan fingerprint | qué se aprobó: scope, repositorio, PR, head SHA y los nueve hashes | `planSetFingerprint` (SHA-256 del JSON canónico) | — |
| Identidad de la configuración | qué configuración lo juzgó: `{ path, sourceRevision, gitBlobSha, sha256, repositoryId, workflowRunId }` | `receipt.trustedConfig` | **No** (`sourceRevision` excluido del input fingerprint, decisión aprobada en v4) |
| Procedencia del workflow | qué código se ejecutó: blobs de `workflow.trustedFiles` en `run.head_sha` | `workflow.trustedRevisions` + `workflowSHA` | No |

Un test fija que `planSetFingerprint` no lee `sourceRevision`/`trustedConfig` y que cambiarlos no cambia el fingerprint (se reporta como `CONFIG_*`, nunca como `RECEIPT_TAMPERED`).

**Emisión (en el workflow, `request` y `issue`)** — `evaluateConfigSource`:
1. La configuración en uso se captura como **bytes** del checkout del commit del run (`github.sha`, ancestro de `main`).
2. Se lee el mismo fichero de GitHub en `run.head_sha` y la cabeza actual de `main`. Deben coincidir: bytes locales == bytes de `main` en el commit del run (`CONFIG_NOT_FROM_REVISION`; sólo se tolera CRLF↔LF de un checkout Windows), el objeto en uso es el parse de esos bytes (`CONFIG_OBJECT_MISMATCH`), los bytes devueltos hashean al git blob que GitHub declara (`CONFIG_BLOB_MISMATCH`), y **`main` no movió el fichero** desde el commit del run (`CONFIG_CHANGED`, relevante porque la aprobación puede tardar horas).
3. El receipt registra `sourceRevision` (= `workflowSHA`), `gitBlobSha`, `sha256` **de los bytes originales de GitHub**, `repositoryId` y `workflowRunId`.

**Verificación (consumidor)** — `loadTrustedConfig` + `evaluateTrustedConfig`:
1. La configuración se recupera **sólo** de GitHub: `GET repos/{repo}`, cabeza de `main`, fichero en ese commit. Ni el worktree, ni el PR, ni el receipt, ni un parámetro la sustituyen (`verifyFromGitHub` ni siquiera la recibe; un test pasa una configuración debilitada y comprueba que se ignora). Un checkout local que difiere se reporta `CONFIG_LOCAL_DIFFERS` (BLOCKED, nunca se prefiere).
2. El receipt se juzga con ella. Se exige: parse de los bytes de la cabeza == configuración en uso (`CONFIG_NOT_TRUSTED_SOURCE`); git blob y SHA-256 de la cabeza **idénticos a los del receipt** (`CONFIG_CHANGED`: si la configuración cambió, BLOCKED y hay que reemitir); lo mismo en `sourceRevision` leído de GitHub (`CONFIG_AT_REVISION_MISMATCH`, revisión histórica o desconocida); `sourceRevision` ancestro de la cabeza de `main` (`CONFIG_REVISION_NOT_ON_MAIN`); repositorio por id **y** nombre contra la configuración, el receipt, el artifact y el pin del consumidor (`CONFIG_REPO_MISMATCH`); cabeza de `main` leída antes y **después** de toda la evidencia (`CONFIG_TIP_MOVED`).
3. Si no se puede establecer la raíz (repositorio, `main` o fichero ilegibles, JSON inválido, `type`/`encoding`/tamaño inesperados) ⇒ `CONFIG_UNREADABLE`, BLOCKED, y **no se evalúa nada más**.
4. Ningún campo del receipt llega a una ruta de API sin su forma exacta (SHA de 40 hex, enteros positivos); un localizador de repositorio con segmentos `.`/`..` no se consulta.

**Qué garantiza** (con mocks y con GET reales de las formas de API usadas, sin un receipt real): que la configuración que juzga un receipt es byte a byte la de un commit de `main` y sigue siéndolo; que una configuración manipulada, cambiada después, histórica o aportada desde fuera es BLOCKED. **Qué no garantiza**: que `main` sea legítimo — quien pueda mergear en `main` sin revisión humana (cuenta del propietario comprometida, edición del ruleset por un administrador) controla también la configuración; ver «Riesgos pendientes».

**Consecuencia operativa (por diseño)**: cualquier cambio de `plan-approval.json` (registrar una revisión del workflow, fijar un pin, añadir un scope) cambia la identidad y deja BLOCKED los receipts anteriores: hay que reemitirlos. Es burocracia por **cambio de configuración**, no por tarea. No se implementa una identidad por scope (reduciría las reemisiones a costa de complejidad); es una decisión humana posible más adelante.

## Procedencia del receipt: cuatro capas separadas

`verifyReceiptProvenance` **no** acepta un receipt sin el artifact real ni sin la configuración recuperada de `main`. Toda la evidencia es obligatoria; si falta una pieza ⇒ `EVIDENCE_INCOMPLETE` ⇒ BLOCKED (no existe «opcional»).

| Capa | Dónde | Qué comprueba |
|---|---|---|
| 1 Descarga autenticada | `plan-approval.mjs` (`ghDownload`, sólo GET) | lista los artifacts del run por nombre, descarga `…/actions/artifacts/{id}/zip` con la credencial de lectura del consumidor; GitHub responde 302 a una URL de almacenamiento de 1 minuto |
| 2 Bytes | `plan-approval-artifact.mjs` | SHA-256 de los bytes **descargados**, tamaño y **perfil ZIP estricto** (abajo), nombre de entrada esperado |
| 3 Contenido | `validateReceipt` | el JSON extraído cumple el esquema, su fingerprint/ids/fechas/identidad de configuración son coherentes y es **idéntico (JSON canónico)** al receipt que se pretende verificar |
| 4 Procedencia del run | `verifyReceiptProvenance` | metadata del artifact, run, actor, revisión confiable del workflow, configuración confiable, aprobación, Environment, PR y documentos vivos |

Metadata exigida al artifact (campos reales de la API, comprobados con un GET real): `digest` (`sha256:…`), `size_in_bytes`, `expired`, `created_at`, `expires_at`, `workflow_run{id, repository_id, head_repository_id, head_branch, head_sha}`. Se rechaza: artifact ausente, expirado, ambiguo, de otro run/repositorio/rama/commit, con otro id que el descargado, `digest` ausente o no-sha256, digest o tamaño distintos de los bytes descargados, contenido manipulado o receipt local diferente del del artifact.

**Sobre el digest.** La documentación oficial marca `digest` como opcional/nulo y **no dice qué cubre**. Se comprobó empíricamente (GET + descarga de un artifact real del repositorio, repetido en esta ronda): `digest == sha256(bytes del zip descargado)`. Como la API puede devolverlo nulo, la decisión es: **sin digest ⇒ BLOCKED**.

### Perfil ZIP admitido (hallazgo HIGH 1)

Codex reprodujo que el lector aceptaba una entrada marcada como enlace simbólico. El lector se rehízo contra un **perfil cerrado** (`ZIP_PROFILE = plan-approval-zip-v1`) derivado de un ZIP real de `upload-artifact` (volcado campo a campo con un GET real). No se añadió ninguna biblioteca: un lector genérico tendría que restringirse igualmente a este perfil, y todo lo que un lector genérico «interpretaría» (symlinks, directorios, extras, ZIP64, varias entradas, comentarios, huecos) aquí se **rechaza**, de modo que no hay nada que interpretar.

```text
[cabecera local | nombre][datos deflate o stored][data descriptor (16 B con firma) sólo si flag bit 3][cabecera central | nombre][EOCD]
```

| Regla | Detalle |
|---|---|
| Disposición exacta | sin prefijo, sin hueco, sin solapamiento, sin bytes finales; EOCD en los **últimos 22 bytes** (sin comentario) ⇒ no hay búsqueda de firma que engañar; `cdOff + cdSize == EOCD`; datos + descriptor llenan exactamente hasta el directorio central |
| Una sola entrada | `total == 1`; el directorio central mide exactamente `46 + len(nombre)`: una segunda entrada, duplicada u oculta no cabe en ningún sitio |
| Sin ZIP64 | sin localizador, sin centinelas `0xFFFF`/`0xFFFFFFFF`, sin campos extra, versión necesaria ≤ 20 |
| Sin extras ni comentarios | campos extra (central y local) y comentarios de entrada/archivo deben medir 0 |
| Flags | sólo `0x0000` o `0x0008`, **idénticos** en ambas cabeceras (sin cifrado, sin UTF-8, sin bits desconocidos) |
| Método | 8 (deflate) o 0 (stored, sin descriptor, tamaños iguales), idéntico en ambas cabeceras |
| Cabecera local | nombre (bytes), flags, método, versión y, sin descriptor, CRC/tamaños coinciden con la central; con descriptor son 0 o iguales y el descriptor coincide |
| **Sólo archivo regular** | sistema creador FAT(0), Unix(3) o NTFS(10), otro ⇒ rechazo. Unix: `S_IFREG` y sin setuid/setgid/sticky. Familia DOS: sin atributo de directorio, etiqueta de volumen ni reparse point, sin bits Unix. **Symlink, directorio, FIFO, dispositivos de carácter/bloque, socket y todo tipo desconocido ⇒ rechazo** |
| Nombre | ASCII `[A-Za-z0-9_.-]+`, sin separadores, ni `.`, ni `..*`, ≤ 255 bytes, y debe ser el esperado (`plan-approval-receipt.json`): rutas absolutas y *path traversal* imposibles |
| Tamaños | 1 ≤ tamaño ≤ 1 MiB, archivo ≤ 2 MiB, ratio de compresión ≤ 50 |
| Datos | CRC-32 propio (tabla; `zlib.crc32` no existe en todo Node ≥ 20) de los bytes inflados == el registrado; el flujo deflate termina **exactamente** en el tamaño comprimido registrado y se infla a **exactamente** el tamaño registrado (`maxOutputLength` = tamaño declarado) |

Todo se procesa **en memoria**; nada se extrae a disco. Cualquier estructura fuera del perfil lanza y acaba en BLOCKED; una futura variación del formato de GitHub dejaría de verificar (fail-closed) en lugar de degradarse. El perfil se contrastó con el ZIP real descargado (`sbom.cdx.json`, 914220 bytes, ratio 14,7, creado en Unix, flag 8): se acepta y su SHA-256 coincide con el `digest` de GitHub.

## Revisión confiable del workflow

Aceptar «cualquier ancestro de `main`» admitía versiones históricas ya no confiables. Ahora, además de estar en `main`, la **revisión** debe estar registrada.

- Revisión = los **git blobs** de los ficheros que el run ejecuta (`workflow.trustedFiles`: el workflow, `plan-approval.mjs`, `plan-approval-receipt.mjs`, `plan-approval-artifact.mjs`, `schema-lite.mjs`, el esquema) leídos de GitHub en `run.head_sha`.
- Se fijan **blobs y no commits**: el run se despacha sobre la cabeza de `main`, cuyo SHA cambia con cada commit ajeno; pinear el commit invalidaría el workflow tras registrarlo. El blob sólo cambia si cambia el fichero.
- La configuración **no** forma parte del conjunto (contiene la lista): su autenticidad se establece por la identidad de la sección anterior, no por esta lista. `plan-approval-zip.fixture.mjs` es sólo de pruebas y no lo ejecuta ningún run.
- Se comprueba en dos sitios: dentro del workflow (`request`/`issue`) y en el consumidor (`verify`, con la configuración **actual** de `main` recuperada por el consumidor).
- Lista vacía, entrada malformada, fichero ilegible o blobs sin entrada ⇒ BLOCKED (`WORKFLOW_REVISIONS_EMPTY`, `TRUST_CONFIG_INVALID`, `WORKFLOW_FILES_UNREADABLE`, `WORKFLOW_REVISION_UNKNOWN`). Retirar una entrada **revoca** los receipts emitidos por esa revisión.
- La configuración del commit del run **sí** se compara ya con la del consumidor (identidad de la sección anterior): ya no es un límite pendiente.
- El veredicto PASS devuelve `binding.workflowRevisionId`.

### Procedimiento para registrar la revisión (no ejecutado; no se inventa ningún SHA)

1. El humano mergea el bootstrap a `main` (merge-gate). Sea `M` el commit resultante.
2. Obtener los blobs en `M` **desde git/GitHub, no con `git hash-object` sobre el árbol de trabajo** (en Windows el árbol es CRLF; `.gitattributes` fuerza LF en el blob):
   `for p in <trustedFiles>; do git rev-parse "M:$p"; done` o `gh api "repos/jlbellonGmail/ai-native/contents/<ruta>?ref=M" --jq .sha`.
3. PR **sólo de configuración** (control plane, revisión humana) que añade a `workflow.trustedRevisions`: `{ "id": "r1-<M corto>", "files": { "<ruta>": "<blob>", … } }` con exactamente las rutas de `trustedFiles`. Esa PR no debe tocar ningún fichero de `trustedFiles`. **Cambia la identidad de la configuración**: los receipts anteriores (ninguno hoy) quedarían BLOCKED.
4. Cualquier cambio futuro en esos ficheros exige una nueva entrada; se puede retirar la anterior.
5. `node runtime/gates/plan-approval.mjs trusted-config` (sólo GET) imprime la identidad vigente de la configuración en `main` (`sourceRevision`, git blob, SHA-256, id del repositorio) para contrastarla.

## Identidad de la App y separación humano/agente

Arquitectura de identidades:

| Identidad | Quién | Función |
|---|---|---|
| Humana | `jlbellonGmail` (id 215926636) | única persona aprobadora, desde su perfil |
| Agente | GitHub App `ai-native-plan-approval` | **sólo solicita**; no es revisor del Environment |
| SO | usuario Windows estándar independiente (propuesta) | ejecuta Claude Code/Desktop, Codex CLI/Desktop, OpenCode sin acceso a la credencial humana |

**Qué se verifica de la App.** El run de un `workflow_dispatch` lanzado con un token de instalación tiene como `actor` y `triggering_actor` al usuario bot `<slug>[bot]` (`type: Bot`). El objeto run no expone el id de la App, así que la identidad se ancla en el **id numérico del usuario bot** fijado en `requester.botUserId`, y `GET /users/ai-native-plan-approval[bot]` debe devolver ese id. Un humano no puede tener un login con `[bot]`; `github-actions[bot]` tiene otro login e id. `github.actor` por sí solo no se acepta. `GET /apps/{slug}` devuelve 404 para esta clase de App, así que el id de la App no es comprobable públicamente. Quien tenga la clave privada de la App *es* la App: por eso la App no recibe permisos con capacidad de aprobar.

**Por qué `prevent_self_review` no basta.** Compara contra quien disparó el run (la App), no contra el propietario. Si la credencial `gh` del propietario está al alcance del agente, éste podría llamar a `POST …/pending_deployments` como el propietario. **Aprobar desde otro dispositivo no resuelve nada mientras el agente pueda acceder a la credencial humana**: la separación tiene que ser de credenciales, no de pantalla.

### DETECCIÓN NO ES AISLAMIENTO (hallazgo MEDIUM 4)

`check-agent-isolation` (a ejecutar **desde el perfil del agente**) **detecta** los caminos habituales hacia la identidad GitHub del propietario. **No demuestra** que un usuario Windows no pueda acceder a las credenciales de otro usuario, ni cubre cookies del navegador humano, otros almacenes o herramientas de control de escritorio. Un PASS significa «no se vio ninguno de los caminos conocidos»; nunca «imposibilidad de acceso». La frontera real es la separación de cuentas de Windows de `AGENT-HUMAN-IDENTITY-SEPARATION.md`, **no implantada**: no se modificó ninguna ACL, usuario, credencial ni WSL2.

Corrección del hallazgo (la sonda convertía salidas desconocidas en «sin credenciales»; el código antiguo tomaba `gh auth status` con salida de éxito no reconocida, o un fallo no reconocido, como lista vacía):

| Sonda | Antes | Ahora |
|---|---|---|
| Cuentas `gh` | texto de `gh auth status`, regex en inglés, varios caminos que acababan en `[]` | `gh auth status --json hosts` (JSON, sin idioma, **sin el token**; sólo `host` y `login`). Cualquier resultado no reconocido ⇒ **UNKNOWN (`null`) ⇒ BLOCKED**: error de consulta, timeout, señal, salida ≠ 0, JSON inválido, `hosts` ausente o con otra forma, entrada sin `login`. Sólo es «sin cuentas» `{"hosts":{}}` con salida 0 (captura real de gh 2.101.0 con un directorio de configuración vacío, 2026-10-30). **Cuarta corrección:** gh no instalado (`ENOENT`) **dejó de ser «sin cuentas»**: es UNKNOWN con causa `gh-not-found` (antes devolvía `[]` y, con el resto de señales vacías, el veredicto era PASS) |
| Credenciales Windows | `cmdkey /list` filtrando la etiqueta inglesa `Target:`; luego «por estructura»: cualquier bloque de una línea `* … *` valía como «vacío» (`* UNRECOGNIZED ERROR *` ⇒ PASS) | **sólo formatos reconocidos y documentados** (tabla `CMDKEY_LOCALES` de `plan-approval.mjs`): cabecera exacta, línea en blanco y EITHER el marcador de vacío exacto de ese idioma como único bloque (`* NONE *` en-US, `* NINGUNO *` es-ES) OR un bloque por credencial que empieza por las líneas Target/Type de ese idioma (`Target:`/`Type:`, `Destino:`/`Tipo:`; tras ellas puede haber `User:` y una línea de persistencia sin dos puntos, p. ej. «Se guarda solo para este inicio de sesión»). Cadenas **leídas de `cmdkey.exe.mui`** de Windows (en-US y es-ES, 2026-10-31), no recordadas. Cualquier otra cosa ⇒ **UNKNOWN ⇒ BLOCKED**: salida vacía o truncada, cabecera de otro idioma o mezclada, idioma no listado, `* UNRECOGNIZED ERROR *` o cualquier marcador distinto, marcador junto a credenciales, bloque que no es una credencial, error, señal o código ≠ 0. Para añadir un idioma hay que leer SU `cmdkey.exe.mui`; no se inventan formatos localizados. Sólo se conserva el nombre del destino de las credenciales que mencionan «github»; nunca valores (cmdkey no imprime contraseñas y la sonda no usa `--show-token`, `auth token` ni lectura de almacén) |
| Variables | nombres de `GH_TOKEN`… | igual (sólo nombres) |
| `evaluateAgentIsolation` | `null` ⇒ BLOCKED, otras formas sin validar | **toda forma ilegible** (tipos erróneos, login vacío, probe ausente) ⇒ `AGENT_PROBE_UNAVAILABLE` con detalle `UNKNOWN: …` ⇒ BLOCKED |

La causa de cada UNKNOWN viaja en `probe.unknown.{ghAccounts,credentialTargets}` y aparece en el detalle del hallazgo, sólo como palabras fijas, códigos de error, estados de salida o recuentos (`gh-not-found`, `gh-timeout`, `gh-exit-1`, `gh-json-invalid`, `gh-schema-unexpected`, `cmdkey-format-unrecognised(lines=1,blocks=2)`…): nunca texto de la herramienta (un destino o un mensaje podrían contener datos). Una lista vacía significa «consulta ejecutada con éxito y reconocida, sin nada»; ninguna ausencia de herramienta, error o salida desconocida se convierte en lista vacía.

Límites de la sonda de Windows: `cmdkey /list` no tiene pie ni recuento, así que una salida cortada **justo en un límite de bloque** no se distingue de una completa (se detecta la cortada a mitad de bloque, de cabecera o de marcador). Un Windows en un idioma no listado queda BLOCKED aunque no tenga credenciales (fail-closed deliberado hasta leer su `cmdkey.exe.mui`). El test `G12 the documented empty markers…` comprueba, donde existe el fichero, que las cadenas de la tabla son las que imprime Windows.

Límites: la forma de una entrada `gh` **con sesión** (`hosts.<host>[].login`) está tomada de la documentación y de la estructura del comando, no de una captura con credenciales (no se ejecutó contra el perfil humano); si difiriera, el resultado sería UNKNOWN ⇒ BLOCKED. Exige una versión de `gh` con `--json hosts` (2.101.0 la tiene; una anterior daría UNKNOWN). Mientras la separación no esté implantada y verificada, **G5 queda BLOCKED**.

## Environment dedicado

`ai-native-human-review` es compartido con el job `human-review` del `merge-gate` (`.github/workflows/merge-gate.yml`, intacto). Activar «prevent self-review» ahí habría impedido al propietario aprobar PRs de plano de control que él mismo abrió. Este flujo usa su propio Environment:

**`ai-native-plan-approval`** — objetivo (no creado por el Builder):
- Required reviewer: `jlbellonGmail` (único; tipo `User`).
- Prevent self-review: **habilitado** (inocuo aquí: quien dispara es la App, el revisor es el propietario).
- Allow administrators to bypass: **deshabilitado**.
- Deployment branches: *Selected branches* → **sólo `main`**.

El workflow, la configuración (`environment.name`, `id: null` hasta crearlo), el validador (`evaluateEnvironment`) y los tests están alineados. Estado real comprobado (GET): `GET environments/ai-native-plan-approval` → **404** (no existe); `ai-native-human-review` sin cambios.

## `Actions: write`: alcance real, operación a operación (hallazgo MEDIUM 5)

Fuente: tabla oficial «Permissions required for GitHub Apps» (docs.github.com/en/rest/authentication/permissions-required-for-github-apps), consultada el 2026-10-30. **La tabla se leyó con una herramienta de resumen de páginas y no se contrastó con un token real**: es la mejor evidencia disponible, no una prueba.

| Operación | Endpoint | Permiso de la App |
|---|---|---|
| Create workflow dispatch event (`workflow_dispatch`) | `POST …/actions/workflows/{id}/dispatches` | **Actions: write** |
| Leer runs y su historial de aprobación | `GET …/actions/runs`, `…/runs/{id}`, `…/runs/{id}/approvals` | Actions: read |
| Listar y Download artifact | `GET …/actions/runs/{id}/artifacts`, `…/artifacts/{id}/{formato}` | Actions: read |
| Cancel workflow run / Force cancel | `POST …/runs/{id}/cancel`, `…/force-cancel` | Actions: write |
| Re-run workflow / failed jobs / un job | `POST …/runs/{id}/rerun`, `…/rerun-failed-jobs`, `…/jobs/{id}/rerun` | Actions: write |
| Delete artifact | `DELETE …/actions/artifacts/{id}` | Actions: write |
| Delete workflow run / Delete run logs | `DELETE …/runs/{id}`, `…/runs/{id}/logs` | Actions: write |
| Habilitar / deshabilitar un workflow | `PUT …/workflows/{id}/enable`, `…/disable` | Actions: write |
| Aprobar un run de un fork | `POST …/runs/{id}/approve` | Actions: write |
| Borrar caches | `DELETE …/actions/caches`, `…/caches/{id}` | Actions: write |
| Personalización OIDC `sub` | `PUT …/actions/oidc/customization/sub` | Actions: write |
| **Aprobar un deployment** | `POST …/runs/{id}/pending_deployments` | **Deployments: write** (no Actions) y además el aprobador debe ser reviewer del Environment (sólo User/Team; la App no lo es) |
| `repository_dispatch` | `POST …/dispatches` | **Contents: write** |
| Leer el Environment que usa el consumidor | `GET …/environments/{name}` | **no confirmado**: la documentación sólo dice «read access al repositorio»; `Environments` / `Administration` no se han podido contrastar. Si faltase, `ENV_UNREADABLE` ⇒ BLOCKED |

Todo lo anterior «de Actions: write» lo obtiene la App con **un único permiso**: GitHub no ofrece un alcance por workflow ni por operación (dispatch sí, pero también cancelar, borrar, re-ejecutar…). Quedan fuera: `Secrets`, contenidos, PRs y aprobar deployments.

Alternativas evaluadas:

| Mecanismo | Permiso efectivo | Veredicto |
|---|---|---|
| `workflow_dispatch` con App | Actions: write | **Elegido.** Entrada tipada; `actor`/`triggering_actor` = la App |
| `repository_dispatch` | Contents: write | Descartado: exige permiso de escritura de contenido (peor blast radius, no mejor); no se afirma lo contrario sin demostrarlo |
| Comentario/etiqueta que dispare un workflow | Issues o Pull requests: write | No equivalente: el actor pasa a ser quien comenta, la entrada es texto no confiable y el permiso permite editar issues/PRs. Sin ganancia demostrada |
| PAT / identidad del propietario | alcance del propietario | Descartado: es la identidad humana que hay que separar |
| Quitar `workflow_dispatch` de `pilot.yml` | — | Reduce **qué se puede lanzar** (no el permiso). Decisión humana; **no** se modifica `pilot.yml` aquí |

Cambiar de mecanismo no reduce automáticamente los privilegios; la alternativa más sencilla con garantías equivalentes es mantener `workflow_dispatch` con `Actions: write`, acotado así.

### Workflows con `workflow_dispatch` (blast radius)

Hoy hay exactamente dos (un test falla si aparece otro): `plan-approval-receipt.yml` (`contents/actions/pull-requests/deployments: read`, sin `write`) y `pilot.yml` (`contents: read`; ejecuta `runtime/bootstrap/cli.mjs sync` contra la release publicada `v3.0.0-rc.2`, `docker run --network none` en Ubuntu y comprobaciones offline en Windows; sin secretos; el `GITHUB_TOKEN` es de sólo lectura). Ninguno puede escribir contenidos, publicar ni aprobar.

| Riesgo (Actions: write) | Efecto | Mitigación / límite |
|---|---|---|
| Dispatch de `pilot.yml` o del nuestro | Consumo de minutos de runner; el resultado de `pilot.yml` no se usa para decidir nada | Sin secretos ni escritura. Recomendación (humana): quitar `workflow_dispatch` de `pilot.yml` o aceptar el riesgo |
| Dispatch de nuestro workflow sobre **otra ref** (la ref aporta el fichero) | Un fichero distinto podría subir un «receipt» sin aprobación | El anclaje no son los jobs: ruta, evento, `head_branch=main`, ancestro de `main`, **blobs registrados**, configuración idéntica a `main`, `run_attempt=1`, `conclusion=success`, actor bot, y Environment sólo desplegable desde `main`. La App además no debería poder crear ramas (crear referencias exige Contents: write según la documentación; no verificado aquí) |
| Re-run por la App | Reutilizar una aprobación previa | `run_attempt == 1` en ejecución y en la verificación |
| Cancel / delete run / delete artifact / disable workflow | Denegación de servicio o pérdida del receipt | Fail-closed: sin artifact ⇒ BLOCKED; no permite falsificar |
| Delete logs, delete caches | Pérdida de trazabilidad / caché | No afecta a la decisión; el receipt es el artifact, no los logs |
| Aprobar run de fork | Ejecutar CI de un fork | Fuera de este flujo; los forks se rechazan (`PR_FROM_FORK`) |
| Personalización OIDC `sub` | Cambia el `sub` de futuros tokens OIDC | Este flujo no concede `id-token`; no se auditó el uso de OIDC en el resto de workflows del repositorio |
| Retención de artifacts (máx. 90 días) | El receipt deja de existir | Sin artifact ⇒ BLOCKED y se reemite |

**Riesgo residual**: con `Actions: write` la App (o quien tenga su clave privada) puede degradar la disponibilidad del flujo y lanzar cualquier workflow dispatchable; **no** puede falsificar un receipt ni aprobar. Restricción operativa del agente (política, **no** frontera técnica): usar la App únicamente para `POST …/workflows/plan-approval-receipt.yml/dispatches` con `ref: main`. La creación e instalación de la App exige **aprobación humana explícita** (no creada, no instalada, sin claves ni secretos).

Permisos mínimos de la App: `Actions: Read and write`, `Metadata: Read-only` (implícito). Sin `Contents`, `Pull requests`, `Deployments`, `Administration`, `Secrets`, `Environments`, `Workflows`.

## Verificaciones (todas fail-closed; cualquier hallazgo, ausencia o excepción ⇒ BLOCKED)

Dentro del workflow (`request`, y de nuevo `issue` tras la aprobación): repositorio e id; evento `workflow_dispatch`; ruta; `refs/heads/main`; commit ancestro de `main`; **blobs del workflow registrados**; **identidad de la configuración** (bytes == `main` en el commit del run, `main` no la movió); `run_attempt == 1`; actor y triggering_actor = App; solicitante ≠ revisor; PR abierto, no fusionado, base `develop`, rama `feature/acceptance-v4`, no fork, head == SHA esperado; exactamente los nueve documentos, ficheros regulares, SHA-256 de los bytes leídos por la API en el SHA exacto (no se ejecuta ni se instala nada del PR); Environment dedicado: id/nombre, `can_admins_bypass=false`, `prevent_self_review=true`, único reviewer `jlbellonGmail`/215926636, ramas sólo `main`. Tras la aprobación: mismo fingerprint que en la petición y el historial `approvals` con **una** entrada `approved` del Environment fijado, usuario `User` con login e id fijados y distinto del solicitante.

`approvalObservedAt` es el instante en que el workflow verificó la aprobación; el endpoint `approvals` no devuelve marca de tiempo, así que no es el instante del clic.

En el consumidor (`verify`): configuración recuperada de `main`, todo lo anterior vuelto a leer **ahora** (no heredado), las cuatro capas de procedencia, el historial de aprobación y el Environment vivos, y `main` y el PR leídos dos veces.

## Fechas, canonicalización y fail-closed

- `parseIsoInstant`: formato ISO 8601 estricto, fecha real, hora real, zona `Z` o `±HH:MM` válida; no se usa `Date.parse`. El esquema del receipt sólo admite UTC `Z`. Orden: `approvalObservedAt ≤ generatedAt`; `run.created_at ≤ approvalObservedAt`; el receipt no puede estar fechado en el futuro del consumidor (tolerancia de reloj de 5 min); `artifact.created_at < expires_at` y `expires_at` posterior a «ahora». El único límite temporal es la retención de GitHub.
- `canonicalJson` rechaza todo lo que no tiene forma canónica única (`undefined`, `NaN`/`Infinity`, funciones, símbolos, `bigint`, `Date`/`Map`, arrays dispersos, anidamiento excesivo/cíclico). `planSetFingerprint` valida sus campos y rechaza documentos duplicados o malformados.
- Todos los evaluadores públicos están envueltos: una excepción es `EVIDENCE_MALFORMED` (BLOCKED). `run()` captura cualquier excepción ⇒ salida distinta de 0. Los errores de API nunca se convierten en PASS.

## TOCTOU y reutilización (hallazgo HIGH 3)

**TOCTOU end-to-end: NO RESUELTO.** Qué hace hoy el código y qué falta:

| Hecho (código local + mocks) | Pendiente |
|---|---|
| El PR y la cabeza de `main` se leen **dos veces**, antes y después del resto de la evidencia; cualquier diferencia ⇒ `TOCTOU_PR_CHANGED` / `CONFIG_TIP_MOVED` | El **Coordinator consumer no existe**: nadie llama hoy al verificador antes de habilitar al Builder |
| Documentos, aprobación, Environment, run y configuración se releen en cada verificación; nada se hereda del run emisor | Una verificación vale sólo en su instante: puede haber pushes al PR entre la última verificación y la acción del Builder |
| El PASS devuelve un `binding` **congelado**, atado al `headSHA`, fingerprint, run, revisión del workflow e identidad de la configuración; `evaluateBinding` valida primero ambos bindings (propiedades propias, tipo y formato por campo; vacío, ausente, `null`, mal formado o con propiedades inesperadas ⇒ `BINDING_INCOMPLETE` / `BINDING_MALFORMED`) y después detecta cualquier cambio de identidad | Habilitar sólo para ese `headSHA`, con worktree fijado, y repetir antes de cada habilitación y de cada acción exterior |
| Reutilización sin ceremonia por tarea: el mismo receipt verifica de nuevo mientras coincidan repositorio, PR, HEAD, nueve documentos, scope, configuración, revisión del workflow, aprobador y estado; no hay consumo de un solo uso | Cerrar la ventana restante exigiría restringir pushes a la rama del PR (decisión humana) |

El contrato obligatorio del consumidor (entradas, algoritmo, evidencia `live.*`, condiciones de BLOCKED, binding, reutilización, ventana residual, pruebas de conformidad) está en `PLAN-APPROVAL-COORDINATOR-CONTRACT.md`. Un scope más ancho que el emitido ⇒ `RECEIPT_DOCUMENTS`.

## Configuración manual (no ejecutada por el Builder; cada paso requiere aprobación humana explícita)

1. **GitHub App `ai-native-plan-approval`** (Settings → Developer settings → GitHub Apps → New): webhook desactivado; sólo en esta cuenta; permisos **Actions: Read and write** + Metadata: Read-only; instalar sólo sobre `jlbellonGmail/ai-native`. La clave privada se genera y guarda en el perfil del agente (ver separación), nunca como secret del repositorio.
2. **Fijar la identidad**: `gh api 'users/ai-native-plan-approval%5Bbot%5D' --jq '{login,id,type}'` y poner `id` en `requester.botUserId` mediante PR revisada.
3. **Environment `ai-native-plan-approval`** con la configuración objetivo; leer su id (`gh api repos/jlbellonGmail/ai-native/environments/ai-native-plan-approval --jq .id`) y ponerlo en `environment.id` mediante PR revisada; verificar con `node runtime/gates/plan-approval.mjs check-environment`.
4. **Integrar el workflow en `main`** (un `workflow_dispatch` exige el fichero en la rama por defecto) y **registrar la revisión** (procedimiento arriba). Cada PR de configuración cambia la identidad de la configuración.
5. **Separar credenciales** (propuesta aparte) y comprobar `check-agent-isolation` desde el perfil del agente.
6. Implementar el Coordinator consumer según su contrato y hacer una prueba extremo a extremo con un dispatch real y una aprobación real (fuera de esta tarea).

## Riesgos pendientes

1. **Separación humano/agente no implantada** (G5 BLOCKED): sin ella, un agente con acceso a la credencial del propietario podría aprobar. Tampoco cubre herramientas de control del navegador/escritorio ejecutándose en la sesión del propietario. La sonda es detección, no aislamiento.
2. **La raíz de confianza es `main`**: el ruleset exige PR y checks pero 0 revisiones; la revisión humana del plano de control es el check `merge-gate`. Quien comprometa la cuenta del propietario, o edite el ruleset siendo administrador, controla la configuración y por tanto lo que se acepta. El código lo hace detectable (cambio de identidad ⇒ BLOCKED hasta reemitir), no imposible.
3. **Lectura del Environment desde el workflow y desde el consumidor**: `GITHUB_TOKEN` no tiene scope `environments`; el permiso fino necesario no está confirmado. Si falla, `ENV_UNREADABLE` ⇒ BLOCKED.
4. **Formas reales de la API sin probar extremo a extremo** (`approvals`, `compare`, `git/ref/heads/main`, `contents` de la configuración, `environments[].id`, entradas de `gh auth status --json` con sesión): implementadas según la documentación y validadas con mocks. Sí comprobados con GET reales: artifact (incl. `digest`, `workflow_run`), digest == SHA-256 del zip, descarga con `gh api`, estructura del zip de `upload-artifact` (volcada campo a campo y aceptada por el perfil), PR, documentos, ruleset, Environment compartido y la salida vacía de `gh auth status --json hosts`.
5. **No hay prueba de dispatch real** ni de aprobación real (prohibidas aquí). La seguridad extremo a extremo no se declara.
6. **Blast radius de `Actions: write`** (tabla): disponibilidad, no integridad; la tabla de permisos procede de la documentación oficial leída con una herramienta de resumen.
7. **Un cambio de `plan-approval.json` invalida todos los receipts** (por diseño); los cambios de configuración no se agrupan por scope.
8. **El perfil ZIP puede rechazar un formato futuro de GitHub** (fail-closed); habría que revisarlo con un nuevo volcado real.
9. **Ventana TOCTOU residual** hasta que exista y se pruebe el consumidor, e incluso entonces (contrato).
10. El informe completo de la segunda revisión de Codex **no estaba en el repositorio ni se aportó**: se trabajó con los cinco hallazgos enumerados en la orden. Si el informe contiene otros, no están cubiertos.

## Quality Gates (tercera remediación)

Estados: PASS · FAIL · BLOCKED · NOT TESTED. Evidencia: **[L]** código local · **[M]** mocks · **[G]** consulta GET real · **[X]** configuración externa pendiente · **[E2E]** extremo a extremo no realizado.

| Gate | Estado | Evidencia |
|---|---|---|
| G1 Symlink rechazado | PASS [L][M] | la reproducción de Codex (entrada marcada symlink en un ZIP por lo demás válido) lanza `not a regular file`; también a nivel de procedencia (`ARTIFACT_CONTENT_INVALID`) |
| G2 Sólo archivos regulares | PASS [L][M] | directorio, FIFO, char/block, socket, tipo desconocido/ausente, setuid/setgid/sticky, directorio/volumen/reparse DOS, sistemas creadores desconocidos |
| G3 Cabeceras ZIP coherentes | PASS [L][M][G] | nombre, flags, método, versión, CRC y tamaños local ≡ central ≡ descriptor; aceptado el ZIP real de GitHub |
| G4 Duplicados y entradas inesperadas | PASS [L][M] | `total==1`, directorio central de tamaño exacto, sin huecos/prefijo/sufijo, nombres hostiles |
| G5 Límites de tamaño y descompresión | PASS [L][M] | 1 MiB/2 MiB, ratio ≤ 50, `maxOutputLength`, CRC-32, flujo deflate exacto, truncamiento en cada posición |
| G6 Configuración confiable vinculada | PASS [L][M] · [E2E] NOT TESTED | identidad (`sourceRevision`, blob, SHA-256, repositorio, run) en el receipt, recuperada de `main` por el consumidor, `CONFIG_*` |
| G7 Ausencia de circularidad | PASS [L][M] | ningún fichero se fija a sí mismo; la configuración no está en `trustedFiles`; raíz = historial de `main` |
| G8 `sourceRevision` fuera del input fingerprint | PASS [L][M] | `planSetFingerprint` no lo lee (prueba de código y de mutación del receipt) |
| G9 Contrato TOCTOU del consumer documentado | PASS [L] documento · TOCTOU **NO RESUELTO** · [E2E] NOT TESTED | `PLAN-APPROVAL-COORDINATOR-CONTRACT.md`; prueba que lo mantiene sincronizado con `REQUIRED_EVIDENCE` |
| G10 Sonda fail-closed | PASS [L][M] · aislamiento **BLOCKED** [X] | todo resultado no reconocido ⇒ UNKNOWN ⇒ BLOCKED; sin valores; DETECCIÓN NO ES AISLAMIENTO |
| G11 `Actions: write` evaluado | PASS [L] (documental) | tabla operación a operación, alternativas, blast radius; permisos desde la doc oficial (no probados con token); App **no** creada |
| G12 Tests ZIP completos | PASS [M] | 34/34 en `plan-approval-artifact.test.mjs` (symlink, directorio, regular, FIFO/dispositivo/socket/tipo desconocido, nombre local ≠ central, flags, método, CRC, tamaños, duplicados, entrada adicional/oculta, path traversal, truncamiento en cada posición, ZIP64, data descriptor inválido, ZIP bomb, límite de tamaño, solapamiento, corrupción de cada byte); el ZIP real de GitHub se acepta |
| G13 Tests generales | PASS [M] | `node --test runtime/gates/*.test.mjs`: 193/193 (línea base de esta ronda: 135/135; receipt 97, artifact 34); mocks y fixtures, sin red |
| G14 Validadores | PASS | `node contracts/validate-contracts.mjs` PASS (21 esquemas, 7 ficheros de datos); `node runtime/docs/validate-doc-drift.mjs` PASS; `git diff --check` salida 0 |
| G15 PR #168 intacta | PASS [G] | PR #168 abierto, no fusionado, head `059714191ef9008da42d8836556d3a6736b31589` (sin cambios), `updated_at` 2026-10-30T12:19:56Z; el worktree `acceptance-v4` sigue en ese commit y no se operó en él |
| G16 Nueve documentos SDD intactos | PASS [G] | hashes en vivo idénticos a los registrados (abajo) |
| G17 Sin escrituras externas | PASS | sólo GET (`gh api`); sin dispatch, secretos, App, Environments, tags, commits, push ni PR |

Mutaciones (se aplican sobre una copia en el directorio temporal, nunca sobre el árbol de trabajo): **51/51 detectadas** (16 del lector ZIP, 16 de la configuración confiable, 9 de binding/TOCTOU/procedencia, 10 de la sonda). Primera pasada: 46/49 con 3 supervivientes, tratados así: 2 eran comprobaciones de defensa en profundidad sin prueba directa (comentario del EOCD, validación de la ref de `readConfigAt`) ⇒ se añadieron pruebas; 1 era un mutante equivalente (variable `recognised` siempre verdadera) ⇒ se eliminó el código muerto y se midieron tres mutaciones significativas en su lugar. Además, las mutaciones de **entrada** pedidas están como pruebas: symlink rechazado, ZIP inconsistente rechazado, configuración manipulada rechazada, revisión no confiable rechazada, evidencia incompleta rechazada, estado UNKNOWN rechazado, cambio de SHA invalida el binding

Evidencia de G16 (scope `acceptance-v4-plans-v1`, PR #168, head `059714191ef9008da42d8836556d3a6736b31589`, releída por API el 2026-10-30):

```text
3d0e5259cf8128799636d7a2936afc229630ff4b7ad99c30740b3d35080cf959  specs/001-dependency-graph/spec.md
96035cebe9dc0ac3dbc5cde5d412e952ff676d864f32ede48ca6b89cfa2d3e49  specs/001-dependency-graph/plan.md
b68412d3b365af8e73036da529c33946a0a8fc32af3dd5fd495a6980f4d84faf  specs/001-dependency-graph/tasks.md
0991089e2023d4559ff2056a605a779f4488c20c3e1b4725a227e7d3873fbb53  specs/002-native-acceptance/spec.md
b2a2dc27bc4385a6609c787f15e2b214833c01dd46463df55ce55a985e46f94e  specs/002-native-acceptance/plan.md
37531696fc911ffbeadf95e3ba288075d4aa9ee3c0a05621ddc1e841bf5200cb  specs/002-native-acceptance/tasks.md
553394dfd337148f45a69492310409e8e7399d163116221e1757c50ee64ed9d1  specs/003-acceptance-integration/spec.md
8934ef046c23f8a4a3e69bf6d8a516914e86acf6c9b4d2b0cb91fcf77cf6e2bb  specs/003-acceptance-integration/plan.md
09b5d8f3c23366d27db84277fce20b3ab57819d605b9e90a5753daa11fe1c8e7  specs/003-acceptance-integration/tasks.md
planSetFingerprint 3840ea3bed85e32abb918d44390b81eadd312a8fa5e733419d45e2e3edd3cd6e
```

Este fingerprint es informativo (cálculo en seco, sin aprobación); no es un receipt.

## Cuarta corrección: sonda y binding fail-closed (UNKNOWN / ERROR / MALFORMED ⇒ BLOCKED)

Tres defectos reproducidos por el Independent Reviewer tras la tercera revisión, corregidos en `plan-approval.mjs` y `plan-approval-receipt.mjs` sin tocar el lector ZIP, la configuración confiable, el fingerprint de los nueve documentos ni la exclusión de `sourceRevision`:

| Defecto | Causa raíz | Corrección |
|---|---|---|
| HIGH `gh` ausente | `probeGhAccounts` tomaba `ENOENT` como «gh no instalado ⇒ sin cuentas» y devolvía `[]`; con las demás señales vacías `evaluateAgentIsolation` no tenía nada que bloquear | `ENOENT` es UNKNOWN (`gh-not-found`), igual que cualquier error de spawn, timeout, señal, código ≠ 0, JSON inválido o esquema inesperado; la causa llega al hallazgo |
| HIGH `cmdkey` | todo bloque de una línea `* … *` se leía como «almacén vacío» | sólo el marcador exacto de un idioma documentado, como único bloque, tras la cabecera exacta de ese idioma; el resto es UNKNOWN |
| MEDIUM `evaluateBinding` | sólo comprobaba `undefined`/`null`: `""` en todos los campos pasaba y se comparaba consigo mismo | validación de ambos bindings (propiedades propias, tipo, formato, esquema cerrado) antes de comparar |
| MEDIUM `evaluateBinding` + Proxy (quinta revisión) | `readBinding` llamaba a `Object.getPrototypeOf`/`ownKeys`/descriptores sobre la entrada: un `Proxy` transparente superaba todas las comprobaciones (PASS) y sus traps se ejecutaban durante la validación. Incumplimiento del contrato de validación; no se demostró que falsifique una aprobación remota (el binding sale de `verifyReceiptProvenance`, no de un llamador externo) | `util.types.isProxy` es la primera comprobación de `readBinding`: cualquier Proxy (transparente, con traps, revocado, anidado, de función o array), en cualquiera de los dos lados, ⇒ `BINDING_MALFORMED` sin ejecutar ningún trap |

Estado: **corrección local**, sin commit. El Coordinator consumer sigue sin existir y **TOCTOU end-to-end: NO RESUELTO**. Esta corrección no implanta aislamiento humano/agente (G5 sigue BLOCKED): DETECCIÓN NO ES AISLAMIENTO. Las cifras de la tabla «Quality Gates (tercera remediación)» son históricas de esa ronda.
