# Workflow: Ciclo AI-TDD

Este workflow rige la creación de cualquier nueva funcionalidad en el sistema para asegurar la excelencia.

## Paso 1: Definición de la Misión (Red Phase)

1.El **Agente Desarrollador** crea un test unitario en la carpeta test/ del proyecto Template.

2. El test debe basarse estrictamente en los requisitos del PRD.

3. Ejecutar el test. El resultado **DEBE SER FALLIDO** (Rojo).

4. El **Agente Juez** valida que el test falle por las razones correctas.

## Paso 2: Implementación Mínima (Green Phase)

1. El **Agente Desarrollador** implementa únicamente el código necesario para que el test pase a Verde.

2. Está prohibido añadir funcionalidades extra o "adelantar" lógica no probada.

## Paso 3: Refactorización y Excelencia (Refactor Phase)

1. Con el test en verde, se optimiza el código.

2. Se aplica el estándar `snake_case` y se añade documentación JSDoc.

3. El **Agente Juez** realiza la verificación final y autoriza el paso a producción.

