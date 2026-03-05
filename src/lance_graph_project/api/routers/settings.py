from __future__ import annotations

from fastapi import APIRouter, HTTPException

from lance_graph_project.api.schemas import NodeUpsertRequest
from lance_graph_project.services.container import get_node_service, get_settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/teams")
def list_teams() -> dict:
    items = get_settings_service().list_teams()
    return {"items": items, "count": len(items)}


@router.post("/teams")
def create_team(request: NodeUpsertRequest) -> dict:
    return get_node_service().create_node("Team", request.data)


@router.put("/teams/{team_id}")
def update_team(team_id: str, request: NodeUpsertRequest) -> dict:
    return get_node_service().update_node("Team", team_id, request.data)


@router.get("/people")
def list_people() -> dict:
    items = get_settings_service().list_people()
    return {"items": items, "count": len(items)}


@router.get("/applications")
def list_applications() -> dict:
    items = get_settings_service().list_applications()
    return {"items": items, "count": len(items)}


@router.get("/statuses")
def list_statuses() -> dict:
    items = get_settings_service().list_statuses()
    return {"items": items, "count": len(items)}


@router.get("/priorities")
def list_priorities() -> dict:
    items = get_settings_service().list_priorities()
    return {"items": items, "count": len(items)}


@router.get("/tags")
def list_tags() -> dict:
    items = get_settings_service().list_tags()
    return {"items": items, "count": len(items)}


@router.put("/{entity}/{entity_id}")
def update_entity(entity: str, entity_id: str, request: NodeUpsertRequest) -> dict:
    mapping = {
        "teams": "Team",
        "people": "Person",
        "applications": "Application",
        "statuses": "StatusConfig",
        "priorities": "PriorityConfig",
        "tags": "Tag",
    }
    node_type = mapping.get(entity)
    if not node_type:
        raise HTTPException(status_code=400, detail="Unknown settings entity")
    return get_node_service().update_node(node_type=node_type, node_id=entity_id, updates=request.data)
