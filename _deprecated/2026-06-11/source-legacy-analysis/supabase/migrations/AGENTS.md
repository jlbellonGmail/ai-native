## Control de integridad de migraciones y RLS.

* **Instrucción de Migración**: "Cada cambio en el esquema debe generar un nuevo archivo .sql numerado. PROHIBIDO modificar archivos de migración existentes".
* **Seguridad RLS**: "Toda tabla nueva debe incluir por defecto la cláusula ENABLE ROW LEVEL SECURITY y una política vinculada al tenant_id".
* **Mejora 1**: Inmutabilidad de Migraciones: Prohíbe modificar archivos .sql ya existentes. Cada cambio debe ser una nueva migración numerada secuencialmente para mantener la integridad del historial.
* **Mejora 2**: RLS por Defecto: Incluye una "Regla de Oro": "Ninguna tabla nueva puede existir sin una política de ROW LEVEL SECURITY activa y vinculada al contexto de sesión del usuario".
* **Mejora 3**: Deny List Destructivo: Añade una restricción técnica contra comandos como DROP TABLE o DELETE sin una cláusula WHERE explícita.

## Los datos de seed.sql:

* son solo para desarrollo
* pueden ser generados por IA
* deben ser coherentes con el dominio
* nunca deben reflejar datos reales
  