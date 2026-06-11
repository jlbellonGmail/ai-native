# Estándar: Testing por Analogía 

## Filosofía

La IA no debe inventar estructuras de prueba. Debe replicar el "Patrón Maestro" de este documento, sustituyendo únicamente la entidad del dominio.

## Patrón Maestro (Ejemplo de Aislamiento RLS)typescript

import { describe, it, expect } from 'vitest';

describe('MANDATO: Aislamiento de Datos (Red-Team Test)', () => {
it('debe denegar acceso a datos ajenos incluso con JWT válido', async () => {
// 1. Simular sesión de Tenant_A
// 2. Intentar leer registros pertenecientes a Tenant_B
// 3. Resultado esperado: Lista vacía o Error de Política RLS

const result = await repository.find_all_by_tenant('TENANT_B_ID');
expect(result).toHaveLength(0);
});
});


## Reglas de Oro
- **No Mockear el Dominio:** El núcleo del negocio se testea puro.
- **Aislamiento Total:** Cada test debe verificar que los datos de un cliente nunca sean visibles para otro.
- **Validación de Casing:** Los tests deben fallar si encuentran variables en `camelCase`.