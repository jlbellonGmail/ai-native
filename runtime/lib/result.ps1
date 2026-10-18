# pwsh reference implementation of runtime/lib/result.mjs (M3.1,
# PAR-RESULT-SEMANTICS / P3). Any pwsh script in this repo that needs the
# common result-status semantics (status/check scripts under
# runtime/status/, future adapters) dot-sources this instead of
# reimplementing its own ad-hoc PASS/exit-code logic -- the TEMPLATE
# v2.0.5 bugs (B08/B09/B10) this whole module guards against were all
# ad-hoc pwsh logic of exactly that shape.
#
# Kept in lockstep with result.mjs by construction: both are validated
# against the same case corpus, runtime/lib/result.conformance.json (see
# runtime/lib/result.conformance.test.ps1 and
# runtime/lib/result.test.mjs).

$ErrorActionPreference = "Stop"

$script:ResultStatus = [ordered]@{
    PASS               = "PASS"
    PASS_WITH_WARNINGS = "PASS_WITH_WARNINGS"
    FAIL               = "FAIL"
    ERROR              = "ERROR"
    # Valid only inside reports (audit-report, eval-result, etc). Never a
    # gate's own terminal status.
    NOT_RUN            = "NOT_RUN"
    NOT_APPLICABLE     = "NOT_APPLICABLE"
}

$script:ValidStatuses = [System.Collections.Generic.HashSet[string]]::new([string[]]$script:ResultStatus.Values)
$script:ReportOnlyStatuses = [System.Collections.Generic.HashSet[string]]::new([string[]]@("NOT_RUN", "NOT_APPLICABLE"))

function Assert-ResultStatusValid {
    param([Parameter(Mandatory)][string]$Status)
    if (-not $script:ValidStatuses.Contains($Status)) {
        throw "invalid result status: $Status"
    }
}

<#
Exit code semantics (identical to result.mjs#exitCodeFor):
  PASS                     -> 0
  PASS_WITH_WARNINGS       -> 0, or 1 when -Strict (CI runs strict)
  FAIL                     -> 1
  ERROR                    -> 2 (an execution/technical error; a gate
                                 must treat it the same as FAIL)
  NOT_RUN / NOT_APPLICABLE -> throws; these are report-only statuses

There is deliberately no output-format parameter (no -Json branch): the
exit code must not depend on how the result is rendered (B09).
#>
function Get-ResultExitCode {
    param([Parameter(Mandatory)][string]$Status, [switch]$Strict)
    Assert-ResultStatusValid $Status
    if ($script:ReportOnlyStatuses.Contains($Status)) {
        throw "$Status must not be used as a gate's own exit status"
    }
    switch ($Status) {
        "PASS" { return 0 }
        "PASS_WITH_WARNINGS" { if ($Strict) { return 1 } else { return 0 } }
        "FAIL" { return 1 }
        "ERROR" { return 2 }
        default { throw "unhandled status: $Status" }
    }
}

function Get-ResultStatusFromCounts {
    param([int]$Errors = 0, [int]$Warnings = 0)
    if ($Errors -gt 0) { return "FAIL" }
    if ($Warnings -gt 0) { return "PASS_WITH_WARNINGS" }
    return "PASS"
}

<#
Renders a one-line, human-readable label. The literal string "PASS" is
only ever returned for the PASS status itself (0 warnings, 0 errors) --
this is the direct regression guard for B08.
#>
function Format-ResultLine {
    param([Parameter(Mandatory)][string]$Status, [int]$Warnings = 0, [int]$Errors = 0)
    Assert-ResultStatusValid $Status
    if ($Status -eq "PASS_WITH_WARNINGS" -and $Warnings -eq 0) {
        throw "PASS_WITH_WARNINGS requires at least one warning"
    }
    if ($Status -eq "FAIL" -and $Errors -eq 0) {
        throw "FAIL requires at least one error"
    }
    if ($Status -eq "PASS_WITH_WARNINGS") {
        $suffix = if ($Warnings -eq 1) { "" } else { "s" }
        return "PASS_WITH_WARNINGS ($Warnings warning$suffix)"
    }
    if ($Status -eq "FAIL") {
        $suffix = if ($Errors -eq 1) { "" } else { "s" }
        return "FAIL ($Errors error$suffix)"
    }
    return $Status
}
