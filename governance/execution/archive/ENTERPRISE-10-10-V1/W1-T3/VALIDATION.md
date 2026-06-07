# Validation

## Validacion real

Validacion end-to-end sobre `ai-foundation` con `pnpm sbom` como ruta principal.

### Comandos ejecutados

1. `D:\\tools-ai\\npm\\pnpm.cmd sbom --sbom-format cyclonedx --sbom-spec-version 1.7 --sbom-type application --lockfile-only > C:\\Users\\jlbel\\AppData\\Local\\Temp\\ai-native-w1-t3-pnpm\\run-1\\ai-foundation-sbom.cdx.json`
2. `D:\\tools-ai\\npm\\pnpm.cmd sbom --sbom-format cyclonedx --sbom-spec-version 1.7 --sbom-type application --lockfile-only > C:\\Users\\jlbel\\AppData\\Local\\Temp\\ai-native-w1-t3-pnpm\\run-2\\ai-foundation-sbom.cdx.json`
3. Carga de ambos SBOM con `ConvertFrom-Json`.
4. Normalizacion excluyendo `timestamp` y `serialNumber`.
5. Comparacion de hashes normalizados con `SHA256`.

### Resultados

- Generacion exitosa: `true`
- Formato CycloneDX: `true`
- `specVersion`: `1.7`
- Components presentes: `146`
- Dependencies presentes: `147`
- Reproducibilidad normalizada: `true`
- Hash normalizado run 1: `35AEC21B6DF806E18B21AD25CDC107760D2031A3208C8A12116CAD3E7950D8B5`
- Hash normalizado run 2: `35AEC21B6DF806E18B21AD25CDC107760D2031A3208C8A12116CAD3E7950D8B5`
- Consistencia con `package.json`: parcial
- Consistencia con `pnpm-lock.yaml`: validada a nivel de generacion y grafo de dependencias

### Observaciones tecnicas

- El `package.json` no define `name`; observacion no bloqueante.
- `pnpm sbom --lockfile-only` no garantiza equivalencia 1:1 con dependencias directas en la forma de exposicion del SBOM.
- La comparación normalizada sí resultó idéntica entre corridas.
- La validación real fue satisfactoria para el objetivo de W1-T3.

### Estado

- Validacion real completada.
- Resultado aprobado.
- No se actualizo roadmap.
- No se actualizo SESSION-CONTEXT.
- No se archivo.
- No se versiono.
