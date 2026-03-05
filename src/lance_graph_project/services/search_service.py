from __future__ import annotations

from typing import Any

from lance_graph_project.services.lance_adapter import LanceGraphAdapter
from lance_graph_project.services.repository import JsonGraphRepository


class SearchService:
    def __init__(self, repo: JsonGraphRepository) -> None:
        self.repo = repo
        self.lance = LanceGraphAdapter(repo)

    def semantic_search(
        self,
        query_text: str,
        node_types: list[str] | None = None,
        top_k: int = 10,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        if self.lance.is_available:
            try:
                return self.lance.search_text(
                    query_text=query_text,
                    node_types=node_types,
                    top_k=top_k,
                    filters=filters,
                ).rows
            except Exception:
                # Fall through to JSON repository search when native search fails.
                pass

        results = self.repo.search_nodes(query=query_text, node_types=node_types, limit=top_k * 3)
        if not filters:
            return results[:top_k]

        filtered: list[dict[str, Any]] = []
        for row in results:
            keep = True
            for key, value in filters.items():
                if value is None:
                    continue
                if row.get(key) != value:
                    keep = False
                    break
            if keep:
                filtered.append(row)
        return filtered[:top_k]

    def hybrid_search(self, query_text: str, cypher_scope: str | None = None, top_k: int = 10) -> list[dict[str, Any]]:
        results = self.semantic_search(query_text=query_text, top_k=top_k)
        for row in results:
            row["scope"] = cypher_scope
        return results
