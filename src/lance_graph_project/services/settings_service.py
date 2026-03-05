from __future__ import annotations

from lance_graph_project.services.node_service import NodeService


class SettingsService:
    def __init__(self, node_service: NodeService) -> None:
        self.node_service = node_service

    def list_teams(self) -> list[dict]:
        return self.node_service.list_nodes("Team").items

    def list_people(self) -> list[dict]:
        return self.node_service.list_nodes("Person").items

    def list_applications(self) -> list[dict]:
        return self.node_service.list_nodes("Application").items

    def list_statuses(self) -> list[dict]:
        return self.node_service.list_nodes("StatusConfig", sort="sort_order").items

    def list_priorities(self) -> list[dict]:
        return self.node_service.list_nodes("PriorityConfig", sort="level").items

    def list_tags(self) -> list[dict]:
        return self.node_service.list_nodes("Tag").items
