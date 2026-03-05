from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
import json


class ProjectStore:
    def __init__(self, project_root: Path) -> None:
        self.project_root = project_root
        self.nodes_dir = project_root / "nodes"
        self.edges_dir = project_root / "edges"
        self.backups_dir = project_root / "backups"
        self.exports_dir = project_root / "exports"
        self.meta_path = project_root / "project.meta.json"

    @classmethod
    def init_project(cls, project_root: Path, name: str) -> "ProjectStore":
        store = cls(project_root)
        store._create_layout(name=name)
        return store

    @classmethod
    def load_project(cls, project_root: Path) -> "ProjectStore":
        store = cls(project_root)
        if not store.meta_path.exists():
            raise FileNotFoundError(f"Missing metadata file: {store.meta_path}")
        return store

    def _create_layout(self, name: str) -> None:
        self.project_root.mkdir(parents=True, exist_ok=True)
        self.nodes_dir.mkdir(parents=True, exist_ok=True)
        self.edges_dir.mkdir(parents=True, exist_ok=True)
        self.backups_dir.mkdir(parents=True, exist_ok=True)
        self.exports_dir.mkdir(parents=True, exist_ok=True)

        metadata = {
            "name": name,
            "created_at": datetime.now(UTC).isoformat(),
            "version": "0.1.0",
        }
        self.meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    def get_node_dataset_path(self, node_label: str) -> Path:
        return self.nodes_dir / f"{node_label}.lance"

    def get_edge_dataset_path(self, relationship_type: str) -> Path:
        return self.edges_dir / f"{relationship_type}.lance"
