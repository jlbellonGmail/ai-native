# HARDENING-V1.1 H5 - Security Notes

## Security By Design

H5 uses local repository fixtures only. It does not call external models,
services, remotes or credentials.

## Sensitive Data

The controlled datasets are synthetic and already versioned in `ai-knowledge`.
No secrets or production data are introduced.

## Supply Chain

No dependencies are added. The runner uses Node.js built-in modules only.

## Generated Project Impact

No generated-project files are changed. `ai-template/templates/project/` is not
in scope because H5 affects factory knowledge evaluation assets only.

## DevSecOps

Static validation is local. Secret scanning, dependency review and remote CI are
not run because no push or PR is authorized in this execution.
