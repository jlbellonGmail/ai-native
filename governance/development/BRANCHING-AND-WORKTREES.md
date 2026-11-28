# Branches and worktrees (AI-NATIVE factory repository)

Status: **normative** for this repository. Approved by the human on 2026-11-28. The compact table lives in the root
`AGENTS.md`, section "Branches and Worktrees". This document holds the rules behind it, what GitHub enforces and what
it does not.

## Scope

* **In scope:** this repository (`jlbellonGmail/ai-native`), and all work in it, by humans and agents.
* **Not Foundation.** The policy is not copied to `foundation/`. That a rule is central to the team is no reason to
  put it there.
* **Not the Template.** The policy is not copied to `template/` either. Checked on 2026-11-28:
  * no file under `template/templates/project/` or `template/config/` defines a branching model;
  * consumer repositories keep their own (the `guard-develop-branch.yml` migration fixture comes from one of them).
  * Making this the default for generated projects would widen the Template contract. That change needs its own
    proposal and approval.

## Policy

| Branch | From | PR target | Worktree and purpose |
|---|---|---|---|
| `main` | Stable branch | Only `release/*` promotions and `hotfix/*` fixes, through a PR | No development and no direct commits; receives approved releases and hotfixes. |
| `develop` | Created once from `main` | Receives `feature/*`, `bugfix/*` and syncs from `main` | Integration branch; PR and CI required; no direct pushes. |
| `feature/*` | `develop` | `develop` | Dedicated worktree per feature; remove it after the merge, only if it is clean. |
| `bugfix/*` | `develop` | `develop` | Dedicated worktree for a defect found during development. |
| `release/*` | Approved `develop` SHA | `main` | Dedicated worktree to stabilize, audit and promote a version. |
| `hotfix/*` | `main` | `main` first; then sync `main` into `develop` | Dedicated worktree for an urgent production fix. |

## Rules

1. **Names.**
   * Use `<type>/<short-kebab-description>`, with `type` from the table.
   * Every task is one feature, so documentation, governance and maintenance work uses `feature/*`.
   * Existing branches with other prefixes (`fix/`, `chore/`, `docs/`, `proposal/`) are history. They are not renamed.
2. **One branch, one worktree.**
   * Each `feature/*`, `bugfix/*`, `release/*` and `hotfix/*` branch is worked in its own worktree, a sibling
     directory of the main checkout.
   * The main checkout is not used for development on those branches.
3. **Cleanup.**
   * Remove a worktree (`git worktree remove <dir>`) only after its PR is merged or closed, `git status --short` is
     empty, and `git log @{u}..` shows no unpushed commits.
   * Deleting a remote branch needs explicit human approval (`.agents/skills/delivery-governance/SKILL.md`).
4. **Releases.**
   * A `release/*` branch is cut from a `develop` SHA the human approved, normally the merge commit of the integrated
     feature.
   * On it, only release preparation is allowed: version bump, release record, stabilization fixes and the audit
     report under `.audit/**`.
   * A stabilization fix also goes to `develop`, through a `bugfix/*` PR or by syncing `main` into `develop` after
     the release.
5. **Re-cut releases.**
   * A published release branch is never reset or force-pushed. A replacement gets a new name with a suffix
     (`release/vX.Y.Z-rN`), and the previous one is kept.
6. **Hotfixes.**
   * `hotfix/*` is cut from `main` and its PR targets `main`.
   * After the merge, a PR brings `main` into `develop`, with `main` itself or a sync branch cut from `main` as head.
   * A hotfix does not replace testing a change before it reaches `main`, for example a canary.
7. **Review-only proposals.**
   * A spec amendment that needs a human decision before implementation may be a draft PR whose base is the
     `feature/*` branch it amends.
   * It is reviewed against its exact head SHA and closed without merge. The decision is then implemented on the
     feature branch.
8. **Roles.**
   * The agent creates and updates its own work branches and opens or updates PRs.
   * Merging, approving reviews and Environment deployments, and changing rulesets, branch protections, Environments
     or secrets are human actions.
   * See `governance/security/HITL-MERGE-POLICY.md` and `governance/security/AGENT-GITHUB-IDENTITY.md`.

## What GitHub enforces (read back on 2026-11-28)

| Control | Enforced by | State |
|---|---|---|
| `main`: PR required, no deletion, no force push, strict required checks (`validators` ×2, `pin-check`, `pr-gate`, `ai-native/trust-gate`, `ai-native/merge-gate`), no bypass actors | Ruleset `ai-native-main` (24405506), `governance/rulesets/main.json` | Active. Unchanged by this policy |
| `develop`: PR required, no deletion, no force push, required checks `validators (ubuntu-latest)`, `validators (windows-latest)`, `pin-check`, `pr-gate` (GitHub Actions, integration 15368), no bypass actors, 0 approvals so the human can merge after the checks | Ruleset `ai-native-develop` (28294413), `governance/rulesets/develop.json` | Active. Created 2026-11-28; `rules/branches/develop` returns these rules and `current_user_can_bypass` is `never` |
| Branch names, one worktree per branch, `release/*` cut from approved `develop`, the `hotfix/*` sync to `develop`, `feature/*` targeting `develop` | Not enforced by GitHub | Process rules. Checked in review and audit |
| Who may push `v*` tags | Not enforced (no tag ruleset) | A `v*` tag push runs `release.yml`, which publishes. Tags are a human action. A tag ruleset is a separate human decision |
| Who may merge | Repository permissions | Today the only identity is the human owner. Machine separation: `governance/security/AGENT-GITHUB-IDENTITY.md` |

How the `develop` checks were chosen:

* They are the four non-App checks of `main`.
* All four run on `pull_request` to `develop` with no `paths` filter (`ci.yml`, `supply-chain.yml`, `pr-gate.yml`).
* Checks that exist only on some PR heads are not required, because a required check that never reports blocks
  every PR. One example is `acceptance-closure`, which is not on `develop` before v4.1.0.
* App checks (`ai-native/*`) are not required either: their workflows run only for PRs to `main`.

Verification:

* `gh api repos/jlbellonGmail/ai-native/rules/branches/develop`
* `gh api repos/jlbellonGmail/ai-native/rulesets/28294413`
