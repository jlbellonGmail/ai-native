# Estado operativo

Versión: v2.0.0
Estado general: F05 terminada y mergeada; F01–F04 cerradas.
Última fase funcional terminada: F05 — contrato adaptativo de evidencias.
Siguiente fase: F06 — tests, CI y `.audit`.

## Qué ya funciona

El contrato adaptativo consume `sdd.json`, mantiene SUMMARY como entrada humana,
diferencia LIGHT/STANDARD/FULL, preserva legacy y valida convergencia JSON.

## Evidencia real

PR #42 mergeada contra `develop`; CI verde en `circuit-tests`,
`local-reconciler-tests` y `product-tests`. Run: `runs/v2.0.0/10-evidencias-adaptativas/SUMMARY.md`.

## Qué sigue

F06 queda pendiente y no fue iniciada. No se iniciaron fases posteriores.

## Incidencias

La suite local completa tuvo tres timeouts preexistentes del reconciliador Windows;
la suite focalizada F05 (44 pruebas) y CI remoto quedaron verdes.

## Detalle

[SUMMARY de F05](runs/v2.0.0/10-evidencias-adaptativas/SUMMARY.md)
