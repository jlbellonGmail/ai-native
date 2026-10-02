---
name: example-domain-review
description: Example domain skill. Checks that a change touching personal data declares retention and avoids logging it.
---

# Example domain review

1. List the files in the diff that read or write personal data.
2. For each, confirm retention is declared in the spec and no personal field reaches a log call.
3. Report findings; this skill grants no extra permission.
