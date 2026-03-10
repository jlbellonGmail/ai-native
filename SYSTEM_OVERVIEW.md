# System Overview

Este documento describe el sistema de forma resumida.

---

# Tipo de sistema

Aplicación basada en Clean Architecture.

Capas:

- domain
- application
- infrastructure

---

# Flujo principal

1. El usuario realiza una acción.
2. La acción ejecuta un caso de uso.
3. El caso de uso utiliza servicios del dominio.
4. El dominio ejecuta la lógica de negocio.
5. La infraestructura implementa adaptadores externos.

---

# Tecnologías principales

Base de datos:

Supabase

Lenguaje principal:

TypeScript

Arquitectura:

Clean Architecture

---

# Reglas principales

- El dominio no depende de infraestructura.
- Los casos de uso coordinan la lógica.
- La infraestructura implementa adaptadores.

---

# Ubicación de los componentes

Dominio:

src/domain

Casos de uso:

src/application/use-cases

Infraestructura:

src/infrastructure