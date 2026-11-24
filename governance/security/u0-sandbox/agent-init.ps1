# Runs as the standard user "agent" inside the sandbox (started by setup.ps1). No GitHub login, no credential helper.
param([string]$Stamp = (Get-Date -Format 'yyyyMMdd-HHmmss'))
$ErrorActionPreference = 'Continue'
$cfg = Get-Content -LiteralPath 'C:\agent-setup\u0-config.json' -Raw | ConvertFrom-Json
$log = "C:\agent-exchange\u0-agent-init-$Stamp.log"
function Say([string]$m) { Add-Content -LiteralPath $log -Value "$(Get-Date -Format s) $m" }
function Invoke-GitStep([string[]]$GitArgs) { $o = & git @GitArgs 2>&1; $c = $LASTEXITCODE; $o | ForEach-Object { Say "git: $_" }; if ($c -ne 0) { throw ("git " + ($GitArgs -join ' ') + " exit $c") } }
$env:Path = 'C:\Program Files\Git\cmd;C:\Program Files\nodejs;C:\Program Files\GitHub CLI;' + $env:Path
try {
  # Empty credential.helper resets any inherited helper list; written directly because Windows PowerShell 5.1 drops "" arguments.
  Set-Content -LiteralPath (Join-Path $env:USERPROFILE '.gitconfig') -Encoding ascii -Value @(
    '[credential]', "`thelper =", '[user]', "`tname = ai-agent", "`temail = ai-agent@sandbox.invalid", '[init]', "`tdefaultBranch = main")
  Say ('credential.helper values: ' + ((& git config --show-origin --get-all credential.helper) -join ' | '))
  if (-not (Test-Path -LiteralPath (Join-Path $cfg.clonePath '.git'))) {
    Invoke-GitStep @('clone', '--quiet', $cfg.repository, $cfg.clonePath)
  }
  Set-Location -LiteralPath $cfg.clonePath
  Invoke-GitStep @('fetch', '--quiet', 'origin', $cfg.branch)
  Invoke-GitStep @('checkout', '--quiet', '-B', $cfg.branch, ('origin/' + $cfg.branch))
  Invoke-GitStep @('update-ref', 'refs/u0/base', 'HEAD')
  Say ("clone HEAD " + (& git rev-parse HEAD))
  Say 'Claude Code: official installer for this user'
  try {
    Invoke-RestMethod https://claude.ai/install.ps1 | Invoke-Expression *>&1 | ForEach-Object { Say "claude-install: $_" }
  } catch { Say "claude-install error: $($_.Exception.Message)" }
  # verify.ps1 is started separately by setup.ps1 (step 5c), after the final firewall pass.
  exit 0
} catch {
  Say "agent-init FAILED: $($_.Exception.Message)"
  exit 1
}
