# ADR-003 — Evidencia de producto perdida: HARDENING-V1.1 H5 y H7 (knowledge)

## Estado

ACEPTADO — 2026-09-30

## Contexto

`governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H5/CHANGES.md` y `.../H7/CHANGES.md` (y varias entradas de `SESSION-CONTEXT.md`, líneas 2048, 2101, 2213, 2277, 2343, 2481, 2524, 2568, 2616) registran commits de producto en el repositorio entonces llamado `ai-knowledge`:

- H5 ("Real Evaluation Runs"): commit `cba745a`, que habría creado `scripts/run-evaluation.mjs`, `scripts/validate-real-evaluation-runs.mjs` y `evaluation/runs/enterprise-10-10/bench-prompt-grounding-controlled/score-report.json`.
- H7 ("First Client Project Playbook", parte knowledge): HEAD `8582290`, que habría creado `docs/playbooks/first-client-project-playbook.md`, su contrato y su validador.

Cuando `knowledge/` se importó a `ai-native` por `git subtree add` (2026-09-29, commit `98331cc` como punto de corte), **ninguno de esos dos commits está incluido**: `98331cc` es posterior a H1 pero anterior a H5 y H7 en la cronología de `SESSION-CONTEXT.md`.

Búsqueda de solo lectura realizada (2026-09-29/30), sin resultado:

- `git cat-file -t cba745a` y `git cat-file -t 8582290` en `ai-native`: "Not a valid object name" (repetido antes y durante esta reconciliación).
- `git reflog --all` y `git fsck --unreachable --no-reflogs` en `ai-native`: sin coincidencias.
- 17 repositorios Git locales bajo `C:\Proyectos`, `C:\UnidadD`, `C:\JLB`, `C:\tools-ai`, `C:\workshop` y `F:\`: ninguno contiene esos objetos.
- Búsqueda de directorios `ai-knowledge*` en `C:` y `F:`: no existe ningún clon adicional. `D:\proyectos`, mencionado como raíz histórica en documentación previa, **no existe en esta máquina**.
- `git ls-remote https://github.com/jlbellonGmail/ai-knowledge.git`: solo `main=98331cc` (el mismo commit ya importado), `repair/enterprise-10-10-product-structure` y los tags `v1.0.0`/`v1.1.0`. Ninguno contiene `cba745a` ni `8582290`.
- GitHub API `GET /repos/jlbellonGmail/ai-knowledge/commits/{sha}` para ambos SHA: `422 No commit found for SHA`.
- La propia gobernanza documenta que el trabajo de P0-T2 (y, por extensión, este patrón de la sesión H5-H7) se cerró con `NOT_PUSHED_BY_POLICY`, consistente con que esos commits pudieron quedar únicamente en un checkout local que ya no existe.

**Resultado de la búsqueda: `NOT_FOUND_AFTER_SEARCH`.** No se encontró evidencia de que esos dos commits sigan siendo alcanzables desde ningún repositorio, remoto o local, disponible hoy.

## Decisión

1. Los artefactos de producto de H5 y H7 (parte `knowledge`) se reclasifican de `CLOSED` a **`HISTORICAL_UNVERIFIED`**: la gobernanza registra que la tarea se declaró cerrada y con evidencia en su momento, pero esa evidencia de producto no es alcanzable en el estado actual del repositorio.
2. **No se reconstruyen ni se inventan** los 6 archivos declarados (`scripts/run-evaluation.mjs`, `scripts/validate-real-evaluation-runs.mjs`, `evaluation/runs/.../score-report.json`, `docs/playbooks/first-client-project-playbook.md`, su contrato y su validador). Si en el futuro aparece el checkout original, se reconcilian; si no, se recrean como tarea nueva y explícita, nunca retro-fechada.
3. **H8** (Adoption Readiness Final Audit, score 91/100) se marca con una nota: su verificación de H5 ("Ready" porque "score report exist[s]") no puede confirmarse en este checkout. El score histórico se conserva sin alterar, pero deja de citarse como evidencia vigente de que la capacidad de evaluación real esté implementada hoy.
4. **Regla nueva de cierre de tareas:** ninguna tarea de producto se marca `CLOSED` en gobernanza sin que su commit de producto haya sido efectivamente *pusheado* a un remoto accesible. `NOT_PUSHED_BY_POLICY` deja de ser compatible con `CLOSED`; pasa a requerir `CLOSED_PENDING_PUSH` o equivalente hasta confirmar el push.

## Alternativas consideradas

1. **Dejar H5/H7 como `CLOSED` sin nota.** Rechazada: mantiene una afirmación no verificable como si fuera evidencia vigente, lo que el Contrato de Paridad (ADR-002) prohíbe explícitamente (`UNKNOWN`/"implícito" no son resoluciones válidas).
2. **Recrear los 6 archivos ahora, dándolos por reconstituidos.** Rechazada: inventaría evidencia de un commit que nunca se verificó; correspondería a una tarea nueva, con su propio ASSESS y su propia revisión.

## Consecuencias

- La capacidad "evaluaciones reales L1/L2/L3" (EVL-01 en el Contrato de Paridad) no hereda ninguna base de `knowledge` histórico; se construye desde cero en M4.6, con harness real y datos medidos (sin `null` silencioso en métricas obligatorias).
- `roadmap-status.json` registra H5 y H7 con `evidenceStatus: HISTORICAL_UNVERIFIED` (ver entrada correspondiente).

## Referencias

- ADR-001, ADR-002.
- `governance/execution/archive/AI-NATIVE-HARDENING-V1.1/H5/`, `.../H7/`, `.../H8/`.
- `governance/SESSION-CONTEXT.md`, entrada 2026-09-30 (búsqueda H1 documentada íntegra).
