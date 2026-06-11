# Infrastructure Layer Rules

Esta capa contiene implementaciones técnicas del sistema.

Ejemplos:

- APIs
- acceso a base de datos
- integraciones externas
- adaptadores

---

# Principio fundamental

Infrastructure implementa detalles técnicos.

No debe contener lógica de negocio.

---

# Adaptadores

Cada integración externa debe implementarse como un adaptador.

Ejemplos:

- StripeAdapter
- SupabaseAdapter
- EmailAdapter

---

# Regla de interfaces

Todo adaptador debe implementar una interfaz definida en el dominio o en application.

Esto permite reemplazar implementaciones sin romper el sistema.

---

# Manejo de credenciales

Está PROHIBIDO:

- usar credenciales en texto plano
- hardcodear claves

Siempre utilizar:

variables de entorno

---

# Manejo de errores

Las fallas de servicios externos deben convertirse en errores controlados.

Nunca propagar excepciones técnicas al dominio.

---

# Seguridad

Las implementaciones que manejan datos sensibles deben respetar las políticas de seguridad del proyecto.

Si el sistema utiliza multi-tenancy, los adaptadores deben respetar el aislamiento de datos.