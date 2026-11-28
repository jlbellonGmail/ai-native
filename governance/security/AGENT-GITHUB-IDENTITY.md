# Identidad GitHub del agente, separada de la cuenta humana

Estado: **NO IMPLANTADA. Separación NO verificada.** Este documento prepara la decisión y los pasos. El agente no creó
cuentas, Apps, tokens ni claves, y no cambió permisos del repositorio.

Complementa:

* `AGENT-HUMAN-IDENTITY-SEPARATION.md`: frontera de Windows; usuario `ai-agent` sin acceso a las credenciales
  humanas. Sigue siendo necesaria.
* `PLAN-APPROVAL-RECEIPT.md`: App `ai-native-plan-approval` para G5; solo solicita.

## Estado verificado (2026-11-28, desde la sesión del agente)

| Comprobación | Resultado |
|---|---|
| `gh api user` | `jlbellonGmail`, `type: User`, id 215926636: la cuenta humana, propietaria y admin |
| `node runtime/gates/plan-approval.mjs check-agent-isolation` | `BLOCKED`: `AGENT_HUMAN_GH_ACCOUNT` (gh autenticado como el humano) y `AGENT_GIT_CREDENTIAL` (5 destinos `github` en el Administrador de credenciales) |
| Usuario de Windows del agente | `jlbellon`, el mismo perfil que el humano |
| App `ai-native-trust` (id 5170488) | Existe. Es la titular de la clave de los gates: publica `ai-native/trust-gate` y `ai-native/merge-gate`. **No sirve como identidad del agente**: usarla sería que el agente emita los checks que lo juzgan |
| App `ai-native-plan-approval` | No configurada: `governance/gates/plan-approval.json` tiene `requester.botUserId: null`. `GET /apps/<slug>` da 404, pero eso no es concluyente para Apps privadas (`ai-native-trust` también da 404) |
| Cuenta de máquina del agente | No existe ninguna en este repositorio. El único colaborador es `jlbellonGmail` |

Conclusión: hoy el agente opera con la credencial humana. Las reglas de comportamiento (no mergear, no aprobar, no
cambiar protecciones) son instrucciones, no aislamiento.

## Requisitos (decisión humana del 2026-11-28)

* **El agente puede:** crear y actualizar ramas de trabajo, y abrir y actualizar PRs.
* **El agente no puede:** aprobar reviews humanas, mergear, cambiar rulesets, administrar Environments, ni leer o
  administrar secretos.
* **La cuenta humana queda reservada para:** aprobar, mergear, modificar protecciones y aprobar Environments.
* **Prohibido:**
  * reutilizar una credencial humana para simular otra identidad;
  * mostrar, copiar, guardar en el repositorio o pegar en el chat claves privadas, PATs o tokens.

## Opciones

| | A. Cuenta de máquina sin rol en el repositorio, PRs desde un fork (**recomendada**) | B. GitHub App `ai-native-agent` instalada en el repositorio |
|---|---|---|
| Permisos sobre `jlbellonGmail/ai-native` | Ninguno más allá de lo público (lectura). No es colaboradora | `contents: write`, `pull_requests: write`, `metadata: read` |
| Ramas | En su fork | En el repositorio |
| Abrir y actualizar PRs | Sí, desde el fork | Sí |
| Mergear | **No**: hace falta acceso de escritura | **Sí puede.** La API de merge solo pide `contents: write`, y `develop` y `main` exigen 0 aprobaciones |
| Aprobar | Puede dejar una review, pero **no cuenta**: solo cuentan las aprobaciones de quien tiene escritura | Una App puede crear reviews `APPROVE` |
| Tags | **No** | **Sí**: sin ruleset de tags, un `v*` dispara `release.yml`, que publica |
| Rulesets, Environments, secretos | **No** (no es admin) | No (la App no pide `administration`, `environments` ni `secrets`) |
| Qué haría falta además | Nada en el repositorio | Un ruleset de tags y una restricción de merge solo humana en `develop` y `main`. Eso cambia protecciones de `main`, una decisión humana fuera de esta tarea |
| Coste operativo | Las PR de forks de un colaborador nuevo esperan "Approve and run" del humano (configuración actual, sin cambios). Los runs de PR de forks tienen token de solo lectura y no tienen secretos, que es lo que ya asumen los gates (`trust-gate.yml` y `merge-gate.yml` corren con `pull_request_target` desde BASE) | Clave privada de la App en el perfil del agente; tokens de instalación de 1 h |

La opción A cumple todos los requisitos por permisos, no por instrucciones. La B no los cumple sin cambiar antes las
protecciones de `main`.

**Riesgo no verificado de A:** el comportamiento de `trust-gate` y `merge-gate` con una PR desde un fork no se ha
ejercitado en este repositorio. La primera PR del agente desde su fork es la prueba. Si un gate falla, se corrige
antes de depender de él, sin debilitarlo.

## Pasos exactos de la opción A (los ejecuta el humano)

1. **Frontera de Windows.** Seguir los pasos 1 a 4 de `AGENT-HUMAN-IDENTITY-SEPARATION.md`:
   * usuario estándar `ai-agent`;
   * ACL solo sobre el área de trabajo;
   * agentes instalados y lanzados solo desde `ai-agent`;
   * sin credenciales GitHub humanas en ese perfil.
2. **Cuenta de máquina.** Crear en github.com una cuenta propia para el agente:
   * con su propio correo y 2FA;
   * un nombre que diga que es un agente, por ejemplo `<propietario>-agent`.
   * **No** invitarla como colaboradora de `jlbellonGmail/ai-native`.
3. **Sesión del agente.** Dentro de la sesión de Windows `ai-agent`:
   * ejecutar `gh auth login --hostname github.com --git-protocol https --web`;
   * completar el flujo en el navegador **con la cuenta de máquina**, nunca con `jlbellonGmail`.
   * El token queda en el almacén de `ai-agent`; nadie lo copia a ningún otro sitio.
4. **Fork.** En la misma sesión: `gh repo fork jlbellonGmail/ai-native --clone=false`.
5. **Remotos** de cada worktree del agente:
   * `origin` = el fork;
   * `upstream` = `https://github.com/jlbellonGmail/ai-native.git`, solo para fetch:
     `git remote set-url --push upstream DISABLED`.
6. **Avisar al agente** para que verifique (paso siguiente). Hasta entonces, la separación sigue NO verificada.

## Verificación (la ejecuta el agente; el humano la revisa)

Cada comando debe dar exactamente lo indicado:

```text
gh api user --jq .login                                        -> <cuenta de máquina>, distinto de jlbellonGmail
gh api repos/jlbellonGmail/ai-native --jq .permissions         -> {"admin":false,"maintain":false,"pull":true,"push":false,"triage":false}
gh api repos/jlbellonGmail/ai-native/collaborators --jq '.[].login'   -> error 403/404 (sin acceso de colaborador)
gh api repos/jlbellonGmail/ai-native/environments/ai-native-trust/secrets   -> 403/404 (solo lectura; no puede listar secretos)
node runtime/gates/plan-approval.mjs check-agent-isolation     -> agent-isolation: PASS (detección, no aislamiento)
git push https://github.com/jlbellonGmail/ai-native.git HEAD:refs/heads/agent-probe   -> 403 (si no lo fuera, la rama creada la borra el humano y la separación NO está verificada)
```

Ninguna verificación intenta cambiar una protección: si la cuenta tuviera permisos de más, ese intento cambiaría la
protección.

Después, abrir una PR de prueba desde el fork, comprobar que sus checks corren, y cerrarla sin merge.

## Efecto sobre otras decisiones (no se cambia nada ahora)

* Con PRs creadas por la cuenta de máquina, el humano deja de ser el autor y el `triggering_actor` de esas PRs.
* La decisión 3 de v4.1.0 (`prevent_self_review` en `false`) se apoya justamente en que hoy el humano dispara todos
  los runs. Se puede reconsiderar después de la verificación, como decisión humana aparte.
* U0 y G5 (`PLAN-APPROVAL-RECEIPT.md`) siguen como están. Esta identidad no emite receipts ni aprobaciones.
