# U0 con Windows Sandbox — runbook operativo

Decisión del propietario (2026-11-24): U0 se realiza con Windows Sandbox; no se
ejecuta el procedimiento de ACL masivas. Este runbook es la única vía de
arranque de sesiones de agente. Plan: `../PLAN-APPROVAL-UNBLOCK-PLAN.md` § U0.

**Qué cambia en el host:** sólo dos carpetas nuevas, `D:\agent-setup` y
`D:\agent-exchange`. Ninguna cuenta, ACL, servicio ni regla de firewall del host.

**Qué no prueba nada de esto por sí solo:** que Windows Sandbox arranque, o que
`check-agent-isolation` dé PASS, no prueba la frontera. La frontera queda
verificada sólo con `verify.ps1` en `result: PASS` y V0, V7 y V8 registrados.

## Estado al 2026-11-24 (01:30)

`D:\agent-setup` ya está preparado: artefactos de este directorio e
instaladores verificados contra sus hashes oficiales. `D:\agent-exchange`
existe y está vacía.

**BLOQUEADO — Windows Sandbox no arranca en este equipo.** La aplicación
`MicrosoftWindows.WindowsSandbox` 0.8.114.0 se aprovisionó en el primer
lanzamiento (24/11/2026 01:15:16).
- Desde entonces `WindowsSandboxRemoteSession.exe` termina con
  `System.IO.FileNotFoundException: WinRT.Runtime, Version=2.2.0.0`, aunque el
  archivo está en el paquete con esa versión.
- Ocurre igual sin `.wsb`, así que no lo causa esta configuración.
- Hay `PendingFileRenameOperations` en el registro.

Acción humana para destrabarlo, en este orden, y deteniéndose en cuanto
arranque:
1. Reiniciar Windows (completa las operaciones de archivo pendientes).
   HECHO el 24/11/2026 a las 11:20; el fallo sigue igual a las 11:35.
2. Si sigue fallando: Configuración → Aplicaciones → Aplicaciones instaladas →
   Windows Sandbox → Opciones avanzadas → **Reparar** (y, si no basta,
   **Restablecer**). Impacto: sólo la app Windows Sandbox; no tiene datos
   propios que perder (cada sesión es descartable) y no toca `D:\agent-setup`,
   `D:\agent-exchange` ni el repositorio.
3. Si sigue fallando: Microsoft Store → Biblioteca → **Obtener
   actualizaciones**, y Windows Update → buscar actualizaciones; reiniciar si
   lo pide y reintentar.
4. Si nada de lo anterior lo arregla, es un defecto de esa versión de la app
   en esta compilación de Windows: informarlo en el Centro de opiniones y
   esperar una versión nueva. Desactivar y reactivar la característica
   Windows Sandbox queda como decisión del propietario: desinstala el
   componente y requiere reinicio.

Prueba tras cada paso: abrir `C:\Windows\System32\WindowsSandbox.exe` sin
configuración. ESPERADO: aparece un escritorio de Windows limpio. Cerrarlo
antes de seguir con V0.

Para comprobar el arreglo, abrir `C:\Windows\System32\WindowsSandbox.exe` sin
`.wsb`: debe abrirse el escritorio del Sandbox; cerrarlo después. Hasta
entonces V1–V7 no se pueden ejecutar y U0 sigue **PENDING**.

## Preparación (una vez; ya hecha el 2026-11-24, repetir sólo al cambiar versiones)

[NORMAL] = PowerShell sin elevar de M7\jlbellon. Nada requiere administrador en el host.

1. Crear las carpetas: `New-Item -ItemType Directory D:\agent-setup\installers, D:\agent-exchange`.
2. Descargar a `D:\agent-setup\installers` los tres instaladores listados en
   `u0-config.json`, desde las fuentes indicadas allí. Comprobar cada hash con
   `Get-FileHash`; tiene que coincidir con el oficial (`SHASUMS256.txt` de
   Node, `digest` del asset de GitHub para Git y gh).
3. Copiar los artefactos desde **tu** clon, en un commit revisado de esta rama.
   Nunca desde algo que el agente haya escrito.
   `Copy-Item D:\proyectos\ai-native\governance\security\u0-sandbox\* D:\agent-setup\ -Exclude RUNBOOK.md`

## Cada sesión

### V0 — host, antes de lanzar ([NORMAL], M7\jlbellon)

La primera línea fija el commit revisado: la punta de `feature/acceptance-v4`
en GitHub. Antes de seguir, comprobá que es el commit que revisaste en el PR
#168.

```powershell
git -C D:\proyectos\ai-native fetch origin feature/acceptance-v4; $sha = git -C D:\proyectos\ai-native rev-parse origin/feature/acceptance-v4; $sha
foreach ($f in 'u0-sandbox.wsb','u0-config.json','setup.ps1','agent-init.ps1','verify.ps1','checkpoint.ps1','restore.ps1','CONTINUATION.md') { $a = git -C D:\proyectos\ai-native hash-object --path "governance/security/u0-sandbox/$f" "D:\agent-setup\$f"; $b = git -C D:\proyectos\ai-native rev-parse "${sha}:governance/security/u0-sandbox/$f"; "$($a -eq $b) $f" }
(Get-Content D:\agent-setup\u0-config.json -Raw | ConvertFrom-Json).installers | ForEach-Object { "$((Get-FileHash "D:\agent-setup\installers\$($_.file)" -Algorithm SHA256).Hash.ToLower() -eq $_.sha256) $($_.file)" }
Get-ChildItem D:\agent-setup -Recurse -Force | Where-Object { $_.Attributes -match 'ReparsePoint' -or ($_.PSIsContainer -eq $false -and $_.DirectoryName -eq 'D:\agent-setup' -and $_.Name -notin 'u0-sandbox.wsb','u0-config.json','setup.ps1','agent-init.ps1','verify.ps1','checkpoint.ps1','restore.ps1','CONTINUATION.md') }
Get-ChildItem -LiteralPath D:\agent-exchange -Force | Where-Object { $_.PSIsContainer -or $_.Attributes -match 'ReparsePoint|Hidden|System' -or ($_.Extension -ne '.bundle' -and $_.Name -notlike 'u0-*.json' -and $_.Name -notlike 'u0-*.log') }
```

- ESPERADO: la primera línea muestra el SHA revisado; la segunda y la tercera
  dan sólo `True`; las dos últimas no muestran nada.
- DETENER SI hay un `False`, o si aparece cualquier archivo extra o enlace. En
  ese caso no lanzar el Sandbox y no abrir la carpeta en el Explorador.

### Lanzar

`Start-Process C:\Windows\System32\WindowsSandbox.exe -ArgumentList 'D:\agent-setup\u0-sandbox.wsb'`

Usar sólo esa configuración, nunca otra `.wsb`. `setup.ps1` corre solo:
1. verifica los instaladores;
2. configura el firewall del Sandbox;
3. instala Node, Git y gh;
4. crea el usuario estándar `agent`;
5. como `agent`, clona el repositorio, instala Claude Code y ejecuta `verify.ps1`;
6. abre la ventana «U0 agent shell».

Tarda unos 5–10 minutos. El registro queda en `D:\agent-exchange\u0-setup-*.log`.

Si `D:\agent-exchange\u0-setup-*.log` termina en `SETUP FAILED` (la consola se cierra sola) o no aparece el informe de verify, cerrá
el Sandbox. Nunca ejecutes `claude` en la consola de administrador del Sandbox
(WDAGUtilityAccount).

### Verificación de la sesión

- **Automática (V1–V6 y red N1–N8):** leela *antes* de ejecutar `claude` por
  primera vez en la sesión. Después, la carpeta es escribible por el agente y
  el informe deja de valer como evidencia.
  ```powershell
  $st = (Get-ChildItem D:\agent-exchange -Filter 'u0-setup-*.log' | Sort-Object LastWriteTime -Descending | Select-Object -First 1).BaseName.Substring(9); $st
  $v = Get-Content -Raw "D:\agent-exchange\u0-verify-$st.json" | ConvertFrom-Json; $v.result; $v.checks | Where-Object { -not $_.pass } | Format-Table id,check,expected,observed
  ```
  - ESPERADO: el mismo sello en el log de setup y en el informe;
    `result` = `PASS`; ninguna fila listada.
  - DETENER SI `FAIL`: no uses la sesión; cerrá el Sandbox.
- **V7 (humano), portapapeles:** copiar un texto en el host y pegar dentro del
  Sandbox; luego copiar dentro y pegar en el host. ESPERADO: en ambos sentidos
  no se pega nada.
- **V8 (humano, host, una vez por cambio de `main`):** ejecutar sólo código de
  `main` verificado, nunca del agente:
  ```powershell
  git -C D:\proyectos\ai-native fetch origin main
  git -C D:\proyectos\ai-native worktree add --detach D:\proyectos\ai-native-mainprobe origin/main
  Set-Location D:\proyectos\ai-native-mainprobe
  node runtime/gates/plan-approval.mjs check-agent-isolation
  Set-Location D:\proyectos
  git -C D:\proyectos\ai-native worktree remove D:\proyectos\ai-native-mainprobe
  ```
  ESPERADO: `BLOCKED` (`AGENT_HUMAN_GH_ACCOUNT` y/o `AGENT_GIT_CREDENTIAL`).

**Registro de U0:** guardar la fecha, el valor de `$sha` mostrado en V0, el JSON de verify y el
resultado de V7 y V8 en `governance/execution/current/` desde tu perfil. Sin ese
registro, U0 sigue PENDING.

### Trabajo del agente

En la ventana «U0 agent shell» (usuario `agent`), ejecutar `claude`. Iniciar
sesión con **tu suscripción** en el navegador que se abre *dentro* del Sandbox,
escribiendo los datos a mano: no hay portapapeles. Pegar como primer mensaje el
texto de `C:\agent-setup\CONTINUATION.md`. Antes de cerrar el Sandbox, el
agente ejecuta `checkpoint.ps1` (el cierre descarta todo lo demás). En una
sesión nueva, `restore.ps1` recupera el último checkpoint.

Qué no conserva el checkpoint: archivos ignorados por `.gitignore`, trabajo
posterior al último checkpoint, y la distinción entre lo preparado para commit
y lo no preparado (restore lo deja todo sin preparar).

### Importar entregas (host, [NORMAL])

Repetir primero la última línea de V0: no debe mostrar nada. Después:

```powershell
$bf = (Get-ChildItem D:\agent-exchange -Filter 'ckpt-*.bundle' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName; $bf
git -C D:\proyectos\ai-native bundle verify $bf
git -C D:\proyectos\ai-native fetch $bf refs/heads/feature/acceptance-v4:refs/agent/feature/acceptance-v4
git -C D:\proyectos\ai-native log -p origin/feature/acceptance-v4..refs/agent/feature/acceptance-v4
```

- Sólo leer el diff. No hacer checkout ni ejecutar `node`, `npm` ni scripts de
  esas refs en tu perfil.
- Si aprobás el contenido, empujás vos desde tu clon. La parte sin commitear
  (`refs/checkpoint/wip`) no se importa al host.

## Recuperación (sólo por decisión humana; no destructiva)

- **Detener una sesión:** cerrar la ventana del Sandbox. Descarta el
  invitado completo: usuario `agent`, firewall, instalaciones, clon y sesión de
  Claude. No queda nada que revertir en el host.
- **Volver a trabajar como antes:** no hay cambios de permisos, cuentas ni
  firewall en el host que deshacer. Consecuencia: G5 sigue BLOCKED.
- **Retirar U0:** borrar `D:\agent-setup` y `D:\agent-exchange` es una decisión
  manual, posterior a revisar y conservar los bundles que interesen. No hay
  borrado recursivo automático en ningún script.

## Riesgos residuales (ninguno aceptado por el propietario)

| Riesgo | Mitigación | Estado |
|---|---|---|
| R1 Red hacia el host y la LAN | firewall del invitado configurado antes del agente, `agent` sin privilegios; N1–N8 lo prueban en cada sesión | PENDIENTE de la primera ejecución real |
| R2 Sesión de Claude (suscripción) en manos del agente durante la sesión | se descarta al cerrar el Sandbox; podés cerrar sesiones desde tu cuenta de Claude | PENDIENTE de decisión |
| R3/R7 Contenido hostil en `D:\agent-exchange`, incluida la fuga NTLM vía `.url`, `.lnk` o `desktop.ini` | regla de no abrir la carpeta en el Explorador; filtro de V0; sólo `git bundle` | PENDIENTE (depende de la disciplina humana) |
| R4 Escape del hipervisor o elevación de privilegios dentro del Sandbox; incluye que `agent` maneje ventanas de administrador en el mismo escritorio si UAC/UIPI no estuviera activo | setup y verify exigen `EnableLUA=1` (V1d); el resto está fuera del control de estos scripts | PENDIENTE de decisión y de la primera ejecución real |
| R6 Que `agent` pueda escribir en la carpeta mapeada de exchange (ACL del invitado no probada) | V6a2; sin escritura no hay informes ni checkpoints | PENDIENTE de la primera ejecución real |
| R8 Retorno a la LAN por la IP pública del router (hairpin NAT) | no probado; la IP pública está dentro de los rangos permitidos | PENDIENTE de decisión |
| R5 `.wsb` o scripts alterados | V0 en cada arranque; la carpeta de setup es de sólo lectura para el Sandbox | PENDIENTE de la primera ejecución real |
