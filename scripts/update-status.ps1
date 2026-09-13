param([string]$RepositoryRoot = "")
$ErrorActionPreference = "Stop"
$NL = [Environment]::NewLine
function Git([string[]]$Arguments) {
    $output = & git @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) { throw "git command failed" }
    ($output -join $NL).Trim()
}
function Optional([string]$File,[string[]]$Arguments) {
    $old = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { $output = & $File @Arguments 2>&1; $code = $LASTEXITCODE } finally { $ErrorActionPreference = $old }
    [pscustomobject]@{ Code = $code; Text = (($output | ForEach-Object { $_.ToString() }) -join $NL).Trim() }
}
function GhValue([string]$Path,[string[]]$Arguments,[string]$Empty) {
    if (-not $Path) { return "gh no disponible" }
    $result = Optional $Path $Arguments
    if ($result.Code -ne 0) { return "error de consulta: $($result.Text)" }
    if (-not $result.Text) { return $Empty }
    try { $json = $result.Text | ConvertFrom-Json } catch { return "error de consulta: JSON invalido" }
    if ($null -eq $json -or @($json).Count -eq 0) { return $Empty }
    $json | ConvertTo-Json -Compress -Depth 8
}
function ReplaceAuto([string]$Content,[string]$Block) {
    $pattern = '(?s)<!-- STATUS:AUTO:BEGIN -->.*?<!-- STATUS:AUTO:END -->'
    $count = [regex]::Matches($Content,$pattern).Count
    if ($count -gt 1) { throw "STATUS.md contiene bloques AUTO duplicados" }
    if ($count -eq 1) { return [regex]::Replace($Content,$pattern,[Text.RegularExpressions.MatchEvaluator]{param($m)$Block},1) }
    $Content.TrimEnd([char]13,[char]10) + $NL + $NL + $Block + $NL
}
try {
    $root = if ($RepositoryRoot) { [IO.Path]::GetFullPath($RepositoryRoot) } else { Git @("rev-parse","--show-toplevel") }
    $status = Join-Path $root "STATUS.md"
    if (-not (Test-Path -LiteralPath $status -PathType Leaf)) { throw "No existe STATUS.md" }
    Push-Location $root
    try {
        $branch = Git @("branch","--show-current")
        if (-not $branch) { $branch = "(detached)" }
        $full = Git @("rev-parse","HEAD")
        $short = Git @("rev-parse","--short","HEAD")
        $remote = "sin remoto"
        $remoteHead = Optional "git" @("symbolic-ref","refs/remotes/origin/HEAD")
        if ($remoteHead.Code -eq 0 -and $remoteHead.Text) { $remote = $remoteHead.Text }
        else {
            $remoteUrl = Optional "git" @("remote","get-url","origin")
            if ($remoteUrl.Code -eq 0 -and $remoteUrl.Text) { $remote = "origin ($($remoteUrl.Text))" }
        }
        $raw = Git @("worktree","list","--porcelain")
        $trees = @()
        $current = ""
        foreach ($line in ($raw -split $NL)) {
            if ($line.StartsWith("worktree ")) { $current = $line.Substring(9).Trim() }
            elseif ($line.StartsWith("branch ") -and $current) {
                $trees += "$current ($($line.Substring(7).Trim() -replace '^refs/heads/',''))"
                $current = ""
            }
        }
        if ($current) { $trees += $current }
        $gh = (Get-Command gh -ErrorAction SilentlyContinue).Source
        $pr = GhValue $gh @("pr","list","--head",$branch,"--state","open","--json","number,title,url","--limit","1") "sin PR"
        $ci = GhValue $gh @("run","list","--branch",$branch,"--limit","1","--json","name,status,conclusion,headSha,url") "sin CI"
        $release = GhValue $gh @("release","list","--limit","1","--json","tagName,name,publishedAt") "sin release"
        $statusTree = if (Git @("status","--porcelain")) { "dirty" } else { "clean" }
        $title = "## Estado verificado autom" + [char]225 + "ticamente"
        $releaseLabel = "-" + " " + [char]218 + "ltima release"
        $lines = @(
            "<!-- STATUS:AUTO:BEGIN -->","",$title,"",
            "- Actualizado: $([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))",
            "- Rama: $branch","- HEAD: $short ($full)","- Remoto: $remote",
            "- Working tree: $statusTree","- Worktrees: $($trees -join '; ')",
            "- PR activa: $pr","- CI: $ci",("{0}: {1}" -f $releaseLabel,$release),"",
            "<!-- STATUS:AUTO:END -->"
        )
        $encoding = [Text.UTF8Encoding]::new($false)
        $content = [IO.File]::ReadAllText($status,[Text.Encoding]::UTF8)
        [IO.File]::WriteAllText($status,(ReplaceAuto $content ($lines -join $NL)),$encoding)
        $statusTree = if (Git @("status","--porcelain")) { "dirty" } else { "clean" }
        $lines[8] = "- Working tree: $statusTree"
        [IO.File]::WriteAllText($status,(ReplaceAuto ([IO.File]::ReadAllText($status,[Text.Encoding]::UTF8)) ($lines -join $NL)),$encoding)
    } finally { Pop-Location }
    Write-Host "PASS STATUS.md actualizado"
    exit 0
} catch { Write-Host ("ERROR " + $_.Exception.Message); exit 2 }
