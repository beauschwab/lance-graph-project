from __future__ import annotations

from fastapi import APIRouter

from lance_graph_project.services.container import get_edge_service, get_node_service

router = APIRouter(prefix="/api/views", tags=["views"])


@router.get("/kanban")
def kanban_view(group_by: str = "status", workstream: str | None = None) -> dict:
    filters = {"workstream_id": workstream} if workstream else None
    issues = get_node_service().list_nodes("Issue", filters=filters).items
    columns: dict[str, list[dict]] = {}
    for issue in issues:
        key = str(issue.get(group_by, "unknown"))
        columns.setdefault(key, []).append(issue)
    return {"group_by": group_by, "columns": columns}


@router.get("/gantt")
def gantt_view(milestone: str | None = None) -> dict:
    tasks = get_node_service().list_nodes("Issue").items
    dependencies = get_edge_service().list_edges("DEPENDS_ON")
    milestones = get_node_service().list_nodes("Milestone").items
    if milestone:
        milestones = [row for row in milestones if row["milestone_id"] == milestone]
    return {"tasks": tasks, "dependencies": dependencies, "milestones": milestones}


@router.get("/table")
def table_view(type: str = "Issue") -> dict:
    items = get_node_service().list_nodes(type).items
    return {"type": type, "items": items, "count": len(items)}
