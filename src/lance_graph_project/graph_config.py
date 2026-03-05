from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from lance_graph import GraphConfig

_PKG_DIR = Path(__file__).resolve().parent

# Look for schema.yaml inside the package first (wheel installs),
# then fall back to the repository root (editable / source installs).
if (_PKG_DIR / "schema.yaml").exists():
    SCHEMA_PATH = _PKG_DIR / "schema.yaml"
else:
    SCHEMA_PATH = _PKG_DIR.parents[1] / "schema.yaml"


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
