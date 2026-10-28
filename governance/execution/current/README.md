# AI-NATIVE v3.4.1 — PATCH Candidate

Candidate prepared on `release/v3.4.1`; not tagged, not released. Detail:
`governance/versioning/V3.4.1-PATCH.md`.

```text
ROADMAP: AI-NATIVE V3 / v3.4.1 (PATCH)
STATE: V3.4.1_CANDIDATE
BASE: develop 036e6f8b2045d51ec43aad91fdbb599668588ca0 (merge of #153; origin/main 15f35ff is an ancestor)
CONTENT: fix(adapters) f3955c9 (Claude agent YAML description escaped; RED 8 failed / GREEN 15/15) + U+FFFE/U+FFFF follow-up from the independent review of 4ad607a; CLI_VERSION v3.4.1 7e8fea1
INDEPENDENT CODE REVIEW (4ad607a): APPROVED, 5 LOW (1-4 addressed, 5 informational); not an attested SDD review receipt
CONSUMER DELTA: 2 of 229 bundle files; 3 projections (.claude/agents/*.md description line)
E2E (Claude Code 2.1.311): reviewer registered and invoked in v3.4.0 and the candidate; "Agent type 'reviewer' not found" NOT REPRODUCED
SEPARATE DEFECT (no scope opened): attested independent review NOT_PROVEN in both versions (SubagentHandback)
PUBLICATION: subject to a human decision (structural YAML fix only)
PLATFORM AUDIT: on the final SHA, recorded in .audit/reports/
v3.4.1 TAG / RELEASE: NOT CREATED / NOT PUBLISHED
```

Current release: v3.4.0, below.

# AI-NATIVE v3.4.0 — Released and Verified

v3.4.0 is published and verified against the public release. Facts and
evidence: `governance/versioning/V3.4.0-POST-RELEASE-VERIFICATION.md`.

```text
ROADMAP: AI-NATIVE V3 / v3.4.0 (MINOR)
STATE: V3.4.0_RELEASED_AND_VERIFIED
FINAL CANDIDATE / RELEASE SHA: 15f35ff440baad8edcead949169cfe640df6a7e6 (merge of #150, develop -> main)
AUDITED SHA: 9f0f9a4f760c9f2891036daf5df9c1389184e53f (differs only in .audit/**)
PLATFORM AUDIT: independent, 90.25/100; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR
TRIVY REMEDIATION: 7d5d0f7 included; trivy-fs PASS on 15f35ff
RELEASE-GATE (build job): PASS_WITH_WARNINGS (26 STALE historical reports)
v3.4.0 TAG: annotated, on 15f35ff
v3.4.0 RELEASE: published, immutable; digest sha256:dfecc9746a951a59fe5b1e9d8337823cb2af39091122333d5297d02b52d635ad
RELEASE WORKFLOW: run 40446182779; build PASS, publish PASS, verify PASS (provenance, SBOM, attestation)
BOOTSTRAP (remote, --require-attestation): PASS
INIT (empty repository, published asset): READY
CLI_VERSION: v3.4.0; VERSION: 3.0.0-dev (unchanged)
PENDING CANDIDATE / PROMOTION: none
NON-BLOCKING FOLLOW-UPS: N-31, N-29 (Windows, environmental), N-32 (7 open development Dependabot alerts) and the other audit MINOR/SUGGESTION items; listed in the verification file, no scope opened
```

Previous snapshot (candidate preparation), kept as history:

```text
CANDIDATE: v3.4.0 (MINOR) on release/v3.4.0, from develop a00e1683318e6696a320182de507e5d2274a7345 (#148)
CONTENT: runtime-attested independent SDD review (#146: 323dd4c, db6e99f, 8553349); CLI_VERSION v3.4.0; N-30 fix ef103e9; Trivy remediation 7d5d0f7
DETAIL: governance/versioning/V3.4.0-RELEASE.md
EXCLUDED: Dependabot PRs #142-#147; only dependency change: Trivy remediation 7d5d0f7 (next, body-parser), after AUDIT-PLATFORM-9678acb
BRANCH: release/v3.4.0 published on origin
PR #149 release/v3.4.0 -> develop: MERGED by the human; develop = aebb832 (merge commit)
PR #151 release/v3.4.0 -> develop: MERGED by the human; develop = 3be07c9 (merge commit)
PR #150 develop -> main: MERGED by the human; main = 15f35ff (merge commit)
```

Previous release: v3.3.1, below.

# AI-NATIVE v3.3.1 — Released and Verified

v3.3.1 is published and verified against the public release. Facts and
evidence: `governance/versioning/V3.3.1-POST-RELEASE-VERIFICATION.md`.

```text
ROADMAP: AI-NATIVE V3 / v3.3.1 (PATCH)
STATE: V3.3.1_RELEASED_AND_VERIFIED
FINAL CANDIDATE / RELEASE SHA: 4974fa6641d415fdaca93150c45b2e1e960ce796 (merge of #140, develop -> main)
AUDITED SHA: 65fc5628d6e567d5771a83be5ef962c771c8e5d7 (differs only in .audit/**)
PLATFORM AUDIT: independent, 90.75/100; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 16 MINOR
RELEASE-GATE (AUDIT-PLATFORM-65fc562.md): PASS; errors [], warnings []
v3.3.1 TAG: annotated, on 4974fa6
v3.3.1 RELEASE: published, immutable; digest sha256:1fc1f9b72e88170e25475f5e547d85e63c9616082d787e9f7a0286e96db1c646
RELEASE WORKFLOW: run 39186071891; build PASS, publish PASS, verify PASS
verify-release: PASS (33 checks, public assets)
BOOTSTRAP (remote, --require-attestation): PASS
INIT (empty repository, published asset): READY
NON-BLOCKING FOLLOW-UPS: listed in the verification file, no scope opened
```

Previous snapshot (candidate preparation), kept as history:

```text
CANDIDATE: v3.3.1 (PATCH) on release/v3.3.1, from develop 3c9fe11 (#137, #138)
CONTENT: Capability Routing (sdd skill + role references); develop PR checks; CLI_VERSION v3.3.1
DETAIL: governance/versioning/V3.3.1-PATCH.md
PLATFORM AUDIT: report for the final SHA in .audit/reports/
v3.3.1 TAG / RELEASE: NOT CREATED / NOT PUBLISHED
NEXT: human PR develop -> main (merge commit), release-gate, tag
```

Previous release: v3.3.0, below.

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
