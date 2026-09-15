import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "release-readiness.ps1"


def run(*args):
    return subprocess.run(["pwsh", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(SCRIPT), *args], cwd=ROOT, text=True, capture_output=True)


def test_release_gate_rejects_premature_v200_without_mutation():
    result = run("-Version", "v2.0.0", "-DryRun")
    assert result.returncode != 0
    # Before F17 closes, ROADMAP is the expected rejection. Once the release
    # candidate is complete, the same read-only dry-run must still reject
    # without CI evidence for the exact candidate SHA.
    assert (
        "ROADMAP incompleto" in result.stderr
        or "CI no encontrado" in result.stderr
        or "Rama incorrecta" in result.stderr
    )


def test_release_gate_rejects_invalid_semver():
    result = run("-Version", "2.0.0", "-DryRun")
    assert result.returncode != 0
    assert "SemVer" in result.stderr


def test_release_script_is_read_only():
    content = SCRIPT.read_text(encoding="utf-8")
    assert "git tag" not in content
    assert "gh release create" not in content
    assert "git push" not in content
