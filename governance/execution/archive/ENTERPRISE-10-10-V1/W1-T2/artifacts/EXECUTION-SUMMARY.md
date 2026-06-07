# EXECUTION SUMMARY

Target: D:\proyectos\ai-native\ai-foundation
Run directory: C:\Users\jlbel\AppData\Local\Temp\codex-trivy-run
Trivy: C:\Users\jlbel\AppData\Local\Temp\codex-trivy-prep\trivy.exe

Commands executed:
1. C:\Users\jlbel\AppData\Local\Temp\codex-trivy-prep\trivy.exe fs --cache-dir C:\Users\jlbel\AppData\Local\Temp\codex-trivy-run\cache --scanners secret,misconfig --severity HIGH,CRITICAL --ignore-unfixed --format json --output C:\Users\jlbel\AppData\Local\Temp\codex-trivy-run\trivy-filesystem.json D:\proyectos\ai-native\ai-foundation
2. C:\Users\jlbel\AppData\Local\Temp\codex-trivy-prep\trivy.exe fs --cache-dir C:\Users\jlbel\AppData\Local\Temp\codex-trivy-run\cache --scanners vuln --vuln-type library --severity HIGH,CRITICAL --ignore-unfixed --format json --output C:\Users\jlbel\AppData\Local\Temp\codex-trivy-run\trivy-dependencies.json D:\proyectos\ai-native\ai-foundation

Duration seconds: 126.58

Results:
- Filesystem scan HIGH: 0
- Filesystem scan CRITICAL: 0
- Dependency scan HIGH: 0
- Dependency scan CRITICAL: 0

Errors:
- Filesystem scan exit code: 0
- Dependency scan exit code: 0
