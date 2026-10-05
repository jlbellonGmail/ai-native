# VERSIONING POLICY

## Fuente de verdad

Hasta la consolidación (PR #2, 2026-09-29), cada repositorio mantenía su propia versión en su archivo `VERSION`:

- `foundation/VERSION` (antes `ai-foundation/VERSION`)
- `knowledge/VERSION` (antes `ai-knowledge/VERSION`)
- `template/VERSION` (antes `ai-template/VERSION`)

Esos archivos `VERSION` internos **se conservan** como metadatos históricos de cada componente, pero **dejan de ser la unidad de release**. Ver ADR-004.

## Versión de plataforma (desde ADR-004)

`ai-native` publica una **única versión de plataforma** con SemVer: `vMAJOR.MINOR.PATCH`.

- La numeración arranca en **v3.0.0**, sucesora explícita de la línea TEMPLATE v2.x que conocen los consumidores. No hay motivo técnico para v2.x (`ai-native` ya tiene tags locales `v1.0.0`–`v1.3.1`, no publicados en `origin`), así que v3.0.0 es el MAJOR más bajo que no genera ambigüedad.
- `platform.json` (release asset) lista los componentes de la release y sus versiones internas (`schemaVersion` de cada contrato, `auditMethod`, etc.) junto con su sha256.
- El `VERSION` de la raíz de `ai-native` vale `3.0.0-dev`: marca la línea v3 aún no publicada en `main`. La versión que consumen los repos GI es la del tag/release publicado, nunca este archivo. La línea interna previa (`1.3.1`, tags locales `v1.0.0`–`v1.3.1`) quedó superseded por v3 y se conserva solo como historia.

## Qué cuenta como cada tipo de cambio

### MAJOR

- Rompe el `ai-native.lock.json` de un consumidor.
- Cambia el kernel de `AGENTS.md` (`kernelContract`).
- Cambia el contrato de bootstrap (`bootstrapContract`).
- Elimina o cambia de forma incompatible un schema, una skill del core o las entradas (`inputs`) de un workflow reutilizable.

### MINOR

- Agrega skills, perfiles o servidores MCP nuevos.
- Agrega gates nuevos, siempre en modo *warn* durante al menos una MINOR antes de bloquear.
- Agrega campos opcionales a un schema (compatible hacia atrás).

### PATCH

Usar PATCH para:

- validaciones,
- configuración,
- CI/CD,
- lint,
- typecheck,
- documentación menor,
- cierres de tareas sin cambio funcional,
- corrección de defectos sin cambio de contrato.

Ejemplo:

```txt
1.3.0 → 1.3.1
```

## Regla general

Ningún agente ni humano debe inventar versiones.

Antes de cambiar una versión debe existir:

1. tarea cerrada,
2. verificación ejecutada,
3. evidencia en roadmap,
4. impacto identificado,
5. commit semántico.

Esta regla se mantiene sin cambios para la versión de plataforma v3.

## Compatibilidad y deprecación

Cada contrato (schema, skill del core, perfil, workflow reutilizable) declara:

- `introduced` (versión de plataforma en la que apareció),
- `supported` (rango vigente),
- `deprecated` (versión en la que se anuncia, si aplica),
- `removalTarget` (MAJOR en la que se retira),
- `migration` (referencia al mecanismo de migración).

Una deprecación se anuncia como *warning* durante al menos una MINOR antes de convertirse en error, salvo vulnerabilidad de seguridad crítica, que puede retirarse de inmediato con revocación (`governance/versioning/revocations-<n>.json`, publicada por `release.yml` como asset atestado de cada release; el consumidor toma la de mayor `n` que verifica).

Ventana de soporte: la MAJOR de plataforma vigente completa, más la MAJOR anterior solo con correcciones de seguridad.

## Referencias

- Arquitectura de consumo por referencia: `governance/adr/ADR-001-arquitectura-referencia-versionada.md`
- Contrato de paridad con TEMPLATE v2.0.5: `governance/adr/ADR-002-contrato-paridad-template-v205.md`
- Evidencia perdida de conocimiento (H5/H7): `governance/adr/ADR-003-evidencia-perdida-h5-h7.md`
- Salto de versión y namespace de tags: `governance/adr/ADR-004-versionado-plataforma-v3.md`
