# v4.1.0 candidate — historical PLATFORM audits (method 1.2)

Isolated audits run by a read-only subagent under the same identity as the builder: **not attested**. They are
evidence of the candidate's history, kept here (not in `.audit/reports/`) because they certify earlier SHAs and are
STALE for any later one; `.audit/reports/` receives only the audit of the final SHA, in a commit that touches only
`.audit/**` (release procedure).

| Report | Target | Score | Verdict |
|---|---|---|---|
| `AUDIT-PLATFORM-fdb8a3e.md` | `fdb8a3e` | 85.75 | below the PLATFORM tolerance (G3) |
| `AUDIT-PLATFORM-e3bc9d0.md` | `e3bc9d0` | 88.00 | APTO CON CORRECCIONES (tolerance edge, G3) |
| `AUDIT-PLATFORM-4417d96.md` | `4417d96` | 88.50 | APTO CON CORRECCIONES (no gate) |
