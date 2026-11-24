# Checkpoint the agent's work as a git bundle in the exchange folder (the ONLY persistent place; the sandbox is discarded
# on close). Run inside the sandbox as "agent", from anywhere:
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\agent-setup\checkpoint.ps1
# Bundles the current branch from refs/u0/base (the commit the session started from, which the owner already has) and,
# when the tree is dirty, the uncommitted work as refs/checkpoint/wip (a `git stash create` commit; the tree is untouched).
param([string]$Config = 'C:\agent-setup\u0-config.json', [string]$Exchange = 'C:\agent-exchange')
$ErrorActionPreference = 'Stop'
$env:Path = 'C:\Program Files\Git\cmd;' + $env:Path
$cfg = Get-Content -LiteralPath $Config -Raw | ConvertFrom-Json
Set-Location -LiteralPath $cfg.clonePath
$branch = (& git symbolic-ref --short HEAD).Trim()
$refs = @("refs/heads/$branch")
# Snapshot of the whole working tree (tracked changes + untracked, .gitignore respected) through a TEMPORARY index:
# the real index and the working tree are not touched. Any failure stops the checkpoint (no silent loss of work).
$wip = ''
if ((& git status --porcelain --untracked-files=all) ) {
  $tmpIndex = Join-Path $env:TEMP ("u0-index-" + [guid]::NewGuid().ToString('N'))
  $gitDir = (& git rev-parse --absolute-git-dir).Trim()
  Copy-Item -LiteralPath (Join-Path $gitDir 'index') -Destination $tmpIndex
  $env:GIT_INDEX_FILE = $tmpIndex
  try {
    & git add -A; if ($LASTEXITCODE -ne 0) { throw 'git add (temporary index) failed' }
    $tree = (& git write-tree).Trim(); if ($LASTEXITCODE -ne 0 -or -not $tree) { throw 'git write-tree failed' }
  } finally { Remove-Item Env:\GIT_INDEX_FILE; Remove-Item -LiteralPath $tmpIndex -Force -ErrorAction SilentlyContinue }
  $wip = (& git commit-tree $tree -p HEAD -m "checkpoint wip $(Get-Date -Format s)").Trim()
  if ($LASTEXITCODE -ne 0 -or -not $wip) { throw 'git commit-tree failed: uncommitted work NOT saved' }
}
if ($wip) { & git update-ref refs/checkpoint/wip $wip; $refs += 'refs/checkpoint/wip' } else { & git update-ref -d refs/checkpoint/wip 2>$null }
$base = (& git rev-parse refs/u0/base).Trim()
$head = (& git rev-parse HEAD).Trim()
if ($head -eq $base -and -not $wip) { Write-Host 'checkpoint: nothing new since the session base; no bundle written.'; exit 0 }
$name = 'ckpt-' + ($branch -replace '[^A-Za-z0-9._-]', '_') + '-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.bundle'
$out = Join-Path $Exchange $name
& git bundle create $out ("^" + $base) @refs
if ($LASTEXITCODE -ne 0) { throw "git bundle create exit $LASTEXITCODE" }
& git bundle verify $out | Out-Null
if ($LASTEXITCODE -ne 0) { throw "git bundle verify exit $LASTEXITCODE" }
Write-Host "checkpoint: $out"
Write-Host "  base   $base"
Write-Host "  branch $branch $head"
if ($wip) { Write-Host "  wip    $wip (uncommitted work)" }
