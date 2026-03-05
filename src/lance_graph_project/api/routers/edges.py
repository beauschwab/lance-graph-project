from __future__ import annotations

from fastapi import APIRouter, HTTPException

from lance_graph_project.api.schemas import EdgeCreateRequest
from lance_graph_project.services.container import get_edge_service

router = APIRouter(prefix="/api/edges", tags=["edges"])


@router.post("/{edge_type}")
def create_edge(edge_type: str, request: EdgeCreateRequest) -> dict:
    service = get_edge_service()
    try:
        return service.create_edge(edge_type=edge_type, payload=request.data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{edge_type}")
def list_edges(edge_type: str, src_id: str | None = None, dst_id: str | None = None) -> dict:
    service = get_edge_service()
    items = service.list_edges(edge_type=edge_type, src_id=src_id, dst_id=dst_id)
    return {"items": items, "count": len(items)}


@router.delete("/{edge_type}/{src_id}/{dst_id}")
def delete_edge(edge_type: str, src_id: str, dst_id: str) -> dict:
    service = get_edge_service()
    deleted = service.delete_edge(edge_type=edge_type, src_id=src_id, dst_id=dst_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Edge not found")
    return {"deleted": True}
