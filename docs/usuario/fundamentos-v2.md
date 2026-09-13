# Operar la transición a v2

La Fase 00 prepara la evolución del Template desde v1.1.0. No publica v2.0.0
ni activa SDD adaptativo: el circuito Feature/Milestone actual sigue funcionando.
El archivo `ROADMAP.md` contiene las fases; los
[fundamentos técnicos](../tecnica/fundamentos-v2.md) definen compatibilidad,
estados, permisos, convergencia y métricas sin duplicarlos aquí.

## Entrada temporal para continuar

No hay todavía un comando `template run`. Dar al orquestador disponible una
instrucción como: «Retoma STATUS, verifica evidencia real y ejecuta el siguiente
ítem pendiente del ROADMAP hasta PR_READY siguiendo AGENTS y PRINCIPLES».
No hace falta autorizar por separado cada agente, test o corrección.

1. Leer STATUS, AGENTS, PRINCIPLES, ROADMAP y las referencias del ítem. Ejecutar
   `git status --short`, `git log -5 --oneline`, `git branch -vv`,
   `git worktree list` y `git fetch origin --prune --tags`. Consultar
   `gh pr list` y `gh run list`; contrastar el checkpoint con HEAD y el diff.
   No reconstruir decisiones ya documentadas ni asumir que una observación
   anterior sigue vigente.
2. Elegir la próxima unidad pendiente y limitar alcance. Fases 01–17 son
   dirección, no permiso para implementar todas a la vez. Una fase puede
   concluir con evidencia que no necesita código nuevo. Feature es el modo
   normal; Milestone requiere cohesión y gate de tamaño existentes.
3. Revisar precondiciones del script de arranque. Desde el checkout principal
   limpio y sincronizable, usar, para el primer ítem v2:

   ```powershell
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/start-work-unit.ps1 -Mode Feature -Slug 06-assess-motor-adaptativo
   ```

   `start-work-unit.ps1` exige el checkout principal y sincroniza develop; no
   ejecutarlo desde el worktree de esta chore. Si el principal está ocupado
   por cambios ajenos, preservarlos. El orquestador puede preparar aislamiento
   equivalente siguiendo las convenciones y validaciones existentes, dejando
   evidencia de la excepción al arranque automatizado; nunca borrar, mezclar
   ni hacer stash de trabajo ajeno para superar una precondición. Si no puede
   garantizar aislamiento seguro, registrar el bloqueo concreto.
4. En el worktree de la unidad, ejecutar el circuito vigente de AGENTS con
   subagentes y SDD v1. Resolver feedback automáticamente; un rechazo retorna
   al rol correspondiente, nunca a una aprobación humana rutinaria. Conservar
   intención y hallazgos en runs. La Fase 00 de gobernanza usa su expediente
   `.audit/evidence/2026-09-13-fundamentos-v2/` y el ciclo funcional autorizado.
5. Ejecutar tests relevantes del repo y validaciones reales; comprobar
   adaptadores con el comando siguiente. Repetir la verificación afectada y
   review si cambia el diff. Usar los estados y política de falta de progreso
   del diseño técnico; no declarar éxito por agotamiento de intentos.

   ```powershell
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/sync-agentic-adapters.ps1 -Check
   ```

6. Para Feature/Milestone aprobada, delegar preparación y PR al script común,
   sin recrear sus validaciones en el prompt:

   ```powershell
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/ready-for-pr.ps1 -Mode Feature -Slug 06-assess-motor-adaptativo
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/wait-pr-ci.ps1
   ```

   Para esta chore, preparar commit en español, push de la rama y PR hacia
   develop con `gh pr create`, cuerpo con aceptación, tests, review, riesgos y
   enlaces; esperar CI mediante `wait-pr-ci.ps1`. No usar ready-for-pr ni crear
   un ítem Feature ficticio para obtener su cierre automático.
7. Actualizar contexto y siguiente acción en STATUS; refrescar sólo el bloque
   observado mediante los scripts actuales:

   ```powershell
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/update-status.ps1
   pwsh -NoProfile -ExecutionPolicy Bypass -File scripts/check-status.ps1
   ```

   AUTO es una fotografía fechada. Un commit que incluye esa fotografía cambia
   HEAD: verificar Git/PR/CI reales al entregar, sin un bucle de commits para
   intentar que un archivo contenga el SHA de su propio commit.
8. Detener en PR_READY sólo con PR real, revisión aprobada y CI verde del HEAD
   publicado. El humano decide MERGE/NO MERGE. Esta PR chore se mergea desde
   GitHub por el humano; no dispara merge ni cierre Feature automático. Su
   integración se comprueba por estado MERGED de la PR. Para futuras Features,
   usar gate y cierre existentes; verificar estado remoto antes de reconciliar
   únicamente worktrees propios. Nunca publicar una release por inferencia.

Si se requiere decisión material, presentar causa, 2–3 opciones y recomendación.
Un fallo externo se informa como BLOCKED con acción mínima; un riesgo para
integridad como FAILED_SAFELY. En todos los casos preservar evidencia y actualizar
STATUS antes de devolver control. Detalles extensos quedan en el expediente;
el usuario recibe estado, fase, rama/worktree, commits, tests, Reviewer,
validaciones, PR, decisión requerida y siguiente paso.
