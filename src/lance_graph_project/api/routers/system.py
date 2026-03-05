from __future__ import annotations

from fastapi import APIRouter

from lance_graph_project.services.container import get_query_service, get_schema_service

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
def health() -> dict[str, object]:
    lance_enabled = get_query_service().lance.is_available
    return {
        "status": "ok",
        "query_backend": "lance_graph" if lance_enabled else "json_fallback",
        "lance_graph_enabled": lance_enabled,
    }


@router.get("/schema")
def get_schema() -> dict:
    return get_schema_service().get_schema()
