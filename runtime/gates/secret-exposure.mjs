// Audit H1 (CRITICAL): which workflows may touch a non-GITHUB_TOKEN secret.
//
// GitHub runs a workflow from the file at the ref that triggered it:
//   pull_request / pull_request_review* / push / workflow_dispatch / schedule ...  -> the file at THAT ref, i.e. the branch
//                                                                                    of whoever pushed it
//   pull_request_target / workflow_run / issue_comment ...                         -> the file on the DEFAULT branch
// Anyone able to push a branch to this repo (the worker App has `workflows: write`) can therefore add a workflow with a
// `push` (or `pull_request`) trigger that prints every repository secret, with no PR and no review. Detection cannot
// stop that; the real boundary is an Environment whose deployment branches are limited to the default branch
// (governance/security/SECRETS-BOUNDARY.md). What this module does is make the repository's OWN workflows conform, so
// the policy is enforceable and any deviation is loud:
//   a workflow that references a secret other than GITHUB_TOKEN may only be triggered by BASE-FILE events
//   (pull_request_target, workflow_run, workflow_call, release) -- never by an event that runs the branch's file.
//
// Triggers are parsed from the `on:` block in every YAML form: scalar, list, mapping, flow mapping, quoted keys.

export const BASE_FILE_EVENTS = new Set(["pull_request_target", "workflow_run", "workflow_call", "release", "issue_comment", "issues"]);

const unquote = (s) => s.trim().replace(/^["']|["']$/g, "");

/** { head, body }: the text after `on:` on its own line, and the lines of the block under it (comments removed). */
function onSection(text) {
  const lines = text.split("\n").map((l) => l.replace(/\r$/, ""));
  const start = lines.findIndex((l) => /^["']?on["']?[ \t]*:/.test(l));
  if (start < 0) return null;
  const head = lines[start].replace(/^["']?on["']?[ \t]*:[ \t]*/, "").replace(/(^|[ \t])#.*$/, "").trim();
  const body = [];
  for (let k = start + 1; k < lines.length; k += 1) {
    if (!/^[ \t]/.test(lines[k]) && /^[A-Za-z_"']/.test(lines[k])) break; // next top-level key
    body.push(lines[k].replace(/(^|[ \t])#.*$/, ""));
  }
  return { head, body: body.filter((l) => l.trim().length) };
}

/** The event names declared by the workflow (all YAML shapes of `on:`). */
export function triggerNames(text) {
  const sec = onSection(text);
  if (!sec) return [];
  const head = sec.head;
  const names = new Set();
  const addList = (s) => s.split(",").map((x) => unquote(x.replace(/:$/, ""))).filter(Boolean).forEach((n) => names.add(n));
  if (head.startsWith("[")) addList(head.replace(/^\[|\]$/g, ""));
  else if (head.startsWith("{")) {
    let depth = 0;
    let token = "";
    for (const ch of head) {
      if (ch === "{" || ch === "[") depth += 1;
      else if (ch === "}" || ch === "]") depth -= 1;
      if (depth === 1 && ch === ":") { names.add(unquote(token.replace(/^\{/, ""))); token = ""; }
      else if (depth === 1 && ch === ",") token = "";
      else if (depth <= 1) token += ch;
    }
  } else if (head) addList(head); // scalar: `on: push`
  // block form: the events are the entries at the FIRST (shallowest) indentation under `on:`; deeper lines are options
  const body = sec.body;
  const indents = body.map((l) => l.match(/^[ 	]*/)[0].length);
  const top = Math.min(...indents, Infinity);
  body.forEach((l, k) => {
    if (indents[k] !== top) return;
    const m = /^[ 	]*(?:-[ 	]*)?["']?([A-Za-z_][\w-]*)["']?[ 	]*(?::|$)/.exec(l);
    if (m) names.add(m[1]);
  });
  return [...names];
}

/** Secret references other than GITHUB_TOKEN, in every form (comments ignored). */
export function secretReferences(text) {
  const code = text.split("\n").filter((l) => !l.trimStart().startsWith("#")).join("\n");
  const refs = new Set();
  for (const m of code.matchAll(/secrets\.([A-Za-z_]\w*)/g)) if (m[1] !== "GITHUB_TOKEN") refs.add(`secrets.${m[1]}`);
  for (const m of code.matchAll(/secrets\[\s*([^\]]+?)\s*\]/g)) if (unquote(m[1]) !== "GITHUB_TOKEN") refs.add(`secrets[${m[1]}]`);
  if (/toJSON\(\s*secrets\s*\)/i.test(code)) refs.add("toJSON(secrets)");
  if (/^\s*secrets:\s*inherit\s*$/m.test(code)) refs.add("secrets: inherit");
  return [...refs];
}

/** Findings: secrets reachable from an event that runs the branch's own workflow file. */
export function checkSecretExposure(path, text) {
  const refs = secretReferences(text);
  if (!refs.length) return [];
  const events = triggerNames(text);
  const unsafe = events.filter((e) => !BASE_FILE_EVENTS.has(e));
  if (!unsafe.length) return [];
  return refs.map((r) => ({ code: "SECRETS_IN_PR_EVENT", path, detail: `${r} is reachable from '${unsafe.join(", ")}', which run(s) the pushed branch's own workflow file; only ${[...BASE_FILE_EVENTS].join("/")} may use secrets` }));
}
