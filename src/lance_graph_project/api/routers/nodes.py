from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from lance_graph_project.api.schemas import NodeUpsertRequest, ReorderRequest, TagPatchRequest
from lance_graph_project.services.container import get_node_service

router = APIRouter(prefix="/api/nodes", tags=["nodes"])


@router.get("/{node_type}")
def list_nodes(
    node_type: str,
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    sort: str | None = None,
) -> dict:
    service = get_node_service()
    result = service.list_nodes(node_type=node_type, limit=limit, offset=offset, sort=sort)
    return {"items": result.items, "total": result.total}


@router.post("/{node_type}")
def create_node(node_type: str, request: NodeUpsertRequest) -> dict:
    service = get_node_service()
    try:
        return service.create_node(node_type=node_type, payload=request.data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{node_type}/{node_id}")
def get_node(node_type: str, node_id: str) -> dict:
    service = get_node_service()
    node = service.get_node(node_type=node_type, node_id=node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.put("/{node_type}/{node_id}")
def update_node(node_type: str, node_id: str, request: NodeUpsertRequest) -> dict:
    service = get_node_service()
    try:
        return service.update_node(node_type=node_type, node_id=node_id, updates=request.data)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{node_type}/{node_id}")
def delete_node(node_type: str, node_id: str) -> dict:
    service = get_node_service()
    try:
        return service.delete_node(node_type=node_type, node_id=node_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{node_type}/reorder")
def reorder_nodes(node_type: str, request: ReorderRequest) -> dict:
    service = get_node_service()
    updated = service.reorder_nodes(node_type=node_type, order=request.items)
    return {"items": updated, "count": len(updated)}


@router.patch("/{node_type}/{node_id}/tags")
def patch_tags(node_type: str, node_id: str, request: TagPatchRequest) -> dict:
    service = get_node_service()
    try:
        return service.patch_tags(node_type=node_type, node_id=node_id, add_tags=request.add_tags, remove_tags=request.remove_tags)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/{node_type}/reschedule")
def reschedule_nodes(node_type: str, anchor_id: str, delta_days: int) -> dict:
    service = get_node_service()
    node = service.get_node(node_type=node_type, node_id=anchor_id)
    if not node:
        raise HTTPException(status_code=404, detail="Anchor node not found")
    node = service.update_node(node_type=node_type, node_id=anchor_id, updates={"reschedule_delta_days": delta_days})
    return {"anchor": node, "delta_days": delta_days}
