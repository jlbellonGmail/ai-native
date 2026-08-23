# Roadmap: template

Cada feature nueva se implementa siguiendo el circuito agéntico de
[AGENTS.md](AGENTS.md): Analyst → Reviewer → Builder → QA → Code Reviewer
→ `[-] READY_FOR_PR` → PR → CI verde → HITL (único punto de aprobación
humana) → gate post-HITL → Merge → `[x]`, con su carpeta de evidencia en
`runs/<NN>-<slug>/` y su documentación en `docs/tecnica/<slug>.md` +
`docs/usuario/<slug>.md`.

Este archivo refleja el estado **verificado** del proyecto (código
real, no expectativas). No se marca `[x]` antes del merge a `develop`.

## Propósito del producto

Por definir. Este es el template base AI-Native: no tiene producto propio
todavía. El humano completa esta sección cuando decide qué se construye
sobre este template (ver también `docs/tecnica/arquitectura.md`).

---

## Estado actual verificado

Repositorio inicializado con el circuito agéntico AI-Native (agentes,
scripts del circuito, tests, estructura de documentación y CI/CD) y sin
código de producto todavía. No hay stack definido — ver
`docs/tecnica/arquitectura.md` y la sección "Stack" de `AGENTS.md`.

---

## Backlog

Agregar cada ítem nuevo con el patrón:

`- [ ] NN-slug-en-minusculas — Descripción corta y verificable en español.`

Opcionalmente, cuando exista documentación puntual especialmente
relevante para ese ítem, se puede agregar un bloque `Referencias:`
indentado debajo (nunca obligatorio para todos los ítems):

```text
- [ ] 15-accesibilidad-ux-mobile — Descripción corta y verificable.

      Referencias:
      - docs/tecnica/<documento-relacionado>.md
```

`analyst-agent` lee `docs/producto/contexto-producto.md` automáticamente
sin que haga falta referenciarlo acá; ver "Contexto de producto y
bootstrap" en `AGENTS.md`.

## Cómo se usa este archivo

1. El humano mantiene el backlog: agrega, renombra o reordena items.
2. Ningún item se marca `[x]` antes del merge a `develop`.
3. Después de QA aprobado y de que `code-reviewer-agent` aprueba el diff
   final, la automatización cambia `[ ]` → `[-]` en la rama de la feature
   (`scripts/ready-for-pr.ps1`) y lo lleva dentro de la PR.
4. Después de aprobar la PR, GitHub Actions ejecuta
   `post-hitl-merge-gate.yml`: vuelve a esperar Actions y mergea solo si
   quedan verdes. Si fallan, deja feedback para builder y no mergea.
5. Después del merge, GitHub Actions ejecuta
   `post-merge-close-feature.yml`, que invoca `scripts/close-feature.ps1`
   desde `develop` para cambiar `[-]` → `[x]`, commitear y pushear a
   `origin/develop`.
6. Al arrancar una feature se usa el número/slug de este archivo para
   crear `runs/<NN>-<slug>/` y la rama `feature/<NN>-<slug>` (en worktree
   propio bajo `../worktrees/<slug>/`).

**Patrón del ítem**: `NN` (dos dígitos, numeración secuencial), `slug` en
minúsculas con guiones, seguido de `—` y descripción corta en español.

## Roadmap

- [x] 00-fuente-unica-router-modelos — Fuente canonica agentica, router OpenCode y gate post-HITL listos para PR.
- [x] 01-code-reviewer-y-sdd — Quinto agente code-reviewer-agent, SDD formal (spec+plan+tasks), contrato que valida el ultimo veredicto real y corrige bugs detectados (decision.md, retry de cierre, schemas rotos).
- [x] 02-integridad-post-hitl-y-ready-for-pr — Vincula la aprobacion HITL a la revision vigente de la PR (rechaza aprobaciones stale tras un push posterior), hace transaccional el orden de validacion en ready-for-pr.ps1 (el contrato completo se valida antes de mutar ROADMAP.md, no despues) y referencia el archivo real del ultimo veredicto aprobado en el cuerpo de la PR en vez de un placeholder generico.
- [ ] 03-adopcion-proyecto-existente — Guia de adopcion del circuito en un proyecto existente: checklist de colisiones (.agentic/, scripts/, runs/, docs/tecnica/, docs/usuario/, AGENTS.md, los 4 workflows de .github/workflows/) con estrategia de merge para cada caso, y script opcional que detecte colisiones en un repo destino.
- [ ] 04-ci-wiring-product-tests — Separa .github/workflows/ci.yml en un job circuit-tests (el pytest actual del circuito, siempre obligatorio) y un job product-tests con un marcador claro para agregar trivialmente el build/test real del stack de cada proyecto.
- [-] 05-operational-readiness-docs — Checklist de branch protection de GitHub en la seccion "Setup manual" de AGENTS.md (require PR, status check, approval, dismiss stale approvals) con comandos gh exactos, y nota de troubleshooting sobre bloqueos de local-feature-reconcile.ps1/ready-for-pr.ps1 por EDR agresivo en Windows.






