from __future__ import annotations

from fastapi import APIRouter

from lance_graph_project.api.schemas import ImpactRequest
from lance_graph_project.services.container import get_analysis_service

router = APIRouter(prefix="/api/analyze", tags=["analysis"])


@router.get("/bottlenecks")
def get_bottlenecks(workstream: str | None = None, top_k: int = 10) -> dict:
    items = get_analysis_service().get_bottlenecks(workstream=workstream, top_k=top_k)
    return {"items": items, "count": len(items)}


@router.get("/critical-path/{milestone_id}")
def get_critical_path(milestone_id: str) -> dict:
    return get_analysis_service().get_critical_path(milestone_id=milestone_id)


@router.post("/impact")
def run_impact_analysis(request: ImpactRequest) -> dict:
    return get_analysis_service().run_impact_analysis(item_id=request.item_id, slip_days=request.slip_days)


@router.get("/workload")
def get_workload(team: str | None = None) -> dict:
    items = get_analysis_service().get_team_workload(team_id=team)
    return {"items": items, "count": len(items)}


@router.get("/handoff-hotspots")
def get_handoff_hotspots() -> dict:
    items = get_analysis_service().get_handoff_hotspots()
    return {"items": items, "count": len(items)}


@router.get("/stale-blockers")
def get_stale_blockers(threshold_days: int = 14) -> dict:
    items = get_analysis_service().get_stale_blockers(threshold_days=threshold_days)
    return {"items": items, "count": len(items)}
