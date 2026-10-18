# Security

Security controls for the foundation repository.

Implemented controls:

* CodeQL workflow
* Trivy workflow
* SBOM workflow
* Dependency Review workflow and config
* Dependabot config
* Supply-chain attestation workflow
* Runtime auth and rate-limit primitives
* `enterprise-10-10/security-audit-final.json` as the product-side audit map

Validate with:

```bash
node scripts/validate-structure.mjs
node scripts/validate-enterprise-10-10.mjs
```
