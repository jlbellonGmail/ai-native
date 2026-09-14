[CmdletBinding()]
param([switch] $Json)

$ErrorActionPreference = "Stop"

function Invoke-Git([string[]] $Arguments) {
    $output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git command failed: git $($Arguments -join ' ')" }
    return (($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim()
}

function Get-Field([string] $Block, [string] $Name) {
    $match = [regex]::Match($Block, "(?m)^- $([regex]::Escape($Name)): (.*)$")
    if (-not $match.Success) { throw "Falta el campo $Name" }
    return $match.Groups[1].Value.Trim()
}

try {
    $root = Invoke-Git @("rev-parse", "--show-toplevel")
    $path = Join-Path $root "STATUS.md"
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { Write-Host "ERROR ERROR_REAL No existe STATUS.md"; exit 1 }
    $content = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
    $begin = ([regex]::Matches($content, [regex]::Escape("<!-- STATUS:AUTO:BEGIN -->"))).Count
    $end = ([regex]::Matches($content, [regex]::Escape("<!-- STATUS:AUTO:END -->"))).Count
    if ($begin -ne 1 -or $end -ne 1) { Write-Host "ERROR INCONSISTENTE marcadores AUTO invalidos"; exit 1 }
    $blockMatch = [regex]::Match($content, '(?s)<!-- STATUS:AUTO:BEGIN -->.*?<!-- STATUS:AUTO:END -->')
    if (-not $blockMatch.Success) { Write-Host "ERROR INCONSISTENTE bloque AUTO no parseable"; exit 1 }
    $block = $blockMatch.Value
    $branch = Invoke-Git @("branch", "--show-current")
    if ([string]::IsNullOrWhiteSpace($branch)) { $branch = "(detached)" }
    $head = Invoke-Git @("rev-parse", "HEAD")
    $errors = [Collections.Generic.List[string]]::new()
    $warnings = [Collections.Generic.List[string]]::new()
    if ((Get-Field $block "Rama") -ne $branch) { [void] $errors.Add("INCONSISTENTE rama no coincide") }
    $recordedHead = Get-Field $block "HEAD"
    if ($recordedHead -notmatch [regex]::Escape($head)) { [void] $warnings.Add("STALE HEAD: snapshot regenerable") }
    $tree = if ([string]::IsNullOrWhiteSpace((Invoke-Git @("status", "--porcelain")))) { "clean" } else { "dirty" }
    if ((Get-Field $block "Working tree") -ne $tree) { [void] $warnings.Add("STALE working tree: snapshot regenerable") }
    $gh = if ($env:GH_TOKEN) { Get-Command gh -ErrorAction SilentlyContinue } else { $null }
    if ($null -eq $gh) { [void] $warnings.Add("TEMPORAL gh no disponible; PR/CI no verificables") }
    if ($Json) {
        [ordered]@{ status = if ($errors.Count -gt 0) { "INCONSISTENTE" } elseif ($warnings.Count -gt 0) { "STALE" } else { "OK" }; errors = @($errors); warnings = @($warnings); branch = $branch; head = $head } | ConvertTo-Json -Depth 5
    }
    else {
        $errors | ForEach-Object { Write-Host "ERROR $_" }
        $warnings | ForEach-Object { Write-Host "WARNING $_" }
        if ($errors.Count -gt 0) { exit 1 }
        Write-Host "PASS STATUS.md coherente"
    }
    exit 0
}
catch {
    Write-Host "ERROR ERROR_REAL $($_.Exception.Message)"
    exit 2
}
