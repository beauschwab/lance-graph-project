from __future__ import annotations

from lance_graph_project.schema_registry import SchemaRegistry


class SchemaService:
    def __init__(self, registry: SchemaRegistry | None = None) -> None:
        self.registry = registry or SchemaRegistry()

    def get_schema(self) -> dict:
        return self.registry.as_dict()
