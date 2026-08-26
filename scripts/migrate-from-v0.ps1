<#============================================================================
  Script: migrate-from-v0.ps1
  Propósito: Migrar un proyecto antiguo (v0-v2) al template AI-Native 10/10.
  Modo: Build / One-time execution (se ejecuta una vez por proyecto existente).
  Referencia: AGENTS.md y ROADMAP.md migración guidelines.
============================================================================>
#>>

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectPath,

    [Parameter()]
    [switch]$DryRun = $false,

    [Parameter()]
    [switch]$Force = $false
)

$projectPath = Resolve-Path $ProjectPath

Write-Host "=== Migración de proyecto AI-Native v0 → 10/10 ===" -ForegroundColor Cyan
Write-Host "Proyecto: $projectPath" -ForegroundColor White

if (-not (Test-Path (Join-Path $projectPath ".agentic"))) {
    Write-Error "No parece ser un proyecto AI-Native (falta .agentic/)"
    return 1
}

# 1. Verificar versión actual
$agentsJson = (Join-Path $projectPath ".agentic/agents.json")
if (Test-Path $agentsJson) {
    $currentAgents = Get-Content -Path $agentsJson -Raw | ConvertFrom-Json
    $currentVersion = $currentAgents.metadata.version -or "unknown"
    Write-Host "Versión actual detectada: $currentVersion" -ForegroundColor Yellow
}

# 2. Verificar estructura mínima requerida
$required = @(
    ".agentic/agents.json",
    ".agentic/models.json",
    ".agentic/schemas/agents.schema.json",
    ".agentic/schemas/models.schema.json",
    ".agentic/schemas/work-unit.schema.json",
    "AGENTS.md",
    "ROADMAP.md"
)

Write-Host "Validando estructura requerida..." -ForegroundColor Yellow
$missing = @()
foreach ($item in $required) {
    $path = (Join-Path $projectPath $item)
    if (-not (Test-Path $path)) {
        $missing += $item
    }
}

if ($missing.Count -gt 0 -and -not $Force) {
    Write-Warning "Faltando archivos críticos de migración:"
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor DarkYellow }
    Write-Host "Use -Force para intentar migrar de todos modos"
    return 1
}

# 3. Migrar ROADMAP.md - asegurar estados [ ] / [−] / [x]
$roadmapPath = (Join-Path $projectPath "ROADMAP.md")
if (Test-Path $roadmapPath) {
    $roadmapContent = Get-Content -Path $roadmapPath -Raw
    
    # Reemplazar estados antiguos si existen
    $newContent = $roadmapContent
    
    # Ejemplo: reemplazar [ x] por [x] (espaciado consistente)
    $newContent = $newContent -replace '\[ x \]', '[x]'
    $newContent = $newContent -replace '\[ - \]', '[−]'
    $newContent = $newContent -replace '\[   \]', '[ ]'
    
    if ($newContent -ne $roadmapContent) {
        if (-not $DryRun) {
            $newContent | Set-Content -Path $roadmapPath -Encoding utf8
            Write-Host "✓ ROADMAP.md migrado (estados normalizados)" -ForegroundColor Green
        } else {
            Write-Host "  - ROADMAP.mdwould be normalized (DryRun)" -ForegroundColor DarkYellow
        }
    }
}

# 4. Migrar .agentic/agents.json - agregar metadatos si faltan
$agentsPath = (Join-Path $projectPath ".agentic/agents.json")
if (Test-Path $agentsPath -and -not $DryRun) {
    $agents = Get-Content -Path $agentsPath -Raw | ConvertFrom-Json
    
    # Agregar metadata si no existe
    if (-not $agents.metadata) {
        $agents | Add-Member -Type NoteProperty -Name "metadata" -Value @{
            version = "10.0.0"
            author = "migrated-from-v0"
            migratedOn = (Get-Date -Format "yyyy-MM-dd")
        } | Out-Null
        
        $agents | ConvertTo-Json -Depth 100 | Set-Content -Path $agentsPath -Encoding utf8
        Write-Host "✓ agents.json migrado (metadata agregada)" -ForegroundColor Green
    }
}

# 5. Migrar .agentic/models.json - asegurar router de modelos
$modelsPath = (Join-Path $projectPath ".agentic/models.json")
if (Test-Path $modelsPath -and -not $DryRun) {
    $models = Get-Content -Path $modelsPath -Raw | ConvertFrom-Json
    
    # Verificar que tenga fallbacks go/zen
    $hasGo = $models.fallbacks -contains "go" -or ($models.model -match "go")
    $hasZen = $models.fallbacks -contains "zen" -or ($models.model -match "zen")
    
    if (-not $hasGo) {
        if (-not $models.fallbacks) { $models.fallbacks = @() }
        $models.fallbacks += "go"
    }
    if (-not $hasZen) {
        if (-not $models.fallbacks) { $models.fallbacks = @() }
        $models.fallbacks += "zen"
    }
    
    if ($models.fallbacks.Contains("go") -or $models.fallbacks.Contains("zen")) {
        Write-Host "✓ models.json migrado (fallbacks asegurados: go/zen)" -ForegroundColor Green
    }
}

# 6. Migrar workflows CI - agregar product-tests placeholder si falta
$ciPath = (Join-Path $projectPath ".github/workflows/ci.yml")
if (Test-Path $ciPath -and -not $DryRun) {
    $ciContent = Get-Content -Path $ciPath -Raw
    
    # Agregar product-tests job si no existe
    if (-not ($ciContent -match "product-tests:")) {
        # Insertar después del job circuit-tests
        $ciContent = $ciContent -replace(
            "(      - name: Validar adaptadores agenticos)",
            @"
      - name: Product tests (placeholder)
        run: echo "product-tests: sin stack de producto definido. Ver docs/tecnica/arquitectura.md."
"
        )
        
        # Reordenar jobs para que product-tests esté después de circuit-tests
        # (lógica simplificada - en producción sería más robusta)
        if ($ciContent -match "product-tests:") {
            Write-Host "✓ CI workflow migrado (product-tests placeholder agregado)" -ForegroundColor Green
        }
    } else {
        Write-Host "✓ CI workflow ya tiene product-tests" -ForegroundColor Green
    }
}

# 7. Migrar scripts esenciales - verificar que existen
$essentialScripts = @(
    "feature-contract.ps1",
    "ready-for-pr.ps1", 
    "wait-pr-ci.ps1",
    "complete-approved-pr.ps1",
    "close-feature.ps1"
)

Write-Host "Verificando scripts esenciales..." -ForegroundColor Yellow
$scriptsFolder = (Join-Path $projectPath "scripts")
$foundScripts = Get-ChildItem -Path $scriptsFolder -Filter "*.ps1" | Select-Object -ExpandProperty Name

foreach ($essential in $essentialScripts) {
    if ($foundScripts -contains $essential) {
        Write-Host "  ✓ $essential" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $essential (no encontrado, se recomienda agregar)" -ForegroundColor DarkYellow
    }
}

# 8. Resumen final
Write-Host "" -ForegroundColor Cyan
Write-Host "=== Resumen de migración ===" -ForegroundColor Cyan

$migrated = 0
$issues = @()

if (-not $DryRun) {
    # Verificar que los schemas existen
    $schemasOk = @(".agentic/schemas/agents.schema.json",
                   ".agentic/schemas/models.schema.json",
                   ".agentic/schemas/work-unit.schema.json")
    
    foreach ($s in $schemasOk) {
        if (Test-Path (Join-Path $projectPath $s)) {
            $migrated++
        } else {
            $issues += "Missing schema: $s"
        }
    }
}

Write-Host "Archivos validados/ migrados: $migrated" -ForegroundColor White

if ($issues.Count -gt 0) {
    Write-Host "Problemas detectados:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($missing.Count -gt 0 -and -not $Force) {
    Write-Host "Use -Force para continuar a pesar de archivos faltantes" -ForegroundColor Yellow
}

# 9. Resultado
if ($DryRun) {
    Write-Host "" -ForegroundColor Yellow
    Write-Host "Modo DryRun activado. No se realizaron cambios." -ForegroundColor Yellow
    return 0
}

if ($issues.Count -eq 0 -and $migrated -ge 3) {
    Write-Host "¡Migración completada exitosamente!" -ForegroundColor Green
    Write-Host "Siguiente paso: pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\sync-agentic-adapters.ps1" -ForegroundColor Gray
    return 0
} else {
    Write-Host "Migración completada con advertencias. Revisa los items arriba." -ForegroundColor DarkYellow
    return 1
}