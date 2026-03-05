from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
import json
import re
import uuid

from pydantic import BaseModel, ValidationError

from lance_graph_project.models import EDGE_MODELS, NODE_MODELS
from lance_graph_project.schema_registry import SchemaRegistry

ID_PREFIX: dict[str, str] = {
    "Program": "PRG",
    "Workstream": "WS",
    "Feature": "FEAT",
    "Epic": "EPC",
    "Issue": "ISS",
    "Milestone": "MS",
    "Team": "TEAM",
    "Person": "PER",
    "Application": "APP",
    "Artifact": "ART",
    "Tag": "TAG",
    "StatusConfig": "STAT",
    "PriorityConfig": "PRI",
}


@dataclass
class PagedResult:
    items: list[dict[str, Any]]
    total: int


class JsonGraphRepository:
    def __init__(self, data_root: Path | None = None) -> None:
        self.data_root = data_root or (Path.cwd() / ".orchestrate_data")
        self.data_root.mkdir(parents=True, exist_ok=True)
        self.registry = SchemaRegistry()
        self.nodes_path = self.data_root / "nodes.json"
        self.edges_path = self.data_root / "edges.json"
        self._nodes = self._load_json(self.nodes_path, default={})
        self._edges = self._load_json(self.edges_path, default={})

    def _load_json(self, path: Path, default: dict) -> dict:
        if not path.exists():
            return default
        return json.loads(path.read_text(encoding="utf-8"))

    def _persist(self) -> None:
        self.data_root.mkdir(parents=True, exist_ok=True)
        self.nodes_path.write_text(json.dumps(self._nodes, indent=2), encoding="utf-8")
        self.edges_path.write_text(json.dumps(self._edges, indent=2), encoding="utf-8")

    def _now(self) -> str:
        return datetime.now(UTC).isoformat()

    def _validate_node(self, node_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        model = NODE_MODELS[node_type]
        return self._validate_payload(model, payload)

    def _validate_edge(self, edge_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        model = EDGE_MODELS[edge_type]
        return self._validate_payload(model, payload)

    def _validate_payload(self, model: type[BaseModel], payload: dict[str, Any]) -> dict[str, Any]:
        try:
            return model(**payload).model_dump()
        except ValidationError as exc:
            raise ValueError(str(exc)) from exc

    def _pk_field(self, node_type: str) -> str:
        return self.registry.get_node(node_type).primary_key

    def _next_id(self, node_type: str) -> str:
        return f"{ID_PREFIX[node_type]}-{uuid.uuid4().hex[:10].upper()}"

    def list_nodes(
        self,
        node_type: str,
        filters: dict[str, Any] | None = None,
        sort: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> PagedResult:
        items = list(self._nodes.get(node_type, {}).values())
        items = [item for item in items if item.get("deleted_at") is None]

        if filters:
            for key, value in filters.items():
                if value is None:
                    continue
                items = [row for row in items if row.get(key) == value]

        if sort:
            reverse = sort.startswith("-")
            field = sort[1:] if reverse else sort
            items = sorted(items, key=lambda row: row.get(field), reverse=reverse)

        total = len(items)
        paged = items[offset : offset + limit]
        return PagedResult(items=paged, total=total)

    def _get_node_raw(self, node_type: str, node_id: str) -> dict[str, Any] | None:
        """Return the raw node dict including soft-deleted items."""
        return self._nodes.get(node_type, {}).get(node_id)

    def get_node(self, node_type: str, node_id: str) -> dict[str, Any] | None:
        node = self._get_node_raw(node_type, node_id)
        if node and node.get("deleted_at") is not None:
            return None
        return node

    def create_node(self, node_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        node_spec = self.registry.get_node(node_type)
        pk = node_spec.primary_key
        payload.setdefault(pk, self._next_id(node_type))
        payload.setdefault("created_at", self._now())
        payload.setdefault("updated_at", self._now())
        payload.setdefault("deleted_at", None)

        lifecycle_keys = {"created_at", "updated_at", "deleted_at"}
        model_fields = set(NODE_MODELS[node_type].model_fields) | lifecycle_keys
        unknown = set(payload) - model_fields
        if unknown:
            raise ValueError(f"Unknown fields for {node_type}: {sorted(unknown)}")

        validated = self._validate_node(node_type, {k: v for k, v in payload.items() if k in NODE_MODELS[node_type].model_fields})
        validated["created_at"] = payload["created_at"]
        validated["updated_at"] = payload["updated_at"]
        validated["deleted_at"] = payload["deleted_at"]

        node_id = validated[pk]
        self._nodes.setdefault(node_type, {})[node_id] = validated
        self._persist()
        return validated

    def update_node(self, node_type: str, node_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        existing = self.get_node(node_type, node_id)
        if not existing:
            raise KeyError(f"{node_type} {node_id} not found")

        merged = {**existing, **updates, "updated_at": self._now()}
        model_fields = set(NODE_MODELS[node_type].model_fields)
        validated = self._validate_node(node_type, {k: v for k, v in merged.items() if k in model_fields})
        validated["created_at"] = existing.get("created_at")
        validated["updated_at"] = merged["updated_at"]
        validated["deleted_at"] = merged.get("deleted_at")
        self._nodes[node_type][node_id] = validated
        self._persist()
        return validated

    def delete_node(self, node_type: str, node_id: str) -> dict[str, Any]:
        existing = self._get_node_raw(node_type, node_id)
        if not existing or existing.get("deleted_at") is not None:
            raise KeyError(f"{node_type} {node_id} not found")
        existing["deleted_at"] = self._now()
        existing["updated_at"] = self._now()
        self._nodes[node_type][node_id] = existing
        self._persist()
        return existing

    def reorder_nodes(self, node_type: str, order: list[dict[str, Any]]) -> list[dict[str, Any]]:
        pk = self._pk_field(node_type)
        updated: list[dict[str, Any]] = []
        for item in order:
            node_id = item[pk]
            row = self.get_node(node_type, node_id)
            if not row:
                continue
            row["sort_order"] = item["sort_order"]
            row["updated_at"] = self._now()
            self._nodes[node_type][node_id] = row
            updated.append(row)
        self._persist()
        return updated

    def patch_tags(self, node_type: str, node_id: str, add: list[str], remove: list[str]) -> dict[str, Any]:
        row = self.get_node(node_type, node_id)
        if not row:
            raise KeyError(f"{node_type} {node_id} not found")
        tags = set(row.get("tags", []))
        tags.update(add)
        tags.difference_update(remove)
        row["tags"] = sorted(tags)
        row["updated_at"] = self._now()
        self._nodes[node_type][node_id] = row
        self._persist()
        return row

    def _edge_key(self, edge_type: str, payload: dict[str, Any]) -> str:
        rel = self.registry.get_relationship(edge_type)
        return f"{payload[rel.src]}::{payload[rel.dst]}"

    def list_edges(self, edge_type: str, src_id: str | None = None, dst_id: str | None = None) -> list[dict[str, Any]]:
        rel = self.registry.get_relationship(edge_type)
        items = list(self._edges.get(edge_type, {}).values())
        if src_id:
            items = [item for item in items if item.get(rel.src) == src_id]
        if dst_id:
            items = [item for item in items if item.get(rel.dst) == dst_id]
        return items

    def create_edge(self, edge_type: str, payload: dict[str, Any]) -> dict[str, Any]:
        payload.setdefault("created_at", self._now())
        model_fields = set(EDGE_MODELS[edge_type].model_fields)
        validated = self._validate_edge(edge_type, {k: v for k, v in payload.items() if k in model_fields})
        key = self._edge_key(edge_type, validated)
        self._edges.setdefault(edge_type, {})[key] = validated
        self._persist()
        return validated

    def delete_edge(self, edge_type: str, src_id: str, dst_id: str) -> bool:
        rel = self.registry.get_relationship(edge_type)
        key = f"{src_id}::{dst_id}"
        bucket = self._edges.setdefault(edge_type, {})
        if key not in bucket:
            return False
        del bucket[key]
        self._persist()
        return True

    def search_nodes(self, query: str, node_types: list[str] | None = None, limit: int = 10) -> list[dict[str, Any]]:
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        target_types = node_types or list(self._nodes.keys())
        results: list[tuple[int, dict[str, Any]]] = []

        for node_type in target_types:
            for node in self._nodes.get(node_type, {}).values():
                if node.get("deleted_at"):
                    continue
                text_fields = " ".join(
                    str(node.get(field, ""))
                    for field in ("title", "name", "description", "content_summary")
                )
                if not pattern.search(text_fields):
                    continue
                score = text_fields.lower().count(query.lower())
                results.append((score, {**node, "node_type": node_type, "score": score}))

        ranked = [item for _, item in sorted(results, key=lambda it: it[0], reverse=True)]
        return ranked[:limit]

    def raw_snapshot(self) -> dict[str, Any]:
        return {"nodes": self._nodes, "edges": self._edges}
