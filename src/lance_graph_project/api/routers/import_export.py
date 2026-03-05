from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from lance_graph_project.api.schemas import ImportRequest
from lance_graph_project.services.container import get_import_export_service

router = APIRouter(prefix="/api", tags=["import-export"])


@router.post("/import")
def import_data(request: ImportRequest) -> dict:
    service = get_import_export_service()
    path = Path(request.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Import file not found")

    if request.format == "json":
        return service.import_json(path)
    if request.format == "csv":
        if not request.node_type:
            raise HTTPException(status_code=400, detail="node_type required for csv import")
        return service.import_csv(path, request.node_type)
    raise HTTPException(status_code=400, detail="Unsupported import format")


@router.get("/export")
def export_data(format: str = "json", output_path: str | None = None) -> dict:
    if format != "json":
        raise HTTPException(status_code=400, detail="Only json export is currently supported")

    service = get_import_export_service()
    path = Path(output_path) if output_path else (Path.cwd() / "exports" / "snapshot.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    exported = service.export_json(path)
    return {"path": str(exported)}
