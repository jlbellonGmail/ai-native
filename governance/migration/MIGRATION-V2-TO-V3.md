# Migración de un consumidor v2 (Template) a AI-Native v3

Guía operativa de `runtime/migrate/migrate.mjs`. Estado vigente; la evidencia del canary está en `governance/SESSION-CONTEXT.md`.

## Flujo

```bash
# 0. árbol limpio, en una rama nueva; el release v3 se identifica por SHA
R="--repo github:<owner>/ai-native --version v3.0.0-rc.1 --commit <40-hex> --digest sha256:<64-hex>"

node runtime/migrate/migrate.mjs plan   --target <repo> $R --consumer-repo <owner>/<consumer>   # solo lectura
node runtime/migrate/migrate.mjs apply  --target <repo> $R --consumer-repo <owner>/<consumer>   # escribe el árbol
git add -A && git commit && git push                                                            # UNA PR revisable
node runtime/migrate/migrate.mjs revert --target <repo>                                         # deshace exactamente lo aplicado
```

`plan` clasifica cada archivo con la Hash DB de Template: retira solo archivos de la plataforma **idénticos** a un tag de Template, añade `ai-native.lock.json`, los adaptadores v3 y el caller L3 (`.github/workflows/ai-native.yml`, fijado por SHA), y nunca toca `runs/`, `.audit/`, `ROADMAP.md`, `STATUS.md` ni `docs/producto/`. Una colisión con un archivo propio **bloquea** salvo `--keep <path>`.

## Guarda del ruleset (RULESET_REQUIRED_CHECK_WILL_DISAPPEAR)

`apply` retira, entre otros, `.github/workflows/ci.yml` del consumidor. Si el ruleset del consumidor **exige** un check que solo ese workflow producía, el check deja de reportarse y la PR de migración no se puede mergear nunca. Por eso `plan` y `apply` leen los checks requeridos **antes** de escribir nada:

| Origen de los checks requeridos | Opción |
|---|---|
| API de GitHub, vía `gh` | `--consumer-repo owner/name` (por defecto, el `origin` del `--target`) |
| Archivo guardado (respuesta de la API o un ruleset) | `--ruleset-file <json>` |
| Reconocer que no se comprobó | `--skip-ruleset-check` (queda como `RULESET_NOT_CHECKED`) |

Sin ninguna de las tres, el comando **falla cerrado** (`RULESET_UNREADABLE`).

Códigos de diagnóstico:

- `RULESET_REQUIRED_CHECK_WILL_DISAPPEAR` (error): el check requerido solo lo producía un workflow retirado. `apply` se **niega** salvo `--accept-ruleset-change`.
- `RULESET_WORKFLOW_UNREADABLE` (error): no se pudieron leer los jobs de un workflow retirado; no se asume que sea inocuo.
- `RULESET_REQUIRED_CHECK_UNKNOWN_SOURCE` (aviso): ningún workflow del árbol explica el check (¿una app externa?); nunca se da por seguro.
- `RULESET_NOT_CHECKED` (aviso): se usó `--skip-ruleset-check`.

La acción recomendada es **cambiar el ruleset del consumidor**: sustituir cada check desaparecido por el check canónico `l3 / l3-consumer` (que produce el caller L3 generado). No añadir jobs ficticios con el nombre antiguo ni conservar el CI v2 solo para que los nombres coincidan: ese workflow depende de `tests/` y `scripts/`, que la migración retira. **La herramienta nunca edita un ruleset**: es una decisión humana del dueño del repositorio.

Limitación: el nombre de los checks se deduce leyendo `jobs:` (id, `name:`, matrix, llamadas reutilizables). Es una heurística de las reglas de nombres de Actions, no un intérprete de YAML; una expresión o una matriz se comparan como patrón.

## Rollback

`revert` restaura desde el commit base registrado en el journal (`.ai-native/migration-journal.json`) y elimina solo lo que `apply` creó, si el usuario no lo editó después. Una edición real se conserva y el resultado es `PARTIAL` (se puede reintentar). Un cambio solo de finales de línea (`LF`↔`CRLF`, `core.autocrlf=true` en Windows) **no** cuenta como edición.

## Actualizar después de migrar

`runtime/migrate/bump.mjs` cambia exactamente el lock y el pin del caller (PAR-BUMP-FOOTPRINT); el canal no cambia y un pre-release se rechaza desde el canal estable.
