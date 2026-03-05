from __future__ import annotations

from dataclasses import dataclass
import importlib.util
import re
from typing import Any

from lance_graph_project.graph_config import build_graph_config
from lance_graph_project.services.repository import JsonGraphRepository


@dataclass
class LanceExecutionResult:
    rows: list[dict[str, Any]]
    backend: str


class LanceGraphAdapter:
    """Best-effort lance-graph adapter.

    The adapter is intentionally defensive so the app can run without native
    dependencies and switch to real lance-graph execution when they become
    available.
    """

    def __init__(self, repo: JsonGraphRepository) -> None:
        self.repo = repo

    @property
    def is_available(self) -> bool:
        return bool(importlib.util.find_spec("lance_graph") and importlib.util.find_spec("pyarrow"))

    def execute_cypher(self, cypher: str, params: dict[str, Any] | None = None) -> LanceExecutionResult:
        if not self.is_available:
            raise RuntimeError("lance_graph runtime is unavailable")

        from lance_graph import CypherQuery

        datasets = self._build_datasets()
        if not datasets:
            return LanceExecutionResult(rows=[], backend="lance_graph")

        query_text = self._render_query_params(cypher, params)
        query_obj = CypherQuery(query_text)
        if hasattr(query_obj, "with_config"):
            query_obj = query_obj.with_config(build_graph_config())

        result = query_obj.execute(datasets)
        return LanceExecutionResult(rows=self._result_to_rows(result), backend="lance_graph")

    def search_text(
        self,
        query_text: str,
        node_types: list[str] | None,
        top_k: int,
        filters: dict[str, Any] | None = None,
    ) -> LanceExecutionResult:
        if not self.is_available:
            raise RuntimeError("lance_graph runtime is unavailable")

        from lance_graph import SqlQuery

        datasets = self._build_datasets()
        labels = node_types or sorted(self.repo.registry.node_names)
        lowered = query_text.lower().replace("'", "''")
        rows: list[dict[str, Any]] = []

        for label in labels:
            table = datasets.get(label)
            if table is None:
                continue

            available_cols = set(table.column_names)
            text_cols = [name for name in ("title", "name", "description", "content_summary") if name in available_cols]
            if not text_cols:
                continue

            # DataFusion SQL supports LOWER + LIKE and CAST.
            where_clause = " OR ".join(
                f"LOWER(CAST(\"{col}\" AS STRING)) LIKE '%{lowered}%'" for col in text_cols
            )
            sql = f'SELECT *, \'{label}\' AS node_type FROM "{label}" WHERE {where_clause} LIMIT {top_k}'
            result = SqlQuery(sql).execute(datasets)
            rows.extend(self._result_to_rows(result))

        if filters:
            filtered: list[dict[str, Any]] = []
            for row in rows:
                keep = True
                for key, value in filters.items():
                    if value is None:
                        continue
                    if row.get(key) != value:
                        keep = False
                        break
                if keep:
                    filtered.append(row)
            rows = filtered

        scored = []
        for row in rows:
            text = " ".join(str(row.get(field, "")) for field in ("title", "name", "description", "content_summary")).lower()
            score = text.count(query_text.lower())
            scored.append({**row, "score": score})

        scored.sort(key=lambda item: item.get("score", 0), reverse=True)
        return LanceExecutionResult(rows=scored[:top_k], backend="lance_graph")

    def _build_datasets(self) -> dict[str, Any]:
        import pyarrow as pa

        snapshot = self.repo.raw_snapshot()
        datasets: dict[str, Any] = {}

        for node_type, node_map in snapshot.get("nodes", {}).items():
            rows = [row for row in node_map.values() if row.get("deleted_at") is None]
            if rows:
                datasets[node_type] = pa.Table.from_pylist(rows)

        for edge_type, edge_map in snapshot.get("edges", {}).items():
            rows = list(edge_map.values())
            if rows:
                datasets[edge_type] = pa.Table.from_pylist(rows)

        return datasets

    def _result_to_rows(self, result: Any) -> list[dict[str, Any]]:
        if hasattr(result, "to_pylist"):
            return list(result.to_pylist())
        if isinstance(result, list):
            return result
        return [dict(result)] if isinstance(result, dict) else [{"value": result}]

    def _render_query_params(self, cypher: str, params: dict[str, Any] | None) -> str:
        if not params:
            return cypher

        rendered = cypher
        for key, value in params.items():
            rendered = rendered.replace(f"${key}", self._to_cypher_literal(value))
        return rendered

    def _to_cypher_literal(self, value: Any) -> str:
        if value is None:
            return "NULL"
        if isinstance(value, bool):
            return "true" if value else "false"
        if isinstance(value, (int, float)):
            return str(value)
        if isinstance(value, str):
            safe = value.replace("'", "\\'")
            return f"'{safe}'"
        if isinstance(value, list):
            return "[" + ", ".join(self._to_cypher_literal(item) for item in value) + "]"
        # Keep fallback literal conversion explicit and predictable.
        return self._to_cypher_literal(str(value))
