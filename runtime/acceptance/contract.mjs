// Validation contract: authorized runners and the non-SUT path class
// (spec 002 RF-8, RF-10, RF-15, RF-23, RF-24 denylist, RF-34). Fail-closed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validate } from "../lib/schema-lite.mjs";
import { normalizeRepoPath } from "./manifest.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const loadSchema = (f) => JSON.parse(readFileSync(join(here, "..", "..", "contracts", f), "utf8"));
export const CONTRACT_SCHEMA = loadSchema("acceptance-validation-contract.schema.json");

export const TIER_RANK = Object.freeze({ restricted: 0, "node-permission": 1, container: 2 });
const BARE_EXECUTABLES = new Set(["node", "python", "python3", "docker", "pytest"]);
// inline script / eval / interactive switches per interpreter (RF-8)
const INLINE_FLAGS = new Set(["-e", "--eval", "-p", "--print", "-c", "--command", "-i", "--interactive", "-"]);
const SHELLS = new Set(["sh", "bash", "zsh", "cmd", "cmd.exe", "powershell", "pwsh", "powershell.exe", "pwsh.exe", "fish", "dash"]);
const NOOP_DENYLIST = new Set(["true", "false", ":", "exit", "echo"]);

const NON_SUT_ROOTS = ["specs/", "docs/", "governance/", "knowledge/"];
const NON_SUT_EXCLUDED_PREFIXES = ["governance/gates/", "governance/rulesets/", "knowledge/sdd/templates/", ".github/", "runtime/", "contracts/", "core/", "profiles/"];

/** Glob -> RegExp. `**` crosses directories, `*` and `?` do not. */
export function globToRegExp(glob) {
  let re = "^";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        i++;
        if (glob[i + 1] === "/") { i++; re += "(?:.*/)?"; } else re += ".*";
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${re}$`);
}
const hasGlob = (s) => /[*?]/.test(s);
/** A glob can overlap a concrete path when it matches it, or the path is under its literal prefix with `**`. */
export const globMatches = (glob, path) => globToRegExp(glob).test(path);

/** Resolves the executable identity; a bare name is never taken from the environment. */
export function checkExecutable(executable) {
  if (BARE_EXECUTABLES.has(executable)) return null;
  if (SHELLS.has(executable.toLowerCase())) return `runner executable '${executable}' is a shell`;
  if (!executable.includes("/")) return `runner executable '${executable}' is not an allowed identity`;
  if (normalizeRepoPath(executable) === null) return `runner executable '${executable}' escapes the repository`;
  return null;
}

export function checkArgv(executable, argv) {
  const errors = [];
  const base = executable.split("/").at(-1).toLowerCase();
  argv.forEach((a, i) => {
    if (/[\0\r\n]/.test(a)) errors.push(`argv[${i}] contains a control character`);
    if (INLINE_FLAGS.has(a) && ["node", "python", "python3"].includes(base)) errors.push(`argv[${i}] '${a}' requests inline script text`);
    if (/\$\(|`|\$\{|%[A-Za-z_]+%/.test(a)) errors.push(`argv[${i}] contains command/environment substitution`);
    if (a.split(/[\\/]/).includes("..")) errors.push(`argv[${i}] contains a path escape`);
  });
  if (argv.length && NOOP_DENYLIST.has(argv[0]) && base !== "node") errors.push("argv starts with a no-op command (defense in depth)");
  if (base === "node" && argv.length === 0) errors.push("node runner has no script or test argument");
  return errors;
}

/** Structural + semantic validation of the contract. @returns {{ok, errors, runners: Map}} */
export function validateContract(contract) {
  const errors = [];
  if (contract === null || typeof contract !== "object" || Array.isArray(contract)) return { ok: false, errors: ["validation contract must be a JSON object"], runners: new Map() };
  errors.push(...validate(contract, CONTRACT_SCHEMA).map((e) => `schema: ${e}`));
  if (errors.length) return { ok: false, errors: errors.sort(), runners: new Map() };
  const runners = new Map();
  for (const r of contract.runners) {
    if (runners.has(r.id)) errors.push(`duplicate runner id: ${r.id}`);
    runners.set(r.id, r);
    const ee = checkExecutable(r.executable);
    if (ee) errors.push(`runner ${r.id}: ${ee}`);
    else errors.push(...checkArgv(r.executable, r.argv).map((e) => `runner ${r.id}: ${e}`));
    if (normalizeRepoPath(r.cwd) === null && r.cwd !== ".") errors.push(`runner ${r.id}: cwd escapes the repository`);
    if (r.network === "loopback" && !r.networkApproval) errors.push(`runner ${r.id}: network access requires a human-approved contract entry (networkApproval)`);
    if (r.network && r.isolation !== "container") errors.push(`runner ${r.id}: network settings apply only to the container tier`);
    if (r.isolation === "container" && !/@sha256:[0-9a-f]{64}$/.test(r.image ?? "")) errors.push(`runner ${r.id}: container tier requires an image pinned by digest`);
    if (r.env.some((n) => /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|API_?KEY)/.test(n))) errors.push(`runner ${r.id}: environment allowlist names a secret-like variable`);
    for (const p of r.readPaths ?? []) if (normalizeRepoPath(p) === null) errors.push(`runner ${r.id}: readPaths entry escapes the repository`);
  }
  for (const e of nonSutPathErrors(contract.nonSutPaths ?? [])) errors.push(e);
  return { ok: errors.length === 0, errors: [...new Set(errors)].sort(), runners };
}

/** RF-34 syntactic rules (independent of the plan). */
export function nonSutPathErrors(entries) {
  const errors = [];
  for (const g of entries) {
    if (typeof g !== "string" || !g || g.includes("\\") || g.startsWith("/") || g.split("/").includes("..")) { errors.push(`nonSutPaths entry '${String(g).slice(0, 60)}' is not a safe relative glob`); continue; }
    if (/^[*/]*$/.test(g)) { errors.push(`nonSutPaths entry '${g}' matches every path`); continue; }
    const rooted = NON_SUT_ROOTS.some((r) => g.startsWith(r));
    if (!rooted) {
      if (hasGlob(g) || g.includes("/") || !/\.md$/i.test(g)) errors.push(`nonSutPaths entry '${g}' is outside specs/, docs/, governance/, knowledge/ and is not a single named Markdown file`);
      continue;
    }
    const literal = g.slice(0, g.search(/[*?]/) === -1 ? g.length : g.search(/[*?]/));
    if (NON_SUT_EXCLUDED_PREFIXES.some((p) => g.startsWith(p) || (hasGlob(g) && p.startsWith(literal)))) errors.push(`nonSutPaths entry '${g}' covers a control-plane, template or source path`);
  }
  return errors;
}

/** RF-34 semantic rules against the plan: the class must not swallow SUT inputs, runners, datasets, contracts. */
export function nonSutPlanErrors({ contract, plan, contractPath = "acceptance/validation-contract.json", planPaths = [] }) {
  const errors = [];
  const protectedPaths = new Set([contractPath, ...planPaths]);
  for (const c of plan?.cases ?? []) for (const p of c.sutPaths ?? []) protectedPaths.add(p);
  for (const d of plan?.datasets ?? []) if (d.path) protectedPaths.add(d.path);
  for (const r of contract.runners ?? []) {
    if (r.executable.includes("/")) protectedPaths.add(r.executable);
    for (const a of r.argv) if (/[./]/.test(a) && !a.startsWith("-")) protectedPaths.add(a);
    protectedPaths.add(r.cwd);
  }
  for (const g of contract.nonSutPaths ?? []) {
    const re = globToRegExp(g);
    for (const p of protectedPaths) if (re.test(p) || (hasGlob(p) && globMatches(p, g))) errors.push(`nonSutPaths entry '${g}' matches protected path '${p}'`);
    if (re.test("specs/x/acceptance/plan.json")) errors.push(`nonSutPaths entry '${g}' matches an acceptance plan`);
    if (re.test("acceptance/validation-contract.json") || re.test("governance/gates/gates.json") || re.test("knowledge/sdd/templates/x.md")) errors.push(`nonSutPaths entry '${g}' matches a contract, control-plane or template path`);
  }
  return [...new Set(errors)].sort();
}

/** True when a changed path belongs to the validated non-SUT class. */
export const inNonSutClass = (contract, path) => (contract.nonSutPaths ?? []).some((g) => globToRegExp(g).test(path));
