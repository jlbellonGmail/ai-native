# Application Layer Rules

La capa de aplicación contiene los casos de uso del sistema.

Los casos de uso coordinan la lógica del dominio.

---

# Responsabilidad

Application debe:

- orquestar operaciones del sistema
- coordinar entidades de dominio
- llamar a servicios de dominio
- interactuar con infraestructura mediante interfaces

---

# Qué NO debe hacer

Application no debe:

- contener lógica de negocio compleja
- acceder directamente a bases de datos
- llamar APIs externas directamente

Eso pertenece a infrastructure.

---

# Casos de uso

Cada caso de uso debe:

- representar una operación del sistema
- tener una única responsabilidad
- ser fácilmente testeable

Ejemplos:

CreateUser  
ProcessOrder  
GenerateReport  

---

# Interacción con infraestructura

Application interactúa con infrastructure mediante interfaces.

Nunca debe depender directamente de implementaciones concretas.

---

# Flujo típico de un caso de uso

1. recibir input
2. validar datos básicos
3. invocar dominio
4. llamar adaptadores si es necesario
5. devolver resultado