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

- `RULESET_REQUIRED_CHECK_WILL_DISAPPEAR` (error): el check requerido solo lo producía un workflow retirado. `plan` falla y `apply` se **niega** salvo `--accept-ruleset-change`; con esa opción el `apply` se ejecuta, termina con código 0 y los hallazgos quedan como avisos marcados `[ACCEPTED with --accept-ruleset-change]`.
- `RULESET_WORKFLOW_UNREADABLE` (error si es un workflow retirado; aviso si es uno que se queda): no se pudieron leer **todos** los jobs (ninguno, o líneas que no se entienden: ids entre comillas, anclas YAML, sangrado raro). No se asume que sea inocuo; un workflow que se queda y no se lee **no** cuenta como fuente de ningún check.
- `RULESET_REQUIRED_CHECK_UNKNOWN_SOURCE` (aviso): ningún workflow del árbol que se ejecute en PRs explica el check (¿una app externa?); nunca se da por seguro.
- `RULESET_NOT_CHECKED` (aviso): se usó `--skip-ruleset-check`.

La acción recomendada es **cambiar el ruleset del consumidor**: sustituir cada check desaparecido por el check canónico `l3 / l3-consumer` (que produce el caller L3 generado). No añadir jobs ficticios con el nombre antiguo ni conservar el CI v2 solo para que los nombres coincidan: ese workflow depende de `tests/` y `scripts/`, que la migración retira. **La herramienta nunca edita un ruleset**: es una decisión humana del dueño del repositorio.

Límites de la heurística (el nombre de los checks se deduce leyendo `jobs:` por líneas; no es un intérprete de YAML):

- Para decidir que un check **sobrevive** es conservadora: solo cuentan los workflows disparados por `pull_request`/`pull_request_target` **sin filtro `paths`/`paths-ignore`** en ninguna parte del bloque `on:` (con cualquier sangrado, en formato flujo o con la clave entre comillas; ante la duda se considera que lo tiene) (el filtro `branches` de `pull_request` es sobre la rama base y se admite). No cuentan: un job cuyo `name:` es solo una expresión (`${{ … }}`, puede ser cualquier cosa), un workflow disparado solo por `push` (no corre en PRs de forks y suele llevar filtro de ramas), `schedule`, `workflow_dispatch`, `workflow_call` o `workflow_run`, ni uno que no se puede leer. Esto puede **sobre-informar** que un check desaparece (se resuelve con `--accept-ruleset-change` tras decidir). Ocultar uno que sí desaparece es lo que la guarda intenta evitar, pero **no es una garantía** (heurística de texto). Un job con `if:` que se omite sigue reportando (como `skipped`) y se cuenta como fuente.
- Una matriz o una expresión con texto literal se comparan como patrón (`nombre (valores)`).
- Un workflow retirado leído solo en parte es un error, no un aviso: ids entre comillas, anclas, sangrado raro, tabuladores, `jobs:` en formato flujo y un `name:` en bloque (`>`, `|`) o con alias.

## Rollback

`revert` restaura desde el commit base registrado en el journal (`.ai-native/migration-journal.json`) y elimina solo lo que `apply` creó, si el usuario no lo editó después. Una edición real se conserva y el resultado es `PARTIAL` (se puede reintentar). Un cambio solo de finales de línea (`LF`↔`CRLF`, `core.autocrlf=true` en Windows) **no** cuenta como edición. *Esto lo corrige la PR #55; las versiones anteriores, incluida `v3.0.0-rc.1`, lo tratan como edición y dejan el rollback en `PARTIAL` en esos checkouts.*

## Actualizar después de migrar

```bash
node runtime/migrate/migrate.mjs bump --target <repo> --version v3.0.0-rc.2 --commit <40-hex> --digest sha256:<64-hex> [--repo github:<owner>/ai-native] [--caller-sha <40-hex>] [--dry-run]
```

`bump` cambia **exactamente** el lock y el pin del caller L3 (PAR-BUMP-FOOTPRINT), por defecto al commit del release; no cambia el canal; rechaza un pre-release desde el canal `stable` y rechaza volver a fijar la versión ya fijada. `--caller-sha` (por defecto `--commit`) debe ser un SHA completo de 40 hex. Si no existe `.github/workflows/ai-native.yml`, solo cambia el lock y lo avisa. Con `--dry-run` no escribe nada. El bump va en una PR de dos archivos; el L3 de esa PR la valida contra el release nuevo.
