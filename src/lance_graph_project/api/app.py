from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
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

    # --- Serve bundled frontend when the static/ directory exists ----------
    if STATIC_DIR.is_dir():
        # Mount static assets (JS/CSS/images) under /assets
        assets_dir = STATIC_DIR / "assets"
        if assets_dir.is_dir():
            app.mount(
                "/assets",
                StaticFiles(directory=str(assets_dir)),
                name="assets",
            )

        @app.exception_handler(404)
        async def _spa_fallback(request: Request, _exc: Exception) -> FileResponse | JSONResponse:
            """Return index.html for non-API routes (SPA client-side routing)."""
            if request.url.path.startswith("/api"):
                return JSONResponse({"detail": "Not Found"}, status_code=404)
            index = STATIC_DIR / "index.html"
            if index.exists():
                return FileResponse(str(index))
            return JSONResponse({"detail": "Not Found"}, status_code=404)

    return app


app = create_app()
