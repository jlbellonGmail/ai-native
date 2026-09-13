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

## Dirección v2 y Fase 00

Base estable congelada: `v1.1.0`. El objetivo es evolución autónoma,
adaptativa e independiente de proveedor; no se declara v2.0.0 publicada.
Principios: [PRINCIPLES.md](PRINCIPLES.md). Diseño y compatibilidad:
[fundamentos v2](docs/tecnica/fundamentos-v2.md).

Fase 00 — Fundamentos v2 y compatibilidad: bootstrap de gobernanza en
`chore/fundamentos-v2`, fuera del contrato Feature/Milestone. Cubre principios,
responsabilidades, migración, matriz v1, invariantes y criterios medibles.
Evidencia: [.audit/evidence/2026-09-13-fundamentos-v2/propuesta.md](.audit/evidence/2026-09-13-fundamentos-v2/propuesta.md).
Su implementación/revisión se consulta en STATUS y el expediente; su cierre
se deriva exclusivamente del estado MERGED de la PR con esa rama hacia
`develop`. No tiene checkbox Feature ni cierre automático que lo simule.

Las fases siguientes no obligan a crear subsistemas. Cada una puede concluir
sin implementación nueva si demuestra su aceptación y justifica la decisión.
Los IDs 00–05 históricos se preservan; IDs 06–22 corresponden a fases 01–17.
La siguiente unidad es 06, sólo después del HITL de Fase 00; esta ejecución
no implementa ASSESS ni fases posteriores.

## Backlog v2

- [x] 06-assess-motor-adaptativo — Fase 01: ASSESS / motor adaptativo. Determinar riesgo y profundidad con evidencia sin activar todo el pipeline.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [x] 07-sdd-adaptativo — Fase 02: SDD adaptativo. Materializar LIGHT, STANDARD y FULL con intención verificable.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 08-arquitectura-roles — Fase 03: Arquitectura de roles. Definir Planner, Builder y Reviewer por capacidades y reducir duplicación.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 09-convergence — Fase 04: CONVERGENCE. Coordinar feedback, verificación y review hasta coherencia suficiente.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 10-evidencias-adaptativas — Fase 05: Contrato adaptativo de evidencias. Validar evidencia proporcional preservando unidades v1.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 11-tests-ci-audit — Fase 06: Tests, CI y .audit. Preservar regresión determinística y evaluación global independiente.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 12-agentic-evals — Fase 07: Agentic Evals. Evaluar comportamiento del Template con escenarios reproducibles.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 13-routing-dinamico — Fase 08: Routing dinámico de modelos. Elegir capacidades por tarea, riesgo y costo con fallback trazable.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 14-skills-reutilizables — Fase 09: Skills. Adoptar procedimientos reutilizables sólo con necesidad demostrada.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 15-mcp-herramientas — Fase 10: MCP y herramientas externas. Incorporar capacidades externas concretas o justificar no incorporarlas.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 16-seguridad-profesional — Fase 11: Seguridad profesional. Aplicar permisos y controles progresivos con pruebas negativas.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 17-supply-chain-cicd — Fase 12: Supply chain y CI/CD profesional. Fortalecer cadena de suministro según madurez y riesgo.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 18-status-observabilidad — Fase 13: STATUS, observabilidad y reentrada. Verificar checkpoints y reanudación sin fuentes contradictorias.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 19-unidades-paralelizacion — Fase 14: Feature, Milestone y paralelización. Evolucionar aislamiento y coordinación de unidades coherentes.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 20-releases-evolucion — Fase 15: Releases y evolución. Formalizar evolución compatible y releases aprobadas.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 21-validacion-integral-v2 — Fase 16: Validación integral v2. Demostrar aceptación, eficiencia y compatibilidad en pilotos.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

- [ ] 22-auditoria-release-v2 — Fase 17: Auditoría final y release v2.0.0. Auditar resultado completo y preparar release para decisión humana.

      Referencias:
      - docs/tecnica/fundamentos-v2.md

Las referencias adicionales se agregan indentadas cuando aporten precisión.
El contexto de producto se lee automáticamente según AGENTS.

## Cómo se usa este archivo

1. El humano dirige el backlog; el orquestador puede materializar la dirección
   explícitamente autorizada, sin inventar decisiones de producto.
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
- [x] 03-adopcion-proyecto-existente — Guia de adopcion del circuito en un proyecto existente: checklist de colisiones (.agentic/, scripts/, runs/, docs/tecnica/, docs/usuario/, AGENTS.md, los 4 workflows de .github/workflows/) con estrategia de merge para cada caso, y script opcional que detecte colisiones en un repo destino.
- [x] 04-ci-wiring-product-tests — Separa .github/workflows/ci.yml en un job circuit-tests (el pytest actual del circuito, siempre obligatorio) y un job product-tests con un marcador claro para agregar trivialmente el build/test real del stack de cada proyecto.
- [x] 05-operational-readiness-docs — Checklist de branch protection de GitHub en la seccion "Setup manual" de AGENTS.md (require PR, status check, approval, dismiss stale approvals) con comandos gh exactos, y nota de troubleshooting sobre bloqueos de local-feature-reconcile.ps1/ready-for-pr.ps1 por EDR agresivo en Windows.




