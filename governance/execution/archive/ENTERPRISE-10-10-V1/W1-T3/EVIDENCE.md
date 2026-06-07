# Evidence

## Implementacion

- Workflow SBOM actualizado en `ai-foundation/.github/workflows/sbom.yml`.
- Ruta principal definida con `pnpm sbom`.
- Fallback `cdxgen` mantenido como contingencia documentada.
- Artifact CI definido con nombre unico por SHA.
- Validacion normalizada incluida en el workflow.

## Evidencia disponible

- `governance/execution/current/SUMMARY.md`
- `governance/execution/current/VALIDATION.md`
- `governance/execution/current/CHANGES.md`
- `ai-foundation/.github/workflows/sbom.yml`

## Validacion real

- Directorio temporal: `C:\Users\jlbel\AppData\Local\Temp\ai-native-w1-t3-pnpm`
- Run 1: `C:\Users\jlbel\AppData\Local\Temp\ai-native-w1-t3-pnpm\run-1\ai-foundation-sbom.cdx.json`
- Run 2: `C:\Users\jlbel\AppData\Local\Temp\ai-native-w1-t3-pnpm\run-2\ai-foundation-sbom.cdx.json`
- Hash normalizado run 1: `35AEC21B6DF806E18B21AD25CDC107760D2031A3208C8A12116CAD3E7950D8B5`
- Hash normalizado run 2: `35AEC21B6DF806E18B21AD25CDC107760D2031A3208C8A12116CAD3E7950D8B5`
- `bomFormat`: `CycloneDX`
- `specVersion`: `1.7`
- `components`: `146`
- `dependencies`: `147`
- Estado de consistencia con `package.json`: parcial
- Estado de consistencia con `pnpm-lock.yaml`: validado por la generación
- Observaciones registradas:
  - `package.json` sin campo `name`.
  - `pnpm sbom --lockfile-only` no garantiza equivalencia 1:1 con dependencias directas.
  - Reproducibilidad normalizada aprobada.

## Ubicacion del artifact CI

- `ai-foundation-sbom-cyclonedx-${{ github.sha }}`

## Alcance

- Solo W1-T3.
- No se cerro la tarea.
- No se actualizo roadmap.
- No se actualizo SESSION-CONTEXT.
- No se versiono.
