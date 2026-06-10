# VALIDATION

## Required Checks

Validation commands are recorded after execution in the Builder final response:

* `git status --short`
* `git diff --stat`
* `git diff --check`
* `git log --oneline -3`

## Expected Validation Assertions

* Only `governance/` changed.
* W3-T1 archive exists with required minimum contents.
* Roadmap marks only W3-T1 as completed for this closure.
* SESSION-CONTEXT marks W3-T1 as last valid closure and W3-T2 as next.
* Archive contains required evidence and artifacts.
* VERSION files remain intact.
* W3-T2 remains intact as next eligible task.
* JSON artifact is valid.
* References are valid.
* No runtime changes were made.
* No product changes were made.
* No new platform was introduced.
