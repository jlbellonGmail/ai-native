# VERSIONING POLICY

## Fuente de verdad

Cada repositorio mantiene su propia versión en su archivo `VERSION`.

Repositorios:

- `ai-foundation/VERSION`
- `ai-knowledge/VERSION`
- `ai-template/VERSION`

La carpeta contenedora `ai-native` funciona como repositorio de governance, roadmap y orquestación.

## Regla general

Ningún agente ni humano debe inventar versiones.

Antes de cambiar una versión debe existir:

1. tarea cerrada,
2. verificación ejecutada,
3. evidencia en roadmap,
4. impacto identificado,
5. commit semántico.

## Tipo de cambio

### PATCH

Usar PATCH para:

- validaciones,
- configuración,
- CI/CD,
- lint,
- typecheck,
- documentación menor,
- cierres de tareas sin cambio funcional.

Ejemplo:

```txt
1.3.0 → 1.3.1