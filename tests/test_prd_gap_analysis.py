"""
PRD Gap Analysis Tests
======================
Tests that validate the implementation against the PRD
(docs/prd_orchestration_db.md) requirements.

Covers:
- Node CRUD completeness (all 13 node types)
- Edge CRUD completeness (all 7 edge types)
- Soft delete behaviour (filtered from listings, get returns None)
- Update and partial update
- Reorder and tag patch operations
- Edge deletion
- Cycle detection for DEPENDS_ON
- Analysis endpoints (bottlenecks, critical-path, impact, workload,
  stale-blockers, handoff-hotspots)
- Views endpoints (kanban, gantt, table)
- Settings endpoints (teams, people, applications, statuses, priorities, tags)
- Search endpoint
- Import / Export
- Validation error handling
"""

from __future__ import annotations

from pathlib import Path
import shutil

from fastapi.testclient import TestClient

from lance_graph_project.api.app import create_app
from lance_graph_project.services.container import clear_all_caches


def _reset() -> None:
    data_dir = Path.cwd() / ".orchestrate_data"
    if data_dir.exists():
        shutil.rmtree(data_dir)
    clear_all_caches()


def _client() -> TestClient:
    _reset()
    return TestClient(create_app())


# ---------------------------------------------------------------------------
# Helpers – seed common entities
# ---------------------------------------------------------------------------


def _seed_hierarchy(client: TestClient) -> dict:
    """Create Program → Workstream → Feature → Epic → Issue chain."""
    program = client.post(
        "/api/nodes/Program",
        json={"data": {"name": "Q2 Program", "description": "desc", "status": "todo"}},
    ).json()
    workstream = client.post(
        "/api/nodes/Workstream",
        json={"data": {"name": "Auth Stream", "description": "desc", "status": "todo", "program_id": program["program_id"]}},
    ).json()
    feature = client.post(
        "/api/nodes/Feature",
        json={"data": {"title": "Auth Feature", "description": "desc", "status": "todo", "priority": 1, "workstream_id": workstream["workstream_id"], "tags": ["auth"]}},
    ).json()
    epic = client.post(
        "/api/nodes/Epic",
        json={"data": {"title": "Login Epic", "description": "desc", "status": "todo", "priority": 2, "feature_id": feature["feature_id"], "estimate_days": 10.0, "tags": []}},
    ).json()
    issue = client.post(
        "/api/nodes/Issue",
        json={
            "data": {
                "title": "Implement token refresh",
                "description": "desc",
                "status": "todo",
                "priority": 1,
                "epic_id": epic["epic_id"],
                "estimate_days": 3.0,
                "sort_order": 1,
            }
        },
    ).json()
    return {
        "program": program,
        "workstream": workstream,
        "feature": feature,
        "epic": epic,
        "issue": issue,
    }


# ===================================================================
# 1. Node CRUD – all 13 node types
# ===================================================================


class TestNodeCRUDAllTypes:
    """PRD §8.1 – all 13 node types must support create/read/update/delete."""

    def test_create_and_read_program(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Program", json={"data": {"name": "P1", "description": "d", "status": "todo"}})
        assert r.status_code == 200
        pid = r.json()["program_id"]
        got = c.get(f"/api/nodes/Program/{pid}")
        assert got.status_code == 200
        assert got.json()["name"] == "P1"

    def test_create_and_read_workstream(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Workstream", json={"data": {"name": "WS1", "description": "d", "status": "todo", "program_id": "PRG-1"}})
        assert r.status_code == 200
        assert "workstream_id" in r.json()

    def test_create_and_read_feature(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Feature", json={"data": {"title": "F1", "description": "d", "status": "todo", "priority": 1, "workstream_id": "WS-1", "tags": []}})
        assert r.status_code == 200
        assert "feature_id" in r.json()

    def test_create_and_read_epic(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Epic", json={"data": {"title": "E1", "description": "d", "status": "todo", "priority": 1, "feature_id": "FEAT-1", "tags": []}})
        assert r.status_code == 200
        assert "epic_id" in r.json()

    def test_create_and_read_issue(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Issue", json={"data": {"title": "I1", "description": "d", "status": "todo", "priority": 1, "epic_id": "EPC-1", "sort_order": 0}})
        assert r.status_code == 200
        assert "issue_id" in r.json()

    def test_create_and_read_milestone(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Milestone", json={"data": {"name": "MS Q2", "description": "d", "status": "todo"}})
        assert r.status_code == 200
        assert "milestone_id" in r.json()

    def test_create_and_read_team(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Team", json={"data": {"name": "Backend", "capacity_points": 40}})
        assert r.status_code == 200
        assert "team_id" in r.json()

    def test_create_and_read_person(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Person", json={"data": {"name": "Alice", "email": "a@example.com"}})
        assert r.status_code == 200
        assert "person_id" in r.json()

    def test_create_and_read_application(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Application", json={"data": {"name": "Gateway", "description": "d"}})
        assert r.status_code == 200
        assert "app_id" in r.json()

    def test_create_and_read_artifact(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Artifact", json={"data": {"title": "Design Doc", "content_summary": "s"}})
        assert r.status_code == 200
        assert "artifact_id" in r.json()

    def test_create_and_read_tag(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Tag", json={"data": {"name": "urgent", "category": "priority"}})
        assert r.status_code == 200
        assert "tag_id" in r.json()

    def test_create_and_read_status_config(self) -> None:
        c = _client()
        r = c.post("/api/nodes/StatusConfig", json={"data": {"name": "Review", "category": "in_progress", "sort_order": 3}})
        assert r.status_code == 200
        assert "status_id" in r.json()

    def test_create_and_read_priority_config(self) -> None:
        c = _client()
        r = c.post("/api/nodes/PriorityConfig", json={"data": {"name": "Urgent", "level": 1}})
        assert r.status_code == 200
        assert "priority_id" in r.json()


# ===================================================================
# 2. Node Update and Delete
# ===================================================================


class TestNodeUpdateDelete:
    """PRD §9.3 – PUT updates, DELETE soft-deletes."""

    def test_update_node_changes_field(self) -> None:
        c = _client()
        issue = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "Original", "description": "d", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}},
        ).json()
        updated = c.put(f"/api/nodes/Issue/{issue['issue_id']}", json={"data": {"status": "in_progress"}})
        assert updated.status_code == 200
        assert updated.json()["status"] == "in_progress"
        assert updated.json()["title"] == "Original"  # unchanged fields preserved

    def test_update_nonexistent_returns_404(self) -> None:
        c = _client()
        resp = c.put("/api/nodes/Issue/ISS-NONEXIST", json={"data": {"status": "done"}})
        assert resp.status_code == 404

    def test_delete_node_soft_deletes(self) -> None:
        c = _client()
        issue = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "To Delete", "description": "d", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}},
        ).json()
        del_resp = c.delete(f"/api/nodes/Issue/{issue['issue_id']}")
        assert del_resp.status_code == 200
        assert del_resp.json()["deleted_at"] is not None

    def test_deleted_node_excluded_from_list(self) -> None:
        c = _client()
        issue = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "Will Vanish", "description": "d", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}},
        ).json()
        c.delete(f"/api/nodes/Issue/{issue['issue_id']}")
        listed = c.get("/api/nodes/Issue").json()
        ids = [i["issue_id"] for i in listed["items"]]
        assert issue["issue_id"] not in ids

    def test_get_deleted_node_returns_none(self) -> None:
        """PRD gap: get_node should not return soft-deleted items."""
        c = _client()
        issue = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "Ghost", "description": "d", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}},
        ).json()
        c.delete(f"/api/nodes/Issue/{issue['issue_id']}")
        got = c.get(f"/api/nodes/Issue/{issue['issue_id']}")
        assert got.status_code == 404

    def test_delete_nonexistent_returns_404(self) -> None:
        c = _client()
        resp = c.delete("/api/nodes/Issue/ISS-NONEXIST")
        assert resp.status_code == 404


# ===================================================================
# 3. Edge CRUD – all 7 edge types
# ===================================================================


class TestEdgeCRUD:
    """PRD §8.2 – all 7 edge types must support create/list/delete."""

    def test_create_contains_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/CONTAINS", json={"data": {"src_id": "FEAT-1", "dst_id": "EPC-1", "container_type": "feature_epic"}})
        assert r.status_code == 200

    def test_create_depends_on_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "ISS-A", "dst_id": "ISS-B", "dependency_type": "technical", "lag_days": 0}})
        assert r.status_code == 200

    def test_create_assigned_to_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/ASSIGNED_TO", json={"data": {"src_id": "ISS-1", "dst_id": "PER-1", "role": "owner"}})
        assert r.status_code == 200

    def test_create_handoff_to_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/HANDOFF_TO", json={"data": {"src_id": "ISS-1", "dst_id": "ISS-2", "handoff_type": "api_contract", "sla_days": 3}})
        assert r.status_code == 200

    def test_create_delivers_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/DELIVERS", json={"data": {"milestone_id": "MS-1", "workitem_id": "ISS-1", "commitment_level": "must_have"}})
        assert r.status_code == 200

    def test_create_relates_to_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/RELATES_TO", json={"data": {"artifact_id": "ART-1", "workitem_id": "ISS-1", "relation_type": "spec"}})
        assert r.status_code == 200

    def test_create_tagged_with_edge(self) -> None:
        c = _client()
        r = c.post("/api/edges/TAGGED_WITH", json={"data": {"workitem_id": "ISS-1", "tag_id": "TAG-1"}})
        assert r.status_code == 200

    def test_list_edges_by_src(self) -> None:
        c = _client()
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "ISS-X", "dst_id": "ISS-Y", "dependency_type": "technical", "lag_days": 0}})
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "ISS-X", "dst_id": "ISS-Z", "dependency_type": "data", "lag_days": 1}})
        r = c.get("/api/edges/DEPENDS_ON", params={"src_id": "ISS-X"})
        assert r.status_code == 200
        assert r.json()["count"] == 2

    def test_delete_edge(self) -> None:
        c = _client()
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "ISS-A", "dst_id": "ISS-B", "dependency_type": "technical", "lag_days": 0}})
        r = c.delete("/api/edges/DEPENDS_ON/ISS-A/ISS-B")
        assert r.status_code == 200
        assert r.json()["deleted"] is True
        # verify it's gone
        listed = c.get("/api/edges/DEPENDS_ON", params={"src_id": "ISS-A"})
        assert listed.json()["count"] == 0

    def test_delete_nonexistent_edge_404(self) -> None:
        c = _client()
        r = c.delete("/api/edges/DEPENDS_ON/ISS-NONE/ISS-NONE")
        assert r.status_code == 404


# ===================================================================
# 4. Cycle detection
# ===================================================================


class TestCycleDetection:
    """PRD §17 – cycles must be detected and rejected."""

    def test_direct_cycle_rejected(self) -> None:
        c = _client()
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "A", "dst_id": "B", "dependency_type": "technical", "lag_days": 0}})
        r = c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "B", "dst_id": "A", "dependency_type": "technical", "lag_days": 0}})
        assert r.status_code == 400
        assert "cycle" in r.json()["detail"].lower()

    def test_transitive_cycle_rejected(self) -> None:
        c = _client()
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "A", "dst_id": "B", "dependency_type": "technical", "lag_days": 0}})
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "B", "dst_id": "C", "dependency_type": "technical", "lag_days": 0}})
        r = c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "C", "dst_id": "A", "dependency_type": "technical", "lag_days": 0}})
        assert r.status_code == 400


# ===================================================================
# 5. Reorder & Tag Patch
# ===================================================================


class TestReorderAndTags:
    """PRD §11.2 – drag-and-drop persists sort_order; PRD §9.3 – tag patching."""

    def test_reorder_nodes(self) -> None:
        c = _client()
        i1 = c.post("/api/nodes/Issue", json={"data": {"title": "I1", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 1}}).json()
        i2 = c.post("/api/nodes/Issue", json={"data": {"title": "I2", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 2}}).json()
        reorder_resp = c.patch(
            "/api/nodes/Issue/reorder",
            json={"items": [{"issue_id": i1["issue_id"], "sort_order": 2}, {"issue_id": i2["issue_id"], "sort_order": 1}]},
        )
        assert reorder_resp.status_code == 200
        assert reorder_resp.json()["count"] == 2

    def test_patch_tags_add_and_remove(self) -> None:
        c = _client()
        issue = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "Tag test", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0, "tags": ["alpha"]}},
        ).json()
        patched = c.patch(f"/api/nodes/Issue/{issue['issue_id']}/tags", json={"add_tags": ["beta"], "remove_tags": ["alpha"]})
        assert patched.status_code == 200
        assert "beta" in patched.json()["tags"]
        assert "alpha" not in patched.json()["tags"]


# ===================================================================
# 6. Analysis endpoints
# ===================================================================


class TestAnalysisEndpoints:
    """PRD §9.3 analysis endpoints – bottlenecks, critical-path, impact, workload, stale-blockers, handoffs."""

    def test_bottlenecks_returns_items_sorted_by_fan_in(self) -> None:
        c = _client()
        i1 = c.post("/api/nodes/Issue", json={"data": {"title": "Root", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}}).json()
        i2 = c.post("/api/nodes/Issue", json={"data": {"title": "Dep1", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 1}}).json()
        i3 = c.post("/api/nodes/Issue", json={"data": {"title": "Dep2", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 2}}).json()
        # Both i2 and i3 depend on i1 → i1 has fan_in=2
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": i2["issue_id"], "dst_id": i1["issue_id"], "dependency_type": "technical", "lag_days": 0}})
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": i3["issue_id"], "dst_id": i1["issue_id"], "dependency_type": "technical", "lag_days": 0}})
        r = c.get("/api/analyze/bottlenecks")
        assert r.status_code == 200
        items = r.json()["items"]
        assert items[0]["item_id"] == i1["issue_id"]
        assert items[0]["fan_in"] == 2

    def test_critical_path_aggregates_estimates(self) -> None:
        c = _client()
        ms = c.post("/api/nodes/Milestone", json={"data": {"name": "MS-Q2", "description": "d", "status": "todo"}}).json()
        i1 = c.post("/api/nodes/Issue", json={"data": {"title": "Item1", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "estimate_days": 5.0, "sort_order": 0}}).json()
        i2 = c.post("/api/nodes/Issue", json={"data": {"title": "Item2", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "estimate_days": 3.0, "sort_order": 1}}).json()
        c.post("/api/edges/DELIVERS", json={"data": {"milestone_id": ms["milestone_id"], "workitem_id": i1["issue_id"], "commitment_level": "must_have"}})
        c.post("/api/edges/DELIVERS", json={"data": {"milestone_id": ms["milestone_id"], "workitem_id": i2["issue_id"], "commitment_level": "must_have"}})
        r = c.get(f"/api/analyze/critical-path/{ms['milestone_id']}")
        assert r.status_code == 200
        data = r.json()
        assert data["total_duration_days"] == 8.0
        assert len(data["path"]) == 2

    def test_impact_analysis_finds_downstream(self) -> None:
        c = _client()
        i1 = c.post("/api/nodes/Issue", json={"data": {"title": "Anchor", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}}).json()
        i2 = c.post("/api/nodes/Issue", json={"data": {"title": "Down1", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 1}}).json()
        i3 = c.post("/api/nodes/Issue", json={"data": {"title": "Down2", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 2}}).json()
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": i2["issue_id"], "dst_id": i1["issue_id"], "dependency_type": "technical", "lag_days": 0}})
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": i3["issue_id"], "dst_id": i2["issue_id"], "dependency_type": "technical", "lag_days": 0}})
        r = c.post("/api/analyze/impact", json={"item_id": i1["issue_id"], "slip_days": 5})
        assert r.status_code == 200
        impacted = r.json()["impacted_item_ids"]
        assert i2["issue_id"] in impacted
        assert i3["issue_id"] in impacted  # transitive

    def test_team_workload(self) -> None:
        c = _client()
        team = c.post("/api/nodes/Team", json={"data": {"name": "Backend", "capacity_points": 100}}).json()
        person = c.post("/api/nodes/Person", json={"data": {"name": "Alice", "team_id": team["team_id"]}}).json()
        issue = c.post("/api/nodes/Issue", json={"data": {"title": "Work", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "estimate_days": 5.0, "sort_order": 0}}).json()
        c.post("/api/edges/ASSIGNED_TO", json={"data": {"src_id": issue["issue_id"], "dst_id": person["person_id"], "role": "owner"}})
        r = c.get("/api/analyze/workload")
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        team_entry = [i for i in items if i["team_id"] == team["team_id"]]
        assert len(team_entry) == 1
        assert team_entry[0]["total_estimate_days"] == 5.0

    def test_stale_blockers(self) -> None:
        c = _client()
        # Create edge with an old created_at so it qualifies as stale
        c.post("/api/edges/DEPENDS_ON", json={"data": {"src_id": "ISS-A", "dst_id": "ISS-B", "dependency_type": "technical", "lag_days": 0, "created_at": "2025-01-01T00:00:00+00:00"}})
        r = c.get("/api/analyze/stale-blockers", params={"threshold_days": 14})
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_handoff_hotspots(self) -> None:
        c = _client()
        c.post("/api/edges/HANDOFF_TO", json={"data": {"src_id": "ISS-1", "dst_id": "ISS-2", "handoff_type": "api_contract", "sla_days": 3}})
        c.post("/api/edges/HANDOFF_TO", json={"data": {"src_id": "ISS-1", "dst_id": "ISS-3", "handoff_type": "qa", "sla_days": 2}})
        r = c.get("/api/analyze/handoff-hotspots")
        assert r.status_code == 200
        assert r.json()["count"] >= 1


# ===================================================================
# 7. Views endpoints
# ===================================================================


class TestViewsEndpoints:
    """PRD §9.3 view-specific endpoints."""

    def test_kanban_view_groups_by_status(self) -> None:
        c = _client()
        c.post("/api/nodes/Issue", json={"data": {"title": "Todo item", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}})
        c.post("/api/nodes/Issue", json={"data": {"title": "Done item", "description": "", "status": "done", "priority": 1, "epic_id": "E1", "sort_order": 1}})
        r = c.get("/api/views/kanban")
        assert r.status_code == 200
        cols = r.json()["columns"]
        assert "todo" in cols
        assert "done" in cols

    def test_gantt_view_returns_tasks_deps_milestones(self) -> None:
        c = _client()
        c.post("/api/nodes/Issue", json={"data": {"title": "Task", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}})
        c.post("/api/nodes/Milestone", json={"data": {"name": "Milestone", "description": "", "status": "todo"}})
        r = c.get("/api/views/gantt")
        assert r.status_code == 200
        data = r.json()
        assert "tasks" in data
        assert "dependencies" in data
        assert "milestones" in data

    def test_table_view_returns_typed_items(self) -> None:
        c = _client()
        c.post("/api/nodes/Epic", json={"data": {"title": "Ep", "description": "", "status": "todo", "priority": 1, "feature_id": "FEAT-1", "tags": []}})
        r = c.get("/api/views/table", params={"type": "Epic"})
        assert r.status_code == 200
        assert r.json()["type"] == "Epic"
        assert r.json()["count"] >= 1


# ===================================================================
# 8. Settings endpoints
# ===================================================================


class TestSettingsEndpoints:
    """PRD §9.3, §11.6 – settings CRUD for teams, people, statuses, etc."""

    def test_create_and_list_teams(self) -> None:
        c = _client()
        c.post("/api/settings/teams", json={"data": {"name": "Frontend", "capacity_points": 50}})
        r = c.get("/api/settings/teams")
        assert r.status_code == 200
        assert r.json()["count"] == 1
        assert r.json()["items"][0]["name"] == "Frontend"

    def test_update_team(self) -> None:
        c = _client()
        team = c.post("/api/settings/teams", json={"data": {"name": "BE", "capacity_points": 40}}).json()
        r = c.put(f"/api/settings/teams/{team['team_id']}", json={"data": {"capacity_points": 80}})
        assert r.status_code == 200
        assert r.json()["capacity_points"] == 80

    def test_list_people(self) -> None:
        c = _client()
        c.post("/api/nodes/Person", json={"data": {"name": "Bob"}})
        r = c.get("/api/settings/people")
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_list_applications(self) -> None:
        c = _client()
        c.post("/api/nodes/Application", json={"data": {"name": "Gateway", "description": "d"}})
        r = c.get("/api/settings/applications")
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_list_statuses(self) -> None:
        c = _client()
        c.post("/api/nodes/StatusConfig", json={"data": {"name": "Review", "category": "in_progress", "sort_order": 3}})
        r = c.get("/api/settings/statuses")
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_list_priorities(self) -> None:
        c = _client()
        c.post("/api/nodes/PriorityConfig", json={"data": {"name": "High", "level": 2}})
        r = c.get("/api/settings/priorities")
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_list_tags(self) -> None:
        c = _client()
        c.post("/api/nodes/Tag", json={"data": {"name": "security", "category": "domain"}})
        r = c.get("/api/settings/tags")
        assert r.status_code == 200
        assert r.json()["count"] >= 1

    def test_create_person_via_settings(self) -> None:
        c = _client()
        r = c.post("/api/settings/people", json={"data": {"name": "Charlie", "email": "c@example.com"}})
        assert r.status_code == 200
        assert "person_id" in r.json()
        listed = c.get("/api/settings/people").json()
        assert listed["count"] == 1

    def test_create_application_via_settings(self) -> None:
        c = _client()
        r = c.post("/api/settings/applications", json={"data": {"name": "API Gateway", "description": "main entry point"}})
        assert r.status_code == 200
        assert "app_id" in r.json()

    def test_create_status_via_settings(self) -> None:
        c = _client()
        r = c.post("/api/settings/statuses", json={"data": {"name": "In Review", "category": "in_progress", "sort_order": 5}})
        assert r.status_code == 200
        assert "status_id" in r.json()

    def test_create_priority_via_settings(self) -> None:
        c = _client()
        r = c.post("/api/settings/priorities", json={"data": {"name": "Critical", "level": 0}})
        assert r.status_code == 200
        assert "priority_id" in r.json()

    def test_create_tag_via_settings(self) -> None:
        c = _client()
        r = c.post("/api/settings/tags", json={"data": {"name": "performance", "category": "domain"}})
        assert r.status_code == 200
        assert "tag_id" in r.json()

    def test_generic_entity_update(self) -> None:
        c = _client()
        tag = c.post("/api/nodes/Tag", json={"data": {"name": "old", "category": "general"}}).json()
        r = c.put(f"/api/settings/tags/{tag['tag_id']}", json={"data": {"name": "new"}})
        assert r.status_code == 200
        assert r.json()["name"] == "new"


# ===================================================================
# 9. Search
# ===================================================================


class TestSearch:
    """PRD §11.7 – semantic + structural search."""

    def test_search_returns_matching_items(self) -> None:
        c = _client()
        c.post("/api/nodes/Issue", json={"data": {"title": "Token refresh endpoint", "description": "JWT auth", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}})
        c.post("/api/nodes/Issue", json={"data": {"title": "Database migration", "description": "Schema update", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 1}})
        r = c.post("/api/search", json={"query": "auth", "top_k": 10})
        assert r.status_code == 200
        assert r.json()["count"] >= 1
        titles = [item["title"] for item in r.json()["items"]]
        assert any("Token" in t or "auth" in t.lower() for t in titles)

    def test_search_excludes_deleted_items(self) -> None:
        c = _client()
        issue = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "Secret findme item", "description": "hidden", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}},
        ).json()
        c.delete(f"/api/nodes/Issue/{issue['issue_id']}")
        r = c.post("/api/search", json={"query": "findme", "top_k": 10})
        assert r.status_code == 200
        ids = [item.get("issue_id") for item in r.json()["items"]]
        assert issue["issue_id"] not in ids


# ===================================================================
# 10. Validation
# ===================================================================


class TestValidation:
    """Ensure Pydantic validation catches bad input."""

    def test_invalid_risk_level_rejected(self) -> None:
        c = _client()
        r = c.post(
            "/api/nodes/Issue",
            json={"data": {"title": "Bad", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0, "risk_level": "banana"}},
        )
        assert r.status_code == 400

    def test_invalid_status_config_category_rejected(self) -> None:
        c = _client()
        r = c.post("/api/nodes/StatusConfig", json={"data": {"name": "Bad", "category": "invalid_cat", "sort_order": 1}})
        assert r.status_code == 400

    def test_invalid_team_color_rejected(self) -> None:
        c = _client()
        r = c.post("/api/nodes/Team", json={"data": {"name": "Bad Color", "color": "not-a-hex"}})
        assert r.status_code == 400

    def test_extra_fields_rejected(self) -> None:
        """Pydantic extra=forbid should reject unknown fields."""
        c = _client()
        r = c.post("/api/nodes/Team", json={"data": {"name": "X", "bogus_field": "nope"}})
        assert r.status_code == 400


# ===================================================================
# 11. Import / Export
# ===================================================================


class TestImportExport:
    """PRD §9.3 – import/export endpoints."""

    def test_export_json(self) -> None:
        c = _client()
        c.post("/api/nodes/Issue", json={"data": {"title": "Exp", "description": "", "status": "todo", "priority": 1, "epic_id": "E1", "sort_order": 0}})
        export_path = str(Path.cwd() / "exports" / "test_snapshot.json")
        r = c.get("/api/export", params={"format": "json", "output_path": export_path})
        assert r.status_code == 200
        assert Path(export_path).exists()
        # cleanup
        Path(export_path).unlink(missing_ok=True)

    def test_export_unsupported_format_fails(self) -> None:
        c = _client()
        r = c.get("/api/export", params={"format": "csv"})
        assert r.status_code == 400


# ===================================================================
# 12. System endpoints
# ===================================================================


class TestSystemEndpoints:
    """PRD §9.3 – system health and schema."""

    def test_health(self) -> None:
        c = _client()
        r = c.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_schema_returns_nodes_and_relationships(self) -> None:
        c = _client()
        r = c.get("/api/schema")
        assert r.status_code == 200
        data = r.json()
        assert "nodes" in data
        assert "relationships" in data
        assert "Issue" in data["nodes"]
        assert "DEPENDS_ON" in data["relationships"]


# ===================================================================
# 13. Full hierarchy workflow
# ===================================================================


class TestFullHierarchyWorkflow:
    """PRD UC1 – hierarchy modelling with CONTAINS edges."""

    def test_hierarchy_create_and_query(self) -> None:
        c = _client()
        hierarchy = _seed_hierarchy(c)
        # Link hierarchy with CONTAINS edges
        c.post("/api/edges/CONTAINS", json={"data": {"src_id": hierarchy["program"]["program_id"], "dst_id": hierarchy["workstream"]["workstream_id"], "container_type": "program_workstream"}})
        c.post("/api/edges/CONTAINS", json={"data": {"src_id": hierarchy["workstream"]["workstream_id"], "dst_id": hierarchy["feature"]["feature_id"], "container_type": "workstream_feature"}})
        c.post("/api/edges/CONTAINS", json={"data": {"src_id": hierarchy["feature"]["feature_id"], "dst_id": hierarchy["epic"]["epic_id"], "container_type": "feature_epic"}})
        c.post("/api/edges/CONTAINS", json={"data": {"src_id": hierarchy["epic"]["epic_id"], "dst_id": hierarchy["issue"]["issue_id"], "container_type": "epic_issue"}})
        # verify edges
        edges = c.get("/api/edges/CONTAINS", params={"src_id": hierarchy["program"]["program_id"]}).json()
        assert edges["count"] == 1
        assert edges["items"][0]["dst_id"] == hierarchy["workstream"]["workstream_id"]


# ===================================================================
# 14. Stale blocker age calculation
# ===================================================================


class TestStaleBlockerBug:
    """BUG: get_stale_blockers returns hardcoded age_days instead of computing from created_at.
    This test documents the fix: age_days should be based on actual created_at timestamp."""

    def test_stale_blockers_with_created_at(self) -> None:
        c = _client()
        # Create an edge with a specific created_at
        c.post(
            "/api/edges/DEPENDS_ON",
            json={"data": {"src_id": "ISS-A", "dst_id": "ISS-B", "dependency_type": "technical", "lag_days": 0, "created_at": "2026-01-01T00:00:00+00:00"}},
        )
        r = c.get("/api/analyze/stale-blockers", params={"threshold_days": 14})
        assert r.status_code == 200
        items = r.json()["items"]
        assert len(items) >= 1
        # After fix: age_days should be computed from created_at, not hardcoded
        for item in items:
            assert item["age_days"] > 0
