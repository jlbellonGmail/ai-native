# U0 boundary verifier. Run INSIDE the sandbox as the standard user "agent" (agent-init.ps1 runs it once; re-run any time:
#   powershell -NoProfile -ExecutionPolicy Bypass -File C:\agent-setup\verify.ps1 ).
# Every check is an effective test with the agent's real identity. Output: C:\agent-exchange\u0-verify-<stamp>.json.
# A check passes only when its observed outcome equals the expected one; anything inconclusive is FAIL. No secrets read.
param([string]$Stamp = (Get-Date -Format 'yyyyMMdd-HHmmss'))
$ErrorActionPreference = 'Continue'
$cfg = Get-Content -LiteralPath 'C:\agent-setup\u0-config.json' -Raw | ConvertFrom-Json
$env:Path = 'C:\Program Files\Git\cmd;C:\Program Files\nodejs;C:\Program Files\GitHub CLI;' + $env:Path
$results = New-Object System.Collections.Generic.List[object]
function Add-Check([string]$id, [string]$what, [string]$expected, [string]$observed, [bool]$pass) {
  $results.Add([pscustomobject]@{ id = $id; check = $what; expected = $expected; observed = $observed; pass = $pass })
}
# Outcome of a TCP connect, classified. 'blocked' = WSAEACCES (10013): the guest firewall refused the packet locally, the
# ONLY proof that it never left the guest. 'refused' (10061) or 'timeout' mean the packet left the guest: not blocked.
function Test-Tcp([string]$h, [int]$port, [int]$ms = 3000, [switch]$V6) {
  # Windows PowerShell 5.1: the default TcpClient is IPv4-only, so IPv6 targets need an explicit IPv6 socket.
  $c = if ($V6) { New-Object Net.Sockets.TcpClient([Net.Sockets.AddressFamily]::InterNetworkV6) } else { New-Object Net.Sockets.TcpClient }
  try {
    $t = $c.ConnectAsync($h, $port)
    if ($t.Wait($ms)) { if ($c.Connected) { 'connected' } else { 'unknown' } } else { 'timeout' }
  } catch {
    $e = $_.Exception.GetBaseException()
    if ($e -is [Net.Sockets.SocketException]) {
      switch ($e.ErrorCode) { 10013 { 'blocked' } 10061 { 'refused' } 10060 { 'timeout' } 10051 { 'unreachable' } 10065 { 'unreachable' } 11001 { 'no-dns' } default { 'socket-' + $e.ErrorCode } }
    } else { 'error:' + $e.GetType().Name }
  } finally { $c.Dispose() }
}

# V1 identity
$who = (& whoami).Trim()
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Add-Check 'V1a' 'whoami is the sandbox standard user' ("*\" + $cfg.agentUser) $who ($who -like ("*\" + $cfg.agentUser))
Add-Check 'V1b' 'hostname is not the host' 'not M7' $env:COMPUTERNAME ($env:COMPUTERNAME -ne 'M7')
Add-Check 'V1c' 'agent token is not administrator' 'False' ([string]$isAdmin) (-not $isAdmin)
# UAC must be on: with it off, a standard-user process could drive the administrator's windows on the same desktop (UIPI off).
$lua = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -Name EnableLUA -ErrorAction SilentlyContinue).EnableLUA
Add-Check 'V1d' 'UAC enabled (EnableLUA)' '1' ([string]$lua) ($lua -eq 1)

# V2 no host drives, shares, or paths
$drives = @(Get-PSDrive -PSProvider FileSystem | ForEach-Object { $_.Name })
Add-Check 'V2a' 'filesystem drives' 'C' ($drives -join ',') (($drives -join ',') -eq 'C')
$smbOk = $true; try { $smb = @(Get-SmbMapping -ErrorAction Stop) } catch { $smbOk = $false; $smb = @() }
$nu = (& net use 2>&1 | Out-String)
$nuEmpty = $nu -match 'No hay entradas|There are no entries'
Add-Check 'V2b' 'SMB mappings (Get-SmbMapping + net use)' 'none' ("query-ok=$smbOk smb=$($smb.Count) netuse-empty=$nuEmpty") ($smbOk -and $smb.Count -eq 0 -and $nuEmpty)
foreach ($p in 'D:\proyectos', 'C:\Users\jlbel', 'D:\') { Add-Check 'V2c' "host path absent: $p" 'False' ([string](Test-Path -LiteralPath $p)) (-not (Test-Path -LiteralPath $p)) }

# V3 repository isolation probe (unchanged runtime)
if (Test-Path -LiteralPath (Join-Path $cfg.clonePath 'runtime\gates\plan-approval.mjs')) {
  Push-Location -LiteralPath $cfg.clonePath
  $o = (& node runtime/gates/plan-approval.mjs check-agent-isolation 2>&1 | Out-String).Trim()
  Pop-Location
  Add-Check 'V3' 'check-agent-isolation' 'agent-isolation: PASS' (($o -split "`r?`n")[0]) ($o -match '^agent-isolation: PASS')
} else { Add-Check 'V3' 'check-agent-isolation' 'agent-isolation: PASS' 'clone missing' $false }

# V4 / V5 no GitHub identity, no stored credentials
$gh = (& gh auth status --json hosts 2>&1 | Out-String).Trim()
Add-Check 'V4' 'gh accounts' '{"hosts":{}}' ($gh -replace '\s', '') (($gh -replace '\s', '') -eq '{"hosts":{}}')
$ck = (& cmdkey /list 2>&1 | Out-String)
Add-Check 'V5' 'cmdkey stored credentials' '* NINGUNO * or * NONE *' (($ck -split "`r?`n" | Where-Object { $_ -match 'NINGUNO|NONE|Destino|Target' }) -join ' ; ') ($ck -match '\* (NINGUNO|NONE) \*')
$tok = @('GH_TOKEN', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GITHUB_ENTERPRISE_TOKEN') | Where-Object { [Environment]::GetEnvironmentVariable($_) }
Add-Check 'V5b' 'GitHub token variables' 'none' (($tok -join ',') + '') (-not $tok)
$helpers = @(& git config --get-all credential.helper 2>$null)
$last = if ($helpers.Count) { $helpers[-1] } else { '' }
Add-Check 'V5c' 'effective git credential.helper' '(empty)' ("[" + $last + "] count=" + $helpers.Count) ($last -eq '')

# V6 shared folders: setup read-only; exchange writable; no links
$probe = 'C:\agent-setup\u0-probe.txt'
try { [IO.File]::WriteAllText($probe, 'x'); $o = 'WRITTEN'; Remove-Item -LiteralPath $probe -ErrorAction SilentlyContinue } catch { $o = $_.Exception.GetBaseException().GetType().Name }
Add-Check 'V6a' 'write into read-only setup mapping' 'UnauthorizedAccessException' $o ($o -eq 'UnauthorizedAccessException')
$xp = "C:\agent-exchange\u0-probe-$Stamp.txt"
try { [IO.File]::WriteAllText($xp, 'x'); Remove-Item -LiteralPath $xp; $o = 'ok' } catch { $o = $_.Exception.GetBaseException().GetType().Name }
Add-Check 'V6a2' 'write+delete in exchange mapping' 'ok' $o ($o -eq 'ok')
$j = "C:\agent-exchange\u0-junction-$Stamp"
$jo = (& cmd.exe /c mklink /J $j 'C:\Users' 2>&1 | Out-String).Trim()
$made = Test-Path -LiteralPath $j
if ($made) { & cmd.exe /c rmdir $j 2>&1 | Out-Null }
Add-Check 'V6b1' 'create junction in exchange' 'not created' ($(if ($made) { 'CREATED (removed)' } else { 'not created' })) (-not $made)
$s = "C:\agent-exchange\u0-symlink-$Stamp"
try { New-Item -ItemType SymbolicLink -Path $s -Target 'C:\Windows' -ErrorAction Stop | Out-Null; $sm = $true } catch { $sm = $false }
if ($sm) { Remove-Item -LiteralPath $s -Force -ErrorAction SilentlyContinue }
Add-Check 'V6b2' 'create symlink in exchange' 'not created' ($(if ($sm) { 'CREATED (removed)' } else { 'not created' })) (-not $sm)

# N network boundary: host and LAN blocked, required public endpoints reachable, firewall not modifiable by the agent
$gw = @(); if (Test-Path -LiteralPath 'C:\u0-gateway.txt') { $gw = (Get-Content -LiteralPath 'C:\u0-gateway.txt' -Raw).Trim() -split ',' }
foreach ($g in $gw) { foreach ($port in $cfg.gatewayPortsMustBeBlocked) { $r = Test-Tcp $g $port; Add-Check 'N1' "sandbox gateway (host) $g`:$port" 'blocked' $r ($r -eq 'blocked') } }
foreach ($t in $cfg.mustBeBlocked) { foreach ($port in $t.ports) { $r = Test-Tcp $t.host $port; Add-Check 'N2' "LAN $($t.host):$port" 'blocked' $r ($r -eq 'blocked') } }
$v6targets = @($cfg.ipv6MustBeBlocked | ForEach-Object { [pscustomobject]@{ host = $_.host; port = $_.port } })
foreach ($hop in @(Get-NetRoute -DestinationPrefix '::/0' -ErrorAction SilentlyContinue | ForEach-Object { $_.NextHop } | Where-Object { $_ -and $_ -ne '::' } | Select-Object -Unique)) {
  foreach ($port in $cfg.gatewayPortsMustBeBlocked) { $v6targets += [pscustomobject]@{ host = ($hop -replace '%.*$', ''); port = $port } }
}
foreach ($t in $v6targets) { $r = Test-Tcp $t.host $t.port -V6; Add-Check 'N3' "IPv6 $($t.host) port $($t.port)" 'blocked or unreachable' $r ($r -in 'blocked', 'unreachable') }
foreach ($t in $cfg.mustBeReachable) { $r = Test-Tcp $t.host $t.port 8000; Add-Check 'N4' "public $($t.host):$($t.port)" 'connected' $r ($r -eq 'connected') }
$fwOff = $false; try { Set-NetFirewallProfile -All -Enabled False -ErrorAction Stop; $fwOff = $true } catch { }
if ($fwOff) { Set-NetFirewallProfile -All -Enabled True -ErrorAction SilentlyContinue }
Add-Check 'N5' 'agent can disable guest firewall' 'denied' ($(if ($fwOff) { 'ALLOWED' } else { 'denied' })) (-not $fwOff)
$ruleMade = $false; try { New-NetFirewallRule -DisplayName 'u0-tamper' -Direction Outbound -Action Allow -RemoteAddress 192.168.0.0/16 -ErrorAction Stop | Out-Null; $ruleMade = $true } catch { }
if ($ruleMade) { Remove-NetFirewallRule -DisplayName 'u0-tamper' -ErrorAction SilentlyContinue }
Add-Check 'N6' 'agent can add a firewall allow rule' 'denied' ($(if ($ruleMade) { 'ALLOWED' } else { 'denied' })) (-not $ruleMade)

$n7ok = $true
# Only configurable rule sources count (Local / GroupPolicy); service-hardening and dynamic rules are listed as information.
try {
  $active = @(Get-NetFirewallRule -PolicyStore ActiveStore -ErrorAction Stop | Where-Object { "$($_.Enabled)" -eq 'True' -and "$($_.Direction)" -eq 'Outbound' -and "$($_.Action)" -eq 'Allow' -and $_.DisplayName -notlike 'U0 *' })
  $extra = @($active | Where-Object { "$($_.PolicyStoreSourceType)" -in 'Local', 'GroupPolicy' })
  $infoRules = @($active | Where-Object { "$($_.PolicyStoreSourceType)" -notin 'Local', 'GroupPolicy' } | ForEach-Object { "$($_.PolicyStoreSourceType):$($_.DisplayName)" })
} catch { $n7ok = $false; $extra = @(); $infoRules = @() }
Add-Check 'N7' 'active outbound allow rules other than U0' 'none (query ok)' ("query-ok=$n7ok count=$($extra.Count) " + (($extra | Select-Object -First 5 | ForEach-Object { $_.DisplayName }) -join '; ')) ($n7ok -and $extra.Count -eq 0)
$prof = @(Get-NetFirewallProfile -ErrorAction SilentlyContinue)
Add-Check 'N8' 'all firewall profiles enabled with outbound default Block' '3 profiles' (($prof | ForEach-Object { "$($_.Name):$($_.Enabled):$($_.DefaultOutboundAction)" }) -join ' ') (($prof.Count -eq 3) -and -not ($prof | Where-Object { "$($_.Enabled)" -ne 'True' -or "$($_.DefaultOutboundAction)" -ne 'Block' }))

$all = -not ($results | Where-Object { -not $_.pass })
$report = [pscustomobject]@{
  kind = 'u0-sandbox-verify'; stamp = $Stamp; result = $(if ($all) { 'PASS' } else { 'FAIL' })
  cloneHead = $(try { (& git -C $cfg.clonePath rev-parse HEAD 2>$null) } catch { $null })
  scriptSha256 = (Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLower()
  informativeOutboundAllowNonConfigurable = $infoRules
  note = 'Evidence only if read by the owner BEFORE claude is first started in this session (the exchange folder is agent-writable afterwards).'
  manualPending = @('V7 clipboard both directions (human)', 'V8 positive control on the host (human)', 'V0 host-side hash/contents check (human)')
  checks = $results
}
$out = "C:\agent-exchange\u0-verify-$Stamp.json"
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $out -Encoding UTF8
Write-Host "u0-verify: $($report.result) -> $out"
if ($all) { exit 0 } else { exit 2 }
