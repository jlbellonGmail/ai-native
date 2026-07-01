# Generators

Generator entry points and generation contracts.

## create-ai-native-app

`create-ai-native-app` materializes a controlled AI-Native project baseline from
`scaffolds/ai-native-app/files`.

Run from `ai-template`:

```bash
node generators/create-ai-native-app.mjs --name pilot-app --dest ../pilot-app
```

`--target` is accepted as an alias for `--dest`.

Dry run:

```bash
node generators/create-ai-native-app.mjs --name pilot-app --dest ../pilot-app --dry-run
```

Validate the generated project:

```bash
node scripts/validate-create-ai-native-app.mjs --target ../pilot-app
```

The generator rejects empty or invalid project names and refuses to write into
an existing destination.
