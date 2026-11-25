// Governed runner (spec 002 RF-8, RF-9, RF-10, RF-14, RF-15, RF-16, RF-33).
// Executes ONLY a validation-contract runner entry: fixed executable identity,
// argv vector, cwd root; spawn WITHOUT shell. `restricted` is an injection
// defense and is reported as NOT isolated. Higher tiers are verified before
// the command starts; an unavailable tier is BLOCKED, never downgraded.
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { delimiter, isAbsolute, join, relative, resolve, sep } from "node:path";
import { TIER_RANK, checkArgv, checkExecutable } from "./contract.mjs";
import { normalizeRepoPath } from "./manifest.mjs";

export const MAX_OUTPUT_BYTES = 4 * 1024 * 1024;
const blocked = (reason, extra = {}) => ({ status: "BLOCKED", reasons: [reason], executed: false, ...extra });
const inside = (root, p) => p === root || p.startsWith(root.endsWith(sep) ? root : root + sep);
const sha256 = (b) => createHash("sha256").update(b).digest("hex");

/** Fixed executable identity -> absolute path. Bare names are never taken from the caller's environment variables. */
export function resolveExecutable(executable, root) {
  if (executable === "node") return process.execPath;
  if (executable.includes("/")) {
    const abs = resolve(root, executable);
    const real = existsSync(abs) ? realpathSync(abs) : null;
    return real && inside(realpathSync(root), real) ? real : null;
  }
  const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const dir of (process.env.PATH ?? process.env.Path ?? "").split(delimiter)) {
    for (const ext of exts) {
      const cand = join(dir, executable + ext);
      try { if (statSync(cand).isFile()) return cand; } catch { /* next */ }
    }
  }
  return null;
}

/** Host capability probe for a tier. Detected, never assumed. */
export function probeTier(tier, { spawnSyncImpl = spawnSync } = {}) {
  if (tier === "restricted") return { available: true };
  if (tier === "node-permission") {
    const r = spawnSyncImpl(process.execPath, ["--permission", "-p", "typeof process.permission"], { encoding: "utf8", timeout: 15000, windowsHide: true });
    return r.status === 0 && String(r.stdout).trim() === "object" ? { available: true } : { available: false, reason: "Node permission model is not supported by this runtime" };
  }
  if (tier === "container") {
    const r = spawnSyncImpl("docker", ["version", "--format", "{{.Server.Version}}"], { encoding: "utf8", timeout: 20000, windowsHide: true });
    return r.status === 0 && String(r.stdout).trim() ? { available: true } : { available: false, reason: "no container runtime is available" };
  }
  return { available: false, reason: `unknown isolation tier ${tier}` };
}

/** A case may run only at or above its declared minimum tier (RF-33). */
export const tierSatisfies = (actual, minimum) => TIER_RANK[actual] >= TIER_RANK[minimum];

/** Kill the whole process tree (shell-free children may still spawn their own). */
function killTree(child) {
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true, timeout: 15000 });
    else { try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); } }
  } catch { /* already gone */ }
}

/**
 * @param {object} o
 * @param {string} o.root       repository root (never contains the runner's output)
 * @param {object} o.runner     validated contract runner entry
 * @param {string} o.outDir     runner-owned output directory
 * @param {object} [o.request]  caller-supplied deviations; any is BLOCKED (RF-10)
 * @param {string} [o.minTier]  case minimum isolation tier
 * @param {object} [o.hostEnv]  env source (default process.env); only allowlisted names are copied
 */
export async function runRunner({ root, runner, outDir, request = {}, minTier = "restricted", hostEnv = process.env, probe = probeTier, spawnImpl = spawn }) {
  // RF-10: nothing the contract does not declare may be requested; no fallback command exists
  for (const k of Object.keys(request)) {
    if (JSON.stringify(request[k]) !== JSON.stringify(runner[k])) return blocked(`request for undeclared ${k} refused`);
  }
  const ee = checkExecutable(runner.executable, { isolation: runner.isolation });
  if (ee) return blocked(ee);
  const ae = checkArgv(runner.executable, runner.argv);
  if (ae.length) return blocked(ae[0]);
  if (!tierSatisfies(runner.isolation, minTier)) return blocked(`runner tier ${runner.isolation} is below the case minimum ${minTier}`);
  const tier = probe(runner.isolation);
  if (!tier.available) return blocked(`${tier.reason}: tier ${runner.isolation} is BLOCKED, no fallback to a weaker tier`);

  const realRoot = realpathSync(root);
  const cwdRel = runner.cwd === "." ? "." : normalizeRepoPath(runner.cwd);
  if (cwdRel === null) return blocked("cwd escapes the repository");
  const cwd = resolve(realRoot, cwdRel);
  if (!existsSync(cwd) || !inside(realRoot, realpathSync(cwd))) return blocked("cwd is missing or escapes the repository (symlink)");
  // a container runner's bare executable lives in the digest-pinned image; on the host only fixed identities resolve
  const inImage = runner.isolation === "container" && !runner.executable.includes("/");
  const exe = inImage ? null : resolveExecutable(runner.executable, realRoot);
  if (!inImage && !exe) return blocked(`executable '${runner.executable}' cannot be resolved inside the declared identity`);
  const exeDigest = inImage ? sha256(String(runner.image)) : sha256(readFileSync(exe));
  // every repository path the argv names must stay inside the repository and outside the git directory
  for (const a of runner.argv.filter((x) => !x.startsWith("-") && /[./]/.test(x))) {
    const p = resolve(cwd, a);
    if (!inside(realRoot, p) || relative(realRoot, p).split(sep).includes(".git")) return blocked("an argv path escapes the repository or names the git directory");
    if (existsSync(p) && (!inside(realRoot, realpathSync(p)) || relative(realRoot, realpathSync(p)).split(sep).includes(".git"))) return blocked("an argv path resolves (symlink) outside the repository or into the git directory");
  }
  mkdirSync(outDir, { recursive: true });
  const realOut = realpathSync(outDir);
  if (inside(realRoot, realOut) && existsSync(join(realRoot, ".git"))) { /* output inside the worktree is allowed but never read as evidence */ }

  // minimal environment: allowlisted names only, values never recorded
  const env = {};
  for (const name of runner.env) if (hostEnv[name] !== undefined) env[name] = hostEnv[name];
  env.ACCEPTANCE_OUT_DIR = realOut;

  let command = exe;
  let args = [...runner.argv];
  const controls = { shell: false, argvFixed: true, envNames: Object.keys(env).sort(), osBaselineEnvAddedByHost: process.platform === "win32", timeoutMs: runner.timeoutMs, outputBoundBytes: MAX_OUTPUT_BYTES };
  let isolated = false;
  if (runner.isolation === "node-permission") {
    if (runner.executable !== "node") return blocked("node-permission tier applies to node runners only");
    const reads = [...new Set((runner.readPaths ?? []).map((p) => resolve(realRoot, p)))];
    for (const p of reads) if (!inside(realRoot, p) || p === realRoot || p.split(sep).includes(".git")) return blocked("readPaths must be declared inputs, never the repository root or the git directory");
    // the script itself must be readable: first non-flag argv token
    const script = runner.argv.find((a) => !a.startsWith("-"));
    if (script) reads.push(resolve(cwd, script));
    const flags = ["--permission", ...reads.map((p) => `--allow-fs-read=${p}`), `--allow-fs-write=${realOut}`, `--allow-fs-read=${realOut}`];
    args = [...flags, ...args];
    isolated = true;
    Object.assign(controls, { filesystemRead: reads.sort(), filesystemWrite: [realOut], childProcess: false, gitDirExposed: false, network: "not-restricted-by-node-permission" });
  } else if (runner.isolation === "container") {
    const reads = (runner.readPaths ?? []).map((p) => resolve(realRoot, p));
    for (const p of reads) if (!inside(realRoot, p) || p === realRoot || p.split(sep).includes(".git")) return blocked("readPaths must be declared inputs, never the repository root or the git directory");
    command = "docker";
    const net = "none"; // loopback service networks are refused by the contract validator; never host networking
    args = ["run", "--rm", "--network", net, "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
      ...reads.flatMap((p) => ["-v", `${p}:/work/${p.slice(realRoot.length + 1).split(sep).join("/")}:ro`]),
      "-v", `${realOut}:/out`, "-w", "/work", ...Object.keys(env).flatMap((n) => ["-e", n]),
      runner.image, runner.executable, ...runner.argv];
    isolated = true;
    Object.assign(controls, { network: "none", filesystemRead: reads.sort(), filesystemWrite: [realOut], gitDirExposed: false, image: runner.image });
  }

  const started = Date.now();
  return await new Promise((resolveRun) => {
    let out = "";
    let err = "";
    let bytes = 0;
    let timedOut = false;
    let overflow = false;
    const child = spawnImpl(command, args, { cwd, env, shell: false, windowsHide: true, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
    const take = (which) => (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_OUTPUT_BYTES) { overflow = true; killTree(child); return; }
      if (which === "out") out += chunk; else err += chunk;
    };
    child.stdout.on("data", take("out"));
    child.stderr.on("data", take("err"));
    const timer = setTimeout(() => { timedOut = true; killTree(child); }, runner.timeoutMs);
    const done = (code, error) => {
      clearTimeout(timer);
      // descendants left behind by a finished runner must not outlive it (POSIX process group; on Windows an orphan
      // whose parent already exited is not reachable by taskkill /T: residual risk, local ledger is circuit evidence only)
      if (process.platform !== "win32" && child.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* group gone */ } }
      const base = { executed: true, exitCode: code, stdout: out, stderr: err, durationMs: Date.now() - started, controls, isolated, tier: runner.isolation, executableDigest: exeDigest, envNames: controls.envNames, outDir: realOut };
      if (error) return resolveRun({ ...base, status: "BLOCKED", reasons: [`runner could not start: ${String(error.code ?? error.message).slice(0, 80)}`] });
      if (timedOut) return resolveRun({ ...base, status: "BLOCKED", reasons: [`runner exceeded its ${runner.timeoutMs}ms timeout and was killed`] });
      if (overflow) return resolveRun({ ...base, status: "BLOCKED", reasons: ["runner output exceeded the capture bound and was killed"] });
      resolveRun({ ...base, status: "RAN", reasons: [] });
    };
    child.on("error", (e) => done(null, e));
    child.on("close", (code) => done(code, null));
  });
}

/** Evidence labels only the controls the tier really enforced (RF-15). */
export const describeIsolation = (r) => ({ tier: r.tier, isolated: Boolean(r.isolated), label: r.isolated ? "isolated" : "restricted (not isolated)", controls: r.controls });
