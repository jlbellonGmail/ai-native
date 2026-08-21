# Roadmap: template

Cada feature nueva se implementa siguiendo el circuito agéntico de
[AGENTS.md](AGENTS.md): Analyst → Reviewer → Builder → QA →
`[-] READY_FOR_PR` → PR → CI verde → HITL (único punto de aprobación
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

## Cómo se usa este archivo

1. El humano mantiene el backlog: agrega, renombra o reordena items.
2. Ningún item se marca `[x]` antes del merge a `develop`.
3. Después de QA aprobado, la automatización cambia `[ ]` → `[-]` en la
   rama de la feature (`scripts/ready-for-pr.ps1`) y lo lleva dentro de
   la PR.
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

- [ ] 00-fuente-unica-router-modelos — Puntos 0 y 1 implementados localmente; pendientes de HITL, sin PR/merge por restricción explícita del encargo.
