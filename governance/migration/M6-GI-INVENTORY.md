# M6: inventario real, DAG y baseline pre-migración (2026-10-06)

Plataforma objetivo: `v3.0.0` sobre `afd375d564e1c750043ad47e1e4a7b1917073700`, digest `sha256:0ea3d99caa396e001269a4dacc6c69d1a5280116b0992bb5edda63627d5e8d65`. Fuente: `parity/inventory-reports/`, GitHub (`gh`) y `node runtime/migrate/migrate.mjs plan` (solo lectura, sobre clones temporales de `origin`; los checkouts locales no se tocaron).

**Autorización y desviación declarada.** El dueño autorizó M6 de forma explícita y global. El roadmap exige además «P1–P45 completas antes de cualquier repo GI» y una autorización por oleada; P1–P45 no tienen matriz individual final. Prevalece la instrucción explícita del dueño (orden de autoridad 1) y la condición queda registrada como **desviación abierta, no resuelta**.

## Clasificación

| Repo | Clasificación | Evidencia |
|---|---|---|
| `gi-platform-core` | ACTIVE | código `gi_platform_core`, `contracts/`, tags v0.2.1/v0.3.0 |
| `gi-common-tenants` | ACTIVE | `gi_common_tenants`, tags v0.1.1/v0.1.2 |
| `gi-common-persons` | ACTIVE | `gi_persons`, tests |
| `gi-common-crm` | ACTIVE | `gi_crm`, tag v0.1.0 |
| `gi-ocr` | ACTIVE | `backend/` (91 archivos), `frontend/`, tag v0.1.0 |
| `gi-ot` | ACTIVE (circuito casi inexistente: 1 de 297 archivos idéntico a Template) | `apps/` (159 archivos) |
| `gi-clinicadental` | ACTIVE (baseline de Template débil: 7 idénticos de 363) | `api/`, `static/`, `supabase/`, tags v1.0.1/v1.0.2 |
| `gi-vertical-dental` | EMPTY | 0 archivos de producto; solo andamiaje (rama por defecto `codex/vertical-dental-baseline`, sin tags) |
| `gi-vertical-law` | **no existe** | `gh repo view` → no resuelve; no se inventa ni se migra |
| `gi-utils-fiscal-ar` | **no registrado** | existe en GitHub, ausente del inventario oficial y sin checkout local; layout antiguo `.agentic`; último push 2026-08-22. No se migra automáticamente |

## DAG (dependencias reales + roadmap)

Las referencias entre paquetes aparecen en `gi-common-crm` → `gi-common-persons`/`gi-platform-core`, `gi-common-persons` → `gi-common-tenants`/`gi-platform-core`, `gi-common-tenants` → `gi-platform-core`. `gi-ocr`, `gi-ot` y `gi-clinicadental` no declaran dependencias de otro GI en el código.

1. Wave 1: `gi-platform-core`
2. Wave 2: `gi-common-tenants`
3. Wave 3: `gi-common-persons`
4. Wave 4: `gi-common-crm`
5. Wave 5 (independientes, sin dependencia GI): `gi-ocr`, `gi-ot`, `gi-clinicadental`

La migración de plataforma no cambia el código de negocio, por lo que el orden es de prudencia (la dependencia técnica es de paquete, no de plataforma).

## Baseline pre-migración

Rama de trabajo de todos: `develop` (salvo `gi-vertical-dental`). Ningún repo tiene rulesets (`gh api .../rulesets` = 0) ni PRs abiertas. Todos son públicos.

| Repo | HEAD `origin/develop` | Árbol local del maintainer | `plan` (idéntico/modificado/local) | Retirables | Colisiones | Último CI en `develop` |
|---|---|---|---|---|---|---|
| gi-platform-core | `e61b81f` | sucio (29 archivos, 1 commit detrás) | 127/51/207 | 70 | 8 | CI success; Guard develop failure |
| gi-common-tenants | `be0c879` | sucio (29, 1 detrás) | 148/24/164 | 91 | 0 | CI success; Guard failure |
| gi-common-persons | `9c3cf76` | sucio (29) | 158/19/117 | 97 | 0 | **CI failure** (`circuit-tests`; `product-tests` success) |
| gi-common-crm | `9f8fc27` | sucio (27) | 152/20/117 | 95 | 0 | **CI failure**; Guard failure |
| gi-ocr | `8614f82` | sucio (31) | 96/70/270 | 41 | 7 | **CI failure**; Guard failure |
| gi-ot | `9791131` | limpio | 1/61/229 (+6 duplicados) | 1 | 11 | **CI failure** |
| gi-clinicadental | `d864c26` | limpio | 7/54/302 | 6 | 8 | **CI failure** |
| gi-vertical-dental | `d0db39e` | 1 archivo | 89/37/3 (+1 duplicado) | 83 | 2 | sin runs |

Observaciones que condicionan la migración:

* **El CI ya está roto antes de migrar** en 5 de 8 repos. Los fallos observados son del circuito heredado de Template (`circuit-tests`); no son regresiones de M6 y no se confundirán con ellas.
* **Los árboles sucios son trabajo real del maintainer** (~30 archivos modificados por repo, no solo fin de línea: `ci.yml`, scripts del circuito). No se tocan: M6 trabaja desde clones/worktrees limpios de `origin` y esos cambios locales no entran en ninguna PR.
* Las colisiones de `gi-platform-core` (agentes, `.codex/*.toml`, `opencode.json`) difieren del Template v2.0.4 **solo en el pin de modelo** (`model: default`); el migrador exige una decisión por archivo (`--keep`).
* **Sin rulesets** en ningún repo GI: crear uno es un cambio de control de seguridad en repos del dueño y queda como acción humana (`PENDING_HUMAN_ACTION`); el migrador nunca edita un ruleset.

## Estado M6

| Repo | Wave | Estado |
|---|---|---|
| gi-platform-core | 1 | NOT_STARTED |
| gi-common-tenants | 2 | NOT_STARTED |
| gi-common-persons | 3 | NOT_STARTED |
| gi-common-crm | 4 | NOT_STARTED |
| gi-ocr / gi-ot / gi-clinicadental | 5 | NOT_STARTED |
| gi-vertical-dental | n/a | NOT_APPLICABLE (EMPTY) |
| gi-vertical-law | n/a | NOT_APPLICABLE (no existe) |
| gi-utils-fiscal-ar | n/a | NOT_APPLICABLE (no registrado) |
