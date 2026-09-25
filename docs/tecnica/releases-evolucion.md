# Releases y evolución determinísticos

F15 añade `scripts/release-readiness.ps1` como ruta canónica y read-only para
evaluar un candidato SemVer. El gate exige ejecutarse sobre `develop` limpio,
comprueba que el commit local/remoto coincide, que las fases requeridas están
cerradas, que CI está verde sobre ese SHA, que la integridad pasa, que `main`
es ancestro (si existe), que el tag candidato no existe y que los tags
históricos conservan sus objetos.

## v2.0.2

La release de mantenimiento v2.0.2 incorpora la semántica única de `STATUS.md`
y su distribución reproducible. `STATUS.md` se regenera desde Git, lifecycle,
PR/CI y releases observables; `runs/` sólo conserva evidencia histórica.

El camino oficial es:

```text
Template → release → template-starter → bootstrap limpio
                         └──────────→ upgrade/adopción
```

El Starter contiene infraestructura reusable, no estado del Template. Un
upgrade preserva versión, ROADMAP, runs y documentación propios del consumidor
y regenera STATUS desde su repositorio.
