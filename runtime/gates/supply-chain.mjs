// M4.3 (PAR-SUPPLY-CHAIN, CI-08). Static policy over workflow files, read-only:
//  - every workflow declares top-level `permissions:` and never `write-all`
//  - every third-party action is pinned by a full 40-hex SHA
//  - no `pull_request_target` workflow checks out or runs the PR head
//  - no piping of a download into a shell
// Plus a secret-shape scan over arbitrary text (added lines of a diff).
import { findUnpinned } from "../../scripts/validate-actions-pinned.mjs";

const HEAD_REF = /github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref/;

export function checkWorkflow(path, text) {
  const findings = [];
  if (!/^permissions:/m.test(text)) findings.push({ code: "NO_PERMISSIONS", path, detail: "workflow lacks top-level permissions:" });
  if (/permissions:\s*write-all/.test(text)) findings.push({ code: "WRITE_ALL", path, detail: "permissions: write-all" });
  for (const u of findUnpinned(text)) findings.push({ code: "UNPINNED_ACTION", path, detail: `line ${u.line}: ${u.ref}` });
  if (/^\s*pull_request_target:/m.test(text) && HEAD_REF.test(text)) {
    const usesHeadInCheckout = /uses:\s*actions\/checkout[\s\S]{0,400}?ref:\s*\$\{\{[^}]*(head\.(sha|ref)|head_ref)/.test(text);
    if (usesHeadInCheckout) findings.push({ code: "PRT_CHECKOUT_HEAD", path, detail: "pull_request_target checks out the PR head" });
  }
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
