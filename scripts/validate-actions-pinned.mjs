#!/usr/bin/env node
// M0.3b: fail-closed check that every `uses:` in the active workflows of the
// root .github/ is pinned by a full 40-hex commit SHA. Local actions (./) and
// reusable workflows from this repo by relative path are exempt; everything
// else (including docker:// images) must be pinned.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA_REF = /^[^@\s]+@[0-9a-f]{40}$/;
const DOCKER_DIGEST = /^docker:\/\/\S+@sha256:[0-9a-f]{64}$/;

export function findUnpinned(text) {
  const bad = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const m = line.match(/^\s*(?:-\s+)?uses:\s*["']?([^\s"'#]+)["']?/);
    if (!m) return;
    const ref = m[1];
    if (ref.startsWith("./")) return;
    if (ref.startsWith("docker://")) {
      if (!DOCKER_DIGEST.test(ref)) bad.push({ line: i + 1, ref });
      return;
    }
    if (!SHA_REF.test(ref)) bad.push({ line: i + 1, ref });
  });
  return bad;
}

export function scanDir(dir) {
  const findings = [];
  for (const name of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    for (const b of findUnpinned(readFileSync(path.join(dir, name), "utf8"))) {
      findings.push({ file: name, ...b });
    }
  }
  return findings;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const dir = path.resolve(fileURLToPath(new URL("..", import.meta.url)), ".github", "workflows");
  const findings = scanDir(dir);
  for (const f of findings) console.error(`UNPINNED ${f.file}:${f.line} ${f.ref}`);
  if (findings.length) process.exit(1);
  console.log(`PASS: all actions in ${path.relative(process.cwd(), dir) || dir} pinned by full SHA`);
}
