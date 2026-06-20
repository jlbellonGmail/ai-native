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
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/onboarding-documentation.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/execution/archive/ENTERPRISE-10-10-V1/W7-T5/artifacts/onboarding-documentation.contract.json
Get-ChildItem governance -Recurse -Filter *.json | Where-Object { $_.FullName -match "W7-T5|w7-t5|W7|review|audit|contract|documentation|setup|operation|governance" } | ForEach-Object { Write-Host "Validating JSON:" $_.FullName; node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" $_.FullName }
```

Result:

PASS

Notes:

* No governance-specific validator script exists in the root repository.
* Product repo validations are not applicable because W7-T5 is governance-only
  and does not modify product repos.
