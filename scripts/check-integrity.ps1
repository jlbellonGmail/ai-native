param([string]$RepositoryRoot="", [string]$WorktreeDir="")
$ErrorActionPreference = "Stop"
function Git([string[]]$Arguments) {
  $out = & git @Arguments 2>&1
  if ($LASTEXITCODE) { throw "git fallo: $($Arguments -join ' ')" }
  return ($out -join [Environment]::NewLine).Trim()
}
try {
  $root = if ($RepositoryRoot) { [IO.Path]::GetFullPath($RepositoryRoot) } else { [IO.Path]::GetFullPath((Git @("rev-parse","--show-toplevel"))) }
  Push-Location $root
  try {
    $errors = [Collections.Generic.List[string]]::new()
    $warnings = [Collections.Generic.List[string]]::new()
    $roadmap = Get-Content "ROADMAP.md" -Raw -Encoding UTF8
    $v2 = Join-Path $root "runs\v2.0.0"
    $dirs = @(Get-ChildItem $v2 -Directory -ErrorAction SilentlyContinue)
    $runT = @($dirs | Where-Object { $_.Name -match '^T\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$' })
    $roadT = @([regex]::Matches($roadmap,'(?m)^-\s+(?:\[[ x-]\]\s+)?(?<id>T\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*)\b.*') | ForEach-Object { $_.Groups["id"].Value })
    foreach ($dir in $runT) {
      $id = $dir.Name
      if ($roadT -notcontains $id) { [void]$errors.Add("run Txx '$id' existe pero falta en ROADMAP.md"); continue }
      $summary = Join-Path $dir.FullName "SUMMARY.md"
      if (-not (Test-Path $summary -PathType Leaf)) { [void]$errors.Add("SUMMARY.md faltante para $id") }
      elseif ([string]::IsNullOrWhiteSpace((Get-Content $summary -Raw))) { [void]$errors.Add("SUMMARY.md vacio para $id") }
    }
    foreach ($id in $roadT) {
      $line = ([regex]::Match($roadmap,"(?m)^-\s+(?:\[[ x-]\]\s+)?$([regex]::Escape($id))\b.*")).Value
      $dir = $runT | Where-Object Name -eq $id | Select-Object -First 1
      $done = $line -match '^- \[x\]'
      if ($done) {
        $evidence = if ($dir) { Get-Content (Join-Path $dir.FullName "SUMMARY.md") -Raw } else { $line }
        if ($evidence -notmatch '(?i)PR[^\r\n]*#\d+') { [void]$errors.Add("Txx '$id' cerrada sin PR") }
        if ($evidence -match '(?i)Merge\s*:\s*(pendiente|no\b)') { [void]$errors.Add("Txx '$id' cerrada con Merge pendiente") }
      } elseif (-not $dir) { [void]$warnings.Add("Txx '$id' registrada abierta sin run; no se inventa evidencia") }
    }
    $summaries = @(Get-ChildItem $v2 -Filter SUMMARY.md -File -Recurse -ErrorAction SilentlyContinue)
    foreach ($match in [regex]::Matches($roadmap,'(?m)^- \[x\] \S+.*?Fase\s+(?<n>\d+)')) {
      $n = [int]$match.Groups["n"].Value
      $found = $summaries | Where-Object { (Get-Content $_.FullName -Raw) -match "(?m)^#\s*F0?$n\b" } | Select-Object -First 1
      if (-not $found) { [void]$errors.Add("ROADMAP F$("{0:D2}" -f $n) [x] sin SUMMARY de cierre") }
    }
    $status = Get-Content "STATUS.md" -Raw -Encoding UTF8
    $auto = [regex]::Match($status,'(?s)STATUS:AUTO:BEGIN.*?STATUS:AUTO:END')
    if ($auto.Success) {
      $recordedBranch = [regex]::Match($auto.Value,'(?m)^- Rama: (.+)$').Groups[1].Value.Trim()
      $recordedHead = [regex]::Match($auto.Value,'(?m)^- HEAD: \S+ \((?<sha>[0-9a-f]{40})\)').Groups["sha"].Value
      $branch = Git @("branch","--show-current"); $head = Git @("rev-parse","HEAD")
      if ($recordedBranch -ne $branch -or ($recordedHead -and $recordedHead -ne $head)) { [void]$warnings.Add("STATUS:AUTO stale: snapshot=$recordedBranch/$recordedHead actual=$branch/$head") }
    }
    if ($WorktreeDir) {
      $path = [IO.Path]::GetFullPath($WorktreeDir)
      if ((Git @("worktree","list","--porcelain")) -match "(?m)^worktree\s+$([regex]::Escape($path))$") { [void]$errors.Add("worktree Git activo: $path") }
      elseif (Test-Path $path) {
        if (@(Get-ChildItem $path -Force).Count) { [void]$errors.Add("cleanup incompleto: residual con archivos: $path") }
        else { [void]$warnings.Add("residual fisico vacio (posible lock Windows): $path") }
      }
    }
    $warnings | ForEach-Object { Write-Host "WARNING $_" }
    if ($errors.Count) { $errors | ForEach-Object { Write-Host "ERROR $_" }; exit 1 }
    Write-Host "PASS integridad global ROADMAP/runs/SUMMARY/Git/STATUS"
    exit 0
  } finally { Pop-Location }
} catch { Write-Host "ERROR Error de ejecucion: $($_.Exception.Message)"; exit 2 }
