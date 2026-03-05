from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from lance_graph_project.graph_config import SCHEMA_PATH, load_schema


@dataclass(frozen=True)
class NodeSchema:
    name: str
    primary_key: str
    fields: dict[str, str]


@dataclass(frozen=True)
class RelationshipSchema:
    name: str
    src: str
    dst: str
    fields: dict[str, str]


class SchemaRegistry:
    def __init__(self, schema_path: Path = SCHEMA_PATH) -> None:
        raw = load_schema(schema_path)
        self._nodes: dict[str, NodeSchema] = {
            name: NodeSchema(
                name=name,
                primary_key=spec["primary_key"],
                fields=spec.get("fields", {}),
            )
            for name, spec in raw["nodes"].items()
        }
        self._relationships: dict[str, RelationshipSchema] = {
            name: RelationshipSchema(
                name=name,
                src=spec["src"],
                dst=spec["dst"],
                fields=spec.get("fields", {}),
            )
            for name, spec in raw["relationships"].items()
        }

    @property
    def node_names(self) -> set[str]:
        return set(self._nodes)

    @property
    def relationship_names(self) -> set[str]:
        return set(self._relationships)

    def get_node(self, name: str) -> NodeSchema:
        if name not in self._nodes:
            raise KeyError(f"Unknown node type: {name}")
        return self._nodes[name]

    def get_relationship(self, name: str) -> RelationshipSchema:
        if name not in self._relationships:
            raise KeyError(f"Unknown relationship type: {name}")
        return self._relationships[name]

    def as_dict(self) -> dict:
        return {
            "nodes": {
                name: {
                    "primary_key": node.primary_key,
                    "fields": node.fields,
                }
                for name, node in self._nodes.items()
            },
            "relationships": {
                name: {
                    "src": rel.src,
                    "dst": rel.dst,
                    "fields": rel.fields,
                }
                for name, rel in self._relationships.items()
            },
        }
