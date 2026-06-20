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
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/readme-review.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/contributing-review.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/architecture-documentation.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/setup-documentation.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/onboarding-documentation.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/runbooks-playbooks.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/documentation/documentation-audit-final.contract.json
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" governance/execution/archive/ENTERPRISE-10-10-V1/W7-T7/artifacts/documentation-audit-final.contract.json
Get-ChildItem governance -Recurse -Filter *.json | Where-Object { $_.FullName -match "W7-T7|w7-t7|W7|review|audit|contract|documentation|runbook|playbook|operation|governance" } | ForEach-Object { Write-Host "Validating JSON:" $_.FullName; node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8')); console.log('PASS', process.argv[1])" $_.FullName }
```

Result:

PASS

Notes:

* No governance-specific validator script exists in the root repository.
* Product repo validations are not applicable because W7-T7 is governance-only
  and does not modify product repos.
