# ADR-001 — Arquitectura de consumo por referencia versionada

## Estado

ACEPTADO — 2026-09-30

## Contexto

Hasta esta decisión, `ai-native` describía (en `AGENTS.md`, `SESSION-CONTEXT.md` y `governance/versioning/VERSIONING-POLICY.md`) un modelo de cuatro repositorios independientes (`governance/`, `ai-foundation/`, `ai-knowledge/`, `ai-template/`) coordinados solo por gobernanza, sin código de producto en la raíz.

El 2026-09-29 (PR #2, `d459522`) esos tres repos se consolidaron dentro de `ai-native` mediante `git subtree add`, preservando su historia bajo `foundation/`, `knowledge/` y `template/`. Esa consolidación **no fue registrada en gobernanza**: `AGENTS.md`, los scripts, `.gitignore` y `SESSION-CONTEXT.md` seguían describiendo el modelo de cuatro repos y rutas `ai-*` que ya no existen.

En paralelo, una auditoría arquitectónica completa (repositorio `template`, tag `v2.0.5`) mostró que el modelo de distribución del TEMPLATE — copiar ~17-29 archivos de gobernanza y tooling a cada repo consumidor GI — no escala: cada mejora de skills, MCP, workflows o gobernanza exige propagación manual a N repos, y hoy ningún consumidor declara su versión de plantilla.

Se produjo un Contrato de Paridad TEMPLATE v2.0.5 → AI-NATIVE v3 y un Plan Maestro de implementación (M0–M6), con una revisión crítica independiente y una enmienda final (P44/P45), documentados en el plan de sesión y referenciados aquí.

## Decisión

`ai-native` se convierte en la **plataforma central versionada** de desarrollo agéntico. El modelo de consumo pasa de "copia" a "referencia versionada":

- Cada consumidor (repo GI u otro) fija una versión exacta de la plataforma en un **lock** (`ai-native.lock.json`): `platform.version`, `platform.commit` (SHA de 40 caracteres) y `platform.digest` (sha256).
- Un **bootstrap mínimo** (lista cerrada de archivos, ver Contrato de Paridad §15.1) es lo único que el consumidor mantiene físicamente para el aspecto de plataforma. El resto (roles, skills, MCP, adaptadores por herramienta) se **genera localmente** desde una **caché direccionada por contenido**, verificada por digest, y queda ignorado por Git.
- Los workflows de CI/CD se consumen como **workflows reutilizables** (`workflow_call`) fijados por SHA — nunca por tag móvil.
- Las actualizaciones (`bump`) cambian como máximo 2 archivos del consumidor (lock + caller), abiertas por un bot, con revisión y merge humano.
- El **HITL sigue siendo único**: el merge lo ejecuta una cuenta humana. El agente opera con su propia identidad, sin privilegio de merge.
- Skills, MCP, workflows, `.audit`, knowledge y evaluaciones se centralizan; runs, STATUS, ROADMAP y evidencia de auditoría siguen siendo estado local de cada consumidor.

Esta arquitectura reemplaza el modelo de "4 repos gobernados solo por convención" descrito en la versión anterior de `AGENTS.md`. La versión de plataforma arranca en **v3.0.0** (ADR-004).

## Alternativas consideradas

1. **Mantener TEMPLATE como está y solo corregirle bugs.** Rechazada: no resuelve la propagación manual a N repos, que es la restricción principal declarada por el usuario.
2. **Copiar el modelo de "vendoring" (snapshot completo) por defecto.** Rechazada como default; se conserva como modo de excepción (`vendor: true`) para entornos aislados sin red.
3. **Monorepo único sin lock por consumidor (todo en `ai-native`).** Rechazada: acopla innecesariamente el ritmo de release de la plataforma con el de cada producto GI.

## Consecuencias

- Se requiere: un CLI/runtime de plataforma (`ai-native` cli), contratos JSON Schema versionados, un gateway MCP, workflows reutilizables fijados por SHA, y un mecanismo de migración (`migrate --inventory`) desde TEMPLATE v2.x.
- El circuito agéntico completo de TEMPLATE v2.0.5 (SDD adaptativo LIGHT/STANDARD/FULL, roles Planner/Builder/Reviewer, convergence, HITL único) se preserva y mejora; el detalle capacidad por capacidad está en el Contrato de Paridad (ADR-002).
- La secuencia de implementación (M0–M6) y las 45 condiciones de entrada/salida (P1–P45) gobiernan el ritmo de esta migración. No se autoriza tocar repos GI sin autorización explícita por oleada.

## Referencias

- Contrato de Paridad: ADR-002.
- Evidencia perdida (H5/H7 de HARDENING-V1.1): ADR-003.
- Versionado de plataforma: ADR-004.
- Plan Maestro completo (Contrato de Paridad + M0–M6 + P1–P45 + enmienda P44/P45): archivo de plan de la sesión que originó esta decisión (referenciado en `SESSION-CONTEXT.md`, entrada 2026-09-30).
