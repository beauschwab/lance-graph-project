from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI

from lance_graph_project.api.routers.analysis import router as analysis_router
from lance_graph_project.api.routers.edges import router as edges_router
from lance_graph_project.api.routers.import_export import router as import_export_router
from lance_graph_project.api.routers.nodes import router as nodes_router
from lance_graph_project.api.routers.query import router as query_router
from lance_graph_project.api.routers.settings import router as settings_router
from lance_graph_project.api.routers.system import router as system_router
from lance_graph_project.api.routers.views import router as views_router


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
    return app


app = create_app()
