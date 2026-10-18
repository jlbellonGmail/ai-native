# Sistema de Ayuda y Documentación Viva

Este documento define el **Sistema de Ayuda, Documentación y Aprendizaje Continuo** del proyecto.
Su objetivo es garantizar que **usuarios, desarrolladores y agentes de IA** puedan comprender, usar y evolucionar el sistema sin fricción.

---

## 1. Principio General

* Toda funcionalidad visible para el usuario **DEBE** contar con ayuda asociada.
* Toda vista, formulario o flujo interactivo **DEBE** incluir acceso a ayuda contextual.
* La ayuda es parte del producto, **no un agregado opcional**.
* Si una funcionalidad no puede explicarse con claridad, **no está terminada**.

---

## 2. Tipos de Ayuda (Modelo en Capas)

El sistema de ayuda se organiza en **capas complementarias**, no en un único archivo.

### 2.1 Ayuda Contextual (UI Help)

* Accesible desde la interfaz mediante:

  * Botón “?”
  * Tooltip
  * Enlace “¿Cómo funciona?”
* Responde a:

  * Qué hace esta pantalla
  * Cómo usarla
  * Qué esperar como resultado
* Ubicación:

  ```
  docs/tutorials/ui_help/
  ```

---

### 2.2 Ayuda de Uso Guiado (Tutoriales)

* Explica flujos completos paso a paso.
* Orientada a usuarios finales y operadores.
* Incluye ejemplos simples y lenguaje no técnico.
* Ubicación:

  ```
  docs/tutorials/ui_help/
  ```

---

### 2.3 Ayuda Técnica / Desarrollo (Dev Help)

* Orientada a desarrolladores, integradores y agentes.
* Explica:

  * reglas
  * decisiones de diseño
  * límites del sistema
* Ubicación:

  ```
  docs/tutorials/dev_help/
  ```

---

### 2.4 Documentación Explicativa (Sistema)

* Define **cómo funciona el sistema de ayuda en sí**.
* Es normativa y estructural.
* Cambia con poca frecuencia.
* Ubicación:

  ```
  docs/explanation/HELP_SYSTEM.md
  ```

---

## 3. Estructura y Convenciones de Archivos

### 3.1 Convención de nombres

* Archivos en minúsculas
* Separados por guiones
* Descriptivos y específicos

Ejemplos correctos:

* `cliente-alta.md`
* `ticket-creacion.md`
* `catalogo-productos.md`

Ejemplos incorrectos:

* `ayuda.md`
* `doc1.md`
* `pantalla.md`

---

### 3.2 Contenido mínimo de cada archivo de ayuda

Todo archivo de ayuda debe responder explícitamente:

1. **Qué es**
2. **Para qué sirve**
3. **Cómo se usa**
4. **Qué no hace / límites**
5. **Errores comunes o advertencias (si aplica)**

---

## 4. Obligaciones del Agente (Reglas Inviolables)

Todo agente de IA que modifique el sistema debe:

* Crear o actualizar ayuda en:

  ```
  docs/tutorials/ui_help/
  ```

  para funcionalidades visibles al usuario.

* Crear o actualizar ayuda en:

  ```
  docs/tutorials/dev_help/
  ```

  para cambios técnicos, reglas o arquitectura.

* Usar nombres de archivos claros y específicos.

* No introducir **ninguna feature sin ayuda documentada**.

* Verificar que la ayuda:

  * sea clara
  * esté alineada con el comportamiento real del sistema
  * no exponga detalles técnicos innecesarios al usuario final

👉 **Una feature sin ayuda se considera incompleta.**

---

## 5. Accesibilidad de la Ayuda

La ayuda debe ser:

* Accesible **desde la UI**
* Visible **sin salir del producto**
* Comprensible por usuarios no técnicos
* Escrita en lenguaje claro y directo
* Libre de jerga innecesaria

Cuando exista conflicto:

* Priorizar claridad sobre exhaustividad
* Priorizar comprensión sobre precisión técnica extrema

---

## 6. Sistema de Índice y Navegación

* `docs/help_index.md` actúa como **punto de entrada** al sistema de ayuda.
* Debe:

  * listar las categorías de ayuda
  * enlazar a los tutoriales principales
  * orientar rápidamente al lector
* No debe contener explicaciones largas ni reglas internas.

---

## 7. Regla de Versionado

* Toda ayuda se versiona **junto con el código**.
* No se permite documentación “por fuera” del repositorio.
* Cambios funcionales ⇒ cambios en ayuda.
* La rama `main` siempre debe reflejar:

  * código
  * ayuda
  * documentación coherente entre sí.

---

## 8. Regla de Calidad (Definición de Ayuda Válida)

Una ayuda se considera válida si:

* Refleja el comportamiento real del sistema.
* Puede ser entendida sin contexto previo.
* No requiere intervención humana adicional para su uso normal.
* Puede ser utilizada tanto por humanos como por agentes de IA.

---

## 9. Principio de Aprendizaje Continuo

El sistema de ayuda es una **wiki viva**:

* Evoluciona con el producto.
* Se mejora con feedback real.
* Es una fuente de verdad operativa.
* Reduce dependencia de soporte humano.

---

## 10. Regla Final (No Negociable)

> **Si algo no puede explicarse claramente, no está listo para producción.**

