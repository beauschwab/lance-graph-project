from __future__ import annotations

from functools import lru_cache

from lance_graph_project.services.analysis_service import AnalysisService
from lance_graph_project.services.edge_service import EdgeService
from lance_graph_project.services.import_export_service import ImportExportService
from lance_graph_project.services.node_service import NodeService
from lance_graph_project.services.query_service import QueryService
from lance_graph_project.services.repository import JsonGraphRepository
from lance_graph_project.services.schema_service import SchemaService
from lance_graph_project.services.search_service import SearchService
from lance_graph_project.services.settings_service import SettingsService


@lru_cache(maxsize=1)
def get_repository() -> JsonGraphRepository:
    return JsonGraphRepository()


@lru_cache(maxsize=1)
def get_node_service() -> NodeService:
    return NodeService(repo=get_repository())


@lru_cache(maxsize=1)
def get_edge_service() -> EdgeService:
    return EdgeService(repo=get_repository())


@lru_cache(maxsize=1)
def get_query_service() -> QueryService:
    return QueryService(repo=get_repository())


@lru_cache(maxsize=1)
def get_search_service() -> SearchService:
    return SearchService(repo=get_repository())


@lru_cache(maxsize=1)
def get_analysis_service() -> AnalysisService:
    return AnalysisService(repo=get_repository())


@lru_cache(maxsize=1)
def get_settings_service() -> SettingsService:
    return SettingsService(node_service=get_node_service())


@lru_cache(maxsize=1)
def get_schema_service() -> SchemaService:
    return SchemaService()


@lru_cache(maxsize=1)
def get_import_export_service() -> ImportExportService:
    return ImportExportService(repo=get_repository(), node_service=get_node_service(), edge_service=get_edge_service())


def clear_all_caches() -> None:
    """Clear all service caches.  Useful for test isolation."""
    for fn in (
        get_repository,
        get_node_service,
        get_edge_service,
        get_query_service,
        get_search_service,
        get_analysis_service,
        get_settings_service,
        get_schema_service,
        get_import_export_service,
    ):
        fn.cache_clear()
