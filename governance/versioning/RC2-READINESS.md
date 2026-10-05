# `v3.0.0-rc.2`: preparación (NO publicada)

`v3.0.0-rc.1` (`0ffe68d`) está publicada y verificada. Después de ella cambió código de plataforma (arreglo del rollback con finales de línea CRLF, guarda del ruleset del migrador, `migrate bump`, endurecimiento de lecturas de archivos, verificador externo de releases). Ese código **no** está en rc.1, y el informe PLATFORM sobre `5a60072` no cubre un commit que lo contenga. Por eso `rc.2` exige su propia auditoría.

## Condiciones de publicación (todas, en este orden)

| # | Condición | Estado |
|---|---|---|
| 1 | PR #55 mergeada (`fix/migrate-revert-crlf`) | PENDING_HUMAN |
| 2 | PR #56 mergeada (`feat/migrate-ruleset-check-guard`) | PENDING_HUMAN |
| 3 | PR de higiene mergeada (alerta #10, matriz de calidad, verificador de releases, análisis de warnings) | PENDING_HUMAN |
| 4 | `main` verde (CI, CodeQL, Trivy, SBOM, supply chain) | tras 1–3 |
| 5 | Re-análisis de CodeQL cerró la alerta #10 (`fixed`) | tras 3 |
| 6 | **Auditoría PLATFORM independiente nueva** sobre el SHA de `main`, informe en `.audit/reports/`, score ≥ 88 (objetivo 90) | PREPARED |
| 7 | PR de solo informe mergeada (la diferencia con el SHA auditado toca solo `.audit/**`) | PENDING_HUMAN |
| 8 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate <merge commit> --root .` → PASS | tras 7 |
| 9 | Tag `v3.0.0-rc.2` anotado sobre ese merge commit | tras 8 |
| 10 | Workflow `Release` (build → publish → verify) en success | tras 9 |
| 11 | `node scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit <sha>` → PASS | tras 10 |

`release.yml` ya bloquea el tag si el commit no está en `main`, si no hay un CI verde para ese SHA, si el audit gate falla (rc y estable) o si el bundle construido dos veces no es idéntico byte a byte. No se publica nada sin tag; las PRs solo ejecutan `build` como ensayo.

## Verificación externa

```bash
node scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit <40-hex>
```

Comprueba (como un consumidor, sin confiar en el árbol local): tag → commit, release publicado e **inmutable**, assets, `SHA256SUMS`, digest de `platform.json` contra el tarball, `gh attestation verify` de cada asset y offline con el bundle sigstore, rechazo de una atestación de **otro** repositorio, SBOM CycloneDX, `revocations-N.json` igual al del repositorio y sin entrada para esta versión, y un consumidor real: `init` → `sync --require-attestation` (descarga del release público) → `doctor` → `run version` → `status --check` (revocación `CHECKED`). Salida distinta de 0 si algo falla. Probado contra `v3.0.0-rc.1` (22/22 PASS) y con casos negativos (commit esperado erróneo, tag inexistente).

## Camino de actualización y de vuelta (rc.1 → rc.2)

Actualizar un consumidor:

```bash
node runtime/migrate/migrate.mjs bump --target <consumidor> --version v3.0.0-rc.2 --commit <sha-rc2> --digest sha256:<digest-rc2> --repo github:jlbellonGmail/ai-native
```

Cambia exactamente `ai-native.lock.json` y el pin SHA del caller L3 (dos archivos, una PR). El L3 de esa PR descarga rc.2, verifica su sha256 contra el lock **antes** de cachear y exige la atestación. `sync` devuelve `RESTART_REQUIRED` si el código del bootstrap cambió entre versiones.

Volver a rc.1: `node runtime/bootstrap/cli.mjs rollback` re-fija el lock a la versión anterior usando solo la caché (PAR-ROLLBACK-OFFLINE); se niega si hay `runs/**/events.jsonl` con un `schemaVersion` que rc.1 no lee (`--force` lo permite con aviso). Estado: la ruta con la caché está probada; **la ejecución real rc.1 → rc.2 queda por hacer cuando rc.2 exista**.

## Notas de la release (borrador)

> **v3.0.0-rc.2**: segunda release candidata de AI-Native v3.
> - `migrate revert` ya no trata la conversión LF→CRLF de `core.autocrlf=true` como edición del usuario (rollback limpio en Windows).
> - `migrate plan/apply` avisan antes de escribir (`RULESET_REQUIRED_CHECK_WILL_DISAPPEAR`) cuando un workflow retirado produce un check que el ruleset del consumidor exige; nunca editan un ruleset.
> - Nuevo `migrate bump` (actualización de dos archivos).
> - Lecturas de archivos sin carrera comprobar-y-usar (`fs-safe`); mensaje de `sync` sin caché accionable.
> - Verificación: `gh attestation verify ai-native-v3.0.0-rc.2.tar.gz --repo jlbellonGmail/ai-native`; `node scripts/verify-release.mjs v3.0.0-rc.2`.
> - Límites conocidos: F2 (un solo maintainer, `required_approving_review_count = 0`); revocación de claves antiguas de `ai-native-trust` pendiente de confirmación humana; OpenCode MCP `NOT_AVAILABLE_FROM_TOOL`.

## El canary frente a rc.2

La PR #4 de `template-starter` está lista sobre rc.1. Como el rollback con CRLF solo es limpio con el código de #55, lo recomendable es **fijar el canary en rc.2** (`bump`, PR de dos archivos) antes de mergearlo, para que el consumidor adopte una plataforma cuyo `revert` funciona en cualquier checkout. Si se mergea sobre rc.1, el rollback sigue funcionando ejecutando el migrador desde un checkout de la plataforma que incluya #55, que es como se probó en el canary (el migrador no vive en el consumidor); lo que cambia es que el lock del consumidor apuntaría a una versión con el defecto.

## Qué NO hace esta preparación

No publica rc.2, no modifica `VERSION` (la versión de la plataforma es la del tag; `VERSION` de la raíz es `3.0.0-dev`), no toca rulesets de `ai-native` ni los repos GI, y no declara PASS ninguna condición pendiente.
