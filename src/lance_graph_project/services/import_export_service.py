from __future__ import annotations

from pathlib import Path
from typing import Any
import csv
import json

from lance_graph_project.services.edge_service import EdgeService
from lance_graph_project.services.node_service import NodeService
from lance_graph_project.services.repository import JsonGraphRepository


class ImportExportService:
    def __init__(self, repo: JsonGraphRepository, node_service: NodeService, edge_service: EdgeService) -> None:
        self.repo = repo
        self.node_service = node_service
        self.edge_service = edge_service

    def import_json(self, file_path: Path) -> dict[str, Any]:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        imported = {"nodes": 0, "edges": 0}
        for node_type, rows in payload.get("nodes", {}).items():
            for row in rows:
                self.node_service.create_node(node_type=node_type, payload=row)
                imported["nodes"] += 1
        for edge_type, rows in payload.get("edges", {}).items():
            for row in rows:
                self.edge_service.create_edge(edge_type=edge_type, payload=row)
                imported["edges"] += 1
        return imported

    def import_csv(self, file_path: Path, node_type: str) -> dict[str, Any]:
        with file_path.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            count = 0
            for row in reader:
                self.node_service.create_node(node_type=node_type, payload=dict(row))
                count += 1
        return {"nodes": count}

    def export_json(self, output_path: Path) -> Path:
        output_path.write_text(json.dumps(self.repo.raw_snapshot(), indent=2), encoding="utf-8")
        return output_path
