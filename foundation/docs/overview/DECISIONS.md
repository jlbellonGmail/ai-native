# Architecture Decisions

Este documento registra decisiones importantes tomadas dentro del framework.

El objetivo es mantener trazabilidad sobre cambios arquitectónicos y
facilitar la comprensión del sistema para desarrolladores y agentes de IA.

---

# Formato de Decisión

Cada decisión debe incluir:

- Contexto
- Problema
- Alternativas consideradas
- Decisión tomada
- Consecuencias

---

# Decisión 001 — Separación del Ecosistema

Contexto  
Se decidió dividir el ecosistema en múltiples repositorios.

Problema  
Un único repositorio generaría mezcla de responsabilidades.

Decisión  
Separar el ecosistema en:

ai-knowledge  
ai-project-foundation  
ai-project-template  

Consecuencias  
Permite evolución independiente de cada componente.
