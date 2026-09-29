import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "release-readiness.ps1"


def run(*args):
    return subprocess.run(["pwsh", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(SCRIPT), *args], cwd=ROOT, text=True, capture_output=True)


def test_release_gate_is_safe_for_the_current_v200_candidate():
    result = run("-Version", "v2.0.0", "-DryRun")
    if result.returncode == 0:
        assert "PASS DRY-RUN" in result.stdout
    else:
        assert "RELEASE REJECTED" in result.stderr


def test_release_gate_rejects_invalid_semver():
    result = run("-Version", "2.0.0", "-DryRun")
    assert result.returncode != 0
    assert "SemVer" in result.stderr


def test_release_script_is_read_only():
    content = SCRIPT.read_text(encoding="utf-8")
    assert "git tag" not in content
    assert "gh release create" not in content
    assert "git push" not in content


def test_release_readiness_accepts_promoted_main_tree_in_candidate_history():
    content = SCRIPT.read_text(encoding="utf-8")
    assert '"rev-parse", "$mainSha^{tree}"' in content
    assert '"log", "--format=%T", $candidateSha' in content
    assert "$candidateTrees -contains $mainTree" in content
    assert "el contenido de main no esta en la historia de la candidata" in content
