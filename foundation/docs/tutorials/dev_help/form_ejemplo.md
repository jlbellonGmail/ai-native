# Ejemplo de Documentación de Formulario (Desarrollo)

Este documento muestra un ejemplo de cómo documentar un formulario desde la perspectiva técnica.

Su objetivo es servir como guía para desarrolladores que necesiten describir interfaces y casos de uso.

Este ejemplo es únicamente ilustrativo y no corresponde a una funcionalidad real del framework.

---

# Formulario: Alta de Cliente

Entidad relacionada:

Client

Caso de uso asociado:

CreateClient

---

# Campos del Formulario

| Campo | Tipo   | Obligatorio | Descripción                     |
| ----- | ------ | ----------- | ------------------------------- |
| name  | string | sí          | Nombre completo del cliente     |
| email | string | sí          | Dirección de correo electrónico |
| phone | string | no          | Número de teléfono              |

---

# Validaciones

- El email debe tener formato válido
- El nombre no puede estar vacío
- El email debe ser único

---

# Flujo del Caso de Uso

1. Usuario completa el formulario
2. Sistema valida datos
3. Se ejecuta el caso de uso `CreateClient`
4. Se guarda el cliente
5. Se confirma la operación al usuario

---

# Errores Posibles

| Error           | Descripción             |
| --------------- | ----------------------- |
| INVALID_EMAIL   | Email no válido         |
| REQUIRED_FIELD  | Campo obligatorio vacío |
| DUPLICATE_EMAIL | El email ya existe      |

---

# Notas para Desarrollo

Este tipo de documentación permite:

- comprender el comportamiento del formulario
- conectar UI con casos de uso
- facilitar mantenimiento del sistema
  

  