import { test } from "node:test";
import assert from "node:assert/strict";
import { assertUnreleased, parseReleaseLines } from "./assert-unreleased.mjs";

// gh stub: returns the `id<TAB>draft<TAB>tag` lines `gh api --paginate --jq` would print
const gh = (lines, status = 0) => () => ({ status, stdout: lines.join("\n"), stderr: status ? "boom" : "" });

test("no release for the tag: ok", () => {
  assert.deepEqual(assertUnreleased({ tag: "v3.0.0", repo: "o/r", gh: gh([]) }).errors, []);
  assert.equal(assertUnreleased({ tag: "v3.0.0", repo: "o/r", gh: gh(["1\tfalse\tv3.0.0-rc.2", "2\tfalse\tv3.0.0-rc.1"]) }).ok, true, "other tags (even with the same prefix) do not count");
});

test("a published release for the tag blocks a second publication", () => {
  const r = assertUnreleased({ tag: "v3.0.0", repo: "o/r", gh: gh(["7\tfalse\tv3.0.0"]) });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /already published/);
});

test("a leftover DRAFT for the tag blocks too and says how to recover", () => {
  const r = assertUnreleased({ tag: "v3.0.0", repo: "o/r", gh: gh(["9\ttrue\tv3.0.0"]) });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /draft/i);
  assert.match(r.errors[0], /delete/i);
});

test("a published release AND a stray draft are both reported (the rc.2 incident)", () => {
  const r = assertUnreleased({ tag: "v3.0.0-rc.2", repo: "o/r", gh: gh(["403951323\tfalse\tv3.0.0-rc.2", "403952697\ttrue\tv3.0.0-rc.2"]) });
  assert.equal(r.errors.length, 2);
});

test("fails closed when the releases cannot be listed", () => {
  const r = assertUnreleased({ tag: "v3.0.0", repo: "o/r", gh: gh([], 1) });
  assert.equal(r.ok, false);
  assert.match(r.errors[0], /cannot list releases/);
});

test("rejects an unsafe tag or repo before calling gh", () => {
  let called = false;
  const spy = () => { called = true; return { status: 0, stdout: "", stderr: "" }; };
  assert.equal(assertUnreleased({ tag: "v3.0.0; rm -rf /", repo: "o/r", gh: spy }).ok, false);
  assert.equal(assertUnreleased({ tag: "v3.0.0", repo: "o/r r", gh: spy }).ok, false);
  assert.equal(called, false);
});

test("parseReleaseLines ignores blank and malformed lines", () => {
  assert.deepEqual(parseReleaseLines("1\tfalse\tv1\n\nnope\n2\ttrue\tv2\n"), [{ id: "1", draft: false, tag: "v1" }, { id: "2", draft: true, tag: "v2" }]);
});
