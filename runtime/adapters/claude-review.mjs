// Claude Code projection of the independent-review capability. Everything that is
// specific to Claude Code lives here, never in core/ or runtime/circuit:
//   * the delegation note projected into the Claude commands (how to start the
//     reviewer: the Agent tool, subagent_type, ToolSearch, never fork);
//   * the SubagentStop hook projected into .claude/settings.json, which hands the
//     runtime's own record of a finished `reviewer` subagent to
//     `sdd review receipt claude` (exec form: no shell, placeholder substituted by
//     Claude Code; evaluation/compat/findings.md #1: always $CLAUDE_PROJECT_DIR);
//   * the verifier that turns such a receipt into a ReviewEvidence for the core
//     (runtime/circuit/independent-review.mjs), checked against Claude Code's own
//     transcript store, never against what the session declared.
// Hook input fields are the documented SubagentStop schema (session_id,
// transcript_path, hook_event_name, agent_id, agent_type, agent_transcript_path,
// last_assistant_message); transcript files are read only for API-shaped content
// (message.role, message.id, text, tool_use name/input), never for undocumented
// metadata. The hook input only says where to look: the review a run answers is
// the one its delegation carried, and its verdict, nonce and revision are the
// answer the transcript recorded, never the hook's copy of it.
// Transcript policy of a review run: the delegation prompt, then only the
// reviewer's own tool calls and their results, then exactly one final answer.
// Since Claude Code 2.1.271 a subagent delivers its answer with a SubagentHandback
// tool call (the message is the answer, not a text-only turn) after a harness
// instruction in a user turn of its own; both are the runtime's delivery channel,
// neither a follow-up nor a tool of the reviewer. The instructions are an exact
// allowlist of texts and positions; unknown wording fails closed (NOT_PROVEN).
// A message sent to the reviewer after its delegation
// (SendMessage by `to` or `recipient`, a resume, a second prompt, also read from the
// session's own record) or a second answer makes the run unable to approve, and any
// adverse answer the run gave stays its verdict: asking again cannot replace it.
// Not a cryptographic proof: whoever can write Claude Code's transcript store or
// the project's .claude/ configuration can forge it (threat model:
// knowledge/sdd/methodology/review.md).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { ADVERSE_VERDICTS } from "../circuit/independent-review.mjs";

export const CLAUDE_REVIEWER_AGENT = "reviewer";
export const CLAUDE_EXECUTION = "delegated-fresh-context";
// the Agent tool was named Task before Claude Code 2.1
const DELEGATION_TOOLS = ["Agent", "Task"];
// how a subagent hands its report to its caller (Claude Code 2.1.271+): the runtime's delivery channel, not a tool of the reviewer
const HANDBACK_TOOL = "SubagentHandback";
const REQUIRED_HOOK_FIELDS = ["session_id", "transcript_path", "agent_id", "agent_type", "agent_transcript_path"];
// kept verbatim when present, never trusted: the answer is read from the transcript
const OPTIONAL_HOOK_FIELDS = ["last_assistant_message"];

export const CLAUDE_REVIEW_DELEGATION = [
  "Runtime capability (Claude Code). The user running `/sdd-implement-all <NNN-slug>` (or `/sdd-validate <NNN-slug>`) is the user's explicit request that you, the Coordinator, invoke the `reviewer` agent whenever this workflow needs a review: no further confirmation is needed for that delegation.",
  "Delegation is the `Agent` tool with `subagent_type: \"reviewer\"`, which starts the Reviewer in a fresh context; never `subagent_type: \"fork\"` nor a general-purpose agent for a review (a fork inherits this conversation). Pass no `model` and no `isolation`: the Reviewer runs on its projected model, in this working tree; a delegation that overrides either cannot approve. Some Claude Code versions list `Agent` neither among the loaded tools nor among the deferred ones: load it with ToolSearch `select:Agent` before deciding that delegation is unavailable.",
  "Independent review is AVAILABLE only when that tool loads, `reviewer` is among its agent types and this session is not itself a subagent; otherwise it is UNAVAILABLE: use the fallback and record the self-review with `--kind self`.",
  "The delegation prompt is the DELEGATION_PROMPT line that `sdd review begin` printed, copied verbatim with nothing added or removed: it gives the Reviewer the PACKET path and the REVIEW_NONCE. Any other prompt (a summary, a request to confirm, a verdict) makes the review not independent. When the `reviewer` stops, the project's `.claude/settings.json` (projected by ai-native) runs a SubagentStop hook that stores Claude Code's own record of that run. `sdd review record --kind independent` accepts the review only with that receipt, verified against Claude Code's transcripts (the delegation was exactly that prompt, the agent was `reviewer` in a fresh context, it read the PACKET and only read), and takes the verdict and the revision from the Reviewer's answer as Claude Code recorded it, never from you. Without the receipt the review is not independent; never write one yourself.",
  "A review run is one prompt and one answer: never send the Reviewer anything after the delegation (no SendMessage, no resume, no clarification). A continued run can never approve, and any adverse answer it gave stays its verdict. A new question is a new review (`sdd review begin`), and an adverse run of the same revision still stands.",
  "A delegated agent may run in the background: wait for its completion notice before recording, and never predict its verdict.",
].join(" ");

/** .claude/settings.json: the SubagentStop hook that captures the receipt of a finished reviewer. */
export function buildClaudeSettings() {
  const settings = {
    hooks: {
      SubagentStop: [
        {
          matcher: CLAUDE_REVIEWER_AGENT,
          hooks: [{ type: "command", command: "node", args: ["${CLAUDE_PROJECT_DIR}/.ai-native/ai-native.mjs", "sdd", "review", "receipt", "claude"], timeout: 60 }],
        },
      ],
    },
  };
  return `${JSON.stringify(settings, null, 2)}\n`;
}

/** Claude Code's transcript store: $CLAUDE_CONFIG_DIR/projects, or ~/.claude/projects. */
export function claudeStoreRoot(env = process.env) {
  return join(env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude"), "projects");
}

/** The Reviewer's answer: VERDICT first, then the REVIEW_NONCE and REVISION it judged (core/roles/reviewer.md). */
export function parseReviewerAnswer(text) {
  const lines = String(text ?? "").split(/\r?\n/).map((l) => l.replace(/[*`#>]/g, "").trim()).filter(Boolean);
  const verdict = /^VERDICT:\s*(APPROVED|CHANGES_REQUESTED|BLOCKED|NEEDS_HUMAN_DECISION)\b/.exec(lines[0] ?? "")?.[1] ?? null;
  const field = (name) => lines.slice(0, 12).map((l) => new RegExp(`^${name}:\\s*(\\S+)`).exec(l)?.[1]).find(Boolean) ?? null;
  return { verdict, nonce: field("REVIEW_NONCE"), revision: field("REVISION") };
}

/** The verbatim fields of a SubagentStop hook input that a receipt keeps; throws when it is not a reviewer stop. */
export function parseClaudeHookInput(raw) {
  let input;
  try {
    input = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    throw new Error("hook input is not JSON");
  }
  if (!input || typeof input !== "object") throw new Error("hook input is not an object");
  if (input.hook_event_name !== "SubagentStop") throw new Error(`not a SubagentStop event (${input.hook_event_name ?? "none"})`);
  for (const field of REQUIRED_HOOK_FIELDS) if (typeof input[field] !== "string" || !input[field]) throw new Error(`hook input lacks '${field}'`);
  if (input.agent_type !== CLAUDE_REVIEWER_AGENT) throw new Error(`agent_type '${input.agent_type}' is not the ${CLAUDE_REVIEWER_AGENT}`);
  // the review this run answers is the one its delegation carried; an answer without the nonce is still filed under it,
  // so that an adverse run is kept whatever the reviewer forgot to copy
  const nonce = delegatedNonce(input.agent_transcript_path) ?? parseReviewerAnswer(input.last_assistant_message).nonce;
  if (!nonce) throw new Error("neither the reviewer's delegation nor its answer carries a REVIEW_NONCE");
  const kept = OPTIONAL_HOOK_FIELDS.filter((f) => typeof input[f] === "string");
  const hook = Object.fromEntries(["hook_event_name", ...REQUIRED_HOOK_FIELDS, ...kept].map((f) => [f, input[f]]));
  // one receipt per run: Claude Code names the same run `<id>` and `agent-<id>`
  return { nonce, runId: runIdOf(input.agent_id), hook };
}

const sha256 = (data) => createHash("sha256").update(data).digest("hex");
const expand = (p) => resolve(p.startsWith("~") ? join(homedir(), p.slice(1)) : p);
const norm = (p) => (process.platform === "win32" ? p.toLowerCase() : p);
const samePath = (a, b) => norm(resolve(a)).replaceAll("\\", "/") === norm(resolve(b)).replaceAll("\\", "/");
const inside = (root, file) => norm(file).startsWith(norm(root.endsWith(sep) ? root : root + sep));

function readJsonl(file) {
  return readFileSync(file, "utf8").split(/\r?\n/).filter((l) => l.trim()).flatMap((l) => {
    try {
      return [JSON.parse(l)];
    } catch {
      return [];
    }
  });
}

const textOf = (content) => (typeof content === "string" ? content : Array.isArray(content) ? content.map((b) => (typeof b === "string" ? b : b?.type === "text" ? b.text ?? "" : "")).join("\n") : "");

const blocksOf = (records, type) => {
  const found = [];
  for (const record of records) {
    const content = record?.message?.content;
    if (Array.isArray(content)) for (const block of content) if (block?.type === type) found.push(block);
  }
  return found;
};
const toolUses = (records) => blocksOf(records, "tool_use");
const toolResults = (records) => blocksOf(records, "tool_result");

const strings = (value, out = []) => {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object") for (const v of Object.values(value)) strings(v, out);
  return out;
};

const runIdOf = (agentId) => agentId.replace(/^agent-/, "");
// the conversation of a transcript: its user and assistant turns (request blobs, attachments and hook records are not turns)
const turnsOf = (records) => records.filter((r) => (r?.type === "user" || r?.type === "assistant") && r.message?.role === r.type);
const firstUserText = (records) => textOf(turnsOf(records).find((r) => r.message.role === "user")?.message?.content).trim();
// a user turn of a running agent is either the results of its own tool calls, the harness telling it how to deliver its report, or a message sent to it
const isToolResults = (content) => Array.isArray(content) && content.length > 0 && content.every((b) => b?.type === "tool_result");
// the harness's handback instructions are exact texts (Claude Code 2.1.305 to 2.1.312), compared after CRLF -> LF and trim:
// the reminder is the turn right after the prompt, the enforce line comes right after a plain-text answer; any other text,
// repeat or position (the coordinator's wording, added instructions, a reminder later on) is a message sent to the agent
const HANDBACK_REMINDER = `Your final report is delivered through ${HANDBACK_TOOL}: when your work is complete, call ${HANDBACK_TOOL}({message: <your full report>}). The call ends your run, so make it your last step. Only a ${HANDBACK_TOOL} call reaches your caller as your result; plain text you write at the end is not delivered.`;
const HANDBACK_REMINDERS = [HANDBACK_REMINDER, `${HANDBACK_REMINDER} Do not also send the report with SendMessage: your caller would get it twice.`].map((body) => `<system-reminder>\n${body}\n</system-reminder>`);
const HANDBACK_ENFORCE = `[handback-send-enforce] Your report has not been delivered. Call ${HANDBACK_TOOL}({message: <your full report>}) now; the call ends your run.`;
const exactText = (content) => textOf(content).replace(/\r\n/g, "\n").trim();
/** The agent a delegation started, as the harness names it in its own result line `agentId: <id>` (the last one: the harness writes it after the report). */
const agentIdOf = (resultText) => [...String(resultText).matchAll(/^agentId: ([A-Za-z0-9_-]+)(?: \(.*)?$/gm)].at(-1)?.[1] ?? null;

/** The REVIEW_NONCE of the delegation that started a subagent (its first message), or null when it cannot be read. */
function delegatedNonce(agentTranscriptPath) {
  try {
    return /REVIEW_NONCE:\s*([0-9a-f]{24})\b/.exec(firstUserText(readJsonl(expand(agentTranscriptPath))))?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * The reviewer's run under the transcript policy: one delegation prompt, then only its own tool calls and their
 * results, then one final answer. `answers` are the texts of every final answer it gave (an assistant message
 * with no tool call, or the `message` of each SubagentHandback call, plus the message's own text when that states
 * another verdict; one API message may span several records); `followUps` counts every message sent to it after
 * the delegation (SendMessage, a resume, a second prompt), which is what lets a session ask again. The harness's
 * own handback instructions (HANDBACK_REMINDERS right after the prompt, HANDBACK_ENFORCE right after a plain-text
 * answer, nothing else) are not messages sent to it. A plain-text answer followed by that enforce turn (only it and
 * tool results in between) was never delivered: the next handback that restates it (same VERDICT, REVIEW_NONCE and
 * REVISION, any body) is that one answer, otherwise both count. A handback whose `message` is not a non-empty string
 * is an unreadable answer (""): it counts, never approves and no earlier answer stands in for it.
 */
export function readReviewerRun(records) {
  const turns = turnsOf(records);
  const messages = [];
  let followUps = 0;
  for (const turn of turns.slice(1)) {
    if (turn.message.role === "user") {
      const results = isToolResults(turn.message.content);
      const text = exactText(turn.message.content);
      const last = messages.at(-1);
      const reminder = !results && messages.length === 0 && HANDBACK_REMINDERS.includes(text);
      const enforce = !results && text === HANDBACK_ENFORCE && Boolean(last?.blocks) && !last.blocks.some((b) => b?.type === "tool_use") && Boolean(textOf(last.blocks).trim());
      if (!results && !reminder && !enforce) followUps += 1;
      messages.push(results ? null : { enforce });
      continue;
    }
    const last = messages.at(-1);
    const id = turn.message.id;
    const blocks = Array.isArray(turn.message.content) ? turn.message.content : [{ type: "text", text: textOf(turn.message.content) }];
    if (last && id && last.id === id) last.blocks.push(...blocks);
    else messages.push({ id, blocks: [...blocks] });
  }
  const answers = [];
  let undelivered = null; // the last plain-text answer, until a handback follows it: { index, told } (told: by the enforce turn)
  for (const message of messages.filter((m) => m !== null)) {
    if (!message.blocks) {
      undelivered = message.enforce && undelivered ? { ...undelivered, told: true } : null;
      continue;
    }
    const text = textOf(message.blocks).trim();
    const uses = message.blocks.filter((b) => b?.type === "tool_use");
    if (!uses.length) {
      undelivered = text ? { index: answers.push(text) - 1, told: false } : null;
      continue;
    }
    const handed = uses.filter((u) => u.name === HANDBACK_TOOL).map((u) => (typeof u.input?.message === "string" ? u.input.message.trim() : ""));
    if (undelivered?.told && handed.length) {
      const [was, now] = [parseReviewerAnswer(answers[undelivered.index]), parseReviewerAnswer(handed[0])];
      if (was.verdict && was.nonce && was.revision && now.verdict === was.verdict && now.nonce === was.nonce && now.revision === was.revision) answers.splice(undelivered.index, 1);
    }
    if (handed.length) undelivered = null;
    answers.push(...handed);
    const verdict = parseReviewerAnswer(text).verdict;
    if (verdict && handed.some((h) => parseReviewerAnswer(h).verdict !== verdict)) answers.push(text);
  }
  return { prompt: firstUserText(records), answers, followUps };
}

/** Verdict of a whole run: any adverse answer it gave is its verdict (most severe first), an unreadable one is null. */
function runVerdict(answers) {
  const verdicts = answers.map((a) => parseReviewerAnswer(a).verdict);
  const adverse = ADVERSE_VERDICTS.find((v) => verdicts.includes(v));
  if (adverse) return adverse;
  return verdicts.length && verdicts.every((v) => v === "APPROVED") ? "APPROVED" : null;
}

/**
 * ReviewEvidence for a receipt, or the reasons it proves nothing. Every check reads the runtime's own store:
 * the receipt only says where to look. `nonce`, `packet` and `prompt` are the issued review's (`sdd review begin`);
 * `allowedTools` are the reviewer's projected tools (read-only) and `model` its projected model. `observed` is set
 * once the store proves a real reviewer run of this review in a fresh context: its verdict as recorded (null when
 * unreadable), even when that run cannot approve, so that an adverse run is never lost.
 */
export function verifyClaudeReceipt(hook, { nonce, packet = null, prompt = null, storeRoot = claudeStoreRoot(), allowedTools = ["Read", "Grep", "Glob"], model = null } = {}) {
  const errors = [];
  try {
    parseClaudeHookInput(hook);
  } catch (error) {
    return { errors: [`receipt: ${error.message}`], evidence: null, observed: null };
  }
  if (!nonce) return { errors: ["no issued review to verify the receipt against"], evidence: null, observed: null };

  // the receipt points into Claude Code's store, with the documented layout <session>.jsonl + <session>/subagents/agent-<id>.jsonl
  const parentPath = expand(hook.transcript_path);
  const agentPath = expand(hook.agent_transcript_path);
  const agentFile = `agent-${runIdOf(hook.agent_id)}.jsonl`;
  if (basename(parentPath, ".jsonl") !== hook.session_id) errors.push("transcript_path is not the transcript of session_id");
  if (norm(dirname(agentPath)) !== norm(join(dirname(parentPath), hook.session_id, "subagents")) || basename(agentPath) !== agentFile) errors.push("agent_transcript_path is not that session's transcript of agent_id");
  if (!existsSync(parentPath) || !existsSync(agentPath)) {
    errors.push("the runtime transcripts of this review do not exist (deleted, or never written by Claude Code)");
    return { errors, evidence: null, observed: null };
  }
  const store = existsSync(storeRoot) ? realpathSync(storeRoot) : resolve(storeRoot);
  for (const file of [parentPath, agentPath]) if (!inside(store, realpathSync(file))) errors.push(`${basename(file)} is not in Claude Code's transcript store`);
  if (errors.length) return { errors, evidence: null, observed: null };

  const agentRecords = readJsonl(agentPath);
  const parentRecords = readJsonl(parentPath);
  // the parent session delegated THIS review to the reviewer agent type, and that delegation started the subagent:
  // fresh context, its first message is the delegation prompt, not the parent's conversation (a fork's would be)
  const firstText = firstUserText(agentRecords);
  const delegations = toolUses(parentRecords).filter((t) => DELEGATION_TOOLS.includes(t.name) && t.input?.subagent_type === CLAUDE_REVIEWER_AGENT && String(t.input?.prompt ?? "").includes(nonce));
  // the reviewer delegation that started THIS run: its own tool_result names this agent_id (the hook's agent_type is
  // never trusted: another agent started with the same prompt is not the reviewer)
  const resultOf = (use) => strings(toolResults(parentRecords).filter((r) => r.tool_use_id === use.id)).join("\n");
  const ofThisRun = delegations.filter((t) => agentIdOf(resultOf(t)) === runIdOf(hook.agent_id));
  const delegation = ofThisRun.find((t) => String(t.input.prompt).trim() === firstText);
  if (!delegations.length) errors.push(`session ${hook.session_id} has no delegation to the '${CLAUDE_REVIEWER_AGENT}' agent carrying this REVIEW_NONCE`);
  else if (!ofThisRun.length) errors.push(`no delegation to the '${CLAUDE_REVIEWER_AGENT}' agent returned this agent_id: this run is not that delegation's`);
  else if (!delegation) errors.push("the subagent did not start from the delegation prompt (not a fresh context)");
  if (errors.length) return { errors, evidence: null, observed: null };

  // a real reviewer run of this review: what it answered is what Claude Code recorded, never the hook's copy.
  // The run is immutable once it answered: every answer it gave counts (an adverse one is the run's verdict),
  // and a run that was sent anything after its delegation cannot approve
  const run = readReviewerRun(agentRecords);
  const observed = { verdict: runVerdict(run.answers) };
  const answer = parseReviewerAnswer(run.answers[0] ?? "");
  const runId = runIdOf(hook.agent_id);
  const sentToRun = (id) => typeof id === "string" && runIdOf(id) === runId;
  const sessionSent = toolUses(parentRecords).filter((t) => (t.name === "SendMessage" && (sentToRun(t.input?.to) || sentToRun(t.input?.recipient))) || (DELEGATION_TOOLS.includes(t.name) && sentToRun(t.input?.resume))).length;
  if (run.followUps) errors.push(`the reviewer was sent ${run.followUps} message(s) after its delegation (SendMessage, resume or a second prompt): a review run is one prompt and one answer, a continued run cannot approve`);
  if (sessionSent) errors.push(`the session sent ${sessionSent} message(s) to the reviewer after its delegation (SendMessage or resume): a review run is one prompt and one answer, a continued run cannot approve`);
  if (run.answers.length > 1) errors.push(`the reviewer gave ${run.answers.length} final answers: a review run has exactly one`);
  // the author may ask for a review, never shape it: the delegation is exactly the prompt the platform issued
  if (!prompt) errors.push("the issued review has no delegation prompt: begin a new review");
  else if (String(delegation.input.prompt).trim() !== prompt.trim()) errors.push("the delegation prompt is not the one `sdd review begin` issued (the author may ask for a review, never shape it)");
  // nor choose who reviews or what it sees: the projected reviewer's model (without `model` the agent runs its own,
  // the projected one) in this working tree (any `isolation`, a worktree, would read another tree than the packet's)
  if (!model) errors.push("the reviewer has no projected model to verify the delegation against");
  else if (Object.hasOwn(delegation.input, "model") && delegation.input.model !== model) errors.push(`the delegation overrides the reviewer's projected model '${model}' with ${JSON.stringify(delegation.input.model)}`);
  if (Object.hasOwn(delegation.input, "isolation")) errors.push(`the delegation sets isolation ${JSON.stringify(delegation.input.isolation)}: the reviewer runs in a fresh context on this working tree, never in another`);
  // nor make it addressable by a name: a named or team agent receives messages the parent's record does not tie to its agent_id
  for (const key of ["name", "team_name"]) if (Object.hasOwn(delegation.input, key)) errors.push(`the delegation sets ${key} ${JSON.stringify(delegation.input[key])}: a review run is addressed only by its agent_id, a named or team agent can be messaged by that name`);
  // read-only: the reviewer used only its projected tools (SubagentHandback is the runtime's delivery of its answer)
  const used = [...new Set(toolUses(agentRecords).map((t) => t.name))].filter((name) => name !== HANDBACK_TOOL && !allowedTools.includes(name));
  if (used.length) errors.push(`the reviewer used tools outside its read-only set: ${used.join(", ")}`);
  // it judged the evidence the platform generated: the packet of this review was read by the reviewer itself
  if (packet && !toolUses(agentRecords).some((t) => t.name === "Read" && typeof t.input?.file_path === "string" && samePath(t.input.file_path, packet))) errors.push("the reviewer never read the review packet");
  if (!answer.verdict) errors.push("the reviewer's answer does not start with VERDICT: <verdict>");
  if (!answer.nonce) errors.push("the reviewer's answer carries no REVIEW_NONCE");
  else if (answer.nonce !== nonce) errors.push("the reviewer answered another review (REVIEW_NONCE differs)");
  if (!answer.revision) errors.push("the reviewer's answer carries no REVISION");
  if (errors.length) return { errors, evidence: null, observed };

  return {
    errors: [],
    observed,
    evidence: {
      runtime: "claude",
      agent: hook.agent_type,
      execution: CLAUDE_EXECUTION,
      isolation: "fresh-context",
      reviewId: nonce,
      reviewedRevision: answer.revision,
      verdict: answer.verdict,
      attestation: {
        source: "runtime",
        adapter: "claude",
        mechanism: "SubagentStop",
        sessionId: hook.session_id,
        agentId: hook.agent_id,
        agentTranscriptDigest: `sha256:${sha256(readFileSync(agentPath))}`,
      },
    },
  };
}

const reviewerProjection = (root = join(dirname(fileURLToPath(import.meta.url)), "..", "..")) =>
  JSON.parse(readFileSync(join(root, "core", "agents.json"), "utf8")).roles?.reviewer?.claude ?? {};
/** The tools the projected reviewer agent has (core/agents.json roles.reviewer.claude.tools). */
export const reviewerTools = (root) => reviewerProjection(root).tools ?? [];
/** The model the projected reviewer agent runs (core/agents.json roles.reviewer.claude.model). */
export const reviewerModel = (root) => reviewerProjection(root).model ?? null;

/** The review attester of this runtime (runtime/adapters/review-evidence.mjs). */
export const claudeReviewAttester = {
  runtime: "claude",
  parse: parseClaudeHookInput,
  verify: (hook, { nonce, packet = null, prompt = null, env = process.env, allowedTools = reviewerTools(), model = reviewerModel() } = {}) => verifyClaudeReceipt(hook, { nonce, packet, prompt, storeRoot: claudeStoreRoot(env), allowedTools, model }),
};
