# AI-Native App Scaffold

This scaffold contains the expected shape of a generated AI-Native application.
`create-ai-native-app` copies `files/` into the destination and replaces project
tokens.

* `apps/` for framework routes and adapters
* `services/` for application, domain and infrastructure layers
* `validation/tests/` for test suites
* `docs/` for setup and architecture
* `config/` for AI and knowledge configuration

The current reference implementation lives in `examples/reference-app/`.

The generated project references the canonical H1 SDD flow:

```text
Specify -> Plan -> Implement -> Verify
```
