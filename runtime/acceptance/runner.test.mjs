import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runRunner, probeTier, tierSatisfies, describeIsolation, resolveExecutable } from "./runner.mjs";

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
    const r = await runRunner({ root, runner: runner({ isolation: "container", image: img, readPaths: ["data"] }), outDir: out(root), probe: () => ({ available: true }), spawnImpl });
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
