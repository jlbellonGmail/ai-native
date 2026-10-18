# notes-api

Tiny notes HTTP API (fixture). No runtime dependencies; in-memory storage.

Run: `npm start` (PORT, default 3000). Test: `npm test`.

Endpoints: `GET /health`, `GET|POST /notes`, `GET|DELETE /notes/:id`.
Limits: title up to 120 chars, body up to 10,000, request up to 64 KiB.
Known limits: data is lost on restart; no authentication; no rate limiting.
