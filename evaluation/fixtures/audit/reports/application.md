---
targetRepo: fixture/notes-api
targetCommit: dd302aecdea2e81f1f6b4c40968042acecc40607
platform:
  version: v3.0.0-alpha.1
  commit: 454aada60509ef81ab69a04b4cb608ab6a1cc4db
auditMethod: "1.2"
profile: APPLICATION
tool:
  name: claude-code (claude -p, independent invocation)
  model: claude-opus-5-5
date: 2026-10-03T13:45:00Z
scope: full repository, 8 versioned files, 5 tests executed
score: 72
isMergeGate: false
---

## Resumen

| Campo | Valor |
|---|---|
| Repositorio | `notes-api` (fixture APPLICATION) |
| Ruta | `…/scratchpad/audit/application` |
| Branch / Commit (`targetCommit`) | `main` / `dd302aecdea2e81f1f6b4c40968042acecc40607` |
| Tag | ninguno (`git tag` vacío) |
| Worktree | limpio |
| Fecha | 2026-10-03 |
| Estándar / Perfil | QUALITY_SCORE 1.1 · AUDIT_RULES 1.1 · APPLICATION 1.2 |
| Confianza | **MEDIA**: los tests se ejecutaron. No se ejecutaron `npm start`, el CI remoto ni la protección de ramas. |

Es una API HTTP de notas pequeña: Node ≥20, sin dependencias y con almacenamiento en memoria (`README.md:3`). Tiene dos módulos, `src/server.mjs` (HTTP) y `src/store.mjs` (validación y datos), con 5 tests que pasan. El CI está bien endurecido (`ci.yml:7-16`).

Los defectos principales son estos:
- **El arranque falla en silencio fuera de POSIX.** La guarda `import.meta.url === \`file://${process.argv[1]}\`` (`server.mjs:40`) nunca coincide en Windows, ni con rutas que llevan espacios o symlinks. En esos casos `npm start` termina sin escuchar y sin dar error.
- **Endpoints destructivos expuestos sin autenticación.** Están accesibles en todas las interfaces por defecto.
- **No hay observabilidad.** Los errores 500 se tragan sin registrarse.
- **No hay release ni rollback documentados.** La versión 1.2.0 no tiene trazabilidad.
- **No hay controles estáticos** (lint, formato, typecheck).

Score bruto **72,00/100**. No hay BLOCKER ni CRITICAL, y ninguna verificación esencial falló durante la auditoría, así que no se aplica ningún Quality Gate. Score final **72/100**. Estado: **APTO CON CORRECCIONES**.

## Verificación ejecutada

`node --test` es la VERIFICACIÓN OFICIAL DEL PROYECTO (`package.json:8`, `ci.yml:16`). Se ejecutó una sola vez:

```text
✔ health, create, read and delete a note
✔ invalid input is a 400 and an oversized payload is a 413
✔ create trims the title and assigns increasing ids
✔ create rejects an empty, missing or oversized title and an oversized body
✔ get, list and remove
ℹ tests 5 | suites 0 | pass 5 | fail 0 | cancelled 0 | skipped 0 | todo 0
ℹ duration_ms 283.9017
EXIT=0
```

Estado: **VERIFICADO**, 5/5 pasan. No se ejecutó nada más, conforme a la instrucción. `npm start` queda **NO VERIFICADO**: el hallazgo 1 se basa en inspección del código (INFERIDO).

## Puntuación por criterio

Escala usada: COMPLETO = 100 %, MENOR = 75 %, PARCIAL = 50 %, DÉBIL = 25 %, AUSENTE = 0 %. Ningún criterio es N/A, así que los puntos aplicables son 100.

| Área | Bruto | Peso | Subcriterios y evidencia |
|---|---:|---:|---|
| Q1 Contrato | **11,25** | 12 | **Q1.1 COMPLETO 3:** propósito, contexto "fixture" y límites declarados (`README.md:3,9`).<br>**Q1.2 COMPLETO 3:** los endpoints de `README.md:7` están implementados (`server.mjs:15-31`) y los límites de `README.md:8` también (`store.mjs:2-3`, `server.mjs:4`). Los tests lo confirman.<br>**Q1.3 MENOR 2,25:** un body `null` devuelve 500; los métodos no se respetan (H4, H5). |
| | | | **Q1.4 COMPLETO 3:** no hay requisitos obligatorios pendientes. El arranque se penaliza en Q2 para no penalizarlo dos veces. |
| Q2 Reutilización | **9,75** | 12 | **Q2.1 MENOR 2,25:** no hace falta instalar nada (no hay dependencias), pero el arranque no está verificado y se rompe según la plataforma (H1, CAUSA RAÍZ COMPARTIDA ROOT-001).<br>**Q2.2 COMPLETO 3:** no hay residuos ni rutas locales.<br>**Q2.3 COMPLETO 3:** la única configuración es `PORT`, documentada en `README.md:5` y usada en `server.mjs:41`.<br>**Q2.4 PARCIAL 1,5:** la dependencia de POSIX y de rutas sin espacios no está declarada (H1). |
| Q3 Arquitectura | **11,25** | 12 | **Q3.1 COMPLETO 3:** separación `src/` y `test/`.<br>**Q3.2 MENOR 2,25:** la capa HTTP depende de tipos de excepción built-in para mapear a 400 (H6).<br>**Q3.3 COMPLETO 3:** no hay código muerto ni duplicación relevante.<br>**Q3.4 COMPLETO 3:** el store es inyectable (`server.mjs:6`). |
| Q4 Documentación | **6,50** | 12 | **Q4.1 MENOR 2,25:** el README no documenta códigos de estado ni formatos de respuesta.<br>**Q4.2 MENOR 2,25:** la versión de Node y la plataforma no figuran en el README.<br>**Q4.3 PARCIAL 1:** están "run" y "test", pero no hay despliegue ni release (H8).<br>**Q4.4 DÉBIL 0,5:** no hay convenciones de contribución.<br>**Q4.5 DÉBIL 0,5:** no hay ejemplos ni troubleshooting (H12). |
| Q5 Calidad | **10,75** | 16 | **Q5.1 AUSENTE 0:** no hay lint, formato ni typecheck (H10).<br>**Q5.2 MENOR 2,25:** hay tests unitarios (`store.test.mjs`) y de integración HTTP (`server.test.mjs`). Faltan el test del entrypoint y algunas rutas (H11).<br>**Q5.3 COMPLETO 4:** 5/5 pasan, exit 0.<br>**Q5.4 MENOR 2,25:** el CRUD y los límites están cubiertos; hay huecos (H11), y la ejecución en CI no está verificada.<br>**Q5.5 MENOR 2,25:** el CI ejecuta los tests en PR (`ci.yml:5-6`). Que el check sea obligatorio está NO VERIFICADO (H14). |
| Q6 Release | **6,50** | 16 | **Q6.1 DÉBIL 0,75:** la estrategia de Git no está definida; hay un único commit (H15).<br>**Q6.2 DÉBIL 0,75:** la protección de ramas está NO VERIFICADA y no hay un control alternativo en el repo (H14).<br>**Q6.3 MENOR 2,25:** el workflow es correcto y falla cuando debe. Las ejecuciones remotas no están verificadas, y Node no está fijado (H13). |
| | | | **Q6.4 DÉBIL 0,75:** existe `version: 1.2.0` (`package.json:3`), pero no hay tags ni changelog (H9).<br>**Q6.5 MENOR 1,5:** no hay build ni dependencias, pero el runtime del CI no está fijado (H13).<br>**Q6.6 DÉBIL 0,5:** sin persistencia no hay migraciones (`README.md:9`), pero el rollback no está documentado ni probado (H8). |
| Q7 Seguridad | **11,00** | 12 | **Q7.1 COMPLETO 3:** no hay secretos y `.env` está ignorado (`.gitignore:2`).<br>**Q7.2 COMPLETO 2:** cero dependencias en `package.json`.<br>**Q7.3 COMPLETO 2:** `permissions: contents: read`, acción fijada por SHA y `persist-credentials: false` (`ci.yml:7-15`).<br>**Q7.4 PARCIAL 1:** el servidor escucha sin autenticación en todas las interfaces y el almacenamiento no tiene límite (H2, H7).<br>**Q7.5 COMPLETO 3:** `private: true`, sin distribución; la acción está fijada por SHA. |
| Q8 Gobernanza | **5,00** | 8 | **Q8.1 MENOR 1,5:** límites y comando de test duplicados a mano (H13).<br>**Q8.2 COMPLETO 2:** un solo job con alcance claro.<br>**Q8.3 PARCIAL 1:** el arranque falla en silencio y los 500 no se registran (H1, H3).<br>**Q8.4 DÉBIL 0,5:** no hay cadena cambio→PR→release ni observabilidad (H3, H9). |
| **Total** | **72,00** | **100** | Puntos aplicables: 100, sin N/A. Gates: ninguno. Final: **72**. |

## Hallazgos

1. **MAJOR · ROTO / RIESGO · ROOT-001: el entrypoint no arranca fuera de POSIX ni con rutas codificadas.**
   - **Evidencia:** `src/server.mjs:40` compara `import.meta.url` (`file:///C:/…`, codificado con %XX y resolviendo symlinks) con `file://${process.argv[1]}` (`C:\…`, sin codificar). La comparación nunca es igual en Windows, ni con espacios o caracteres especiales en la ruta, ni con symlinks.
   - **Impacto:** `npm start` (`README.md:5`) termina con código 0 sin escuchar. INFERIDO por inspección; no se ejecutó.
   - **Criterios:** Q2.4 (principal), Q2.1, Q8.3.
   - **Corrección:** comparar con `pathToFileURL(process.argv[1]).href`, o separar el entrypoint en otro módulo.
   - **Verificación:** arrancar en Windows y en una ruta con espacios, y comprobar `GET /health` → 200.
2. **MAJOR · RIESGO: endpoints destructivos sin autenticación, expuestos por defecto en todas las interfaces.**
   - **Evidencia:** `src/server.mjs:41` llama a `listen(PORT)` sin host; `DELETE` está en `src/server.mjs:31`. Solo hay una mitigación documental en `README.md:9`.
   - **Criterio:** Q7.4. El perfil exige authn/authz verificadas.
   - **Corrección:** hacer bind a `127.0.0.1` por defecto (configurable con `HOST`) o exigir un token.
3. **MAJOR · FALTA: no hay observabilidad.**
   - **Evidencia:** `src/server.mjs:33-35` captura los errores inesperados y devuelve 500 sin registrar nada. No hay logs de peticiones ni guía de incidentes.
   - **Criterios:** Q8.3, Q8.4.
   - **Corrección:** registrar el error en el `catch` y documentar cómo diagnosticar.
4. **MINOR · INCORRECTO: un body JSON `null` provoca 500 en vez de 400.**
   - **Evidencia:** `src/server.mjs:25` hace `JSON.parse("null")`, y `store.create(null)` falla al desestructurar en `src/store.mjs:9` con un TypeError, que se convierte en 500 (`server.mjs:35`).
   - **Criterio:** Q1.3.
5. **MINOR · CONTRADICTORIO: el manejo de métodos no sigue el contrato.**
   - **Evidencia:** `README.md:7` declara `GET /health`, pero `src/server.mjs:15` responde a cualquier método. Los métodos no soportados devuelven 404 en vez de 405 (`server.mjs:32`).
   - **Criterio:** Q1.3.
6. **MINOR · RIESGO: el mapeo de errores depende de excepciones built-in.**
   - **Evidencia:** `src/server.mjs:34` convierte cualquier `RangeError` o `SyntaxError`, también los internos, en 400 y expone `error.message`.
   - **Criterio:** Q3.2.
   - **Corrección:** usar una clase `ValidationError` propia.
7. **MINOR · RIESGO: el almacenamiento en memoria no tiene límite.**
   - **Evidencia:** `src/store.mjs:6,14` no limita el número de notas. Cada petición está acotada a 64 KiB, pero el total no, lo que permite agotar la memoria. `README.md:9` solo declara "no rate limiting".
   - **Criterio:** Q7.4.
8. **MAJOR · FALTA: no hay despliegue ni rollback documentados o probados.**
   - **Evidencia:** ningún archivo los describe, y el perfil APPLICATION §2 (Q6) los exige.
   - **Criterios:** Q6.6, Q4.3.
9. **MINOR · INCOMPLETO: la versión no es trazable.**
   - **Evidencia:** `package.json:3` declara `1.2.0`, pero `git tag` está vacío, no hay CHANGELOG y el historial es un único commit `dd302ae fixture: application`.
   - **Criterios:** Q6.4, Q8.4.
10. **MINOR · FALTA: no hay controles estáticos.**
    - **Evidencia:** no hay lint, formato ni `node --check`/typecheck en `package.json:8` ni en `ci.yml`.
    - **Criterio:** Q5.1.
11. **MINOR · INCOMPLETO: hay huecos de pruebas.**
    - **Evidencia:** no hay test del entrypoint (H1), de `GET /notes` vía HTTP, de rutas o métodos desconocidos, de `DELETE` sobre un id inexistente ni del body `null` (H4). Comparar `test/server.test.mjs:15-33` con `server.mjs:15-32`.
    - **Criterios:** Q5.2, Q5.4.
12. **MINOR · INCOMPLETO: el README no es plenamente operativo.**
    - **Evidencia:** `README.md:1-9` no documenta códigos de estado ni formatos de respuesta, no incluye ejemplos de peticiones, troubleshooting ni convenciones de contribución, y no menciona la versión de Node (que solo aparece en `package.json:7`).
    - **Criterios:** Q4.1, Q4.2, Q4.4, Q4.5.
13. **MINOR · DUPLICADO / INCOMPLETO: CI sin runtime fijado y fuentes de verdad duplicadas.**
    - **Evidencia:** `ci.yml:16` usa el Node que traiga el runner (no hay `setup-node`) frente a `engines >=20` (`package.json:7`). El CI invoca `node --test` en lugar de `npm test`. Los límites se mantienen a mano en tres sitios: `README.md:8`, `store.mjs:2-3` y los tests (`store.test.mjs:15-16`, `server.test.mjs:31`).
    - **Criterios:** Q6.3, Q6.5, Q8.1.
14. **MINOR · NO VERIFICADO: la integración no está forzada de forma demostrable.**
    - **Evidencia:** no se pudo comprobar la protección de `main` ni el required check, y el repositorio no tiene ningún control alternativo.
    - **Criterios:** Q6.2, Q5.5, Q5.4.
15. **MINOR · FALTA: la estrategia de Git no está definida.**
    - **Evidencia:** solo existe la rama `main`, con un único commit, y no hay convención documentada.
    - **Criterio:** Q6.1.

## No verificado

- **`npm start` y el comportamiento en ejecución del servidor:** no se ejecutaron por la instrucción. H1 es INFERIDO.
- **Ejecuciones reales del workflow `CI` en GitHub:** resultado, eventos y runtime efectivo.
- **Protección de rama `main`, required checks y reviewers obligatorios:** configuración remota.
- **Configuración de GitHub Actions a nivel de repositorio u organización:** permisos por defecto y acciones permitidas.
- **Existencia de releases o paquetes publicados:** no hay evidencia local.

Ninguno de estos puntos se puntúa como cumplido. Restan en Q2.1, Q5.4, Q5.5, Q6.2 y Q6.3, según lo indicado.

## Riesgos

- **Exposición de datos y borrado remoto.** Con la configuración por defecto (H2), cualquiera con acceso de red al puerto puede listar y borrar todas las notas.
- **Disponibilidad.** Sin límite de almacenamiento ni rate limiting (H7), un cliente puede agotar la memoria. Además, los datos se pierden al reiniciar (declarado en `README.md:9`).
- **Falso arranque.** En Windows, o en rutas con espacios o symlinks (H1), el proceso termina con código 0. Un orquestador o un operador puede interpretarlo como un despliegue correcto.
- **Diagnóstico de incidentes.** Sin logs (H3), los fallos 500 no dejan rastro.
- **Regresiones.** La protección depende de un CI cuyo carácter obligatorio no está verificado (H14), y no hay análisis estático (H10).

SCORE: 72
