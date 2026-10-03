// M4.3 (PAR-SUPPLY-CHAIN, CI-08). Static policy over workflow files, read-only:
//  - every workflow declares top-level `permissions:` and never `write-all`
//  - every third-party action is pinned by a full 40-hex SHA
//  - no `pull_request_target` workflow checks out or runs the PR head
//  - no piping of a download into a shell
//  - no attacker-controlled `${{ github.event.* }}` interpolated into a script (P43)
// Plus a secret-shape scan over arbitrary text (added lines of a diff).
import { findUnpinned } from "../../scripts/validate-actions-pinned.mjs";

const HEAD_REF = /github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref/;

// Fields an attacker controls (branch names, titles, bodies, commit metadata).
// Script injection (B31 / P43): such an expression interpolated into a `run:` or
// `github-script` body is code. Passing it through `env:` and reading the shell
// variable is the safe form and is not flagged.
const UNTRUSTED =
  /\$\{\{[^}]*\b(github\.(head_ref|ref_name|ref)\b|github\.event\.(pull_request\.(title|body|head\.(ref|label|repo\.[a-z_]+))|issue\.(title|body)|comment\.body|review\.body|review_comment\.body|discussion\.(title|body)|pages\.[^}\s]*|commits\b[^}]*|head_commit\.(message|author\.(name|email))|workflow_run\.(head_branch|display_title|head_commit\.[a-z.]*)))[^}]*\}\}/i;

/** Lines (1-based) with an untrusted expression inside a run: / script: body. */
export function findScriptInjection(text) {
  const hits = [];
  let blockIndent = null;
  text.split(/\r?\n/).forEach((line, i) => {
    const indent = line.match(/^\s*/)[0].length;
    if (blockIndent !== null) {
      if (line.trim() === "" || indent > blockIndent) {
        if (UNTRUSTED.test(line)) hits.push({ line: i + 1, text: line.trim() });
        return;
      }
      blockIndent = null;
    }
    const key = line.match(/^(\s*)(?:-\s+)?(run|script):\s*(.*)$/);
    if (!key) return;
    const keyIndent = key[1].length + (/^\s*-\s/.test(line) ? 2 : 0);
    const rest = key[3].trim();
    // Every following line indented deeper than the key belongs to its value: that covers block
    // scalars (`|`, `>`, any indicator order) and multi-line plain/quoted scalars alike.
    blockIndent = keyIndent;
    if (UNTRUSTED.test(rest)) hits.push({ line: i + 1, text: rest });
  });
  return hits;
}

/** The text of the top-level `on:` block (up to the next top-level key). */
function triggerBlock(text) {
  const m = /^on:[ \t]*(.*)$/m.exec(text);
  if (!m) return "";
  const rest = text.slice(m.index + m[0].length);
  const next = /\n[A-Za-z_][\w-]*[ \t]*:/.exec(rest);
  return `${m[1]}\n${next ? rest.slice(0, next.index) : rest}`;
}

const PR_EVENT = /(?:^|\n)[ \t]*(?:pull_request|pull_request_review|pull_request_review_comment)[ \t]*:|\[[^\]]*\b(?:pull_request|pull_request_review)\b[^\]]*\]/;

export function checkWorkflow(path, text) {
  const findings = [];
  if (!/^permissions:/m.test(text)) findings.push({ code: "NO_PERMISSIONS", path, detail: "workflow lacks top-level permissions:" });
  if (/permissions:\s*write-all/.test(text)) findings.push({ code: "WRITE_ALL", path, detail: "permissions: write-all" });
  for (const u of findUnpinned(text)) findings.push({ code: "UNPINNED_ACTION", path, detail: `line ${u.line}: ${u.ref}` });
  if (/^\s*pull_request_target:/m.test(text) && HEAD_REF.test(text)) {
    const usesHeadInCheckout = /uses:\s*actions\/checkout[\s\S]{0,400}?ref:\s*\$\{\{[^}]*(head\.(sha|ref)|head_ref)/.test(text);
    if (usesHeadInCheckout) findings.push({ code: "PRT_CHECKOUT_HEAD", path, detail: "pull_request_target checks out the PR head" });
  }
  // `pull_request` / `pull_request_review*` run the PR's OWN workflow file (same-repo branches), so anyone who can push a
  // branch can edit it and print every secret it receives. Only GITHUB_TOKEN may reach such a workflow; anything else
  // belongs in a pull_request_target / push / workflow_dispatch workflow, which runs the BASE file.
  if (PR_EVENT.test(triggerBlock(text))) {
    for (const m of text.matchAll(/secrets\.([A-Za-z_]\w*)/g)) {
      if (m[1] !== "GITHUB_TOKEN") findings.push({ code: "SECRETS_IN_PR_EVENT", path, detail: `secrets.${m[1]} is reachable from a pull_request/pull_request_review workflow (it runs the PR's own file)` });
    }
  }
  for (const h of findScriptInjection(text)) findings.push({ code: "SCRIPT_INJECTION", path, detail: `line ${h.line}: untrusted expression interpolated into a script: ${h.text.slice(0, 120)}` });
  if (/(curl|wget)[^\n|]*\|\s*(ba)?sh\b/.test(text)) findings.push({ code: "PIPE_TO_SHELL", path, detail: "download piped into a shell" });
  return findings;
}

export function checkWorkflows(workflows) {
  return Object.entries(workflows).flatMap(([p, t]) => checkWorkflow(p, t));
}

const SECRET_SHAPES = [
  ["GITHUB_TOKEN", /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/],
  ["GITHUB_PAT", /\bgithub_pat_[A-Za-z0-9_]{50,}\b/],
  ["PRIVATE_KEY", /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ["AWS_KEY", /\bAKIA[0-9A-Z]{16}\b/],
];

export function scanSecrets(path, text) {
  return SECRET_SHAPES.filter(([, re]) => re.test(text)).map(([code]) => ({ code: `SECRET_${code}`, path, detail: "secret-shaped value" }));
}
