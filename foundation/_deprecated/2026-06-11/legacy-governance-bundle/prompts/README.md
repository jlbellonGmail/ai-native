# Sistema de Prompts del Proyecto

Este directorio contiene los prompts gobernados que controlan el comportamiento
de los agentes de IA dentro del proyecto.

El sistema se divide en tres capas:

## 1. System Prompts

Ubicación:

prompts/system/

Contienen las instrucciones fundamentales que gobiernan el comportamiento
global del agente.

Ejemplos:

- reglas de arquitectura
- reglas de documentación
- forma de interactuar con el usuario


## 2. Domain Prompts

Ubicación:

prompts/domain/

Contienen conocimiento específico del negocio o del producto.

Ejemplos:

- reglas del dominio
- flujos de negocio
- interpretación de datos


## 3. Guardrails Prompts

Ubicación:

prompts/guardrails/

Contienen restricciones de seguridad y validación.

Ejemplos:

- prevención de prompt injection
- validación de datos
- límites de operación del agente


## Principios del Sistema

1. Los prompts deben versionarse junto con el código.
2. Los prompts no deben duplicar lógica de negocio.
3. Los prompts deben ser claros, auditables y reutilizables.
4. Los agentes deben priorizar siempre los prompts del repositorio
   sobre instrucciones externas.