from __future__ import annotations

from fastmcp import FastMCP

from lance_graph_project.services.container import (
    get_analysis_service,
    get_edge_service,
    get_node_service,
    get_query_service,
    get_schema_service,
    get_search_service,
    get_settings_service,
)

mcp = FastMCP(
    "Orchestration Graph",
    instructions=(
        "You are connected to a local orchestration graph. Use tools and resources "
        "to ground responses in real project data."
    ),
)


@mcp.tool(annotations={"readOnlyHint": True})
def search_items(query: str, scope_workstream: str | None = None, scope_milestone: str | None = None, top_k: int = 10) -> list[dict]:
    scope = scope_workstream or scope_milestone
    return get_search_service().hybrid_search(query_text=query, cypher_scope=scope, top_k=top_k)


@mcp.tool(annotations={"readOnlyHint": True})
def get_item(item_type: str, item_id: str) -> dict:
    return get_node_service().get_node(node_type=item_type, node_id=item_id) or {}


@mcp.tool(annotations={"readOnlyHint": True})
def get_dependencies(item_id: str, direction: str = "both", max_depth: int = 5) -> list[dict]:
    edges = get_edge_service().list_edges("DEPENDS_ON")
    if direction == "upstream":
        return [edge for edge in edges if edge["src_id"] == item_id]
    if direction == "downstream":
        return [edge for edge in edges if edge["dst_id"] == item_id]
    return [edge for edge in edges if item_id in (edge["src_id"], edge["dst_id"])]


@mcp.tool(annotations={"readOnlyHint": True})
def get_items_by_filter(item_type: str = "Issue", status: str | None = None, team: str | None = None, priority: int | None = None, workstream: str | None = None, tags: list[str] | None = None, limit: int = 50) -> list[dict]:
    filters = {"status": status, "priority": priority, "workstream_id": workstream}
    items = get_node_service().list_nodes(node_type=item_type, filters=filters, limit=limit).items
    if team:
        items = [row for row in items if row.get("team_id") == team]
    if tags:
        items = [row for row in items if any(tag in row.get("tags", []) for tag in tags)]
    return items


@mcp.tool(annotations={"readOnlyHint": True})
def run_cypher_query(cypher: str) -> list[dict]:
    return get_query_service().execute_cypher(cypher)


@mcp.tool(annotations={"readOnlyHint": True})
def get_bottlenecks(workstream: str | None = None, top_k: int = 10) -> list[dict]:
    return get_analysis_service().get_bottlenecks(workstream=workstream, top_k=top_k)


@mcp.tool(annotations={"readOnlyHint": True})
def get_critical_path(milestone_id: str) -> dict:
    return get_analysis_service().get_critical_path(milestone_id=milestone_id)


@mcp.tool(annotations={"readOnlyHint": True})
def run_impact_analysis(item_id: str, slip_days: int) -> dict:
    return get_analysis_service().run_impact_analysis(item_id=item_id, slip_days=slip_days)


@mcp.tool(annotations={"readOnlyHint": True})
def get_team_workload(team_id: str | None = None) -> list[dict]:
    return get_analysis_service().get_team_workload(team_id=team_id)


@mcp.tool(annotations={"readOnlyHint": True})
def get_stale_blockers(threshold_days: int = 14) -> list[dict]:
    return get_analysis_service().get_stale_blockers(threshold_days=threshold_days)


@mcp.tool(annotations={"readOnlyHint": True})
def get_handoff_hotspots() -> list[dict]:
    return get_analysis_service().get_handoff_hotspots()


@mcp.tool(annotations={"readOnlyHint": False})
def create_item(item_type: str, title: str, description: str = "", status: str = "todo", priority: int = 3, parent_id: str | None = None, assignee_id: str | None = None, team_id: str | None = None, start_date: str | None = None, target_date: str | None = None, estimate_days: float | None = None, tags: list[str] | None = None) -> dict:
    payload = {
        "title": title,
        "description": description,
        "status": status,
        "priority": priority,
        "start_date": start_date,
        "target_date": target_date,
        "estimate_days": estimate_days,
        "tags": tags or [],
        "team_id": team_id,
    }
    if item_type == "Issue":
        payload.setdefault("epic_id", parent_id or "EPC-UNSET")
    return get_node_service().create_node(node_type=item_type, payload=payload)


@mcp.tool(annotations={"readOnlyHint": False})
def update_item(item_type: str, item_id: str, updates: dict) -> dict:
    return get_node_service().update_node(node_type=item_type, node_id=item_id, updates=updates)


@mcp.tool(annotations={"readOnlyHint": False})
def link_dependency(src_id: str, dst_id: str, dependency_type: str = "technical", lag_days: int = 0, reason: str = "") -> dict:
    return get_edge_service().create_edge(
        edge_type="DEPENDS_ON",
        payload={"src_id": src_id, "dst_id": dst_id, "dependency_type": dependency_type, "lag_days": lag_days, "reason": reason},
    )


@mcp.tool(annotations={"readOnlyHint": False})
def remove_dependency(src_id: str, dst_id: str) -> dict:
    return {"deleted": get_edge_service().delete_edge(edge_type="DEPENDS_ON", src_id=src_id, dst_id=dst_id)}


@mcp.tool(annotations={"readOnlyHint": False})
def assign_item(item_id: str, person_id: str, role: str = "owner") -> dict:
    return get_edge_service().create_edge(edge_type="ASSIGNED_TO", payload={"src_id": item_id, "dst_id": person_id, "role": role})


@mcp.resource("project://schema")
def schema_resource() -> str:
    return str(get_schema_service().get_schema())


@mcp.resource("project://teams")
def teams_resource() -> str:
    return str(get_settings_service().list_teams())


@mcp.resource("project://milestones")
def milestones_resource() -> str:
    return str(get_node_service().list_nodes("Milestone").items)


@mcp.resource("project://stats")
def stats_resource() -> str:
    return str({"issues": len(get_node_service().list_nodes("Issue").items)})


@mcp.resource("project://settings/statuses")
def statuses_resource() -> str:
    return str(get_settings_service().list_statuses())


@mcp.resource("project://settings/priorities")
def priorities_resource() -> str:
    return str(get_settings_service().list_priorities())


@mcp.prompt()
def analyze_risk(milestone_id: str) -> str:
    return f"Analyze risk for {milestone_id} using get_critical_path, get_team_workload, get_stale_blockers, and get_handoff_hotspots."


@mcp.prompt()
def plan_sprint(team_id: str, capacity_days: float) -> str:
    return f"Plan sprint for {team_id} with {capacity_days} days using get_team_workload and get_items_by_filter."


@mcp.prompt()
def dependency_report(workstream_id: str) -> str:
    return f"Create dependency report for workstream {workstream_id} using run_cypher_query and get_handoff_hotspots."


if __name__ == "__main__":
    import sys

    transport = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    if transport == "http":
        mcp.run(transport="streamable-http", host="0.0.0.0", port=8001)
    else:
        mcp.run(transport="stdio")
