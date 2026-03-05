from __future__ import annotations

from pathlib import Path
import shutil

from fastapi.testclient import TestClient

from lance_graph_project.api.app import create_app
from lance_graph_project.services.container import clear_all_caches


def _reset_data() -> None:
    data_dir = Path.cwd() / ".orchestrate_data"
    if data_dir.exists():
        shutil.rmtree(data_dir)
    clear_all_caches()


def test_node_and_edge_crud_flow() -> None:
    _reset_data()
    client = TestClient(create_app())

    epic = client.post(
        "/api/nodes/Epic",
        json={"data": {"title": "Epic A", "description": "desc", "status": "todo", "priority": 3, "feature_id": "FEAT-1", "tags": []}},
    ).json()

    issue_one = client.post(
        "/api/nodes/Issue",
        json={"data": {"title": "Issue A", "description": "desc", "status": "todo", "priority": 2, "epic_id": epic["epic_id"], "sort_order": 1}},
    ).json()
    issue_two = client.post(
        "/api/nodes/Issue",
        json={"data": {"title": "Issue B", "description": "desc", "status": "todo", "priority": 2, "epic_id": epic["epic_id"], "sort_order": 2}},
    ).json()

    dep = client.post(
        "/api/edges/DEPENDS_ON",
        json={"data": {"src_id": issue_two["issue_id"], "dst_id": issue_one["issue_id"], "dependency_type": "technical", "lag_days": 0, "reason": "test"}},
    )
    assert dep.status_code == 200

    listed = client.get("/api/nodes/Issue").json()
    assert listed["total"] == 2

    search = client.post("/api/search", json={"query": "Issue", "top_k": 5}).json()
    assert search["count"] >= 2

    bottlenecks = client.get("/api/analyze/bottlenecks").json()
    assert bottlenecks["count"] >= 1


def test_settings_endpoints() -> None:
    _reset_data()
    client = TestClient(create_app())

    create_resp = client.post("/api/settings/teams", json={"data": {"name": "Core Team", "capacity_points": 40, "lead_name": "Lead"}})
    assert create_resp.status_code == 200

    teams = client.get("/api/settings/teams")
    assert teams.status_code == 200
    assert teams.json()["count"] == 1
