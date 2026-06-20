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
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/runbooks-playbooks.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/execution/archive/ENTERPRISE-10-10-V1/W7-T6/artifacts/runbooks-playbooks.contract.json
Get-ChildItem governance -Recurse -Filter *.json | Where-Object { $_.FullName -match "W7-T6|w7-t6|W7|review|audit|contract|documentation|onboarding|operation|governance|runbook|playbook" } | ForEach-Object { Write-Host "Validating JSON:" $_.FullName; node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" $_.FullName }
```

Result:

PASS

Notes:

* No governance-specific validator script exists in the root repository.
* Product repo validations are not applicable because W7-T6 is governance-only
  and does not modify product repos.
