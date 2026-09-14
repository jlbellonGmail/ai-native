$ErrorActionPreference = "Stop"
function Invoke-Git([string[]]$Arguments) {
    $output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git command failed" }
    return ($output -join [Environment]::NewLine).Trim()
}
function Invoke-Optional([string]$File, [string[]]$Arguments) {
    $old = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { $output = & $File @Arguments 2>&1; $code = $LASTEXITCODE } finally { $ErrorActionPreference = $old }
    [pscustomobject]@{ Code = $code; Text = (($output | ForEach-Object { $_.ToString() }) -join [Environment]::NewLine).Trim() }
}
function Field([string]$Block, [string]$Name) {
    $match = [regex]::Match($Block, "(?m)^- $([regex]::Escape($Name)): (.*)$")
    if (-not $match.Success) { throw "Falta el campo $Name" }
    return $match.Groups[1].Value.Trim()
}
try {
    $root = Invoke-Git @("rev-parse", "--show-toplevel")
    $status = Join-Path $root "STATUS.md"
    if (-not (Test-Path -LiteralPath $status -PathType Leaf)) { Write-Host "ERROR No existe STATUS.md"; exit 1 }
    $content = [IO.File]::ReadAllText($status, [Text.Encoding]::UTF8)
    $begin = ([regex]::Matches($content, [regex]::Escape("<!-- STATUS:AUTO:BEGIN -->"))).Count
    $end = ([regex]::Matches($content, [regex]::Escape("<!-- STATUS:AUTO:END -->"))).Count
    if ($begin -ne 1 -or $end -ne 1) { Write-Host "ERROR Marcadores AUTO invalidos"; exit 1 }
    $match = [regex]::Match($content, '(?s)<!-- STATUS:AUTO:BEGIN -->.*?<!-- STATUS:AUTO:END -->')
    if (-not $match.Success) { Write-Host "ERROR Bloque no parseable"; exit 1 }
    $block = $match.Value
    $branch = Invoke-Git @("branch", "--show-current")
    if (-not $branch) { $branch = "(detached)" }
$head = Invoke-Git @("rev-parse", "HEAD")
if ((Field $block "Rama") -ne $branch) { Write-Host "ERROR Rama no coincide"; exit 1 }
$recordedHead = Field $block "HEAD"
$headMatches = $recordedHead -match [regex]::Escape($head)
if (-not $headMatches) {
    # STATUS.md cannot record the hash of the commit that contains the
    # record itself. Accept the parent only when that commit changes STATUS.md
    # and nothing else; arbitrary stale snapshots remain invalid.
    $changed = Invoke-Git @("diff-tree", "-m", "--no-commit-id", "--name-only", "-r", "HEAD")
    $changedFiles = @($changed -split "`r?`n" | Where-Object { $_ })
    $recordedHash = if ($recordedHead -match "(?<sha>[0-9a-f]{40})") { $Matches.sha } else { "" }
    $ancestor = if ($recordedHash) { Invoke-Optional "git" @("merge-base", "--is-ancestor", $recordedHash, "HEAD") } else { $null }
    $headMatches = $ancestor -and $ancestor.Code -eq 0 -and $changedFiles -contains "STATUS.md"
}
if (-not $headMatches) { Write-Host "ERROR HEAD no coincide"; exit 1 }
$tree = if (Invoke-Git @("status", "--porcelain")) { "dirty" } else { "clean" }
$recordedTree = Field $block "Working tree"
$treeMatches = $recordedTree -eq $tree
if (-not $treeMatches -and $tree -eq "clean" -and $recordedTree -eq "dirty") {
    $changed = Invoke-Git @("diff-tree", "-m", "--no-commit-id", "--name-only", "-r", "HEAD")
    $changedFiles = @($changed -split "`r?`n" | Where-Object { $_ })
    $treeMatches = $changedFiles -contains "STATUS.md"
}
if (-not $treeMatches) { Write-Host "ERROR Working tree no coincide"; exit 1 }
    $releaseField = ([char]218).ToString() + "ltima release"; foreach ($name in @("Remoto", "Worktrees", "PR activa", "CI", $releaseField)) { [void](Field $block $name) }
    $gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
    if (-not $gh) {
        Write-Host "WARNING gh no disponible; PR/CI no verificables"
    } else {
        $pr = Invoke-Optional $gh @("pr", "list", "--head", $branch, "--state", "open", "--json", "number", "--limit", "1")
        if ($pr.Code -ne 0) { Write-Host "WARNING error de consulta PR" }
        elseif ([string]::IsNullOrWhiteSpace($pr.Text) -or $pr.Text -eq "[]") {
            if ((Field $block "PR activa") -ne "sin PR") { Write-Host "ERROR PR no coincide"; exit 1 }
        } else {
            $json = $pr.Text | ConvertFrom-Json
            if ((Field $block "PR activa") -notmatch [regex]::Escape([string]$json[0].number)) { Write-Host "ERROR PR no coincide"; exit 1 }
        }
    $ciField = Field $block "CI"
    $ci = Invoke-Optional $gh @("run", "list", "--branch", $branch, "--limit", "1", "--json", "headSha")
    if ($ciField -eq "sin CI") { Write-Host "WARNING CI no afirmada en snapshot" }
    elseif ($ci.Code -ne 0) { Write-Host "WARNING error de consulta CI" }
        elseif ([string]::IsNullOrWhiteSpace($ci.Text) -or $ci.Text -eq "[]") { Write-Host "WARNING sin CI" }
        else {
            $json = $ci.Text | ConvertFrom-Json
            if ((Field $block "CI") -notmatch [regex]::Escape([string]$json[0].headSha)) { Write-Host "ERROR CI no coincide"; exit 1 }
        }
    }
    Write-Host "PASS STATUS.md es coherente"
    exit 0
} catch { Write-Host "ERROR Error de ejecucion: $($_.Exception.Message)"; exit 2 }

