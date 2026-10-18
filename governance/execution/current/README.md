# AI-NATIVE v3.3.1 candidate — prepared, pending human promotion

```text
CANDIDATE: v3.3.1 (PATCH) on release/v3.3.1, from develop 3c9fe11 (#137, #138)
CONTENT: Capability Routing (sdd skill + role references); develop PR checks; CLI_VERSION v3.3.1
DETAIL: governance/versioning/V3.3.1-PATCH.md
PLATFORM AUDIT: report for the final SHA in .audit/reports/
v3.3.1 TAG / RELEASE: NOT CREATED / NOT PUBLISHED
NEXT: human PR develop -> main (merge commit), release-gate, tag
```

Current release: v3.3.0, below.

# AI-NATIVE v3.3.0 — Released and Verified

v3.3.0 is published and verified against the public release. Facts and
evidence: `governance/versioning/V3.3.0-POST-RELEASE-VERIFICATION.md`.

Status:

```text
ROADMAP: AI-NATIVE V3 / v3.3.0
STATE: V3.3.0_RELEASED_AND_VERIFIED
FINAL CANDIDATE / RELEASE SHA: ae6d50b02b6e0301c481871fb6038e42809dd55e
AUDITED SHA: d98a89e5079c98bb6f65b74f7f658e47553ac7e9 (differs only in .audit/**)
PLATFORM AUDIT: 93.00/100; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 10 MINOR
RELEASE-GATE: PASS_WITH_WARNINGS (21 STALE historical reports)
v3.3.0 TAG: annotated, on ae6d50b
v3.3.0 RELEASE: published, immutable; digest sha256:0c21bbae2ff0b809bdc29cc5fc57ad9802312aac812476ce1d955551ff631f1d
RELEASE WORKFLOW: run 39045212338; build PASS, publish PASS, verify PASS
verify-release: PASS (33 checks)
ACCEPTANCE FROM THE PUBLIC RELEASE: PASS (A-N)
PILOT #171: attempt 1 TRANSIENT_ENVIRONMENTAL (Docker exit 125); rerun PASS 10/10
```

The rest of this file is the previous snapshot (final audit readiness), kept
as history:

```text
STATE: V3_3_0_CANDIDATE_PENDING_FINAL_AUDIT
VERIFIED MAIN BASE: 823b31976cfc255926a2e39a205b2c22472b8d85
PR #127–#132: MERGED
B-01: CLOSED by the remediation in PR #128
F-001 (ai-native-human-review): CLOSED remotely; can_admins_bypass=false
F-001 (ai-native-trust): BYPASS CLOSED remotely; can_admins_bypass=false
A-02: CLOSED remotely; strict_required_status_checks_policy=true
LAST PLATFORM AUDIT: 92.25/100; 0 BLOCKER, 0 CRITICAL, 1 MAJOR, 10 MINOR
NEW INDEPENDENT PLATFORM AUDIT: PENDING
FINAL RELEASE-GATE: PENDING
v3.3.0 TAG: NOT CREATED
v3.3.0 RELEASE: NOT PUBLISHED
LOCAL HOST: WINDOWS / CONTEXTUAL_NON_BLOCKING
```

The previous MAJOR was the administrator-bypass setting on `ai-native-trust`.
The live setting is now false; this records the configuration change only and
makes no claim that a historical bypass occurred. A new audit must verify the
current state before the release gate can run.

Explicit non-goals of that previous execution:

* running the new PLATFORM audit before this governance snapshot is merged;
* running release-gate, creating a tag, or publishing a release;
* changing product code or correcting non-blocking MINOR findings;
* declaring `V3.3.0_RELEASED_AND_VERIFIED`.

P0-T2 remains historical and formally accepted. Its evidence is preserved in
`governance/execution/archive/AI-NATIVE-HARDENING-V1.1/P0-T2-IMPLEMENTATION/`.
