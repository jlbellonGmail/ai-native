param(
    [Parameter(Mandatory = $true)]
    [string] $Slug,

    [string] $Branch = "",

    [string] $WorktreeDir = "",

    [int] $PollSeconds = 60,

    [int] $MaxMinutes = 1440,

    [switch] $StartBackground
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "feature-contract.ps1")

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

function Test-GitSuccess {
    param([Parameter(Mandatory = $true)][string[]] $Arguments)
    & git @Arguments *> $null
    return ($LASTEXITCODE -eq 0)
}

function Convert-ToPowerShellLiteral {
    param([Parameter(Mandatory = $true)][string] $Value)
    return "'" + ($Value -replace "'", "''") + "'"
}

function Start-LocalReconciler {
    if ([string]::IsNullOrWhiteSpace($Branch)) {
        $Branch = "feature/$Slug"
    }

    $mainRoot = Split-Path -Parent (Get-GitCommonDir)
    if ([string]::IsNullOrWhiteSpace($WorktreeDir)) {
        $WorktreeDir = (Get-Location).Path
    }

    $stateDir = Get-FeatureStateDir
    $safeName = $Slug -replace "[^A-Za-z0-9_.-]", "_"
    $logPath = Join-Path $stateDir "$safeName.log"
    $errorLogPath = Join-Path $stateDir "$safeName.err.log"
    $lockPath = Join-Path $stateDir "$safeName.pid"

    if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
        $existingId = 0
        $rawId = [string](Get-Content -LiteralPath $lockPath -Raw -ErrorAction SilentlyContinue)
        if ([int]::TryParse($rawId.Trim(), [ref] $existingId)) {
            $existing = Get-Process -Id $existingId -ErrorAction SilentlyContinue
            if ($existing -and $existing.ProcessName -match "^(cmd|powershell|pwsh)$") {
                Write-Host "==> Ya existe un reconciliador local para $Slug (PID $existingId). No se inicia otro."
                exit 0
            }
        }
        Remove-Item -LiteralPath $lockPath -Force
    }

    $powershell = (Get-Command powershell.exe -ErrorAction SilentlyContinue)
    if (-not $powershell) {
        $powershell = Get-Command pwsh -ErrorAction Stop
    }

    $scriptPath = Join-Path $PSScriptRoot "local-feature-reconcile.ps1"
    $innerCommand = @(
        "&",
        (Convert-ToPowerShellLiteral $scriptPath),
        "-Slug", (Convert-ToPowerShellLiteral $Slug),
        "-Branch", (Convert-ToPowerShellLiteral $Branch),
        "-WorktreeDir", (Convert-ToPowerShellLiteral $WorktreeDir),
        "-PollSeconds", $PollSeconds,
        "-MaxMinutes", $MaxMinutes
    ) -join " "

    $encodedCommand = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($innerCommand))
    $arguments = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-EncodedCommand", $encodedCommand
    )

    Write-Host "==> Iniciando reconciliador local para $Slug. Log: $logPath"
    try {
        $created = Start-Process `
            -FilePath $powershell.Source `
            -ArgumentList $arguments `
            -WorkingDirectory $mainRoot `
            -RedirectStandardOutput $logPath `
            -RedirectStandardError $errorLogPath `
            -WindowStyle Hidden `
            -PassThru
        Set-Content -LiteralPath $lockPath -Value $created.Id -Encoding ASCII
    }
    catch {
        Write-Warning "No pude iniciar el reconciliador local: $($_.Exception.Message)"
        Write-Warning "Esto no bloquea la PR: el cierre remoto lo realiza GitHub Actions y la limpieza local se reconciliara en la proxima ejecucion."
    }
}

if ($StartBackground) {
    Start-LocalReconciler
    exit 0
}

if ([string]::IsNullOrWhiteSpace($Branch)) {
    $Branch = "feature/$Slug"
}

$repoRoot = Get-RepositoryRoot
if ([string]::IsNullOrWhiteSpace($WorktreeDir)) {
    $WorktreeDir = Join-Path (Join-Path (Split-Path -Parent $repoRoot) "worktrees") $Slug
}

$stateDir = Get-FeatureStateDir
$safeName = $Slug -replace "[^A-Za-z0-9_.-]", "_"
$lockPath = Join-Path $stateDir "$safeName.pid"

$deadline = (Get-Date).AddMinutes($MaxMinutes)
Write-Host "==> Reconciliador local activo para $Slug. Limpia solo si origin/develop contiene [x]."

try {
    while ((Get-Date) -lt $deadline) {
        Invoke-Checked "git" @("fetch", "origin", "develop", "--prune")
        $remoteRoadmap = (& git show "origin/develop`:ROADMAP.md") -join "`n"
        if ($LASTEXITCODE -ne 0) {
            throw "No pude leer origin/develop:ROADMAP.md."
        }

        $escapedSlug = [regex]::Escape($Slug)
        $doneCount = [regex]::Matches($remoteRoadmap, "(?m)^- \[x\] $escapedSlug(?=\s|$).*").Count
        $readyCount = [regex]::Matches($remoteRoadmap, "(?m)^- \[-\] $escapedSlug(?=\s|$).*").Count

        if ($doneCount -eq 1 -and $readyCount -eq 0) {
            Write-Host "==> Cierre remoto detectado para $Slug. Limpiando artefactos locales."
            $mainRoot = Split-Path -Parent (Get-GitCommonDir)
            $worktreeFullPath = [System.IO.Path]::GetFullPath($WorktreeDir)
            $mainRootFullPath = [System.IO.Path]::GetFullPath($mainRoot)
            if ([string]::Equals($worktreeFullPath, $mainRootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "Me niego a remover el checkout principal ($mainRootFullPath) como si fuera un worktree de $Slug."
            }
            Set-Location -LiteralPath $mainRoot
            [Environment]::CurrentDirectory = $mainRoot
            if (Test-Path -LiteralPath $WorktreeDir) {
                Invoke-Checked "git" @("worktree", "remove", $WorktreeDir)
            }
            if (Test-GitSuccess @("rev-parse", "--verify", "--quiet", $Branch)) {
                Invoke-Checked "git" @("branch", "-d", $Branch)
            }
            Write-Host "==> Reconciliacion local completa para $Slug."
            exit 0
        }

        if ($doneCount -gt 1 -or $readyCount -gt 1) {
            throw "Estado remoto ambiguo para $Slug en ROADMAP.md: ready=$readyCount, done=$doneCount."
        }

        Start-Sleep -Seconds $PollSeconds
    }

    throw "Timeout esperando cierre remoto de $Slug en origin/develop."
}
finally {
    if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
        Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
    }
}
