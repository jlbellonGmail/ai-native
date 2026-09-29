# **PRD: Sitio Web Corporativo y Plataforma de Servicios de IA**

El Contrato de lo que el sistema debe ser

## **1\. Visión General**

* **Objetivo:** Crear una presencia digital líder que posicione a la empresa como experta en consultoría y servicios de Inteligencia Artificial.  
* **Contexto Estratégico (Job-to-be-Done):** El sitio no solo debe informar, sino actuar como un puente de confianza que transforme la curiosidad del cliente B2B en una decisión de inversión clara en IA.  
  
* **Enfoque de Citabilidad (AEO):** Estructurar el contenido de manera que los motores de respuesta (ChatGPT, Gemini, Perplexity) identifiquen a la empresa como una fuente de autoridad en servicios de IA.
* **Conversión Objetivo:** Convertir visitantes en leads cualificados durante los primeros 6 meses post‑lanzamiento, con una meta inicial de conversión demo → contacto ≥ 3% .
* **Riesgos Estratégicos:** Dependencia de APIs de terceros (costos, latencia, cambios de términos). Mitigación: caché, proveedores alternativos y límites de consumo.


## **2\.  Estándares de Organización y Estructura**

Para garantizar la mantenibilidad y el crecimiento escalable, el proyecto debe seguir estrictamente la siguiente jerarquía de directorios basada en la Metodología Diátaxis:

```
AI-PROJECT-FOUNDATION
|   .cursorrules.md                 # Reglas obligatorias para el IDE/IA (estilo, arquitectura, límites técnicos)
|   AGENTS.md                       # Contrato maestro: misión, límites y autoridad de los agentes de IA
|   CHANGELOG.md                    # Historial de versiones y cambios relevantes de la plantilla/proyecto
|   README.md                       # Documento principal de entrada: visión, arquitectura y guía rápida
|   tree.txt                        # Snapshot informativo de la estructura del proyecto (referencia humana)
|   
+---.agent                          # Configuración operativa específica para agentes IA
|   +---rules                       # Reglas especializadas que los agentes deben obedecer
|   |       ui-style.md             # Lineamientos de diseño UI/UX (accesibilidad, claridad, anti-overdesign)
|   |       
|   \---workflows                   # Workflows de agentes (deploy, code-review, tareas repetibles)
|                                   # (pueden agregarse prompts o flujos automatizados)
|
+---.antigravity                    # Espacio reservado para skills persistentes o tooling del agente
|                                   # (memorias, capacidades extendidas, plugins internos)
|
+---docs                            # Base de Conocimiento central del proyecto (Wiki viva)
|   |   help_index.md               # Índice general de ayuda para usuarios y desarrolladores
|   |                               # Punto de entrada a la documentación funcional
|   |
|   +---artifacts                   # Evidencias de ejecución: walkthroughs, logs, salidas de agentes
|   +---assets                      # Recursos visuales: diagramas, capturas, imágenes de apoyo
|   |
|   +---explanation                 # Documentación estratégica y conceptual
|   |       HELP_SYSTEM.md          # Contrato del sistema de ayuda y documentación viva (IA + producto)
|   |       MVP.md                  # Definición cerrada del MVP (alcance mínimo ejecutable)
|   |       PRD.md                  # Documento de requerimientos del producto (visión y estrategia)
|   |
|   +---reference                   # Documentación técnica y operativa de referencia
|   |       CHECKLIST_INICIALIZACION_PROYECTOS_IA.md  # Checklist paso a paso para iniciar proyectos desde la plantilla
|   |       RECOVERY_SOP.md          # Procedimiento de recuperación ante fallos o estados inválidos
|   |
|   +---templates                   # Plantillas estándar para gobernanza del repositorio
|   |       ISSUE_TEMPLATE.md       # Estructura obligatoria para reportar bugs, features o mejoras
|   |       PULL_REQUEST_TEMPLATE.md# Estructura obligatoria para revisar y aceptar cambios
|   |
|   \---tutorials                   # Guías prácticas paso a paso
|       +---dev_help                # Ayuda para desarrolladores (lógica, tests, arquitectura)
|       |       form_ejemplo.md     # Ejemplo de documentación técnica de un formulario/feature
|       |
|       \---ui_help                 # Ayuda para usuarios finales (uso funcional del sistema)
|               form_ejemplo.md     # Ejemplo de ayuda contextual mostrada en la UI (botón “?”)
|
+---prompts                         # Prompts versionados y gobernados
|   +---domain                      # Prompts de lógica de negocio y razonamiento del dominio
|   +---guardrails                  # Prompts de seguridad, formato y restricciones
|   \---system                      # Prompts de sistema (instrucciones núcleo para la IA)
|
+---src                             # Código fuente del proyecto (Arquitectura Hexagonal)
|   +---application                 # Capa de aplicación (casos de uso)
|   |   \---use-cases               # Implementación de interactors / flujos de negocio
|   |
|   +---domain                      # Núcleo del negocio (puro, sin dependencias técnicas)
|   |   |   AGENTS.md               # Reglas específicas para agentes que operan sobre el dominio
|   |   |
|   |   +---models                  # Entidades, Value Objects y tipos del dominio
|   |   \---services                # Servicios de dominio (lógica pura)
|   |
|   +---infrastructure              # Implementaciones técnicas y adaptadores
|   |   |   AGENTS.md               # Reglas para agentes que tocan infraestructura
|   |   |
|   |   +---api                     # Adaptadores de entrada/salida (REST, GraphQL, legacy)
|   |   +---db                      # Implementaciones de persistencia y acceso a datos
|   |   \---external                # Integraciones externas (pagos, servicios terceros)
|   |
|   \---modules                     # Módulos SaaS independientes (CRM, ERP, Tickets, etc.)
|
+---supabase                        # Backend-as-a-Service (ejemplo: Supabase/Postgres)
|   |   seed.sql                    # Datos de desarrollo y prueba (vacío o con ejemplos)
|   |                               # Puede ser generado por IA para simulaciones
|   |
|   \---migrations                  # Migraciones y políticas de base de datos
|           AGENTS.md               # Reglas para agentes que modifican esquema/RLS
|
\---test                            # Testing y aseguramiento de calidad
        TEST_STYLE.md               # Reglas de TDD, cobertura mínima y bloqueo ante fallos
		
```

### 2.1. Gestión de Versiones y Flujo de Trabajo (Git Workflow)

**Nota**: GitFlow se aplica al proyecto derivado.
La plantilla AI-PROJECT-FOUNDATION evoluciona únicamente mediante tags versionados.

* **Metodología**: El proyecto se rige bajo GitFlow. Toda nueva funcionalidad debe nacer en una rama feature/, integrarse en develop para pruebas y solo llegar a main tras validación.

* **Trazabilidad**: Cada commit debe estar vinculado a un requerimiento del PRD, garantizando que el historial de Git actúe como una auditoría técnica de la evolución del sistema.

## **3\. Objetivos de Negocio**

**Señales de Confianza 2026:** Integrar esquemas de validación externa y casos de uso verificables para mitigar la percepción de "humo" en el sector de la IA.
* 
* Definir claramente la identidad de la marca y servicios.  
* Generar leads mediante un catálogo de productos de IA.  
* Ofrecer herramientas de IA funcionales (Demos) como prueba de concepto.  
* **Validación de Valor (PoV):** Implementar mecanismos para que cada interacción de demo demuestre un retorno de inversión (ROI) potencial al usuario en menos de 2 minutos.  
* **Métrica de Leads:** Medir conversión demo → lead y tiempo medio hasta solicitud de contacto.


## **4\. Personas (Usuarios)**

* **Cliente Potencial**
  - Dolor principal: No sabe si la IA es aplicable a su negocio ni cuánto ROI real puede generar.
  - Acción objetivo: Probar una demo y solicitar contacto.
  - Métrica de éxito: Solicitud de contacto < 7 días desde la primera visita.

* **Socio Técnico**
  - Dolor principal: Duda sobre la escalabilidad y seguridad de la solución.
  - Acción objetivo: Revisar arquitectura y documentación técnica.
  - Métrica de éxito: Acceso al repositorio / docs avanzados.
 
* **Agentes de Rastreo:** Modelos de IA de terceros que analizan nuestro sitio para resumir nuestros servicios a otros usuarios.
* **Stakeholder de Compliance / Admin:** Requiere trazabilidad, control de datos y cumplimiento normativo en soluciones de IA.
*  AI-Intermediaries: Agentes autónomos de búsqueda que consumen nuestro sitio para recomendar nuestros servicios a humanos.


## **5\. Requisitos Funcionales (El Catálogo)**

### **5.1. Secciones Principales**

* **Home:** Propuesta de valor clara con estética "Modern SaaS" (Stripe/Vercel style).  
* **Estética Avanzada:** Uso de grids de estilo *Bento*, *Glassmorphism* y micro-animaciones vía Framer Motion para denotar "tecnología activa" que refuercen la identidad tecnológica. 
* **Servicios:** Consultoría, desarrollo a medida e integración de LLMs.  
* **Productos:** Catálogo de soluciones pre-configuradas.  
* **IA Playground:** Una zona interactiva donde los clientes puedan probar agentes de IA especializados (ej. analizador de documentos, optimizador de prompts).  
* **Centro de Autoridad (Blog/Citas):** Artículos técnicos estructurados para Answer Engine según AEO sitdo en visión general, con esquemas FAQ.
formato pregunta‑respuesta, micro‑resúmenes y marcado schema.org (FAQ / HowTo) para citabilidad en motores de respuesta .
* **Playground Sandbox :** Versión demo sin credenciales con datos sintéticos y límites operativos; versión avanzada para leads calificados.
*  Centro de Documentación: Ubicado en /docs/explanation/ (según estructura ideal) para educar al cliente sobre nuestra metodología.

### **5.2. Estándar de Interfaz para Grillas de Datos (UX)**

Todas las tablas de datos, listas de leads o paneles de administración deben cumplir con el estándar de "Grillas Inteligentes":

1. Manipulación de Columnas (Estilo WorkWithPlus):

 ```
   1. Ordenamiento: Cada cabecera permite alternar entre Ascendente y Descendente. Se debe mostrar una flecha (↑/↓) al lado del título de la columna.
   2. Filtrado Dinámico: Cada columna debe incluir un icono de embudo.
   3.  	Feedback Visual de Filtros: Cuando un filtro esté activo en una columna, el icono del embudo debe cambiar a un color distintivo (ej. Azul Primario). Si la columna está ordenada y filtrada simultáneamente, ambos iconos (flecha y embudo coloreado) deben ser visibles.
````

2. Paginación y Densidad:
   
```
	1. Lado Izquierdo: Selector de cantidad de registros por página (5, 10, 20, 50 y opción de Scroll Infinito). Integrado en las opciones del dropdown un input numérico para "Saltar a página" específica.
	2. Lado Derecho: Navegación tradicional (Anterior, números de página, Siguiente)Lado	
```

3. Exportación de Datos:

```
Botones persistentes para Exportar a Excel y Emitir PDF basados estrictamente en los datos visualizados (respetando filtros y orden actual).
```

### **5.3. IA Playground / Capacidades de IA**

* **Arquitectura de Memoria:** Los agentes del Playground deben ser capaces de recordar el contexto de la sesión actual para guiar al usuario en el embudo de ventas.  

* **Capa de Verificabilidad:** Todas las respuestas de IA generadas en el sitio deben incluir citas a nuestra propia documentación para evitar alucinaciones. Retención por sesión y usuario, con opción de borrado manual .

* **Trazabilidad de Respuestas :** Cada respuesta debe incluir metadata mínima: modelo, versión, timestamp y fuente de contexto .

* Integración con modelos de lenguaje (Gemini 3, Claude 3.7).  
  
* Procesamiento de lenguaje natural para atención al cliente interna.  

## **6\. Requisitos No Funcionales**

* **Rendimiento:** Carga inicial \< 1.5s.  
* **Métrica Crítica:** LCP (Largest Contentful Paint) inferior a 1.2 segundos para maximizar la retención.  
* **SEO:** Según el enfoque AEO definido en visión general.  
* **Seguridad:** Manejo seguro de API Keys y datos de usuario.  
* **Protección de Inyección:** Implementar guardrails automáticos contra ataques de *prompt injection* en todas las interfaces de IA pública.  
* **Accesibilidad WCAG 2.1:** Garantizar que las herramientas de IA sean utilizables por personas con discapacidades visuales.
* **Política de Retención de Logs :** Retención por defecto de 30 días con posibilidad de extensión auditada.
*  Métricas de Experiencia (CWV): LCP (Largest Contentful Paint) inferior a 1.2 segundos e INP (Interaction to Next Paint) < 200ms.
*  Protección Agéntica: Implementar guardrails contra ataques de prompt injection y logs de razonamiento trazables para auditoría legal.

## **7\. Stack Tecnológico Sugerido**

El stack tecnológico aquí descrito es una referencia recomendada y podrá ajustarse sin alterar los objetivos funcionales del PRD.

* **Frontend:** Next.js 15+ (App Router), Tailwind CSS 4\.  
* **Biblioteca de UI:** shadcn/ui para asegurar componentes consistentes que el agente pueda replicar sin errores visuales.  
* **Backend/DB:** Supabase (PostgreSQL \+ pgvector).  
* **IA-Native DB:** Uso de búsqueda vectorial para alimentar el Playground con nuestra propia base de conocimientos.  
* **IA:** Vercel AI SDK, OpenAI/Anthropic/Google APIs.  
* **Diseño Agéntico:** Integración de Stitch MCP para que los agentes generen assets visuales (iconos, fondos) coherentes con la marca en tiempo real.
keys con rotación automática y control por roles .
* **Caché y Edge :** Estrategia de caché por tipo de objeto y rendering en edge para contenido público.
*  Arquitectura de Datos: Uso del Modelo Pool (Shared Schema) con políticas de Row-Level Security (RLS) para aislamiento total de datos de clientes.
*  Diseño Agéntico: Integración de Stitch MCP para que los agentes generen componentes UI/UX consistentes y sigan el sistema de diseño. 

### **7.1. Sistema de Diseño y Brand Guidelines**

* **Tokens de Diseño**: Los colores corporativos, tipografías y espaciados se definirán como variables globales en Tailwind CSS para asegurar consistencia en todo el sitio.

* **Componentes Consistentes**: Se utilizará la biblioteca shadcn/ui como base, lo que permite que el agente de IA replique la interfaz sin errores visuales ni desviaciones de marca.

## **8\. Criterios de Éxito (KPIs)**

* Funcionalidad completa del catálogo de servicios.  
* Capacidad de procesar consultas de IA en tiempo real sin errores.  
* **IQ (Intent Quality):** El agente de atención debe identificar correctamente la intención del lead en el 95% de los casos.  
* **OQ (Outcome Quality):** Las respuestas de IA deben tener un índice de utilidad calificado por el usuario \> 4.5/5.
de respuesta y visibilidad como fuente .
* **KPIs de Demo :** Tiempo medio para visualizar ROI y tasa demo → contacto.
*  Integridad de Misión: Integridad = (Casos de uso validados / commit realizados).* 100. Meta: > 95%.


## **9\. Reglas de Ejecución y Gobernanza (Profesional)**

Cualquier nuevo componente debe respetar estrictamente el archivo de configuración de marca definido en el repositorio

* **Contratos Inalterables:** Una vez aprobada la arquitectura de base de datos y las firmas de API en la Fase 1, el agente NO podrá modificarlas sin permiso explícito.  
* **Verificación vía Artefactos:** El agente de Antigravity debe generar un Walkthrough grabado (video o screenshots) al finalizar cada sección funcional para revisión del usuario.
  
* **Código Limpio (DRY):** El agente debe auditar cada archivo generado para evitar duplicidad y deuda técnica innecesaria.
    
* **Documentación de Intención:** Cada cambio significativo en el código debe ir acompañado de una actualización en un archivo CHANGELOG.md del repositorio.

* **Gobernanza Técnica :** Cambios en schema o APIs requieren doble aprobación técnica documentada .
* **Documentación Obligatoria:** Cada funcionalidad de UI nueva debe incluir una captura de pantalla en docs/assets/ y ser documentada en docs/reference/ o docs/explanation/.
* **Documentación de Intención:** Antes de codificar, el agente debe proponer un Implementation Plan Artifact y esperar aprobación. 
* **Estructura de Carpetas Obligatoria:** Respetar el esquema de directorios definido en la imagen de referencia (docs/, src/, test/, supabase/).
* **Checkpoints:** Uso obligatorio de la herramienta de Antigravity para crear puntos de restauración antes de misiones críticas.
* **Protocolo de Error:** Si la confianza del modelo es < 0.8, el agente debe detenerse e interrogar al usuario mediante una entrevista socrática.
* Arquitectura Hexagonal: El agente debe separar estrictamente domain (lógica) de infrastructure (adaptadores). No mezclar lógica de IA con componentes UI.
* Documentación de Intención: Antes de codificar, el agente debe proponer un Implementation Plan Artifact y esperar aprobación activa (HITL).

### **9.1. Protocolo de Versionado y Resguardo**

* **Workflow de Git**: Se prohíbe el trabajo directo sobre la rama de producción. El uso de ramas garantiza la Garantía de Rollback (capacidad de volver a una versión estable anterior en segundos ante fallos en el servidor del cliente).

* **Gobernanza* del Código*: El flujo de trabajo asegura que cada actualización instalada en los clientes sea una versión certificada, evitando la dispersión de versiones y asegurando la compatibilidad con actualizaciones críticas (ARCA/Bancos).

## **10\. Cumplimiento Ético y Legal (ISO 42001)**
* **Transparencia:** El sitio debe declarar explícitamente cuándo el usuario está interactuando con un agente de IA.
* **Gestión de Riesgos:** El agente debe generar un informe automático de impacto algorítmico antes de desplegar nuevas funciones en el Playground.
* **Privacidad desde el Diseño:** Implementar anonimización automática de PII (Personally Identifiable Information) en los logs de entrenamiento.

## 11\. Alcance y No-Alcance
* Incluye:
  - Sitio corporativo
  - Playground con demos limitadas
  - Captura de leads

* No incluye:
  - Integraciones custom por cliente
  - Entrenamiento con datos productivos
  - SLAs enterprise en Fase 1


## 12\. Roadmap de Alto Nivel
* Fase 1 – MVP
  - Catálogo
  - 2 demos IA
  - Captura de leads

* Fase 2 – Escalado
  - Playground autenticado
  - Métricas avanzadas
  - Casos de uso reales

* Fase 3 – Optimización IA
  - Personalización por industria
  - Agentes especializados


## 13\. Decisiones Clave de Producto

- Se prioriza **demostrabilidad de valor (ROI visible < 2 minutos)** por sobre profundidad funcional, para acelerar la conversión de leads en etapas tempranas.

- Se limita el número de demos a **2 en Fase 1** para reducir complejidad operativa y maximizar claridad del mensaje comercial.

- Se prioriza el **IA Playground** como activo central de conversión por sobre contenido editorial avanzado en Fase 1.

- Se sacrifica personalización por cliente en favor de **escalabilidad y repetibilidad** durante el MVP.

- La citabilidad (AEO) se considera un **objetivo estratégico de producto**, no solo de marketing.


## 14\. Criterios de Éxito y Acción Correctiva

- Si la conversión demo → contacto es < 3% luego de 60 días:
  - Revisar propuesta de valor del Playground.
  - Ajustar narrativa de ROI en los primeros 30 segundos.

- Si el OQ (Outcome Quality) es < 4.5/5:
  - Auditar fuentes de contexto.
  - Refinar la capa de verificabilidad y citación.

- Si el IQ (Intent Quality) es < 95%:
  - Reentrenar prompts base del agente.
  - Simplificar el árbol de clasificación de intención.

- Si LCP o INP superan los límites definidos:
  - Priorizar optimización de frontend antes de agregar nuevas funcionalidades.

## 15\. Definición de Hecho (Definition of Done)

Una funcionalidad se considera completa únicamente si:

- Está documentada en docs/reference/ o docs/explanation/.
- Tiene evidencia visual en docs/assets/.
- Cumple con métricas de rendimiento y seguridad definidas.
- Puede ser explicada correctamente por el agente de IA sin intervención humana.
- No introduce deuda técnica ni rompe contratos definidos.

## 16\. Supuestos y Riesgos Abiertos

- Se asume que los usuarios B2B están dispuestos a interactuar con demos de IA sin fricción inicial.
- Se asume estabilidad razonable de APIs de terceros durante la Fase 1.
- Riesgo de sobrecarga cognitiva si el Playground no guía adecuadamente al usuario.
- Riesgo reputacional si la IA genera respuestas no verificables; mitigado por la capa de citación.

## 17\. **Decisión de Congelamiento del PRD**

- Este PRD se considera **congelado** una vez iniciado el MVP.
- Ninguna modificación al PRD puede realizarse durante la Fase MVP.
- Cambios estratégicos se documentarán como PRD v2 para fases posteriores.

Fecha de congelamiento PRD v1: __ / __ / 2026
Responsable de aprobación: __________________