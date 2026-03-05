from __future__ import annotations

from fastapi import APIRouter

from lance_graph_project.api.schemas import QueryRequest, SearchRequest
from lance_graph_project.services.container import get_query_service, get_search_service

router = APIRouter(prefix="/api", tags=["query"])


@router.post("/query")
def run_query(request: QueryRequest) -> dict:
    result = get_query_service().execute_cypher(cypher=request.cypher, params=request.params)
    return {"items": result, "count": len(result)}


@router.post("/search")
def run_search(request: SearchRequest) -> dict:
    results = get_search_service().hybrid_search(
        query_text=request.query,
        cypher_scope=request.scope_workstream or request.scope_milestone,
        top_k=request.top_k,
    )
    return {"items": results, "count": len(results)}
