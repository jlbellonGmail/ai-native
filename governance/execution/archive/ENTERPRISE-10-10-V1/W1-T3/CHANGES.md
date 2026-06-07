# Changes

## W1-T3

- Se actualizo `ai-foundation/.github/workflows/sbom.yml` para usar `pnpm sbom` como ruta principal.
- Se mantuvo `cdxgen` como fallback documentado.
- Se definio salida temporal fuera del repo para SBOM y normalizacion.
- Se incorporo validacion normalizada eliminando `timestamp` y `serialNumber`.
- Se preservo el artifact CI unico `ai-foundation-sbom-cyclonedx-${{ github.sha }}`.
- Se registraron observaciones de validacion sobre `package.json` y el alcance de `pnpm sbom --lockfile-only`.

## Guardrails

- No se toco `governance/roadmaps/ENTERPRISE-10-10-ROADMAP.md`.
- No se toco `governance/SESSION-CONTEXT.md`.
- No se toco ningun `VERSION`.
- No se hizo commit.
- No se hizo push.
