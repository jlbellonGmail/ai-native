# Testing

Este directorio contiene las pruebas del proyecto.

---

# Objetivo

Garantizar:

- comportamiento correcto
- estabilidad del sistema
- evolución segura del código

---

# Convenciones

Las pruebas deben:

- ser claras
- ser rápidas
- cubrir lógica crítica del dominio

---

# Contract Testing

W6-T1 define que las pruebas de contrato deben cubrir límites públicos antes de
considerarlos estables:

- rutas HTTP
- servicios de dominio
- adaptadores de repositorio
- proveedores externos
- comandos expuestos a agentes

El contrato machine-readable vive en `../contract-testing.contract.json`.
