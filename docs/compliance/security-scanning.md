# Security Scanning & CodeQL Documentation

Este documento proporciona una guía completa sobre la implementación, el funcionamiento y el mantenimiento del análisis estático de código (SAST) utilizando **CodeQL** en el ecosistema de desarrollo asistido por IA.

## 1. Propósito

El propósito de integrar CodeQL en el ecosistema es garantizar la detección temprana de vulnerabilidades de seguridad, errores de software y desviaciones de las mejores prácticas de codificación en todos los componentes del sistema:
- **ai-foundation**: Núcleo del framework y agentes.
- **ai-template**: Plantilla base para nuevos desarrollos.
- **ai-knowledge**: Base de conocimiento compartida.

La capacidad CodeQL añade una capa automatizada de seguridad continua que ayuda a mantener el ecosistema robusto frente a riesgos cibernéticos y fallos de diseño.

## 2. Funcionamiento

El análisis de CodeQL consta de las siguientes fases automatizadas dentro del pipeline de CI/CD (GitHub Actions):

1. **Checkout**: Clonación completa del repositorio con su historial para un análisis de flujo de datos preciso.
2. **Inicialización**: Carga del motor de CodeQL y descarga de las bases de datos y suites de consulta específicas.
   - Lenguaje configurado: `javascript-typescript`.
   - Consulta de seguridad avanzada: Se utilizan las suites `security-extended` y `security-and-quality`.
3. **Autobuild**: Intento de compilación automatizada del código fuente. En entornos JS/TS, este paso asegura que los tipos y estructuras estén listos para el motor de extracción.
4. **Análisis y Extracción**: CodeQL extrae un modelo relacional (base de datos CodeQL) del código fuente y ejecuta las consultas.
5. **Carga SARIF**: Los resultados se exportan en formato SARIF (Static Analysis Results Interchange Format) y se envían a la sección **Security -> Code scanning** de GitHub.

## 3. Estrategia de Ejecución

El workflow está configurado bajo una estrategia de ejecución óptima para entornos de desarrollo continuo:

- **Push Triggers**: Se ejecuta en cada `push` directo o mezcla (merge) en las ramas protegidas `main` y `develop`.
- **Pull Request Triggers**: Se ejecuta en cada pull request dirigido a las ramas `main` y `develop` para actuar como un guardrail de seguridad antes de integrar código.
- **Programación (Schedule)**: Se ejecuta de manera recurrente todos los **lunes a las 04:30 UTC** para asegurar que los nuevos patrones de vulnerabilidades descubiertos por GitHub se apliquen al código existente de forma retroactiva.

## 4. Mantenimiento

Para mantener el workflow actualizado y seguro:
- **Actualización de versiones de Actions**: Se utilizan las versiones mayores actuales (`actions/checkout@v4` y `github/codeql-action/...@v3`). Es recomendable revisar y actualizar estas versiones anualmente.
- **Modificación de reglas**: Si se requiere ignorar archivos específicos (por ejemplo, scripts de test local), se puede crear un archivo de configuración `codeql-config.yml` en la raíz de cada repositorio y referenciarlo en la acción `init` mediante el parámetro `config-file`.

## 5. Troubleshooting (Resolución de Problemas)

### A. El escaneo falla por falta de memoria (Timeout / OOM)
**Solución**: CodeQL puede requerir recursos significativos en bases de código muy grandes. Si un job falla por timeout, se puede incrementar el tiempo de espera del runner o excluir directorios no críticos (como código legado o tests pesados) mediante un archivo `codeql-config.yml`.

### B. Falso Positivo detectado
**Solución**: Si CodeQL marca una alerta que es un falso positivo o un riesgo aceptado:
1. Ir a la pestaña **Security -> Code scanning** en GitHub.
2. Localizar la alerta específica.
3. Hacer clic en **Dismiss alert** y seleccionar la justificación adecuada (falso positivo, usado en tests, riesgo aceptado) junto con un comentario justificativo.

### C. Error en repositorios sin código ejecutable (ej. `ai-knowledge`)
**Solución**: CodeQL requiere al menos un archivo del lenguaje seleccionado para inicializarse correctamente. Si el repositorio `ai-knowledge` no tiene archivos `.js` o `.ts`, el job puede completarse con advertencias o no realizar ningún hallazgo. Esto es normal y esperado mientras el repositorio actúe únicamente como base de datos de Markdown. Si en el futuro se añaden scripts de automatización en TypeScript/JavaScript, CodeQL los detectará y escaneará automáticamente sin requerir configuraciones adicionales.
