# Proyecto: template

## Roles canónicos (F03)

La arquitectura conceptual tiene tres roles definidos por capacidad:
**Planner** interpreta intención, consume ASSESS y planifica SDD; **Builder**
materializa cambios y evidencia sin autoaprobarse; **Reviewer** valida de forma
independiente y reúne spec review, QA y code review según riesgo. Los modelos,
proveedores y herramientas son adaptadores intercambiables. Los nombres
históricos `analyst-agent`, `qa-agent` y `code-reviewer-agent` sólo existen como
aliases de migración en el router y artefactos v1.1; no son roles canónicos.

ASSESS y `materialize-sdd.ps1` siguen siendo determinísticos: clasifican riesgo
y profundidad LIGHT/STANDARD/FULL; los roles consumen esa salida y no la
reimplementan. Formato, archivos, estados, tests, CI y lifecycle permanecen en
scripts/gates. La coordinación iterativa de convergencia pertenece a F04.

### Convergencia F04

La coordinación normal es Builder → validación determinística → Reviewer →
feedback estructurado → Builder. `scripts/convergence.ps1` consume ASSESS y
la profundidad SDD sin reclasificarlos; registra findings, progreso y un
presupuesto proporcional LIGHT/STANDARD/FULL. Builder no puede aprobarse a sí
mismo y Reviewer valida siempre el estado vigente. Planner sólo reingresa si
Reviewer marca una decisión material, ambigüedad, contradicción o cambio de
alcance; los bloqueos externos y fallos técnicos terminan de forma segura.

### Evidencia adaptativa F05

Las unidades v2 que materializan `runs/<version>/<slug>/sdd.json` usan el
contrato declarativo de `scripts/feature-contract.ps1`: SUMMARY.md es siempre
la entrada humana. LIGHT exige sólo SUMMARY y review vigente; STANDARD agrega
intención/plan, QA y documentación; FULL agrega tasks, decisión, auditoría y
validaciones reforzadas. Los artefactos no exigidos pueden no existir y nunca
se crean placeholders. La ausencia de `sdd.json` conserva el contrato legacy.
`ready-for-pr.ps1` consume la misma política; JSON/JSONL es evidencia máquina.

## Transición a v2: vigencia y dirección

Leer también [CONSTITUTION.md](CONSTITUTION.md), fuente de principios normativos.
La Fase 00 dejó el diseño técnico v2 en [fundamentos-v2](docs/tecnica/fundamentos-v2.md).
CONSTITUTION contiene los principios; ROADMAP dirige el trabajo y STATUS
resume la reentrada sin sustituir evidencia real.

El motor de cinco agentes, sus contratos y los scripts descritos abajo siguen
vigentes para Feature/Milestone. La Fase 02 agrega SDD adaptativo opt-in:
`scripts/materialize-sdd.ps1` consume la salida de ASSESS y materializa LIGHT,
STANDARD o FULL sin relajar el contrato v1. Planner/Builder/Reviewer y el
supervisor siguen siendo arquitectura objetivo; no se activan capacidades de
Fases posteriores por este texto.
Cada sustitución exige su fase, pruebas y PR; no se omiten gates v1 invocando
principios v2. El bootstrap Fase 00 es gobernanza `chore/*` y sigue el ciclo
funcional Planner → Reviewer → Builder → verificación → Reviewer autorizado
por el pedido humano, sin checkpoints humanos intermedios.

Resolver inspección, aislamiento, implementación, tests, correcciones y PR
autónomamente dentro del alcance autorizado. Escalar sólo decisiones materiales
sin evidencia, riesgos significativos, información indispensable ausente o
conflictos irresolubles; registrar el estado y la acción exacta necesaria.
Los nombres de herramientas de la configuración vigente no definen roles
conceptuales del Template. No editar adaptadores generados manualmente.

Template base para arrancar un proyecto nuevo ya con un circuito
agéntico AI-Native funcionando: analista → auditor → implementador → QA →
code reviewer, con un único punto de intervención humana (la decisión de
merge sobre la PR). No define stack de producto — eso lo decide cada
proyecto real que nazca de este template, documentándolo en
`docs/tecnica/arquitectura.md` antes de que cualquier agente asuma
tecnología no declarada.

## Stack

Sin stack fijo todavía. Este template no tiene código de producto: solo
el circuito agéntico, su motor ejecutable (`scripts/*.ps1`), sus tests y
la estructura de documentación. Cuando el proyecto real que use este
template defina su stack (frontend, backend, base de datos, hosting,
integraciones), esa decisión se documenta en
`docs/tecnica/arquitectura.md` y se refleja aquí. Hasta entonces, ningún
agente debe asumir tecnología, framework o dependencia no declarada
explícitamente.

## Estructura del repo

Las unidades nuevas pueden declarar identidad completa con
`start-work-unit.ps1 -Version v2.0.0 -Mode Feature -Slug 08-arquitectura-roles`.
Eso produce `feature/v2.0.0-08-arquitectura-roles`, el worktree
`../worktrees/v2.0.0-08-arquitectura-roles/` y el run
`runs/v2.0.0/08-arquitectura-roles/`. La omisión de `-Version` conserva la
interfaz legacy para unidades históricas.

- `runs/`: artefactos por feature (`spec.md`, `plan.md`, `tasks.md`,
  `audit-N.md`, `test-report-N.md`, `code-review-N.md`, `decision.md`, y
  cuando aplique `run.yaml` + `model-routing.jsonl`). No es código de
  producción, es historial del circuito.
- `.agentic/`: fuente canónica multiherramienta para roles, modelos,
  fallback, MCP y skills portables. Los adaptadores específicos se
  regeneran desde ahí.
- `.agents/skills/`: ubicación canónica de skills Agent Skills portables.
  Las copias requeridas por herramientas específicas se generan, no se
  editan manualmente.
- `docs/tecnica/`: un `.md` por área/feature, nombrado solo con el slug
  sin número (ej. `arquitectura.md`, no `01-arquitectura.md`), con
  decisiones de diseño y casos borde. Para quien mantiene el código.
- `docs/usuario/`: un `.md` por área/feature, mismo slug, con el
  propósito y cómo usarlo. Para quien consume o administra el producto.
- `docs/producto/contexto-producto.md`: conocimiento funcional
  persistente del producto (propósito, usuarios, reglas de negocio ya
  adoptadas), transversal a todas las features — no un artefacto por
  feature. Ver "Contexto de producto y bootstrap" más abajo. Puede no
  existir todavía (repos legacy o este mismo template): su ausencia
  nunca bloquea el circuito.
- `tests/`: pytest de los scripts del circuito (`scripts/*.ps1`). Se
  agrega `tests/` de producto (o la carpeta que el stack real defina)
  cuando exista algo real que testear — no antes.
- `scripts/`: motor ejecutable del circuito agéntico (`scripts/*.ps1`,
  ver más abajo). No hay scripts operativos de producto todavía.
- `STATUS.md`: punto de reentrada operativo en la raíz del repo — ver
  "Reentrada operativa (STATUS.md)" más abajo.

## Reentrada operativa (STATUS.md)

`STATUS.md`, en la raíz del repo, resume el estado operativo actual
(rama estable/de integración, trabajo activo, qué se hizo, qué falta,
evidencia de Git/GitHub, próximo paso exacto) para que cualquier agente o
el humano puedan retomar sin releer todo el historial.

- Todo agente debe leer `STATUS.md` + `AGENTS.md` + `ROADMAP.md` + el
  estado real de Git (`git status`, `git log`, `git branch -vv`) al
  arrancar sesión.
- Si la tarea depende de GitHub, debe verificar también PR/CI/Actions
  reales (`gh pr list`, `gh run list`), no solo lo que diga `STATUS.md`.
- Antes de finalizar, bloquearse, pedir HITL o devolver control al
  usuario, debe actualizar `STATUS.md` con el estado resultante.
- `STATUS.md` no reemplaza `ROADMAP.md`, `runs/`, Git, PR, CI ni la
  evidencia del repo — es un resumen derivado, no la fuente de verdad.
  Si `STATUS.md` contradice la evidencia real, prevalece la evidencia
  real y `STATUS.md` debe corregirse.
- Si existen ramas o worktrees activos, `STATUS.md` debe reflejarlos.
  Ramas históricas ya cerradas/mergeadas no se presentan como trabajo
  activo.

## Workflow del proyecto — circuito agéntico sin HITL intermedio

Este documento define cómo se ejecuta cualquier feature en este repo. Es
leído por todos los agentes al arrancar sesión, sea Claude Code, opencode o
Codex. No es negociable por ningún agente individual: si un agente cree que
debe saltarse un paso, debe decirlo explícitamente en su output, no
saltarlo en silencio.

El circuito tiene un solo punto de intervención humana: la decisión final
sobre la PR ya creada y con CI verde. Esa decisión es binaria: `MERGE` o
`NO MERGE`. No hay checkpoints humanos antes de crear la PR.

Cada uno de los 5 agentes corre como **subagente**, invocado puntualmente
para su etapa. Esto mantiene el contexto principal limpio: el subagente
hace su tarea, entrega su artefacto en `runs/`, y termina.

## Circuito

El contrato mínimo de artefactos vive en una sola fuente ejecutable:
`scripts/feature-contract.ps1`. Los prompts de Codex, Claude Code y
opencode pueden recordar el contrato, pero no deben duplicar validaciones:
deben invocar los scripts comunes. El contrato exige, según etapa:
`spec.md`, `plan.md`, `tasks.md`, `decision.md`, `audit-N.md`,
`test-report-N.md`, `code-review-N.md`, `docs/tecnica/<slug>.md`,
`docs/usuario/<slug>.md`, un enlace exacto en `docs/tecnica/index.md`, un
enlace exacto en `docs/usuario/index.md`, estado correcto de
`ROADMAP.md`, rama `feature/<NN>-<slug>`, PR contra `develop` y CI verde.

1. `analyst-agent` (read-only, subagente, sesión nueva) → recopila
   activamente el contexto de la work unit (ítem/s de `ROADMAP.md` y sus
   referencias opcionales, `docs/producto/contexto-producto.md` si
   existe, `AGENTS.md`/`.claude/rules/`, `docs/tecnica/arquitectura.md` y
   demás documentación técnica relevante, código y tests existentes) según
   la "Política de fuentes y trazabilidad" y aplica la "Fase CLARIFY"
   antes de cerrar la spec (ver ambas más abajo) — no depende de que el
   humano repita en el prompt información que ya está en el repo.
   Produce `spec.md` (QUÉ + POR QUÉ), `plan.md` (CÓMO: arquitectura
   afectada, componentes/contratos, compatibilidad, dependencias,
   estrategia de tests, impacto operacional) y `tasks.md` (tareas
   ejecutables y verificables, cada una trazable a un `AC-N` de
   `spec.md`) — Spec-Driven Development (SDD). El spec SIEMPRE debe
   incluir como criterios de aceptación la creación de
   `docs/tecnica/<slug>.md`, `docs/usuario/<slug>.md`,
   `runs/<NN>-<slug>/decision.md`, y enlaces exactos en
   `docs/tecnica/index.md` y `docs/usuario/index.md`.
2. `reviewer-agent` (read-only, subagente, sesión nueva) → audita
   `spec.md` + `plan.md` + `tasks.md` juntos (coherencia entre los tres y
   trazabilidad requisito→plan→tarea) y produce `audit-N.md` con
   veredicto `approved` o `rejected`. Rechaza automáticamente si el spec
   no exige los dos `.md` de documentación.
   - Si `rejected` → vuelve a 1 con el feedback. La corrección sigue en
     el circuito agéntico; no hay checkpoint humano intermedio.
3. Si `approved` → `builder-agent` (write, subagente, en worktree propio)
   → implementa el código Y escribe `docs/tecnica/<slug>.md` y
   `docs/usuario/<slug>.md` como parte de terminar la feature, no aparte.
   También crea `runs/<NN>-<slug>/decision.md` con decisiones demostrables
   desde spec/plan/tasks/auditoría/implementación, y ejecuta
   `scripts/update-doc-indexes.ps1 <NN>-<slug> "<Titulo>"`.
4. `qa-agent` (write, subagente, mismo worktree) → corre tests (pytest y
   cualquier verificación real del producto, incluida verificación manual
   reproducible cuando corresponda), verifica que el contrato común pase
   con `Assert-FeatureContract` (docs, decision, auditoría, reporte e
   índices), produce `test-report-N.md`.
   - Si falla (código o documentación faltante) → vuelve a 3 con el
     reporte. La corrección sigue en el circuito agéntico; no hay
     checkpoint humano intermedio.
5. Si QA aprueba → `code-reviewer-agent` (read-only, subagente, sesión
   nueva) → revisa el DIFF FINAL (código, tests, scripts, config, docs
   técnicas afectadas) DESPUÉS de que QA aprobó, no antes, y produce
   `code-review-N.md` con veredicto `approved` o `rejected`.
   - Si `rejected` → vuelve a 3 (`builder-agent`), nunca a
     `analyst-agent`. Si Builder tocó código o tests para resolver el
     feedback, el circuito vuelve a pasar por QA (paso 4) antes de que
     `code-reviewer-agent` reevalúe: no alcanza con reevaluar un
     `test-report-N.md` viejo que no cubrió el nuevo diff.
6. Si `code-reviewer-agent` aprueba → actualizar `ROADMAP.md` al estado
   `[-] READY_FOR_PR` para esa feature, sin marcar `[x]`, y commitear ese
   cambio en la rama de la feature. Script recomendado:
   `pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\ready-for-pr.ps1 <NN>-<slug>`.
7. Push de la rama de feature y creación automatizada de PR hacia
   `develop` (`gh pr create`). La PR debe incluir evidencias completas:
   resumen de cambios, resultados de tests, auditoría, code review,
   checklist de aceptación, riesgos y enlaces a spec/plan/tasks/docs.
8. Verificar que el CI de la PR corre en verde antes de pedir decisión
   humana. Script recomendado:
   `pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\wait-pr-ci.ps1`.
9. **Único HITL:** el humano revisa la PR y sus evidencias completas y
   decide `MERGE` o `NO MERGE`.
   - Si decide `NO MERGE` → vuelve a 3 con observaciones concretas para
     que `builder-agent` corrija la implementación o, si corresponde, la
     spec.
   - Si decide `MERGE` aprobando la PR en GitHub → se dispara el gate
     post-HITL común. Ese gate vuelve a esperar los checks de Actions
     posteriores a la aprobación y solo ejecuta el merge si están verdes.
     Script común:
     `scripts/complete-approved-pr.ps1 -Slug <NN>-<slug> -PrNumber <n>`.
     En GitHub Actions lo invoca
     `.github/workflows/post-hitl-merge-gate.yml` con código confiable de
     `develop`.
   - Si esos checks post-HITL fallan → NO se mergea. El gate produce
     `runs/<NN>-<slug>/post-hitl-gate-N.md` con veredicto `rejected`,
     comenta la PR cuando corre en GitHub Actions y vuelve a 3:
     `builder-agent` corrige con ese error, luego QA/ready-for-pr siguen
     el circuito sin pedir otro checkpoint humano.
   - Si esos checks post-HITL quedan verdes → el gate mergea la PR a
     `develop`. No se marca `[x]` antes del merge.
   - **Mecanismo de merge:** lo único que exige el único HITL es que un
     humano decida `MERGE`/`NO MERGE` sobre la PR y que esa decisión sea
     la que efectivamente ejecuta el merge — no exige un objeto GitHub
     Review con estado `APPROVED` como único mecanismo válido. En la
     práctica esto puede materializarse de dos formas: (a) el humano
     aprueba la PR con una GitHub Review, lo que dispara
     `post-hitl-merge-gate.yml` / `complete-approved-pr.ps1` como
     automatización recomendada — vuelve a esperar CI en verde
     inmediatamente antes de mergear y deja `post-hitl-gate-N.md` como
     evidencia adicional; o (b) el humano mergea la PR directamente desde
     GitHub (botón "Merge pull request") una vez que ya verificó CI verde
     y evidencias completas en el paso 8, sin pasar por esa automatización.
     Ambas formas son válidas y cumplen el único HITL: en ambas, un
     humano —nunca un agente— es quien decide y ejecuta el merge sobre
     una PR real. `complete-approved-pr.ps1` es la automatización
     disponible para el camino (a), no el único mecanismo permitido de
     merge; lo que sí es innegociable, y lo hace cumplir
     `guard-develop-branch.yml`, es que ningún commit llegue a `develop`
     fuera de una PR mergeada.
10. **Cierre automático post-merge remoto:** GitHub Actions dispara
   `.github/workflows/post-merge-close-feature.yml` cuando una PR hacia
   `develop` se cierra como mergeada. El workflow corre código confiable
   de la rama base (`develop`) e invoca la lógica común:
   `scripts/close-feature.ps1 -Slug <NN>-<slug> -PrNumber <n> -SkipLocalCleanup`.
   Este script:
   - confirma con GitHub que la PR está `MERGED` y que su base es
     `develop`;
   - cambia al checkout principal de `develop` y sincroniza con
     `origin/develop`;
   - valida que `ROADMAP.md` tenga exactamente una entrada
     `[-] <NN>-<slug>` o exactamente una entrada `[x] <NN>-<slug>` si es
     una reejecución;
   - cambia exclusivamente `[-] <NN>-<slug>` a `[x] <NN>-<slug>`;
   - commitea y pushea ese cambio directo a `develop` solo si había cierre
     pendiente;
   - valida después del push que `origin/develop:ROADMAP.md` contiene
     exactamente una entrada `[x] <NN>-<slug>` y ninguna `[-] <NN>-<slug>`;
   - en modo local, recién entonces borra el worktree y la rama local de
     la feature ya mergeada;
   - en modo GitHub Actions, omite limpieza local porque un runner remoto
     no puede borrar worktrees del equipo del usuario.

Este último paso es la única automatización que toca `develop`
directamente, y es intencional que viva fuera de cualquier worktree.
GitHub y la PR mergeada son la fuente de verdad del cierre: si la feature
no está mergeada a `develop`, `close-feature.ps1` no debe marcar `[x]`.
El cierre post-merge tiene una sola implementación común:
`scripts/close-feature.ps1`. Codex, Claude Code y opencode no duplican esa
lógica en sus directorios propios; solo deben invocar ese script.

La limpieza local es una reconciliación separada: `ready-for-pr.ps1`
inicia `scripts/local-feature-reconcile.ps1 -StartBackground`, que observa
`origin/develop:ROADMAP.md` y solo elimina worktree/rama cuando ya existe
exactamente una entrada `[x] <NN>-<slug>` y ninguna `[-]`. Si el equipo o
el agente se cierran, la próxima ejecución del circuito puede relanzar el
reconciliador; la actualización remota de `ROADMAP.md` no depende de esa
limpieza.

## Contexto de producto y bootstrap

Esta sección formaliza cómo `analyst-agent` deja de depender de que el
humano reescriba en cada pedido lo que el repo ya sabe, tomando como
referencia conceptual Spec-Driven Development (Specify/Clarify de GitHub
Spec Kit) y los principios DORA de calidad de documentación y trabajo en
lotes pequeños — sin adoptar la herramienta ni su estructura de
directorios, y sin agregar un sexto agente ni un nuevo `MODE` operativo.

### Contexto persistente de producto

`docs/producto/contexto-producto.md` es la plantilla neutral de
conocimiento funcional estable del producto (propósito, problema,
usuarios, flujos, reglas de negocio ya adoptadas, restricciones,
terminología). No es un artefacto de una feature: vive fuera de
`runs/`, se lee automáticamente y se actualiza a través del tiempo.

- `analyst-agent` lo lee siempre que exista, como una fuente más del
  contexto de la work unit.
- Si no existe (template recién clonado, o proyecto legacy que todavía no
  lo generó), `analyst-agent` no falla ni bloquea: sigue produciendo la
  spec con el resto de las fuentes disponibles y puede señalar en
  "Supuestos" que el contexto de producto todavía no está formalizado.
- Se actualiza mediante el bootstrap (ver abajo) o mediante
  `builder-agent` al cerrar una feature/milestone, cuando corresponde
  (ver "Evolución del contexto de producto").

### Bootstrap de contexto de producto

Instrucción humana mínima esperada, por ejemplo: "Inicializa el contexto
de producto de este proyecto. Analiza el repositorio existente y genera
la documentación base necesaria." No es un `MODE` nuevo del circuito ni
requiere rama, worktree ni `runs/`: es documentación transversal, igual
que hoy el humano mantiene a mano la sección "Propósito del producto" de
`ROADMAP.md`.

Flujo:

1. El Main Agent invoca `analyst-agent` (subagente read-only, sesión
   nueva) pidiéndole que investigue el repositorio (código, `docs/`,
   `ROADMAP.md`, `docs/producto/contexto-producto.md` si ya existe) y el
   pedido humano, aplicando la misma "Política de fuentes" y "Fase
   CLARIFY" que usa para una spec. Como `analyst-agent` es read-only (no
   tiene `Write`), en este modo no escribe ningún archivo: devuelve como
   texto de salida un borrador completo siguiendo la plantilla de
   `docs/producto/contexto-producto.md`, más las preguntas CLARIFY
   pendientes si las hubiera.
2. Si hay preguntas CLARIFY, el Main Agent se las hace al humano en la
   conversación normal (no es el HITL formal del circuito) y, si hace
   falta, vuelve a invocar `analyst-agent` con las respuestas.
3. El Main Agent escribe/actualiza `docs/producto/contexto-producto.md`
   con el borrador final. No inventa contenido de negocio (mismo límite
   que el resto del circuito, ver "Reglas de dominio").
4. No se toca `ROADMAP.md` ni se crea PR: el bootstrap es documentación
   compartida, no una feature.

### Política de fuentes y trazabilidad

`analyst-agent` distingue explícitamente, en todo momento: hechos
verificados, decisiones de producto existentes, restricciones existentes,
supuestos razonables, ambigüedades materiales y decisiones no deducibles.
Cuando dos fuentes autoritativas se contradicen de un modo que afecta el
comportamiento esperado, no elige arbitrariamente: lo trata como
ambigüedad material (ver Fase CLARIFY).

Precedencia de fuentes, de mayor a menor autoridad:

1. Instrucción o clarificación humana vigente (incluidas las respuestas
   de una ronda CLARIFY de esta misma work unit).
2. Reglas globales del proyecto (`AGENTS.md`, `.claude/rules/`).
3. Ítem/s de `ROADMAP.md` seleccionados y sus referencias opcionales.
4. `docs/producto/contexto-producto.md`.
5. Arquitectura / ADR / documentación técnica relevante
   (`docs/tecnica/arquitectura.md` y afines).
6. Código y tests existentes.
7. Supuestos explícitos del propio `analyst-agent` (último recurso,
   siempre declarados en "Supuestos" de `spec.md`).

Qué puede inferir sin preguntar (y debe declarar como supuesto cuando
corresponda): decisiones técnicas o convenciones ya establecidas
inequívocamente por código, arquitectura, stack, tests, ADR, reglas
globales o patrones existentes.

Qué NO puede inventar bajo ninguna circunstancia: decisiones materiales
sobre comportamiento de producto, reglas de negocio, experiencia de
usuario, seguridad, privacidad, cumplimiento, datos, permisos, resultados
funcionales, o cualquier política que admita varias decisiones válidas
distintas. Eso siempre pasa por Fase CLARIFY.

### Fase CLARIFY

Equivalente conceptual a `clarify` de Spec-Driven Development, sin
convertirse en un nuevo HITL formal del circuito (el único HITL formal
sigue siendo la decisión `MERGE`/`NO MERGE` sobre la PR, paso 9).

`analyst-agent` corre como subagente sin canal directo con el humano, así
que la clarificación ocurre en la conversación ordinaria entre el humano
y el Main Agent, antes de que `spec.md` quede cerrado:

1. `analyst-agent` recopila el contexto disponible (ver Política de
   fuentes) y detecta huecos.
2. Si el hueco se resuelve con evidencia existente (código, arquitectura,
   ADR, reglas globales, patrones), lo resuelve como supuesto explícito y
   sigue.
3. Si no se resuelve con evidencia y la ambigüedad es material (ver
   arriba qué NO puede inventar), en vez de una `spec.md` cerrada,
   devuelve al Main Agent una lista corta de preguntas concretas,
   orientadas a una decisión puntual — nunca preguntas abiertas ni
   genéricas.
4. El Main Agent traslada esas preguntas al humano en la conversación
   normal (no crea artefactos nuevos en `runs/` para esto), y reinvoca a
   `analyst-agent` con las respuestas ya incorporadas al contexto.
5. `spec.md` registra el resultado en "Clarificaciones realizadas"
   (pregunta + respuesta) y, si quedara alguna ambigüedad material sin
   resolver todavía, la deja explícita en "Decisiones pendientes
   bloqueantes" — `reviewer-agent` rechaza automáticamente cualquier spec
   con esa sección no vacía.

Este flujo aplica igual para Feature y Milestone, y también para el
bootstrap de contexto de producto descripto arriba.

### Evolución del contexto de producto

Al cerrar una feature o milestone, si una decisión tomada durante el
trabajo es específica de esa work unit, queda en su `spec.md`/
`decision.md`, no en `docs/producto/contexto-producto.md`. Si en cambio
es conocimiento estable y reutilizable del producto (por ejemplo, una
regla de negocio nueva que el negocio real confirmó), `builder-agent` la
refleja en `docs/producto/contexto-producto.md` como parte de terminar la
feature — mismo criterio que ya aplica hoy a `docs/tecnica/<slug>.md` y
`docs/usuario/<slug>.md`: no es un paso aparte ni opcional cuando
corresponde, y nunca inventa contenido de negocio no confirmado.

## Retornos permitidos

- `reviewer-agent` → `analyst-agent` cuando el spec es `rejected`.
- `qa-agent` → `builder-agent` cuando QA falla.
- `code-reviewer-agent` → `builder-agent` cuando el code review es
  `rejected`.
- `HITL final` → `builder-agent` cuando la decisión es `NO MERGE`.

Cualquier otro retorno o pedido de intervención humana rompe el circuito y
debe declararse como excepción, no ejecutarse en silencio.

## Estados de ROADMAP.md

- `[ ]` pendiente: la feature no está cerrada.
- `[-]` `READY_FOR_PR`: implementación, documentación y QA aprobados; la
  PR existe o está lista para crearse; CI pendiente o verde; falta decisión
  final de merge.
- `[x]` completado: solo después de que la PR fue mergeada a `develop` y
  el cierre post-merge marcó el roadmap automáticamente.

Regla dura: `ROADMAP.md` no se marca `[x]` antes del merge. Antes del
merge solo puede quedar pendiente `[ ]` o `READY_FOR_PR` `[-]`.

`ROADMAP.md` sigue siendo un mapa, no una spec: cada ítem es una línea
`NN-slug — descripción funcional suficientemente útil`. Opcionalmente
puede llevar, en líneas indentadas debajo (nunca exigido para todos los
ítems), un bloque `Referencias:` con rutas a documentación especialmente
relevante para esa work unit — ver `ROADMAP.md` para el formato exacto.
Esas líneas no empiezan con `- [ ]`/`- [-]`/`- [x]`, así que no
interfieren con los parsers de estado (`Get-RoadmapItemState*` en
`scripts/workunit-lib.ps1` matchean solo la línea del ítem, no las
siguientes). `analyst-agent` lee `docs/producto/contexto-producto.md`
automáticamente sin que haga falta declararlo como referencia; las
referencias explícitas son solo para precisión adicional cuando aplica.

## Modo MILESTONE

El circuito descripto arriba (pasos 1-9) es el modo `Feature`: un item de
`ROADMAP.md`, una rama `feature/<NN>-<slug>`, un `runs/<NN>-<slug>/`. Es
el modo por defecto y sigue siendo el camino normal para la enorme
mayoria de cambios.

`Modo MILESTONE` es una variante del mismo circuito, no un circuito
paralelo, pensada para un grupo pequeño de items de `ROADMAP.md` que
forman UN solo incremento funcional coherente y que conviene revisar,
mergear y cerrar como unidad atomica (por ejemplo: varios items que
serian inconsistentes o inutiles a medio terminar por separado). No es un
mecanismo para acumular cambios sin relacion real entre si ni para
esquivar el circuito por feature — el `reviewer-agent` rechaza
automaticamente un Milestone cuyos items podrian shippearse como
Features independientes sin perder valor.

**Gate de tamaño/descomposición:** antes de aprobar la spec de un
Milestone, `analyst-agent` (al proponerlo) y `reviewer-agent` (al
auditarlo) evalúan explícitamente independencia entre items, cohesión
funcional real del grupo, claridad de alcance, capacidad de revisión
humana en una sola pasada, capacidad de prueba como unidad, riesgo de
integración entre items y tamaño del cambio resultante — no una métrica
arbitraria de líneas de código, sino la capacidad real de comprender,
probar, revisar e integrar el cambio como unidad. Si el Milestone
resultaría excesivamente grande o los items no son realmente
interdependientes, `analyst-agent` debe proponer dividirlo en unidades
más pequeñas (Features independientes, o Milestones más chicos) en vez
de forzar una única mega-spec.

La abstraccion comun a ambos modos es el **WorkUnit**
(`scripts/workunit-lib.ps1`, funcion `Get-WorkUnitInfo -Mode Feature` o
`-Mode Milestone`). Un Milestone se identifica por un manifest
`runs/milestone-<slug>/work-unit.json` (JSON con `schemaVersion`, `mode`,
`slug` y la lista `items` de slugs de `ROADMAP.md`). El slug del
Milestone en si NO lleva prefijo numerico (no es un item de
`ROADMAP.md`); los slugs dentro de `items` si son items normales
`NN-slug`.

Diferencias concretas frente a Feature:

- **Arranque:** `scripts/start-work-unit.ps1 -Mode Milestone -Slug
  <slug-milestone> -Items <NN-item-a>,<NN-item-b>,...` valida que todos
  los items esten pendientes `[ ]` en `ROADMAP.md`, que ninguno este ya
  reclamado por otro Milestone abierto ni por una rama `feature/<item>`
  viva, crea la rama `milestone/<slug-milestone>` y su worktree, y
  commitea el manifest inicial. Para Feature, el mismo script (`-Mode
  Feature -Slug <NN-slug>`, sin `-Items`) reemplaza el arranque manual
  equivalente.
- **Spec/plan/tasks/auditoria/QA/code review:** un unico `spec.md`,
  `plan.md`, `tasks.md`, `audit-N.md`, `test-report-N.md` y
  `code-review-N.md` por Milestone (en `runs/milestone-<slug>/`), pero
  cada uno debe atender a TODOS los items del manifest individualmente:
  criterios de aceptacion, casos borde y el par `docs/tecnica/<item>.md`
  + `docs/usuario/<item>.md` son por item, no genericos para el grupo.
  `runs/milestone-<slug>/decision.md` es unico para todo el work unit.
- **Contrato:** `Assert-WorkUnitContract -Mode Milestone` (en
  `scripts/feature-contract.ps1`, que ahora dot-sourcea
  `scripts/workunit-lib.ps1`) reemplaza a `Assert-FeatureContract`:
  valida el manifest, el spec/plan/tasks/decision/audit/test-report/
  code-review a nivel de work unit, y docs+indices de cada item.
- **READY_FOR_PR:** `scripts/ready-for-pr.ps1 -Mode Milestone -Slug
  <slug-milestone>` pasa TODOS los items de `[ ]` a `[-]` en un unico
  commit, todo o nada: si un solo item no esta pendiente, no se modifica
  ROADMAP.md y el script falla con el detalle exacto de que item bloquea
  la transicion (`Assert-RoadmapItemsTransition`).
- **Cierre post-merge:** `scripts/close-feature.ps1 -Mode Milestone`
  hace la misma transicion atomica pero de `[-]` a `[x]` para todos los
  items en un unico commit. Una reejecucion cuando todos los items ya
  estan `[x]` es un no-op seguro, igual que en Feature. Un estado
  mezclado (algunos items `[x]`, otros no) es un estado irrecuperable
  automaticamente — no deberia ocurrir dado que la escritura es atomica,
  pero si ocurre el script se niega a "terminar" el cierre en silencio y
  exige intervencion manual sobre `ROADMAP.md`.
- **Reconciliador local:** `scripts/local-feature-reconcile.ps1 -Mode
  Milestone` solo limpia worktree/rama cuando TODOS los items del
  manifest figuran `[x]` en `origin/develop:ROADMAP.md`.
- **Rama y PR:** `milestone/<slug-milestone>` en vez de
  `feature/<NN>-<slug>`. La PR generada por `ready-for-pr.ps1` lista
  cada item incluido con su evidencia. Los workflows
  `post-hitl-merge-gate.yml` y `post-merge-close-feature.yml` derivan el
  modo (`Feature` o `Milestone`) del prefijo de la rama (`feature/` vs
  `milestone/`) y pasan `-Mode` al script correspondiente
  automaticamente; el humano no elige el modo a mano en GitHub.

Todo lo demas del circuito (unico HITL, `NO MERGE` vuelve a
`builder-agent`, `ROADMAP.md` nunca se marca `[x]` antes del merge, etc.)
aplica igual en Milestone que en Feature.

## Git

El ciclo de vida de las ramas de este repositorio tiene dos etapas
estables: el **estado inicial del template** (antes de la primera
release) y el **estado posterior a la primera release**. Ambas son
comportamiento correcto y esperado del template — no una etapa
"provisional" que haya que resolver. La sección "Primera release y
creación de `main`" describe el evento que conecta una etapa con la
otra.

### Estado inicial del template

- `develop` es la rama de integración y de trabajo diario. El circuito
  de features/milestones opera enteramente sobre ella desde el momento
  en que se adopta el template.
- `main` puede no existir todavía: su creación está condicionada a que
  el humano apruebe una primera release, evento descrito abajo. Un
  template (o un proyecto real nacido de él) sin releases aprobadas
  aún, y por lo tanto sin rama `main`, cumple correctamente su
  contrato — no es un defecto ni un paso de adopción incompleto.
- Cada feature: `feature/<NN>-<slug>`, en su propio `git worktree` bajo
  `../worktrees/<slug>/` — esto habilita correr varios circuitos en
  paralelo sin pisarse.
- Nunca commitear directo a `develop` (salvo el cierre automatizado de
  `ROADMAP.md`, ver paso 9, y salvo el revert/restauración automática de
  `.github/workflows/guard-develop-branch.yml` cuando detecta un push
  directo no permitido — ver "Setup manual", "Limitación conocida
  verificada en este repositorio").
- La PR hacia `develop` se crea automáticamente después de QA aprobado.
- El humano no abre la PR ni hace checkpoints previos: solo decide
  `MERGE` o `NO MERGE` con la PR y sus evidencias a la vista.

### Ramas `chore/*` (fuera del circuito SDD)

`feature/<NN>-<slug>` y `milestone/<slug>` son las ramas del circuito
SDD descrito en "Workflow del proyecto": existen porque hay un ítem de
`ROADMAP.md` detrás. `chore/<slug-descriptivo>` es la convención para
trabajo de gobernanza del propio repositorio que no nace de un ítem de
`ROADMAP.md` — por ejemplo, remediación de hallazgos de auditoría sobre
`.audit/`, ajustes al propio circuito agéntico (`AGENTS.md`,
`.agentic/`, `scripts/*.ps1`) o mantenimiento de CI/CD. El nombre exacto
después de `chore/` es libre y descriptivo (sin el prefijo `NN-` de
`ROADMAP.md`, porque no referencia un ítem del backlog).

Por qué queda fuera del circuito de 5 agentes: "Workflow del proyecto"
dice explícitamente *"esto define cómo se ejecuta cualquier feature en
este repo"* y todo el circuito está indexado por ítems de `ROADMAP.md`
(`spec.md`/`plan.md`/`tasks.md`/`audit-N.md`/`test-report-N.md`/
`code-review-N.md` en `runs/<NN>-<slug>/`). Una rama `chore/*` no tiene
ítem de `ROADMAP.md` que indexar, así que no genera esos artefactos ni
pasa por `analyst-agent`/`reviewer-agent`/`builder-agent`/`qa-agent`/
`code-reviewer-agent`.

Lo que sí sigue aplicando sin excepción a `chore/*`, porque no depende
del circuito SDD sino del enforcement general de la rama `develop` (ver
"Estado inicial del template" arriba): el cambio llega a `develop`
exclusivamente vía PR — nunca con push directo, protegido por
`guard-develop-branch.yml` igual que cualquier otra rama — y el único
HITL sigue siendo el humano quien decide y ejecuta el merge (ver paso 9
de "Workflow del proyecto" y su bullet "Mecanismo de merge").

Coherencia con los gates automatizados: `post-hitl-merge-gate.yml` y
`post-merge-close-feature.yml` reconocen únicamente `^feature/NN-slug$`
y `^milestone/slug$` por diseño — para `chore/*` (o cualquier otra rama
que no matchee ese patrón) ambos workflows detectan que no aplica y
terminan sin ejecutar merge automático ni cierre automático de
`ROADMAP.md`, dejándolo explícito en su log. No es una condición de
fallo: es el comportamiento esperado para una rama que nunca tuvo un
ítem de `ROADMAP.md` que cerrar. En consecuencia, una PR `chore/*` la
mergea el humano directamente desde GitHub, y si esa PR llegara a tocar
`ROADMAP.md` (no es su propósito habitual), esa actualización también
queda a cargo del humano, no de la automatización.

### Primera release y creación de `main`

`main` se crea una única vez, exclusivamente cuando el humano decide y
aprueba una release del proyecto real (no en cada feature, no
automáticamente, y ningún agente del circuito la crea ni decide
cuándo hacerlo). Es un evento manual, con esta secuencia:

1. El humano identifica el commit exacto de `develop` que aprueba como
   release.
2. Se crea la rama `main` a partir de ese commit exacto.
3. Se publica/pushea `main` al remoto por primera vez.
4. A partir de ese momento rige el "Estado posterior a la primera
   release" (abajo).

### Estado posterior a la primera release

- `main` es la rama estable de producción: recibe únicamente releases
  aprobadas desde `develop` vía PR. Nunca se trabaja directamente sobre
  `main`, con el mismo criterio que ya rige para `develop` en la etapa
  inicial.
- Nunca commitear directo a `main`, con el mismo mecanismo de
  enforcement que protege a `develop` (ver "Setup manual").
- `develop` sigue siendo la rama de integración y de trabajo diario
  para toda feature/milestone nueva; las releases hacia `main` son un
  evento posterior y separado, no un reemplazo del flujo por feature.

## Versionado (tags)

- Cada release se marca con un tag `vX.Y.Z` (SemVer: major.minor.patch)
  sobre `main`, pusheado por el humano en el mismo evento que crea o
  actualiza `main` (`git tag vX.Y.Z && git push origin vX.Y.Z`) — ver
  "Git", sección "Primera release y creación de `main`".
- Los agentes nunca crean tags — es una decisión exclusivamente humana,
  en el momento de cada release.
- El primer tag de release del producto se crea junto con la primera
  release, en el mismo evento que crea `main`. En el estado inicial del
  template (ver "Git", sección "Estado inicial del template"), antes de
  la primera release, no hay ningún tag de release del producto — es la
  misma etapa descrita ahí para `main`, no un caso aparte. Esto no
  incluye tags/releases propios del framework `.audit/` (por ejemplo
  `audit-framework-vX.Y.Z`), que ese framework versiona de forma
  independiente y están fuera del alcance de esta sección.
- El mecanismo de despliegue (si el proyecto real lo define) depende del
  hosting elegido; documentarlo como decisión explícita en
  `docs/tecnica/arquitectura.md` cuando exista.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): declara tres jobs top-level,
  todos disparados por los mismos triggers (`push`/`pull_request` a
  `develop` y `main`) y los tres **gate obligatorio con el mismo nivel
  de exigencia** antes de mergear cualquier PR (paso 7 del circuito) —
  para `circuit-tests`/`product-tests` es decisión confirmada por el
  humano en Fase CLARIFY (ver `runs/v1.1.0/04-ci-wiring-product-tests/spec.md`,
  sección "Clarificaciones realizadas"); para `local-reconciler-tests`
  es decisión explícita del humano al cerrar F-003 de la reauditoría
  final v1.1 (ningún `continue-on-error` ni mecanismo equivalente que
  convierta un fallo real en éxito aparente):
  - **`circuit-tests`** (`ubuntu-latest`): corre `pytest` sobre `tests/`
    (tests del circuito agéntico). Es el job que antes se llamaba
    `test`; cualquier branch protection configurada con ese nombre viejo
    debe actualizarse a `circuit-tests`.
  - **`product-tests`** (`ubuntu-latest`): placeholder deliberado
    mientras este template no tenga stack de producto propio. Contiene
    un marcador explícito en el propio `ci.yml` que referencia
    `docs/tecnica/arquitectura.md` como el lugar donde documentar el
    stack real antes de reemplazar ese placeholder por los pasos reales
    de build/test. Se mantiene como check requerido desde ya (aunque hoy
    solo corra un `echo`) para que branch protection no tenga que
    actualizarse el día que el stack real llegue.
  - **`local-reconciler-tests`** (`windows-latest`): corre
    específicamente `tests/test_local_reconciler_scripts.py` (el
    `pytestmark` de ese archivo lo salta en `circuit-tests` porque
    ejercita `Start-Process -WindowStyle Hidden` de PowerShell 5.1
    Desktop, mecanismo Windows-only). Si esa suite falla, el job queda
    rojo y bloquea el merge igual que `circuit-tests`/`product-tests`;
    no tiene `continue-on-error` ni ningún otro mecanismo que oculte un
    fallo real. Da evidencia ejecutable real, verificable por un
    tercero desde la pestaña Actions, de que esa suite pasa en un
    entorno Windows limpio sin depender de que un operador la corra
    localmente en una máquina con EDR/antivirus agresivo (ver
    `docs/tecnica/circuito-agentico.md`, sección "Troubleshooting:
    EDR/antivirus agresivo bloquea el reconciliador local (Windows)").
- **Docs** (`.github/workflows/docs.yml`): se dispara al pushear a `main`
  con cambios en `docs/` o `mkdocs.yml`. Publica el sitio MkDocs a GitHub
  Pages. Público, sin gate por ahora. Sigue el mismo ciclo de vida
  definido en "Git": en el estado inicial del template, antes de que
  exista `main`, este workflow no tiene ningún evento que lo dispare —
  es la misma etapa descrita ahí, no un caso aparte. Queda operativo
  desde la primera release que publique `main` con cambios en
  `docs/`/`mkdocs.yml`, siempre que además esté completada la
  configuración manual de GitHub Pages (ver "Setup manual").
- **Post-merge close** (`.github/workflows/post-merge-close-feature.yml`):
  ver paso 9 del circuito.
- **Post-HITL merge gate**
  (`.github/workflows/post-hitl-merge-gate.yml`): se dispara cuando el
  humano aprueba la PR hacia `develop` (`pull_request_review: submitted`)
  y tambien cada vez que se pushea un commit nuevo a una PR ya abierta
  (`pull_request: synchronize`) — esto ultimo permite que, si Builder
  corrige una PR cuyos checks post-HITL habian fallado, el gate se
  reintente solo, sin pedir una segunda aprobación humana (violaría
  "único HITL"). El gateo real de si la PR sigue aprobada lo hace
  `scripts/complete-approved-pr.ps1` consultando `gh pr view` en vivo, no
  el evento de GitHub. Invoca `scripts/complete-approved-pr.ps1`, espera
  checks post-aprobación, mergea solo si están verdes y devuelve feedback
  a builder si fallan. Es la automatización recomendada para ejecutar el
  merge después de una GitHub Review de aprobación — no es el único
  mecanismo de merge permitido por el único HITL (ver paso 9, bullet
  "Mecanismo de merge"): si el humano mergea directamente desde GitHub,
  este workflow simplemente no tiene evento que lo dispare.
- **Release**: pendiente (ver sección Versionado). No hay `Dockerfile` ni
  `release.yml` todavía — se agregan cuando el stack real los requiera.

## Herramientas locales requeridas

- PowerShell 7 (`pwsh`) para los scripts de automatización en
  `scripts/*.ps1` — intérprete canónico del proyecto, consistente con
  `README.md` y con `ci.yml`. Excepción: el reconciliador local
  (`scripts/local-feature-reconcile.ps1`) usa `Start-Process
  -WindowStyle Hidden` y en un punto llama directo a `powershell.exe`
  (Windows PowerShell 5.1 Desktop); esa es una dependencia Windows-only
  explícita, no el intérprete general del proyecto — ver "Compatibilidad
  de plataforma" en `README.md`.
- Git (`git`) para ramas, worktrees, commits, push y verificación de merge.
- GitHub CLI (`gh`) instalado, en `PATH` y autenticado para crear PRs,
  consultar estado de PR mergeada y esperar checks de CI.
- Python 3.12+ con `pytest` instalado (`pip install -r requirements-dev.txt`)
  para correr los tests del circuito.

## Artefactos

Cada ciclo de feature genera su carpeta en `runs/<NN>-<slug>/` con:

- `spec.md` (QUÉ + POR QUÉ)
- `plan.md` (CÓMO: arquitectura, componentes/contratos, compatibilidad,
  dependencias, estrategia de tests, impacto operacional)
- `tasks.md` (tareas ejecutables y verificables, cada una trazable a un
  `AC-N` de `spec.md`)
- `audit-N.md` (uno por intento del reviewer-agent, sobre spec+plan+tasks)
- `test-report-N.md` (uno por intento del qa-agent)
- `code-review-N.md` (uno por intento del code-reviewer-agent, sobre el
  diff final después de que QA aprueba)
- `decision.md` (archivo canónico obligatorio con decisiones demostrables;
  no afirma aprobación de merge — esa aprobación es exclusivamente del
  HITL vía GitHub — y no debe quedar vacío ni ornamental)
- `post-hitl-gate-N.md` (cuando el gate posterior a la aprobación humana
  necesita dejar evidencia de merge aprobado o feedback automático para
  builder si Actions falla después del HITL)

Ningún agente sobreescribe el artefacto de otro. Cada intento se numera.
El número y slug de cada feature sale de `ROADMAP.md`.

## Formato de veredicto

`reviewer-agent` (produce `audit-N.md`), `qa-agent` (produce
`test-report-N.md`) y `code-reviewer-agent` (produce `code-review-N.md`)
deben abrir su output con un bloque YAML así, antes de cualquier prosa:

```yaml
status: approved | rejected
attempt: <n>
feedback:
  - punto concreto 1
  - punto concreto 2
```

## Configuración de modelos (Claude Code, opencode, Codex)

`AGENTS.md` sigue siendo la fuente canónica de reglas compartidas del
repo. Las definiciones funcionales por rol viven una sola vez en
`.agentic/roles/*.md`; los metadatos, permisos y modelos por herramienta
viven en `.agentic/agents.json`; el router OpenCode vive en
`.agentic/models.json`; y la fuente MCP vive en `.agentic/mcp.json`.

Después de editar `.agentic/`, regenerar y validar adaptadores:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1 -Check
```

No editar manualmente archivos generados en `.claude/agents/*.md`,
`.codex/*.config.toml`, `.codex/config.toml`, `.mcp.json` ni
`opencode.json`. El modo `-Check` falla si detecta divergencia o
adaptadores legacy en `.codex/prompts/` o `.opencode/agent/`.

Para OpenCode, `opencode.json` consume `AGENTS.md` mediante
`instructions` y referencia los prompts canónicos con
`prompt: "{file:./.agentic/roles/<role>.md}"`. `model`,
`reasoningEffort`, `permission` y MCP son adaptador de OpenCode generado,
no fuente de verdad manual.

Para Claude Code, `model` y `effort` sí quedan en el frontmatter de cada
`.claude/agents/*.md`, porque Claude Code no tiene un mecanismo
equivalente de override centralizado por agente de proyecto. El cuerpo de
esos archivos se genera desde `.agentic/roles/*.md`. `CLAUDE.md`
mantiene `@AGENTS.md` porque Claude Code lee `CLAUDE.md` como memoria de
proyecto y soporta imports `@`.

Para ejecutar el circuito completo hasta `git push`, creación de PR,
consulta/espera de CI y cierre post-merge, Claude debe correr como
Claude Code en un entorno con permisos reales sobre el repo Git y GitHub.

Para Codex, la configuración nativa del repo vive en `.codex/`. Ese
directorio se usa como `CODEX_HOME` reproducible del proyecto:

- `.codex/config.toml`: defaults comunes de Codex y MCP generado.
- `.codex/<role>.config.toml`: perfil por agente, invocado con
  `codex exec -p <role>`.
- `.agentic/roles/<role>.md`: prompt canónico canalizado al ejecutar el
  perfil Codex.

Ejemplo desde PowerShell, ejecutado por el Main Agent al delegar:

```powershell
$env:CODEX_HOME = (Resolve-Path .\.codex).Path
Get-Content .\.agentic\roles\analyst-agent.md -Raw | codex exec -p analyst-agent -C . -
```

Los perfiles Codex fijan modelo y esfuerzo; las reglas comunes del
circuito siguen viviendo en este `AGENTS.md`, para evitar duplicación.

Para resolver modelos OpenCode antes de iniciar una etapa, usar:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\resolve-agentic-model.ps1 `
  -Role analyst-agent `
  -Feature <NN>-<slug>
```

La declaración mínima previa a `spec.md` es
`runs/<NN>-<slug>/run.yaml`, basada en `.agentic/run.example.yaml`.
`model: default` usa el default del rol; un modelo explícito debe estar en
allowlist. La variante (`variant`) se valida aparte del modelo. El
fallback se declara como lista controlada (`go`, `zen`,
`openrouter-free`) y OpenRouter solo se usa si aparece explícitamente en
la declaración o en `-Fallback`.

El router registra evidencia en
`runs/<NN>-<slug>/model-routing.jsonl`: feature, agente, etapa,
proveedor, modelo, variante, origen de selección, fallback aplicado,
motivo, fecha UTC, duración, resultado y costo si la herramienta lo
entrega de forma confiable. No inventa costos.

Credenciales: no se guardan secretos en el repo. OpenCode Go/Zen se
conectan fuera del template con `/connect`; para automatización local se
usan marcas no secretas `AGENTIC_OPENCODE_GO_READY=1` y
`AGENTIC_OPENCODE_ZEN_READY=1`. OpenRouter usa `OPENROUTER_API_KEY` o la
marca `AGENTIC_OPENROUTER_READY=1` cuando el entorno ya está conectado
sin exponer tokens.

## Reglas adicionales

Ver `.claude/rules/` para instrucciones modulares por dominio (accesibilidad,
SEO, estilo de contenido específico del proyecto real, etc.). Vacío por
ahora — se completa a medida que el proyecto que use este template lo
necesite, no de entrada. opencode las lee vía el campo `instructions` de
`opencode.json`. Si `.claude/rules/` deja de estar vacío, Codex debe
referenciar esas reglas desde `.codex/prompts/*.md`.

## Reglas de dominio (no negociables por ningún agente)

- No agregar un backend, base de datos, integración externa o dependencia
  de build sin que quede como una decisión de arquitectura explícita en
  `docs/tecnica/arquitectura.md`.
- No inventar contenido de negocio no provisto (datos, textos legales,
  precios, certificaciones, testimonios) — el contenido real del
  producto debe venir del cliente/negocio real, no generarse por el
  agente.
- No conectar integraciones a servicios o endpoints reales sin que el
  spec de esa feature declare explícitamente a dónde van los datos y qué
  validación/consentimiento aplica, sobre todo si hay datos personales
  involucrados.

Este template no fija más reglas de dominio porque no tiene dominio de
negocio propio. Cada proyecto real que nazca de este template agrega las
suyas en `.claude/rules/` y las refleja aquí — no se copian reglas de
otro proyecto sin adaptarlas.

## Setup manual (una sola vez, no automatizable)

- **GitHub Pages** (Settings → Pages → Source): elegir "GitHub Actions".
  Necesario para que `docs.yml` pueda publicar el sitio MkDocs. Puede
  configurarse en cualquier etapa del ciclo de vida descrito en "Git",
  pero solo tiene efecto observable a partir de la primera release que
  publique `main` con cambios en `docs/`/`mkdocs.yml` (ver "Git",
  sección "Primera release y creación de `main`"): configurarlo durante
  el estado inicial del template es un paso válido sin efecto
  observable hasta ese evento, no un error.
- **Rama `develop`**: es la rama de trabajo habitual desde el momento de
  adoptar este circuito en un repo nuevo, correspondiente al "Estado
  inicial del template" descrito en "Git". No depende de que exista
  `main`: la creación de `main` es un evento posterior, condicionado a
  la primera release (ver "Git", sección "Primera release y creación de
  `main`"), y no hace falta anticiparla para trabajar sobre `develop`.
- **Remoto GitHub**: este template no asume que ya existe un repositorio
  remoto. Crear el repo en GitHub, agregar el remoto (`git remote add
  origin <url>`) y hacer el primer push de `develop` es un paso manual
  del humano antes de que `scripts/ready-for-pr.ps1`,
  `scripts/wait-pr-ci.ps1` y los workflows de GitHub Actions puedan
  funcionar. El primer push de `main` es un paso aparte, que ocurre
  únicamente como parte del evento "Primera release y creación de
  `main`" descrito en "Git" — no antes.
- **Branch protection de GitHub** (Settings → Branches → Branch
  protection rules, o vía `gh api`): configurar sobre la rama `develop`
  los cuatro requisitos que exige el circuito para que el único HITL
  (`AGENTS.md`, sección "Único HITL") sea efectivo: (a) exigir pull
  request antes de mergear, (b) exigir en verde el status check
  `circuit-tests` (nombre del job en `.github/workflows/ci.yml` desde la
  feature `04-ci-wiring-product-tests`, que separó el job antes llamado
  `test` en `circuit-tests` + `product-tests`; si un cambio futuro vuelve
  a renombrar o separar jobs, actualizar este comando con el nombre
  vigente antes de aplicarlo — verificar en la pestaña Actions de una PR
  reciente), (c) exigir al menos 1 aprobación,
  (d) descartar (dismiss) aprobaciones obsoletas cuando hay un push nuevo
  a la PR. `enforce_admins` queda en `true`: los administradores del
  repositorio también quedan sujetos a esta protección, sin bypass,
  consistente con la regla dura de `AGENTS.md` ("Nunca commitear directo
  a `develop`... ni, una vez que exista, nunca directo a `main`") — esta
  decisión pasó por
  Fase CLARIFY con el humano (ver
  `runs/v1.1.0/05-operational-readiness-docs/decision.md`), no es un supuesto
  unilateral. Requiere permisos de administrador sobre el repositorio y
  un remoto GitHub ya configurado (ver bullet "Remoto GitHub" arriba).

  **Advertencia — el `PUT` reemplaza, no fusiona**: el comando de abajo
  sobrescribe por completo la configuración de branch protection vigente
  de `develop` con el payload documentado. Si ya existen otras reglas
  configuradas manualmente en la UI de GitHub (por ejemplo "require
  signed commits", "require linear history", restricciones de push por
  equipo), correr primero el comando de verificación de solo lectura
  (`GET`, más abajo) para revisar qué hay configurado antes de
  reemplazarlo — en particular antes de volver a correr este comando
  para actualizar el nombre del status check.

  Comando `gh api` (PowerShell; el payload en sí es idempotente —
  reenviarlo sin cambios no duplica nada — pero reemplaza cualquier
  configuración externa al payload, ver advertencia arriba;
  `{owner}`/`{repo}` los resuelve `gh` automáticamente desde el remoto
  del directorio actual, no hace falta reemplazarlos):

  ```powershell
  $branchProtection = @'
  {
    "required_status_checks": {
      "strict": true,
      "contexts": ["circuit-tests"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "dismiss_stale_reviews": true,
      "required_approving_review_count": 1
    },
    "restrictions": null
  }
  '@

  # Validar el JSON localmente antes de enviarlo (no requiere credenciales):
  $branchProtection | ConvertFrom-Json | Out-Null

  $branchProtection | gh api `
    --method PUT `
    -H "Accept: application/vnd.github+json" `
    repos/{owner}/{repo}/branches/develop/protection `
    --input -
  ```

  Si la versión de la API en uso ya deprecó el campo `contexts` a favor
  de `checks`, reemplazar `"contexts": ["circuit-tests"]` por
  `"checks": [{"context": "circuit-tests"}]` dentro del mismo payload.

  Verificar lo que hay configurado ANTES de re-aplicar el `PUT` (de solo
  lectura, no destructivo):

  ```powershell
  gh api repos/{owner}/{repo}/branches/develop/protection
  ```

  Alternativa manual (si no se confía en `gh api` o no está disponible):
  en GitHub, Settings → Branches → Add branch protection rule para
  `develop` → activar "Require a pull request before merging" con
  "Require approvals" = 1 y "Dismiss stale pull request approvals when
  new commits are pushed" → activar "Require status checks to pass
  before merging" y agregar el check `circuit-tests` → activar "Include
  administrators" (equivalente UI clásico de `enforce_admins: true`; en
  Rulesets modernos de GitHub la etiqueta equivalente es "Do not allow
  bypassing the above settings") → Save.

  **Limitación conocida verificada en este repositorio**: tanto
  `branches/develop/protection` como `repos/.../rulesets` devuelven hoy
  `403 Upgrade to GitHub Pro or make this repository public to enable
  this feature` contra este repo — es privado y el plan actual de GitHub
  no permite activar ninguna de las dos formas de protección de rama
  **nativa** (preventiva: bloquea el push antes de que ocurra). Esto ya
  ocurrió en la práctica (ver historial de `develop` de agosto de 2026:
  una serie de commits directos con mensajes como "template 10/10"
  introdujeron un `Dockerfile` roto, dos scripts huérfanos con errores de
  sintaxis y una carpeta `runs/` con una feature ficticia no registrada
  en `ROADMAP.md`, todo limpiado recién en PRs posteriores). Dos caminos
  para tener protección **nativa** de verdad, ambos a decidir por el
  humano (no algo que un agente deba resolver unilateralmente): (a)
  subir el repositorio a GitHub Pro, o (b) hacerlo público.

  Mientras esa decisión no se tome, `.github/workflows/guard-develop-branch.yml`
  (ver `docs/tecnica/arquitectura.md`, decisión "Enforcement técnico de
  `develop` sin branch protection nativa") es la mitigación **técnica**
  disponible — no de proceso ni de disciplina humana: reacciona a
  cualquier push a `develop` cuyos commits no estén asociados a una PR
  mergeada contra `develop`, lo revierte automáticamente (o restaura el
  estado previo si fue un force-push) y deja evidencia auditable (issue
  + run en rojo). Es reactivo, no preventivo — el push directo ocurre, y
  el workflow lo revierte después, con una ventana breve en la que
  `develop` queda momentáneamente en el estado no permitido — y tiene un
  límite conocido: si un force-push ocurre y el commit previo ya fue
  recolectado por `git gc` antes de que el workflow corra, la
  restauración automática no es posible (el workflow lo deja explícito
  en el issue que crea en vez de fallar en silencio). Sigue siendo
  válido que cualquier humano que revise el repo pueda correr
  periódicamente `git log --first-parent develop --oneline` como
  verificación adicional, pero ya no es la única línea de defensa.

  **Aprobación HITL de esta mitigación (remediación de baseline
  `audit-framework-v1.1.0`, hallazgo F-004 CRITICAL)**: el humano aceptó
  explícitamente este control técnico compensatorio —detecta y revierte
  automáticamente pushes directos a `develop`, con evidencia auditable—
  como suficiente mientras la protección preventiva nativa de GitHub no
  esté disponible, dejando constancia expresa de que **no es
  equivalente a branch protection preventiva**, de que **existe una
  ventana reactiva breve** entre el push directo y su reversión, y de
  que la limitación conocida (force-push + `git gc` antes de que el
  workflow corra) permanece documentada arriba. F-004 queda **cerrado
  candidato a verificación** en la reauditoría independiente pendiente,
  no declarado 100% resuelto de forma preventiva.
Comandos canónicos para mantener y comprobar el bloque automático:

powershell -ExecutionPolicy Bypass -File scripts/update-status.ps1
powershell -ExecutionPolicy Bypass -File scripts/check-status.ps1

update-status.ps1 actualiza únicamente el bloque STATUS:AUTO:BEGIN/END; el agente mantiene las secciones manuales. check-status.ps1 valida coherencia contra Git y, cuando está disponible, GitHub real. Antes de devolver control se deben ejecutar ambos. No se integran escrituras dentro de scripts transaccionales de worktree/ROADMAP para evitar efectos laterales; tampoco se ejecuta el check como gate de CI porque el checkout efímero y el contexto de Actions no representan necesariamente el estado operativo local.
