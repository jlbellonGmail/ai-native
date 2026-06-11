# Naming Conventions & Code Style

---

## 1. Estructura de Archivos y Carpetas
Los nombres de **archivos y carpetas** deben:
* Utilizar minúsculas y separar palabras con guiones (**kebab-case**).
* *Ejemplo: `auth-service.js`, `user-profile/`*

## 2. Variables y Funciones (Código)
Para garantizar legibilidad y compatibilidad con el Agente de IA:
* **Naming**: Todas las variables y nombres de funciones deben usar **snake_case**.
* **Restricción**: Prohibido el uso de `camelCase` en código propio.
* **Excepción**: Solo se permite `camelCase` para interactuar con librerías externas (ej. `useEffect`, `map`, props de APIs).

## 3. Documentación Obligatoria (JSDoc)
Cada función debe ser autodescriptiva. Antes de finalizar una tarea, el Agente debe validar:
* **Encabezado JSDoc**: Toda función nueva requiere un bloque descriptivo encima.
* **Contenido**: Breve descripción de la lógica, parámetros (`@param`) y retorno (`@returns`).

```javascript
/**
 * Valida el estado de la conexión a la base de datos.
 * @returns {boolean} True si la conexión está activa.
 */
function check_db_status() { ... }