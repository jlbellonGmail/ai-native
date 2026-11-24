# Restore the newest checkpoint bundle from the exchange folder into the fresh clone of a new sandbox session.
# Run inside the sandbox as "agent":  powershell -NoProfile -ExecutionPolicy Bypass -File C:\agent-setup\restore.ps1
param([string]$Bundle, [string]$Config = 'C:\agent-setup\u0-config.json', [string]$Exchange = 'C:\agent-exchange')
$ErrorActionPreference = 'Stop'
$env:Path = 'C:\Program Files\Git\cmd;' + $env:Path
$cfg = Get-Content -LiteralPath $Config -Raw | ConvertFrom-Json
Set-Location -LiteralPath $cfg.clonePath
if (-not $Bundle) {
  $f = Get-ChildItem -LiteralPath $Exchange -Filter 'ckpt-*.bundle' -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $f) { Write-Host 'restore: no checkpoint bundle found.'; exit 0 }
  $Bundle = $f.FullName
}
& git bundle verify $Bundle
if ($LASTEXITCODE -ne 0) { throw 'bundle verify failed (missing prerequisite commit? fetch the base branch first)' }
$heads = @(& git bundle list-heads $Bundle | ForEach-Object { ($_ -split ' ', 2)[1] })
foreach ($r in $heads) {
  if ($r -like 'refs/heads/*') { & git fetch --quiet $Bundle ("+" + $r + ":refs/checkpoint/" + $r.Substring(11)) }
  elseif ($r -eq 'refs/checkpoint/wip') { & git fetch --quiet $Bundle '+refs/checkpoint/wip:refs/checkpoint/wip' }
}
$b = ($heads | Where-Object { $_ -like 'refs/heads/*' } | Select-Object -First 1).Substring(11)
& git checkout --quiet -B $b ("refs/checkpoint/" + $b)
if ($heads -contains 'refs/checkpoint/wip') {
  # The wip commit's parent is the branch tip; apply its changes to the working tree without committing, then unstage.
  & git cherry-pick --no-commit refs/checkpoint/wip
  if ($LASTEXITCODE -ne 0) { throw 'could not re-apply the uncommitted work; it stays available as refs/checkpoint/wip' }
  & git reset --quiet
  Write-Host 'restore: uncommitted work re-applied to the working tree (unstaged).'
}
& git update-ref refs/u0/base (& git merge-base HEAD ("origin/" + $cfg.branch))
Write-Host "restore: $b at $(& git rev-parse --short HEAD) from $Bundle"
