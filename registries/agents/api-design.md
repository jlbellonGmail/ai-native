# 🔌 Diseño de API

## 🎯 Propósito

Definir cómo diseñar API que sean:

- Consistentes
- Predecibles
- Escalables
- Alineadas con la lógica de negocio
- Fáciles de usar

Esta habilidad garantiza que las API no solo sean funcionales, sino también bien estructuradas y fáciles de mantener.

--

## 🧠 Cuándo usar

Utiliza esta habilidad cuando:

- Diseñes nuevos endpoints
- Modifiques API existentes

- Integres servicios
- Definas contratos entre el frontend y el backend

- Revises implementaciones de backend

---

## 🧩 Principios básicos

### 1. La API refleja el dominio
Los endpoints deben representar conceptos de negocio, no artefactos técnicos.

### 2. Consistencia sobre ingenio
Utiliza una nomenclatura y estructura predecibles.

### 3. Explícito sobre implícito
No ocultes comportamientos ni suposiciones.

### 4. Diseño sin estado
Cada solicitud debe contener toda la información necesaria.

### 5. Separación de responsabilidades
La API gestiona el transporte, no la lógica de negocio.

---

## 🏗️ Estructura de la API

### Diseño basado en recursos

Usar sustantivos, no verbos:

✔ `/users`
✔ `/orders/{id}`
❌ `/getUsers`
❌ `/createOrder`

---

### Métodos HTTP

- GET → recuperar datos
- POST → crear
- PUT/PATCH → actualizar
- DELETE → eliminar

---

### Códigos de estado

- 200 → éxito
- 201 → creado
- 400 → solicitud incorrecta
- 401 → no autorizado
- 404 → no encontrado
- 500 → error interno

---

## 📦 Diseño de solicitud/respuesta

### Solicitud

- Validar todas las entradas
- Usar nombres de campo claros
- Evitar estructuras anidadas

---

### Respuesta

Devolver siempre respuestas estructuradas:

```json id="jex4r0"
{
"data": {},

"error": null,

"meta": {}
}