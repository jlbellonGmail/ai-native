# `v3.0.0-rc.2`: publicada (2026-10-05)

`v3.0.0-rc.1` (`0ffe68d`) está publicada y verificada. Después de ella cambió código de plataforma (arreglo del rollback con finales de línea CRLF, guarda del ruleset del migrador, `migrate bump`, endurecimiento de lecturas de archivos, verificador externo de releases). Ese código **no** está en rc.1, y el informe PLATFORM sobre `5a60072` no cubre un commit que lo contenga. Por eso `rc.2` exigió su propia auditoría: `.audit/reports/AUDIT-PLATFORM-3477428.md` (93.0/100, 0 BLOCKER/CRITICAL/MAJOR, 8 MINOR abiertos). `v3.0.0-rc.2` se publicó sobre `51ef185` (merge de la PR #58, solo `.audit/**` respecto al SHA auditado).

## Condiciones de publicación (todas, en este orden)

| # | Condición | Estado |
|---|---|---|
| 1 | PR #55 mergeada (`fix/migrate-revert-crlf`) | PASS (`35ee716`) |
| 2 | PR #56 mergeada (`feat/migrate-ruleset-check-guard`) | PASS (`6b7998e`) |
| 3 | PR de higiene mergeada (alerta #10, matriz de calidad, verificador de releases, análisis de warnings) | PASS (#57, `3477428`) |
| 4 | `main` verde (CI, CodeQL, Trivy, SBOM, supply chain) | PASS (6 workflows en success sobre `3477428` y sobre `51ef185`) |
| 5 | Re-análisis de CodeQL cerró la alerta #10 (`fixed`) | PASS (`fixed_at` 2026-10-05T14:36:20Z, análisis de `6b7998e`) |
| 6 | **Auditoría PLATFORM independiente nueva** sobre el SHA de `main`, informe en `.audit/reports/`, score ≥ 88 (objetivo 90) | PASS (93.0 sobre `3477428`) |
| 7 | PR de solo informe mergeada (la diferencia con el SHA auditado toca solo `.audit/**`) | PASS (#58, `51ef185`, merge humano) |
| 8 | `node runtime/audit/cli.mjs release-gate --profile PLATFORM --candidate <merge commit> --root .` → PASS | PASS_WITH_WARNINGS (el informe de rc.1 queda STALE, el nuevo es válido) |
| 9 | Tag `v3.0.0-rc.2` anotado sobre ese merge commit | PASS (tag anotado sobre `51ef185`) |
| 10 | Workflow `Release` (build → publish → verify) en success | PASS (runs 37346705404 y 37346705885) |
| 11 | `node scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit <sha>` → PASS | PASS (22 checks) |

`release.yml` ya bloquea el tag si el commit no está en `main`, si no hay un CI verde para ese SHA, si el audit gate falla (rc y estable) o si el bundle construido dos veces no es idéntico byte a byte. No se publica nada sin tag; las PRs solo ejecutan `build` como ensayo.

## Verificación externa

```bash
node scripts/verify-release.mjs v3.0.0-rc.2 --expect-commit <40-hex>
```

Comprueba (como un consumidor, sin confiar en el árbol local): tag → commit, release publicado e **inmutable**, assets, `SHA256SUMS`, digest de `platform.json` contra el tarball, `gh attestation verify` de cada asset y offline con el bundle sigstore, rechazo de una atestación de **otro** repositorio, SBOM CycloneDX, `revocations-N.json` igual al del repositorio y sin entrada para esta versión, y un consumidor real: `init` → `sync --require-attestation` (descarga del release público) → `doctor` → `run version` → `status --check` (revocación `CHECKED`). Salida distinta de 0 si algo falla. Probado contra `v3.0.0-rc.1` (21 checks PASS) y contra `v3.0.0-rc.2` (22 checks PASS; el check extra es `--expect-commit`) y con casos negativos (commit esperado erróneo, tag inexistente).

## Camino de actualización y de vuelta (rc.1 → rc.2)

Actualizar un consumidor:

```bash
node runtime/migrate/migrate.mjs bump --target <consumidor> --version v3.0.0-rc.2 --commit <sha-rc2> --digest sha256:<digest-rc2> --repo github:jlbellonGmail/ai-native
```

Si el lock del consumidor tiene `platform.channel = "stable"`, `bump` se niega a fijar un prerelease: hay que poner `"rc"` explícitamente antes. Cambia exactamente `ai-native.lock.json` y el pin SHA del caller L3 (dos archivos, una PR). El L3 de esa PR descarga rc.2, verifica su sha256 contra el lock **antes** de cachear y exige la atestación. `sync` devuelve `RESTART_REQUIRED` si el código del bootstrap cambió entre versiones.

Volver a rc.1: `node runtime/bootstrap/cli.mjs rollback` re-fija el lock a la versión anterior usando solo la caché (PAR-ROLLBACK-OFFLINE); se niega si hay `runs/**/events.jsonl` con un `schemaVersion` que rc.1 no lee (`--force` lo permite con aviso). Ejecutado de verdad (2026-10-05, proyecto temporal con caché aislada): `init` con rc.1 → `sync --require-attestation` → `status --check` READY (rc.1) → `channel = rc` → `migrate bump` a rc.2 → `sync --require-attestation` descarga rc.2 del release público (`restartRequired: true`) → `doctor` PASS → `run version` imprime `v3.0.0-rc.2 51ef185…` → `status --check` READY (rc.2, revocación CHECKED) → `rollback` a rc.1 PASS (solo caché) → `status --check` READY (rc.1). Observación menor, no corregida: el detalle del check `active release` de `doctor` dice `active sha256:X != lock sha256:X; run sync` con dos hashes idénticos (`ok: true`).

## Notas de la release

> **v3.0.0-rc.2**: segunda release candidata de AI-Native v3.
> - `migrate revert` ya no trata la conversión LF→CRLF de `core.autocrlf=true` como edición del usuario (rollback limpio en Windows).
> - `migrate plan/apply` avisan antes de escribir (`RULESET_REQUIRED_CHECK_WILL_DISAPPEAR`) cuando un workflow retirado produce un check que el ruleset del consumidor exige; nunca editan un ruleset.
> - Nuevo `migrate bump` (actualización de dos archivos).
> - Lecturas de archivos sin carrera comprobar-y-usar (`fs-safe`); mensaje de `sync` sin caché accionable.
> - Verificación: `gh attestation verify ai-native-v3.0.0-rc.2.tar.gz --repo jlbellonGmail/ai-native`; `node scripts/verify-release.mjs v3.0.0-rc.2`.
> - Límites conocidos: F2 (un solo maintainer, `required_approving_review_count = 0`); revocación de claves antiguas de `ai-native-trust` pendiente de confirmación humana; OpenCode MCP `NOT_AVAILABLE_FROM_TOOL`.

## El canary frente a rc.2

La PR #4 de `template-starter` estaba lista sobre rc.1; se llevó a rc.2 y se mergeó (ver `governance/canary/`). Como el rollback con CRLF solo es limpio con el código de #55, lo recomendable es **fijar el canary en rc.2** (`bump`, PR de dos archivos) antes de mergearlo, para que el consumidor adopte una plataforma cuyo `revert` funciona en cualquier checkout. Si se mergea sobre rc.1, el rollback sigue funcionando ejecutando el migrador desde un checkout de la plataforma que incluya #55, que es como se probó en el canary (el migrador no vive en el consumidor); lo que cambia es que el lock del consumidor apuntaría a una versión con el defecto.

## Límites

No publica `v3.0.0` estable, no modifica `VERSION` (la versión de la plataforma es la del tag; `VERSION` de la raíz es `3.0.0-dev`), no toca rulesets de `ai-native` ni los repos GI, y no declara PASS ningún pendiente (F2, revocación de claves antiguas de `ai-native-trust`, OpenCode MCP, L2 real con agente, P1–P45 individuales).
