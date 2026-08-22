$ErrorActionPreference = "Stop"

# Utilidades de proceso compartidas por los scripts del circuito
# (close-feature.ps1, ready-for-pr.ps1, complete-approved-pr.ps1,
# local-feature-reconcile.ps1, start-work-unit.ps1). Antes vivian
# duplicadas en cada script; ahora tienen una unica implementacion aqui.

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,

        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $FilePath $($Arguments -join ' ')"
    }
}

function Get-CheckedOutput {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,

        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    $output = & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $FilePath $($Arguments -join ' ')"
    }

    return ($output -join "`n").Trim()
}

function Get-GitHubCliPath {
    $command = Get-Command gh -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }

    $defaultPath = Join-Path $env:ProgramFiles "GitHub CLI\gh.exe"
    if (Test-Path -LiteralPath $defaultPath) {
        return $defaultPath
    }

    throw "GitHub CLI (gh) no esta disponible. Instalalo y autenticalo para operar sobre PRs."
}

# ---------------------------------------------------------------------------
# WorkUnit: abstraccion comun a Feature (un item de ROADMAP.md) y Milestone
# (N items de ROADMAP.md agrupados bajo un mismo work-unit.json).
# ---------------------------------------------------------------------------

function Get-RoadmapItemState {
    # Misma logica de 3 estados (Pending/Ready/Done) usada historicamente
    # por close-feature.ps1 como 'Get-RoadmapState', ahora compartida.
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $ItemSlug
    )

    $escapedSlug = [regex]::Escape($ItemSlug)
    $suffix = "(?=\s|$)"
    $states = [ordered]@{
        Pending = [regex]::Matches($Content, "(?m)^- \[ \] $escapedSlug$suffix.*").Count
        Ready = [regex]::Matches($Content, "(?m)^- \[-\] $escapedSlug$suffix.*").Count
        Done = [regex]::Matches($Content, "(?m)^- \[x\] $escapedSlug$suffix.*").Count
    }

    return [pscustomobject]$states
}

function Get-RoadmapItemStateName {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $ItemSlug
    )

    $state = Get-RoadmapItemState -Content $Content -ItemSlug $ItemSlug
    $total = $state.Pending + $state.Ready + $state.Done
    if ($total -eq 0) { return "Missing" }
    if ($total -gt 1) { return "Ambiguous" }
    if ($state.Pending -eq 1) { return "Pending" }
    if ($state.Ready -eq 1) { return "Ready" }
    return "Done"
}

function Assert-RoadmapItemsTransition {
    # Valida de forma transaccional que TODOS los items esten en uno de los
    # estados $FromStates antes de permitir cualquier mutacion. No muta
    # ROADMAP.md: solo valida. El llamador hace el reemplazo real recien
    # despues de que esta funcion no lance excepcion, garantizando que no
    # queda una mutacion parcial si un item no esta en el estado esperado.
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string[]] $Items,

        [Parameter(Mandatory = $true)]
        [string[]] $FromStates,

        [Parameter(Mandatory = $true)]
        [string] $ToState
    )

    if ($Items.Count -eq 0) {
        throw "Assert-RoadmapItemsTransition requiere al menos un item."
    }

    $problems = New-Object System.Collections.Generic.List[string]
    foreach ($item in $Items) {
        $actual = Get-RoadmapItemStateName -Content $Content -ItemSlug $item
        if ($FromStates -notcontains $actual) {
            [void] $problems.Add("$item -> estado actual: $actual (esperado uno de: $($FromStates -join ', '))")
        }
    }

    if ($problems.Count -gt 0) {
        $detail = $problems -join [Environment]::NewLine
        throw "Transicion de items de ROADMAP.md hacia $ToState invalida. Ningun item fue modificado.`n$detail"
    }
}

function Read-WorkUnitManifest {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "No existe el manifest de work unit: $Path"
    }

    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    try {
        $json = $raw | ConvertFrom-Json
    }
    catch {
        throw "El manifest de work unit no es JSON valido: $Path"
    }

    if ($null -eq $json.schemaVersion -or [int] $json.schemaVersion -ne 1) {
        throw "schemaVersion no soportado en ${Path}: $($json.schemaVersion)"
    }

    if ($json.mode -ne "milestone") {
        throw "El manifest $Path no declara mode=milestone."
    }

    if ([string]::IsNullOrWhiteSpace($json.slug)) {
        throw "El manifest $Path no declara slug."
    }

    $items = @($json.items | ForEach-Object { [string] $_ })
    if ($items.Count -eq 0) {
        throw "El manifest $Path no declara items."
    }

    return [pscustomobject]@{
        SchemaVersion = [int] $json.schemaVersion
        Mode = $json.mode
        Slug = $json.slug
        Items = $items
    }
}

function Write-WorkUnitManifest {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path,

        [string] $Mode = "milestone",

        [Parameter(Mandatory = $true)]
        [string] $Slug,

        [Parameter(Mandatory = $true)]
        [string[]] $Items
    )

    $dir = Split-Path -Parent $Path
    if (-not [string]::IsNullOrWhiteSpace($dir) -and -not (Test-Path -LiteralPath $dir -PathType Container)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $manifest = [ordered]@{
        schemaVersion = 1
        mode = $Mode
        slug = $Slug
        items = @($Items)
    }

    $json = $manifest | ConvertTo-Json -Depth 5
    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location).Path $Path),
        $json + [Environment]::NewLine,
        (New-Object System.Text.UTF8Encoding($false))
    )
}

function Get-WorkUnitInfo {
    # Reemplaza Get-FeatureInfo con una version que tambien sabe describir
    # un Milestone (N items de ROADMAP.md). Para Mode=Feature devuelve un
    # objeto identico en forma/valores al historico Get-FeatureInfo.
    param(
        [Parameter(Mandatory = $true)]
        [string] $Slug,

        [string] $Title = "",

        [ValidateSet("Feature", "Milestone")]
        [string] $Mode = "Feature",

        # Solo relevante en modo Milestone: si no se pasa y existe
        # runs/milestone-$Slug/work-unit.json, se lee de ahi.
        [string[]] $Items = @()
    )

    if ($Mode -eq "Feature") {
        if ($Slug -notmatch "^(?<number>[0-9]{2})-(?<docSlug>[a-z0-9]+(?:-[a-z0-9]+)*)$") {
            throw "Slug invalido '$Slug'. Debe tener formato NN-slug-en-minusculas."
        }

        $docSlug = $Matches["docSlug"]
        if ([string]::IsNullOrWhiteSpace($Title)) {
            $Title = ($docSlug -split "-" | ForEach-Object {
                if ($_.Length -eq 0) { $_ } else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
            }) -join " "
        }

        return [pscustomobject]@{
            Mode = "Feature"
            Slug = $Slug
            Number = $Matches["number"]
            DocSlug = $docSlug
            Title = $Title
            Branch = "feature/$Slug"
            RunDir = "runs/$Slug"
            TechnicalDoc = "docs/tecnica/$docSlug.md"
            UserDoc = "docs/usuario/$docSlug.md"
            TechnicalIndex = "docs/tecnica/index.md"
            UserIndex = "docs/usuario/index.md"
            Decision = "runs/$Slug/decision.md"
            Manifest = $null
            Items = @()
        }
    }

    # Modo Milestone: el slug NO es un item de ROADMAP.md, es el nombre del
    # work unit. No lleva prefijo numerico (se rechaza explicitamente la
    # forma NN- para que nunca se confunda con un slug de Feature).
    if ($Slug -notmatch "^(?!\d{2}-)[a-z0-9]+(?:-[a-z0-9]+)*$") {
        throw "Slug de milestone invalido '$Slug'. Debe tener formato slug-en-minusculas, sin prefijo numerico."
    }

    if ([string]::IsNullOrWhiteSpace($Title)) {
        $Title = ($Slug -split "-" | ForEach-Object {
            if ($_.Length -eq 0) { $_ } else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
        }) -join " "
    }

    $runDir = "runs/milestone-$Slug"
    $manifestPath = "$runDir/work-unit.json"

    $itemSlugs = @($Items)
    if ($itemSlugs.Count -eq 0 -and (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        $manifest = Read-WorkUnitManifest -Path $manifestPath
        $itemSlugs = @($manifest.Items)
    }

    $itemInfos = @($itemSlugs | ForEach-Object { Get-WorkUnitInfo -Slug $_ -Mode Feature })

    return [pscustomobject]@{
        Mode = "Milestone"
        Slug = $Slug
        Number = $null
        DocSlug = $null
        Title = $Title
        Branch = "milestone/$Slug"
        RunDir = $runDir
        TechnicalDoc = $null
        UserDoc = $null
        TechnicalIndex = $null
        UserIndex = $null
        Decision = "$runDir/decision.md"
        Manifest = $manifestPath
        Items = $itemInfos
    }
}
