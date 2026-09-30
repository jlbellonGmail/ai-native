# ADR-002 — Contrato de Paridad TEMPLATE v2.0.5 → AI-NATIVE v3

## Estado

ACEPTADO — 2026-09-30

## Contexto

TEMPLATE v2.0.5 (`C:\Proyectos\template`, tag `v2.0.5` = commit `92a797c`) es la baseline funcional real del circuito agéntico: 576 archivos, 29 scripts PowerShell, 35 archivos de test (264 funciones, ≈285 casos), 5 workflows, un framework de auditoría (`.audit/`) y un modelo de distribución por copia parcial (17 rutas vía manifest + `upgrade-template-consumer.ps1`).

ADR-001 decide migrar el modelo de distribución hacia referencia versionada. Esa migración **no puede degradar** la capacidad funcional de TEMPLATE v2.0.5 de forma silenciosa (principio no negociable de la sesión que originó este ADR).

## Decisión

Se adopta el **Contrato de Paridad** como mecanismo formal:

1. Toda capacidad útil de TEMPLATE v2.0.5 queda clasificada en exactamente uno de estos estados: `PRESERVED`, `IMPROVED`, `REPLACED_EQUIVALENT`, `LOCAL_BY_DESIGN` o `DEPRECATED_EXPLICITLY` (esta última exige justificación, evidencia, reemplazo, impacto y aprobación humana explícita).
2. Se prohíben las resoluciones `UNKNOWN`, `TBD` o "implícitamente soportado".
3. **Paridad de comportamiento, no de bugs** (`BEHAVIORAL PARITY ≠ BUG PARITY`): cada defecto conocido de v2.0.5 (31 documentados) se corrige con un test que primero falla contra el código heredado y luego pasa contra el nuevo.
4. El contrato se versiona como artefacto máquina en `parity/v2.0.5/{capabilities,tests-map,files-map}.json`, con un validador que exige `UNMAPPED=0` (gate `TEST_PARITY` / `PARITY_SCORECARD`).

### Resultado de la clasificación (74 capacidades)

- 11 `PRESERVED`, 53 `IMPROVED`, 4 `REPLACED_EQUIVALENT`, 6 `LOCAL_BY_DESIGN`.
- 6 sub-comportamientos retirados explícitamente (D-1…D-6), todos dentro de capacidades `IMPROVED` — el mecanismo se retira, no la capacidad. El más relevante: la autorización de merge por archivo commiteado (D-1), reemplazada por un merge ejecutado por una cuenta humana ligado al SHA verificado.
- 576 archivos de v2.0.5 mapeados a área y capacidad; 0 sin mapear.
- 264 funciones de test (≈285 casos) con destino; ninguna se elimina sin equivalente documentado.
- 31 defectos conocidos, cada uno con fase de corrección y test de regresión asignados. Los dos más graves — B02/B04 (el gate post-HITL acepta autorizaciones de merge reutilizables desde la propia PR) y B31 (inyección de script vía `head.ref` interpolado en `pull_request_target` con escritura) — están **vigentes hoy en repos públicos** y se contienen mediante M0.0.
- 19 capacidades existen solo en `ai-native` (no en TEMPLATE) y quedan igualmente clasificadas (registries con sha256, workflows de seguridad, audit-safe-script-mode, observabilidad OTel, perfiles de testing, constitución de 8 pasos, bridge OpenClaw, entre otras).

### SDD en tres niveles

Se preserva y mejora el modelo adaptativo de TEMPLATE v2.0.5:

- **ASSESS es determinista** (señales por ruta + amplitud → score → LIGHT/STANDARD/FULL). FULL **no** es el nivel por defecto.
- Se corrige la contradicción de v2.0.5 entre `sdd.json.requiredArtifacts` y el contrato de evidencia real: `contracts/sdd-levels.json` pasa a ser la **única fuente**.
- Presupuestos de convergence verificados y preservados: LIGHT=2, STANDARD=4, FULL=6.

### Circuito y roles

Roles canónicos por capacidad, no por herramienta: Planner, Builder, Reviewer, Orchestrator (runtime determinista), CI confiable, Humano. Se preserva el **HITL único** (MERGE/NO MERGE) y se corrige la ambigüedad de v2.0.5 donde `qa-agent` debía ejecutar tests pero el rol Reviewer no tenía permiso de ejecución: el runtime ejecuta `verify` de forma determinista y el Reviewer interpreta el resultado.

## Alternativas consideradas

1. **Reescribir el circuito desde cero, sin mapear v2.0.5.** Rechazada explícitamente por el usuario: el objetivo es evolución con paridad demostrada, no reinicio.
2. **Aceptar los bugs conocidos de v2.0.5 "tal cual" por velocidad.** Rechazada: viola el principio "paridad de comportamiento, no de bugs" y perpetuaría vulnerabilidades activas (B02/B04/B31).

## Consecuencias

- La extracción de TEMPLATE hacia `ai-native` (fase M1) se hace mediante importación **filtrada** (no un subtree completo) para no arrastrar autorizaciones de merge reutilizables, rutas `D:\` ni `AGENTS.md`/`CLAUDE.md` anidados como contexto de agente.
- Cada PR de las fases M2–M3 que mueva o reimplemente una capacidad de TEMPLATE debe demostrar el test de paridad correspondiente antes de cerrarse.
- El gate `TEST_PARITY` se mide primero como baseline (M1.1, sin asumir que los 264 tests pasan hoy) y luego se exige en verde antes de cada release candidata.

## Referencias

- ADR-001 (arquitectura de referencia versionada).
- Contrato de Paridad completo, matriz de 74 capacidades, mapa de los 35 archivos de test y registro cerrado de tests de paridad: plan de la sesión (ver `SESSION-CONTEXT.md`, entrada 2026-09-30).
