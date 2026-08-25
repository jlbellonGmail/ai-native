<#============================================================================
  Script: bootstrap-template.ps1
  Propósito: Clonar/initializar un nuevo proyecto desde el template AI-Native.
  Modo: Build / Write (se ejecuta una sola vez por proyecto nuevo).
  Referencia: AGENTS.md sección "Setup manual" y ROADMAP.md.
============================================================================>
#>>

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,

    [Parameter()]
    [string]$Organization = "jlbellonGmail",

    [Parameter()]
    [string]$RepoName = "template",

    [Parameter()]
    [switch]$InitializeGit = $true,

    [Parameter()]
    [switch]$SetupRemotes = $true
)

$templateDir = "D:\proyectos\template"
$targetDir = Join-Path $env:USERPROJECTOR $ProjectName

Write-Host "=== Bootstrap del template AI-Native ===" -ForegroundColor Cyan
Write-Host "Proyecto: $ProjectName" -ForegroundColor White
Write-Host "Directorio destino: $targetDir" -ForegroundColor White

# 1. Verificar que estamos en un template válido
if (-not (Test-Path "$templateDir\.agentic\schemas\agents.schema.json")) {
    Write-Error "No se encontró el template válido en $templateDir"
    return 1
}

Write-Host "✓ Template válido detectado" -ForegroundColor Green

# 2. Crear directorio del proyecto
if (Test-Path $targetDir) {
    Write-Warning "El directorio $targetDir ya existe. Se reutilizará."
} else {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    Write-Host "✓ Directorio creado" -ForegroundColor Green
}

# 3. Copiar estructura base (excluyendo runs/ y .git/)
Write-Host "Copiando estructura base..." -ForegroundColor Yellow
Copy-Item -Path "$templateDir\*" -Destination $targetDir -Recurse -Force -Filter ".gitignore" -ErrorAction SilentlyContinue

# Excluir carpetas y archivos que no deben copiarse
$excludePatterns = @(
    ".git",
    ".agentic/schemas",  # Se regenerarán
    "runs",             # Ejemplos propios del repo original
    ".pytest_cache",
    "qa-pid.txt",
    "opencode.json",    # Se regenerará desde .agentic
    ".mcp.json",
    ".github/workflows" # Se copiarán selectivamente
)

foreach ($pattern in $excludePatterns) {
    Remove-Item -Path "$targetDir\$pattern" -Recurse -Force -ErrorAction SilentlyContinue
}

# 4. Copiar .agentic/ (esencial)
Write-Host "Copiando configuración .agentic..." -ForegroundColor Yellow
Copy-Item -Path "$templateDir\.agentic" -Destination (Join-Path $targetDir ".agentic") -Recurse -Force

# 5. Copiar docs/ estructura mínima
Write-Host "Copiando documentación base..." -ForegroundColor Yellow
$docsSource = "$templateDir\docs"
$docsTarget = (Join-Path $targetDir "docs")
if (Test-Path $docsSource) {
    Copy-Item -Path "$docsSource\*" -Destination $docsTarget -Recurse -Force
    # Remover ejemplos de features ajenos
    Remove-Item -Path "$docsTarget\tecnica\adopcion-proyecto-existente.md" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$docsTarget\usuario\adopcion-proyecto-existente.md" -Force -ErrorAction SilentlyContinue
}

# 6. Copiar scripts esenciales
Write-Host "Copiando scripts esenciales..." -ForegroundColor Yellow
$scriptsSource = "$templateDir\scripts"
$scriptsTarget = (Join-Path $targetDir "scripts")
if (Test-Path $scriptsSource) {
    Copy-Item -Path "$scriptsSource\*" -Destination $scriptsTarget -Recurse -Force
    # Remover scripts de adopción si no aplica
    Remove-Item -Path "$scriptsTarget\check-adoption-conflicts.ps1" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$scriptsTests\test_check_adoption_conflicts.py" -Force -ErrorAction SilentlyContinue
}

# 7. Copiar configuración raíz
Write-Host "Copiando configuración raíz..." -ForegroundColor Yellow
$rootFiles = @(
    "AGENTS.md",
    "ROADMAP.md",
    "mkdocs.yml",
    "pytest.ini",
    "requirements-dev.txt",
    "CLAUDE.md",
    ".claude\settings.local.json"
)
foreach ($file in $rootFiles) {
    $src = (Join-Path $templateDir $file)
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination (Join-Path $targetDir $file) -Force
    }
}

# 8. Inicializar ROADMAP.md con nuevo item
Write-Host "Configurando ROADMAP.md..." -ForegroundColor Yellow
$roadmapPath = (Join-Path $targetDir "ROADMAP.md")
if (Test-Path $roadmapPath) {
    $roadmapContent = Get-Content -Path $roadmapPath -Raw
    # Agregar nuevo item al ROADMAP.md al final (antes del cierre)
    # Formato: [ ] NN-slug - Descripción
    $nuevoItem = "[$(if ($InitializeGit) { ']' } else { ' ' })] 00-$($ProjectName.ToLower().Replace(" ", "-")) - $ProjectName"
    
    # Si el ROADMAP ya tiene items, agregar al final
    if ($roadmapContent -match "\[ \] ") {
        # Insertar nuevo item antes de la última línea si es [x]
        $lines = $roadmapContent -split "`n"
        $lastLine = $lines[-1]
        if ($lastLine -match "\[x\]") {
            # Reemplazar último [x] por nuevo item + mantener el último
            $lines[$lines.Count - 1] = $nuevoItem
        } else {
            # Agregar nuevo item al final
            $lines += $nuevoItem
        }
        $roadmapContent = $lines -join "`n"
        Set-Content -Path $roadmapPath -Value $roadmapContent -Encoding utf8
        Write-Host "✓ ROADMAP.md actualizado con item $ProjectName" -ForegroundColor Green
    }
}

# 9. Configurar Git initial (si corresponde)
if ($InitializeGit) {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Yellow
    pushd $targetDir
    
    # Git init y config básica
    git init
    git config user.email "agent@template.ai"
    git config user.name "AI-Native Template"
    
    # Hacer commit inicial de la estructura
    Add-Content -Path "README-template.md" -Value "# $ProjectName - Proyecto nuevo usando template AI-Native
    
    Este proyecto fue inicializado usando el template AI-Native.
    Véase: https://github.com/jlbellonGmail/template"
    
    git add -A
    git commit -m "feat: init $ProjectName from AI-Native template"
    
    popd
    Write-Host "✓ Repositorio Git inicializado" -ForegroundColor Green
}

# 10. Configurar remotes (opcional)
if ($SetupRemotes) {
    Write-Host "Configurando remotes Git..." -ForegroundColor Yellow
    if ($InitializeGit -or (Test-Path (Join-Path $targetDir ".git"))) {
        $remoteUrl = "https://github.com/$Organization/$RepoName.git"
        try {
            git -C $targetDir remote add origin $remoteUrl
            Write-Host "✓ Remote origin configurado: $remoteUrl" -ForegroundColor Green
        } catch {
            Write-Warning "No se pudo agregar remote origin (¿ya existe?)"
        }
    }
}

# 11. Validación final
Write-Host "=== Validación final ===" -ForegroundColor Cyan

$errors = @()

# Verificar .agentic/schemas
if (-not (Test-Path (Join-Path $targetDir ".agentic\schemas\agents.schema.json"))) {
    $errors += "Falta .agentic/schemas/agents.schema.json"
}

# Verificar agents.json
if (-not (Test-Path (Join-Path $targetDir ".agentic\agents.json"))) {
    $errors += "Falta .agentic/agents.json"
}

# Verificar models.json
if (-not (Test-Path (Join-Path $targetDir ".agentic\models.json"))) {
    $errors += "Falta .agentic/models.json"
}

# Verificar AGENTS.md
if (-not (Test-Path (Join-Path $targetDir "AGENTS.md"))) {
    $errors += "Falta AGENTS.md"
}

if ($errors.Count -gt 0) {
    Write-Error "Validación fallida:" $errors
    return 1
}

Write-Host "✓ Todas las validaciones pasaron" -ForegroundColor Green

# 12. Mensaje final
Write-Host "" -ForegroundColor Cyan
Write-Host "=== Bootstrap completado exitosamente ===" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Cyan
Write-Host "Próximos pasos:" -ForegroundColor White
Write-Host "  1. Revisar AGENTS.md y ROADMAP.md para tu proyecto" -ForegroundColor Gray
Write-Host "  2. Ejecutar: pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1" -ForegroundColor Gray
Write-Host "  3. Ejecutar: pytest -v tests/ para validar estructura" -ForegroundColor Gray
Write-Host "  4. Ejecutar: pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\ready-for-pr.ps1 -Mode Feature -Slug 00-$($ProjectName.ToLower().Replace(" ", "-"))" -ForegroundColor Gray
Write-Host "" -ForegroundColor Cyan
Write-Host "Documentación: docs/tecnica/arquitectura.md y docs/producto/contexto-producto.md" -ForegroundColor Gray
Write-Host "===== ¡Tu proyecto AI-Native está listo! =====" -ForegroundColor Green

return 0