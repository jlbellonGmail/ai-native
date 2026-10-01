# Runs result.ps1 against the shared conformance corpus
# (result.conformance.json), the same corpus runtime/lib/result.test.mjs
# runs the node implementation against (M3.1, PAR-RESULT-SEMANTICS / P3).
# Exits 0 on full conformance, 1 otherwise. No Pester dependency (matches
# ci.yml's "no install step" convention for this repo's own runtime/lib,
# as opposed to legacy/template-v2's pytest suite which does install
# requirements-dev.txt).
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "result.ps1")

$corpusPath = Join-Path $PSScriptRoot "result.conformance.json"
$corpus = Get-Content -Raw -Encoding UTF8 $corpusPath | ConvertFrom-Json

$failures = [Collections.Generic.List[string]]::new()
$total = 0

foreach ($case in $corpus.exitCodeCases) {
    $total++
    $actual = Get-ResultExitCode -Status $case.status -Strict:([bool]$case.strict)
    if ($actual -ne $case.exitCode) {
        $failures.Add("exitCodeCases: status=$($case.status) strict=$($case.strict) expected=$($case.exitCode) actual=$actual")
    }
}

foreach ($status in $corpus.invalidGateStatuses) {
    $total++
    $threw = $false
    try { [void](Get-ResultExitCode -Status $status) } catch { $threw = $true }
    if (-not $threw) {
        $failures.Add("invalidGateStatuses: $status was accepted as a gate's own exit status")
    }
}

foreach ($case in $corpus.statusFromCountsCases) {
    $total++
    $actual = Get-ResultStatusFromCounts -Errors $case.errors -Warnings $case.warnings
    if ($actual -ne $case.status) {
        $failures.Add("statusFromCountsCases: errors=$($case.errors) warnings=$($case.warnings) expected=$($case.status) actual=$actual")
    }
}

# forbiddenPatterns: direct regression checks for B08/B09/B10, mirroring
# runtime/lib/result.test.mjs.
$total++
# B08: formatLine never returns the bare literal "PASS" when warnings > 0.
$line = Format-ResultLine -Status "PASS_WITH_WARNINGS" -Warnings 2
if ($line -eq "PASS") {
    $failures.Add("forbiddenPatterns: print-pass-with-warnings-exit-0 (B08) -- Format-ResultLine returned bare 'PASS' with warnings > 0")
}

$total++
# B09: there is no -Json parameter on Get-ResultExitCode; the signature
# itself is the regression guard (no code path can select a different
# exit code based on output format).
$exitCodeParams = (Get-Command Get-ResultExitCode).Parameters.Keys
if ($exitCodeParams -contains "Json") {
    $failures.Add("forbiddenPatterns: json-mode-exit-always-0 (B09) -- Get-ResultExitCode must not take a -Json parameter")
}

$total++
# B10: a stale/warning-only condition must still report PASS_WITH_WARNINGS
# (never bare PASS), and must exit non-zero under -Strict.
$staleStatus = Get-ResultStatusFromCounts -Errors 0 -Warnings 1
if ($staleStatus -ne "PASS_WITH_WARNINGS") {
    $failures.Add("forbiddenPatterns: stale-status-still-prints-pass (B10) -- expected PASS_WITH_WARNINGS, got $staleStatus")
}
if ((Get-ResultExitCode -Status $staleStatus -Strict) -eq 0) {
    $failures.Add("forbiddenPatterns: stale-status-still-prints-pass (B10) -- -Strict exit code must be non-zero for PASS_WITH_WARNINGS")
}

if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Host "ERROR $_" }
    Write-Host "FAIL ($($failures.Count) of $total conformance checks failed)"
    exit 1
}

Write-Host "PASS result.ps1 conforms to result.conformance.json ($total checks)"
exit 0
