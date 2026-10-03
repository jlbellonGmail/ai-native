// M4.3 (PAR-GOVERNANCE-MODES, P45 REVIEWER_INDEPENDENCE_ENFORCEMENT).
// profile.governance.mode decides how many approvals a PR needs before the
// human merge:
//   SingleMaintainer : 0 approvals; the human merge IS the control.
//   MultiMaintainer  : >= 1 approval from an independent reviewer.
// Independence is enforced in every mode for any approval that is counted:
// an approval from the PR author, from a commit author, or from a bot/worker
// identity never counts, and only the LATEST review of each user, bound to
// the current head SHA, counts.

export const MODES = Object.freeze({ SingleMaintainer: 0, MultiMaintainer: 1 });

export function requiredApprovals(mode) {
  if (!(mode in MODES)) throw new Error(`unknown governance mode '${mode}'`);
  return MODES[mode];
}

export function isBotLogin(login, botLogins = []) {
  return /\[bot\]$/i.test(login) || botLogins.includes(login);
}

/**
 * reviews: [{ user, state, commitId, submittedAt }] in API order.
 * Returns { approvals: [logins], rejected: [{user, reason}], required, ok }.
 */
export function evaluateApprovals({ mode, reviews, prAuthor, commitAuthors = [], headSha, botLogins = [] }) {
  const latest = new Map();
  for (const r of reviews) {
    if (r.state === "COMMENTED" || r.state === "PENDING") continue;
    latest.set(r.user, r);
  }
  const approvals = [];
  const rejected = [];
  for (const [user, r] of latest) {
    if (r.state !== "APPROVED") continue;
    if (user === prAuthor) rejected.push({ user, reason: "approver is the PR author" });
    else if (commitAuthors.includes(user)) rejected.push({ user, reason: "approver authored commits in the PR" });
    else if (isBotLogin(user, botLogins)) rejected.push({ user, reason: "approver is a bot/worker identity" });
    else if (r.commitId !== headSha) rejected.push({ user, reason: "approval is for a stale head SHA" });
    else approvals.push(user);
  }
  const changesRequested = [...latest.values()].some((r) => r.state === "CHANGES_REQUESTED");
  const required = requiredApprovals(mode);
  return { approvals, rejected, required, changesRequested, ok: approvals.length >= required && !changesRequested };
}
