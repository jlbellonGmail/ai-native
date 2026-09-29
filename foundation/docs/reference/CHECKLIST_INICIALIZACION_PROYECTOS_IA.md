
## CHECKLIST FINAL DE USO

**(Cómo copiar esto en un proyecto nuevo, sin romper nada)**

```
docs/
└── reference/
    └── CHECKLIST_INICIALIZACION_PROYECTOS_IA.md
```

### ✅ Checklist de Inicialización de Proyecto

#### A. Preparación

* [ ] Crear repositorio vacío
* [ ] Definir nombre del proyecto (ej. `mi-proyecto`)
* [ ] Confirmar stack base (frontend, backend, DB)

#### B. Copiado de estructura

* [ ] Copiar carpetas raíz:

  * `.agent/`
  * `.antigravity/`
  * `prompts/`
  * `docs/`
  * `src/`
  * `supabase/`
  * `test/`
* [ ] Copiar archivos raíz:

  * `.cursorrules`
  * `AGENTS.md`
  * `README.md`

#### C. Documentación estratégica (orden obligatorio)

* [ ] Leer **docs/explanation/PRD.md**
* [ ] Leer **docs/explanation/MVP.md**
* [ ] Confirmar que el MVP no contradice el PRD
* [ ] NO modificar PRD ni MVP una vez iniciado el desarrollo

#### D. Activación de agentes

* [ ] Verificar `/AGENTS.md`
* [ ] Verificar reglas en `/.agent/rules/`
* [ ] Confirmar que el agente entiende:

  * autoridad
  * límites
  * escalado
  * corte

#### E. Desarrollo

* [ ] Programar siguiendo `/.cursorrules`
* [ ] Dominio puro `/src/domain/AGENTS.md`
* [ ] Infra desacoplada `/src/infrastructure/AGENTS.md`
* [ ] Migraciones inmutables `/supabase/migrations/AGENTS.md`


#### F. Testing y seguridad

* [ ] Aplicar `/test/TEST_STYLE.md`
* [ ] No avanzar con tests fallidos
* [ ] Validar RLS y migrations

#### G. Incidentes

* [ ] Usar `/docs/reference/RECOVERY_SOP.md`
* [ ] Detener agente ante regla de corte

👉 Si todos los checks están en verde, el proyecto está **operativo y seguro**.

