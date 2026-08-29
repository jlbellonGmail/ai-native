# Arquitectura — decisiones estructurales del repositorio

`AGENTS.md` (sección "Reglas de dominio") exige que ningún backend, base
de datos, integración externa o dependencia de build se incorpore al
repositorio sin que quede como una decisión explícita en este archivo.

Este template no fija stack: arranca sin código de producto, solo con el
circuito agéntico y su motor ejecutable (`scripts/*.ps1`). Cuando el
proyecto real que use este template agregue su primera pieza de stack
(frontend, backend, base de datos, hosting, integración externa),
documentar acá:

- **Qué se agrega** y en qué archivos/carpetas.
- **Por qué ahora**: qué feature o necesidad lo dispara.
- **Por qué este enfoque y no otro**: alternativas consideradas y motivo
  del descarte.
- **Qué sigue igual**: qué partes del repo no cambian con esta decisión.

Cada decisión nueva se agrega como una sección propia (`## Decisión:
<título>`), sin reescribir ni borrar las anteriores — este documento es
un historial acumulativo de arquitectura, no un snapshot que se
sobreescribe.

## Decisión: fuente canónica agentica y router de modelos

Los roles, modelos, fallbacks y MCP del circuito se centralizan en
`.agentic/` para evitar tres copias manuales entre Claude Code, Codex y
OpenCode.

- `AGENTS.md` conserva las reglas compartidas del repo.
- `.agentic/roles/*.md` contiene la definición funcional canónica por rol.
- `.agentic/agents.json` contiene metadatos, permisos y modelos por
  herramienta.
- `.agentic/models.json` contiene el router mínimo de modelos OpenCode,
  allowlists, variantes válidas, variables de entorno esperadas y
  fallbacks autorizados.
- `.agentic/mcp.json` contiene la fuente MCP canónica. Está vacía porque
  el template no necesita servidores MCP propios todavía.
- `.agents/skills/` es la fuente canónica de skills portables; los mirrors
  en `.claude/skills/` y `.opencode/skills/` se generan si existen skills.

Los adaptadores generados son `.claude/agents/*.md`, `.codex/config.toml`,
`.codex/<role>.config.toml`, `.mcp.json` y `opencode.json`. Se regeneran
con `scripts/sync-agentic-adapters.ps1` y se validan con el mismo script
en modo `-Check`.

El router de modelos se implementa en `scripts/resolve-agentic-model.ps1`.
Resuelve el modelo antes de iniciar cada agente, usando primero una
selección explícita, luego `runs/<NN>-<slug>/run.yaml` y finalmente el
default del rol. La variante se valida separada del modelo. Los fallbacks
no son silenciosos: se registran con motivo en `model-routing.jsonl` y
OpenRouter solo se habilita si se declara explícitamente.

La decisión no introduce backend, base de datos, servicio externo nuevo ni
dependencia de build. Solo agrega configuración, scripts PowerShell y
tests del circuito.

## Decisión: validación real de JSON Schema para `.agentic/`

`.agentic/agents.json` y `.agentic/models.json` declaraban `$schema`
apuntando a `.agentic/schemas/agents.schema.json` y
`.agentic/schemas/models.schema.json`, pero ese directorio no existía:
la referencia estaba rota y ningún test validaba la forma real de esos
archivos ni la del manifest de Milestone (`work-unit.json`).

- **Qué se agrega**: `.agentic/schemas/agents.schema.json`,
  `.agentic/schemas/models.schema.json` y
  `.agentic/schemas/work-unit.schema.json` (JSON Schema Draft 2020-12
  real, no ornamental), más la dependencia de test `jsonschema` (Python,
  fijada en `requirements-dev.txt` con el mismo criterio `>=` que
  `pytest`) usada exclusivamente por
  `tests/test_agentic_schemas.py` para validar `.agentic/agents.json`,
  `.agentic/models.json` y un manifest de Milestone real contra sus
  schemas respectivos, con casos positivos y negativos por schema.
- **Por qué ahora**: la feature `01-code-reviewer-y-sdd` corrige el
  `$schema` roto detectado en auditoría y formaliza el contrato de estos
  tres archivos JSON del propio circuito agéntico.
- **Por qué este enfoque y no otro**: escribir un validador JSON Schema
  artesanal sin dependencia externa era más riesgo (reinventar un motor
  de validación) que agregar una librería de testing estándar y madura.
  `jsonschema` es tooling exclusivo de test (paralelo a `pytest`, que
  `AGENTS.md` ya exige sin pasar por este documento), no una dependencia
  de runtime de producto — este template sigue sin tener stack de
  producto propio.
  - `agents.schema.json`/`models.schema.json` permiten propiedades
    adicionales a nivel raíz de cada rol (`additionalProperties: true`)
    para no romper con campos futuros menores, pero las prohíben dentro
    de los bloques `claude`/`codex`/`opencode` (`additionalProperties:
    false`) para detectar typos reales de configuración por herramienta.
  - `work-unit.schema.json` sí es estricto en su raíz
    (`additionalProperties: false`) porque el manifest de Milestone tiene
    una forma fija y pequeña, sin campos opcionales conocidos.
- **Qué sigue igual**: ningún backend, base de datos ni servicio externo
  nuevo. Los manifests de Milestone (`work-unit.json`) no autoreferencian
  su propio schema con un campo `$schema`: la validación se ejerce solo
  desde los tests, para no tocar el formato de archivo ya cubierto por
  `test_workunit_lib.py`/`test_start_work_unit.py` ni arriesgar
  compatibilidad con un manifest ya committeado en algún Milestone en
  curso.

## Decisión: contexto de producto persistente y Fase CLARIFY en analyst-agent

`analyst-agent` dependía de que el humano repitiera en cada pedido
información que ya vivía en el repo, y no tenía forma explícita de
distinguir un supuesto técnico razonable de una decisión de negocio
inventada.

- **Qué se agrega**: `docs/producto/contexto-producto.md` (plantilla
  neutral de conocimiento funcional persistente, transversal a features,
  leída automáticamente por `analyst-agent` cuando existe); una Política
  de fuentes y trazabilidad con precedencia explícita de 7 niveles; una
  Fase CLARIFY (ronda de preguntas concretas devuelta al Main Agent antes
  de cerrar `spec.md`, resuelta en la conversación ordinaria con el
  humano, sin crear un segundo HITL formal); secciones nuevas en
  `spec.md` (`Identificación`, `Contexto y fuentes`, `Supuestos`,
  `Clarificaciones realizadas`, `Decisiones pendientes bloqueantes`); un
  gate explícito de tamaño/descomposición de Milestone (independencia,
  cohesión, alcance, capacidad de revisión, capacidad de prueba, riesgo
  de integración, tamaño del cambio) aplicado por `analyst-agent`
  (autochequeo) y auditado por `reviewer-agent`; y una regla para que
  `builder-agent` traslade a `docs/producto/contexto-producto.md` las
  decisiones de producto estables detectadas al cerrar una feature.
- **Por qué ahora**: mejorar la calidad de `spec.md` sin que cada pedido
  tenga que repetir contexto ya documentado, y sin que ninguna
  ambigüedad de negocio se resuelva por invención silenciosa de un
  agente.
- **Por qué este enfoque y no otro**: se evaluó adoptar GitHub Spec Kit
  (Specify/Clarify) como herramienta, pero se descartó por agregar una
  dependencia externa y una estructura de directorios propia que
  duplicaría el circuito ya existente de este template; en cambio se
  tomaron sus conceptos (clarificación explícita, contexto persistente)
  y se integraron directamente en `analyst-agent`/`reviewer-agent`/
  `builder-agent` y en `AGENTS.md`. Se descartó también agregar un sexto
  agente o un nuevo `MODE` operativo para el bootstrap de contexto de
  producto: como `analyst-agent` no tiene `Write` (ver
  `.agentic/agents.json`), el Main Agent escribe el archivo a partir del
  borrador que `analyst-agent` devuelve como texto, sin tocar
  `ROADMAP.md` ni crear rama/PR para esa operación.
- **Qué sigue igual**: no se agrega backend, base de datos, servicio
  externo ni dependencia de build. El único HITL formal del circuito
  sigue siendo la decisión `MERGE`/`NO MERGE` sobre la PR; Fase CLARIFY
  es conversación ordinaria entre el Main Agent y el humano, no un
  checkpoint nuevo. El formato de `ROADMAP.md` (`[ ]`/`[-]`/`[x]`, patrón
  `NN-slug`) no cambia; el bloque `Referencias:` opcional es indentado y
  no interfiere con los parsers existentes (`Get-RoadmapItemState*` en
  `scripts/workunit-lib.ps1` matchean solo la línea del ítem).

## Decisión: motor de scripts en PowerShell, plataforma primaria Windows

El motor ejecutable del circuito (`scripts/*.ps1`) está escrito en
PowerShell desde el origen del template. Esto es una decisión explícita,
no un descuido a corregir: no hay ningún plan de reescribir el motor en
otro lenguaje. Lo que sí queda documentado acá es el alcance real de su
portabilidad, porque no es uniforme entre scripts.

- **Qué se agrega**: esta sección deja constancia de la decisión y del
  estado real de compatibilidad multiplataforma, sin cambiar código.
- **Por qué PowerShell y no otro lenguaje**: PowerShell Core (`pwsh`) es
  multiplataforma (Windows, macOS, Linux) desde PowerShell 6, provee
  objetos tipados en vez de solo texto (útil para JSON de `.agentic/*`),
  y evita mezclar dos lenguajes de scripting distintos (uno para
  Windows, otro para Unix) para el mismo motor. La mayoría de los
  scripts (`sync-agentic-adapters.ps1`, `feature-contract.ps1`,
  `workunit-lib.ps1`, `start-work-unit.ps1`, `ready-for-pr.ps1` en su
  lógica principal, `wait-pr-ci.ps1`, `close-feature.ps1`,
  `resolve-agentic-model.ps1`) solo usan cmdlets estándar de PowerShell
  más `git`/`gh` como procesos externos, y corren igual bajo `pwsh` en
  Windows, macOS o Linux.
- **Excepción real y honesta**: `scripts/local-feature-reconcile.ps1`
  (el reconciliador local que limpia worktree/rama tras el cierre
  remoto de una feature, ver "Troubleshooting" en
  `docs/tecnica/circuito-agentico.md`) usa
  `Start-Process -WindowStyle Hidden` para lanzarse a sí mismo en
  background, y prioriza `powershell.exe` (Windows PowerShell 5.1) sobre
  `pwsh`, con fallback a `pwsh` si `powershell.exe` no existe.
  `scripts/complete-approved-pr.ps1` (que invoca ese mismo reconciliador
  después de un merge aprobado) todavía llama directo a `powershell.exe`
  sin ese fallback. Ninguna de las dos rutas fue validada en macOS o
  Linux.
- **Qué necesita un usuario en Mac/Linux**: instalar PowerShell 7
  (`brew install --cask powershell` en macOS, o el paquete `powershell`
  de Microsoft para `apt`/`dnf` en Linux) cubre todos los scripts salvo
  el reconciliador local. Si el reconciliador local no arranca o se
  comporta distinto en su plataforma, no bloquea el circuito: es
  limpieza de conveniencia puramente local (worktree/rama), no afecta
  CI, el gate post-HITL ni el cierre remoto de `ROADMAP.md` (los tres
  corren en GitHub Actions). La alternativa manual es
  `git worktree remove` + `git branch -d` sobre la feature ya mergeada.
- **Qué sigue igual**: no se reemplaza PowerShell por otro lenguaje. No
  se agrega backend, base de datos, servicio externo ni dependencia de
  build. Adaptar `local-feature-reconcile.ps1`/`complete-approved-pr.ps1`
  para macOS/Linux (o unificar el orden de preferencia `pwsh` vs.
  `powershell.exe` entre ambos) queda pendiente como trabajo futuro, no
  resuelto por esta decisión.
