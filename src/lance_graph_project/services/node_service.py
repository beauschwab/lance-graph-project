from __future__ import annotations

from typing import Any

from lance_graph_project.services.repository import JsonGraphRepository, PagedResult


class NodeService:
    def __init__(self, repo: JsonGraphRepository) -> None:
        self.repo = repo

    def list_nodes(
        self,
        node_type: str,
        filters: dict[str, Any] | None = None,
        sort: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> PagedResult:
        return self.repo.list_nodes(node_type=node_type, filters=filters, sort=sort, offset=offset, limit=limit)

    def get_node(self, node_type: str, node_id: str) -> dict[str, Any] | None:
        return self.repo.get_node(node_type=node_type, node_id=node_id)

    def create_node(self, node_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self.repo.create_node(node_type=node_type, payload=payload)

    def update_node(self, node_type: str, node_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        return self.repo.update_node(node_type=node_type, node_id=node_id, updates=updates)

    def delete_node(self, node_type: str, node_id: str) -> dict[str, Any]:
        return self.repo.delete_node(node_type=node_type, node_id=node_id)

    def reorder_nodes(self, node_type: str, order: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return self.repo.reorder_nodes(node_type=node_type, order=order)

    def patch_tags(self, node_type: str, node_id: str, add_tags: list[str], remove_tags: list[str]) -> dict[str, Any]:
        return self.repo.patch_tags(node_type=node_type, node_id=node_id, add=add_tags, remove=remove_tags)
