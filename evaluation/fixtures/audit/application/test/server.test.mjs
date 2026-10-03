import test from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.mjs";

async function withServer(fn) {
  const server = buildServer().listen(0);
  await new Promise((r) => server.once("listening", r));
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test("health, create, read and delete a note", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/health`)).status, 200);
    const created = await fetch(`${base}/notes`, { method: "POST", body: JSON.stringify({ title: "hi" }) });
    assert.equal(created.status, 201);
    const { id } = await created.json();
    assert.equal((await fetch(`${base}/notes/${id}`)).status, 200);
    assert.equal((await fetch(`${base}/notes/${id}`, { method: "DELETE" })).status, 204);
    assert.equal((await fetch(`${base}/notes/${id}`)).status, 404);
  });
});

test("invalid input is a 400 and an oversized payload is a 413", async () => {
  await withServer(async (base) => {
    assert.equal((await fetch(`${base}/notes`, { method: "POST", body: "{not json" })).status, 400);
    assert.equal((await fetch(`${base}/notes`, { method: "POST", body: JSON.stringify({}) })).status, 400);
    assert.equal((await fetch(`${base}/notes`, { method: "POST", body: "x".repeat(70_000) })).status, 413);
  });
});
