# Proyecto: template

Template base para arrancar un proyecto nuevo ya con un circuito
agéntico AI-Native funcionando: analista → auditor → implementador → QA,
con un único punto de intervención humana (la decisión de merge sobre la
PR). No define stack de producto — eso lo decide cada proyecto real que
nazca de este template, documentándolo en `docs/tecnica/arquitectura.md`
antes de que cualquier agente asuma tecnología no declarada.

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

- `runs/`: artefactos por feature (`spec.md`, `audit-N.md`,
  `test-report-N.md`, `decision.md`, y cuando aplique `run.yaml` +
  `model-routing.jsonl`). No es código de producción, es historial del
  circuito.
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
- `tests/`: pytest de los scripts del circuito (`scripts/*.ps1`). Se
  agrega `tests/` de producto (o la carpeta que el stack real defina)
  cuando exista algo real que testear — no antes.
- `scripts/`: motor ejecutable del circuito agéntico (`scripts/*.ps1`,
  ver más abajo). No hay scripts operativos de producto todavía.

## Workflow del proyecto — circuito agéntico sin HITL intermedio

Este documento define cómo se ejecuta cualquier feature en este repo. Es
leído por todos los agentes al arrancar sesión, sea Claude Code, opencode o
Codex. No es negociable por ningún agente individual: si un agente cree que
debe saltarse un paso, debe decirlo explícitamente en su output, no
saltarlo en silencio.

El circuito tiene un solo punto de intervención humana: la decisión final
sobre la PR ya creada y con CI verde. Esa decisión es binaria: `MERGE` o
`NO MERGE`. No hay checkpoints humanos antes de crear la PR.

Cada uno de los 4 agentes corre como **subagente**, invocado puntualmente
para su etapa. Esto mantiene el contexto principal limpio: el subagente
hace su tarea, entrega su artefacto en `runs/`, y termina.

## Circuito

El contrato mínimo de artefactos vive en una sola fuente ejecutable:
`scripts/feature-contract.ps1`. Los prompts de Codex, Claude Code y
opencode pueden recordar el contrato, pero no deben duplicar validaciones:
deben invocar los scripts comunes. El contrato exige, según etapa:
`spec.md`, `decision.md`, `audit-N.md`, `test-report-N.md`,
`docs/tecnica/<slug>.md`, `docs/usuario/<slug>.md`, un enlace exacto en
`docs/tecnica/index.md`, un enlace exacto en `docs/usuario/index.md`,
estado correcto de `ROADMAP.md`, rama `feature/<NN>-<slug>`, PR contra
`develop` y CI verde.

1. `analyst-agent` (read-only, subagente, sesión nueva) → produce `spec.md`.
   El spec SIEMPRE debe incluir como criterios de aceptación la creación
   de `docs/tecnica/<slug>.md`, `docs/usuario/<slug>.md`,
   `runs/<NN>-<slug>/decision.md`, y enlaces exactos en
   `docs/tecnica/index.md` y `docs/usuario/index.md`.
2. `reviewer-agent` (read-only, subagente, sesión nueva) → produce
   `audit-N.md` con veredicto `approved` o `rejected`. Rechaza
   automáticamente si el spec no exige los dos `.md` de documentación.
   - Si `rejected` → vuelve a 1 con el feedback. La corrección sigue en
     el circuito agéntico; no hay checkpoint humano intermedio.
3. Si `approved` → `builder-agent` (write, subagente, en worktree propio)
   → implementa el código Y escribe `docs/tecnica/<slug>.md` y
   `docs/usuario/<slug>.md` como parte de terminar la feature, no aparte.
   También crea `runs/<NN>-<slug>/decision.md` con decisiones demostrables
   desde spec/auditoría/implementación, y ejecuta
   `scripts/update-doc-indexes.ps1 <NN>-<slug> "<Titulo>"`.
4. `qa-agent` (write, subagente, mismo worktree) → corre tests (pytest y
   cualquier verificación real del producto, incluida verificación manual
   reproducible cuando corresponda), verifica que el contrato común pase
   con `Assert-FeatureContract` (docs, decision, auditoría, reporte e
   índices), produce `test-report-N.md`.
   - Si falla (código o documentación faltante) → vuelve a 3 con el
     reporte. La corrección sigue en el circuito agéntico; no hay
     checkpoint humano intermedio.
5. Si QA aprueba → actualizar `ROADMAP.md` al estado `[-] READY_FOR_PR`
   para esa feature, sin marcar `[x]`, y commitear ese cambio en la rama
   de la feature. Script recomendado:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\ready-for-pr.ps1 <NN>-<slug>`.
6. Push de la rama de feature y creación automatizada de PR hacia
   `develop` (`gh pr create`). La PR debe incluir evidencias completas:
   resumen de cambios, resultados de tests, auditoría, checklist de
   aceptación, riesgos y enlaces a spec/docs.
7. Verificar que el CI de la PR corre en verde antes de pedir decisión
   humana. Script recomendado:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\wait-pr-ci.ps1`.
8. **Único HITL:** el humano revisa la PR y sus evidencias completas y
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
9. **Cierre automático post-merge remoto:** GitHub Actions dispara
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

## Retornos permitidos

- `reviewer-agent` → `analyst-agent` cuando el spec es `rejected`.
- `qa-agent` → `builder-agent` cuando QA falla.
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

## Git

- Rama base de trabajo diario: `develop`
- Rama de producción: `main` — solo recibe merges desde `develop` vía PR,
  cuando se decide hacer un release (no en cada feature)
- Cada feature: `feature/<NN>-<slug>`, en su propio `git worktree` bajo
  `../worktrees/<slug>/` — esto habilita correr varios circuitos en
  paralelo sin pisarse
- Nunca commitear directo a `develop` (salvo el cierre automatizado de
  `ROADMAP.md`, ver paso 9) ni nunca directo a `main`
- La PR hacia `develop` se crea automáticamente después de QA aprobado.
- El humano no abre la PR ni hace checkpoints previos: solo decide
  `MERGE` o `NO MERGE` con la PR y sus evidencias a la vista.

## Versionado (tags)

- Cada release a `main` se marca con un tag `vX.Y.Z` (SemVer:
  major.minor.patch), pusheado por el humano después de mergear a `main`
  (`git tag vX.Y.Z && git push origin vX.Y.Z`).
- Los agentes nunca crean tags — es una decisión del humano, en el momento
  de release hacia `main`.
- El mecanismo de despliegue (si el proyecto real lo define) depende del
  hosting elegido; documentarlo como decisión explícita en
  `docs/tecnica/arquitectura.md` cuando exista.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): corre `pytest` sobre `tests/`
  (tests del circuito) en cada push/PR a `develop` o `main`. Gate
  obligatorio antes de mergear cualquier PR (paso 7 del circuito). Se
  amplía con los tests de producto que correspondan cuando el stack real
  se defina — no antes.
- **Docs** (`.github/workflows/docs.yml`): se dispara al pushear a `main`
  con cambios en `docs/` o `mkdocs.yml`. Publica el sitio MkDocs a GitHub
  Pages. Público, sin gate por ahora.
- **Post-merge close** (`.github/workflows/post-merge-close-feature.yml`):
  ver paso 9 del circuito.
- **Post-HITL merge gate**
  (`.github/workflows/post-hitl-merge-gate.yml`): se dispara cuando el
  humano aprueba la PR hacia `develop`; invoca
  `scripts/complete-approved-pr.ps1`, espera checks post-aprobación,
  mergea solo si están verdes y devuelve feedback a builder si fallan.
- **Release**: pendiente (ver sección Versionado). No hay `Dockerfile` ni
  `release.yml` todavía — se agregan cuando el stack real los requiera.

## Herramientas locales requeridas

- Windows PowerShell (`powershell.exe`) para los scripts de automatización
  en `scripts/*.ps1`.
- Git (`git`) para ramas, worktrees, commits, push y verificación de merge.
- GitHub CLI (`gh`) instalado, en `PATH` y autenticado para crear PRs,
  consultar estado de PR mergeada y esperar checks de CI.
- Python 3.12+ con `pytest` instalado (`pip install -r requirements-dev.txt`)
  para correr los tests del circuito.

## Artefactos

Cada ciclo de feature genera su carpeta en `runs/<NN>-<slug>/` con:

- `spec.md`
- `audit-N.md` (uno por intento del reviewer-agent)
- `test-report-N.md` (uno por intento del qa-agent)
- `decision.md` (archivo canónico obligatorio con decisiones demostrables
  y evidencia de cierre/merge; no debe quedar vacío ni ornamental)
- `post-hitl-gate-N.md` (cuando el gate posterior a la aprobación humana
  necesita dejar evidencia de merge aprobado o feedback automático para
  builder si Actions falla después del HITL)

Ningún agente sobreescribe el artefacto de otro. Cada intento se numera.
El número y slug de cada feature sale de `ROADMAP.md`.

## Formato de veredicto

`reviewer-agent` y `qa-agent` deben abrir su output con un bloque YAML así,
antes de cualquier prosa:

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
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1 -Check
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
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\resolve-agentic-model.ps1 `
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
  Necesario para que `docs.yml` pueda publicar el sitio MkDocs.
- **Rama `develop`**: se crea a partir de `main` al adoptar este circuito
  en un repo nuevo. Quedan sincronizadas hasta la primera feature nueva.
- **Remoto GitHub**: este template no asume que ya existe un repositorio
  remoto. Crear el repo en GitHub, agregar el remoto (`git remote add
  origin <url>`) y hacer el primer push de `main` y `develop` es un paso
  manual del humano antes de que `scripts/ready-for-pr.ps1`,
  `scripts/wait-pr-ci.ps1` y los workflows de GitHub Actions puedan
  funcionar.
