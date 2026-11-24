# U0 Windows Sandbox setup. Runs ONCE per sandbox session as LogonCommand (WDAGUtilityAccount, administrator INSIDE the
# sandbox, before any agent process exists). Source of truth: governance/security/u0-sandbox/ in the repository; the
# copy in D:\agent-setup must match it byte for byte (RUNBOOK V0).
# Order matters: guest firewall and the standard user exist BEFORE the agent runs; the agent is meant never to hold
# administrator (intended; verified by verify.ps1 V1c/V1d and N5-N8; residual risk R4 in RUNBOOK.md).
# No secret is read, written or printed. ASCII only (Windows PowerShell 5.1).
$ErrorActionPreference = 'Stop'
$setup = 'C:\agent-setup'
$exchange = 'C:\agent-exchange'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $exchange "u0-setup-$stamp.log"
function Say([string]$m) { $line = "$(Get-Date -Format s) $m"; Add-Content -LiteralPath $log -Value $line; Write-Host $line }
function Fail([string]$m) { Say "SETUP FAILED: $m"; Write-Host 'SETUP FAILED. Close this sandbox window now. Do NOT run claude or any agent here (this console is administrator).'; exit 1 }
function Disable-OutboundAllow { Get-NetFirewallRule -PolicyStore PersistentStore | Where-Object { "$($_.Direction)" -eq 'Outbound' -and "$($_.Action)" -eq 'Allow' -and $_.DisplayName -notlike 'U0 *' } | Disable-NetFirewallRule }

try {
  $cfg = Get-Content -LiteralPath (Join-Path $setup 'u0-config.json') -Raw | ConvertFrom-Json
  Say 'step 1: verify installer hashes'
  foreach ($i in $cfg.installers) {
    $p = Join-Path $setup ('installers\' + $i.file)
    if (-not (Test-Path -LiteralPath $p)) { Fail "missing installer $($i.file)" }
    $h = (Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash.ToLower()
    if ($h -ne $i.sha256) { Fail "hash mismatch $($i.file)" }
  }

  Say 'step 1b: UAC must be enabled (otherwise a standard-user process could drive administrator windows)'
  $lua = (Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System' -Name EnableLUA -ErrorAction SilentlyContinue).EnableLUA
  if ($lua -ne 1) { Fail "EnableLUA=$lua : UAC is off inside the sandbox; U0 cannot hold (RUNBOOK R4)" }

  $elev = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  if (-not $elev) { Fail 'LogonCommand is not running elevated; the guest firewall and the agent user cannot be set up' }
  Say 'step 1c: mapped-folder probes as ADMINISTRATOR (the case that matters for the host boundary)'
  $adminWrote = $false
  try { [IO.File]::WriteAllText('C:\agent-setup\u0-admin-probe.txt', 'x'); $adminWrote = $true; Remove-Item -LiteralPath 'C:\agent-setup\u0-admin-probe.txt' -ErrorAction SilentlyContinue } catch { Say "admin write to setup mapping refused: $($_.Exception.GetBaseException().GetType().Name)" }
  if ($adminWrote) { Fail 'administrator could write into the read-only setup mapping' }
  $j = Join-Path $exchange "u0-admin-junction-$stamp"
  & cmd.exe /c mklink /J $j 'C:\Windows' 2>&1 | Out-Null
  if (Test-Path -LiteralPath $j) { & cmd.exe /c rmdir $j 2>&1 | Out-Null; Fail 'administrator could create a junction in the exchange mapping' } else { Say 'admin junction in exchange: not created' }
  $sl = Join-Path $exchange "u0-admin-symlink-$stamp"
  $made = $false; try { New-Item -ItemType SymbolicLink -Path $sl -Target 'C:\Windows' -ErrorAction Stop | Out-Null; $made = $true } catch { }
  if ($made) { Remove-Item -LiteralPath $sl -Force -ErrorAction SilentlyContinue; Fail 'administrator could create a symlink in the exchange mapping' } else { Say 'admin symlink in exchange: not created' }

  Say 'step 2: guest firewall (default deny outbound; public IPv4 + DNS/DHCP to the sandbox gateway only)'
  $gw = @(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway } | ForEach-Object { $_.IPv4DefaultGateway.NextHop })
  $dns = @(Get-DnsClientServerAddress -AddressFamily IPv4 | ForEach-Object { $_.ServerAddresses } | Where-Object { $_ })
  if (-not $gw.Count) { Fail 'no IPv4 default gateway' }
  # DNS only through the sandbox gateway: a LAN DNS server (e.g. the router) would have to be reachable, which N2 forbids.
  $foreignDns = @($dns | Where-Object { $gw -notcontains $_ })
  if ($foreignDns.Count) { Fail ("DNS server(s) other than the sandbox gateway: " + ($foreignDns -join ',') + "; refusing to open them") }
  Disable-OutboundAllow
  Set-NetFirewallProfile -All -Enabled True -DefaultInboundAction Block -DefaultOutboundAction Block -AllowLocalFirewallRules True
  New-NetFirewallRule -DisplayName 'U0 allow public IPv4' -Direction Outbound -Action Allow -RemoteAddress $cfg.allowedPublicRanges -Profile Any | Out-Null
  $infra = @($gw)
  New-NetFirewallRule -DisplayName 'U0 allow DNS udp' -Direction Outbound -Action Allow -Protocol UDP -RemotePort 53 -RemoteAddress $infra -Profile Any | Out-Null
  New-NetFirewallRule -DisplayName 'U0 allow DNS tcp' -Direction Outbound -Action Allow -Protocol TCP -RemotePort 53 -RemoteAddress $infra -Profile Any | Out-Null
  New-NetFirewallRule -DisplayName 'U0 allow DHCP' -Direction Outbound -Action Allow -Protocol UDP -LocalPort 68 -RemotePort 67 -Profile Any | Out-Null
  Say ("gateway=" + ($gw -join ',') + " dns=" + ($dns -join ','))
  Set-Content -LiteralPath 'C:\u0-gateway.txt' -Value ($gw -join ',') -Encoding ascii

  Say 'step 3: install Node, Git (credential helper none), gh (never logged in)'
  $n = $cfg.installers | Where-Object { $_.file -like 'node-*' }
  $g = $cfg.installers | Where-Object { $_.file -like 'Git-*' }
  $c = $cfg.installers | Where-Object { $_.file -like 'gh_*' }
  $r = Start-Process msiexec.exe -ArgumentList @('/i', (Join-Path $setup ('installers\' + $n.file)), '/qn', '/norestart') -Wait -PassThru; if ($r.ExitCode -ne 0) { Fail "node install exit $($r.ExitCode)" }
  $r = Start-Process (Join-Path $setup ('installers\' + $g.file)) -ArgumentList @('/VERYSILENT', '/NORESTART', '/NOCANCEL', '/SP-', '/SUPPRESSMSGBOXES', '/o:CredentialHelper=none') -Wait -PassThru; if ($r.ExitCode -ne 0) { Fail "git install exit $($r.ExitCode)" }
  $r = Start-Process msiexec.exe -ArgumentList @('/i', (Join-Path $setup ('installers\' + $c.file)), '/qn', '/norestart') -Wait -PassThru; if ($r.ExitCode -ne 0) { Fail "gh install exit $($r.ExitCode)" }
  # Machine-wide: no credential helper anywhere (Git for Windows may still write one into its system config).
  & 'C:\Program Files\Git\cmd\git.exe' config --system --unset-all credential.helper 2>$null

  Say 'step 4: standard local user for the agent (random password, never shown or stored on the host)'
  $chars = [char[]]'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!#%+=?'
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create(); $b = New-Object byte[] 32; $rng.GetBytes($b)
  $pw = -join ($b | ForEach-Object { $chars[$_ % $chars.Length] })
  $sec = ConvertTo-SecureString $pw -AsPlainText -Force
  $u = $cfg.agentUser
  New-LocalUser -Name $u -Password $sec -PasswordNeverExpires -AccountNeverExpires -UserMayNotChangePassword | Out-Null
  Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $u
  $cred = New-Object Management.Automation.PSCredential("$env:COMPUTERNAME\$u", $sec)
  New-Item -ItemType Directory -Path 'C:\work' -Force | Out-Null
  & icacls.exe 'C:\work' /grant "${u}:(OI)(CI)M" | Out-Null
  & icacls.exe 'C:\u0-gateway.txt' /grant "${u}:R" | Out-Null

  Say 'step 5: as the agent user: git config, clone, Claude Code install, verification'
  $agentStep = Join-Path $setup 'agent-init.ps1'
  $p = Start-Process powershell.exe -Credential $cred -LoadUserProfile -WorkingDirectory 'C:\work' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $agentStep, '-Stamp', $stamp) -Wait -PassThru
  Say "agent-init exit $($p.ExitCode)"
  Say 'step 5b: re-disable outbound allow rules added after step 2 (e.g. by first-logon app registration)'
  Disable-OutboundAllow
  Say 'step 5c: boundary verification as the agent user (after the final firewall pass)'
  $v = Start-Process powershell.exe -Credential $cred -LoadUserProfile -WorkingDirectory 'C:\work' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $setup 'verify.ps1'), '-Stamp', $stamp) -Wait -PassThru
  Say "verify exit $($v.ExitCode) (0 = PASS)"
  if ($v.ExitCode -ne 0) { Fail "verify FAIL (exit $($v.ExitCode)); no agent shell is opened. Read the u0-verify-$stamp.json report." }

  Say 'step 6: open the agent shell (standard user) for the human to start claude'
  Start-Process powershell.exe -Credential $cred -LoadUserProfile -WorkingDirectory $cfg.clonePath -ArgumentList @('-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "`$host.UI.RawUI.WindowTitle='U0 agent shell'; Get-Content -Encoding UTF8 C:\agent-setup\CONTINUATION.md; Write-Host ''; Write-Host 'Run: claude   (log in with the owner subscription in THIS sandbox browser)'")
  $pw = $null; $sec = $null
  Say 'setup done'
} catch {
  Fail $_.Exception.Message
}
