# Validation

Repository:

`ai-native` governance

Commands executed:

```powershell
git diff --check
git status --short
```

JSON validation:

```powershell
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/contributing-review.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/execution/archive/ENTERPRISE-10-10-V1/W7-T2/artifacts/contributing-review.contract.json
```

Result:

PASS

Notes:

* No governance-specific validator script exists in the root repository.
* Product repo validations were not executed because W7-T2 is governance-only
  and does not modify product repos.
