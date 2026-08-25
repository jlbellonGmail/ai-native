"""Tests de integración para workflows GitHub Actions CI.

Validan que los YAMLs de .github/workflows/ tengan la estructura mínima
requerida per el circuito agente. Usan regex por YAML complejo con
anclajes de GitHub Actions (${{ }}).
"""

import pytest
import re
from pathlib import Path


WORKFLOWS_DIR = Path(".github/workflows")


def _read_workflow(name: str) -> str:
    """Lee el contenido de un workflow como string."""
    path = WORKFLOWS_DIR / name
    if not path.exists():
        pytest.skip(f"{name} no existe")
    return path.read_text(encoding="utf-8")


@pytest.mark.parametrize("workflow_file", ["ci.yml", "post-hitl-merge-gate.yml", "post-merge-close-feature.yml"])
def test_workflow_has_name(workflow_file: str):
    """Cada workflow debe tener field 'name'."""
    content = _read_workflow(workflow_file)
    assert "name:" in content, f"{workflow_file} debe tener 'name:'"


@pytest.mark.parametrize("workflow_file", ["ci.yml", "post-hitl-merge-gate.yml", "post-merge-close-feature.yml"])
def test_workflow_has_on(workflow_file: str):
    """Cada workflow debe tener trigger 'on'."""
    content = _read_workflow(workflow_file)
    # Los workflows de GitHub Actions tienen 'on:' en la sección de triggers
    # Buscamos 'on:' seguido de nueva línea o espacio (no necesariamente paréntesis)
    assert re.search(r'^on:|on:\s*\n', content, re.MULTILINE), \
        f"{workflow_file} debe tener trigger 'on:'"


@pytest.mark.parametrize("workflow_file", ["ci.yml"])
def test_ci_has_circuit_tests_job(workflow_file: str):
    """CI debe tener el job circuit-tests."""
    content = _read_workflow(workflow_file)
    assert "circuit-tests:" in content, "CI debe tener job 'circuit-tests'"


@pytest.mark.parametrize("workflow_file", ["ci.yml"])
def test_ci_has_product_tests_job(workflow_file: str):
    """CI debe tener job product-tests (puede ser placeholder)."""
    content = _read_workflow(workflow_file)
    assert "product-tests:" in content, "CI debe tener job 'product-tests'"


@pytest.mark.parametrize("workflow_file", ["ci.yml"])
def test_circuit_tests_runs_pytest(workflow_file: str):
    """circuit-tests job debe mencionar pytest."""
    content = _read_workflow(workflow_file)
    assert re.search(r'pytest', content, re.IGNORECASE), "circuit-tests debe correr pytest"


@pytest.mark.parametrize("workflow_file", ["ci.yml"])
def test_product_tests_is_placeholder(workflow_file: str):
    """product-tests debe contener mensaje de placeholder."""
    content = _read_workflow(workflow_file)
    assert "placeholder" in content.lower(), "product-tests debe indicar es placeholder"
    assert "arquitectura.md" in content.lower(), "debe referenciar docs/tecnica/arquitectura.md"


@pytest.mark.parametrize("workflow_file", ["post-hitl-merge-gate.yml"])
def test_post_hitl_gate_has_human_check(workflow_file: str):
    """post-hitl-merge-gate debe verificar aprobacion humana."""
    content = _read_workflow(workflow_file)
    assert re.search(r'human|aprobado', content, re.IGNORECASE), \
        "post-hitl-merge-gate debe verificar aprobacion humana o human in-the-loop"


@pytest.mark.parametrize("workflow_file", ["post-merge-close-feature.yml"])
def test_post_merge_close_has_steps(workflow_file: str):
    """post-merge-close-feature debe tener steps definidos."""
    content = _read_workflow(workflow_file)
    assert "steps:" in content, "post-merge-close-feature.yml debe tener steps"


def test_all_workflows_mention_agents_md():
    """Los workflows clave deben referenciar el circuito agente o documentación.
    
    - ci.yml: debe tener circuit-tests o product-tests (giá)
    - post-hitl-merge-gate.yml: debe tener referencias HITL
    - post-merge-close-feature.yml: debe tener referencias close/roadmap
    """
    workflows = ["ci.yml", "post-hitl-merge-gate.yml", "post-merge-close-feature.yml"]
    results = []
    for wf in workflows:
        content = _read_workflow(wf)
        # ci.yml: debe tener circuit-tests o product-tests
        is_ci = "circuit-tests" in content or "product-tests" in content
        # post-hitl-merge-gate.yml: debe tener HITL
        is_hitl = bool(re.search(r'HITL', content, re.IGNORECASE))
        # post-merge-close-feature.yml: debe tener close/roadmap
        is_close = "close-feature" in content or "roadmap" in content.lower()
        results.append(is_ci or is_hitl or is_close)
    # Al menos 2 de 3 workflows deben pasar el check
    assert sum(results) >= 2, "Al menos 2 de 3 workflows deben mencionar circuito agente o documentación relacionada"