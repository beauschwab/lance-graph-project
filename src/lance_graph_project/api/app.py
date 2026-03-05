from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from lance_graph_project.api.routers.analysis import router as analysis_router
from lance_graph_project.api.routers.edges import router as edges_router
from lance_graph_project.api.routers.import_export import router as import_export_router
from lance_graph_project.api.routers.nodes import router as nodes_router
from lance_graph_project.api.routers.query import router as query_router
from lance_graph_project.api.routers.settings import router as settings_router
from lance_graph_project.api.routers.system import router as system_router
from lance_graph_project.api.routers.views import router as views_router

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


def _spa_not_found_handler(static_dir: Path):
    """Return a handler that serves index.html for non-API 404s (SPA routing)."""
    index = static_dir / "index.html"

    async def handler(request: Request, _exc: Exception) -> FileResponse:
        if request.url.path.startswith("/api"):
            from fastapi.responses import JSONResponse

            return JSONResponse({"detail": "Not Found"}, status_code=404)
        return FileResponse(index)

    return handler


def create_app() -> FastAPI:
    app = FastAPI(
        title="Lance Graph Orchestration API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.include_router(system_router)
    app.include_router(nodes_router)
    app.include_router(edges_router)
    app.include_router(query_router)
    app.include_router(analysis_router)
    app.include_router(settings_router)
    app.include_router(views_router)
    app.include_router(import_export_router)

    if STATIC_DIR.is_dir():
        app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static")
        app.exception_handler(404)(_spa_not_found_handler(STATIC_DIR))

    return app


app = create_app()
