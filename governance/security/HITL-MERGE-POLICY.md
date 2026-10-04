# Política de merge humano (HITL único)

**Regla de diseño.** El merge de una PR lo decide un humano (principio 5 de la constitución, `core/kernel.md`, PAR-HUMAN-MERGE). El agente trabaja con la App `ai-native-worker`; el veredicto del gate lo emite otra identidad, `ai-native-trust`; ningún workflow de gates tiene permisos de escritura sobre contenidos ni llama a un endpoint de merge (probado en `runtime/gates/gates.test.mjs`).

## Regla vigente (D6, decisión del maintainer, 2026-10-04)

**Queda terminantemente prohibido que el agente mergee PRs usando el token personal del owner.** No existe ninguna dispensa: la que se concedió de forma temporal para PRs técnicas de M5 queda **revocada y eliminada**. Las PRs #30, #31 y anteriores se mergearon al amparo de esa dispensa; está registrado en `governance/SESSION-CONTEXT.md` y no se reescribe.

El agente PUEDE, de forma autónoma: crear ramas, modificar, probar, commitear, pushear, abrir PRs, corregir, reintentar y monitorizar CI.

Cuando un merge constituya el HITL requerido, el agente **se detiene**. El merge lo realiza el owner con su propia sesión. El agente no usa `gh pr merge`, la API de merge ni la UI con las credenciales personales del owner, ni siquiera con CI verde, parity verde y reviewer en ACCEPT.

## Qué está garantizado y qué no

| Control | Tipo | Alcance |
|---|---|---|
| El ruleset exige PR y los checks de las Apps; sin bypass actors; push directo rechazado por el servidor | preventivo | siempre |
| `merge-gate` emite un veredicto sobre el SHA exacto; un push nuevo lo invalida | preventivo | siempre |
| `neutral` no es PASS: el `merge-gate` lo bloquea (GitHub lo trata como éxito en la protección de rama, por eso lo bloquea el gate). Un cambio de plano de control exige aprobación humana explícita en el Environment `ai-native-human-review` | preventivo | siempre |
| `post-merge` verifica `merged_by` humano, merge commit en `main` y evidencia del `merge-gate` | **detectivo** (alerta tras el hecho) | siempre |
| Que quien ejecuta el merge sea una persona y no el agente | **norma operativa + detección**, no imposición técnica | ver límite |

**Límite honesto.** Con un solo maintainer y un token personal, GitHub no distingue «el owner» de «el agente usando su token». Por eso la regla es operativa (D6) y la parte técnica es detectiva. Lo que sí impone el servidor: ninguna PR llega a `main` sin los checks de las Apps, y los cambios al plano de control no pasan el `merge-gate` sin una aprobación humana registrada por el Environment `ai-native-human-review`.

## Cambios de plano de control (D7)

1. `trust-gate` concluye `neutral` cuando la PR toca el plano de control (`governance/gates/gates.json`).
2. `merge-gate` trata `neutral` como bloqueo (`HUMAN_REVIEW_REQUIRED` solo para el check `ai-native/trust-gate`; en cualquier otro check, `CHECK_NEUTRAL` no es revisable).
3. El job `human-review` espera la aprobación del revisor requerido del Environment `ai-native-human-review`. Sólo entonces `finalize` reevalúa con `HUMAN_REVIEWED=true` y publica el veredicto.
4. Se sigue validando la App origen (`ai-native-trust`): un check del mismo nombre emitido por otra fuente no se acepta en ningún caso.
