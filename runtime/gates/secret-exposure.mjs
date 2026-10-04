// Audit H1 (CRITICAL): which workflows may touch a secret other than GITHUB_TOKEN.
//
// GitHub runs a workflow from the file at the ref that triggered it:
//   push / pull_request / pull_request_review* / workflow_dispatch / schedule ... -> the file on THAT ref (the pusher's branch)
//   pull_request_target / workflow_run / ...                                      -> the file on the DEFAULT branch
// Anyone able to push a branch (the worker App has `workflows: write`) can add a workflow with `on: push` that prints every
// repository secret, with no PR and no review. Detection cannot stop that (the preventive boundary is an Environment limited to
// the default branch: governance/security/SECRETS-BOUNDARY.md). This module makes the repository's OWN workflows conform, FAIL-CLOSED:
//
//   * ANY mention of `secrets` (case-insensitive, any form: secrets.X, secrets['X'], toJSON(secrets), `secrets: inherit`,
//     `secrets: "inherit"`, a bare `${{ secrets }}`) other than GITHUB_TOKEN counts as a secret reference;
//   * a workflow with a secret reference is allowed only if EVERY trigger is a base-file event;
//   * if the triggers cannot be determined, that is a finding too (never silence).
//
// Text-level YAML parsing is deliberately conservative: it may over-report (the word "secrets" inside a script of a push
// workflow is flagged and must be reworded) but it must not under-report.

// `release` is NOT here: a release runs the workflow file at the TAGGED commit, which anyone who can push can choose.
export const BASE_FILE_EVENTS = new Set(["pull_request_target", "workflow_run", "workflow_call", "issue_comment", "issues"]);

const unquote = (s) => s.trim().replace(/^["']|["']$/g, "");
const stripComment = (l) => l.replace(/(^|[ \t])#.*$/, "");
const nest = (s) => [...s].reduce((d, c) => d + (c === "[" || c === "{" ? 1 : c === "]" || c === "}" ? -1 : 0), 0);

/** { head, body }: what follows `on:` on its line, and the lines of the block under it (comments removed). */
function onSection(text) {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const start = lines.findIndex((l) => /^["']?on["']?[ \t]*:/.test(l));
  if (start < 0) return null;
  const head = lines[start].replace(/^["']?on["']?[ \t]*:[ \t]*/, "").trim();
  const body = [];
  for (let k = start + 1; k < lines.length; k += 1) {
    if (!/^[ \t]/.test(lines[k]) && /^[A-Za-z_"']/.test(lines[k])) break; // next top-level key
    body.push(lines[k]);
  }
  return { head, body: body.filter((l) => l.trim().length) };
}

/** Depth-1 keys of a flow mapping ("{ push: {...}, workflow_dispatch: {} }") or items of a flow list ("[push, pull_request]"). */
function flowTopLevel(flow) {
  const isMap = flow.trimStart().startsWith("{");
  const out = new Set();
  let depth = 0;
  let token = "";
  let expectKey = true;
  for (const ch of flow) {
    if (ch === "{" || ch === "[") { depth += 1; if (depth === 1) continue; }
    if (ch === "}" || ch === "]") {
      depth -= 1;
      if (depth === 0) { if (!isMap && token.trim()) out.add(unquote(token)); token = ""; continue; }
    }
    if (depth === 1) {
      if (ch === ",") { if (!isMap && token.trim()) out.add(unquote(token)); expectKey = true; token = ""; continue; }
      if (isMap && ch === ":" && expectKey) { if (token.trim()) out.add(unquote(token)); expectKey = false; token = ""; continue; }
      if (!isMap || expectKey) token += ch;
    }
  }
  return [...out];
}

/** The event names declared by the workflow (every YAML shape of `on:`); [] when they cannot be determined. */
export function triggerNames(text) {
  const sec = onSection(text);
  if (!sec) return [];
  const names = new Set();
  let { head, body } = sec;
  if (head.startsWith("[") || head.startsWith("{")) {
    // comments are NOT interpreted inside a flow collection: a quoted "#" would let a stripped comment cut the event list.
    // A ` #` anywhere in it, or brackets that never balance, make the triggers unreadable (fail closed in checkSecretExposure).

    // a flow collection, possibly spread over several lines: join until the brackets balance
    let joined = head;
    let depth = nest(head);
    let used = 0;
    while (depth > 0 && used < body.length) {
      joined += ` ${body[used].trim()}`;
      depth += nest(body[used]);
      used += 1;
    }
    if (depth !== 0 || /(^|[ \t])#/.test(joined)) return [];
    flowTopLevel(joined).forEach((n) => names.add(n));
    body = body.slice(used);
  } else if (head) {
    stripComment(head).split(",").map((x) => unquote(x.replace(/:$/, ""))).filter(Boolean).forEach((n) => names.add(n)); // scalar: `on: push`
  }
  // block form: the events are the entries at the FIRST (shallowest) indentation under `on:`; deeper lines are options
  body = body.map(stripComment).filter((l) => l.trim().length);
  const indents = body.map((l) => l.match(/^[ \t]*/)[0].length);
  const top = Math.min(...indents, Infinity);
  let unreadable = false;
  body.forEach((l, k) => {
    if (indents[k] !== top) return;
    const m = /^[ \t]*(?:-[ \t]*)?["']?([A-Za-z_][\w-]*)["']?[ \t]*(?::|$)/.exec(l);
    // a line at event level that the strict reader does not understand (anchor `&a push:`, tag `!!str push:`, explicit key `? push`,
    // alias, ...) could be an event: the trigger set is then UNREADABLE, never silently shortened
    if (m) names.add(m[1]);
    else unreadable = true;
  });
  if (unreadable) return [];
  return [...names];
}

/**
 * The text scanned for secret references: the WHOLE file, minus only the allowed GITHUB_TOKEN references. Nothing else is dropped:
 * not comments (a `#` line inside a block scalar is data GitHub still expands), not `name:` lines (an expression can span lines, so a
 * line that starts with `name:` may be the middle of one). Telling code from prose needs a YAML parser; so a display name or a
 * comment that merely says "secrets" is reported too and must be reworded. Over-reporting is the safe side.
 */
function secretScanText(text) {
  return text
    .split(/\r?\n/)
    .join("\n")
    .replace(/secrets\s*\.\s*GITHUB_TOKEN\b/gi, "")
    .replace(/secrets\s*\[\s*["']GITHUB_TOKEN["']\s*\]/gi, "");
}

/** Secret references (any form, case-insensitive). */
export function secretReferences(text) {
  const code = secretScanText(text);
  const refs = new Set();
  for (const m of code.matchAll(/\bsecrets\s*\.\s*([A-Za-z_]\w*)/gi)) refs.add(`secrets.${m[1]}`);
  for (const m of code.matchAll(/\bsecrets\s*\[\s*([^\]]+?)\s*\]/gi)) refs.add(`secrets[${m[1]}]`);
  if (/\btoJSON\s*\(\s*secrets\s*\)/i.test(code)) refs.add("toJSON(secrets)");
  if (/^\s*secrets\s*:\s*["']?inherit["']?\s*(?:#.*)?$/im.test(code)) refs.add("secrets: inherit");
  if (/^\s*secrets\s*:\s*(?:#.*)?$/im.test(code)) refs.add("secrets: mapping");
  // whatever still names the bare context (`${{ secrets }}`, format(..., secrets), join(secrets, ...)) is a reference too
  if (/^\s*secrets\s*:/im.test(code) && !refs.has("secrets: inherit") && !refs.has("secrets: mapping")) refs.add("secrets: key");
  const rest = code.replace(/\bsecrets\s*[.[]/gi, "");
  if (/\bsecrets\b/i.test(rest)) refs.add("secrets (bare context)");
  return [...refs];
}

/**
 * YAML double-quoted scalars decode `\xNN`, `\uNNNN`, `\UNNNNNNNN` and a trailing `\` (line continuation) BEFORE GitHub evaluates an
 * expression, so `${{ \x73ecrets.K }}` is `secrets.K` to GitHub and invisible to a raw-text scan. In a workflow that is not
 * restricted to base-file events such an escape is itself a finding (fail closed): there is no legitimate reason for it.
 */
export function hasObfuscatingEscape(text) {
  if (/\\(?:x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/.test(text)) return true;
  // STATELESS on purpose: ANY line ending in a backslash is a finding. Guessing whether a double-quoted scalar is open by counting
  // quotes can be desynchronised (a quote in a comment flips the guess); a rule without state cannot. A workflow that runs the
  // branch's own file simply must not use line continuations (write one command per line, or use an array).
  return /\\[ \t]*(?:\r?\n|$)/m.test(text);
}

/** Findings: secrets reachable from an event that runs the pushed branch's own workflow file, or from triggers we cannot read. */
export function checkSecretExposure(path, text) {
  const events = triggerNames(text);
  // UNCONDITIONAL: an escape can hide an event key ("pus\x68":) as well as a secret reference, so whether the workflow "looks
  // base-file-only" cannot be trusted when an escape is present. No workflow here may contain one.
  if (hasObfuscatingEscape(text)) {
    return [{ code: "SECRETS_IN_PR_EVENT", path, detail: "contains a YAML hex/unicode escape or a line-continuation backslash, which GitHub decodes before evaluating expressions and a text scan cannot see through; not allowed in a workflow that runs the pushed branch own file (fail closed)" }];
  }
  const refs = secretReferences(text);
  if (!refs.length) return [];
  const detail = (why) => refs.map((r) => ({ code: "SECRETS_IN_PR_EVENT", path, detail: `${r} ${why}` }));
  if (!events.length) return detail("is used but the workflow's triggers could not be determined (fail closed)");
  const unsafe = events.filter((e) => !BASE_FILE_EVENTS.has(e));
  if (!unsafe.length) return [];
  return detail(`is reachable from '${unsafe.join(", ")}', which run(s) the pushed branch's own workflow file; only ${[...BASE_FILE_EVENTS].join("/")} may use secrets`);
}
