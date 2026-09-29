#!/bin/bash
TASK_ID=$1
BRANCH_NAME="feat/agent-$TASK_ID"
TARGET_DIR=".trees/$TASK_ID"

echo "🚀 Creando sandbox para agente en: $TARGET_DIR"

# 1. Crear worktree
git worktree add -b $BRANCH_NAME $TARGET_DIR

# 2. Copiar secretos de forma segura [14, 15]
cp.env $TARGET_DIR/.env

# 3. Inicializar entorno
cd $TARGET_DIR && npm install

echo "✅ Agente listo para operar en $TARGET_DIR. Usa GitLens para auditar cambios."