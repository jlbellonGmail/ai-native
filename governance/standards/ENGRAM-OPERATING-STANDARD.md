# ENGRAM OPERATING STANDARD

Objetivo:
usar Engram como memoria operativa de continuidad para ENTERPRISE-10-10 sin
reemplazar las fuentes canonicas del programa.

Fuentes de verdad:

1. git local
2. `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`
3. `governance/SESSION-CONTEXT.md`
4. `governance/execution/archive/`

Engram es memoria auxiliar. Si Engram contradice git o governance, git y
governance ganan.

---

## Estado Verificado

Fecha de auditoria:
2026-06-16

Engram instalado:
SI

Base local:
`D:\tools-ai\engram_db\engram.db`

Base existente:
SI

Proyectos verificados:

* `ai-native`
* `enterprise-10-10`

Proyecto operativo por defecto para este workspace:
`ai-native`

Motivo:
`engram doctor --json` detecto drift entre el directorio
`D:\proyectos\ai-native` y una sesion guardada como `enterprise-10-10`.
Hasta consolidar nombres de proyecto, usar `--project ai-native` de forma
explicita para checkpoints de este workspace.

---

## Comandos Reales Verificados

```powershell
engram stats
engram projects list
engram doctor --json
engram search "<query>" --project ai-native --limit 5
engram context ai-native
engram save "<title>" "<message>" --type checkpoint --project ai-native --scope project
engram timeline <observation-id> --before 1 --after 0
engram mcp --tools=agent --project ai-native
```

Notas:

* `engram stats` reporto 31 observaciones despues de la prueba de escritura.
* `engram projects list` reporto `ai-native` y `enterprise-10-10`.
* `engram mcp --tools=agent --project ai-native` respondio a `initialize`
  por stdio con `serverInfo.name = engram` y capacidades de tools.
* La prueba MCP produjo dos errores de parseo antes del resultado correcto por
  framing del pipe PowerShell; el servidor igualmente respondio al request
  valido.
* `engram --help` indica que no existe un comando CLI dedicado para listar
  prompts; `stats` y `projects list` reportan `0 prompts`.

---

## PRE-TASK ENGRAM LOAD

Antes de ejecutar cualquier tarea `Wx-Ty`:

1. Ejecutar:

```powershell
engram stats
engram search "ENTERPRISE-10-10 <last-known-task-or-commit>" --project ai-native --limit 5
engram context ai-native
```

2. Recuperar de Engram:

* ultimo checkpoint guardado
* commits esperados
* tarea siguiente elegible
* bloqueos conocidos
* push status

3. Comparar contra:

* `git status --short`
* `git log --oneline -3`
* roadmap
* SESSION-CONTEXT
* archive

4. Regla de conflicto:

Si Engram contradice git/governance, git/governance gana. Registrar la
contradiccion como `CONTEXTUAL_NON_BLOCKING` y continuar con fuentes canonicas.

---

## POST-TASK ENGRAM SAVE

Despues de cerrar cualquier tarea `Wx-Ty`, guardar una observacion de
checkpoint:

```powershell
engram save "ENTERPRISE-10-10 <task> operational checkpoint" "<summary>" --type checkpoint --project ai-native --scope project
```

El resumen debe incluir:

* programa: ENTERPRISE-10-10
* tarea cerrada
* commits producto
* commit governance
* validaciones PASS
* proxima tarea elegible
* bloqueos
* push status
* resumen de continuidad

No guardar:

* logs completos
* diffs completos
* evidencia pesada
* conversaciones completas
* secretos

---

## ENGRAM VALIDATION

Despues de guardar:

1. Ejecutar:

```powershell
engram stats
engram search "<task> operational checkpoint" --project ai-native --limit 5
engram search "<governance-or-product-commit>" --project ai-native --limit 5
engram timeline <observation-id> --before 1 --after 0
```

2. Confirmar:

* el conteo de observaciones aumento
* la observacion aparece por titulo
* la observacion aparece por commit
* la observacion contiene proxima tarea elegible

---

## FALLBACK

Si Engram falla:

* registrar `CONTEXTUAL_NON_BLOCKING`
* no detener la tarea
* no reintentar infinitamente
* mantener continuidad desde git local, roadmap, SESSION-CONTEXT y archive

Engram no puede bloquear un cierre si las fuentes canonicas estan completas y
validadas.

---

## Evidencia De Prueba

Checkpoint guardado durante la auditoria:

```text
#31 ENTERPRISE-10-10 W5-T4 operational checkpoint
project: ai-native
type: checkpoint
scope: project
```

Contenido recuperado por `engram timeline 31 --before 1 --after 0`:

```text
Current commits: root/governance b94ac8a, ai-foundation 5345c5e,
ai-knowledge 86c229a, ai-template d233c95.
Closed tasks: W5-T1, W5-T2, W5-T3, W5-T4.
Next eligible task: W5-T5.
W5-T6+ remain open.
Push status: CONTEXTUAL_NON_BLOCKING.
```

Bloqueos detectados:

* `engram doctor --json` reporto `session_project_directory_mismatch`.
* `engram doctor --json` reporto `sync_mutation_required_fields` como bloqueo
  para sync cloud.
* Estos bloqueos no impiden memoria local CLI/MCP, pero si impiden tratar
  Engram cloud sync como operativo.
