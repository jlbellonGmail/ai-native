# Quality: four different questions

| Check | Question | Where |
|---|---|---|
| Functional tests | Does it do what it should? | tests per requirement; full suite at the end |
| Review | Is it well designed? | independent Reviewer (spec, plan, tasks, contracts, architecture) |
| CodeQL | Are there dangerous patterns or vulnerabilities? | automatic in CI (`.github/workflows/codeql.yml`) |
| Security | Is there risk? | security template, secrets boundary, supply-chain checks |

None replaces another: green tests do not prove a good design, a clean Reviewer does not prove safety, and CodeQL does not prove behaviour. Do not call all of them "QA".

## TDD in one sentence

First we define how we know it works; then we program until that test passes.

```text
requirement -> test -> it fails for the right reason -> implement -> PASS -> refactor -> regression
```

Apply it to behaviour. Do not force it on docs or configuration; use the smallest sufficient check and say so.
