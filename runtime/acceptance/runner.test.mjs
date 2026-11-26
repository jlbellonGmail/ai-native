import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runRunner, probeTier, tierSatisfies, describeIsolation, resolveExecutable, groupKillTarget } from "./runner.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "ai-run-"));
  mkdirSync(join(root, ".git"));
  writeFileSync(join(root, ".git", "HEAD"), "ref: refs/heads/x\n");
  mkdirSync(join(root, "t"));
  writeFileSync(join(root, "t/ok.mjs"), 'console.log("TAP version 13\\nok 1 - c1\\n1..1");');
  writeFileSync(join(root, "t/sleep.mjs"), "setInterval(()=>{},1000);");
  writeFileSync(join(root, "t/big.mjs"), 'const s="x".repeat(1<<20);for(let i=0;i<8;i++)process.stdout.write(s);setInterval(()=>{},1000);');
  writeFileSync(join(root, "t/env.mjs"), "console.log(JSON.stringify(Object.keys(process.env).sort()));");
  writeFileSync(join(root, "t/git.mjs"), `import {readFileSync} from "node:fs";
let r="readable";try{readFileSync(process.cwd()+"/.git/HEAD");}catch(e){r=e.code;}console.log(r);`);
  writeFileSync(join(root, "t/child.mjs"), `import {spawnSync} from "node:child_process";
let r="spawned";try{spawnSync(process.execPath,["-p","1"]);}catch(e){r=e.code;}console.log(r);`);
  return root;
}
const runner = (over = {}) => ({ id: "r", executable: "node", argv: ["t/ok.mjs"], cwd: ".", format: "tap13", timeoutMs: 20000, isolation: "restricted", env: ["SystemRoot"], ...over });
const out = (root) => join(root, "..", `out-${Math.random().toString(36).slice(2)}`);

test("restricted: runs shell-free, labelled NOT isolated, minimal env", async () => {
  const root = fixture();
  try {
    const r = await runRunner({ root, runner: runner({ argv: ["t/env.mjs"] }), outDir: out(root), hostEnv: { SystemRoot: process.env.SystemRoot ?? "", SECRET_TOKEN: "s3cr3t", PATH: "/x" } });
    assert.equal(r.status, "RAN");
    const keys = JSON.parse(r.stdout.trim());
    assert.ok(!keys.includes("SECRET_TOKEN"), "non-allowlisted secret never reaches the process");
    assert.ok(!keys.includes("SECRET_TOKEN") && (process.platform === "win32" || !keys.includes("PATH")), "only allowlisted names reach the process (Windows adds OS baseline names)");
    assert.ok(keys.includes("ACCEPTANCE_OUT_DIR"));
    assert.equal(describeIsolation(r).isolated, false);
    assert.match(describeIsolation(r).label, /not isolated/);
    assert.equal(r.controls.shell, false);
    assert.ok(!JSON.stringify(r.controls).includes("s3cr3t"));
    const ok = await runRunner({ root, runner: runner(), outDir: out(root) });
    assert.match(ok.stdout, /ok 1 - c1/);
    assert.match(ok.executableDigest, /^[0-9a-f]{64}$/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("undeclared requests are BLOCKED without fallback (RF-10)", async () => {
  const root = fixture();
  try {
    for (const request of [{ argv: ["t/ok.mjs", "--extra"] }, { executable: "bash" }, { env: ["PATH", "HOME"] }, { cwd: ".." }]) {
      const r = await runRunner({ root, runner: runner(), outDir: out(root), request });
      assert.equal(r.status, "BLOCKED");
      assert.equal(r.executed, false);
    }
    assert.equal((await runRunner({ root, runner: runner({ executable: "sh", argv: ["-c", "true"] }), outDir: out(root) })).status, "BLOCKED");
    assert.equal((await runRunner({ root, runner: runner({ argv: ["-e", "0"] }), outDir: out(root) })).status, "BLOCKED");
    assert.equal((await runRunner({ root, runner: runner({ cwd: "nope" }), outDir: out(root) })).status, "BLOCKED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("timeout kills the process and output bound blocks", async () => {
  const root = fixture();
  try {
    const t = await runRunner({ root, runner: runner({ argv: ["t/sleep.mjs"], timeoutMs: 800 }), outDir: out(root) });
    assert.equal(t.status, "BLOCKED");
    assert.match(t.reasons[0], /timeout/);
    const b = await runRunner({ root, runner: runner({ argv: ["t/big.mjs"] }), outDir: out(root) });
    assert.equal(b.status, "BLOCKED");
    assert.match(b.reasons[0], /output exceeded/);
    assert.ok(b.stdout.length <= 4 * 1024 * 1024 + 1024 * 1024);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("node-permission: reports enforced controls; git dir and child processes unreachable", async () => {
  const root = fixture();
  try {
    assert.equal(probeTier("node-permission").available, true);
    const r = await runRunner({ root, runner: runner({ isolation: "node-permission", argv: ["t/git.mjs"] }), outDir: out(root) });
    assert.equal(r.status, "RAN");
    assert.equal(r.stdout.trim(), "ERR_ACCESS_DENIED", "git common dir unreachable");
    assert.equal(r.isolated, true);
    assert.equal(r.controls.childProcess, false);
    assert.equal(r.controls.gitDirExposed, false);
    const c = await runRunner({ root, runner: runner({ isolation: "node-permission", argv: ["t/child.mjs"] }), outDir: out(root) });
    assert.equal(c.stdout.trim(), "ERR_ACCESS_DENIED");
    // restricted does NOT block the same read: proves the tiers differ
    const rr = await runRunner({ root, runner: runner({ argv: ["t/git.mjs"] }), outDir: out(root) });
    // argv may never name the git directory, nor widen the permission model (independent review F5)
    assert.equal((await runRunner({ root, runner: runner({ isolation: "node-permission", argv: ["t/git.mjs", ".git/HEAD"] }), outDir: out(root) })).status, "BLOCKED");
    assert.equal((await runRunner({ root, runner: runner({ isolation: "node-permission", argv: ["--allow-fs-read=*", "t/git.mjs"] }), outDir: out(root) })).status, "BLOCKED");
    assert.equal(rr.stdout.trim(), "readable");
    // readPaths may never expose the git dir or root
    const bad = await runRunner({ root, runner: runner({ isolation: "node-permission", readPaths: [".git"] }), outDir: out(root) });
    assert.equal(bad.status, "BLOCKED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("unavailable tier or a run below the case minimum is BLOCKED before spawn, no fallback (RF-16, RF-33)", async () => {
  const root = fixture();
  try {
    let spawned = false;
    const spawnImpl = () => { spawned = true; throw new Error("must not spawn"); };
    const noContainer = await runRunner({ root, runner: runner({ isolation: "container", image: "x@sha256:" + "a".repeat(64) }), outDir: out(root), probe: () => ({ available: false, reason: "no container runtime is available" }), spawnImpl });
    assert.equal(noContainer.status, "BLOCKED");
    assert.match(noContainer.reasons[0], /no fallback/);
    const noPerm = await runRunner({ root, runner: runner({ isolation: "node-permission" }), outDir: out(root), probe: () => ({ available: false, reason: "Node permission model is not supported by this runtime" }), spawnImpl });
    assert.equal(noPerm.status, "BLOCKED");
    const below = await runRunner({ root, runner: runner(), outDir: out(root), minTier: "node-permission", spawnImpl });
    assert.equal(below.status, "BLOCKED");
    assert.match(below.reasons[0], /below the case minimum/);
    assert.equal(spawned, false);
    assert.equal(tierSatisfies("container", "restricted"), true);
    assert.equal(tierSatisfies("restricted", "container"), false);
    // real host without a docker daemon: the probe itself blocks
    if (!probeTier("container").available) {
      const real = await runRunner({ root, runner: runner({ isolation: "container", image: "x@sha256:" + "a".repeat(64) }), outDir: out(root) });
      assert.equal(real.status, "BLOCKED");
    }
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("container tier builds a network-none, read-only, git-free invocation", async () => {
  const root = fixture();
  try {
    let seen;
    const spawnImpl = (cmd, args) => {
      seen = { cmd, args };
      const { EventEmitter } = require_events();
      const c = new EventEmitter();
      c.stdout = new EventEmitter(); c.stderr = new EventEmitter(); c.pid = 1;
      setImmediate(() => c.emit("close", 0));
      return c;
    };
    mkdirSync(join(root, "data"));
    const img = "reg/x@sha256:" + "b".repeat(64);
    // the fake child reports pid 1: no signal may reach a real process (kill(-1) would hit every process of the user)
    const kills = [];
    const realKill = process.kill;
    process.kill = (pid, sig) => { kills.push(pid); return true; };
    let r;
    try {
      r = await runRunner({ root, runner: runner({ isolation: "container", image: img, readPaths: ["data"] }), outDir: out(root), probe: () => ({ available: true }), spawnImpl });
    } finally { process.kill = realKill; }
    assert.deepEqual(kills, []);
    assert.equal(r.status, "RAN");
    assert.equal(seen.cmd, "docker");
    const j = seen.args.join(" ");
    assert.match(j, /--network none/);
    assert.match(j, /--read-only/);
    assert.ok(!j.includes(".git"));
    assert.equal(r.controls.network, "none");
    assert.equal(r.controls.gitDirExposed, false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

import { EventEmitter } from "node:events";
function require_events() { return { EventEmitter }; }

test("executable resolution is repository-scoped", () => {
  const root = fixture();
  try {
    assert.equal(resolveExecutable("node", root), process.execPath);
    assert.equal(resolveExecutable("t/missing.exe", root), null);
    assert.equal(existsSync(resolveExecutable("t/ok.mjs", root)), true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("process-group kill never targets pid 0, 1 or a missing pid", () => {
  for (const pid of [undefined, null, 0, 1, -5, 1.5, "123", NaN]) assert.equal(groupKillTarget(pid), null, String(pid));
  assert.equal(groupKillTarget(2), -2);
  assert.equal(groupKillTarget(4242), -4242);
});

test("independent re-review N3: a bare argv token or cwd can never reach the git directory", async () => {
  const root = fixture();
  try {
    writeFileSync(join(root, ".git", "x"), 'console.log("TAP version 13\\nok 1 - c1\\n1..1");');
    const viaCwd = await runRunner({ root, runner: runner({ cwd: ".git", argv: ["x"] }), outDir: out(root) });
    assert.equal(viaCwd.status, "BLOCKED");
    assert.equal(viaCwd.executed, false);
    assert.match(viaCwd.reasons.join(), /cwd names the git directory/);
    const upper = await runRunner({ root, runner: runner({ cwd: ".GIT", argv: ["x"] }), outDir: out(root) });
    assert.equal(upper.status, "BLOCKED");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// descendants: a grandchild started by the runner must not outlive it (bounded waits, no real kill outside the tree)
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
async function goneWithin(pid, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if (!alive(pid)) return true; await new Promise((r) => setTimeout(r, 100)); }
  return !alive(pid);
}
const GRANDCHILD = (exitParent) => `import {spawn} from "node:child_process";import {writeFileSync} from "node:fs";
const g=spawn(process.execPath,["-e","setInterval(()=>{},1000)"],{stdio:"ignore"});
writeFileSync(process.env.ACCEPTANCE_OUT_DIR+"/grandchild.pid",String(g.pid));
${exitParent ? "console.log(\"TAP version 13\\nok 1 - c1\\n1..1\");process.exit(0);" : "setInterval(()=>{},1000);"}`;

test("timeout kills the whole tree: the grandchild does not survive the runner (Linux and Windows)", async () => {
  const root = fixture();
  const o = out(root);
  try {
    writeFileSync(join(root, "t/tree.mjs"), GRANDCHILD(false));
    const r = await runRunner({ root, runner: runner({ argv: ["t/tree.mjs"], timeoutMs: 3000 }), outDir: o });
    assert.equal(r.status, "BLOCKED");
    assert.match(r.reasons[0], /timeout/);
    const pid = Number(readFileSync(join(o, "grandchild.pid"), "utf8"));
    assert.ok(Number.isInteger(pid) && pid > 1);
    assert.equal(await goneWithin(pid, 10000), true, `grandchild ${pid} still alive after the timeout kill`);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(o, { recursive: true, force: true }); }
});

test("POSIX: a grandchild left behind by a runner that exited is killed with its process group", { skip: process.platform === "win32" && "Windows: an orphan whose parent exited is not reachable by taskkill /T (documented residual)" }, async () => {
  const root = fixture();
  const o = out(root);
  try {
    writeFileSync(join(root, "t/orphan.mjs"), GRANDCHILD(true));
    const r = await runRunner({ root, runner: runner({ argv: ["t/orphan.mjs"], timeoutMs: 15000 }), outDir: o });
    assert.equal(r.status, "RAN");
    const pid = Number(readFileSync(join(o, "grandchild.pid"), "utf8"));
    assert.equal(await goneWithin(pid, 10000), true, `orphan ${pid} outlived the runner`);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(o, { recursive: true, force: true }); }
});

test("a declared result file is the structured output; the process stdout stays a log; a missing file is BLOCKED", async () => {
  const root = fixture();
  const o = out(root);
  try {
    writeFileSync(join(root, "t/res.mjs"), 'import {writeFileSync} from "node:fs";console.log("noise that is not TAP");writeFileSync(process.argv[2],"TAP version 13\\nok 1 - c1\\n1..1\\n");');
    const r = await runRunner({ root, runner: runner({ argv: ["t/res.mjs", "{resultFile}"], resultFile: "result.tap" }), outDir: o });
    assert.equal(r.status, "RAN", JSON.stringify(r.reasons));
    assert.equal(r.stdout, "TAP version 13\nok 1 - c1\n1..1\n");
    assert.match(r.log, /noise that is not TAP/);
    // the token resolves inside the runner-owned output directory, never inside the repository
    assert.equal(existsSync(join(root, "{resultFile}")), false);
    writeFileSync(join(root, "t/nores.mjs"), 'console.log("TAP version 13\\nok 1 - c1\\n1..1");');
    const m = await runRunner({ root, runner: runner({ argv: ["t/nores.mjs", "{resultFile}"], resultFile: "result.tap" }), outDir: out(root) });
    assert.equal(m.status, "BLOCKED");
    assert.match(m.reasons[0], /no readable structured result file/);
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(o, { recursive: true, force: true }); }
});
