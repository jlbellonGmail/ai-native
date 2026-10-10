import json
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "sync-template-starter.ps1"
MANIFEST = ROOT / "scripts" / "template-starter-manifest.json"


def powershell():
    for name in ("pwsh", "powershell.exe", "powershell"):
        path = shutil.which(name)
        if path:
            return path
    pytest.skip("PowerShell no disponible")


def run(starter, mode):
    return subprocess.run(
        [powershell(), "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(SCRIPT),
         "-StarterPath", str(starter), "-Mode", mode],
        cwd=ROOT, text=True, capture_output=True
    )


def test_manifest_is_deterministic_and_detects_drift(tmp_path):
    starter = tmp_path / "starter"
    starter.mkdir()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for relative in manifest["sharedPaths"]:
        target = starter / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((ROOT / relative).read_bytes())
    assert run(starter, "Verify").returncode == 0
    (starter / manifest["sharedPaths"][0]).write_text("drift\n", encoding="utf-8")
    result = run(starter, "Verify")
    assert result.returncode == 1
    assert "DRIFT different:" in result.stdout
    assert run(starter, "Sync").returncode == 0
    assert run(starter, "Verify").returncode == 0
