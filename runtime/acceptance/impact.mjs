// Public-contract change classification, immutable reference verification and
// impact selection (spec 001 RF-5, RF-7..RF-11, NF-2). No LLM, no inference:
// a change is internal only when no changed path touches the declared public
// contract inventory; a public change requires an explicit declaration whose
// references resolve to exact bytes (commit + path + SHA-256).
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { normalizeRepoPath } from "./manifest.mjs";

const COMPAT = new Set(["compatible", "incompatible", "unknown"]);
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Git-backed reference resolver. A ref is { commit, path, sha256 }.
 * Never accepts a mutable alias: the commit must be a full 40-hex id that
 * git itself resolves to a commit object; bytes must match the digest.
 */
export function gitRefResolver(cwd) {
  const git = (args) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"], maxBuffer: 8 * 1024 * 1024 });
  return function resolve(ref) {
    try {
      if (!HEX40.test(ref.commit)) return { ok: false, reason: "reference commit is not an immutable 40-hex id" };
      const kind = git(["cat-file", "-t", ref.commit]).toString("utf8").trim();
      if (kind !== "commit") return { ok: false, reason: "reference commit is unavailable or not a commit" };
      const full = git(["rev-parse", "--verify", `${ref.commit}^{commit}`]).toString("utf8").trim();
      if (full !== ref.commit) return { ok: false, reason: "reference commit does not resolve to itself" };
      const bytes = git(["show", `${ref.commit}:${ref.path}`]);
      if (sha256Hex(bytes) !== ref.sha256) return { ok: false, reason: "content digest mismatch" };
      return { ok: true };
    } catch {
      return { ok: false, reason: "reference unavailable" };
    }
  };
}

function checkRefShape(ref, label) {
  if (ref === null || typeof ref !== "object") return `${label} reference missing`;
  if (typeof ref.commit !== "string" || !HEX40.test(ref.commit)) return `${label} reference commit is not an immutable 40-hex id`;
  if (normalizeRepoPath(ref.path) === null) return `${label} reference path invalid`;
  if (typeof ref.sha256 !== "string" || !HEX64.test(ref.sha256)) return `${label} reference lacks a SHA-256 content digest`;
  return null;
}

/**
 * Validates one declaration against the graph and (optionally) resolves its
 * references. Returns { ok, errors }.
 */
export function validateDeclaration(graph, decl, resolveRef) {
  const errors = [];
  if (decl === null || typeof decl !== "object") return { ok: false, errors: ["declaration must be an object"] };
  const path = typeof decl.providerId === "string" && typeof decl.contractId === "string" ? graph.contractPath(decl.providerId, decl.contractId) : null;
  if (!graph.modules.includes(decl.providerId)) errors.push("unknown provider owner");
  else if (path === null) errors.push("contract is outside the provider's public contract registry");
  if (!COMPAT.has(decl.compatibility)) errors.push("unrecognized compatibility classification");
  for (const [k, label] of [["previousRef", "previous"], ["candidateRef", "candidate"]]) {
    const e = checkRefShape(decl[k], label);
    if (e) errors.push(e);
    else if (path !== null && normalizeRepoPath(decl[k].path) !== path) errors.push(`${label} reference path differs from the registered contract path`);
  }
  if (!errors.length) {
    const p = decl.previousRef;
    const c = decl.candidateRef;
    if (p.commit === c.commit && p.sha256 === c.sha256) errors.push("previous and candidate references are identical");
    if (p.sha256 === c.sha256) errors.push("previous and candidate contract bytes are identical");
  }
  if (!errors.length && resolveRef) {
    for (const [k, label] of [["previousRef", "previous"], ["candidateRef", "candidate"]]) {
      const r = resolveRef(decl[k]);
      if (!r.ok) errors.push(`${label} reference rejected: ${r.reason}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * @param {object} graph       result of buildGraph().graph
 * @param {string[]} changedPaths  repo-relative changed paths
 * @param {object[]} declarations  public contract change declarations
 * @param {(ref)=>{ok,reason?}} resolveRef  immutable reference verifier
 * @returns {{ status: "OK"|"BLOCKED", classification: "internal"|"public"|"blocked",
 *             impacts: object[], consumers: string[], errors: string[] }}
 */
export function analyzeImpact({ graph, changedPaths, declarations = [], resolveRef }) {
  const errors = [];
  const inventory = new Map(graph.contractEntries().map((e) => [e.path, e]));
  const touched = new Map(); // path -> entry
  for (const raw of changedPaths) {
    const p = normalizeRepoPath(raw);
    if (p === null) {
      errors.push("changed path is not a safe repository-relative path");
      continue;
    }
    if (inventory.has(p)) touched.set(p, inventory.get(p));
  }
  if (errors.length) return { status: "BLOCKED", classification: "blocked", impacts: [], consumers: [], errors: errors.sort() };
  if (touched.size === 0) return { status: "OK", classification: "internal", impacts: [], consumers: [], errors: [] };

  const byKey = new Map();
  for (const d of declarations) {
    const v = validateDeclaration(graph, d, resolveRef);
    if (!v.ok) errors.push(...v.errors.map((e) => `declaration ${String(d?.providerId).slice(0, 63)}/${String(d?.contractId).slice(0, 63)}: ${e}`));
    else byKey.set(`${d.providerId}/${d.contractId}`, d);
  }
  const impacts = [];
  for (const e of [...touched.values()].sort((a, b) => cmp(a.path, b.path))) {
    const d = byKey.get(`${e.moduleId}/${e.contractId}`);
    if (!d) {
      errors.push(`public contract changed without a valid declaration: ${e.moduleId}/${e.contractId}`);
      continue;
    }
    const breaking = d.compatibility !== "compatible";
    const consumers = graph.consumersOfContract(e.moduleId, e.contractId);
    impacts.push({
      providerId: e.moduleId,
      contractId: e.contractId,
      compatibility: d.compatibility,
      consumers,
      transitiveConsumers: graph.transitiveConsumers(e.moduleId).filter((c) => !consumers.includes(c)),
      requiredChecks: breaking ? ["cross-compatibility", "cross-regression"] : ["cross-regression"],
    });
  }
  if (errors.length) return { status: "BLOCKED", classification: "blocked", impacts: [], consumers: [], errors: [...new Set(errors)].sort() };
  const consumers = [...new Set(impacts.flatMap((i) => i.consumers))].sort(cmp);
  return { status: "OK", classification: "public", impacts, consumers, errors: [] };
}
