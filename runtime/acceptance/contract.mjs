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
// on the host only `node` has a fixed identity (process.execPath); any other bare name would come from PATH (RF-8).
// Inside a digest-pinned container image a bare name is the image's own executable.
const HOST_BARE_EXECUTABLES = new Set(["node"]);
// inside the image only interpreters whose argv the platform constrains (independent re-review N2): any other bare
// name (busybox, env, nodejs, ...) can run inline script text and is refused
const CONTAINER_BARE_EXECUTABLES = new Set(["node", "python", "python3", "pytest"]);
const SECRET_ENV = /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|API_?KEY)/i;
// configuration files that conventionally hold secrets (env files, keys, credential stores)
const SECRET_FILE = /(^|\/)(\.env(\.[^/]*)?|[^/]*\.(pem|key|p12|pfx|jks|keystore)|[^/]*(secret|credential|password|token)[^/]*|\.npmrc|\.pypirc|\.netrc|id_(rsa|ed25519|ecdsa)[^/]*)$/i;
/** Does a repository-relative path name the git directory (any segment, any case)? */
export const namesGitDir = (p) => String(p).split(/[\\/]/).some((s) => s.toLowerCase() === ".git");
// node runner flags are an ALLOWLIST: anything else (inline script, --import/--require preloads, permission or
// inspector switches, env files) is refused, whatever its spelling (`-pe`, `--eval=...`, `--allow-fs-read=*`)
const NODE_FLAG_ALLOW = [/^--test$/, /^--test-reporter=(tap|spec|junit|dot)$/, /^--test-name-pattern=[^\0]+$/, /^--test-timeout=\d+$/, /^--test-concurrency=\d+$/, /^--test-isolation=(process|none)$/, /^--no-warnings$/, /^--enable-source-maps$/];
// python-like interpreters inside a container: harmless switches, then either a repository script or `-m` with a
// test-runner module only. `-m timeit|runpy|code|...` would run inline text (audit N-57, 002 RF-8).
const PY_FLAG_ALLOW = [/^-B$/, /^-I$/, /^-u$/];
const PY_MODULES = new Set(["pytest", "unittest"]);
// pytest: reporting/selection switches only; plugin loading (-p), ini/config overrides (-o, -c), --pyargs, rootdir
// and import-mode switches are refused. -k/-m take pytest's own expression language, never Python.
// --junitxml only to the runner-owned result file (the `{resultFile}` token), never to a path the runner chooses
const PYTEST_FLAG_ALLOW = [/^-q$/, /^-qq$/, /^-v$/, /^-vv$/, /^-x$/, /^-s$/, /^-r[a-zA-Z]+$/, /^--tb=(short|line|no|long|native)$/, /^--strict-markers$/, /^--no-header$/, /^-k$/, /^-m$/, /^--maxfail=\d+$/, /^--junitxml=\{resultFile\}$/];
const UNITTEST_FLAG_ALLOW = [/^-v$/, /^-q$/, /^-f$/, /^-b$/, /^-s$/, /^-p$/, /^-t$/, /^-k$/];

/** argv of a python interpreter or pytest: which tokens are flags of which allowlist. */
function pythonArgvErrors(base, argv) {
  const errors = [];
  const bad = (i, a, who) => errors.push(`argv[${i}] '${a.slice(0, 40)}' is not an allowed ${who} flag (inline script, plugin, preload and config switches are refused)`);
  let mode = base === "pytest" ? "pytest" : "interp";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (mode === "interp") {
      if (a === "-m") {
        const mod = argv[i + 1];
        if (!PY_MODULES.has(mod)) { errors.push(`argv[${i + 1}] module '${String(mod).slice(0, 40)}' is not an allowed test-runner module (pytest, unittest)`); return errors; }
        mode = mod; i++; continue;
      }
      if (a.startsWith("-")) { if (!PY_FLAG_ALLOW.some((re) => re.test(a))) bad(i, a, base); continue; }
      mode = "script"; continue; // a repository script: its own arguments follow
    }
    if (mode === "script") continue;
    const allow = mode === "pytest" ? PYTEST_FLAG_ALLOW : UNITTEST_FLAG_ALLOW;
    // flags whose NEXT token is their value (data, not a flag); per runner: pytest `-s` is a boolean
    const takesValue = mode === "pytest" ? /^-(k|m)$/ : /^-(k|p|t|s)$/;
    if (a.startsWith("-") && !allow.some((re) => re.test(a))) bad(i, a, mode);
    else if (takesValue.test(a)) i++;
  }
  if (mode === "interp") errors.push(`${base} runner has no script or test-runner module`);
  return errors;
}
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
export function checkExecutable(executable, { isolation = "restricted" } = {}) {
  if (SHELLS.has(executable.toLowerCase()) || SHELLS.has(executable.split("/").at(-1).toLowerCase())) return `runner executable '${executable}' is a shell`;
  if (HOST_BARE_EXECUTABLES.has(executable)) return null;
  if (!executable.includes("/")) {
    if (isolation !== "container") return `runner executable '${executable}' is not an allowed host identity (only node, or a repository path)`;
    return CONTAINER_BARE_EXECUTABLES.has(executable) ? null : `runner executable '${executable}' is not an allowed image identity (node, python, python3, pytest)`;
  }
  if (normalizeRepoPath(executable) === null) return `runner executable '${executable}' escapes the repository`;
  if (namesGitDir(executable)) return `runner executable '${executable}' is inside the git directory`;
  return null;
}

export function checkArgv(executable, argv) {
  const errors = [];
  const base = executable.split("/").at(-1).toLowerCase();
  const isPython = /^python(\d(\.\d+)?)?$/.test(base) || base === "pytest";
  const allow = base === "node" ? NODE_FLAG_ALLOW : null;
  if (isPython) errors.push(...pythonArgvErrors(base, argv));
  argv.forEach((a, i) => {
    if (/[\0\r\n]/.test(a)) errors.push(`argv[${i}] contains a control character`);
    if (allow && a.startsWith("-") && !allow.some((re) => re.test(a))) errors.push(`argv[${i}] '${a.slice(0, 40)}' is not an allowed ${base} flag (inline script, preload, permission and inspector switches are refused)`);
    if ((allow || isPython) && /^data:|^https?:/i.test(a)) errors.push(`argv[${i}] requests inline script text (URL/data module)`);
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
    const ee = checkExecutable(r.executable, { isolation: r.isolation });
    if (ee) errors.push(`runner ${r.id}: ${ee}`);
    else errors.push(...checkArgv(r.executable, r.argv).map((e) => `runner ${r.id}: ${e}`));
    if (normalizeRepoPath(r.cwd) === null && r.cwd !== ".") errors.push(`runner ${r.id}: cwd escapes the repository`);
    if (namesGitDir(r.cwd)) errors.push(`runner ${r.id}: cwd names the git directory`);
    for (const p of r.readPaths ?? []) if (namesGitDir(p)) errors.push(`runner ${r.id}: readPaths entry names the git directory`);
    // a loopback service network needs a per-run user-defined network and a human approval the agent cannot write:
    // neither exists in this candidate, so it is refused rather than mapped to the host network (002 RF-15)
    if (r.network === "loopback") errors.push(`runner ${r.id}: loopback service networks are not supported by this platform version (BLOCKED, never host networking)`);
    if (r.network && r.isolation !== "container") errors.push(`runner ${r.id}: network settings apply only to the container tier`);
    if (r.isolation === "container" && !/@sha256:[0-9a-f]{64}$/.test(r.image ?? "")) errors.push(`runner ${r.id}: container tier requires an image pinned by digest`);
    if (r.env.some((n) => /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|API_?KEY)/i.test(n))) errors.push(`runner ${r.id}: environment allowlist names a secret-like variable`);
    for (const p of r.readPaths ?? []) if (normalizeRepoPath(p) === null) errors.push(`runner ${r.id}: readPaths entry escapes the repository`);
    // 002 RF-17/RF-18: configuration inputs are non-secret repository files whose bytes are fingerprinted; a file
    // that holds secrets cannot be fingerprinted without exposing or recoverably hashing it, so it is refused
    for (const p of r.configFiles ?? []) {
      if (normalizeRepoPath(p) === null || namesGitDir(p)) errors.push(`runner ${r.id}: configFiles entry escapes the repository or names the git directory`);
      else if (SECRET_FILE.test(p)) errors.push(`runner ${r.id}: configFiles entry ${p} is secret-like and cannot be fingerprinted without exposing it (BLOCKED)`);
    }
    // the result file is a plain name inside the runner-owned output directory; the token is used only with it
    if (r.argv.some((x) => x.includes("{resultFile}")) && !r.resultFile) errors.push(`runner ${r.id}: argv uses {resultFile} but no resultFile is declared`);
    if (r.resultFile && !r.argv.some((x) => x.includes("{resultFile}"))) errors.push(`runner ${r.id}: resultFile is declared but no argv token writes it`);
    for (const n of r.envValues ?? []) {
      if (!r.env.includes(n)) errors.push(`runner ${r.id}: envValues entry ${n} is not in the environment allowlist`);
      if (SECRET_ENV.test(n)) errors.push(`runner ${r.id}: envValues entry ${n} is secret-like: its value is never fingerprinted`);
    }
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
