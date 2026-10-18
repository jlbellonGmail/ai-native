import { createServer } from "node:http";
import { createStore } from "./store.mjs";

const MAX_REQUEST_BYTES = 64 * 1024;

export function buildServer(store = createStore()) {
  return createServer(async (req, res) => {
    const send = (status, payload) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(payload));
    };
    try {
      const url = new URL(req.url, "http://localhost");
      const match = /^\/notes\/(\d+)$/.exec(url.pathname);
      if (url.pathname === "/health") return send(200, { status: "ok" });
      if (url.pathname === "/notes" && req.method === "GET") return send(200, store.list());
      if (url.pathname === "/notes" && req.method === "POST") {
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
          size += chunk.length;
          if (size > MAX_REQUEST_BYTES) return send(413, { error: "payload too large" });
          chunks.push(chunk);
        }
        return send(201, store.create(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}")));
      }
      if (match && req.method === "GET") {
        const note = store.get(Number(match[1]));
        return note ? send(200, note) : send(404, { error: "not found" });
      }
      if (match && req.method === "DELETE") return store.remove(Number(match[1])) ? send(204, {}) : send(404, { error: "not found" });
      return send(404, { error: "not found" });
    } catch (error) {
      if (error instanceof RangeError || error instanceof SyntaxError) return send(400, { error: error.message });
      return send(500, { error: "internal error" });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().listen(Number(process.env.PORT ?? 3000));
}
