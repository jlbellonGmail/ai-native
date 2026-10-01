import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(here, "migrate-inventory.mjs");

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function makeSyntheticHashDb(dir) {
  // Template's own blobs are LF (verified against the real repo in
  // parity/hash-db/hash-db.json); the synthetic DB mirrors that.
  const unchangedLf = "line one\nline two\n";
  const modifiedOriginalLf = "original content\n";
  const db = {
    schemaVersion: 1,
    tags: {
      "v9.9.0": {
        commit: "0".repeat(40),
        fileCount: 2,
        files: {
          "unchanged.md": sha256(unchangedLf),
          "modified.md": sha256(modifiedOriginalLf),
        },
      },
    },
  };
  const dbPath = join(dir, "hash-db.json");
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
  return dbPath;
}

function run(args) {
  return execFileSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8" });
}

test("CRLF normalization: a file identical to the template except for line endings is IDENTICAL_TO_TEMPLATE, not MODIFIED", () => {
  const work = mkdtempSync(join(tmpdir(), "migrate-inv-"));
  try {
    const dbDir = join(work, "db");
    mkdirSync(dbDir);
    const dbPath = makeSyntheticHashDb(dbDir);

    const target = join(work, "target");
    mkdirSync(target);
    // Same content as the Hash DB's unchanged.md, but CRLF on disk — this
    // is exactly the Windows-checkout scenario found against the real
    // gi-common-persons repo (SESSION-CONTEXT.md, M1.2 entry).
    writeFileSync(join(target, "unchanged.md"), "line one\r\nline two\r\n");
    writeFileSync(join(target, "modified.md"), "totally different content\n");
    writeFileSync(join(target, "local-only.md"), "never existed in template\n");

    const out = run(["--target", target, "--hash-db", dbPath, "--json"]);
    const report = JSON.parse(out);

    const byPath = Object.fromEntries(report.files.map((f) => [f.path, f]));
    assert.equal(byPath["unchanged.md"].classification, "IDENTICAL_TO_TEMPLATE");
    assert.deepEqual(byPath["unchanged.md"].matchedTags, ["v9.9.0"]);
    assert.equal(byPath["modified.md"].classification, "MODIFIED_FROM_TEMPLATE");
    assert.equal(byPath["local-only.md"].classification, "LOCAL");

    assert.equal(report.counts.IDENTICAL_TO_TEMPLATE, 1);
    assert.equal(report.counts.MODIFIED_FROM_TEMPLATE, 1);
    assert.equal(report.counts.LOCAL, 1);
    assert.equal(report.counts.UNKNOWN, 0);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("never writes inside --target (read-only contract)", () => {
  const work = mkdtempSync(join(tmpdir(), "migrate-inv-"));
  try {
    const dbDir = join(work, "db");
    mkdirSync(dbDir);
    const dbPath = makeSyntheticHashDb(dbDir);

    const target = join(work, "target");
    mkdirSync(target);
    writeFileSync(join(target, "a.md"), "anything\n");

    const filesBefore = new Set(require_fs_readdir(target));

    run(["--target", target, "--hash-db", dbPath, "--json"]);

    const filesAfter = new Set(require_fs_readdir(target));
    assert.deepEqual(filesBefore, filesAfter, "migrate-inventory.mjs must not add/remove files under --target");

    function require_fs_readdir(dir) {
      // local helper, avoids importing fs twice at module scope for one call
      return execFileSync(process.execPath, ["-e", `console.log(JSON.stringify(require('fs').readdirSync(${JSON.stringify(dir)})))`], { encoding: "utf8" }).trim();
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("declaredVersion comes from scripts/template-starter-manifest.json when present", () => {
  const work = mkdtempSync(join(tmpdir(), "migrate-inv-"));
  try {
    const dbDir = join(work, "db");
    mkdirSync(dbDir);
    const dbPath = makeSyntheticHashDb(dbDir);

    const target = join(work, "target");
    mkdirSync(join(target, "scripts"), { recursive: true });
    writeFileSync(
      join(target, "scripts", "template-starter-manifest.json"),
      JSON.stringify({ schemaVersion: 2, templateVersion: "v2.0.5" }),
    );

    const report = JSON.parse(run(["--target", target, "--hash-db", dbPath, "--json"]));
    assert.equal(report.declaredVersion, "v2.0.5");
    assert.equal(report.manifestSchemaVersion, 2);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});

test("PAR-MIGRATE-CLASSIFY regression guard: unreadable directories are skipped and reported, not fatal", () => {
  const work = mkdtempSync(join(tmpdir(), "migrate-inv-"));
  try {
    const dbDir = join(work, "db");
    mkdirSync(dbDir);
    const dbPath = makeSyntheticHashDb(dbDir);

    const target = join(work, "target");
    const locked = join(target, "locked");
    mkdirSync(locked, { recursive: true });
    writeFileSync(join(target, "readable.md"), "fine\n");

    if (process.platform !== "win32") {
      // chmod 000 reliably blocks readdir on POSIX; on Windows this is a
      // no-op (ACLs work differently), so this assertion only runs where
      // it is meaningful. The real-world regression (EPERM on a locked
      // pytest temp dir) was found and fixed on Windows; this still
      // exercises the same try/catch path in walk().
      chmodSync(locked, 0o000);
    }

    const report = JSON.parse(run(["--target", target, "--hash-db", dbPath, "--json"]));
    assert.ok(report.files.some((f) => f.path === "readable.md"));
    assert.equal(report.counts.UNKNOWN, 0, "a locked directory must not surface as UNKNOWN files");

    if (process.platform !== "win32") {
      assert.ok(report.unreadableDirs.length >= 1);
      chmodSync(locked, 0o755); // restore so rmSync can clean up
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
