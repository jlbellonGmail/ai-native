# Estabilización definitiva v2.0.5

v2.0.5 estabiliza tres superficies compartidas del Template: STATUS, integridad
de runs y upgrade de consumidores.

`check-status.ps1` acepta como coherente un snapshot cuyo HEAD quedó un commit
atrás sólo cuando el diff entre el HEAD registrado y el HEAD actual contiene
exclusivamente `STATUS.md`. Cualquier otro cambio mantiene la advertencia de
stale HEAD.

`check-integrity.ps1` sólo trata como runs canónicos los directorios bajo
`runs/vX.Y.Z/`. Carpetas sueltas como `runs/T11-status-auto-commit` no son
unidades del ROADMAP.

`scripts/upgrade-template-consumer.ps1` es el mecanismo oficial de actualización
para consumidores: valida `TargetVersion`, `BaselineVersion`, tags exactos,
manifest, drift previo y drift posterior; copia únicamente `sharedPaths` y
preserva archivos funcionales del consumidor.
