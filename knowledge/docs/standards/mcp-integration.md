# Estándar: Integración de Herramientas Externas (MCP)

## Propósito
Definir el marco de trabajo para el uso del **Model Context Protocol (MCP)**, permitiendo que los agentes interactúen con herramientas externas (bases de datos, nubes, APIs) manteniendo la seguridad y la gobernanza.

## Principios Operativos
1. **Acceso Mínimo Requerido:** Los servidores MCP deben configurarse con permisos de solo lectura para inspección, requiriendo aprobación humana (HITL) para escrituras.
2. **Aislamiento de Entorno:** Las herramientas MCP deben respetar el contexto del proyecto y el aislamiento de datos (RLS).
3. **Auditabilidad:** Cada acción realizada a través de un servidor MCP debe quedar registrada en el "Thought Process" del agente.

## Catálogo de Herramientas Autorizadas
- **Postgres Inspector:** Para inspección de esquemas y validación de migraciones en Supabase.
- **Google Cloud Explorer:** Para gestión de recursos en GCP (Storage, Logs).
- **Stitch MCP:** Para la generación de identidad visual y componentes UI.

## Guardrails de Seguridad
- Prohibido el uso de herramientas MCP para borrar bases de datos o buckets de producción.
- Las API Keys y credenciales de los servidores MCP deben gestionarse mediante variables de entorno, nunca en el archivo JSON de configuración.
