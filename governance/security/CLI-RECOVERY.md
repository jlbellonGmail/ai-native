# Recuperación ante un CLI `ai-native` comprometido o revocado

Un ejecutable comprometido no puede ser la raíz de confianza para repararse a sí mismo: un `ai-native` alterado puede mentir en `self-update`, en
`--version` y en cualquier verificación. Por eso la recuperación es **externa al CLI instalado**.

## Qué detecta el sistema

* Los CLI honestos de v3.3.0 en adelante leen `cli-revocations-<n>.json` (asset atestado de la release, misma raíz de confianza y mismo workflow
  de firma que `revocations-<n>.json`) y se niegan a operar (`CLI_REVOKED`) si su propia versión está listada; siguen permitiendo `--version`,
  `self-update` y `uninstall`.
* `self-update` no instala una versión revocada y nunca baja de versión.
* Un CLI alterado localmente no se delata a sí mismo. Un CLI v3.2.0 no conoce esa lista.

## Procedimiento (sin ejecutar el `ai-native` sospechoso)

1. Borrar a mano la instalación: `~/.ai-native/bin/ai-native.mjs`, `ai-native`, `ai-native.cmd`, `ai-native.mjs.prev` (en Windows
   `%USERPROFILE%\.ai-native\bin`). No hace falta tocar los repositorios.
2. Tratar la caché `~/.ai-native/cache` como no confiable. No borrarla es seguro: cada release se vuelve a comprobar por sha256 contra el lock y
   contra su registro de attestation, y un bundle manipulado falla cerrado. Si hay duda, borrarla; se rellena con red.
3. Descargar el asset desde una máquina o shell limpios con `gh` oficial, y verificarlo antes de ejecutarlo:
   `gh release download --repo jlbellonGmail/ai-native --pattern ai-native-cli.mjs --dir <dir>` y
   `gh attestation verify <dir>/ai-native-cli.mjs --repo jlbellonGmail/ai-native --signer-workflow jlbellonGmail/ai-native/.github/workflows/release.yml`.
4. Instalar con `node <dir>/ai-native-cli.mjs install` (Node de confianza) y comprobar `ai-native --version`.
5. Si `gh` mismo o el sistema están comprometidos, reinstalar `gh`/Node desde sus fuentes oficiales primero: no hay recuperación posible por encima de
   una máquina comprometida.

## Quién revoca

Se publica una nueva `cli-revocations-<n+1>.json` (n estrictamente mayor) en una release estable e inmutable, con entradas `kind: "cli"`,
`id: "ai-native-cli"`, `version` = tag y `reason`. Una release de PLATFORM comprometida se revoca como siempre en `revocations-<n>.json`. Las dos
series viven separadas para que un motor anterior nunca encuentre una entrada que no sabe leer.
