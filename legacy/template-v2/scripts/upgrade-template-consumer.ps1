param(
    [string]$ConsumerPath = ".",
    [Parameter(Mandatory = $true)][string]$TargetVersion,
    [string]$BaselineVersion = "",
    [string]$TemplateSource = "",
    [ValidateSet("Verify", "Apply")][string]$Mode = "Verify"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
    param([Parameter(Mandatory = $true)][string]$Repository, [Parameter(Mandatory = $true)][string[]]$Arguments)
    $out = & git -C $Repository @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git fallo en '$Repository': $($Arguments -join ' '): $($out -join ' ')" }
    return (($out | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim()
}

function Invoke-GitMaybe {
    param([Parameter(Mandatory = $true)][string]$Repository, [Parameter(Mandatory = $true)][string[]]$Arguments)
    $out = & git -C $Repository @Arguments 2>&1
    [pscustomobject]@{ Code = $LASTEXITCODE; Text = (($out | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim() }
}

function Read-JsonFile([string]$Path) {
    try { return Get-Content -LiteralPath $Path -Raw -Encoding UTF8 | ConvertFrom-Json }
    catch { throw "JSON invalido: $Path" }
}

function Get-LocalManifest {
    $path = Join-Path $PSScriptRoot "template-starter-manifest.json"
    if (Test-Path -LiteralPath $path -PathType Leaf) { return Read-JsonFile $path }
    return $null
}

function Assert-Version([string]$Version, [string]$Name) {
    if ($Version -notmatch '^v\d+\.\d+\.\d+$') { throw "$Name invalida: $Version" }
}

function Normalize-SharedPath([string]$Relative) {
    $value = ($Relative -replace "\\", "/").Trim()
    if ([string]::IsNullOrWhiteSpace($value)) { throw "Manifest declara una ruta vacia." }
    if ([IO.Path]::IsPathRooted($value) -or $value -match '(^|/)\.\.(/|$)') { throw "Ruta insegura en manifest: $Relative" }
    if ($value -in @("STATUS.md", "ROADMAP.md", "VERSION", "version.txt", ".version")) { throw "Ruta protegida en manifest: $value" }
    if ($value -match '^(runs|\.git)(/|$)') { throw "Ruta protegida en manifest: $value" }
    return $value
}

function Get-SharedPaths($Manifest, [string]$Label) {
    if ($null -eq $Manifest.schemaVersion -or [int]$Manifest.schemaVersion -lt 1 -or [int]$Manifest.schemaVersion -gt 2) {
        throw "Manifest $Label no soportado."
    }
    $paths = @($Manifest.sharedPaths | ForEach-Object { Normalize-SharedPath ([string]$_) })
    if ($paths.Count -eq 0) { throw "Manifest $Label no declara sharedPaths." }
    $duplicates = @($paths | Group-Object | Where-Object Count -gt 1)
    if ($duplicates.Count) { throw "Manifest $Label declara rutas duplicadas: $($duplicates[0].Name)" }
    return $paths
}

function Test-ExactTag([string]$Repository, [string]$Version) {
    $result = Invoke-GitMaybe $Repository @("show-ref", "--tags", "--verify", "refs/tags/$Version")
    return $result.Code -eq 0
}

function Get-TagJson([string]$Repository, [string]$Version, [string]$Relative) {
    $spec = "${Version}:$Relative"
    try { return (Invoke-Git $Repository @("show", $spec)) | ConvertFrom-Json }
    catch { throw "No se pudo leer $Relative desde $Version." }
}

function Get-FileSha256([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Get-ConsumerHash([string]$Repository, [string]$Relative) {
    $path = Join-Path $Repository $Relative
    return Get-FileSha256 $path
}

function Copy-SharedFile([string]$SourceRoot, [string]$ConsumerRoot, [string]$Relative) {
    $source = Join-Path $SourceRoot $Relative
    $target = Join-Path $ConsumerRoot $Relative
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { throw "Falta fuente compartida en tag destino: $Relative" }
    $parent = Split-Path -Parent $target
    if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }
    Copy-Item -LiteralPath $source -Destination $target -Force
}

$tempRoot = $null
try {
    Assert-Version $TargetVersion "TargetVersion"
    if (-not [string]::IsNullOrWhiteSpace($BaselineVersion)) { Assert-Version $BaselineVersion "BaselineVersion" }

    $consumerRoot = [IO.Path]::GetFullPath($ConsumerPath)
    if (-not (Test-Path -LiteralPath $consumerRoot -PathType Container)) { throw "No existe ConsumerPath: $consumerRoot" }
    $inside = Invoke-Git $consumerRoot @("rev-parse", "--is-inside-work-tree")
    if ($inside -ne "true") { throw "ConsumerPath no es un repositorio Git: $consumerRoot" }
    $consumerRoot = [IO.Path]::GetFullPath((Invoke-Git $consumerRoot @("rev-parse", "--show-toplevel")))
    $pending = Invoke-Git $consumerRoot @("status", "--porcelain")
    if (-not [string]::IsNullOrWhiteSpace($pending)) { throw "El consumidor tiene trabajo pendiente; commit/stash antes de actualizar." }

    $localManifest = Get-LocalManifest
    if ([string]::IsNullOrWhiteSpace($TemplateSource) -and $localManifest -and $localManifest.templateRepository) {
        $TemplateSource = [string]$localManifest.templateRepository
    }
    if ([string]::IsNullOrWhiteSpace($TemplateSource)) {
        throw "Informe -TemplateSource o declare templateRepository en scripts/template-starter-manifest.json."
    }

    $consumerManifestPath = Join-Path $consumerRoot "scripts/template-starter-manifest.json"
    if ([string]::IsNullOrWhiteSpace($BaselineVersion) -and (Test-Path -LiteralPath $consumerManifestPath -PathType Leaf)) {
        $consumerManifest = Read-JsonFile $consumerManifestPath
        if ($consumerManifest.templateVersion) { $BaselineVersion = [string]$consumerManifest.templateVersion }
    }
    if ([string]::IsNullOrWhiteSpace($BaselineVersion)) {
        throw "No se pudo determinar BaselineVersion; paselo explicitamente para validar anti-drift."
    }
    Assert-Version $BaselineVersion "BaselineVersion"

    $tempRoot = Join-Path ([IO.Path]::GetTempPath()) ("template-upgrade-" + [guid]::NewGuid().ToString("N"))
    & git clone --quiet --no-checkout $TemplateSource $tempRoot 2>&1 | Out-String | ForEach-Object {
        if ($LASTEXITCODE -ne 0) { throw "No se pudo clonar TemplateSource: $TemplateSource. $_" }
    }
    Invoke-Git $tempRoot @("config", "core.autocrlf", "false") | Out-Null
    Invoke-Git $tempRoot @("fetch", "--quiet", "--tags", "--force") | Out-Null
    if (-not (Test-ExactTag $tempRoot $TargetVersion)) { throw "No existe el tag exacto solicitado: $TargetVersion" }
    if (-not (Test-ExactTag $tempRoot $BaselineVersion)) { throw "No existe el tag baseline solicitado: $BaselineVersion" }

    $targetManifest = Get-TagJson $tempRoot $TargetVersion "scripts/template-starter-manifest.json"
    $baselineManifest = Get-TagJson $tempRoot $BaselineVersion "scripts/template-starter-manifest.json"
    $targetPaths = Get-SharedPaths $targetManifest $TargetVersion
    $baselinePaths = Get-SharedPaths $baselineManifest $BaselineVersion
    $baselineSet = @{}
    foreach ($path in $baselinePaths) { $baselineSet[$path] = $true }

    Invoke-Git $tempRoot @("checkout", "--quiet", "--detach", $BaselineVersion) | Out-Null
    $baselineHashes = @{}
    foreach ($relative in $baselinePaths) {
        $baselineHashes[$relative] = Get-FileSha256 (Join-Path $tempRoot $relative)
    }
    Invoke-Git $tempRoot @("checkout", "--quiet", "--detach", $TargetVersion) | Out-Null
    $targetHashes = @{}
    foreach ($relative in $targetPaths) {
        $hash = Get-FileSha256 (Join-Path $tempRoot $relative)
        if (-not $hash) { throw "El tag $TargetVersion no contiene la ruta compartida declarada: $relative" }
        $targetHashes[$relative] = $hash
    }

    $drift = @()
    foreach ($relative in $targetPaths) {
        $consumerHash = Get-ConsumerHash $consumerRoot $relative
        $targetHash = $targetHashes[$relative]
        $baselineHash = if ($baselineSet.ContainsKey($relative)) { $baselineHashes[$relative] } else { $null }

        if ($consumerHash) {
            if ($consumerHash -ne $targetHash -and (!$baselineHash -or $consumerHash -ne $baselineHash)) {
                $drift += "different: $relative"
            }
        }
        elseif ($baselineHash) {
            $drift += "missing: $relative"
        }
    }
    if ($drift.Count) {
        $drift | ForEach-Object { Write-Host "DRIFT $_" }
        throw "Anti-drift fallo antes del upgrade."
    }

    if ($Mode -eq "Apply") {
        foreach ($relative in $targetPaths) { Copy-SharedFile $tempRoot $consumerRoot $relative }
    }

    $postDrift = @()
    foreach ($relative in $targetPaths) {
        $consumerHash = Get-ConsumerHash $consumerRoot $relative
        $targetHash = $targetHashes[$relative]
        if ($Mode -eq "Apply" -and $consumerHash -ne $targetHash) { $postDrift += "different: $relative" }
    }
    if ($postDrift.Count) {
        $postDrift | ForEach-Object { Write-Host "DRIFT $_" }
        throw "Anti-drift fallo despues del upgrade."
    }

    $action = if ($Mode -eq "Apply") { "actualizado" } else { "verificado" }
    Write-Host "PASS template-consumer $action $BaselineVersion -> $TargetVersion ($($targetPaths.Count) rutas compartidas)"
    exit 0
}
catch {
    Write-Host "ERROR $($_.Exception.Message)"
    exit 1
}
finally {
    if ($tempRoot -and (Test-Path -LiteralPath $tempRoot)) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
    }
}
