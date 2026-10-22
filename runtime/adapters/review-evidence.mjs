// Runtime adapters for the independent-review capability: which runtime can attest
// a review (an attester turns what the runtime recorded into a ReviewEvidence for
// runtime/circuit/independent-review.mjs) and the delegation note each tool's
// projection carries. A runtime without an attester here can never produce an
// independent review, whatever core/agents.json or the session says.
import { claudeReviewAttester, CLAUDE_REVIEW_DELEGATION } from "./claude-review.mjs";

export const REVIEW_ATTESTERS = Object.freeze({ claude: claudeReviewAttester });

const LABELS = { claude: "Claude Code", codex: "Codex", opencode: "OpenCode" };
const NOTES = { claude: CLAUDE_REVIEW_DELEGATION };

/** The fail-closed note of a runtime that cannot run and attest an isolated Reviewer. */
export const unavailableDelegation = (tool) =>
  `Runtime capability (${LABELS[tool] ?? tool}). The platform has no verified way for this runtime to run the Reviewer in a context isolated from this session and attest that run. Independent review is UNAVAILABLE: use the fallback and record the self-review with \`--kind self\`; a review recorded as independent is refused without runtime evidence.`;

/** The delegation note a tool's projection carries: its own only when core verified it AND an attester exists. */
export function reviewDelegationNote(runtimes, tool) {
  const verified = runtimes?.[tool]?.independentReview === "verified" && Object.values(runtimes[tool].executions ?? {}).includes("verified");
  return verified && REVIEW_ATTESTERS[tool] && NOTES[tool] ? NOTES[tool] : unavailableDelegation(tool);
}
