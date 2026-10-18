// M5.2 offline evidence: in-process network guard, loaded with NODE_OPTIONS="--require <this file>" so child node processes
// (the bootstrap runs the release in a child) inherit it. It is NOT OS-level isolation: it blocks and RECORDS every attempt
// made through net/tls/dns/http(s)/fetch and through spawning network CLIs (gh, curl, wget, ssh). Used where no real
// isolation is available (Windows runner); the Linux leg uses `docker run --network none` (see offline-real.mjs).
// Attempts are appended (one JSON line per process) to $NET_GUARD_LOG at process exit.
"use strict";
const fs = require("node:fs");
const net = require("node:net");
const dns = require("node:dns");
const cp = require("node:child_process");
const path = require("node:path");

const attempts = [];
const note = (kind, detail) => attempts.push({ kind, detail: String(detail).slice(0, 120) });
const blocked = (what) => Object.assign(new Error(`network disabled by net-guard (${what})`), { code: "ENETGUARD" });

const origConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const o = args[0];
  note("net.connect", typeof o === "object" && o ? `${o.host ?? o.path ?? ""}:${o.port ?? ""}` : o);
  const err = blocked("net.connect");
  process.nextTick(() => this.destroy(err));
  return this;
};
void origConnect;
for (const fn of ["lookup", "resolve", "resolve4", "resolve6"]) {
  if (typeof dns[fn] === "function") dns[fn] = (host, ...rest) => { note(`dns.${fn}`, host); const cb = rest.find((x) => typeof x === "function"); const err = blocked(`dns.${fn}`); if (cb) process.nextTick(cb, err); else throw err; };
}
if (typeof globalThis.fetch === "function") globalThis.fetch = (input) => { note("fetch", typeof input === "string" ? input : input?.url ?? input); return Promise.reject(blocked("fetch")); };

const NETWORK_CLIS = new Set(["gh", "curl", "wget", "ssh"]);
for (const fn of ["spawn", "spawnSync", "execFile", "execFileSync", "exec", "execSync"]) {
  const orig = cp[fn];
  cp[fn] = function (command, ...rest) {
    const bin = path.basename(String(command).trim().split(/\s+/)[0]).replace(/\.(exe|cmd)$/i, "");
    if (NETWORK_CLIS.has(bin)) { note(`child_process.${fn}`, command); throw blocked(`${fn} ${bin}`); }
    return orig.call(this, command, ...rest);
  };
}

process.on("exit", () => {
  if (process.env.NET_GUARD_LOG) fs.appendFileSync(process.env.NET_GUARD_LOG, `${JSON.stringify({ pid: process.pid, attempts })}\n`);
});
