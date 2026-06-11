## Patrones para Tests Unitarios (TDD)

- Todo caso de uso debe tener al menos un test unitario asociado.
- El dominio debe testearse sin dependencias externas.
- Prohibido mockear el dominio.

## Cobertura Mínima Obligatoria

- Dominio: ≥ 90%
- Application (use-cases): ≥ 80%
- Infrastructure: tests de integración críticos

## Regla de Falla

- Si un test falla, está prohibido continuar con nuevas features.
- El agente debe corregir o revertir antes de avanzar.