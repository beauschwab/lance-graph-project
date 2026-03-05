from __future__ import annotations

from typing import Any

from lance_graph_project.services.lance_adapter import LanceGraphAdapter
from lance_graph_project.services.repository import JsonGraphRepository


class QueryService:
    def __init__(self, repo: JsonGraphRepository) -> None:
        self.repo = repo
        self.lance = LanceGraphAdapter(repo)

    def execute_cypher(self, cypher: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        if self.lance.is_available:
            try:
                return self.lance.execute_cypher(cypher=cypher, params=params).rows
            except Exception as exc:
                # Keep service responsive if native backend errors at runtime.
                return [{"message": "lance_graph execution failed, using fallback", "error": str(exc), "query": cypher}]

        lowered = cypher.lower().strip()
        if lowered.startswith("match") and "return" in lowered:
            return [{"message": "Cypher parser placeholder", "query": cypher, "params": params or {}}]
        if lowered == "snapshot":
            return [self.repo.raw_snapshot()]
        return [{"message": "Unsupported query pattern", "query": cypher}]
