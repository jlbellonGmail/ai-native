# Política del merge humano (HITL único) — estado real y excepciones

**Regla de diseño.** El merge de una PR lo decide un humano (principio 5 de la constitución, `core/kernel.md`, PAR-HUMAN-MERGE).
El agente trabaja con la App `ai-native-worker`; el veredicto del gate lo emite otra identidad, `ai-native-trust`; ningún workflow de gates
tiene permisos de escritura sobre contenidos ni llama a un endpoint de merge (probado en `runtime/gates/gates.test.mjs`).

**Lo que está garantizado y lo que no (honesto).**

| Control | Tipo | Alcance |
|---|---|---|
| El ruleset exige PR y los checks de las Apps; sin bypass actors; push directo rechazado por el servidor | preventivo | siempre |
| `merge-gate` emite un veredicto sobre el SHA exacto; un push nuevo lo invalida | preventivo | siempre |
| `post-merge` verifica `merged_by` humano, merge commit en `main` y evidencia del `merge-gate` | **detectivo** (alerta tras el hecho) | siempre |
| Que quien ejecuta el merge sea una persona y no el agente | **no se puede imponer con un solo maintainer**: el agente usa el token `gh` de la cuenta del maintainer, así que `merged_by` no los distingue y el ruleset exige 0 aprobaciones (un único maintainer no puede aprobar su propia PR) | dispensa explícita, abajo |

**Dispensa vigente (registrada, no implícita).** El maintainer autorizó por escrito, para las PRs técnicas de **M5** (mensajes del 2026-10-03), que el agente
mergee PRs técnicas cuando: CI obligatoria verde, PR CLEAN/MERGEABLE, parity verde con UNMAPPED=0, Reviewer independiente (`claude -p`, invocación
separada) en ACCEPT y sin findings bloqueantes. Vence al cerrar M5; **M6 y los repos GI exigen merge humano** y una autorización explícita separada.
Ningún gate ni ruleset se debilitó. Las PRs #30 y #31 (M4.3) y las posteriores mergeadas bajo esta dispensa están enumeradas en `SESSION-CONTEXT.md`.

**Cómo se cierra del todo.** Que el agente deje de usar el token del maintainer: o bien un segundo maintainer humano con
`required_approving_review_count >= 1` y `require_last_push_approval`, o bien un token del agente sin permiso de merge (la App `ai-native-worker` ya existe;
falta usarla para los pushes/PRs del agente en lugar de `gh` con la cuenta personal). Es una acción del maintainer, no del agente.
