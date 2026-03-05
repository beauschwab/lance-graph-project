import pytest

fastapi = pytest.importorskip("fastapi")
pytest.importorskip("yaml")

from fastapi.testclient import TestClient

from lance_graph_project.api.app import create_app


def test_health_endpoint() -> None:
    client = TestClient(create_app())
    response = client.get("/api/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["query_backend"] in {"lance_graph", "json_fallback"}


def test_schema_endpoint_returns_nodes_and_relationships() -> None:
    client = TestClient(create_app())
    response = client.get("/api/schema")

    assert response.status_code == 200
    payload = response.json()
    assert "nodes" in payload
    assert "relationships" in payload
