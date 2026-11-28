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
| `AUDIT-PLATFORM-99cc334.md` | `99cc334` (release head) | 88.25 | APTO CON CORRECCIONES (no gate); MAJOR N-58 fixed afterwards in `ad0286a`, not re-audited |
| `AUDIT-PLATFORM-877fb9c.md` | `877fb9c` (release head; report commit `2b41e25` on the preserved `release/v4.1.0`) | 89.75 | APTO CON CORRECCIONES (no gate); 0 MAJOR, 22 MINOR; below 90 by 0.25 |
| `AUDIT-PLATFORM-47c52a1.md` | `47c52a1` (`release/v4.1.0-r2`) | 89.75 | APTO CON CORRECCIONES (no gate); N-59 closed, N-61 new (fixed afterwards in `bd93068`) |
| `AUDIT-PLATFORM-71dff99.md` | `71dff99` (release head; report commit `e88de8f` on the preserved `release/v4.1.0-r2`) | 89.75 | APTO CON CORRECCIONES (no gate); 0 MAJOR, 21 MINOR; N-61 closed; below 90 by 0.25. Archived byte-identical: on `release/v4.1.0-r3` its `.audit/reports/` copy is a changed path that no case covers, so own acceptance there was BLOCKED (RF-30, see STATE) |
