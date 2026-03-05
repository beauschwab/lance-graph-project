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


def test_end_to_end_workflow_create_update_link_analyze_search_query() -> None:
    _reset_data()
    client = TestClient(create_app())

    epic = client.post(
        "/api/nodes/Epic",
        json={"data": {"title": "Epic Flow", "description": "desc", "status": "todo", "priority": 2, "feature_id": "FEAT-1", "tags": []}},
    ).json()

    issue_a = client.post(
        "/api/nodes/Issue",
        json={"data": {"title": "Auth token backend", "description": "Implement auth", "status": "todo", "priority": 1, "epic_id": epic["epic_id"], "sort_order": 1}},
    ).json()
    issue_b = client.post(
        "/api/nodes/Issue",
        json={"data": {"title": "UI login form", "description": "Consume auth API", "status": "todo", "priority": 2, "epic_id": epic["epic_id"], "sort_order": 2}},
    ).json()

    update_resp = client.put(
        f"/api/nodes/Issue/{issue_b['issue_id']}",
        json={"data": {"status": "in_progress", "title": "UI login form v2"}},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"

    link_resp = client.post(
        "/api/edges/DEPENDS_ON",
        json={"data": {"src_id": issue_b["issue_id"], "dst_id": issue_a["issue_id"], "dependency_type": "technical", "lag_days": 0, "reason": "needs auth"}},
    )
    assert link_resp.status_code == 200

    search_resp = client.post("/api/search", json={"query": "auth", "top_k": 10})
    assert search_resp.status_code == 200
    assert search_resp.json()["count"] >= 1

    impact_resp = client.post("/api/analyze/impact", json={"item_id": issue_a["issue_id"], "slip_days": 3})
    assert impact_resp.status_code == 200
    assert issue_b["issue_id"] in impact_resp.json()["impacted_item_ids"]

    query_resp = client.post("/api/query", json={"cypher": "snapshot", "params": {}})
    assert query_resp.status_code == 200
    assert query_resp.json()["count"] == 1
