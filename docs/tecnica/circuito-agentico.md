# Circuito agentico multiherramienta

El circuito tiene 5 roles: `Analyst → Reviewer → Builder → QA → Code
Reviewer`. `analyst-agent` produce `spec.md` (QUÉ+POR QUÉ), `plan.md`
(CÓMO) y `tasks.md` (desglose ejecutable trazable a cada `AC-N` de
`spec.md`) — Spec-Driven Development (SDD). `reviewer-agent` audita los
tres juntos. `builder-agent` implementa. `qa-agent` testea. Recién
después de que QA aprueba, `code-reviewer-agent` (read-only) revisa el
DIFF FINAL y produce `code-review-N.md` con el mismo formato de veredicto
que `audit-N.md`/`test-report-N.md`; un rechazo vuelve a `builder-agent`
(nunca a `analyst-agent`). Ver `AGENTS.md` seccion "Circuito" para el
detalle completo, incluido el orden numerado de pasos.

## Contexto de producto, CLARIFY y bootstrap

`analyst-agent` no depende solo de lo que el humano escribe en el pedido:
antes de escribir `spec.md` inspecciona activamente el/los item/s de
`ROADMAP.md` (con su bloque `Referencias:` opcional),
`docs/producto/contexto-producto.md` (si existe), `AGENTS.md` y
`.claude/rules/*.md`, `docs/tecnica/arquitectura.md` y otros docs
tecnicos relevantes, y el codigo/tests existentes. Aplica una precedencia
explicita de fuentes cuando dos parecen contradecirse (detalle completo
en `AGENTS.md`, seccion "Contexto de producto y bootstrap" →
"Política de fuentes y trazabilidad").

Puede inferir sin preguntar decisiones tecnicas ya establecidas
inequivocamente por codigo/arquitectura/stack/tests/ADR/reglas globales
(las declara como "Supuestos" en `spec.md`). No puede inventar decisiones
de producto, reglas de negocio, UX, seguridad, privacidad, datos,
permisos o cualquier politica con varias respuestas validas: esas pasan
por **Fase CLARIFY**, una ronda de preguntas concretas devuelta al Main
Agent (que las conversa con el humano en el chat ordinario, no en un
nuevo checkpoint formal) antes de reinvocar a `analyst-agent`. Si una
ambiguedad material queda sin resolver, `spec.md` la deja explicita en
"Decisiones pendientes bloqueantes" y `reviewer-agent` rechaza
automaticamente por ese motivo. Esto no reemplaza ni duplica el unico
HITL formal del circuito (la decision `MERGE`/`NO MERGE` sobre la PR).

`docs/producto/contexto-producto.md` es conocimiento funcional
persistente (propósito, usuarios, reglas de negocio ya adoptadas),
transversal a todas las features. Su ausencia nunca bloquea el circuito.
Se crea o actualiza de dos formas: (a) bootstrap — el humano pide
inicializar el contexto de producto, el Main Agent invoca a
`analyst-agent` (read-only) para investigar el repo y devolver un
borrador de texto (mas preguntas CLARIFY si hacen falta), y el Main Agent
mismo escribe el archivo con el borrador final, sin tocar `ROADMAP.md` ni
crear rama/PR; (b) evolucion — `builder-agent` actualiza el archivo al
cerrar una feature cuando confirma una decision de producto estable y
reutilizable, igual que ya escribe `docs/tecnica/` y `docs/usuario/`.
Ningun agente llena este archivo con contenido de negocio inventado.

## Fuente canónica

Las reglas compartidas siguen en `AGENTS.md`. La configuración que cambia
por herramienta vive en `.agentic/`:

- `.agentic/roles/*.md`: prompts funcionales canónicos (`analyst-agent`,
  `reviewer-agent`, `builder-agent`, `qa-agent`, `code-reviewer-agent`).
- `.agentic/agents.json`: descripciones, permisos, herramientas, modelos
  y esfuerzo por adaptador.
- `.agentic/models.json`: modelos permitidos, variantes y fallbacks de
  OpenCode.
- `.agentic/mcp.json`: servidores MCP canónicos del template.
- `.agentic/schemas/*.schema.json`: JSON Schema real de `agents.json`,
  `models.json` y del manifest de Milestone (`work-unit.json`),
  referenciado por `$schema` desde `agents.json`/`models.json` y validado
  en `tests/test_agentic_schemas.py`.
- `.agents/skills/`: skills Agent Skills portables.

## Adaptadores generados

No editar manualmente:

- `.claude/agents/*.md`
- `.codex/config.toml`
- `.codex/<role>.config.toml`
- `.mcp.json`
- `opencode.json`
- mirrors de skills en `.claude/skills/` y `.opencode/skills/`

Regenerar:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1
```

Validar sin escribir:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1 -Check
```

## Router OpenCode

Antes de iniciar una etapa OpenCode:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\resolve-agentic-model.ps1 `
  -Role analyst-agent `
  -Feature 01-mi-feature
```

El archivo opcional `runs/<NN>-<slug>/run.yaml` puede fijar modelo,
variante y fallback antes de que exista `spec.md`:

```yaml
execution:
  model: default
  variant: high
  fallback:
    - go
    - zen
```

El script no invoca modelos ni consulta catalogos remotos. Valida contra
`.agentic/models.json`, exige credenciales o marcas de disponibilidad del
entorno y registra evidencia en `model-routing.jsonl`.

## Gate post-HITL

La aprobacion humana de una PR no implica merge inmediato. El gate comun
vive en `scripts/complete-approved-pr.ps1` y se invoca desde
`.github/workflows/post-hitl-merge-gate.yml` cuando una review humana
aprueba una PR contra `develop`.

El gate valida que la PR siga abierta, pertenezca a `feature/<NN>-<slug>`,
apunte a `develop` y tenga `reviewDecision=APPROVED`. Luego consulta los
checks con `gh pr checks --json ...`, excluyendo el propio workflow
`Post-HITL merge gate` para no esperarse a si mismo.

Si algun check queda en `fail` o `cancel`, o si expira la espera, no hay
merge. Se escribe `runs/<NN>-<slug>/post-hitl-gate-N.md` con
`status: rejected` y feedback para que `builder-agent` corrija la rama y
el circuito continue desde implementacion/QA.

Si todos los checks relevantes quedan en verde, el gate ejecuta
`gh pr merge --merge --delete-branch`. El cierre remoto de `ROADMAP.md`
lo sigue haciendo `post-merge-close-feature.yml` mediante
`scripts/close-feature.ps1`; la limpieza local queda en manos del
reconciliador local que observa `origin/develop`.

## Troubleshooting: EDR/antivirus agresivo bloquea el reconciliador local (Windows)

**Síntoma**: `ready-for-pr.ps1` lanza
`local-feature-reconcile.ps1 -StartBackground` como proceso de
PowerShell en segundo plano (`Start-Process ... -WindowStyle Hidden`,
ver `scripts/local-feature-reconcile.ps1`). En máquinas Windows con
software de seguridad (EDR/antivirus) agresivo, ese proceso de fondo
puede quedar bloqueado, terminado abruptamente o impedido de completar
sus operaciones de archivo sobre el worktree de la feature.

**Causa**: el EDR interfiere con el proceso PowerShell que corre en
background (comportamiento típico de heurísticas que tratan procesos
`powershell.exe` sin ventana visible como sospechosos), no con git, con
GitHub Actions ni con el estado remoto de `ROADMAP.md`.

**Alcance del problema**: es exclusivamente local a la máquina del
operador. No corrompe el estado de git, no afecta el CI de la PR, ni el
gate post-HITL, ni el cierre remoto de `ROADMAP.md` en `develop` (esos
tres corren en GitHub Actions, independientes de este proceso local). El
único efecto es que el worktree/rama local de la feature puede no
limpiarse automáticamente cuando corresponde.

**Solución**: reubicar el worktree en un path nuevo, forzando la
remoción del bloqueado:

```powershell
git worktree remove --force <path-del-worktree-bloqueado>
git worktree add <path-nuevo> <rama-de-la-feature>
```

`git worktree remove --force` descarta cualquier cambio sin commitear en
ese worktree — revisar `git status` ahí antes de forzar, si el worktree
sigue siendo accesible. El estado del reconciliador
(`<git-common-dir>/feature-reconcilers/`, ver
`Get-FeatureStateDir` en `scripts/feature-contract.ps1`) vive fuera de
cualquier worktree, así que no hace falta matar el proceso bloqueado
antes de remover el worktree. Después de recrear el worktree en el path
nuevo, se puede relanzar el reconciliador corriendo de nuevo
`scripts/ready-for-pr.ps1` (o directamente
`scripts/local-feature-reconcile.ps1 -Slug <slug> -StartBackground`)
desde ahí.

**Nota — mismo síntoma bajo `pytest tests/`**: `tests/test_local_reconciler_scripts.py`
(`test_start_reconciler_in_main_checkout`, `test_start_reconciler_from_linked_worktree`,
`test_start_reconciler_replaces_stale_lock`) lanzan el mismo
`local-feature-reconcile.ps1 -StartBackground` a través de
`subprocess.run` de Python y a veces fallan con "no arranco en 60s". Se
investigó a fondo (reproducción manual fuera de pytest, con y sin
`CREATE_NO_WINDOW`, con y sin `CREATE_BREAKAWAY_FROM_JOB`, reemplazando
`Start-Process` por `Win32_Process.Create` vía WMI): el proceso hijo no
arranca lento, sino que es terminado en 1-2s de forma silenciosa
(logs vacíos, sin excepción de PowerShell) únicamente cuando el proceso
padre en la cadena es `python.exe`. La misma invocación lanzada
directamente desde una terminal (PowerShell o `bash.exe`, sin Python de
por medio) sobrevive sin problema. Esto es consistente con una
heurística de seguridad de un EDR/antivirus local específico que trata
"proceso Python lanzando PowerShell
oculto con `-EncodedCommand`" como patrón sospechoso, independientemente
de la técnica de lanzamiento usada. No es un bug del script ni de los
tests: el uso real del circuito (`ready-for-pr.ps1` corrido por un
humano o por un agente vía shell) no pasa por Python en ningún punto de
esa cadena.

El job `circuit-tests` (`ubuntu-latest`) de `.github/workflows/ci.yml`
sigue sin correr estos 7 tests: el `pytestmark` del propio archivo los
salta con `os.name != "nt"`, y ese job corre en Linux. Para no depender
únicamente de una corrida manual en una máquina Windows potencialmente
afectada por el problema de EDR descripto arriba, el job
`local-reconciler-tests` (`windows-latest`, gate obligatorio igual que
`circuit-tests`/`product-tests`, sin `continue-on-error` — ver
AGENTS.md, sección "CI/CD") corre específicamente
`pytest tests/test_local_reconciler_scripts.py` en un runner Windows
limpio de GitHub Actions, sin el EDR de terceros que causa el síntoma
descripto arriba. Si esos 7 tests aparecen en rojo corriendo `pytest`
localmente en Windows pero pasan en `local-reconciler-tests`, es este
problema conocido, no una regresión — confirmarlo comparando ambos
resultados y, si hace falta, con una corrida manual del mismo comando
fuera de `pytest`.
