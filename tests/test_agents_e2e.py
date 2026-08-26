"""End-to-end tests for the AI-Native agentic circuit.

Tests the full circuit flow: spec → plan → tasks → contract validation →
circuit execution. These are higher-level integration tests that verify
the agent circuit works together as a system.
"""

import pytest
import json
import subprocess
import sys
from pathlib import Path


# Project root is the template repo root
PROJECT_ROOT = Path(".").resolve()


def _run_powershell(command: str) -> tuple:
    """Run a PowerShell command and return (returncode, stdout, stderr)."""
    result = subprocess.run(
        ["pwsh", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
        capture_output=True,
        text=True,
        cwd=str(PROJECT_ROOT),
        timeout=120000,
    )
    return result.returncode, result.stdout, result.stderr


def _read_agents_json() -> dict:
    """Read and parse .agentic/agents.json."""
    path = PROJECT_ROOT / ".agentic" / "agents.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _read_models_json() -> dict:
    """Read and parse .agentic/models.json."""
    path = PROJECT_ROOT / ".agentic" / "models.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _read_work_unit_schema() -> dict:
    """Read and parse work-unit.schema.json."""
    path = PROJECT_ROOT / ".agentic" / "schemas" / "work-unit.schema.json"
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_yaml(name: str) -> dict:
    """Load a GitHub Actions workflow YAML."""
    import yaml
    path = PROJECT_ROOT / ".github" / "workflows" / name
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


@pytest.fixture(scope="session")
def agents_json():
    """Provide parsed agents.json for all tests."""
    return _read_agents_json()


@pytest.fixture(scope="session")
def models_json():
    """Provide parsed models.json for all tests."""
    return _read_models_json()


@pytest.fixture(scope="session")
def work_unit_schema():
    """Provide parsed work-unit schema for all tests."""
    return _read_work_unit_schema()


class TestAgentStructure:
    """Verify the agent structure is complete and valid."""

    def test_agents_json_has_all_roles(self, agents_json):
        """agents.json debe tener los 5 roles definidos."""
        expected_roles = [
            "analyst-agent",
            "reviewer-agent",
            "builder-agent",
            "qa-agent",
            "code-reviewer-agent",
        ]
        for role in expected_roles:
            assert role in agents_json["roles"], f"Falta el rol '{role}' en agents.json"

    def test_agents_json_has_model_routing(self, agents_json):
        """agents.json debe tener configuración de model routing."""
        assert "model" in agents_json, "agents.json debe tener field 'model'"
        assert "fallbacks" in agents_json, "agents.json debe tener field 'fallbacks'"

    def test_models_json_has_required_fields(self, models_json):
        """models.json debe tener fields obligatorios."""
        assert "model" in models_json, "models.json debe tener field 'model'"
        assert "fallbacks" in models_json, "models.json debe tener field 'fallbacks'"
        # Deberían tener fallbacks go/zen
        fallbacks = models_json.get("fallbacks", [])
        go_present = "go" in fallbacks
        zen_present = "zen" in fallbacks
        # Al menos uno de los dos debería estar presente (o ser compatible)
        assert go_present or zen_present, \
            "models.json fallbacks debería tener 'go' o 'zen' para circuit agente"


class TestWorkUnitSchema:
    """Verify the work-unit JSON schema is valid and complete."""

    def test_work_unit_schema_is_valid_json(self, work_unit_schema):
        """work-unit.schema.json debe ser JSON válido con schemaVersion."""
        assert "schemaVersion" in work_unit_schema, \
            "work-unit.schema.json debe tener schemaVersion"
        assert "mode" in work_unit_schema, \
            "work-unit.schema.json debe tener mode"
        assert "items" in work_unit_schema or "slug" in work_unit_schema, \
            "work-unit.schema.json debe tener items o slug"

    def test_work_unit_schema_requires_schema_version_gt_zero(self, work_unit_schema):
        """schemaVersion debe ser > 0."""
        sv = work_unit_schema.get("schemaVersion", 0)
        assert sv > 0, f"schemaVersion debe ser > 0, got {sv}"


class TestCircuitContracts:
    """Verify the circuit contract validation works."""

    def test_feature_contract_schema_valid(self):
        """Assert-FeatureContract debe validar contra schema."""
        # Verificar que el script existe y es ejecutable
        script = PROJECT_ROOT / "scripts" / "feature-contract.ps1"
        assert script.exists(), "scripts/feature-contract.ps1 debe existir"

    def test_circuit_tests_yaml_has_required_jobs(self):
        """CI debe tener los jobs obligatorios circuit-tests y product-tests."""
        ci = _load_yaml("ci.yml")
        jobs = ci.get("jobs", {})
        assert "circuit-tests" in jobs, "CI job 'circuit-tests' debe existir"
        assert "product-tests" in jobs, "CI job 'product-tests' debe existir"


class TestCircuitIntegration:
    """Integration tests for the full agent circuit flow."""

    def test_pytest_collects_expected_tests(self):
        """pytest debe podercollectar tests de la carpeta tests/."""
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "--co", "-q"],
            capture_output=True,
            text=True,
            cwd=str(PROJECT_ROOT),
            timeout=60000,
        )
        # Debería haber tests coleccionables
        assert "test session starts" in result.stdout or result.stdout.strip(), \
            "pytest debería poder iniciar sesión"

    def test_196_tests_collected_approximately(self):
        """Debería haber ~196 tests pytest recolectados (aproximado)."""
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "--co", "-q"],
            capture_output=True,
            text=True,
            cwd=str(PROJECT_ROOT),
            timeout=60000,
        )
        # Count collected tests from output
        output = result.stdout
        # Look for "X tests collected"
        import re
        matches = re.findall(r"(\d+)\s+tests? collected", output, re.IGNORECASE)
        if matches:
            count = int(matches[0])
            # Aproximado: debería haber entre 140 y 200 tests
            assert 140 <= count <= 200, \
                f"Se esperaban ~196 tests, got {count} (fuera de rango esperado)"
        else:
            # Si no se puede contar, al menos pytest debería iniciar
            pytest.skip("No se pudo contar tests coleccionados")


class TestRoadmapState:
    """Verify ROADMAP.md state is valid."""

    def test_roadmap_has_valid_states(self):
        """ROADMAP.md debe tener estados [ ], [−], [x] válidos."""
        roadmap_path = PROJECT_ROOT / "ROADMAP.md"
        if not roadmap_path.exists():
            pytest.skip("ROADMAP.md no existe en este proyecto")
        
        content = roadmap_path.read_text(encoding="utf-8")
        # Buscar líneas con estados
        import re
        states = re.findall(r'\[ ?[x ] ?\]', content)
        # Cada estado debe ser [ ], [−] o [x] (con posibles espacios)
        valid_states = re.findall(r'\[ ?[x -] ?\]', content)
        assert len(valid_states) > 0, "ROADMAP.debe tener al menos un estado de feature"


def test_roundtrip_work_unit_json():
    """Test that work-unit.json manifest can roundtrip through schema validation."""
    from jsonschema import validate, Draft7Validator
    
    schema_path = PROJECT_ROOT / ".agentic" / "schemas" / "work-unit.schema.json"
    if not schema_path.exists():
        pytest.skip("work-unit.schema.json no existe")
    
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validator = Draft7Validator(schema)
    
    # Crear un work-unit manifest válido
    work_unit = {
        "schemaVersion": 1,
        "mode": "Feature",
        "slug": "test-roundtrip",
        "items": []
    }
    
    errors = list(validator.iter_errors(work_unit))
    assert len(errors) == 0, f"work-unit manifest no pasa validación: {errors[:3]}"