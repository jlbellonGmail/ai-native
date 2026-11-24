# U1 — rulesets de `develop` (y escritores de `main`): cargas preparadas, NO aplicadas

Origen: `../PLAN-APPROVAL-UNBLOCK-PLAN.md` § U1. Las ejecuta sólo el
propietario, desde su perfil, **después de registrar U0 verificado**. Antes de
eso, el agente podría actuar como propietario.

Estado leído el 2026-11-24 (lectura de solo lectura con `gh api`):
- `ai-native-main` (id 24405506): activo, sin bypass. Reglas: borrado,
  non-fast-forward, PR y seis checks requeridos.
- `develop`: sin ruleset ni protección (HTTP 404).

Pasos, en orden ([NORMAL], `M7\jlbellon`, en la raíz de un clon de esta rama):

1. Comprobar que existe la regla «Restrict updates». Abrir *Settings →
   Rules → Rulesets → New branch ruleset* y confirmar que la lista incluye
   «Restrict updates».
   - Si no está, U1 queda BLOCKED. No hay sustituto más débil: no crear nada.
2. Crear el ruleset sin bypass:
   `gh api -X POST repos/jlbellonGmail/ai-native/rulesets --input governance/security/u1-rulesets/ai-native-develop.json`
3. Crear el de escritores de `develop`. Bypass sólo para el rol de
   administrador del repositorio y sólo vía PR:
   `gh api -X POST repos/jlbellonGmail/ai-native/rulesets --input governance/security/u1-rulesets/ai-native-develop-writers.json`
4. Crear el de escritores de `main`. `ai-native-main` se mantiene sin cambios:
   `gh api -X POST repos/jlbellonGmail/ai-native/rulesets --input governance/security/u1-rulesets/ai-native-main-writers.json`
5. Verificar:
   `gh api repos/jlbellonGmail/ai-native/rulesets --jq '.[] | {name,enforcement}'`
   - ESPERADO: los cuatro rulesets, todos `active`.
   - Luego, para cada id: `gh api repos/jlbellonGmail/ai-native/rulesets/<id> --jq '{name,bypass_actors}'`.
     `ai-native-develop` debe tener `bypass_actors: []`.

Reversión, sólo por decisión humana:
`gh api -X DELETE repos/jlbellonGmail/ai-native/rulesets/<id>` para cada ruleset
creado en los pasos 2–4.

Notas:
- El id de rol `5` es el rol *admin* del repositorio en la API de rulesets.
- Los checks requeridos de `develop` se añaden en U6, cuando existan. Un check
  requerido que nunca se publica bloquearía todo merge.
- La disponibilidad de la regla `update` («Restrict updates») en un
  repositorio personal no está comprobada. Lo resuelve el paso 1; si falla, la
  API responde con error y no se crea nada.
