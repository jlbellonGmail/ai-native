# AI-NATIVE v3.4.3 — Released and Verified

`v3.4.3` is published and verified. Release and consumer evidence:
`governance/versioning/V3.4.3-POST-RELEASE-VERIFICATION.md`. Candidate detail:
`governance/versioning/V3.4.3-PATCH.md`.

```text
ROADMAP: AI-NATIVE V3 / v3.4.3 (PATCH, N-35)
STATE: V3.4.3_RELEASED_AND_VERIFIED
BASE: develop 3f4351d (merge of #163, v3.4.2 post-release docs) = origin/develop; no integration needed
CONTENT: fix(adapters) 7707e93 (a reviewer call Claude Code refused before it ran is not a tool used; exact refusal pair read from the turns); docs b61e3cd; CLI_VERSION v3.4.3 4a4765a; fix(adapters) bf885e4 (an mcp__ call is never excused; LOW-2 tests) after the independent review of 4a4765a
REGRESSION: RED 3 N-35 tests vs v3.4.2: 3 FAIL by assertion; GREEN 7707e93: 3 PASS (TMP outside %TEMP%; with the default %TEMP% test 2 hit the git "Permission denied" flake twice); RED review fixes vs 4a4765a: MCP case FAIL by assertion; GREEN bf885e4: 3 PASS
CI REPLICA (local, 4a4765a): 51 steps, 1084 tests, 1073 PASS, 9 FAIL, 2 skips; the 9 FAIL are attributed from their logs to the git host flake in files N-35 does not touch (adapters consumer-launcher 5, bootstrap adopt 4), not re-run for this candidate; the replica was not repeated after bf885e4 (memory pressure); remote CI is the confirmation
RECEIPT RE-VERIFICATION (v3.4.2 -> bf885e4): gi bc6845 1 error -> 0/APPROVED; gi 4bf803 1 error -> 0/CHANGES_REQUESTED; gi 10cb00 (follow-up) and ff8fee (N-34) unchanged; E2E A 1 error -> 0/APPROVED; E2E B (2) and C still "tools outside its read-only set: Bash"
E2E (Claude Code 2.1.312, bundle of 4a4765a, digest sha256:09a36ec7...): A Bash refused -> INDEPENDENT_REVIEW PASS / FINAL APPROVED; B Bash ran -> NOT_PROVEN / REVIEW_PENDING; C Bash ran, exit 3 -> NOT_PROVEN / REVIEW_PENDING; HUMAN_GATE required in all
INDEPENDENT REVIEWS: 1 on 4a4765a APPROVED (general-purpose subagent, isolated context, read-only instructions): LOW-1 MCP imitation of the short refusal, LOW-2 unpinned negative cases -> bf885e4; INFO-3 wording -> V3.4.3-PATCH.md; INFO-5 pre-existing (packet Read not checked by result) deferred; 2 delta 4a4765a..b9e513d APPROVED: LOW-3 (275/273 is the circuit step), LOW-4 (9 local FAIL not re-run) -> docs
REMOTE CI (PR #164, d7a2ee5, run 40807651307): validators windows 1110 tests / 1108 PASS / 0 FAIL / 2 skips, ubuntu 1110 / 1110 PASS; the 9 local FAIL do not reproduce; security checks PASS except CodeQL: 1 new high alert (js/useless-regexp-character-escape in the N-35 test assertion, a real test defect) fixed in a4165b3
FINAL CANDIDATE / RELEASE SHA: 7bfa2f063303ce48af90a024283625856d74e8cb (merge of #165, develop -> main)
PLATFORM AUDIT: 90.25/100 APTO; 0 BLOCKER, 0 CRITICAL, 0 MAJOR; 17 inherited MINOR
RELEASE WORKFLOW: 40820318690 attempt 2; build PASS, publish PASS, public verify PASS
v3.4.3 TAG / RELEASE: annotated tag on 7bfa2f0 / PUBLISHED AND VERIFIED
PUBLIC BUNDLE: sha256:12c15adc8db3d30559eb72e075eedc16b620b522dd9235696cb83617446cea7b
CONSUMER: gi-common-reference PR #6 merged as 42ec2dc; lock, doctor, tests and 4 stored receipt replays verified
RESIDUAL: pilot offline Ubuntu fails before product execution with Docker exit 125; online Windows/Ubuntu and offline Windows PASS
PENDING CANDIDATE / PROMOTION: none
```

Current release: v3.4.2, below.

# AI-NATIVE v3.4.2 — Released and Verified

v3.4.2 is published and verified against the public release. Facts and
evidence: `governance/versioning/V3.4.2-POST-RELEASE-VERIFICATION.md`.

```text
ROADMAP: AI-NATIVE V3 / v3.4.2 (PATCH, N-34)
STATE: V3.4.2_RELEASED_AND_VERIFIED
FINAL CANDIDATE / RELEASE SHA: 30119d5d51c4420de3a327560c166109f6bdde76 (merge of #162, develop -> main)
AUDITED SHA: d6c5d4a6d4cd909b2ae7eaa938214e708cddab9d (differs only in .audit/**)
PLATFORM AUDIT: independent, 90.25/100; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 17 MINOR (inherited); N-34 closed; threshold reached without tolerance
RELEASE-GATE (build job): PASS_WITH_WARNINGS (28 STALE historical reports)
v3.4.2 TAG: annotated, on 30119d5, created by the human
v3.4.2 RELEASE: published, immutable; digest sha256:97da1195a68456d2c8d3ce669e80de0863b82863b75891e720757ac027bdd76f
RELEASE WORKFLOW: run 40746605663; build PASS, publish PASS, verify PASS
verify-release: PASS (33 checks, public assets)
INIT (empty repository) / UPGRADE (v3.4.1 -> v3.4.2): READY / READY (disposable consumers; upgrade +0 ~2 -0, consumer files preserved)
N-34 IN THE PUBLISHED BUNDLE: 4 real Claude Code 2.1.312 receipts re-verified with the published adapter: 0 errors, verdicts kept (v3.4.1 adapter: 5/5/2/2); Claude Code 2.1.311 NOT E2E-covered
INDEPENDENT REVIEWS: f877b2c APPROVED; delta f4ec7d5 and d6c5d4a APPROVED (recorded in #161)
CLI_VERSION: v3.4.2; VERSION: 3.0.0-dev (unchanged)
PENDING CANDIDATE / PROMOTION: none
NON-BLOCKING FOLLOW-UPS (no scope opened): Claude Code 2.1.311 E2E, OpenCode real CLI, pilot offline Ubuntu (Docker exit 125 on 635a60c, 4/4 on 30119d5, cause not demonstrated), S-14..S-17, S-19..S-23, F-04 tag ruleset, actions/attest-sbom deprecation, ubuntu-latest migration, main -> develop sync, Lenovo global CLI, worktree inventory and authorized cleanup; listed in the verification file
```

Previous snapshot (candidate preparation), kept as history:

# AI-NATIVE v3.4.2 — PATCH Candidate (history)

Candidate prepared on `fix/n34-subagent-handback-v3.4.2`; not tagged, not released. Detail:
`governance/versioning/V3.4.2-PATCH.md`; evidence:
`governance/versioning/evidence/n34-subagent-handback-v3.4.2.json`.

```text
ROADMAP: AI-NATIVE V3 / v3.4.2 (PATCH, N-34)
STATE: V3.4.2_CANDIDATE
BASE: develop 4260fa8 (chore(sync): merge main into develop after v3.4.1); PR #160 merged into develop as 49868e4 with the same tree (42f603fd2c47c7f110a019fa07914679a84a70e5), so no integration is needed; origin/develop = 49868e4 is the PR base
CONTENT: fix(adapters) a446488 (reviewer reports delivered by SubagentHandback are attested; only runtime/adapters/claude-review.mjs + runtime/circuit/review-ledger.test.mjs); CLI_VERSION v3.4.2 dc80f17; fix(adapters) 14d6a87 (exact harness instruction allowlist and position, name/team_name refused, recipient cross-check, unreadable handback) after the independent review of bb96611 returned CHANGES_REQUESTED; 3b9f2e6 (delegation note: no name/team_name); f877b2c (docs + tests after the second review returned CHANGES_REQUESTED on 3b9f2e6 for documentation/evidence/label errors; adapter logic unchanged)
REGRESSION: RED 10 N-34 tests, 9 FAIL (v3.4.1 adapter); RED review fixes 15 N-34 tests, 7 FAIL (bb96611 adapter); GREEN review-ledger.test.mjs (history) 59 tests, 52 PASS, 5 FAIL = git "Permission denied" host flake (all 5 pass when repeated alone), 2 OS skips; the 15 N-34 tests were 15 PASS at that time, there are now 16
FINAL RUNS at f877b2c (16 N-34 tests): review-ledger.test.mjs 59 tests, 49 PASS, 8 FAIL, 2 OS skips; the 8 FAIL = git "Permission denied" (exit 128) in the consumer() fixture before product code, 8/8 PASS re-run alone. Local sequential replay of the ci.yml validators job (review-ledger excluded): 50 steps, 45 exit 0, 5 exit 1; 1016 tests PASS, 6 FAIL = the same git flake in files N-34 does not touch (git, reconcile, consumer-launcher, audit fixtures, lifecycle), 6/6 PASS re-run alone; all validators exit 0 (parity, contracts, core, compat matrix, status integrity, m52, ci-tests-listed, entrypoints, constitution-extension, hitl, doc-drift, audit cli check, evals l1, git diff --check)
FLAKE: bare git init/add loop (no product code) on the idle host: 0 failures in 100 runs; appears in full suite runs, not in the minimal isolated loop; cause not demonstrated; remote CI is the confirmation of a clean full run
E2E (Claude Code 2.1.312; 2.1.311 NOT covered): approve -> INDEPENDENT_REVIEW PASS / FINAL APPROVED; adverse -> INDEPENDENT_REVIEW CHANGES_REQUESTED / FINAL CHANGES_REQUESTED
RECEIPT RE-VERIFICATION (v3.4.1 adapter -> fixed): gi incident 5 errors/null -> 0 errors/CHANGES_REQUESTED; approve 5/null -> 0/APPROVED; adverse 2/no evidence -> 0/CHANGES_REQUESTED; re-verified at f877b2c (adapter blob 38a911e8181d1a8536c6327a10bda7c032f5dd6d): gi incident 0 errors CHANGES_REQUESTED, approve 0 errors APPROVED, adverse both SubagentStop receipts 0 errors CHANGES_REQUESTED, readReviewerRun 1 answer / 0 follow-ups each
OUT OF SCOPE, UNCHANGED: consumer VALIDATION FAIL / productSetupCommand; pilot Ubuntu Docker exit 125 (deferred); S-14..S-17 (deferred); OpenCode not verified (local CLI 2.2.0 install broken)
INDEPENDENT REVIEWS: 1 on bb96611 CHANGES_REQUESTED (MEDIUM 1-3, LOW 4); 2 on 3b9f2e6 CHANGES_REQUESTED (documentation/evidence/label errors); 3 on f877b2c APPROVED (reviewer subagent, isolated context, read-only tools): 0 BLOCKER/HIGH/MEDIUM, LOW-1 stale counts, LOW-2 incomplete history, INFO-1..5
DOCS COMMIT (docs(v3.4.2): record final validation and third review): applies LOW-1/LOW-2 and the INFO-1 wording; the APPROVED is bound to f877b2c, so its DELTA REVIEW is PENDING
PENDING: delta review of the docs commit / PLATFORM AUDIT of the final SHA / REMOTE CI / PR to develop / promotion / tag and release
v3.4.2 TAG / RELEASE: NOT CREATED / NOT PUBLISHED
```

Current release at that time: v3.4.1, below.

# AI-NATIVE v3.4.1 — Released and Verified

v3.4.1 is published and verified against the public release. Facts and
evidence: `governance/versioning/V3.4.1-POST-RELEASE-VERIFICATION.md`.

```text
ROADMAP: AI-NATIVE V3 / v3.4.1 (PATCH, structural YAML fix only; "reviewer not found" not claimed as resolved)
STATE: V3.4.1_RELEASED_AND_VERIFIED
FINAL CANDIDATE / RELEASE SHA: 635a60c15e77a543a31e5e1af5ef73c052932b04 (merge of #158, develop -> main)
AUDITED SHA: 247b28414b8341425c33ba748f49af65009655cf (differs only in .audit/**)
PLATFORM AUDIT: independent, 89.50/100; 0 BLOCKER, 0 CRITICAL, 0 MAJOR, 18 MINOR; below 90 by 0.50, accepted as an exception by human decision under the release-gate tolerance
RELEASE-GATE (build job): PASS_WITH_WARNINGS (27 STALE historical reports + score within tolerance)
v3.4.1 TAG: annotated, on 635a60c, created by the human
v3.4.1 RELEASE: published, immutable; digest sha256:ab7617d241a4ec0e5418d30baba31f6d36e4fe8e984683bbc2541e908bde95e7
RELEASE WORKFLOW: run 40621778120; build PASS, publish PASS, verify PASS
verify-release: PASS (33 checks, public assets)
INIT (empty repository) / UPGRADE (v3.4.0 -> v3.4.1): READY / READY (disposable consumers)
CLI_VERSION: v3.4.1; VERSION: 3.0.0-dev (unchanged)
PENDING CANDIDATE / PROMOTION: none
NON-BLOCKING FOLLOW-UPS (no scope opened): N-34 (NOT_PROVEN on Claude Code 2.1.311), pilot offline Ubuntu red on 635a60c (Docker exit 125, 3 attempts, cause not demonstrated), deferred review LOW S-12..S-16, S-17, S-18; listed in the verification file
```

Previous snapshot (candidate preparation), kept as history:

```text
ROADMAP: AI-NATIVE V3 / v3.4.1 (PATCH)
STATE: V3.4.1_CANDIDATE
BASE: develop 036e6f8b2045d51ec43aad91fdbb599668588ca0 (merge of #153; origin/main 15f35ff is an ancestor; tree = previous develop d8192c6, not main: S-18)
CONTENT: fix(adapters) f3955c9 (Claude agent YAML description escaped; RED 8 failed / GREEN 15/15) + U+FFFE/U+FFFF follow-up from the independent review of 4ad607a; CLI_VERSION v3.4.1 7e8fea1
INDEPENDENT CODE REVIEW (4ad607a): APPROVED, 5 LOW (1-4 addressed, 5 informational); not an attested SDD review receipt
CONSUMER DELTA: 2 of 229 bundle files; 3 projections (.claude/agents/*.md description line)
E2E (Claude Code 2.1.311): reviewer registered and invoked in v3.4.0 and the candidate; "Agent type 'reviewer' not found" NOT REPRODUCED
SEPARATE DEFECT (no scope opened): attested independent review NOT_PROVEN in both versions (SubagentHandback)
PUBLICATION: subject to a human decision (structural YAML fix only)
PLATFORM AUDIT: then pending (S-13); later AUDIT-PLATFORM-247b284.md, commit 3e0f83d
v3.4.1 TAG / RELEASE: then NOT CREATED / NOT PUBLISHED
PR #157 release/v3.4.1 -> develop: MERGED by the human; develop = 77cc87b (merge commit)
PR #158 develop -> main: MERGED by the human; main = 635a60c (merge commit)
```

Previous release: v3.4.0, below.

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
