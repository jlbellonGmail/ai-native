

# Índice General de Ayuda y Documentación

Este documento es el **mapa central del sistema de ayuda y documentación viva** del proyecto.

Su objetivo es permitir que:
- Usuarios finales encuentren ayuda funcional sin fricción.
- Desarrolladores y agentes comprendan rápidamente dónde documentar y consultar.
- El sistema de IA pueda citar, enrutar y explicar correctamente el producto.

Este archivo **NO contiene la ayuda en sí**, sino que indica **dónde vive cada tipo de documentación** y **cuándo debe usarse**.

---

## 👤 Ayuda para Usuarios (UI Help)

Ayuda orientada a **usuarios finales**, escrita en lenguaje no técnico, accesible desde la interfaz del sistema mediante botones, tooltips o enlaces contextuales.

**Características:**
- Explica *qué hace* cada funcionalidad y *cómo usarla*.
- No expone detalles técnicos ni decisiones internas.
- Debe poder entenderse sin conocimientos previos del sistema.

📁 **Ubicación:**
```

docs/tutorials/ui_help/

```

📄 **Ejemplos de archivos esperados:**
- `catalogo-productos.md`
- `playground-ia.md`
- `tickets-soporte.md`
- `formulario-contacto.md`

📌 **Regla obligatoria:**  
Ninguna funcionalidad visible al usuario puede existir sin su ayuda correspondiente en esta carpeta.

---

## 🛠️ Ayuda Técnica y de Desarrollo (Dev Help)

Documentación dirigida a **desarrolladores, agentes de IA y equipo técnico**.

**Características:**
- Explica *cómo funciona* una feature internamente.
- Describe flujos, arquitectura, contratos y decisiones técnicas.
- Sirve como referencia para mantenimiento, debugging y escalado.

📁 **Ubicación:**
```

docs/tutorials/dev_help/

```

📄 **Ejemplos de archivos esperados:**
- `arquitectura-playground.md`
- `rls-supabase.md`
- `integracion-stripe.md`
- `estructura-hexagonal.md`

📌 **Regla obligatoria:**  
Toda feature nueva o modificada debe actualizar o crear su documentación técnica correspondiente.

---

## 📘 Documentación Explicativa del Sistema

Documentación **estratégica y conceptual** que define qué es el sistema, por qué existe y cómo debe evolucionar.

Esta documentación establece el **contrato intelectual del proyecto**.

📁 **Ubicación:**
```

docs/explanation/

```

📄 **Documentos clave:**
- `PRD.md` – Qué debe ser el producto y por qué.
- `MVP.md` – Alcance mínimo validable y criterios de éxito.
- `HELP_SYSTEM.md` – Contrato del sistema de ayuda y documentación viva.

📌 Esta documentación es la **fuente primaria de verdad** para agentes y decisiones de producto.

---

## 📚 Documentación de Referencia

Documentación normativa y operativa.  
Define *cómo se trabaja* y *qué hacer ante situaciones específicas*.

📁 **Ubicación:**
```

docs/reference/

```

📄 **Documentos típicos:**
- `CHECKLIST_INICIALIZACION_PROYECTOS_IA.md`
- `RECOVERY_SOP.md`
- Estándares, políticas y procedimientos.

📌 Esta documentación **no se interpreta**, se **ejecuta**.

---

## 🤖 Uso por Agentes de IA

Los agentes de IA deben utilizar este índice para:

- Determinar **dónde documentar** una nueva funcionalidad.
- Citar correctamente fuentes internas al generar respuestas.
- Evitar duplicación o contradicción de documentación existente.

📌 Ante dudas:
1. Consultar primero este índice.
2. Luego navegar a la carpeta correspondiente.
3. Si no existe documentación adecuada, **debe crearse antes de continuar**.

---

## 🔁 Versionado y Gobernanza

- Este archivo se versiona junto con el código.
- Cualquier cambio en la estructura documental debe reflejarse aquí.
- La coherencia entre este índice y la estructura real del repositorio es obligatoria.

---

**Estado:** Activo  
**Rol:** Punto de entrada único al sistema de ayuda y documentación viva  
