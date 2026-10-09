#!/usr/bin/env node
// M5.2: OFFLINE evidence with the network actually unavailable (not just the --offline flag).
//   node evaluation/m52/offline-real.mjs --tag v3.0.0-rc.2 --mode docker|guard --out <evidence.json>
//   docker : the bootstrap runs inside `docker run --network none` (OS-level isolation; Linux container).
//   guard  : the bootstrap runs on the host with evaluation/m52/net-guard.cjs, which blocks AND counts every network
//            attempt (used where no Linux container is available, e.g. the Windows runner; weaker than docker, labelled so).
// Online phase (network available): download the PUBLISHED release, create a consumer (init) and populate a cache
// (sync --require-attestation). Offline phase: the same consumer with that cache (offline WITH cache) and with an empty
// cache (offline WITHOUT cache, must fail closed), plus the online-mode commands with no network (must fail closed).
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const value = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : null);
const tag = value("--tag");
const mode = value("--mode") ?? "docker";
const out = value("--out");
const image = value("--image") ?? "node:24-bookworm";
if (!tag || !out || !["docker", "guard"].includes(mode)) throw new Error("usage: offline-real.mjs --tag <vX> --mode docker|guard --out <file>");
const repo = "jlbellonGmail/ai-native";
const cli = join(repoRoot, "runtime", "bootstrap", "cli.mjs");

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", input: "", maxBuffer: 64 * 1024 * 1024, ...opts });
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };

const work = mkdtempSync(join(tmpdir(), "ai-native-offline-"));
const dl = join(work, "dl"), proj = join(work, "proj"), cacheFull = join(work, "cache-full"), cacheEmpty = join(work, "cache-empty"), guardLog = join(work, "net-guard.log");
for (const d of [dl, proj, cacheFull, cacheEmpty]) mkdirSync(d, { recursive: true });

// ---- online phase (host, network available) ----
const d = sh("gh", ["release", "download", tag, "-R", repo, "-D", dl, "-p", "*.tar.gz", "-p", "platform.json"]);
if (d.status !== 0) throw new Error(`gh release download failed: ${d.stderr}`);
const platform = JSON.parse(readFileSync(join(dl, "platform.json"), "utf8"));
const bundle = join(dl, `ai-native-${tag}.tar.gz`);
const channel = tag.includes("-") ? ["--channel", "rc"] : [];
const hostCli = (args) => sh("node", [cli, ...args, "--project", proj, "--cache", cacheFull, "--json"]);
const init = hostCli(["init", "--bundle", bundle, "--repo", `github:${repo}`, "--profile", "factory", ...channel]);
if (init.status !== 0) throw new Error(`init failed: ${init.stdout}${init.stderr}`);
const sync = hostCli(["sync", "--require-attestation"]);
if (sync.status !== 0) throw new Error(`online sync failed: ${sync.stdout}${sync.stderr}`);

// ---- offline phase ----
// `run` takes the release args after `--`: common options must come before it
function withCommon(args, project, cache) {
  const i = args.indexOf("--");
  const head = i === -1 ? args : args.slice(0, i);
  const tail = i === -1 ? [] : args.slice(i);
  return [...head, "--project", project, "--cache", cache, "--json", ...tail];
}
function offline(cache, args) {
  if (mode === "docker") {
    // on a Linux host the container must not leave root-owned files the runner user cannot clean up
    const user = typeof process.getuid === "function" ? ["--user", `${process.getuid()}:${process.getgid()}`] : [];
    const r = sh("docker", ["run", "--rm", "--network", "none", ...user, "-v", `${repoRoot}:/platform:ro`, "-v", `${proj}:/work/proj`, "-v", `${cache}:/cache`, "-w", "/work/proj", image, "node", "/platform/runtime/bootstrap/cli.mjs", ...withCommon(args, "/work/proj", "/cache")]);
    return { exit: r.status, json: parse(r.stdout), stderr: r.stderr.slice(0, 300) };
  }
  const env = { ...process.env, NODE_OPTIONS: `--require ${join(repoRoot, "evaluation", "m52", "net-guard.cjs")}`, NET_GUARD_LOG: guardLog };
  const r = sh("node", [cli, ...withCommon(args, proj, cache)], { env });
  return { exit: r.status, json: parse(r.stdout), stderr: r.stderr.slice(0, 300) };
}
const guardAttempts = () => (existsSync(guardLog) ? readFileSync(guardLog, "utf8").trim().split("\n").flatMap((l) => parse(l)?.attempts ?? []) : []);

const cases = [];
function check(id, title, cache, args, expectation) {
  const before = mode === "guard" ? guardAttempts().length : 0;
  const r = offline(cache, args);
  const attempts = mode === "guard" ? guardAttempts().length - before : null;
  const verdict = expectation(r, attempts);
  cases.push({ id, title, args: args.join(" "), exit: r.exit, status: r.json?.status ?? null, state: r.json?.state ?? null, revocation: r.json?.revocation ?? null, errors: (r.json?.errors ?? []).slice(0, 2), stderr: r.json ? undefined : (r.stderr ?? "").trim().slice(0, 300), warnings: (r.json?.warnings ?? []).slice(0, 2), networkAttempts: attempts, ok: verdict.ok, expected: verdict.expected });
}
const passing = (r) => r.exit === 0 && ["PASS", "PASS_WITH_WARNINGS"].includes(r.json?.status);
const failsClosed = (r) => r.exit !== 0 && !["PASS", "PASS_WITH_WARNINGS"].includes(r.json?.status ?? "");

// 0. proof the network is really unavailable in the offline environment
if (mode === "docker") {
  const p = sh("docker", ["run", "--rm", "--network", "none", image, "node", "-e", "fetch('https://github.com').then(()=>process.exit(0)).catch((e)=>{console.log(e.cause?.code||e.message);process.exit(3)})"]);
  cases.push({ id: "net-proof", title: "the container has no network (fetch to github.com fails)", exit: p.status, detail: p.stdout.trim(), ok: p.status === 3, expected: "fetch fails" });
} else {
  const p = sh("node", ["--require", join(repoRoot, "evaluation", "m52", "net-guard.cjs"), "-e", "fetch('https://github.com').then(()=>process.exit(0)).catch(()=>process.exit(3))"], { env: { ...process.env, NET_GUARD_LOG: guardLog } });
  cases.push({ id: "net-proof", title: "net-guard blocks fetch to github.com", exit: p.status, ok: p.status === 3, expected: "fetch blocked" });
}
// 1. offline WITH cache
check("with-cache/sync", "sync --offline with a populated cache", cacheFull, ["sync", "--offline"], (r, a) => ({ ok: passing(r) && r.json?.cacheHit === true && (a === null || a === 0), expected: "PASS, cacheHit, 0 network attempts" }));
check("with-cache/doctor", "doctor with cache", cacheFull, ["doctor"], (r, a) => ({ ok: passing(r) && (a === null || a === 0), expected: "PASS, 0 network attempts" }));
check("with-cache/status", "status --offline is READY and says revocation was NOT checked", cacheFull, ["status", "--offline"], (r, a) => ({ ok: passing(r) && r.json?.state === "READY" && r.json?.revocation === "NOT_CHECKED" && (a === null || a === 0), expected: "READY, revocation NOT_CHECKED, 0 network attempts" }));
check("with-cache/run", "run version from the cache", cacheFull, ["run", "--", "version"], (r) => ({ ok: r.exit === 0, expected: "exit 0" }));
// 2. offline WITHOUT cache: fail closed
check("no-cache/sync", "sync --offline with an empty cache fails closed", cacheEmpty, ["sync", "--offline"], (r) => ({ ok: failsClosed(r) && (r.json?.errors ?? []).length > 0, expected: "non-zero exit, not PASS, actionable error" }));
check("no-cache/status", "status --offline with an empty cache is not READY", cacheEmpty, ["status", "--offline"], (r) => ({ ok: r.json?.state !== "READY", expected: "state != READY" }));
check("no-cache/run", "run with an empty cache fails", cacheEmpty, ["run", "--", "version"], (r) => ({ ok: r.exit !== 0, expected: "non-zero exit" }));
// 3. online-mode commands with no network and a populated cache: fail closed, never silent PASS
// by design `sync` degrades with an explicit warning (the cached release is still verified against the lock digest); `status --check` is the strict one
check("no-network/sync", "sync (online mode) without network degrades with an EXPLICIT warning, never a silent PASS", cacheFull, ["sync", "--require-attestation"], (r) => ({ ok: r.json?.status === "PASS_WITH_WARNINGS" && (r.json?.warnings ?? []).some((w) => /NOT checked/i.test(w)), expected: "PASS_WITH_WARNINGS with a \"revocation status NOT checked\" warning" }));
check("no-network/status-check", "status --check without network fails closed (REVOCATION_UNKNOWN)", cacheFull, ["status", "--check"], (r) => ({ ok: failsClosed(r), expected: "non-zero exit, not PASS" }));

const evidence = {
  schemaVersion: 1,
  milestone: "M5.2",
  kind: "offline-real",
  release: { tag, commit: platform.commit, digest: platform.digest },
  checkout: spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim(),
  mode,
  isolation: mode === "docker" ? `docker run --network none (${image})` : "in-process net-guard (blocks and counts attempts; NOT OS-level isolation)",
  os: process.platform,
  node: process.version,
  date: new Date().toISOString(),
  cases,
  totals: { cases: cases.length, ok: cases.filter((c) => c.ok).length },
  status: cases.every((c) => c.ok) ? "PASS" : "FAIL",
};
writeFileSync(resolve(out), `${JSON.stringify(evidence, null, 2)}\n`);
try { rmSync(work, { recursive: true, force: true }); } catch { /* best effort: temp dir */ }
console.log(JSON.stringify({ status: evidence.status, mode, ...evidence.totals, failed: cases.filter((c) => !c.ok).map((c) => `${c.id}: exit=${c.exit} status=${c.status} state=${c.state} ${(c.errors ?? []).join(" | ")}${c.stderr ? ` stderr=${c.stderr}` : ""}`) }, null, 2));
process.exit(evidence.status === "PASS" ? 0 : 1);
