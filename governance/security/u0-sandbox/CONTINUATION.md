Contexto de continuación (AI-NATIVE v4.1.0) — sesión de agente en Windows Sandbox

- Repositorio: jlbellonGmail/ai-native (público). Clon propio: C:\work\ai-native, rama
  feature/acceptance-v4 (PR #168). Candidato de planes: e3bdc92e66a6296dfb16d7f939d187c44abef6b6 o el
  commit posterior que indique el propietario; comprobalo con `git log -1`.
- Leé AGENTS.md y CLAUDE.md del repo, governance/execution/current/V4-STATE.md y
  governance/security/PLAN-APPROVAL-UNBLOCK-PLAN.md (no aprobado).
- Estado: U0 (separación humano/agente) PENDIENTE hasta que el propietario registre V0–V8. La
  implementación NO está autorizada: no inicies U2–U7 ni Native Acceptance, no emitas receipts ni
  registres aprobaciones.
- Esta sesión no tiene ni debe obtener credenciales de GitHub: no ejecutes `gh auth login`, no hagas
  push ni abras PR. Sos un usuario estándar del Sandbox; no intentes elevar privilegios ni cambiar el
  firewall.
- Entrega y persistencia: el Sandbox se descarta al cerrarse. Después de cada commit, y antes de terminar,
  ejecutá `powershell -NoProfile -ExecutionPolicy Bypass -File C:\agent-setup\checkpoint.ps1`
  (bundle en C:\agent-exchange). En una sesión nueva recuperá con `...\restore.ps1`. En
  C:\agent-exchange dejá sólo bundles; nunca accesos directos, .url, .lnk, desktop.ini ni enlaces.
- Esperá la próxima instrucción del propietario.
