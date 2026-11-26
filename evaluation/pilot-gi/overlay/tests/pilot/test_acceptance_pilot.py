"""AI-NATIVE v4.1.0 acceptance pilot overlay (spec 003 RF-6, RF-14 to RF-17).

Runs only in a disposable copy of gi-common-reference at a pinned SHA; never committed to a GI repository.
Naming is the evidence class: `test_real_*` use a real disposable PostgreSQL (testcontainers, through GI's own
conftest fixtures) and, where they call the API, FastAPI's TestClient in-process (never a socket);
`test_sim_*` use no database (simulated).
"""

import uuid
from typing import Any

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.conninfo import make_conninfo

from gi_common_reference.app import READER_DATABASE_URL, app_from_environment
from gi_common_reference.bootstrap import (
    postgres_region_repository,
    postgres_repository,
    required_locales,
)
from gi_common_reference.locales.application.incorporate import Outcome as LocaleOutcome
from gi_common_reference.locales.application.incorporate import (
    incorporate_snapshot as incorporate_locales,
)
from gi_common_reference.regions.application.incorporate import Outcome, incorporate_snapshot
from gi_common_reference.regions.domain.digest import content_digest_matches
from tests.conftest import NetworkGuard
from tests.fixtures.regions import (
    EN,
    ES,
    FR,
    build_snapshot,
    locale_snapshot,
    region,
    region_id,
    seal,
    subregion,
)

TABLES = ("locale", "region", "subregion", "region_locale", "subregion_locale", "region_snapshot")


def counts(url: str) -> dict[str, int]:
    with psycopg.connect(url) as conn:
        return {t: conn.execute(f"SELECT count(*) FROM reference.{t}").fetchone()[0] for t in TABLES}


def state(url: str) -> dict[str, Any]:
    with psycopg.connect(url) as conn:
        return {
            "region": conn.execute(
                "SELECT region_id::text, code, status FROM reference.region ORDER BY 1"
            ).fetchall(),
            "subregion": conn.execute(
                "SELECT subregion_id::text, region_id::text, code FROM reference.subregion ORDER BY 1"
            ).fetchall(),
            "region_locale": conn.execute(
                "SELECT region_id::text, locale_id::text, name FROM reference.region_locale "
                "ORDER BY 1, 2"
            ).fetchall(),
            "counts": counts(url),
        }


def with_locales(url: str) -> str:
    result = incorporate_locales(locale_snapshot(1), postgres_repository(url))
    assert result.outcome is LocaleOutcome.INCORPORATED
    return url


def incorporate(url: str, document: dict[str, Any]) -> Any:
    return incorporate_snapshot(document, postgres_region_repository(url), required_locales())


def snapshot_with_french(version: int = 1) -> dict[str, Any]:
    document = build_snapshot(version)
    document["region_names"].append(
        {"region_id": region_id("019"), "locale_id": FR, "name": "Amériques"}
    )
    return seal(document)


def api(url: str) -> TestClient:
    """The public API as the read-only role, in-process (TestClient is not a socket)."""
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("ALTER ROLE reference_reader LOGIN PASSWORD 'pilot-reader-pw'")
    reader = make_conninfo(url, user="reference_reader", password="pilot-reader-pw")
    return TestClient(app_from_environment({READER_DATABASE_URL: reader}))


# AC-1 (RF-1) ------------------------------------------------------------------------------------


def test_real_locales_persist_and_read(database_url: str) -> None:
    url = with_locales(database_url)
    response = api(url).get("/v1/locales")
    assert response.status_code == 200
    ids = {item["locale_id"] for item in response.json()["data"]}
    assert {EN, ES, FR} <= ids
    assert counts(url)["locale"] >= 3


def test_real_regions_persist_and_read(database_url: str) -> None:
    url = with_locales(database_url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.INCORPORATED
    response = api(url).get("/v1/regions", params={"locale_id": EN})
    assert response.status_code == 200
    data = response.json()["data"]
    assert [item["code"] for item in data] == ["002", "019"]
    assert [item["name"] for item in data] == ["Africa", "Americas"]
    assert counts(url)["region"] == 2


def test_real_rejected_snapshot_leaves_state_identical(database_url: str) -> None:
    url = with_locales(database_url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.INCORPORATED
    before = state(url)
    changed = [
        subregion(key, **({"code": "420"} if key == "419" else {}))
        for key in ("015", "202", "419", "021")
    ]
    result = incorporate(url, build_snapshot(2, subregions=changed))
    assert result.outcome is Outcome.REJECTED
    assert state(url) == before


# AC-2 (RF-2) ------------------------------------------------------------------------------------


def test_real_region_locale_fk_points_to_locale(database_url: str) -> None:
    with psycopg.connect(database_url) as conn:
        row = conn.execute(
            "SELECT confrelid::regclass::text, pg_get_constraintdef(oid) FROM pg_constraint "
            "WHERE conname = 'region_locale_locale_fk'"
        ).fetchone()
    assert row is not None
    assert row[0] == "reference.locale"
    assert "FOREIGN KEY (locale_id) REFERENCES reference.locale(locale_id)" in row[1]


def test_real_nonexistent_locale_reference_is_rejected_by_fk(database_url: str) -> None:
    url = with_locales(database_url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.INCORPORATED
    before = state(url)
    with pytest.raises(psycopg.errors.ForeignKeyViolation):
        with psycopg.connect(url) as conn:
            conn.execute(
                "INSERT INTO reference.region_locale (region_id, locale_id, name) "
                "VALUES (%s, %s, %s)",
                [region_id("002"), str(uuid.uuid4()), "Nowhere"],
            )
    assert state(url) == before


# AC-3 (RF-3) ------------------------------------------------------------------------------------


def test_real_region_names_resolve_by_locale_id(database_url: str) -> None:
    url = with_locales(database_url)
    assert incorporate(url, snapshot_with_french()).outcome is Outcome.INCORPORATED
    client = api(url)
    french = client.get(f"/v1/regions/{region_id('019')}", params={"locale_id": FR})
    assert french.status_code == 200
    assert (french.json()["data"]["code"], french.json()["data"]["name"]) == ("019", "Amériques")
    english = client.get(f"/v1/regions/{region_id('019')}", params={"locale_id": EN})
    assert english.json()["data"]["name"] == "Americas"


def test_real_unknown_locale_id_is_422_distinct_from_404(database_url: str) -> None:
    url = with_locales(database_url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.INCORPORATED
    client = api(url)
    unknown_locale = client.get(
        f"/v1/regions/{region_id('019')}", params={"locale_id": str(uuid.uuid4())}
    )
    assert unknown_locale.status_code == 422
    assert unknown_locale.json()["error"]["code"] == "unknown_locale"
    unknown_region = client.get(f"/v1/regions/{uuid.uuid4()}")
    assert unknown_region.status_code == 404
    assert unknown_region.json()["error"]["code"] == "not_found"


# AC-4 (RF-4) ------------------------------------------------------------------------------------


def test_real_fresh_databases_reach_the_same_state(database_factory: Any) -> None:
    states = []
    for _ in range(2):
        url = with_locales(database_factory())
        assert incorporate(url, snapshot_with_french()).outcome is Outcome.INCORPORATED
        states.append(state(url))
    assert states[0] == states[1]
    assert states[0]["counts"]["region"] == 2
    assert states[0]["counts"]["region_locale"] == 5


def test_real_resubmitting_a_snapshot_changes_nothing(database_url: str) -> None:
    url = with_locales(database_url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.INCORPORATED
    later = build_snapshot(2, regions=[region("002"), region("019"), region("142")])
    assert incorporate(url, later).outcome is Outcome.INCORPORATED
    before = state(url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.NOOP
    assert state(url) == before


# AC-5 (RF-5) ------------------------------------------------------------------------------------


def test_sim_snapshot_digest_is_checked_without_a_database() -> None:
    assert content_digest_matches(build_snapshot(1))


def test_sim_tampered_snapshot_digest_is_refused() -> None:
    document = build_snapshot(1)
    document["regions"][0]["code"] = "999"
    assert not content_digest_matches(document)


def test_real_api_answers_in_process_without_a_socket(
    database_url: str, network_guard: NetworkGuard
) -> None:
    url = with_locales(database_url)
    assert incorporate(url, build_snapshot(1)).outcome is Outcome.INCORPORATED
    client = api(url)
    with network_guard:
        response = client.get("/v1/regions", params={"locale_id": EN})
    assert response.status_code == 200
    assert network_guard.blocked == []
