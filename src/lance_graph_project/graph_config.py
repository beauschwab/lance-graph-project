from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from lance_graph import GraphConfig


def _find_schema() -> Path:
    """Return the path to schema.yaml.

    Looks inside the package directory first (installed wheel), then falls
    back to the repository root (development checkout).
    """
    pkg_dir = Path(__file__).resolve().parent
    # Installed wheel: schema.yaml copied into the package by hatch_build.py
    bundled = pkg_dir / "schema.yaml"
    if bundled.exists():
        return bundled
    # Development: schema.yaml sits at the repository root
    repo_root = pkg_dir.parents[1]
    return repo_root / "schema.yaml"


SCHEMA_PATH = _find_schema()


def load_schema(schema_path: Path = SCHEMA_PATH) -> dict:
    import yaml

    with schema_path.open("r", encoding="utf-8") as handle:
        return yaml.safe_load(handle)


def build_graph_config(schema_path: Path = SCHEMA_PATH) -> "GraphConfig":
    from lance_graph import GraphConfig

    schema = load_schema(schema_path)

    builder = GraphConfig.builder()

    for node_name, node_spec in schema["nodes"].items():
        builder = builder.with_node_label(node_name, node_spec["primary_key"])

    for rel_name, rel_spec in schema["relationships"].items():
        builder = builder.with_relationship(rel_name, rel_spec["src"], rel_spec["dst"])

    return builder.build()
