# ADR-004 — Numeración de la versión de plataforma: v3.0.0

## Estado

ACEPTADO — 2026-09-30

## Contexto

`ai-native` tiene hoy `VERSION` = `1.3.1` y tags locales `v1.0.0`…`v1.3.1` (verificado: no publicados en `origin`, `git ls-remote --tags origin` no los devuelve). TEMPLATE, que se está evolucionando hacia `ai-native` (ADR-001, ADR-002), está en `v2.0.5` y es la referencia de versión que conocen los consumidores actuales (GI y el Starter).

Hace falta un único número de versión de plataforma inicial para la primera release bajo el nuevo modelo de consumo por referencia.

## Decisión

La primera release de plataforma se numera **v3.0.0**.

Razonamiento:

- v1.x/v2.x de `ai-native` (1.3.1) son internos, no publicados, y describen un modelo distinto (gobernanza de 4 repos sin código de producto). Continuar esa numeración induciría a pensar que v3 es una evolución menor de ese modelo, cuando en realidad reemplaza su mecanismo de consumo.
- v2.x ya identifica a TEMPLATE para los consumidores existentes. Publicar `ai-native` como v2.x colisionaría semánticamente con esa numeración conocida.
- v3.0.0 es el MAJOR más bajo que no es ambiguo con ninguna de las dos series anteriores, y comunica continuidad explícita con la línea TEMPLATE v2.x (sucesora directa) sin ser la misma serie.

Namespace de tags:

- Tags de plataforma: `vMAJOR.MINOR.PATCH`, inmutables, protegidos.
- Prereleases: `v3.0.0-alpha.N` (interno, M4.2) → `v3.0.0-rc.N` (canario, M5.1) → `v3.0.0` (estable, M5.5).
- **No existen tags móviles** (ni `v3`, ni `latest`). Cada workflow reutilizable y cada consumidor fijan un SHA de 40 caracteres, nunca un tag flotante.
- Tags de packs de dominio (p. ej. `gi-platform-core`): namespace propio de cada repo dueño, sin relación directa con la numeración de `ai-native`.
- `versioning/revocations-<n>.json`: numeración incremental propia, publicada como asset atestado de una release inmutable.

Los `VERSION` internos de `foundation/`, `knowledge/` y `template/` (dentro de `ai-native`) se conservan como metadatos históricos de esos componentes (ver `governance/versioning/VERSIONING-POLICY.md`), pero no determinan la versión de plataforma.

## Alternativas consideradas

1. **Continuar en v1.4.0 / v2.0.0 sobre la numeración interna de `ai-native`.** Rechazada: no está publicada, y v2.0.0 colisiona con TEMPLATE.
2. **Adoptar directamente v2.0.6 (como sucesor inmediato de TEMPLATE) para todo `ai-native`.** Rechazada: `ai-native` no es un fork de TEMPLATE, es una plataforma nueva que además absorbe `foundation/` y `knowledge/`; usar la serie v2.x de TEMPLATE mezclaría dos productos distintos bajo la misma numeración.

## Consecuencias

- `platform.json` (asset de cada release) declara `version`, `commit` (SHA-40) y `digest` (sha256), coherente con el lock del consumidor.
- El patch de seguridad de TEMPLATE (M0.0b) se numera dentro de su propia serie, `v2.0.6`, y entra al "Hash DB" de migración con su propio delta de paridad — no afecta la numeración de `ai-native` v3.

## Referencias

- ADR-001, ADR-002, ADR-003.
- `governance/versioning/VERSIONING-POLICY.md`.
