# Separación de identidad humana y de agentes (propuesta operativa)

Estado: **PROPUESTA. No implantada.** El Builder no ha creado usuarios Windows, no ha cambiado ACL, no ha tocado credenciales ni WSL2, y no ha leído ni copiado credenciales humanas. Cada paso lo ejecuta el propietario. Complementa `PLAN-APPROVAL-RECEIPT.md` (gate G5, hoy **BLOCKED**).

## Problema

`prevent_self_review` compara contra quien dispara el run (la App), no contra el propietario. Mientras un agente pueda usar la credencial GitHub del propietario (keyring de `gh`, Git Credential Manager, variables `GH_TOKEN`, sesión de navegador), puede aprobar el deployment del Environment como él. Las instrucciones al agente no son aislamiento. Aprobar desde otro dispositivo **no** garantiza separación si el agente sigue pudiendo acceder a la credencial humana: lo que importa es qué puede leer el proceso del agente.

## Diseño (sin gasto, sin segunda identidad GitHub, sin YubiKey, sin VM/contenedor/Linux)

```text
Usuario Windows ASUS       humano. Conserva keyring, gh, navegador, WSL2, claves.   Aprueba en GitHub.
Usuario Windows ai-agent   estándar (no admin). Ejecuta TODOS los agentes.          Solo tokens de App.
GitHub                     jlbellonGmail = única persona aprobadora
                           App ai-native-plan-approval = identidad técnica del agente (solo solicita)
```

La frontera es la de Windows: el almacén de credenciales (Credential Manager/DPAPI) y el perfil `C:\Users\ASUS` no son legibles por otro usuario estándar.

### Pasos (propietario; reversibles)

1. **Crear el usuario** local estándar `ai-agent` (Configuración → Cuentas → Otros usuarios, o `net user ai-agent * /add` en terminal elevada). Sin pertenencia a Administradores; sin contraseña de administrador disponible para él (si UAC le pide credenciales de admin y las tiene, la frontera no existe).
2. **ACL mínima**, solo sobre el área de trabajo: `icacls C:\Proyectos /grant ai-agent:(OI)(CI)M`. No conceder nada sobre `C:\Users\ASUS`. Aviso: Git puede rechazar repositorios con propietario distinto («dubious ownership»); resolver con `git config --global --add safe.directory <ruta>` en el perfil que lo necesite, no ampliando permisos.
3. **Ejecutar los agentes solo como `ai-agent`**: Claude Code CLI, Claude Desktop, Codex CLI, Codex Desktop y OpenCode CLI se instalan e inician sesión *dentro* de esa cuenta (con su propia autenticación de proveedor LLM; no es una credencial de GitHub). Para escritorio, Cambio rápido de usuario; para CLI, `runas /user:%COMPUTERNAME%\ai-agent cmd` o una sesión propia. Ningún agente se lanza ya desde el perfil `ASUS`.
4. **Credenciales GitHub del perfil del agente**: ninguna cuenta humana. `gh` sin sesión (o con otra cuenta que no sea `jlbellonGmail`), sin `GH_TOKEN`/`GITHUB_TOKEN`, sin credenciales `github` en Credential Manager. El agente obtiene tokens de instalación de las Apps técnicas (≤ 1 h). La clave privada de la App `ai-native-plan-approval` vive en el perfil del agente con ACL solo para `ai-agent` (`icacls <clave.pem> /inheritance:r /grant:r ai-agent:R`) y **nunca** en secrets del repositorio. Riesgo aceptado y acotado: quien tenga esa clave *es* la App, y la App no puede aprobar (ver `Actions: write` en el documento principal).
5. **Verificar desde la sesión `ai-agent`**: `node runtime/gates/plan-approval.mjs check-agent-isolation` ⇒ `agent-isolation: PASS` (la sonda es detección, **no** aislamiento: ver abajo); `dir C:\Users\ASUS` ⇒ acceso denegado; `echo %GH_TOKEN%` vacío; `cmdkey /list` sin destinos `github`. Repetir tras cada instalación o actualización de una herramienta.
6. **Aprobar solo desde el perfil humano**: GitHub → Actions → run → *Review deployments* → `ai-native-plan-approval`. Cualquier dispositivo vale mientras la credencial humana no esté al alcance del agente.

### Reversión

`net user ai-agent /delete`, `icacls C:\Proyectos /remove ai-agent`, desinstalar/reinstalar herramientas en `ASUS`. Sin coste, sin servicios, sin mantenimiento más allá de actualizar las herramientas en dos perfiles.

## Qué cubre y qué no

| Cubre | No cubre |
|---|---|
| Keyring/`gh`/Git Credential Manager del humano; tokens en variables de entorno de otro usuario; claves en `C:\Users\ASUS`; WSL2 del humano (la distro es por usuario de Windows) | Cuenta `ai-agent` con rol de administrador o con credenciales de admin a mano |
| El agente no puede leer la sesión del navegador del humano (perfil distinto) | **Herramientas de control de navegador/escritorio** (p. ej. extensiones o «computer use») ejecutadas en la sesión del humano: pueden pulsar «Approve». No usarlas en la sesión `ASUS` mientras haya una aprobación pendiente |
| Detección de los caminos habituales con `check-agent-isolation` (nombres de variables, login de `gh`, destinos de credenciales; **detección, no aislamiento**) | Secretos que el humano deje en `C:\Proyectos` (carpeta compartida con el agente) o en WSL2 si un agente se lanza dentro de la distro del humano (`/mnt/c/Users/ASUS`) |
| Elimina la necesidad de una segunda identidad humana de GitHub | Malware/escalada local en el mismo equipo; un humano que entregue su token al agente |

## DETECCIÓN NO ES AISLAMIENTO

`check-agent-isolation` **detecta** los caminos habituales hacia la identidad GitHub del propietario desde el proceso que lo ejecuta. **No demuestra** que un usuario Windows no pueda acceder a las credenciales de otro usuario, ni cubre cookies del navegador humano, otros almacenes de credenciales o herramientas de control de escritorio. Un PASS significa «no se vio ninguno de los caminos conocidos»; nunca «imposibilidad de acceso». La frontera de seguridad es la separación de cuentas de Windows descrita arriba, que **no está implantada**.

Qué mira, sin leer jamás un valor secreto:

- Nombres de `GH_TOKEN`, `GITHUB_TOKEN`, `GH_ENTERPRISE_TOKEN`, `GITHUB_ENTERPRISE_TOKEN` si están definidas.
- Cuentas de `gh` con `gh auth status --json hosts` (salida JSON, independiente del idioma, sin el token; sólo `host` y `login`).
- Destinos de credenciales con `github` en `cmdkey /list`, reconociendo sólo los formatos documentados de los idiomas cuyo `cmdkey.exe.mui` se ha leído (en-US, es-ES; las etiquetas y el marcador de vacío están localizados: en un Windows en español `Target:` es `Destino:` y `* NONE *` es `* NINGUNO *`). Sólo se conserva el nombre del destino.

Estado desconocido ⇒ **BLOCKED**, nunca «sin credenciales»: `gh` no instalado (`ENOENT`), error de consulta, timeout, salida distinta de 0, salida no reconocida (JSON inválido o de otra forma, listado de `cmdkey` en un formato o idioma no documentado, `* UNRECOGNIZED ERROR *`, vacío, truncado) o entrada sin login son `UNKNOWN`. Sólo son «vacío» la salida real `{"hosts":{}}` de `gh` con código 0 y el marcador exacto de vacío de un idioma documentado en `cmdkey`. No se modifican ACL, usuarios ni configuración de Windows, ni WSL2.

Hasta que esta propuesta esté implantada y verificada, el sistema no debe presentar «imposibilidad de autoaprobación por agentes» como garantía.

## Decisión humana pendiente

Aprobar o modificar esta propuesta, y ejecutar los pasos 1–5. Hasta entonces G5 permanece BLOCKED y la App no debe crearse con la clave en un lugar legible por el perfil humano-agente compartido.
