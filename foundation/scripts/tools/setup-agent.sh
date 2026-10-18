#!/bin/bash
MISSION_NAME=$1

# Verifica si el nombre de la misión está vacío
if [ -z "$MISSION_NAME" ]; then
    echo "❌ Error: Debes indicar un nombre para la misión."
    echo "Ejemplo: sh tools/setup-agent.sh feature-auth"
    exit 1
fi

TARGET_DIR="../.trees/$MISSION_NAME"

echo "🛠️ Creando Sandbox para Agente: $MISSION_NAME"
echo "📂 Ubicación: $TARGET_DIR"

# Crear el worktree y la rama vinculada
git worktree add -b "$MISSION_NAME" "$TARGET_DIR"

# Inyectar secretos si existen (con espacios corregidos)
if [ -f .env ]; then
    cp .env "$TARGET_DIR/.env"
    echo "🔑 Archivo .env copiado al sandbox."
fi

echo "✅ Misión lista. Abre la carpeta $TARGET_DIR con tu editor."
