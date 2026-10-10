import json
import os
import shutil
import subprocess
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "upgrade-template-consumer.ps1"


def powershell():
    for name in ("pwsh", "powershell.exe", "powershell"):
        path = shutil.which(name)
        if path:
            return path
    pytest.skip("PowerShell no disponible")


def env():
    result = os.environ.copy()
    result["GIT_CONFIG_GLOBAL"] = "NUL" if os.name == "nt" else "/dev/null"
    result["GIT_TERMINAL_PROMPT"] = "0"
    return result


def run(command, cwd, check=True):
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, env=env())
    if check and result.returncode != 0:
        raise AssertionError(f"{command}\n{result.stdout}\n{result.stderr}")
    return result


def git(repo, *args, check=True):
    return run(["git", *args], repo, check=check).stdout.strip()


def write_manifest(repo: Path, version: str, shared_paths: list[str]) -> None:
    manifest = {
        "schemaVersion": 2,
        "templateVersion": version,
        "templateRepository": str(repo),
        "sharedPaths": shared_paths,
    }
    path = repo / "scripts" / "template-starter-manifest.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def make_template_source(tmp_path: Path) -> Path:
    source = tmp_path / "template-source"
    source.mkdir()
    git(source, "init")
    git(source, "checkout", "-b", "main")
    git(source, "config", "user.email", "tests@example.invalid")
    git(source, "config", "user.name", "Tests")
    shared_v204 = [
        "scripts/status-lib.ps1",
        "scripts/template-starter-manifest.json",
    ]
    (source / "scripts").mkdir()
    (source / "scripts" / "status-lib.ps1").write_text("v204\n", encoding="utf-8")
    write_manifest(source, "v2.0.4", shared_v204)
    git(source, "add", ".")
    git(source, "commit", "-m", "v204")
    git(source, "tag", "v2.0.4")

    shared_v205 = [
        "scripts/status-lib.ps1",
        "scripts/template-starter-manifest.json",
        "scripts/upgrade-template-consumer.ps1",
    ]
    (source / "scripts" / "status-lib.ps1").write_text("v205\n", encoding="utf-8")
    (source / "scripts" / "upgrade-template-consumer.ps1").write_text("upgrade\n", encoding="utf-8")
    write_manifest(source, "v2.0.5", shared_v205)
    git(source, "add", ".")
    git(source, "commit", "-m", "v205")
    git(source, "tag", "v2.0.5")
    return source


def make_consumer(tmp_path: Path, source: Path) -> Path:
    consumer = tmp_path / "consumer"
    consumer.mkdir()
    git(consumer, "init")
    git(consumer, "checkout", "-b", "develop")
    git(consumer, "config", "user.email", "tests@example.invalid")
    git(consumer, "config", "user.name", "Tests")
    for relative in ("scripts/status-lib.ps1", "scripts/template-starter-manifest.json"):
        target = consumer / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        content = subprocess.run(
            ["git", "show", f"v2.0.4:{relative}"],
            cwd=source,
            capture_output=True,
            check=True,
            env=env(),
        ).stdout
        target.write_bytes(content)
    (consumer / "src").mkdir()
    (consumer / "src" / "domain.txt").write_text("functional\n", encoding="utf-8")
    git(consumer, "add", ".")
    git(consumer, "commit", "-m", "adopt template v204")
    return consumer


def upgrade(consumer: Path, source: Path, mode="Apply", target="v2.0.5", baseline="v2.0.4"):
    return run(
        [
            powershell(),
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(SCRIPT),
            "-ConsumerPath",
            str(consumer),
            "-TemplateSource",
            str(source),
            "-BaselineVersion",
            baseline,
            "-TargetVersion",
            target,
            "-Mode",
            mode,
        ],
        ROOT,
        check=False,
    )


def test_upgrade_v204_to_v205_syncs_only_manifest_paths_and_is_idempotent(tmp_path):
    source = make_template_source(tmp_path)
    consumer = make_consumer(tmp_path, source)

    result = upgrade(consumer, source)
    assert result.returncode == 0, result.stdout + result.stderr
    assert "PASS template-consumer actualizado v2.0.4 -> v2.0.5" in result.stdout
    assert (consumer / "scripts" / "status-lib.ps1").read_text(encoding="utf-8") == "v205\n"
    assert (consumer / "scripts" / "upgrade-template-consumer.ps1").read_text(encoding="utf-8") == "upgrade\n"
    assert (consumer / "src" / "domain.txt").read_text(encoding="utf-8") == "functional\n"
    assert not (consumer / "STATUS.md").exists()
    assert not (consumer / "runs").exists()

    git(consumer, "add", ".")
    git(consumer, "commit", "-m", "upgrade template v205")
    second = upgrade(consumer, source)
    assert second.returncode == 0, second.stdout + second.stderr
    assert git(consumer, "status", "--porcelain") == ""


def test_upgrade_fails_on_committed_drift_before_copying(tmp_path):
    source = make_template_source(tmp_path)
    consumer = make_consumer(tmp_path, source)
    (consumer / "scripts" / "status-lib.ps1").write_text("local customization\n", encoding="utf-8")
    git(consumer, "add", ".")
    git(consumer, "commit", "-m", "local drift")

    result = upgrade(consumer, source)
    assert result.returncode == 1
    assert "DRIFT different: scripts/status-lib.ps1" in result.stdout
    assert not (consumer / "scripts" / "upgrade-template-consumer.ps1").exists()


def test_upgrade_fails_with_pending_work(tmp_path):
    source = make_template_source(tmp_path)
    consumer = make_consumer(tmp_path, source)
    (consumer / "scratch.txt").write_text("pending\n", encoding="utf-8")

    result = upgrade(consumer, source)
    assert result.returncode == 1
    assert "trabajo pendiente" in result.stdout


def test_upgrade_requires_exact_target_tag(tmp_path):
    source = make_template_source(tmp_path)
    consumer = make_consumer(tmp_path, source)

    result = upgrade(consumer, source, target="v2.0.6")
    assert result.returncode == 1
    assert "tag exacto solicitado: v2.0.6" in result.stdout
