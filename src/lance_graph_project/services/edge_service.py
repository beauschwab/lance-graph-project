from __future__ import annotations

from typing import Any

from lance_graph_project.services.repository import JsonGraphRepository


class EdgeService:
    def __init__(self, repo: JsonGraphRepository) -> None:
        self.repo = repo

    def _would_create_cycle(self, src_id: str, dst_id: str) -> bool:
        adjacency: dict[str, list[str]] = {}
        for edge in self.repo.list_edges("DEPENDS_ON"):
            adjacency.setdefault(edge["src_id"], []).append(edge["dst_id"])

        adjacency.setdefault(src_id, []).append(dst_id)
        target = src_id
        stack = [dst_id]
        seen: set[str] = set()

        while stack:
            node = stack.pop()
            if node == target:
                return True
            if node in seen:
                continue
            seen.add(node)
            stack.extend(adjacency.get(node, []))
        return False

    def create_edge(self, edge_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        if edge_type == "DEPENDS_ON" and self._would_create_cycle(payload["src_id"], payload["dst_id"]):
            raise ValueError("DEPENDS_ON edge creates a cycle")
        return self.repo.create_edge(edge_type=edge_type, payload=payload)

    def list_edges(self, edge_type: str, src_id: str | None = None, dst_id: str | None = None) -> list[dict[str, Any]]:
        return self.repo.list_edges(edge_type=edge_type, src_id=src_id, dst_id=dst_id)

    def delete_edge(self, edge_type: str, src_id: str, dst_id: str) -> bool:
        return self.repo.delete_edge(edge_type=edge_type, src_id=src_id, dst_id=dst_id)
