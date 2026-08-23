# Contexto de producto

Este documento es el conocimiento funcional persistente del producto real
que se construye sobre este template. Es la fuente de contexto que
`analyst-agent` lee automáticamente al preparar cualquier `spec.md`
(Feature o Milestone) — ver "Política de fuentes y trazabilidad" en
`AGENTS.md`.

No es una spec de una feature puntual: es conocimiento estable y
reutilizable entre features (propósito, usuarios, reglas de negocio ya
adoptadas). Las decisiones específicas de una sola feature quedan en su
propio `runs/<slug>/spec.md` y `decision.md`, no acá. Cuando una decisión
tomada durante una feature resulta ser conocimiento estable del producto
(no solo de esa feature), `builder-agent` actualiza este archivo como
parte de cerrarla (ver "Evolución del contexto de producto" en
`AGENTS.md`).

Mientras el proyecto no tenga producto propio (como este template base),
este archivo se mantiene con sus secciones en "Por definir" y
`analyst-agent` lo trata como contexto vacío, no como bloqueo: sigue
pudiendo producir specs usando el resto de las fuentes disponibles
(`ROADMAP.md`, `docs/tecnica/arquitectura.md`, código y tests existentes).

Este archivo se crea o actualiza mediante el bootstrap de contexto de
producto (ver "Bootstrap de contexto de producto" en `AGENTS.md`), no se
llena con contenido inventado por ningún agente.

## Propósito del producto

Por definir. Qué problema resuelve este producto y para quién, en una o
dos frases verificables (no aspiracionales).

## Problema que resuelve

Por definir. La necesidad concreta que motiva que este producto exista,
con la evidencia (pedido del negocio, dato observado) que la respalda.

## Usuarios y actores

Por definir. Lista de roles/actores reales que interactúan con el
producto (humanos o sistemas), y qué necesita cada uno.

## Flujos principales

Por definir. Los recorridos end-to-end más importantes del producto, en
lenguaje funcional (qué hace el usuario, qué responde el sistema), sin
detalle de implementación.

## Comportamiento esperado

Por definir. Reglas de comportamiento ya decididas que cualquier feature
nueva debe respetar salvo que se declare explícitamente un cambio.

## Reglas de negocio conocidas

Por definir. Reglas de negocio ya adoptadas (cálculos, permisos,
políticas), con la fuente de cada una (quién la definió, cuándo). Ninguna
regla de negocio se agrega acá por inferencia de un agente: solo las que
vinieron del negocio/cliente real.

## Restricciones funcionales

Por definir. Límites que el producto debe respetar (legales, de
privacidad, de negocio) y que no son responsabilidad de una sola feature.

## Decisiones de producto ya adoptadas

Por definir. Decisiones de producto (no técnicas — esas van en
`docs/tecnica/arquitectura.md`) que ya se tomaron y no deberían
reabrirse sin justificación explícita, con referencia a la feature o
conversación donde se decidieron cuando corresponda.

## Límites generales

Por definir. Qué queda explícitamente fuera del alcance del producto,
para que ninguna feature lo asuma por error.

## Terminología

Por definir. Glosario de términos de negocio/dominio específicos de este
producto, para que los agentes y quien lea la documentación usen el
mismo vocabulario que el negocio real.
