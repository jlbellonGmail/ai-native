import os
import shutil
import subprocess

def bootstrap():
    print("--- AI-Native: Bootstrapping v10/10 ---")
    name = input("Nombre del nuevo proyecto: ").strip()
    
    # Rutas relativas según tu ecosistema
    template_path = "../../_ai-project-template"
    target_path = f"../../{name}"

    if os.path.exists(target_path):
        print("Error: El proyecto ya existe.")
        return

    # 1. Clonación Eficiente (Ignorando .git de la plantilla)
    shutil.copytree(
        template_path, 
        target_path, 
        ignore=shutil.ignore_patterns(
            '.git',           # No copiar el historial de la plantilla
            'node_modules',   # BLOQUEO CRÍTICO: No copiar dependencias pesadas
            '__pycache__',    # No copiar archivos temporales de Python
            '.next',          # No copiar el build de Next.js
            'dist'            # No copiar archivos compilados
        )
    )


    # 2. Inyección de Identidad (Personalización de metadatos)
    # Se usa un mapping para respetar las reglas de nombre de npm en package.json
    mapping = {
        "AI_ENTRYPOINT.md": "{{PROJECT_NAME}}",
        "package.json": "project-name"
    }
    
    for file_name, replacement_token in mapping.items():
        file_path = os.path.join(target_path, file_name)
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                content = f.read().replace(replacement_token, name)
            with open(file_path, "w") as f:
                f.write(content)

    # 3. Inicialización de Repositorio Git Limpio
    subprocess.run(["git", "init"], cwd=target_path)

    # 4. Inicialización de Memoria (Engram)
    try:
        subprocess.run(["engram", "init"], cwd=target_path)
        print(f"✅ Memoria Engram activa en {name}")
    except:
        print("⚠️ Engram no detectado en el PATH.")

    print(f"\n🚀 Proyecto '{name}' creado exitosamente.")

if __name__ == "__main__":
    bootstrap()
